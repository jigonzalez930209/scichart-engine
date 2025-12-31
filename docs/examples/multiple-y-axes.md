---
title: Multiple Y-Axes
description: Display multiple data series with independent Y-axis scales
---

# Multiple Y-Axes

SciChart Engine supports multiple Y-axes, allowing you to plot series with different units or vastly different ranges on the same chart. Each series can be associated with a specific Y-axis using the `yAxisId` property.

## Interactive Example

In this example, the **cyan** series is plotted against the left axis (µA), while the **red** series uses the right axis (V). Note how both axes auto-scale independently and remain aligned with their respective data.

<ChartDemo type="multi-axis" height="500px" />

## Implementation

To use multiple Y-axes, follow these two steps:

### 1. Configure axes in ChartOptions

Pass an array of `AxisOptions` to the `yAxis` property. Each axis must have a unique `id` and can specify a `position` ('left' or 'right').

```typescript
const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'Time (s)', auto: true },
  yAxis: [
    { id: 'current-axis', label: 'Current (µA)', position: 'left' },
    { id: 'voltage-axis', label: 'Potential (V)', position: 'right' }
  ],
  theme: 'midnight'
});
```

### 2. Link series to axes

When adding a series, specify the `yAxisId` of the target axis. If omitted, the series will use the first (primary) Y-axis.

```typescript
// Link to left axis
chart.addSeries({
  id: 'current-data',
  type: 'line',
  yAxisId: 'current-axis',
  data: { x: time, y: current },
  style: { color: '#00f2ff' }
});

// Link to right axis
chart.addSeries({
  id: 'voltage-data',
  type: 'line',
  yAxisId: 'voltage-axis',
  data: { x: time, y: voltage },
  style: { color: '#ff6b6b' }
});
```

## Key Features

- **Independent Auto-scaling**: Each axis calculates its own data bounds and applies its own auto-scale padding.
- **Positioning**: Place axes on either the 'left' or 'right' side of the plot area.
- **Automatic Offsets**: When multiple axes are placed on the same side, they are automatically offset to prevent overlap.
- **Unified Interaction**: Panning and zooming horizontally affects all series, while vertical interactions currently sync with the primary axis.
