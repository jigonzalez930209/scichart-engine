---
title: Area Charts Demo
description: Area charts with fill from curve to baseline
---

# Area Chart Demo

Area charts display data as a filled region from the curve down to a baseline (typically y=0). They're ideal for visualizing cumulative quantities or emphasizing the magnitude of values.

## Interactive Example

The demo shows area charts with overlapping semi-transparent fills:

<ChartDemo type="area" height="500px" />

## Creating an Area Chart

```typescript
// Simple area chart (fills to y=0)
chart.addSeries({
  id: 'sensor-data',
  type: 'area',
  data: {
    x: timeValues,
    y: sensorReadings,
  },
  style: {
    color: 'rgba(0, 242, 255, 0.4)', // Semi-transparent fill
  }
});
```

## Key Differences vs Line Charts

| Feature | Line Chart | Area Chart |
|---------|------------|------------|
| Fill | No fill | Filled to y=0 |
| Use case | Trends, precision | Magnitude, cumulative |
| Visual weight | Light | Heavy |
| Overlapping data | Clear | Needs transparency |

## Stacked Areas (Multiple Series)

To create stacked areas, use semi-transparent colors and add series in back-to-front order:

```typescript
// Add background area first
chart.addSeries({
  id: 'total',
  type: 'area',
  data: { x, y: totalValues },
  style: { color: 'rgba(100, 100, 100, 0.3)' }
});

// Add foreground area
chart.addSeries({
  id: 'active',
  type: 'area',
  data: { x, y: activeValues },
  style: { color: 'rgba(0, 242, 255, 0.5)' }
});
```

## Styling Options

```typescript
chart.addSeries({
  id: 'data',
  type: 'area',
  data: { x, y },
  style: {
    color: 'rgba(255, 100, 100, 0.4)',  // Fill color with alpha
    width: 2,      // Optional: stroke width for top edge
    opacity: 0.8,  // Additional opacity multiplier
  }
});
```

## Use Cases

- **Physics**: Energy over time, power consumption
- **Finance**: Portfolio value, cumulative returns
- **Sensors**: Signal strength, temperature profiles
- **Web Analytics**: Page views, user sessions

## Technical Notes

Area charts use the same WebGL rendering as Band Series, with the baseline automatically set to y=0. This provides efficient GPU-accelerated rendering for large datasets.
