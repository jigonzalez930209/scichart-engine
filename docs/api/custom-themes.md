# Custom Themes

Create your own themes to match your application's design.

## createTheme

```typescript
import { createTheme } from 'scichart-engine'

const myTheme = createTheme({
  name: 'my-theme',
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

// Use the theme
createChart({
  container,
  theme: myTheme,
})
```

## Extending Existing Themes

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

## Dynamic Theming

```typescript
function ThemedChart({ isDark }) {
  const theme = isDark ? 'midnight' : 'light'
  
  return (
    <SciChart
      series={series}
      theme={theme}
    />
  )
}
```

## CSS Variables Integration

```typescript
// Read colors from CSS variables
const getCSSVar = (name: string) => 
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const cssTheme = createTheme({
  name: 'css-vars',
  backgroundColor: getCSSVar('--bg-primary'),
  axis: {
    color: getCSSVar('--text-secondary'),
    labelColor: getCSSVar('--text-primary'),
    tickColor: getCSSVar('--border-color'),
    labelFont: '12px var(--font-family)',
  },
  // ...
})
```

## Theme Presets

### Catppuccin Mocha

```typescript
const catppuccinMocha = createTheme({
  name: 'catppuccin-mocha',
  backgroundColor: '#1e1e2e',
  grid: { color: 'rgba(147,153,178,0.1)', width: 1 },
  axis: {
    color: '#6c7086',
    labelColor: '#cdd6f4',
    tickColor: '#6c7086',
    labelFont: '12px sans-serif',
  },
  legend: {
    visible: true,
    backgroundColor: 'rgba(30,30,46,0.9)',
    borderColor: '#45475a',
    textColor: '#cdd6f4',
    font: '12px sans-serif',
  },
  cursor: {
    lineColor: '#89b4fa',
    lineWidth: 1,
    tooltipBackground: '#313244',
    tooltipBorder: '#45475a',
    tooltipTextColor: '#cdd6f4',
    tooltipFont: '12px monospace',
  },
  controls: {
    backgroundColor: 'rgba(49,50,68,0.9)',
    borderColor: '#45475a',
    iconColor: '#cdd6f4',
    hoverColor: '#89b4fa',
    activeColor: '#a6e3a1',
  },
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
  legend: {
    visible: true,
    backgroundColor: 'rgba(22,27,34,0.95)',
    borderColor: '#30363d',
    textColor: '#c9d1d9',
    font: '12px -apple-system, sans-serif',
  },
  cursor: {
    lineColor: '#58a6ff',
    lineWidth: 1,
    tooltipBackground: '#161b22',
    tooltipBorder: '#30363d',
    tooltipTextColor: '#c9d1d9',
    tooltipFont: '12px monospace',
  },
  controls: {
    backgroundColor: 'rgba(22,27,34,0.9)',
    borderColor: '#30363d',
    iconColor: '#c9d1d9',
    hoverColor: '#58a6ff',
    activeColor: '#3fb950',
  },
})
```
