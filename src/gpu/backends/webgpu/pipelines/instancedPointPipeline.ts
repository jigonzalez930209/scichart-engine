/**
 * Instanced Point Pipeline - For rendering large scatter datasets
 * 
 * Uses storage buffers and instancing to render millions of points.
 */

import { INSTANCED_POINT_SHADER_WGSL } from "../shaders/instanced.wgsl";

export interface InstancedPointPipelineBundle {
  pipeline: any;
  bindGroupLayout: any;
  uniformBuffer: any;
  vertexStride: number;
}

export interface InstancedPointUniforms {
  scale: [number, number];
  translate: [number, number];
  color: [number, number, number, number];
  pointSize: number;
  symbolType: number;
  viewportWidth: number;
  viewportHeight: number;
  pointCount: number;
}

// Uniform buffer: scale(2) + translate(2) + color(4) + pointSize(1) + symbolType(1) + viewport(2) + pointCount(1) + padding(3) = 16 floats = 64 bytes
const UNIFORM_BUFFER_SIZE = 64;

export function createInstancedPointPipeline(
  device: any,
  format: string
): InstancedPointPipelineBundle {
  const module = device.createShaderModule({ code: INSTANCED_POINT_SHADER_WGSL });
  
  const GPUShaderStageAny = (globalThis as any).GPUShaderStage;
  const GPUBufferUsageAny = (globalThis as any).GPUBufferUsage;
  
  // Bind group layout
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
  
  // Render pipeline
  const pipeline = device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module,
      entryPoint: "vs_main",
      buffers: [],
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
    vertexStride: 8,
  };
}

export function createInstancedPointBindGroup(
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

export function updateInstancedPointUniforms(
  device: any,
  uniformBuffer: any,
  uniforms: InstancedPointUniforms
): void {
  const data = new ArrayBuffer(UNIFORM_BUFFER_SIZE);
  const floatView = new Float32Array(data);
  const int32View = new Int32Array(data);
  const uint32View = new Uint32Array(data);
  
  floatView[0] = uniforms.scale[0];
  floatView[1] = uniforms.scale[1];
  floatView[2] = uniforms.translate[0];
  floatView[3] = uniforms.translate[1];
  floatView[4] = uniforms.color[0];
  floatView[5] = uniforms.color[1];
  floatView[6] = uniforms.color[2];
  floatView[7] = uniforms.color[3];
  floatView[8] = uniforms.pointSize;
  int32View[9] = uniforms.symbolType;
  floatView[10] = uniforms.viewportWidth;
  floatView[11] = uniforms.viewportHeight;
  uint32View[12] = uniforms.pointCount;
  uint32View[13] = 0; // padding
  uint32View[14] = 0; // padding
  uint32View[15] = 0; // padding
  
  device.queue.writeBuffer(uniformBuffer, 0, data);
}

export const SYMBOL_TYPE_MAP: Record<string, number> = {
  circle: 0,
  square: 1,
  diamond: 2,
  triangle: 0, // fallback to circle for now
  triangleDown: 0,
  cross: 0,
  x: 0,
  star: 0,
};
