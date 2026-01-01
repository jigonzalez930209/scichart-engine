---
title: WebGPU Showcase
description: A gallery of high-performance rendering examples using WebGPU
---

# WebGPU Showcase

Explore SciChart Engine's high-performance rendering capabilities with WebGPU.

<div id="gallery-container" class="gallery-container">
  <div class="gallery-sidebar">
    <button class="demo-btn active" data-demo="line">📈 1M Points Line</button>
    <button class="demo-btn" data-demo="scatter">✨ 100K Star Scatter</button>
    <button class="demo-btn" data-demo="heatmap">🔥 Dynamic Heatmap</button>
  </div>
  <div class="gallery-content">
    <div class="demo-header">
      <h3 id="demo-title">1M Points Line</h3>
      <div class="demo-stats">
        <span id="fps-counter">60 FPS</span>
        <span id="backend-label">WEBGPU</span>
      </div>
    </div>
    <div class="canvas-container">
      <canvas id="gallery-canvas" width="800" height="500"></canvas>
    </div>
    <p id="demo-description">Rendering 1 million points with smooth animation using WebGPU</p>
  </div>
</div>

<style>
.gallery-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
}

.gallery-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.demo-btn {
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.demo-btn:hover {
  border-color: var(--vp-c-brand);
}

.demo-btn.active {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.gallery-content {
  display: flex;
  flex-direction: column;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.demo-header h3 {
  margin: 0;
}

.demo-stats {
  display: flex;
  gap: 0.5rem;
}

.demo-stats span {
  padding: 0.25rem 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  border: 1px solid var(--vp-c-divider);
}

.canvas-container {
  background: #05050a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  aspect-ratio: 16/10;
}

#gallery-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

#demo-description {
  margin-top: 1rem;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .gallery-container {
    grid-template-columns: 1fr;
  }
}
</style>

<script type="module">
// Optimized WebGPU Showcase - Animation in GPU shader
if (typeof window !== 'undefined') {
  // Guard against multiple instances (VitePress hot-reload)
  const INSTANCE_KEY = '__gpu_showcase_instance__';
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
  let canvas, buttons, title, desc, fpsLabel, backendLabel;
  
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
  let currentDemo = 'line';
  let rafId = null;
  let frameCount = 0;
  let lastTime = 0;
  let startTime = 0;
  
  // Pre-generated data counts
  const LINE_COUNT = 100000;  // 100K points for smooth 60fps
  const SCATTER_COUNT = 50000;
  const BAND_COUNT = 25000;
  
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
  
  const demos = {
    line: {
      name: '100K Points Line',
      description: 'Rendering 100,000 points at 60 FPS with GPU-animated sine wave using WebGPU.'
    },
    scatter: {
      name: '50K Wave Pattern',
      description: '50,000 points with high-frequency oscillation, animated entirely on the GPU.'
    },
    heatmap: {
      name: 'Dynamic Band',
      description: '50,000 vertices creating a dynamic area fill with GPU-driven animation.'
    }
  };
  
  function generateLineData() {
    const data = new Float32Array(LINE_COUNT * 2);
    for (let i = 0; i < LINE_COUNT; i++) {
      data[i * 2] = i / (LINE_COUNT - 1);  // X: 0 to 1
      data[i * 2 + 1] = 0.5;  // Base Y (animation in shader)
    }
    return data;
  }
  
  function generateScatterData() {
    const data = new Float32Array(SCATTER_COUNT * 2);
    for (let i = 0; i < SCATTER_COUNT; i++) {
      data[i * 2] = i / (SCATTER_COUNT - 1);
      data[i * 2 + 1] = 0.5 + Math.sin(i * 0.7) * 0.15;  // Static high-freq pattern
    }
    return data;
  }
  
  function generateBandData() {
    const data = new Float32Array(BAND_COUNT * 4);
    for (let i = 0; i < BAND_COUNT; i++) {
      const x = i / (BAND_COUNT - 1);
      data[i * 4] = x;
      data[i * 4 + 1] = 0.4;  // Lower edge (animated in shader)
      data[i * 4 + 2] = x;
      data[i * 4 + 3] = 0.6;  // Upper edge (animated in shader)
    }
    return data;
  }
  
  async function initWebGPU() {
    if (!navigator.gpu) {
      backendLabel.textContent = 'NO WEBGPU';
      backendLabel.style.color = '#ff6666';
      return false;
    }
    
    try {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) throw new Error('No adapter');
      
      device = await adapter.requestDevice();
      context = canvas.getContext('webgpu');
      format = navigator.gpu.getPreferredCanvasFormat();
      
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      context.configure({ device, format, alphaMode: 'premultiplied' });
      
      const module = device.createShaderModule({ code: LINE_SHADER });
      
      const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        }],
      });
      
      // Larger uniform buffer for time and animation params (48 bytes = 12 floats)
      uniformBuffer = device.createBuffer({
        size: 48,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      
      bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      });
      
      const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
      
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
      
      backendLabel.textContent = 'WEBGPU';
      backendLabel.style.color = '#00ff88';
      startTime = performance.now();
      instance.device = device;  // Track for cleanup
      return true;
    } catch (e) {
      console.error(e);
      backendLabel.textContent = 'ERROR';
      backendLabel.style.color = '#ff6666';
      return false;
    }
  }
  
  function render() {
    if (!device) return;
    
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      fpsLabel.textContent = `${frameCount} FPS`;
      frameCount = 0;
      lastTime = now;
    }
    
    const time = (now - startTime) * 0.002;  // Time in "shader units"
    
    let buffer, count, pipeline, color, amplitude, frequency;
    
    if (currentDemo === 'line') {
      buffer = lineBuffer;
      count = LINE_COUNT;
      pipeline = linePipeline;
      color = [0, 0.83, 1, 1];
      amplitude = 0.3;
      frequency = 20.0;
    } else if (currentDemo === 'scatter') {
      buffer = scatterBuffer;
      count = SCATTER_COUNT;
      pipeline = linePipeline;
      color = [1, 0.4, 0.8, 1];
      amplitude = 0.15;
      frequency = 50.0;
    } else { // heatmap/band
      buffer = bandBuffer;
      count = BAND_COUNT * 2;
      pipeline = bandPipeline;
      color = [1, 0.3, 0.1, 0.7];
      amplitude = 0.15;
      frequency = 15.0;
    }
    
    // Update uniforms: scale(2) + translate(2) + color(4) + time + amplitude + frequency + pad
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
    
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        clearValue: { r: 0.02, g: 0.02, b: 0.04, a: 1 },
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
    
    rafId = requestAnimationFrame(render);
    instance.rafId = rafId;  // Track for cleanup
  }
  
  function loadDemo(id) {
    currentDemo = id;
    title.textContent = demos[id].name;
    desc.textContent = demos[id].description;
  }
  
  function setupButtonListeners() {
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadDemo(btn.dataset.demo);
      });
    });
  }
  
  // Initialize
  async function start() {
    const ok = await initWebGPU();
    if (ok) {
      setupButtonListeners();
      loadDemo('line');
      lastTime = performance.now();
      render();
    }
  }
  
  // Wait for VitePress to fully render the DOM, then assign references
  function waitForElements() {
    const checkElements = () => {
      const c = document.getElementById('gallery-canvas');
      const b = document.getElementById('backend-label');
      if (c && b) {
        // Assign DOM references NOW that they exist
        canvas = c;
        backendLabel = b;
        buttons = document.querySelectorAll('.demo-btn');
        title = document.getElementById('demo-title');
        desc = document.getElementById('demo-description');
        fpsLabel = document.getElementById('fps-counter');
        start();
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

