---
title: Step Charts Demo
description: Interactive demo showcasing step chart types and modes
---

# Step Charts Demo

Step charts display data as "stair-step" patterns, ideal for visualizing discrete data or values that hold constant between measurements.

## Interactive Example

This demo shows three step chart variations:
- **Red** - `after` mode (step occurs after the point)
- **Teal** - `before` mode (step occurs before the point)  
- **Yellow** - `center` mode with scatter points (step at midpoint)

<ChartDemo type="step" height="450px" />

## Step Modes Explained

### After Mode (Default)

```
Value holds → then jumps
    ┌───
    │
────┘
```

### Before Mode

```
Value jumps → then holds
───┐
   │
   └───
```

### Center Mode

```
Step at midpoint between points
    ┌──
    │
──┬─┘
```

## Code Example

```typescript
import { createChart } from 'scichart-engine';

const chart = createChart({
  container: document.getElementById('chart'),
  theme: 'midnight'
});

// Step chart with "after" mode
chart.addSeries({
  id: 'sensor-data',
  type: 'step',
  data: { x: timeData, y: sensorValues },
  style: { 
    color: '#ff6b6b', 
    width: 2,
    stepMode: 'after'
  }
});

// Step+scatter with "center" mode
chart.addSeries({
  id: 'measurements',
  type: 'step+scatter',
  data: { x: timeData, y: measurements },
  style: { 
    color: '#ffe66d', 
    width: 2,
    pointSize: 5,
    stepMode: 'center'
  }
});
```

## Use Cases

- **Sensor readings** - Temperature, humidity sensors that sample periodically
- **Financial data** - Stock prices that hold until next trade
- **Digital signals** - Binary/PWM signals
- **Pulse techniques** - DPV, SWV electrochemical methods
- **State machines** - Visualizing discrete state changes
