# Theming

Customize the look and feel of your charts with themes.

<script setup>
import { ref } from 'vue'
</script>

## Interactive Demo

This chart automatically syncs with the documentation theme. Toggle dark/light mode to see it change!

<ChartDemo type="basic" height="350px" :points="20000" />

## Built-in Themes

SciChart Engine includes four pre-built themes:

| Theme | Description | Best For |
|-------|-------------|----------|
| `dark` | High contrast dark theme | General use |
| `light` | Clean light theme | Print, presentations |
| `midnight` | Deep blue dark theme | Extended viewing |
| `electrochemistry` | Scientific blue theme | Lab applications |

### Using Themes

```typescript
import { createChart } from 'scichart-engine'

// Use theme by name
const chart = createChart({
  container,
  theme: 'midnight',
})
```

### Theme Objects

```typescript
import { DARK_THEME, LIGHT_THEME, MIDNIGHT_THEME } from 'scichart-engine'

const chart = createChart({
  container,
  theme: MIDNIGHT_THEME,
})
```

## Dynamic Theme Switching

To change theme at runtime, recreate the chart:

```typescript
function setTheme(themeName) {
  // Save current state
  const seriesData = chart.getAllSeries().map(s => ({
    id: s.getId(),
    type: s.getType(),
    data: s.getData(),
    style: s.getStyle(),
  }))
  const bounds = chart.getViewBounds()
  
  // Destroy old chart
  chart.destroy()
  
  // Create new chart with new theme
  chart = createChart({
    container,
    theme: themeName,
  })
  
  // Restore series
  seriesData.forEach(s => chart.addSeries(s))
  
  // Restore view
  chart.zoom({ 
    x: [bounds.xMin, bounds.xMax], 
    y: [bounds.yMin, bounds.yMax] 
  })
}
```

## Custom Themes

Create your own theme with `createTheme`:

```typescript
import { createTheme } from 'scichart-engine'

const myTheme = createTheme({
  name: 'my-custom-theme',
  backgroundColor: '#1e1e2e',
  
  grid: {
    color: 'rgba(255,255,255,0.08)',
    width: 1,
  },
  
  axis: {
    color: '#6c7086',
    labelColor: '#cdd6f4',
    tickColor: '#6c7086',
    labelFont: '12px Inter, sans-serif',
  },
  
  legend: {
    visible: true,
    backgroundColor: 'rgba(30,30,46,0.9)',
    borderColor: '#45475a',
    textColor: '#cdd6f4',
    font: '12px Inter, sans-serif',
  },
  
  cursor: {
    lineColor: '#89b4fa',
    lineWidth: 1,
    tooltipBackground: 'rgba(30,30,46,0.95)',
    tooltipBorder: '#45475a',
    tooltipTextColor: '#cdd6f4',
    tooltipFont: '12px monospace',
  },
  
  controls: {
    backgroundColor: 'rgba(30,30,46,0.8)',
    borderColor: '#45475a',
    iconColor: '#cdd6f4',
    hoverColor: '#89b4fa',
    activeColor: '#a6e3a1',
  },
})

const chart = createChart({
  container,
  theme: myTheme,
})
```

## Extending Themes

Base your theme on an existing one:

```typescript
import { DARK_THEME, createTheme } from 'scichart-engine'

const customDark = createTheme({
  ...DARK_THEME,
  name: 'custom-dark',
  backgroundColor: '#0a0a0f',
  grid: {
    ...DARK_THEME.grid,
    color: 'rgba(100,100,255,0.1)',
  },
})
```

## Theme Structure

```typescript
interface ChartTheme {
  name: string
  backgroundColor: string
  
  grid: {
    color: string      // Grid line color
    width: number      // Grid line width
  }
  
  axis: {
    color: string      // Axis line color
    labelColor: string // Label text color
    tickColor: string  // Tick mark color
    labelFont: string  // CSS font string
  }
  
  legend: {
    visible: boolean
    backgroundColor: string
    borderColor: string
    textColor: string
    font: string
  }
  
  cursor: {
    lineColor: string
    lineWidth: number
    tooltipBackground: string
    tooltipBorder: string
    tooltipTextColor: string
    tooltipFont: string
  }
  
  controls: {
    backgroundColor: string
    borderColor: string
    iconColor: string
    hoverColor: string
    activeColor: string
  }
}
```

## CSS Variables Integration

Read colors from your app's CSS variables:

```typescript
const getCSSVar = (name) => 
  getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()

const cssTheme = createTheme({
  name: 'css-vars',
  backgroundColor: getCSSVar('--bg-primary'),
  axis: {
    color: getCSSVar('--text-secondary'),
    labelColor: getCSSVar('--text-primary'),
    tickColor: getCSSVar('--border-color'),
    labelFont: `12px ${getCSSVar('--font-family')}`,
  },
  // ...
})
```

## Popular Theme Presets

### Catppuccin Mocha

```typescript
const catppuccin = createTheme({
  name: 'catppuccin-mocha',
  backgroundColor: '#1e1e2e',
  grid: { color: 'rgba(147,153,178,0.1)', width: 1 },
  axis: {
    color: '#6c7086',
    labelColor: '#cdd6f4',
    tickColor: '#6c7086',
    labelFont: '12px sans-serif',
  },
  // ...
})
```

### GitHub Dark

```typescript
const githubDark = createTheme({
  name: 'github-dark',
  backgroundColor: '#0d1117',
  grid: { color: 'rgba(48,54,61,0.5)', width: 1 },
  axis: {
    color: '#484f58',
    labelColor: '#c9d1d9',
    tickColor: '#30363d',
    labelFont: '12px -apple-system, sans-serif',
  },
  // ...
})
```

### Nord

```typescript
const nord = createTheme({
  name: 'nord',
  backgroundColor: '#2e3440',
  grid: { color: 'rgba(76,86,106,0.3)', width: 1 },
  axis: {
    color: '#4c566a',
    labelColor: '#eceff4',
    tickColor: '#4c566a',
    labelFont: '12px sans-serif',
  },
  // ...
})
```

## Series Colors

Series colors are independent of the theme:

```typescript
chart.addSeries({
  id: 'data',
  data: { x, y },
  style: { 
    color: '#ff6b6b',  // This color stays the same regardless of theme
    width: 2 
  },
})
```

To make series colors theme-aware:

```typescript
const seriesColors = {
  dark: '#00f2ff',
  light: '#0066cc',
}

chart.addSeries({
  id: 'data',
  data: { x, y },
  style: { 
    color: seriesColors[currentTheme],
    width: 2 
  },
})
```
