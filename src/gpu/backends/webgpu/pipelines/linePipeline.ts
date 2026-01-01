/**
 * Line Pipeline - WebGPU pipeline for rendering lines with uniform buffer
 * 
 * Uses `any` types for WebGPU objects to avoid requiring @webgpu/types
 * (following the pattern of the original WebGPUBackend.ts)
 */

import { LINE_SHADER_WGSL, LINE_VERTEX_STRIDE } from "../shaders/line.wgsl";

export interface LinePipelineBundle {
  pipeline: any; // GPURenderPipeline
  bindGroupLayout: any; // GPUBindGroupLayout
  uniformBuffer: any; // GPUBuffer
  bindGroup: any; // GPUBindGroup
  vertexStride: number;
}

export interface LineUniforms {
  scale: [number, number];
  translate: [number, number];
  color: [number, number, number, number];
}

// Uniform buffer layout: scale(2) + translate(2) + color(4) = 8 floats = 32 bytes
const UNIFORM_BUFFER_SIZE = 32;

export function createLinePipeline(
  device: any, // GPUDevice
  format: string // GPUTextureFormat
): LinePipelineBundle {
  const module = device.createShaderModule({ code: LINE_SHADER_WGSL });

  const GPUShaderStageAny = (globalThis as any).GPUShaderStage;
  const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;

  // Create bind group layout explicitly
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
      topology: "line-strip",
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

export function updateLineUniforms(
  device: any, // GPUDevice
  uniformBuffer: any, // GPUBuffer
  uniforms: LineUniforms
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
