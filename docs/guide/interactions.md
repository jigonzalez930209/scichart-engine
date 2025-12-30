# Interactions

SciChart Engine provides rich built-in interactions for exploring data.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo

<ChartDemo type="basic" height="350px" :points="50000" />

## Built-in Interactions

### Mouse Wheel Zoom

Scroll the mouse wheel to zoom in/out centered on the cursor position.

- **Scroll up**: Zoom in
- **Scroll down**: Zoom out
- **Shift + Scroll**: Zoom X-axis only
- **Ctrl + Scroll**: Zoom Y-axis only

### Pan (Drag)

Click and drag with the left mouse button to pan the view.

```
Left-click + Drag → Pan in any direction
```

### Box Zoom

Right-click and drag to draw a selection rectangle. The view will zoom to fit the selected area.

```
Right-click + Drag → Draw selection box → Release to zoom
```

### Double-click Reset

Double-click to reset the view to auto-scale (fit all data).

## Cursor

Enable an interactive cursor with crosshair and tooltips.

### Basic Cursor

```typescript
chart.enableCursor({
  snap: true,      // Snap to nearest data point
  crosshair: true, // Show crosshair lines
})
```

### Custom Tooltip

```typescript
chart.enableCursor({
  snap: true,
  crosshair: true,
  formatter: (x, y) => {
    return `Time: ${x.toFixed(2)}s\nValue: ${y.toFixed(4)}`
  },
})
```

### Disable Cursor

```typescript
chart.disableCursor()
```

## Programmatic Control

### Zoom to Range

```typescript
// Zoom to specific bounds
chart.zoom({
  x: [0, 100],    // X range
  y: [-1, 1],     // Y range
})

// Zoom X only
chart.zoom({ x: [10, 50] })

// Zoom Y only
chart.zoom({ y: [0, 100] })
```

### Pan

```typescript
// Pan by data units
chart.pan(10, 0)   // Pan right by 10 units
chart.pan(0, -5)   // Pan down by 5 units
```

### Reset View

```typescript
// Reset to auto-scale
chart.resetZoom()

// Or explicitly auto-scale
chart.autoScale()
```

### Get Current View

```typescript
const bounds = chart.getViewBounds()
console.log(`X: ${bounds.xMin} to ${bounds.xMax}`)
console.log(`Y: ${bounds.yMin} to ${bounds.yMax}`)
```

## Events

Listen to interaction events:

### Zoom Event

```typescript
chart.on('zoom', ({ x, y }) => {
  console.log(`New view: X[${x[0]}, ${x[1]}], Y[${y[0]}, ${y[1]}]`)
})
```

### Pan Event

```typescript
chart.on('pan', ({ deltaX, deltaY }) => {
  console.log(`Panned: ${deltaX}, ${deltaY}`)
})
```

## Touch Support

SciChart Engine supports touch gestures on mobile devices:

| Gesture | Action |
|---------|--------|
| Single finger drag | Pan |
| Pinch | Zoom |
| Double tap | Reset view |

## Keyboard Shortcuts

When the chart is focused:

| Key | Action |
|-----|--------|
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| Arrow keys | Pan |
| `Home` | Reset view |

## Disabling Interactions

### Disable All

```typescript
const chart = createChart({
  container,
  // No interaction options = interactions enabled by default
})

// To disable specific interactions, use CSS pointer-events
chartContainer.style.pointerEvents = 'none'
```

### Read-only Mode

For display-only charts:

```typescript
const chart = createChart({
  container,
  showControls: false,  // Hide toolbar
})

// Disable mouse interactions
container.style.pointerEvents = 'none'
```

## Synchronized Charts

Sync zoom/pan between multiple charts:

```typescript
const chart1 = createChart({ container: container1 })
const chart2 = createChart({ container: container2 })

// Sync chart2 to chart1
chart1.on('zoom', ({ x, y }) => {
  chart2.zoom({ x, y })
})

// Bidirectional sync
chart2.on('zoom', ({ x, y }) => {
  chart1.zoom({ x, y })
})
```

## Custom Interaction Example

Create a custom "zoom to selection" button:

```typescript
let isSelecting = false
let startPoint = null

container.addEventListener('mousedown', (e) => {
  if (e.button === 0 && e.shiftKey) {  // Shift + left click
    isSelecting = true
    startPoint = { x: e.clientX, y: e.clientY }
  }
})

container.addEventListener('mouseup', (e) => {
  if (isSelecting && startPoint) {
    const rect = container.getBoundingClientRect()
    
    // Convert pixel coordinates to data coordinates
    const bounds = chart.getViewBounds()
    const x1 = pixelToData(startPoint.x - rect.left, bounds.xMin, bounds.xMax, rect.width)
    const x2 = pixelToData(e.clientX - rect.left, bounds.xMin, bounds.xMax, rect.width)
    
    chart.zoom({ x: [Math.min(x1, x2), Math.max(x1, x2)] })
    
    isSelecting = false
    startPoint = null
  }
})

function pixelToData(pixel, min, max, size) {
  return min + (pixel / size) * (max - min)
}
```
