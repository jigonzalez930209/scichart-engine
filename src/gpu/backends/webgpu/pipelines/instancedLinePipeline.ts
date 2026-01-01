/**
 * Instanced Line Pipeline - For rendering large datasets efficiently
 * 
 * Uses storage buffers and instancing to render millions of line segments.
 * Each instance represents one line segment between consecutive points.
 */

import { INSTANCED_LINE_SHADER_WGSL } from "../shaders/instanced.wgsl";

export interface InstancedLinePipelineBundle {
  pipeline: any;
  bindGroupLayout: any;
  uniformBuffer: any;
  vertexStride: number;
}

export interface InstancedLineUniforms {
  scale: [number, number];
  translate: [number, number];
  color: [number, number, number, number];
  lineWidth: number;
  aspectRatio: number;
  pointCount: number;
}

// Uniform buffer: scale(2) + translate(2) + color(4) + lineWidth(1) + aspectRatio(1) + pointCount(1) + padding(1) = 12 floats = 48 bytes
const UNIFORM_BUFFER_SIZE = 48;

export function createInstancedLinePipeline(
  device: any,
  format: string
): InstancedLinePipelineBundle {
  const module = device.createShaderModule({ code: INSTANCED_LINE_SHADER_WGSL });
  
  const GPUShaderStageAny = (globalThis as any).GPUShaderStage;
  const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;
  
  // Bind group layout with uniform buffer and storage buffer
  const bindGroupLayout = device.createBindGroupLayout({
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
  
  // Uniform buffer
  const uniformBuffer = device.createBuffer({
    size: UNIFORM_BUFFER_SIZE,
    usage: GPUBufferUsageAny.UNIFORM | GPUBufferUsageAny.COPY_DST,
  });
  
  // Pipeline layout
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });
  
  // Render pipeline (no vertex buffers - all data from storage)
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: "vs_main",
      buffers: [], // No vertex buffers - using storage buffer
    },
    fragment: {
      module,
      entryPoint: "fs_main",
      targets: [
        {
          format,
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
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "none",
    },
  });
  
  return {
    pipeline,
    bindGroupLayout,
    uniformBuffer,
    vertexStride: 8, // vec2<f32>
  };
}

export function createInstancedLineBindGroup(
  device: any,
  layout: any,
  uniformBuffer: any,
  pointBuffer: any
): any {
  return device.createBindGroup({
    layout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: { buffer: pointBuffer } },
    ],
  });
}

export function updateInstancedLineUniforms(
  device: any,
  uniformBuffer: any,
  uniforms: InstancedLineUniforms
): void {
  // Pack data carefully to match shader struct layout
  const data = new ArrayBuffer(UNIFORM_BUFFER_SIZE);
  const floatView = new Float32Array(data);
  const uint32View = new Uint32Array(data);
  
  floatView[0] = uniforms.scale[0];
  floatView[1] = uniforms.scale[1];
  floatView[2] = uniforms.translate[0];
  floatView[3] = uniforms.translate[1];
  floatView[4] = uniforms.color[0];
  floatView[5] = uniforms.color[1];
  floatView[6] = uniforms.color[2];
  floatView[7] = uniforms.color[3];
  floatView[8] = uniforms.lineWidth;
  floatView[9] = uniforms.aspectRatio;
  uint32View[10] = uniforms.pointCount;
  uint32View[11] = 0; // padding
  
  device.queue.writeBuffer(uniformBuffer, 0, data);
}
