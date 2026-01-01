/**
 * MassiveDataRenderer - Optimized renderer for 100M+ points
 * 
 * Features:
 * - Chunked buffer upload with progress
 * - Batched draw calls to avoid GPU timeout
 * - LOD (Level of Detail) with GPU downsampling
 * - Storage buffers for instanced rendering
 * - Streaming data generation
 */

import { INSTANCED_LINE_SHADER_WGSL } from "./shaders/instanced.wgsl";

export interface MassiveDataConfig {
  maxPointsPerBatch: number;       // Max points per draw call (default: 10M)
  chunkSizeBytes: number;          // Upload chunk size (default: 64MB)
  enableLOD: boolean;              // Enable automatic LOD
  lodLevels: number;               // Number of LOD levels (default: 4)
  onProgress?: (phase: string, progress: number) => void;
  onStats?: (stats: RenderStats) => void;
}

export interface RenderStats {
  totalPoints: number;
  renderedPoints: number;
  bufferSizeMB: number;
  uploadTimeMs: number;
  frameTimeMs: number;
  fps: number;
  lodLevel: number;
  batchCount: number;
}

export interface LODLevel {
  buffer: any; // GPUBuffer
  pointCount: number;
  factor: number;  // e.g., 1, 10, 100, 1000
}

const DEFAULT_CONFIG: MassiveDataConfig = {
  maxPointsPerBatch: 10_000_000,   // 10M points per batch
  chunkSizeBytes: 64 * 1024 * 1024, // 64MB chunks
  enableLOD: true,
  lodLevels: 4,
};

export class MassiveDataRenderer {
  private device: any; // GPUDevice
  private context: any; // GPUCanvasContext
  private format: any; // GPUTextureFormat
  private config: MassiveDataConfig;
  
  // Pipelines
  private linePipeline: any = null; // GPURenderPipeline
  private lineBindGroupLayout: any = null; // GPUBindGroupLayout
  private uniformBuffer: any = null; // GPUBuffer
  
  // Data
  private storageBuffer: any = null; // GPUBuffer
  private bindGroup: any = null; // GPUBindGroup
  private totalPoints: number = 0;
  
  // LOD
  private lodLevels: LODLevel[] = [];
  private currentLOD: number = 0;
  
  // Stats
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private currentFps: number = 0;
  
  // Viewport
  private viewport: { width: number; height: number } = { width: 800, height: 600 };
  
  constructor(
    device: any, // GPUDevice
    context: any, // GPUCanvasContext
    format: any, // GPUTextureFormat
    config: Partial<MassiveDataConfig> = {}
  ) {

    this.device = device;
    this.context = context;
    this.format = format;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Initialize render pipelines
   */
  async init(): Promise<void> {
    const module = this.device.createShaderModule({ 
      code: INSTANCED_LINE_SHADER_WGSL 
    });
    
    const GPUShaderStageAny = (globalThis as any).GPUShaderStage;
    const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;
    
    // Bind group layout: uniform buffer + storage buffer
    this.lineBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStageAny.VERTEX | GPUShaderStageAny.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStageAny.VERTEX,
          buffer: { type: "read-only-storage" },
        },
      ],
    });
    
    // Uniform buffer (48 bytes)
    this.uniformBuffer = this.device.createBuffer({
      size: 48,
      usage: GPUBufferUsageAny.UNIFORM | GPUBufferUsageAny.COPY_DST,
    });
    
    // Render pipeline using instanced line shader
    this.linePipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ 
        bindGroupLayouts: [this.lineBindGroupLayout] 
      }),
      vertex: {
        module,
        entryPoint: "vs_main",
        buffers: [], // No vertex buffers - using storage buffer
      },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{
          format: this.format,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
      },
    });
    
    this.config.onProgress?.("init", 1);
  }
  
  /**
   * Set viewport dimensions
   */
  setViewport(width: number, height: number): void {
    this.viewport = { width, height };
  }
  
  /**
   * Upload data with chunked progress
   */
  async uploadData(data: Float32Array): Promise<void> {
    const totalBytes = data.byteLength;
    const pointCount = data.length / 2;
    this.totalPoints = pointCount;
    
    this.config.onProgress?.("allocate", 0.1);
    
    // Destroy old buffer if exists
    if (this.storageBuffer) {
      this.storageBuffer.destroy();
    }
    
    // Create storage buffer for points
    const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;
    this.storageBuffer = this.device.createBuffer({
      size: totalBytes,
      usage: GPUBufferUsageAny.STORAGE | GPUBufferUsageAny.COPY_DST,
    });
    
    this.config.onProgress?.("upload", 0);
    
    const startUpload = performance.now();
    const chunkSize = this.config.chunkSizeBytes;
    
    // Chunked upload with progress
    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      const size = Math.min(chunkSize, totalBytes - offset);
      const chunk = new Uint8Array(data.buffer, data.byteOffset + offset, size);
      
      this.device.queue.writeBuffer(this.storageBuffer, offset, chunk);
      
      const progress = (offset + size) / totalBytes;
      this.config.onProgress?.("upload", progress);
      
      // Yield to allow UI updates
      if (offset % (chunkSize * 4) === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
    
    const uploadTime = performance.now() - startUpload;
    
    // Create bind group
    this.bindGroup = this.device.createBindGroup({
      layout: this.lineBindGroupLayout!,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer! } },
        { binding: 1, resource: { buffer: this.storageBuffer } },
      ],
    });
    
    // Build LOD levels if enabled
    if (this.config.enableLOD) {
      await this.buildLOD(data);
    }
    
    this.config.onProgress?.("complete", 1);
    
    this.config.onStats?.({
      totalPoints: pointCount,
      renderedPoints: pointCount,
      bufferSizeMB: totalBytes / (1024 * 1024),
      uploadTimeMs: uploadTime,
      frameTimeMs: 0,
      fps: 0,
      lodLevel: 0,
      batchCount: Math.ceil(pointCount / this.config.maxPointsPerBatch),
    });
  }
  
  /**
   * Build LOD levels using GPU downsampling
   */
  private async buildLOD(fullData: Float32Array): Promise<void> {
    this.lodLevels = [];
    
    // Level 0: Full data (already in storageBuffer)
    this.lodLevels.push({
      buffer: this.storageBuffer!,
      pointCount: this.totalPoints,
      factor: 1,
    });
    
    // Build progressively downsampled levels
    const factors = [10, 100, 1000];
    
    for (let i = 0; i < factors.length && i < this.config.lodLevels - 1; i++) {
      const factor = factors[i];
      const lodPointCount = Math.ceil(this.totalPoints / factor);
      
      if (lodPointCount < 1000) break; // Don't create very small LOD levels
      
      // CPU downsample (could be GPU with compute shader)
      const lodData = new Float32Array(lodPointCount * 2);
      for (let j = 0; j < lodPointCount; j++) {
        const srcIndex = j * factor;
        if (srcIndex < this.totalPoints) {
          lodData[j * 2] = fullData[srcIndex * 2];
          lodData[j * 2 + 1] = fullData[srcIndex * 2 + 1];
        }
      }
      
      // Create buffer for this LOD level
      const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;
      const lodBuffer = this.device.createBuffer({
        size: lodData.byteLength,
        usage: GPUBufferUsageAny.STORAGE | GPUBufferUsageAny.COPY_DST,
      });
      
      this.device.queue.writeBuffer(lodBuffer, 0, lodData);
      
      this.lodLevels.push({
        buffer: lodBuffer,
        pointCount: lodPointCount,
        factor,
      });
      
      this.config.onProgress?.("lod", (i + 1) / factors.length);
    }
  }
  
  /**
   * Select appropriate LOD level based on visible range
   */
  selectLOD(visibleRange: number, totalRange: number): number {
    if (!this.config.enableLOD || this.lodLevels.length === 0) {
      return 0;
    }
    
    const zoomFactor = totalRange / visibleRange;
    
    // Higher zoom = more detail needed
    if (zoomFactor > 100) return 0;           // Full detail
    if (zoomFactor > 10) return Math.min(1, this.lodLevels.length - 1);   // 10x downsample
    if (zoomFactor > 1) return Math.min(2, this.lodLevels.length - 1);    // 100x downsample
    return Math.min(3, this.lodLevels.length - 1);                         // 1000x downsample
  }
  
  /**
   * Render frame with batching
   */
  render(options: {
    bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
    color?: [number, number, number, number];
    lineWidth?: number;
    time?: number;
    lodLevel?: number;
  }): void {
    if (!this.linePipeline || !this.bindGroup || !this.storageBuffer) {
      return;
    }
    
    const frameStart = performance.now();
    
    // Select LOD level
    const lodLevel = options.lodLevel ?? this.currentLOD;
    const lod = this.lodLevels[lodLevel] || this.lodLevels[0];
    
    if (!lod) return;
    
    // Update bind group if LOD changed
    if (this.currentLOD !== lodLevel) {
      this.currentLOD = lodLevel;
      this.bindGroup = this.device.createBindGroup({
        layout: this.lineBindGroupLayout!,
        entries: [
          { binding: 0, resource: { buffer: this.uniformBuffer! } },
          { binding: 1, resource: { buffer: lod.buffer } },
        ],
      });
    }
    
    const pointCount = lod.pointCount;
    
    // Calculate uniforms
    const { bounds, color = [0, 0.85, 1, 1], lineWidth = 1 } = options;
    const dataWidth = bounds.xMax - bounds.xMin;
    const dataHeight = bounds.yMax - bounds.yMin;
    
    const scaleX = dataWidth > 0 ? 2 / dataWidth : 1;
    const scaleY = dataHeight > 0 ? 2 / dataHeight : 1;
    const translateX = -1 - bounds.xMin * scaleX;
    const translateY = -1 - bounds.yMin * scaleY;
    
    // Pack uniforms
    const uniformData = new ArrayBuffer(48);
    const floatView = new Float32Array(uniformData);
    const uint32View = new Uint32Array(uniformData);
    
    floatView[0] = scaleX;
    floatView[1] = scaleY;
    floatView[2] = translateX;
    floatView[3] = translateY;
    floatView[4] = color[0];
    floatView[5] = color[1];
    floatView[6] = color[2];
    floatView[7] = color[3];
    floatView[8] = lineWidth;
    floatView[9] = this.viewport.width / this.viewport.height;
    uint32View[10] = pointCount;
    uint32View[11] = 0; // padding
    
    this.device.queue.writeBuffer(this.uniformBuffer!, 0, uniformData);
    
    // Create command encoder
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0.02, g: 0.02, b: 0.05, a: 1 },
        loadOp: "clear",
        storeOp: "store",
      }],
    });
    
    pass.setPipeline(this.linePipeline);
    pass.setBindGroup(0, this.bindGroup);
    
    // Batched rendering to avoid GPU timeout
    const segmentCount = pointCount - 1;
    const maxSegmentsPerBatch = this.config.maxPointsPerBatch;
    let batchCount = 0;
    
    for (let offset = 0; offset < segmentCount; offset += maxSegmentsPerBatch) {
      const count = Math.min(maxSegmentsPerBatch, segmentCount - offset);
      // 6 vertices per segment (2 triangles for line thickness)
      pass.draw(6, count, 0, offset);
      batchCount++;
    }
    
    pass.end();
    this.device.queue.submit([encoder.finish()]);
    
    // Update stats
    this.lastFrameTime = performance.now() - frameStart;
    this.frameCount++;
    
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
      
      this.config.onStats?.({
        totalPoints: this.totalPoints,
        renderedPoints: pointCount,
        bufferSizeMB: this.storageBuffer.size / (1024 * 1024),
        uploadTimeMs: 0,
        frameTimeMs: this.lastFrameTime,
        fps: this.currentFps,
        lodLevel: this.currentLOD,
        batchCount,
      });
    }
  }
  
  /**
   * Generate streaming sine wave data
   */
  static async generateSineWaveData(
    pointCount: number,
    onProgress?: (progress: number) => void
  ): Promise<Float32Array> {
    const chunkSize = 1_000_000; // 1M points per chunk
    const data = new Float32Array(pointCount * 2);
    
    for (let offset = 0; offset < pointCount; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, pointCount);
      
      for (let i = offset; i < end; i++) {
        const x = i / (pointCount - 1);
        // Multi-frequency sine wave for visual interest
        const y = 0.5 + 
          0.2 * Math.sin(x * 20 * Math.PI) +
          0.1 * Math.sin(x * 50 * Math.PI) +
          0.05 * Math.sin(x * 200 * Math.PI);
        
        data[i * 2] = x;
        data[i * 2 + 1] = y;
      }
      
      onProgress?.((offset + chunkSize) / pointCount);
      
      // Yield to UI every chunk
      await new Promise(r => setTimeout(r, 0));
    }
    
    return data;
  }
  
  /**
   * Get current stats
   */
  getStats(): RenderStats {
    return {
      totalPoints: this.totalPoints,
      renderedPoints: this.lodLevels[this.currentLOD]?.pointCount ?? this.totalPoints,
      bufferSizeMB: (this.storageBuffer?.size ?? 0) / (1024 * 1024),
      uploadTimeMs: 0,
      frameTimeMs: this.lastFrameTime,
      fps: this.currentFps,
      lodLevel: this.currentLOD,
      batchCount: Math.ceil(this.totalPoints / this.config.maxPointsPerBatch),
    };
  }
  
  /**
   * Get available LOD levels
   */
  getLODLevels(): { level: number; pointCount: number; factor: number }[] {
    return this.lodLevels.map((lod, i) => ({
      level: i,
      pointCount: lod.pointCount,
      factor: lod.factor,
    }));
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    this.storageBuffer?.destroy();
    this.uniformBuffer?.destroy();
    
    for (let i = 1; i < this.lodLevels.length; i++) {
      this.lodLevels[i].buffer.destroy();
    }
    
    this.lodLevels = [];
    this.storageBuffer = null;
    this.uniformBuffer = null;
    this.bindGroup = null;
  }
}
