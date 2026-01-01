# Plugin System

The Plugin System allows you to extend the functionality of SciChart Engine without modifying the core library.

## What can plugins do?

Plugins can hook into the chart's lifecycle to:
- Perform custom drawing before or after the main render.
- React to new series being added.
- Manage their own state synced with the chart's lifecycle.
- Cleanup resources when the chart is destroyed.

## Using a Plugin

To use a plugin, call the `.use()` method on your chart instance.

```typescript
import { createChart } from 'scichart-engine';
import { myPlugin } from './plugins/myPlugin';

const chart = createChart({ container });
chart.use(myPlugin);
```

## Creating a Plugin

A plugin is simply an object that implements the `ChartPlugin` interface.

```typescript
import type { Chart, ChartPlugin, Series } from 'scichart-engine';

export const MyAnnotationPlugin: ChartPlugin = {
  name: 'my-custom-annotations',

  init(chart: Chart) {
    console.log('Plugin initialized');
  },

  onBeforeRender(chart: Chart) {
    // Custom logic before WebGL render
  },

  onAfterRender(chart: Chart) {
    // Custom logic after WebGL and Overlay render
    // Useful for drawing custom SVG or Canvas elements on top
  },

  onSeriesAdded(series: Series) {
    console.log(`New series added: ${series.getId()}`);
  },

  destroy() {
    // Cleanup logic
  }
};
```

## Example: Simple FPS Counter Plugin

```typescript
export const FpsCounterPlugin: ChartPlugin = {
  name: 'fps-counter',
  
  init(chart) {
    this.el = document.createElement('div');
    this.el.style.cssText = 'position:absolute;top:10px;right:10px;color:white;background:black;padding:4px;';
    chart.container.appendChild(this.el);
    this.frames = 0;
    this.lastTime = performance.now();
  },

  onAfterRender() {
    this.frames++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.el.innerText = `FPS: ${this.frames}`;
      this.frames = 0;
      this.lastTime = now;
    }
  },

  destroy() {
    this.el.remove();
  }
};
```

## Plugin Lifecycle

1. **`init(chart)`**: Called immediately when `chart.use(plugin)` is executed. Use this to setup DOM or initial state.
2. **`onBeforeRender(chart)`**: Called at the start of every render frame.
3. **`onAfterRender(chart)`**: Called after all drawing (WebGL, Grids, Axes, Annotations) is complete.
4. **`onSeriesAdded(series)`**: Called whenever `chart.addSeries()` or `chart.addBar()` is successful.
5. **`destroy()`**: Called when the chart is destroyed.
