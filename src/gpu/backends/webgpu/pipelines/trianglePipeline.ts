import { TRIANGLE_SHADER_WGSL } from "./triangleShader";

export interface TrianglePipelineBundle {
  pipeline: any;
  vertexStride: number;
}

export function createTrianglePipeline(
  device: any,
  format: string
): TrianglePipelineBundle {
  const module = device.createShaderModule({ code: TRIANGLE_SHADER_WGSL });

  const vertexStride = 6 * 4;

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: vertexStride,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" },
            { shaderLocation: 1, offset: 2 * 4, format: "float32x4" },
          ],
        },
      ],
    },
    fragment: {
      module,
      entryPoint: "fs_main",
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "none",
    },
  });

  return { pipeline, vertexStride };
}
