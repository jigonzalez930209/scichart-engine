/**
 * Band Pipeline - WebGPU pipeline for rendering band/area fills
 * 
 * Uses triangle-strip topology for efficient area rendering.
 * Reuses the line shader with different primitive topology.
 * Uses `any` types for WebGPU objects to avoid requiring @webgpu/types.
 */

import { LINE_SHADER_WGSL, LINE_VERTEX_STRIDE } from "../shaders/line.wgsl";

export interface BandPipelineBundle {
  pipeline: any; // GPURenderPipeline
  bindGroupLayout: any; // GPUBindGroupLayout
  uniformBuffer: any; // GPUBuffer
  bindGroup: any; // GPUBindGroup
  vertexStride: number;
}

export interface BandUniforms {
  scale: [number, number];
  translate: [number, number];
  color: [number, number, number, number];
}

// Same as line uniforms
const UNIFORM_BUFFER_SIZE = 32;

export function createBandPipeline(
  device: any, // GPUDevice
  format: string // GPUTextureFormat
): BandPipelineBundle {
  const module = device.createShaderModule({ code: LINE_SHADER_WGSL });

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
        {
          arrayStride: LINE_VERTEX_STRIDE,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" },
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
      topology: "triangle-strip", // Key difference from line pipeline
      stripIndexFormat: undefined,
    },
  });

  return {
    pipeline,
    bindGroupLayout,
    uniformBuffer,
    bindGroup,
    vertexStride: LINE_VERTEX_STRIDE,
  };
}

export function updateBandUniforms(
  device: any, // GPUDevice
  uniformBuffer: any, // GPUBuffer
  uniforms: BandUniforms
): void {
  const data = new Float32Array([
    uniforms.scale[0],
    uniforms.scale[1],
    uniforms.translate[0],
    uniforms.translate[1],
    uniforms.color[0],
    uniforms.color[1],
    uniforms.color[2],
    uniforms.color[3],
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, data);
}
