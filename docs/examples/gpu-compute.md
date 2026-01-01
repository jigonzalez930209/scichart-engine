---
title: GPU Compute
description: GPU-accelerated data analysis with WebGPU compute shaders
---

# GPU Compute

> ⚠️ **WebGPU only** - This functionality requires WebGPU.

`GpuCompute` provides GPU-accelerated data analysis using WebGPU compute shaders.

## Support Status

<div id="compute-status" class="status-box">
  <span id="status-indicator">🔄 Checking WebGPU...</span>
</div>

<style>
.status-box {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
}

.status-box.available {
  background: #5cb85c22;
  border: 1px solid #5cb85c;
}

.status-box.unavailable {
  background: #d9534f22;
  border: 1px solid #d9534f;
}
</style>

<script>
if (typeof window !== 'undefined') {
  function checkStatus() {
    var status = document.getElementById('compute-status');
    var indicator = document.getElementById('status-indicator');
    
    if (!status || !indicator) {
      // Retry - VitePress may still be hydrating
      setTimeout(checkStatus, 100);
      return;
    }
    
    (async function() {
      if (!navigator.gpu) {
        status.className = 'status-box unavailable';
        indicator.textContent = '❌ WebGPU not available in this browser';
      } else {
        try {
          var adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            status.className = 'status-box available';
            indicator.textContent = '✅ WebGPU available - GPU Compute supported';
          } else {
            status.className = 'status-box unavailable';
            indicator.textContent = '❌ No GPU adapter found';
          }
        } catch (e) {
          status.className = 'status-box unavailable';
          indicator.textContent = '❌ Error: ' + e.message;
        }
      }
    })();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkStatus);
  } else {
    setTimeout(checkStatus, 50);
  }
}
</script>

## Features

- **Statistics** - Min, max, mean, std on GPU
- **Bounds** - X/Y bounds calculation for 2D data
- **Downsampling** - Min-max downsampling on GPU
- **Peak Detection** - Peak detection on GPU

## Basic Usage

```typescript
import { GpuCompute } from 'scichart-engine/gpu';

if (GpuCompute.isSupported()) {
  const compute = new GpuCompute();
  await compute.init();
  
  const stats = await compute.calculateStats(data);
  console.log('Min:', stats.min);
  console.log('Max:', stats.max);
  console.log('Mean:', stats.mean);
  console.log('Std:', stats.std);
  
  compute.destroy();
}
```

## API Reference

### calculateStats

```typescript
interface DataStats {
  min: number;
  max: number;
  mean: number;
  std: number;
  count: number;
}

const stats = await compute.calculateStats(data);
```

### calculateBounds

```typescript
interface DataBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const bounds = await compute.calculateBounds(points);
```

### downsample

```typescript
// Downsample 1M points to ~10K while preserving peaks
const reduced = await compute.downsample(points, 10000);
```

### detectPeaks

```typescript
interface Peak { 
  index: number; 
  value: number; 
}

const peaks = await compute.detectPeaks(data, {
  threshold: 0.5,
  minDistance: 10,
});
```

## Performance

| Operation | CPU (1M pts) | GPU (1M pts) | Speedup |
|-----------|--------------|--------------|---------|
| Stats | ~50ms | ~5ms | **10x** |
| Bounds | ~30ms | ~3ms | **10x** |
| Downsample | ~100ms | ~8ms | **12x** |
| Peak detect | ~200ms | ~15ms | **13x** |

*Approximate results on a mid-range GPU*

## Full Example

```typescript
import { GpuCompute } from 'scichart-engine/gpu';

async function analyzeData(data: Float32Array) {
  if (!GpuCompute.isSupported()) {
    console.warn('WebGPU not available');
    return null;
  }
  
  const compute = new GpuCompute();
  
  try {
    await compute.init();
    
    // Statistics
    const stats = await compute.calculateStats(data);
    console.log('Stats:', stats);
    
    // Detect peaks
    const peaks = await compute.detectPeaks(data, {
      threshold: stats.mean + stats.std,
      minDistance: 5,
    });
    console.log('Found', peaks.length, 'peaks');
    
    return { stats, peaks };
  } finally {
    compute.destroy();
  }
}
```

## Limitations

1. **WebGPU only** - Not available in browsers without WebGPU
2. **Memory transfer** - CPU↔GPU transfer has overhead
3. **Small datasets** - For fewer than 10K points, CPU may be faster
4. **Precision** - Float32 on GPU vs Float64 in JavaScript

## CPU Fallback

```typescript
import { calculateStats, detectPeaks } from 'scichart-engine';

if (!GpuCompute.isSupported()) {
  const stats = calculateStats(Array.from(data));
  const peaks = detectPeaks(Array.from(data), { threshold: 0.5 });
}
```

## Next Steps

- **[WebGPU Overview](/examples/webgpu)** - Introduction
- **[GPU Benchmark](/examples/benchmark)** - Compare performance
- **[GPU Comparison](/examples/gpu-comparison)** - WebGPU vs WebGL
