# Bar Charts API

Bar charts are used for categorical data or discrete measurements. They support automatic width calculation and custom styling.

## Adding a Bar Series

You can add a bar series using the `addSeries` method with `type: 'bar'` or the `addBar` convenience method.

```typescript
chart.addBar({
  id: 'my-bars',
  data: {
    x: [1, 2, 3, 4],
    y: [10, 20, 15, 25]
  },
  style: {
    color: '#00f2ff',
    barWidth: 0.8
  }
});
```

## BarOptions

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the series. |
| `type` | `'bar'` | Must be `'bar'`. |
| `data` | `SeriesData` | X and Y coordinates. |
| `style` | `BarStyle` | Optional styling configuration. |
| `visible` | `boolean` | Visibility toggle (default: `true`). |

## BarStyle

| Property | Type | Description |
|----------|------|-------------|
| `color` | `string` | Fill color (CSS format). |
| `opacity` | `number` | Transparency (0.0 to 1.0). |
| `barWidth` | `number` | Width in data units. If omitted, it's auto-calculated. |
| `barGap` | `number` | Gap between bars (0.0 to 1.0) as fraction of width. |
| `barAlign` | `'center' \| 'edge'` | Alignment relative to X coordinate. |

## Automatic Width Calculation

The engine automatically determines the optimal bar width if `barWidth` is not provided. It calculates the minimum distance between adjacent X values and applies a default gap (20%) to avoid overlapping and maintain visual breathing room.
