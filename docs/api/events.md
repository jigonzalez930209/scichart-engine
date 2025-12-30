# Events

SciChart Engine emits events for various chart interactions and state changes.

## Subscribing to Events

```typescript
// Subscribe
chart.on('eventName', handler)

// Unsubscribe
chart.off('eventName', handler)
```

## Available Events

### render

Fired after each frame is rendered. Useful for FPS monitoring.

```typescript
chart.on('render', (data) => {
  console.log(`FPS: ${data.fps}, Frame time: ${data.frameTime}ms`)
})
```

| Property | Type | Description |
|----------|------|-------------|
| `fps` | `number` | Frames per second |
| `frameTime` | `number` | Time to render frame (ms) |

### zoom

Fired when the view bounds change (zoom or pan).

```typescript
chart.on('zoom', (data) => {
  console.log(`X: [${data.x[0]}, ${data.x[1]}]`)
  console.log(`Y: [${data.y[0]}, ${data.y[1]}]`)
})
```

| Property | Type | Description |
|----------|------|-------------|
| `x` | `[number, number]` | X-axis range [min, max] |
| `y` | `[number, number]` | Y-axis range [min, max] |

### pan

Fired during panning operations.

```typescript
chart.on('pan', (data) => {
  console.log(`Panned: ${data.deltaX}, ${data.deltaY}`)
})
```

| Property | Type | Description |
|----------|------|-------------|
| `deltaX` | `number` | Horizontal pan delta (data units) |
| `deltaY` | `number` | Vertical pan delta (data units) |

### resize

Fired when the chart container resizes.

```typescript
chart.on('resize', (data) => {
  console.log(`New size: ${data.width}x${data.height}`)
})
```

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | New width in pixels |
| `height` | `number` | New height in pixels |

### legendMove

Fired when the legend is dragged to a new position.

```typescript
chart.on('legendMove', (pos) => {
  // Save position to localStorage
  localStorage.setItem('legendPos', JSON.stringify(pos))
})
```

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | X position in pixels |
| `y` | `number` | Y position in pixels |

### autoScale

Fired when auto-scale is triggered.

```typescript
chart.on('autoScale', () => {
  console.log('Chart auto-scaled')
})
```

## Example: FPS Counter

```typescript
const fpsDisplay = document.getElementById('fps')

chart.on('render', ({ fps }) => {
  const color = fps >= 55 ? '#3fb950' : fps >= 30 ? '#d29922' : '#f85149'
  fpsDisplay.style.color = color
  fpsDisplay.textContent = `${Math.round(fps)} FPS`
})
```

## Example: Sync Multiple Charts

```typescript
const chart1 = createChart({ container: container1 })
const chart2 = createChart({ container: container2 })

// Sync zoom between charts
chart1.on('zoom', ({ x, y }) => {
  chart2.zoom({ x, y })
})

chart2.on('zoom', ({ x, y }) => {
  chart1.zoom({ x, y })
})
```

## Example: Save/Restore View State

```typescript
// Save view state
chart.on('zoom', ({ x, y }) => {
  localStorage.setItem('chartView', JSON.stringify({ x, y }))
})

// Restore on load
const saved = localStorage.getItem('chartView')
if (saved) {
  const { x, y } = JSON.parse(saved)
  chart.zoom({ x, y })
}
```
