# Heatmaps API

Heatmaps visualize 3D data (X, Y, and Z intensity) as a 2D colored grid. They are extremely efficient for large matrices.

## Adding a Heatmap

Use the `addHeatmap` method to add a heatmap series.

```typescript
chart.addHeatmap({
  id: 'surface-data',
  data: {
    xValues: [0, 1, 2],
    yValues: [0, 1, 2],
    zValues: [
      10, 20, 30, // Y=0 (X=0, 1, 2)
      15, 25, 35, // Y=1 (X=0, 1, 2)
      20, 30, 40  // Y=2 (X=0, 1, 2)
    ]
  },
  style: {
    colorScale: {
      name: 'viridis',
      min: 0,
      max: 50
    },
    interpolation: 'bilinear'
  }
});
```

## HeatmapOptions

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier. |
| `type` | `'heatmap'` | Must be `'heatmap'`. |
| `data` | `HeatmapData` | Grid coordinates and Z values. |
| `style` | `HeatmapStyle` | Colormap and interpolation settings. |

## HeatmapData

| Property | Type | Description |
|----------|------|-------------|
| `xValues` | `number[] \| TypedArray` | X coordinates for each column (Length: W). |
| `yValues` | `number[] \| TypedArray` | Y coordinates for each row (Length: H). |
| `zValues` | `number[] \| TypedArray` | Flattened 1D matrix in row-major order (Length: W * H). |

## HeatmapStyle

| Property | Type | Description |
|----------|------|-------------|
| `colorScale` | `ColorScale` | Mapping of Z values to colors. |
| `interpolation` | `'nearest' \| 'bilinear'` | Rendering mode (default: `'bilinear'`). |
| `opacity` | `number` | Overall layer transparency. |
| `showColorbar` | `boolean` | Whether to display a color legend. |

## ColorScale

| Property | Type | Description |
|----------|------|-------------|
| `name` | `ColorScaleName` | Predefined colormap (e.g., `'viridis'`, `'plasma'`, `'jet'`). |
| `min` | `number` | Value mapped to the lowest color. |
| `max` | `number` | Value mapped to the highest color. |
| `logScale` | `boolean` | Use logarithmic color mapping (Coming soon). |
