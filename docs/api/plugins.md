# Plugins API

The Plugin System allows you to hook into the SciChart Engine lifecycle.

## ChartPlugin Interface

All plugins must implement the following interface:

```typescript
interface ChartPlugin {
  /** Unique name for the plugin */
  name: string;
  
  /** Called when chart.use(plugin) is called */
  init?(chart: Chart): void;
  
  /** Called at the beginning of the render loop */
  onBeforeRender?(chart: Chart): void;
  
  /** Called after all rendering is complete */
  onAfterRender?(chart: Chart, ctx: RenderContext): void;
  
  /** Called when a new series is successfully added */
  onSeriesAdded?(series: Series): void;
  
  /** Called when the chart is destroyed */
  destroy?(): void;
}
```

## Chart.use()

Registers and initializes a plugin.

```typescript
const chart = createChart({ container });
chart.use(myPlugin);
```

## Hook Details

### `init(chart: Chart)`
Use this hook to:
- Access the `chart.container` to add DOM elements (tooltips, overlays).
- Store a reference to the chart for later use.
- Setup internal plugin state.

### `onBeforeRender(chart: Chart)`
Called before any WebGL or Canvas drawing occurs. Useful for state synchronization or pre-calculation.

### `onAfterRender(chart: Chart, ctx: RenderContext)`
Called after the `OverlayRenderer` has finished drawing. 
- The `RenderContext` contains the current `plotArea` dimensions.
- Useful for drawing custom elements on top of the chart using the canvas or DOM.

### `onSeriesAdded(series: Series)`
Called every time `addSeries`, `addBar`, or `addHeatmap` is executed.
- Useful for plugins that need to wrap or track individual series.

### `destroy()`
Crucial for preventing memory leaks. You must:
- Remove any DOM elements added in `init`.
- Clear any `setInterval` or `requestAnimationFrame` owned by the plugin.
- Remove event listeners.
