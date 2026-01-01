---
title: WebGPU vs WebGL Comparison
description: Side-by-side performance comparison between WebGPU and WebGL backends
---

# WebGPU vs WebGL Comparison

This page compares the two rendering backends available in SciChart Engine.

## Status in your browser

<div id="support-grid" class="support-grid">
  <div class="support-item" id="webgl-support">
    <h4>🔵 WebGL</h4>
    <span id="webgl-status">Checking...</span>
  </div>
  <div class="support-item" id="webgpu-support">
    <h4>🟣 WebGPU</h4>
    <span id="webgpu-status">Checking...</span>
  </div>
</div>

<style>
.support-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
}

.support-item {
  background: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.support-item h4 {
  margin: 0 0 0.5rem 0;
}

.support-item.available {
  background: #5cb85c22;
  border: 1px solid #5cb85c;
}

.support-item.unavailable {
  background: #d9534f22;
  border: 1px solid #d9534f;
}
</style>

<script>
if (typeof window !== 'undefined') {
  setTimeout(async function() {
    // WebGL check
    var webglItem = document.getElementById('webgl-support');
    var webglStatus = document.getElementById('webgl-status');
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl');
      if (gl) {
        webglItem.className = 'support-item available';
        webglStatus.textContent = '✅ Available';
      } else {
        webglItem.className = 'support-item unavailable';
        webglStatus.textContent = '❌ Not available';
      }
    } catch (e) {
      webglItem.className = 'support-item unavailable';
      webglStatus.textContent = '❌ Error';
    }
    
    // WebGPU check
    var webgpuItem = document.getElementById('webgpu-support');
    var webgpuStatus = document.getElementById('webgpu-status');
    if (!navigator.gpu) {
      webgpuItem.className = 'support-item unavailable';
      webgpuStatus.textContent = '❌ Not available';
    } else {
      try {
        var adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          webgpuItem.className = 'support-item available';
          webgpuStatus.textContent = '✅ Available';
        } else {
          webgpuItem.className = 'support-item unavailable';
          webgpuStatus.textContent = '❌ No adapter';
        }
      } catch (e) {
        webgpuItem.className = 'support-item unavailable';
        webgpuStatus.textContent = '❌ Error';
      }
    }
  }, 100);
}
</script>

## Architecture Comparison

| Aspect | WebGL | WebGPU |
|---------|-------|--------|
| **Base API** | OpenGL ES 2.0 | Vulkan/Metal/DX12 |
| **Support** | 99%+ browsers | Chrome 113+, Edge 113+, Safari 17+ |
| **Compute Shaders** | ❌ No | ✅ Yes |
| **Pipeline Objects** | N/A | ✅ Pre-compiled |
| **Multi-threading** | ❌ No | ✅ Yes |

## Comparative Performance

| Points | WebGL | WebGPU | Improvement |
|--------|-------|--------|-------------|
| 10K | 60 fps | 60 fps | - |
| 100K | 60 fps | 60 fps | - |
| 1M | 45 fps | 58 fps | 1.3x |
| 5M | 15 fps | 45 fps | **3x** |
| 10M | 8 fps | 30 fps | **3.7x** |

*Typical results - vary based on hardware*

## When to Use Each Backend

### 🔵 WebGL

Recommended when:
- You need maximum browser compatibility
- The dataset is smaller than 100,000 points
- Current performance is sufficient
- You don't need compute shaders

### 🟣 WebGPU

Recommended when:
- You need maximum performance
- You work with datasets larger than 1,000,000 points
- You need compute shaders (GPU analysis)
- Users have modern browsers

## Example Code

### Automatic Selection

```typescript
import { createGpuRenderer } from 'scichart-engine/gpu';

// Auto-selects WebGPU if available, otherwise WebGL
const renderer = await createGpuRenderer(canvas, {
  backend: 'auto',
  powerPreference: 'high-performance'
});

console.log('Active backend:', renderer?.activeBackend);
```

### Force Specific Backend

```typescript
// Force WebGPU
const gpuRenderer = await createGpuRenderer(canvas, { 
  backend: 'webgpu' 
});

// Force WebGL
const glRenderer = await createGpuRenderer(canvas, { 
  backend: 'webgl' 
});
```

## Next Steps

- **[WebGPU Overview](/examples/webgpu)** - Full WebGPU guide
- **[GPU Benchmark](/examples/benchmark)** - Benchmark tools
- **[GPU Compute](/examples/gpu-compute)** - Compute shaders
