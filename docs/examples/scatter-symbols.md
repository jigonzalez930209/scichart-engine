---
title: Scatter Symbols Demo
description: Interactive demo showcasing multiple scatter marker shapes
---

# Scatter Symbols Demo

This demo showcases the high-performance WebGL-rendered scatter symbols available in SciChart Engine. Each symbol is rendered using optimal GPU fragment shaders for maximum sharpness and performance.

## Interactive Example

<ChartDemo type="symbols" height="500px" />

## Available Symbols

You can choose from the following built-in symbols:

- `circle` - Standard circular marker
- `square` - Basic square marker
- `diamond` - Diamond-shaped marker
- `triangle` - Upwardward-pointing triangle
- `triangleDown` - Downward-pointing triangle
- `cross` - Plus (+) shaped cross
- `x` - X-shaped cross
- `star` - Five-pointed star

## How to use

Simply specify the `symbol` and `pointSize` in the series `style`:

```typescript
chart.addSeries({
  id: 'my-series',
  type: 'scatter',
  data: { x, y },
  style: {
    symbol: 'star',
    pointSize: 10,
    color: '#00f2ff'
  }
});
```

## Performance Note

All symbols are rendered using **Signed Distance Fields (SDF)**. Unlike sprite-based systems, SDF rendering ensures:
1. **Pixel-perfect scaling**: Symbols never look blurry regardless of size or screen resolution.
2. **Infinite points**: You can render millions of points with complex shapes without hitting texture memory limits.
3. **Consistency**: All shapes are mathematically defined for consistent appearance across different devices.
