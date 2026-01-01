/**
 * Heatmap Pipeline - WebGPU pipeline for rendering heatmaps with colormap textures
 * 
 * Uses `any` types for WebGPU objects to avoid requiring @webgpu/types.
 */

import { HEATMAP_SHADER_WGSL, HEATMAP_VERTEX_STRIDE } from "../shaders/heatmap.wgsl";

export interface HeatmapPipelineBundle {
  pipeline: any; // GPURenderPipeline
  bindGroupLayout: any; // GPUBindGroupLayout
  uniformBuffer: any; // GPUBuffer
  sampler: any; // GPUSampler
  vertexStride: number;
}

export interface HeatmapUniforms {
  scale: [number, number];
  translate: [number, number];
  minValue: number;
  maxValue: number;
}

// Uniform buffer layout: scale(2) + translate(2) + minValue(1) + maxValue(1) + padding(2) = 8 floats = 32 bytes
const UNIFORM_BUFFER_SIZE = 32;

export function createHeatmapPipeline(
  device: any, // GPUDevice
  format: string // GPUTextureFormat
): HeatmapPipelineBundle {
  const module = device.createShaderModule({ code: HEATMAP_SHADER_WGSL });

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
      {
        binding: 1,
        visibility: GPUShaderStageAny.FRAGMENT,
        sampler: {},
      },
      {
        binding: 2,
        visibility: GPUShaderStageAny.FRAGMENT,
        texture: { 
          sampleType: "float",
          viewDimension: "1d",
        },
      },
    ],
  });

  // Create uniform buffer
  const uniformBuffer = device.createBuffer({
    size: UNIFORM_BUFFER_SIZE,
    usage: GPUBufferUsageAny.UNIFORM | GPUBufferUsageAny.COPY_DST,
  });

  // Create sampler
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
    addressModeU: "clamp-to-edge",
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
          arrayStride: HEATMAP_VERTEX_STRIDE,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" }, // position
            { shaderLocation: 1, offset: 8, format: "float32" },   // value
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
    sampler,
    vertexStride: HEATMAP_VERTEX_STRIDE,
  };
}

export function createHeatmapBindGroup(
  device: any, // GPUDevice
  layout: any, // GPUBindGroupLayout
  uniformBuffer: any, // GPUBuffer
  sampler: any, // GPUSampler
  colormapTexture: any // GPUTexture
): any { // GPUBindGroup
  return device.createBindGroup({
    layout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: colormapTexture.createView() },
    ],
  });
}

export function updateHeatmapUniforms(
  device: any, // GPUDevice
  uniformBuffer: any, // GPUBuffer
  uniforms: HeatmapUniforms
): void {
  const data = new Float32Array([
    uniforms.scale[0],
    uniforms.scale[1],
    uniforms.translate[0],
    uniforms.translate[1],
    uniforms.minValue,
    uniforms.maxValue,
    0, // padding
    0, // padding
  ]);
  device.queue.writeBuffer(uniformBuffer, 0, data);
}
