# Core Concepts

Understanding the architecture of SciChart Engine.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Chart Instance                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │   Series    │  │   Series    │  │ Series  │  │
│  │  (WebGL)    │  │  (WebGL)    │  │ (WebGL) │  │
│  └─────────────┘  └─────────────┘  └─────────┘  │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │           WebGL Renderer                    ││
│  │  • GPU-accelerated line/point rendering     ││
│  │  • Zoom/pan via uniforms (no re-upload)     ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │           Overlay Renderer (2D Canvas)      ││
│  │  • Axes, grid, labels                       ││
│  │  • Cursor, tooltips                         ││
│  │  • Legend, controls                         ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐│
│  │           Interaction Manager               ││
│  │  • Mouse/touch events                       ││
│  │  • Zoom, pan, box-select                    ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

## Key Components

### Chart

The main orchestrator that coordinates all subsystems:

- Creates and manages the DOM structure
- Handles series lifecycle
- Coordinates rendering
- Emits events

### Series

Data containers with visualization properties:

- Store data in TypedArrays
- Calculate bounds
- Define visual style (color, width, type)

### WebGL Renderer

Hardware-accelerated data rendering:

- Uploads data to GPU buffers once
- Renders lines/points using shaders
- Zoom/pan updates only uniforms (no data re-upload)

### Overlay Renderer

2D canvas for UI elements:

- Axes with labels and ticks
- Grid lines
- Cursor crosshair and tooltips
- Selection rectangles

### Interaction Manager

Handles user input:

- Mouse wheel → zoom
- Left drag → pan
- Right drag → box zoom
- Touch gestures

## Data Flow

```
1. User calls chart.addSeries({ data: { x, y } })
   │
2. Series stores TypedArrays, calculates bounds
   │
3. WebGL Renderer creates GPU buffer from data
   │
4. Render loop (requestAnimationFrame):
   │
   ├─► WebGL: Draw data with current view bounds
   │
   └─► Overlay: Draw axes, grid, cursor
   │
5. User interaction (zoom/pan):
   │
   └─► Update view bounds → re-render (no data re-upload)
```

## View Bounds

The visible region of the chart is defined by `Bounds`:

```typescript
interface Bounds {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}
```

When you zoom or pan:
1. View bounds are updated
2. WebGL shader uniforms are updated
3. Chart re-renders with new bounds
4. **Data stays in GPU memory** (no re-upload)

This is why zooming is instant even with millions of points.

## Auto-scaling

When `auto: true` is set on an axis:

1. Chart calculates bounds from all series data
2. Adds 5% padding
3. Sets view bounds to fit all data

```typescript
// Enable auto-scaling
createChart({
  container,
  xAxis: { auto: true },  // Auto-scale X
  yAxis: { auto: true },  // Auto-scale Y
})

// Manually trigger auto-scale
chart.autoScale()
```

## Event System

Charts emit events for state changes:

```typescript
// Subscribe
chart.on('zoom', handler)
chart.on('render', handler)
chart.on('pan', handler)

// Unsubscribe
chart.off('zoom', handler)
```

Events are synchronous and fire immediately after the action.

## Render Loop

SciChart Engine uses `requestAnimationFrame` for smooth rendering:

```
┌─────────────────────────────────────┐
│         requestAnimationFrame       │
│               ↓                     │
│    ┌─────────────────────────┐     │
│    │  needsRender = true?    │     │
│    └──────────┬──────────────┘     │
│               │ yes                 │
│               ↓                     │
│    ┌─────────────────────────┐     │
│    │     render()            │     │
│    │  • WebGL draw           │     │
│    │  • Overlay draw         │     │
│    │  • Emit 'render' event  │     │
│    └─────────────────────────┘     │
│               ↓                     │
│         needsRender = false         │
│               ↓                     │
│         next frame...               │
└─────────────────────────────────────┘
```

Rendering only happens when needed (data change, zoom, pan, resize).

## Memory Management

### TypedArrays

Data must be `Float32Array` or `Float64Array`:

```typescript
// ✅ Correct
const x = new Float32Array([1, 2, 3])
const y = new Float32Array([4, 5, 6])

// ❌ Wrong - regular arrays
const x = [1, 2, 3]  // Will cause errors
```

### Cleanup

Always destroy charts when done:

```typescript
// Vanilla JS
chart.destroy()

// React - automatic via useEffect cleanup
useEffect(() => {
  // setup...
  return () => chart.destroy()
}, [])
```

## Next Steps

- [Series & Data](/guide/series) - Working with data
- [Interactions](/guide/interactions) - User interactions
- [Performance](/guide/performance) - Optimization tips
