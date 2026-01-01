/**
 * WebGPU Line Demo - Demonstrates line rendering with the GPU abstraction layer
 */

import { WebGPUBackend } from "../backends/webgpu/WebGPUBackend";
import type { DrawList, FrameUniforms } from "../";

export async function runWebGPULineDemo(
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

  const dpr = window.devicePixelRatio || 1;
  backend.setViewport({
    width: 640,
    height: 360,
    dpr,
  });

  // Generate sine wave data
  const numPoints = 200;
  const lineData = new Float32Array(numPoints * 2);
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * 4 * Math.PI;
    const y = Math.sin(x);
    lineData[i * 2] = x;
    lineData[i * 2 + 1] = y;
  }

  // Generate scatter points
  const scatterData = new Float32Array([
    0, 0,
    Math.PI, 0,
    2 * Math.PI, 0,
    3 * Math.PI, 0,
    4 * Math.PI, 0,
  ]);

  backend.createOrUpdateBuffer("line", lineData, { usage: "vertex" });
  backend.createOrUpdateBuffer("scatter", scatterData, { usage: "vertex" });

  let raf = 0;
  const frame: FrameUniforms = {
    viewport: { width: 640, height: 360, dpr },
    clearColor: [0.05, 0.05, 0.07, 1] as const,
  };

  const bounds = {
    xMin: 0,
    xMax: 4 * Math.PI,
    yMin: -1.5,
    yMax: 1.5,
  };

  const drawList: DrawList = {
    items: [
      {
        id: "sine-wave",
        kind: "line",
        bufferId: "line",
        count: numPoints,
        visible: true,
        style: {
          color: [0, 0.9, 1, 1] as const, // Cyan
          lineWidth: 2,
        },
      },
      {
        id: "zero-crossings",
        kind: "scatter",
        bufferId: "scatter",
        count: 5,
        visible: true,
        style: {
          color: [1, 0.2, 0.5, 1] as const, // Magenta
          pointSize: 8,
          symbol: "circle",
        },
      },
    ],
  };

  const loop = () => {
    backend.renderWithBounds(drawList, frame, bounds);
    raf = requestAnimationFrame(loop);
  };

  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    backend.destroy();
    canvas.remove();
  };
}

/**
 * WebGPU Chart Demo - Demonstrates multiple series types
 */
export async function runWebGPUChartDemo(
  container: HTMLElement
): Promise<() => void> {
  const canvas = document.createElement("canvas");
  canvas.style.width = "800px";
  canvas.style.height = "400px";
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

  const dpr = window.devicePixelRatio || 1;
  backend.setViewport({
    width: 800,
    height: 400,
    dpr,
  });

  // Generate line data
  const numPoints = 100;
  const lineData = new Float32Array(numPoints * 2);
  for (let i = 0; i < numPoints; i++) {
    const x = i / (numPoints - 1);
    const y = Math.sin(x * 6) * 0.3 + 0.5;
    lineData[i * 2] = x;
    lineData[i * 2 + 1] = y;
  }

  // Generate band data (upper and lower bounds as triangle strip)
  const bandData = new Float32Array(numPoints * 4); // 2 points per x position
  for (let i = 0; i < numPoints; i++) {
    const x = i / (numPoints - 1);
    const center = Math.sin(x * 6) * 0.3 + 0.5;
    const upper = center + 0.1;
    const lower = center - 0.1;
    
    // Triangle strip: alternate upper/lower
    bandData[i * 4] = x;
    bandData[i * 4 + 1] = lower;
    bandData[i * 4 + 2] = x;
    bandData[i * 4 + 3] = upper;
  }

  // Generate scatter data
  const scatterData = new Float32Array([
    0.1, 0.8,
    0.3, 0.2,
    0.5, 0.9,
    0.7, 0.4,
    0.9, 0.6,
  ]);

  backend.createOrUpdateBuffer("line", lineData, { usage: "vertex" });
  backend.createOrUpdateBuffer("band", bandData, { usage: "vertex" });
  backend.createOrUpdateBuffer("scatter", scatterData, { usage: "vertex" });

  let raf = 0;
  const frame: FrameUniforms = {
    viewport: { width: 800, height: 400, dpr },
    clearColor: [0.08, 0.08, 0.12, 1] as const,
  };

  const bounds = {
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 1,
  };

  const drawList: DrawList = {
    items: [
      {
        id: "confidence-band",
        kind: "band",
        bufferId: "band",
        count: numPoints * 2,
        visible: true,
        style: {
          color: [0.2, 0.6, 1, 1] as const, // Blue
        },
      },
      {
        id: "main-line",
        kind: "line",
        bufferId: "line",
        count: numPoints,
        visible: true,
        style: {
          color: [0, 0.9, 1, 1] as const, // Cyan
        },
      },
      {
        id: "data-points",
        kind: "scatter",
        bufferId: "scatter",
        count: 5,
        visible: true,
        style: {
          color: [1, 0.4, 0.2, 1] as const, // Orange
          pointSize: 10,
          symbol: "diamond",
        },
      },
    ],
  };

  const loop = () => {
    backend.renderWithBounds(drawList, frame, bounds);
    raf = requestAnimationFrame(loop);
  };

  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    backend.destroy();
    canvas.remove();
  };
}
