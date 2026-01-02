# Tooltips Showcase

Explore the power and versatility of the SciChart Engine's new tooltip system. This demo showcases different themes, templates, and interaction modes.

<ChartDemo type="tooltips" />

## Interactive Features

### 1. Data Point Snap
Hover near any data point to see the "Snap" behavior. The tooltip automatically finds the nearest data point and anchors itself with a smooth arrow.

### 2. Multi-Series Crosshair
Toggle the **Crosshair Mode** in the demo to see how the engine can interpolate values across multiple series simultaneously at a single vertical position.

### 3. Glassmorphism & Themes
Built-in themes include:
- **Dark/Light**: Classic professional look.
- **Glass**: Translucent background with hardware-accelerated backdrop blur.
- **Electrochemistry**: Optimized for scientific workstations.
- **Neon**: Deep blacks and high-vibrancy glow.

### 4. Heatmap Integration
Move your cursor over the heatmap demo below to see cell-specific Z-values and automatic color-scale matching.

## Customization Example

You can easily register custom templates to match your application's branding or data requirements.

```typescript
chart.tooltip.registerTemplate('simple', {
  id: 'simple',
  supportedTypes: ['datapoint'],
  measure: (ctx, data, theme) => ({ width: 80, height: 25, padding: theme.padding }),
  render: (ctx, data, pos, theme) => {
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillText(`${data.dataY.toFixed(2)}`, pos.x, pos.y);
  }
});
```

## Performance
The tooltip system is optimized for high-performance charts:
- **Canvas-based Rendering**: Avoids DOM overhead when displaying frequent updates.
- **Binary Search Hit-Testing**: Even with millions of points, finding the nearest point takes logarithmic time.
- **Measurement Caching**: Computed layouts are cached to reduce expensive `measureText` calls.
