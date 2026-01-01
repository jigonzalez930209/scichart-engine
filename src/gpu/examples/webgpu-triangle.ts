import { WebGPUBackend } from "../backends/webgpu/WebGPUBackend";

export async function runWebGPUTriangleDemo(
  container: HTMLElement
): Promise<() => void> {
  const canvas = document.createElement("canvas");
  canvas.style.width = "640px";
  canvas.style.height = "360px";
  canvas.style.display = "block";

  container.appendChild(canvas);

  const backend = new WebGPUBackend(canvas);

  if (!backend.info.available) {
    const msg = document.createElement("div");
    msg.textContent = "WebGPU not supported in this browser";
    container.appendChild(msg);
    return () => {
      canvas.remove();
      msg.remove();
    };
  }

  await backend.init();

  backend.setViewport({
    width: 640,
    height: 360,
    dpr: window.devicePixelRatio || 1,
  });

  const vertices = new Float32Array([
    -0.6, -0.6, 1, 0, 0, 1, 0.6, -0.6, 0, 1, 0, 1, 0.0, 0.6, 0, 0, 1, 1,
  ]);

  backend.createOrUpdateBuffer("tri", vertices, {
    usage: "vertex",
    byteStride: 6 * 4,
  });

  let raf = 0;
  const frame = {
    viewport: { width: 640, height: 360, dpr: window.devicePixelRatio || 1 },
    clearColor: [0.05, 0.05, 0.07, 1] as const,
  };

  const drawList = {
    items: [
      {
        id: "triangle",
        kind: "triangles" as const,
        bufferId: "tri",
        count: 3,
        visible: true,
      },
    ],
  };

  const loop = () => {
    backend.render(drawList, frame);
    raf = requestAnimationFrame(loop);
  };

  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    backend.destroy();
    canvas.remove();
  };
}
