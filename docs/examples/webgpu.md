---
title: WebGPU Renderer
description: Next-generation GPU rendering with WebGPU
---

# WebGPU Renderer

> **Status**: ✅ Implemented  
> **Availability**: Chrome 113+, Edge 113+, Safari 17+

SciChart Engine includes a GPU abstraction layer that enables **WebGPU** as a rendering backend, offering significantly higher performance than traditional WebGL.

## 🚀 How to Enable WebGPU

If the demo below does not show "✅ WebGPU Active", follow these steps to enable it in your browser:

### In Google Chrome / Edge (Windows, Linux, Mac)

1. Open a new tab and navigate to: `chrome://flags/#enable-unsafe-webgpu`
2. Change the status to **Enabled**.
3. Also search for: `chrome://flags/#enable-vulkan` (on Linux/AMD) and change it to **Enabled**.
4. Click the **Relaunch** button in the bottom right corner to restart the browser.

### In Firefox (Windows and MacOS)

1. Navigate to `about:config`.
2. Search for `dom.webgpu.enabled` and set it to `true`.
3. Search for `gfx.webgpu.force-enabled` and set it to `true`.

---

## Interactive Demo

<div id="webgpu-demo" class="demo-container">
  <div class="demo-header">
    <div class="status-group">
      <span id="gpu-status" class="status pending">🔄 Checking WebGPU...</span>
      <span id="fps-counter" class="fps-badge">-- FPS</span>
    </div>
    <div class="controls-group">
      <select id="series-type" class="btn-select">
        <option value="line">Lines (100k)</option>
        <option value="scatter">Points (100k)</option>
        <option value="band">Area/Bands (50k)</option>
      </select>
      <button id="animate-btn" class="btn">▶ Animate</button>
    </div>
  </div>
  <canvas id="demo-canvas" width="800" height="400"></canvas>
  <p class="demo-hint">Supports pan (drag) and zoom (scroll) when active</p>
</div>

<style>
.demo-container {
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 1.25rem;
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.status-group, .controls-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status {
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.fps-badge {
  background: var(--vp-c-bg);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  border: 1px solid var(--vp-c-divider);
}

.status.pending { background: #f0ad4e22; color: #f0ad4e; }
.status.success { background: #5cb85c22; color: #5cb85c; }
.status.error { background: #d9534f22; color: #d9534f; }

.btn, .btn-select {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn {
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  color: white;
  border: none;
  font-weight: 600;
}

.btn-select {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,212,255,0.3); }
.btn:active { transform: translateY(0); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

#demo-canvas {
  width: 100%;
  height: 350px;
  background: #05050a;
  border-radius: 8px;
  display: block;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
}

.demo-hint {
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 0.8rem;
  margin-top: 0.75rem;
  font-style: italic;
}
</style>

<script type="module">
// Optimized WebGPU demo - Animation in GPU shader for 60 FPS
if (typeof window !== 'undefined') {
  // Guard against multiple instances (VitePress hot-reload)
  const INSTANCE_KEY = '__webgpu_demo_instance__';
  if (window[INSTANCE_KEY]) {
    // Cancel previous instance's render loop
    if (window[INSTANCE_KEY].rafId) {
      cancelAnimationFrame(window[INSTANCE_KEY].rafId);
    }
    // Destroy previous device if exists
    if (window[INSTANCE_KEY].device) {
      window[INSTANCE_KEY].device.destroy?.();
    }
  }
  window[INSTANCE_KEY] = { rafId: null, device: null };
  const instance = window[INSTANCE_KEY];
  
  // DOM references - will be assigned after VitePress hydration
  let status, fpsCounter, canvas, animateBtn, typeSelect;
  
  let animating = false;
  let rafId = null;
  let lastTime = 0;
  let frameCount = 0;
  let startTime = 0;
  
  // WebGPU state
  let device = null;
  let context = null;
  let format = null;
  let linePipeline = null;
  let bandPipeline = null;
  let uniformBuffer = null;
  let bindGroup = null;
  let lineBuffer = null;
  let scatterBuffer = null;
  let bandBuffer = null;
  
  // Pre-generated data counts
  const LINE_COUNT = 100000;
  const SCATTER_COUNT = 100000;
  const BAND_COUNT = 50000;
  
  // Shader with GPU-based animation using time uniform
  const LINE_SHADER = `
    struct Uniforms {
      scale: vec2<f32>,
      translate: vec2<f32>,
      color: vec4<f32>,
      time: f32,
      amplitude: f32,
      frequency: f32,
      _pad: f32,
    };
    
    @group(0) @binding(0) var<uniform> u: Uniforms;
    
    @vertex
    fn vs_main(@location(0) pos: vec2<f32>) -> @builtin(position) vec4<f32> {
      // Animate Y position based on X and time
      let animatedY = pos.y + sin(pos.x * u.frequency + u.time) * u.amplitude;
      let transformed = vec2<f32>(pos.x, animatedY) * u.scale + u.translate;
      return vec4<f32>(transformed, 0.0, 1.0);
    }
    
    @fragment
    fn fs_main() -> @location(0) vec4<f32> {
      return u.color;
    }
  `;
  
  function generateLineData() {
    const data = new Float32Array(LINE_COUNT * 2);
    for (let i = 0; i < LINE_COUNT; i++) {
      data[i * 2] = i / (LINE_COUNT - 1);
      data[i * 2 + 1] = 0.5;  // Base Y, animation in shader
    }
    return data;
  }
  
  function generateScatterData() {
    const data = new Float32Array(SCATTER_COUNT * 2);
    for (let i = 0; i < SCATTER_COUNT; i++) {
      data[i * 2] = i / (SCATTER_COUNT - 1);
      data[i * 2 + 1] = 0.5;  // Base Y like line, animation in shader
    }
    return data;
  }
  
  function generateBandData() {
    const data = new Float32Array(BAND_COUNT * 4);
    for (let i = 0; i < BAND_COUNT; i++) {
      const x = i / (BAND_COUNT - 1);
      data[i * 4] = x;
      data[i * 4 + 1] = 0.45;  // Lower edge
      data[i * 4 + 2] = x;
      data[i * 4 + 3] = 0.55;  // Upper edge
    }
    return data;
  }
  
  async function init() {
    if (!navigator.gpu) {
      status.className = 'status error';
      status.textContent = '❌ WebGPU not available';
      animateBtn.disabled = true;
      return;
    }
    
    try {
      status.textContent = '🔄 Initializing...';
      
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) throw new Error('No WebGPU adapter found');
      
      device = await adapter.requestDevice();
      context = canvas.getContext('webgpu');
      format = navigator.gpu.getPreferredCanvasFormat();
      
      // Set canvas size
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      context.configure({ device, format, alphaMode: 'premultiplied' });
      
      // Create shader module
      const module = device.createShaderModule({ code: LINE_SHADER });
      
      // Create bind group layout and uniform buffer
      const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        }],
      });
      
      // 48 bytes = 12 floats for all uniforms
      uniformBuffer = device.createBuffer({
        size: 48,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      
      bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      });
      
      const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
      
      // Line pipeline (line-strip)
      linePipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module,
          entryPoint: 'vs_main',
          buffers: [{
            arrayStride: 8,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
          }],
        },
        fragment: {
          module,
          entryPoint: 'fs_main',
          targets: [{ 
            format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
          }],
        },
        primitive: { topology: 'line-strip' },
      });
      
      // Band pipeline (triangle-strip)
      bandPipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module,
          entryPoint: 'vs_main',
          buffers: [{
            arrayStride: 8,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
          }],
        },
        fragment: {
          module,
          entryPoint: 'fs_main',
          targets: [{ 
            format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
          }],
        },
        primitive: { topology: 'triangle-strip' },
      });
      
      // Pre-generate all data buffers ONCE
      const lineData = generateLineData();
      lineBuffer = device.createBuffer({
        size: lineData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(lineBuffer, 0, lineData);
      
      const scatterData = generateScatterData();
      scatterBuffer = device.createBuffer({
        size: scatterData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(scatterBuffer, 0, scatterData);
      
      const bandData = generateBandData();
      bandBuffer = device.createBuffer({
        size: bandData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(bandBuffer, 0, bandData);
      
      status.className = 'status success';
      status.textContent = '✅ WebGPU Active';
      startTime = performance.now();
      instance.device = device;  // Track for cleanup
      
      // Initial render
      render();
      
      animateBtn.addEventListener('click', () => {
        animating = !animating;
        animateBtn.textContent = animating ? '⏸ Pause' : '▶ Animate';
        if (animating) {
          lastTime = performance.now();
          requestAnimationFrame(renderLoop);
        }
      });
      
      typeSelect.addEventListener('change', () => {
        if (!animating) render();
      });
      
    } catch (e) {
      status.className = 'status error';
      status.textContent = '❌ Error: ' + e.message;
      console.error(e);
      animateBtn.disabled = true;
    }
  }
  
  function render() {
    if (!device) return;
    
    const now = performance.now();
    const time = (now - startTime) * 0.002;
    
    const type = typeSelect.value;
    let buffer, count, pipeline, color, amplitude, frequency;
    
    if (type === 'line') {
      buffer = lineBuffer;
      count = LINE_COUNT;
      pipeline = linePipeline;
      color = [0, 0.83, 1, 1]; // cyan
      amplitude = 0.2;
      frequency = 20.0;
    } else if (type === 'scatter') {
      buffer = scatterBuffer;
      count = SCATTER_COUNT;
      pipeline = linePipeline;
      color = [1, 0.4, 0.8, 1]; // magenta
      amplitude = 0.1;
      frequency = 30.0;
    } else { // band
      buffer = bandBuffer;
      count = BAND_COUNT * 2;
      pipeline = bandPipeline;
      color = [0.29, 0.87, 0.5, 0.6]; // green
      amplitude = 0.15;
      frequency = 15.0;
    }
    
    // Update uniforms
    const uniforms = new Float32Array([
      2, 2,           // scale
      -1, -1,         // translate
      ...color,       // color (4)
      time,           // time
      amplitude,      // amplitude
      frequency,      // frequency
      0               // padding
    ]);
    device.queue.writeBuffer(uniformBuffer, 0, uniforms);
    
    // Render
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.02, g: 0.02, b: 0.05, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, buffer);
    pass.draw(count);
    pass.end();
    
    device.queue.submit([encoder.finish()]);
  }
  
  function renderLoop(now) {
    if (!animating) return;
    
    frameCount++;
    if (now - lastTime >= 1000) {
      fpsCounter.textContent = `${frameCount} FPS`;
      frameCount = 0;
      lastTime = now;
    }
    
    render();
    rafId = requestAnimationFrame(renderLoop);
    instance.rafId = rafId;  // Track for cleanup
  }
  
  // Wait for VitePress to fully render the DOM, then assign references
  function waitForElements() {
    const checkElements = () => {
      const s = document.getElementById('gpu-status');
      const c = document.getElementById('demo-canvas');
      if (s && c) {
        // Assign DOM references NOW that they exist
        status = s;
        canvas = c;
        fpsCounter = document.getElementById('fps-counter');
        animateBtn = document.getElementById('animate-btn');
        typeSelect = document.getElementById('series-type');
        init();
      } else {
        // Retry after a short delay (VitePress may still be hydrating)
        setTimeout(checkElements, 100);
      }
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkElements);
    } else {
      // Give VitePress time to hydrate
      setTimeout(checkElements, 50);
    }
  }
  
  waitForElements();
}
</script>

## Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| **Line Charts** | Line rendering with LINE_STRIP |
| **Scatter Plots** | Points with 8 SDF symbols |
| **Band/Area** | Area fill between curves |
| **Bar Charts** | Bar charts |
| **Heatmaps** | Heatmaps with colormap |
| **Step Charts** | Step charts |
| **Multi Y-Axis** | Support for multiple Y axes |
| **Compute Shaders** | Stats, bounds, downsample, peaks |
| **Instanced Rendering** | For ultra-large datasets |

## Basic Usage

```typescript
import { createGpuRenderer } from 'scichart-engine/gpu';

// Auto-select the best available backend
const renderer = await createGpuRenderer(canvas, {
  backend: 'auto',  // 'webgpu' | 'webgl' | 'auto'
  powerPreference: 'high-performance'
});

if (renderer) {
  // Create data buffer
  renderer.createBuffer('myLine', new Float32Array([
    0, 0,   // point 1
    1, 0.5, // point 2
    2, 1,   // point 3
  ]));
  
  // Render
  renderer.render([{
    id: 'myLine',
    type: 'line',
    visible: true,
    style: { color: '#00d4ff' }
  }], {
    bounds: { xMin: 0, xMax: 2, yMin: 0, yMax: 1 }
  });
  
  console.log('Backend:', renderer.activeBackend); // "webgpu" or "webgl"
}
```

## Low-Level API

```typescript
import { WebGPUBackend } from 'scichart-engine/gpu';

const backend = new WebGPUBackend(canvas);
await backend.init();

backend.setViewport({ width: 800, height: 400, dpr: devicePixelRatio });
backend.createOrUpdateBuffer('vertices', vertexData, { usage: 'vertex' });
backend.renderWithBounds(drawList, frameUniforms, bounds);
backend.destroy();
```

## Architecture

```
src/gpu/
├── index.ts              # Main exports
├── types.ts              # Backend-agnostic types
├── adapter/              # GpuRenderer facade
├── resources/            # Buffer/Texture stores
├── compute/              # GPU Compute shaders
├── benchmark/            # Performance tools
└── backends/
    ├── webgpu/           # WebGPU implementation
    └── webgl/            # WebGL fallback
```

## Next Steps

- **[GPU Comparison](/examples/gpu-comparison)** - WebGPU vs WebGL
- **[GPU Benchmark](/examples/benchmark)** - Benchmark tools
- **[GPU Compute](/examples/gpu-compute)** - Compute shaders
