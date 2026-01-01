---
title: GPU Benchmark
description: Compare WebGPU vs WebGL rendering performance
---

# GPU Benchmark

Tools to compare WebGPU vs WebGL rendering performance on your system.

## Backend Status

<div id="backends-grid" class="backends-grid">
  <div class="backend-item" id="webgl-box">
    <h4>🔵 WebGL</h4>
    <span id="webgl-state">Checking...</span>
  </div>
  <div class="backend-item" id="webgpu-box">
    <h4>🟣 WebGPU</h4>
    <span id="webgpu-state">Checking...</span>
  </div>
</div>

<style>
.backends-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
}

.backend-item {
  background: var(--vp-c-bg-soft);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.backend-item h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.backend-item.ok {
  background: #5cb85c22;
  border: 1px solid #5cb85c;
}

.backend-item.no {
  background: #d9534f22;
  border: 1px solid #d9534f;
}
</style>

<script>
if (typeof window !== 'undefined') {
  setTimeout(async function() {
    var webglBox = document.getElementById('webgl-box');
    var webglState = document.getElementById('webgl-state');
    var webgpuBox = document.getElementById('webgpu-box');
    var webgpuState = document.getElementById('webgpu-state');
    
    // WebGL
    try {
      var c = document.createElement('canvas');
      if (c.getContext('webgl')) {
        webglBox.className = 'backend-item ok';
        webglState.textContent = '✅ Available';
      } else {
        webglBox.className = 'backend-item no';
        webglState.textContent = '❌ Not available';
      }
    } catch (e) {
      webglBox.className = 'backend-item no';
      webglState.textContent = '❌ Error';
    }
    
    // WebGPU
    if (!navigator.gpu) {
      webgpuBox.className = 'backend-item no';
      webgpuState.textContent = '❌ Not available';
    } else {
      try {
        var a = await navigator.gpu.requestAdapter();
        if (a) {
          webgpuBox.className = 'backend-item ok';
          webgpuState.textContent = '✅ Available';
        } else {
          webgpuBox.className = 'backend-item no';
          webgpuState.textContent = '❌ No adapter';
        }
      } catch (e) {
        webgpuBox.className = 'backend-item no';
        webgpuState.textContent = '❌ Error';
      }
    }
  }, 100);
}
</script>

## Programmatic Usage

```typescript
import { GpuBenchmark } from 'scichart-engine/gpu';

const benchmark = new GpuBenchmark(canvas);
const result = await benchmark.runComparison({
  pointCount: 100000,
  durationMs: 5000,
});

console.log('WebGPU FPS:', result.webgpu?.fps);
console.log('WebGL FPS:', result.webgl?.fps);
console.log('Winner:', result.winner);
console.log('Speedup:', result.speedup + 'x');
```

## API Reference

### BenchmarkOptions

```typescript
interface BenchmarkOptions {
  pointCount?: number;    // Default: 100000
  durationMs?: number;    // Default: 5000
  warmupFrames?: number;  // Default: 30
  onProgress?: (progress: number) => void;
}
```

### BenchmarkResult

```typescript
interface BenchmarkResult {
  backend: "webgpu" | "webgl";
  pointCount: number;
  fps: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  totalFrames: number;
  duration: number;
}
```

### Methods

```typescript
// Individual benchmark
const webgpuResult = await benchmark.benchmarkWebGPU(options);
const webglResult = await benchmark.benchmarkWebGL(options);

// Comparative benchmark
const comparison = await benchmark.runComparison(options);
// Returns: { webgpu, webgl, winner, speedup }

// Format result
console.log(GpuBenchmark.formatResult(result));
```

## Typical Results

| Points | WebGL | WebGPU | Improvement |
|--------|-------|--------|-------------|
| 10K | 60 fps | 60 fps | 1.0x |
| 100K | 60 fps | 60 fps | 1.0x |
| 1M | 45 fps | 58 fps | 1.3x |
| 5M | 15 fps | 45 fps | **3.0x** |
| 10M | 8 fps | 30 fps | **3.7x** |

*Results vary by hardware and browser*

## Important Notes

::: tip Warmup
The first 30 frames are discarded to allow the GPU to stabilize.
:::

::: warning Variability
Results may vary ±10% between runs. Run the benchmark multiple times to get consistent results.
:::

## Full Example

```typescript
import { GpuBenchmark } from 'scichart-engine/gpu';

async function runFullBenchmark() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  
  const benchmark = new GpuBenchmark(canvas);
  
  const pointCounts = [10000, 100000, 1000000];
  
  for (const count of pointCounts) {
    console.log(`\nBenchmark: ${count.toLocaleString()} points`);
    
    const result = await benchmark.runComparison({
      pointCount: count,
      durationMs: 3000,
      onProgress: (p) => {
        process.stdout.write(`\rProgress: ${Math.round(p * 100)}%`);
      }
    });
    
    console.log(`  WebGL:  ${result.webgl?.fps ?? 'N/A'} fps`);
    console.log(`  WebGPU: ${result.webgpu?.fps ?? 'N/A'} fps`);
    console.log(`  Winner: ${result.winner} (${result.speedup}x)`);
  }
}
```

## Next Steps

- **[WebGPU Overview](/examples/webgpu)** - Full guide
- **[GPU Comparison](/examples/gpu-comparison)** - Visual comparison
- **[GPU Compute](/examples/gpu-compute)** - Compute shaders
