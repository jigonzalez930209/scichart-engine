# Tooltip System API Reference

The SciChart Engine features a high-performance, customizable tooltip system designed for scientific data visualization. It supports multiple tooltip types, professional themes, and extensible templates.

## Quick Start

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  tooltip: {
    enabled: true,
    theme: 'glass',
    showDelay: 100,
    followCursor: true,
    dataPoint: {
      snapToPoint: true,
      hitRadius: 20
    }
  }
});
```

## Tooltip Options

The system is configured via the `tooltip` property in `ChartOptions`.

| Property | Type | Default | Description |
| :------- | :--- | :------ | :---------- |
| `enabled` | `boolean` | `true` | Globally enable/disable tooltips. |
| `theme` | `TooltipThemeName \| Partial<TooltipTheme>` | `'dark'` | Visual style of the tooltips. |
| `showDelay` | `number` | `50` | Delay in ms before showing a tooltip. |
| `hideDelay` | `number` | `100` | Delay in ms before hiding a tooltip. |
| `followCursor` | `boolean` | `false` | Whether the tooltip should follow the mouse. |
| `dataPoint` | `DataPointTooltipOptions` | - | Configuration for point-hover tooltips. |
| `crosshair` | `CrosshairTooltipOptions` | - | Configuration for multi-series vertical tooltips. |
| `heatmap` | `HeatmapTooltipOptions` | - | Configuration for heatmap cell tooltips. |
| `annotation` | `AnnotationTooltipOptions` | - | Configuration for annotation hovers. |
| `range` | `RangeTooltipOptions` | - | Configuration for range statistics. |

### DataPointTooltipOptions

| Property | Type | Default | Description |
| :------- | :--- | :------ | :---------- |
| `enabled` | `boolean` | `true` | Enable tooltips on individual points. |
| `snapToPoint` | `boolean` | `true` | Snap the tooltip to the nearest data point. |
| `hitRadius` | `number` | `20` | Hotspot radius in pixels for detection. |
| `templateId` | `string` | `'default'` | Template to use for rendering. |

## Built-in Templates

Choose the right template for your data visualization needs:

- `'default'`: Professional multi-line display with series indicator and header.
- `'minimal'`: Compact single-line values for high-density charts.
- `'scientific'`: High-precision unicode notation (e.g., 6.022 × 10²³).
- `'crosshair'`: Optimized for vertical tracking across multiple series.
- `'heatmap'`: Specialized for Z-values with color swatches and scales.
- `'annotation'`: Displays labels and values for markers, lines, and bands.
- `'range'`: Rich statistical summary (min, max, mean, count) for data regions.

## Built-in Themes

- `'dark'`: Elegant dark theme (default).
- `'light'`: Clean professional light theme.
- `'glass'`: Modern translucent design with backdrop blur.
- `'midnight'`: Deep blue tones for dark mode enthusiasts.
- `'electrochemistry'`: High-contrast scientific UI with mono fonts.
- `'neon'`: Vibrant glowing effect.
- `'minimal'`: Ultra-compact for high-density dashboards.

## Custom Templates

You can create custom templates by implementing the `TooltipTemplate` interface and registering it with the manager.

```typescript
class MyTemplate implements TooltipTemplate<DataPointTooltip> {
  id = 'my-custom';
  supportedTypes = ['datapoint'];

  measure(ctx, data, theme) {
    return { width: 100, height: 50, padding: theme.padding };
  }

  render(ctx, data, position, theme) {
    ctx.fillStyle = 'red';
    ctx.fillRect(position.x, position.y, 100, 50);
  }
}

chart.tooltip.registerTemplate('my-custom', new MyTemplate());
```

## Programmatic Control

You can control tooltips via the `chart.tooltip` API.

```typescript
// Show a manual tooltip
chart.tooltip.show({
  type: 'datapoint',
  seriesId: 'main',
  seriesName: 'Sensor A',
  dataX: 10.5,
  dataY: 42.1,
  pixelX: 200,
  pixelY: 150
}, { duration: 3000 });

// Hide all tooltips
chart.tooltip.hideAll();

// Change configuration
chart.tooltip.configure({ theme: 'midnight' });
```

## Performance Tips

1. **Snap to Point**: Enabling `snapToPoint` is efficient as it uses the chart's optimized hit-testing.
2. **Templates**: Use simple templates for very dense data.
3. **Themes**: Themes with `backdropBlur` (like `glass`) are more GPU-intensive on some browsers.
