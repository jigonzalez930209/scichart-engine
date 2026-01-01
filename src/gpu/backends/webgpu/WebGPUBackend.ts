import type {
  BufferDescriptor,
  BufferId,
  GpuBackend,
  GpuBackendInfo,
  GpuViewport,
  Texture1DDescriptor,
  TextureId,
} from "../../types";
import type { DrawCall, DrawList, PointStyle, HeatmapStyle } from "../../drawList";
import type { FrameUniforms } from "../../frame";
import {
  createTrianglePipeline,
  type TrianglePipelineBundle,
} from "./pipelines/trianglePipeline";
import {
  createLinePipeline,
  updateLineUniforms,
  type LinePipelineBundle,
} from "./pipelines/linePipeline";
import {
  createPointPipeline,
  updatePointUniforms,
  SYMBOL_MAP,
  type PointPipelineBundle,
} from "./pipelines/pointPipeline";
import {
  createBandPipeline,
  updateBandUniforms,
  type BandPipelineBundle,
} from "./pipelines/bandPipeline";
import {
  createHeatmapPipeline,
  createHeatmapBindGroup,
  updateHeatmapUniforms,
  type HeatmapPipelineBundle,
} from "./pipelines/heatmapPipeline";

export interface WebGPUBackendOptions {
  powerPreference?: "low-power" | "high-performance";
  preferredFormat?: string;
}

/**
 * Calculate transform uniforms from bounds
 */
function calculateUniforms(bounds: {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}): { scale: [number, number]; translate: [number, number] } {
  const dataWidth = bounds.xMax - bounds.xMin;
  const dataHeight = bounds.yMax - bounds.yMin;

  const scaleX = dataWidth > 0 ? 2 / dataWidth : 1;
  const scaleY = dataHeight > 0 ? 2 / dataHeight : 1;

  const translateX = -1 - bounds.xMin * scaleX;
  const translateY = -1 - bounds.yMin * scaleY;

  return {
    scale: [scaleX, scaleY],
    translate: [translateX, translateY],
  };
}

/**
 * Parse color from style, returning RGBA values 0-1
 */
function getColorFromStyle(style: any): [number, number, number, number] {
  const color = style?.color ?? [1, 0, 0.3, 1];
  const opacity = style?.opacity ?? 1;
  
  // If color is already RGBA tuple
  if (Array.isArray(color)) {
    return [color[0], color[1], color[2], (color[3] ?? 1) * opacity];
  }
  
  return [1, 0, 0.3, opacity]; // Default magenta
}

export class WebGPUBackend implements GpuBackend {
  public readonly info: GpuBackendInfo;

  private canvas: HTMLCanvasElement;
  private opts: WebGPUBackendOptions;

  private viewport: GpuViewport | null = null;

  private adapter: any;
  private device: any;
  private context: any;
  private format: string | null = null;

  private buffers = new Map<string, any>();
  private textures = new Map<string, any>();

  // Pipelines for different draw types
  private trianglePipeline: TrianglePipelineBundle | null = null;
  private linePipeline: LinePipelineBundle | null = null;
  private pointPipeline: PointPipelineBundle | null = null;
  private bandPipeline: BandPipelineBundle | null = null;
  private heatmapPipeline: HeatmapPipelineBundle | null = null;

  // Heatmap bind groups (per texture)
  private heatmapBindGroups = new Map<string, any>();

  constructor(canvas: HTMLCanvasElement, opts: WebGPUBackendOptions = {}) {
    this.canvas = canvas;
    this.opts = opts;
    this.info = {
      type: "webgpu",
      available: WebGPUBackend.isSupported(),
    };
  }

  static isSupported(): boolean {
    return (
      typeof (globalThis as any).navigator !== "undefined" &&
      typeof (globalThis as any).navigator.gpu !== "undefined"
    );
  }

  async init(): Promise<void> {
    if (!this.info.available) {
      throw new Error("[gpu] WebGPU not supported");
    }

    const gpu = (globalThis as any).navigator.gpu;

    this.adapter = await gpu.requestAdapter({
      powerPreference: this.opts.powerPreference ?? "high-performance",
    });

    if (!this.adapter) {
      throw new Error("[gpu] Failed to request WebGPU adapter");
    }

    this.device = await this.adapter.requestDevice();

    const ctx = (this.canvas as any).getContext("webgpu");
    if (!ctx) {
      throw new Error("[gpu] Failed to get WebGPU canvas context");
    }

    this.context = ctx;

    const format =
      this.opts.preferredFormat ??
      (gpu.getPreferredCanvasFormat
        ? gpu.getPreferredCanvasFormat()
        : "bgra8unorm");

    this.format = format;

    this.context.configure({
      device: this.device,
      format,
      alphaMode: "premultiplied",
    });
  }

  setViewport(viewport: GpuViewport): void {
    this.viewport = viewport;
    const w = Math.max(1, Math.floor(viewport.width * viewport.dpr));
    const h = Math.max(1, Math.floor(viewport.height * viewport.dpr));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
  }

  createOrUpdateBuffer(
    id: BufferId,
    data: ArrayBufferView,
    desc?: Partial<BufferDescriptor>
  ): void {
    if (!this.device) {
      throw new Error("[gpu] WebGPUBackend not initialized");
    }

    const usage = desc?.usage ?? "vertex";
    const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;
    if (!GPUBufferUsageAny) {
      throw new Error(
        "[gpu] GPUBufferUsage not available (missing WebGPU runtime)"
      );
    }

    const usageFlags =
      usage === "index"
        ? GPUBufferUsageAny.INDEX | GPUBufferUsageAny.COPY_DST
        : usage === "uniform"
        ? GPUBufferUsageAny.UNIFORM | GPUBufferUsageAny.COPY_DST
        : GPUBufferUsageAny.VERTEX | GPUBufferUsageAny.COPY_DST;

    const byteLength = data.byteLength;

    let buf = this.buffers.get(id);
    if (!buf || buf.size < byteLength) {
      if (buf) {
        try {
          buf.destroy();
        } catch {}
      }
      buf = this.device.createBuffer({
        size: Math.max(4, byteLength),
        usage: usageFlags,
      });
      this.buffers.set(id, buf);
    }

    this.device.queue.writeBuffer(
      buf,
      0,
      data.buffer,
      data.byteOffset,
      data.byteLength
    );
  }

  deleteBuffer(id: BufferId): void {
    const buf = this.buffers.get(id);
    if (buf) {
      try {
        buf.destroy();
      } catch {}
      this.buffers.delete(id);
    }
  }

  createOrUpdateTexture1D(
    id: TextureId,
    data: Uint8Array,
    desc?: Partial<Texture1DDescriptor>
  ): void {
    if (!this.device) {
      throw new Error("[gpu] WebGPUBackend not initialized");
    }

    const width = desc?.width ?? Math.floor(data.length / 4);
    const format = desc?.format ?? "rgba8unorm";

    const GPUTextureUsageAny = (globalThis as any).GPUTextureUsage;
    if (!GPUTextureUsageAny) {
      throw new Error(
        "[gpu] GPUTextureUsage not available (missing WebGPU runtime)"
      );
    }

    let tex = this.textures.get(id);
    if (!tex) {
      tex = this.device.createTexture({
        size: { width, height: 1, depthOrArrayLayers: 1 },
        format,
        dimension: "1d",
        usage: GPUTextureUsageAny.TEXTURE_BINDING | GPUTextureUsageAny.COPY_DST,
      });
      this.textures.set(id, tex);
      
      // Invalidate heatmap bind group for this texture
      this.heatmapBindGroups.delete(id);
    }

    this.device.queue.writeTexture(
      { texture: tex },
      data,
      { bytesPerRow: width * 4 },
      { width, height: 1, depthOrArrayLayers: 1 }
    );
  }

  deleteTexture(id: TextureId): void {
    const tex = this.textures.get(id);
    if (tex) {
      try {
        tex.destroy();
      } catch {}
      this.textures.delete(id);
      this.heatmapBindGroups.delete(id);
    }
  }

  /**
   * Initialize all pipelines lazily
   */
  private ensurePipelines(): void {
    if (!this.trianglePipeline) {
      this.trianglePipeline = createTrianglePipeline(this.device, this.format!);
    }
    if (!this.linePipeline) {
      this.linePipeline = createLinePipeline(this.device, this.format!);
    }
    if (!this.pointPipeline) {
      this.pointPipeline = createPointPipeline(this.device, this.format!);
    }
    if (!this.bandPipeline) {
      this.bandPipeline = createBandPipeline(this.device, this.format!);
    }
    if (!this.heatmapPipeline) {
      this.heatmapPipeline = createHeatmapPipeline(this.device, this.format!);
    }
  }

  render(drawList: DrawList, frame: FrameUniforms): void {
    if (!this.device || !this.context || !this.format) {
      throw new Error("[gpu] WebGPUBackend not initialized");
    }

    if (!this.viewport) {
      this.setViewport(frame.viewport);
    }

    this.ensurePipelines();

    const encoder = this.device.createCommandEncoder();
    const view = this.context.getCurrentTexture().createView();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: {
            r: frame.clearColor[0],
            g: frame.clearColor[1],
            b: frame.clearColor[2],
            a: frame.clearColor[3],
          },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    // Default bounds (NDC if not specified)
    const defaultBounds = { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };

    for (const item of drawList.items) {
      if (!item.visible) continue;

      const buf = this.buffers.get(item.bufferId);
      if (!buf) continue;

      this.renderDrawCall(pass, item, buf, defaultBounds);
    }

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  /**
   * Render with explicit bounds (for integration with chart system)
   */
  renderWithBounds(
    drawList: DrawList,
    frame: FrameUniforms,
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
  ): void {
    if (!this.device || !this.context || !this.format) {
      throw new Error("[gpu] WebGPUBackend not initialized");
    }

    if (!this.viewport) {
      this.setViewport(frame.viewport);
    }

    this.ensurePipelines();

    const encoder = this.device.createCommandEncoder();
    const view = this.context.getCurrentTexture().createView();

    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: {
            r: frame.clearColor[0],
            g: frame.clearColor[1],
            b: frame.clearColor[2],
            a: frame.clearColor[3],
          },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    for (const item of drawList.items) {
      if (!item.visible) continue;

      const buf = this.buffers.get(item.bufferId);
      if (!buf) continue;

      // Use item's yBounds if specified, otherwise use global bounds
      const itemBounds = item.yBounds
        ? { ...bounds, yMin: item.yBounds.min, yMax: item.yBounds.max }
        : bounds;

      this.renderDrawCall(pass, item, buf, itemBounds);
    }

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  /**
   * Render a single draw call
   */
  private renderDrawCall(
    pass: any,
    item: DrawCall,
    buf: any,
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number }
  ): void {
    const uniforms = calculateUniforms(bounds);
    const color = getColorFromStyle(item.style);

    switch (item.kind) {
      case "triangles":
      case "bar":
        this.renderTriangles(pass, buf, item.count);
        break;

      case "line":
        this.renderLine(pass, buf, item.count, uniforms, color);
        break;

      case "scatter":
      case "points":
        this.renderPoints(pass, buf, item.count, uniforms, color, item.style as PointStyle);
        break;

      case "line+scatter":
        this.renderLine(pass, buf, item.count, uniforms, color);
        this.renderPoints(pass, buf, item.count, uniforms, color, item.style as PointStyle);
        break;

      case "step":
        // Use step buffer if available
        if (item.stepBufferId && item.stepCount) {
          const stepBuf = this.buffers.get(item.stepBufferId);
          if (stepBuf) {
            this.renderLine(pass, stepBuf, item.stepCount, uniforms, color);
          }
        } else {
          this.renderLine(pass, buf, item.count, uniforms, color);
        }
        break;

      case "step+scatter":
        if (item.stepBufferId && item.stepCount) {
          const stepBuf = this.buffers.get(item.stepBufferId);
          if (stepBuf) {
            this.renderLine(pass, stepBuf, item.stepCount, uniforms, color);
          }
        } else {
          this.renderLine(pass, buf, item.count, uniforms, color);
        }
        this.renderPoints(pass, buf, item.count, uniforms, color, item.style as PointStyle);
        break;

      case "band":
        // Band uses semi-transparent color
        const bandColor: [number, number, number, number] = [
          color[0],
          color[1],
          color[2],
          color[3] * 0.4,
        ];
        this.renderBand(pass, buf, item.count, uniforms, bandColor);
        break;

      case "heatmap":
        this.renderHeatmap(pass, buf, item.count, uniforms, item.style as HeatmapStyle, item.textureId);
        break;
    }
  }

  private renderTriangles(pass: any, buf: any, count: number): void {
    pass.setPipeline(this.trianglePipeline!.pipeline);
    pass.setVertexBuffer(0, buf);
    pass.draw(count);
  }

  private renderLine(
    pass: any,
    buf: any,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    updateLineUniforms(this.device, this.linePipeline!.uniformBuffer, {
      scale: uniforms.scale,
      translate: uniforms.translate,
      color,
    });
    pass.setPipeline(this.linePipeline!.pipeline);
    pass.setBindGroup(0, this.linePipeline!.bindGroup);
    pass.setVertexBuffer(0, buf);
    pass.draw(count);
  }

  private renderPoints(
    pass: any,
    buf: any,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number],
    style?: PointStyle
  ): void {
    const pointSize = (style?.pointSize ?? 4) * (this.viewport?.dpr ?? 1);
    const symbol = SYMBOL_MAP[style?.symbol ?? "circle"] ?? 0;
    const viewport: [number, number] = [
      this.canvas.width,
      this.canvas.height,
    ];

    updatePointUniforms(this.device, this.pointPipeline!.uniformBuffer, {
      scale: uniforms.scale,
      translate: uniforms.translate,
      color,
      pointSize,
      symbol,
      viewport,
    });

    pass.setPipeline(this.pointPipeline!.pipeline);
    pass.setBindGroup(0, this.pointPipeline!.bindGroup);
    pass.setVertexBuffer(0, buf); // Point positions (instanced)
    pass.setVertexBuffer(1, this.pointPipeline!.quadBuffer); // Quad vertices
    pass.draw(6, count); // 6 vertices per quad, count instances
  }

  private renderBand(
    pass: any,
    buf: any,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    color: [number, number, number, number]
  ): void {
    updateBandUniforms(this.device, this.bandPipeline!.uniformBuffer, {
      scale: uniforms.scale,
      translate: uniforms.translate,
      color,
    });
    pass.setPipeline(this.bandPipeline!.pipeline);
    pass.setBindGroup(0, this.bandPipeline!.bindGroup);
    pass.setVertexBuffer(0, buf);
    pass.draw(count);
  }

  private renderHeatmap(
    pass: any,
    buf: any,
    count: number,
    uniforms: { scale: [number, number]; translate: [number, number] },
    style?: HeatmapStyle,
    textureId?: string
  ): void {
    if (!textureId) return;
    
    const tex = this.textures.get(textureId);
    if (!tex) return;

    const zBounds = style?.zBounds ?? { min: 0, max: 1 };

    updateHeatmapUniforms(this.device, this.heatmapPipeline!.uniformBuffer, {
      scale: uniforms.scale,
      translate: uniforms.translate,
      minValue: zBounds.min,
      maxValue: zBounds.max,
    });

    // Get or create bind group for this texture
    let bindGroup = this.heatmapBindGroups.get(textureId);
    if (!bindGroup) {
      bindGroup = createHeatmapBindGroup(
        this.device,
        this.heatmapPipeline!.bindGroupLayout,
        this.heatmapPipeline!.uniformBuffer,
        this.heatmapPipeline!.sampler,
        tex
      );
      this.heatmapBindGroups.set(textureId, bindGroup);
    }

    pass.setPipeline(this.heatmapPipeline!.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, buf);
    pass.draw(count);
  }

  destroy(): void {
    for (const id of Array.from(this.buffers.keys())) {
      this.deleteBuffer(id);
    }
    for (const id of Array.from(this.textures.keys())) {
      this.deleteTexture(id);
    }

    this.trianglePipeline = null;
    this.linePipeline = null;
    this.pointPipeline = null;
    this.bandPipeline = null;
    this.heatmapPipeline = null;
    this.heatmapBindGroups.clear();

    this.device = undefined;
    this.adapter = undefined;
    this.context = undefined;
    this.format = null;
  }
}
