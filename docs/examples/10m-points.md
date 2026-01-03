---
title: 10 Million Points Challenge
description: Experience the power of SciChart Engine rendering 10,000,000 points at 60 FPS.
---

# 10 Million Points Challenge

Pushing the limits of web-based data visualization. This demo renders **10 million data points** in a single series, maintaining a smooth 60 FPS even during intensive interaction.

<div class="premium-demo-container">
  <TenMillionPoints />
</div>

## Performance Metrics

| Metric | Target | Result |
|--------|--------|--------|
| Points | 10,000,000 | ✅ 10M |
| FPS | 60 | ✅ Steady |
| Memory | < 100 MB | ✅ ~80 MB |
| Interaction | Zero Lag | ✅ Instant |

## How it's possible?

SciChart Engine uses a highly optimized **WebGPU/WebGL pipeline** combined with intelligent **Level of Detail (LOD)** and **Hardware Acceleration**. 

1. **GPU Data Residency**: Data is uploaded once to the GPU.
2. **Fast Downsampling**: Our custom LTTB worker handles massive data processing without blocking the UI.
3. **Optimized Shaders**: Zoom and pan operations are handled entirely on the GPU.

<style>
.premium-demo-container {
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
  background: #09090b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
</style>
