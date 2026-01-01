/**
 * Point Pipeline - WebGPU pipeline for rendering scatter points with SDF symbols
 * 
 * Uses instanced rendering where each point is rendered as a quad (2 triangles).
 * Uses `any` types for WebGPU objects to avoid requiring @webgpu/types.
 */

import { POINT_QUAD_SHADER_WGSL, POINT_VERTEX_STRIDE } from "../shaders/point.wgsl";

export interface PointPipelineBundle {
  pipeline: any; // GPURenderPipeline
  bindGroupLayout: any; // GPUBindGroupLayout
  uniformBuffer: any; // GPUBuffer
  bindGroup: any; // GPUBindGroup
  quadBuffer: any; // GPUBuffer - Pre-generated quad vertices
  vertexStride: number;
}

export interface PointUniforms {
  scale: [number, number];
  translate: [number, number];
  color: [number, number, number, number];
  pointSize: number;
  symbol: number; // 0=circle, 1=square, 2=diamond, 3=triangle, 4=triangleDown, 5=cross, 6=x, 7=star
  viewport: [number, number];
}

// Uniform buffer layout:
// scale(2) + translate(2) + color(4) + pointSize(1) + symbol(1) + viewport(2) = 12 floats = 48 bytes
const UNIFORM_BUFFER_SIZE = 48;

// Quad vertex offsets (6 vertices for 2 triangles)
const QUAD_VERTICES = new Float32Array([
  -1, -1, // bottom-left
   1, -1, // bottom-right
  -1,  1, // top-left
  -1,  1, // top-left
   1, -1, // bottom-right
   1,  1, // top-right
]);

export function createPointPipeline(
  device: any, // GPUDevice
  format: string // GPUTextureFormat
): PointPipelineBundle {
  const module = device.createShaderModule({ code: POINT_QUAD_SHADER_WGSL });

  const GPUShaderStageAny = (globalThis as any).GPUShaderStage;
  const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;

  // Create bind group layout
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStageAny.VERTEX | GPUShaderStageAny.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ],
  });

  // Create uniform buffer
  const uniformBuffer = device.createBuffer({
    size: UNIFORM_BUFFER_SIZE,
    usage: GPUBufferUsageAny.UNIFORM | GPUBufferUsageAny.COPY_DST,
  });

  // Create quad vertex buffer
  const quadBuffer = device.createBuffer({
    size: QUAD_VERTICES.byteLength,
    usage: GPUBufferUsageAny.VERTEX | GPUBufferUsageAny.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(quadBuffer.getMappedRange()).set(QUAD_VERTICES);
  quadBuffer.unmap();

  // Create bind group
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  // Create pipeline layout
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: "vs_main",
      buffers: [
        // Point positions (instanced)
        {
          arrayStride: POINT_VERTEX_STRIDE,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" },
          ],
        },
        // Quad vertex offsets (per-vertex)
        {
          arrayStride: 8, // 2 floats
          stepMode: "vertex",
          attributes: [
            { shaderLocation: 1, offset: 0, format: "float32x2" },
          ],
        },
      ],
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
    bindGroup,
    quadBuffer,
    vertexStride: POINT_VERTEX_STRIDE,
  };
}

export function updatePointUniforms(
  device: any, // GPUDevice
  uniformBuffer: any, // GPUBuffer
  uniforms: PointUniforms
): void {
  // Pack data: scale(2) + translate(2) + color(4) + pointSize(1) + symbol(1 as float) + viewport(2)
  const data = new Float32Array([
    uniforms.scale[0],
    uniforms.scale[1],
    uniforms.translate[0],
    uniforms.translate[1],
    uniforms.color[0],
    uniforms.color[1],
    uniforms.color[2],
    uniforms.color[3],
    uniforms.pointSize,
    uniforms.symbol, // Will be cast to i32 in shader via bitcast
    uniforms.viewport[0],
    uniforms.viewport[1],
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, data);
}

export const SYMBOL_MAP: Record<string, number> = {
  circle: 0,
  square: 1,
  diamond: 2,
  triangle: 3,
  triangleDown: 4,
  cross: 5,
  x: 6,
  star: 7,
};
