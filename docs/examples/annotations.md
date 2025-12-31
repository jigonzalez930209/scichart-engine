---
title: Annotations Demo
description: Interactive demo showcasing chart annotations
---

# Annotations Demo

This demo showcases all annotation types available in SciChart Engine. The chart displays a cyclic voltammetry simulation with various annotations highlighting key features.

## Interactive Example

<ChartDemo type="annotations" height="500px" />

## Annotation Types Shown

- **Horizontal Lines** - Mark peak current values (anodic and cathodic)
- **Vertical Line** - Mark the half-wave potential (E½)
- **Band** - Highlight the redox region of interest
- **Text** - Add contextual information
- **Arrow** - Point to specific features

## Code

```typescript
import { createChart } from '@jigonzalez930209/scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  xAxis: { label: 'E / V', auto: true },
  yAxis: { label: 'I / A', auto: true },
  theme: 'midnight',
  showControls: true
});

// Add your data series
chart.addSeries({
  id: 'cv-data',
  type: 'line',
  data: { x: potentialData, y: currentData },
  style: { color: '#00f2ff', width: 1.5 }
});

// Horizontal line for anodic peak
chart.addAnnotation({
  type: 'horizontal-line',
  y: 3e-6,
  color: '#ff6b6b',
  lineWidth: 2,
  lineDash: [5, 5],
  label: 'Anodic Peak',
  labelPosition: 'right'
});

// Horizontal line for cathodic peak  
chart.addAnnotation({
  type: 'horizontal-line',
  y: -3e-6,
  color: '#4ecdc4',
  lineWidth: 2,
  lineDash: [5, 5],
  label: 'Cathodic Peak',
  labelPosition: 'right'
});

// Vertical line for E1/2
chart.addAnnotation({
  type: 'vertical-line',
  x: 0,
  color: '#a855f7',
  lineWidth: 2,
  lineDash: [3, 3],
  label: 'E½',
  labelPosition: 'top'
});

// Highlight region of interest
chart.addAnnotation({
  type: 'band',
  xMin: -0.3,
  xMax: 0.3,
  fillColor: 'rgba(168, 85, 247, 0.1)',
  label: 'Redox Region'
});

// Text annotation
chart.addAnnotation({
  type: 'text',
  x: 0.35,
  y: 4e-6,
  text: '📊 CV Scan #1',
  fontSize: 12,
  fontWeight: 'bold',
  backgroundColor: 'rgba(0,0,0,0.7)',
  padding: 6
});

// Arrow pointing to feature
chart.addAnnotation({
  type: 'arrow',
  x1: 0.4,
  y1: 2e-6,
  x2: 0.15,
  y2: 3.5e-6,
  color: '#ffe66d',
  lineWidth: 2,
  headSize: 8
});
```

## Use Cases

Annotations are perfect for:

- **Electrochemistry**: Mark peak potentials, E½, reversibility criteria
- **Signal Analysis**: Threshold levels, event markers, noise floors
- **Quality Control**: Upper/lower limits, specification bands
- **Research**: Highlighting regions of interest, pointing to features
