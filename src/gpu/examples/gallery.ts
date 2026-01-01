import { createGpuRenderer } from '../adapter';

export interface GpuDemo {
  name: string;
  description: string;
  init: (canvas: HTMLCanvasElement) => Promise<{
    render: () => void;
    destroy: () => void;
  }>;
}

/**
 * 1M Line Demo
 */
export const LinePerformanceDemo: GpuDemo = {
  name: "1M Points Line",
  description: "Rendering 1 million points with smooth animation using WebGPU",
  init: async (canvas) => {
    const renderer = await createGpuRenderer(canvas, { backend: 'webgpu' });
    if (!renderer) throw new Error("WebGPU not available");

    const count = 1000000;
    const data = new Float32Array(count * 2);
    renderer.createBuffer('main-line', data);

    let phase = 0;
    return {
      render: () => {
        for (let i = 0; i < count; i++) {
          data[i * 2] = i / (count - 1);
          data[i * 2 + 1] = 0.5 + Math.sin(i * 0.01 + phase) * 0.3 + Math.sin(i * 0.0001 + phase) * 0.1;
        }
        renderer.updateBuffer('main-line', data, 0);
        renderer.render([{
          id: 'main-line',
          type: 'line',
          visible: true,
          style: { color: "#00d4ff", lineWidth: 1 }
        }], { bounds: { xMin: 0, xMax: 1, yMin: 0, yMax: 1 } });
        phase += 0.05;
      },
      destroy: () => renderer.destroy()
    };
  }
};

/**
 * Instanced Scatter Demo
 */
export const ScatterInstancedDemo: GpuDemo = {
  name: "Instanced Scatter",
  description: "100,000 SDF symbols (Stars) rendered with WebGPU instancing",
  init: async (canvas) => {
    const renderer = await createGpuRenderer(canvas, { backend: 'webgpu' });
    if (!renderer) throw new Error("WebGPU not available");

    const count = 100000;
    const data = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      data[i * 2] = Math.random();
      data[i * 2 + 1] = Math.random();
    }
    renderer.createBuffer('points', data);

    return {
      render: () => {
        renderer.render([{
          id: 'points',
          type: 'scatter',
          visible: true,
          style: { 
            color: "#ff66cc", 
            pointSize: 10,
            symbol: 'star'
          }
        }], { bounds: { xMin: 0, xMax: 1, yMin: 0, yMax: 1 } });
      },
      destroy: () => renderer.destroy()
    };
  }
};

/**
 * Dynamic Heatmap Demo
 */
export const DynamicHeatmapDemo: GpuDemo = {
  name: "Heatmap with WebGPU",
  description: "Dynamic intensity map showcasing WebGPU texture mapping and SDF colormaps",
  init: async (canvas) => {
    const renderer = await createGpuRenderer(canvas, { backend: 'webgpu' });
    if (!renderer) throw new Error("WebGPU not available");

    // Heatmap data: x, y, value
    const width = 100;
    const height = 100;
    const count = width * height;
    const data = new Float32Array(count * 3);
    
    // Initial data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        data[i] = x / width;
        data[i+1] = y / height;
        data[i+2] = 0;
      }
    }
    renderer.createBuffer('heat-data', data);
    
    // Create colormap
    const colormap = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
       colormap[i*4] = i; 
       colormap[i*4+1] = 0;
       colormap[i*4+2] = 255 - i;
       colormap[i*4+3] = 255;
    }
    renderer.createColormapTexture('heat-data', colormap);

    let phase = 0;
    return {
      render: () => {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 3;
            data[i+2] = (Math.sin(x*0.1 + phase) + Math.cos(y*0.1 + phase) + 2) / 4;
          }
        }
        renderer.updateBuffer('heat-data', data, 0);
        renderer.render([{
          id: 'heat-data',
          type: 'heatmap',
          visible: true,
          style: { color: "#ffffff" },
          zBounds: { min: 0, max: 1 }
        }], { bounds: { xMin: 0, xMax: 1, yMin: 0, yMax: 1 } });
        phase += 0.05;
      },
      destroy: () => renderer.destroy()
    };
  }
};
