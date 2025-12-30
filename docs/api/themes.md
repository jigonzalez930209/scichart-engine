# Built-in Themes

SciChart Engine includes several pre-built themes optimized for different use cases.

## Available Themes

### dark (default)

Dark theme with high contrast for general use.

```typescript
createChart({ container, theme: 'dark' })
```

- Background: `#1a1a2e`
- Grid: `rgba(255,255,255,0.05)`
- Axis: `#888`

### light

Light theme for print-friendly output.

```typescript
createChart({ container, theme: 'light' })
```

- Background: `#ffffff`
- Grid: `rgba(0,0,0,0.1)`
- Axis: `#333`

### midnight

Deep blue theme for extended viewing sessions.

```typescript
createChart({ container, theme: 'midnight' })
```

- Background: `#0d1117`
- Grid: `rgba(48,54,61,0.5)`
- Axis: `#8b949e`

### electrochemistry

Specialized theme for scientific data visualization.

```typescript
createChart({ container, theme: 'electrochemistry' })
```

- Background: `#0b0e14`
- Grid: `rgba(88,166,255,0.1)`
- Axis: `#58a6ff`

## Theme Structure

```typescript
interface ChartTheme {
  name: string
  backgroundColor: string
  
  grid: {
    color: string
    width: number
  }
  
  axis: {
    color: string
    labelColor: string
    tickColor: string
    labelFont: string
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

## Importing Themes

```typescript
import {
  DARK_THEME,
  LIGHT_THEME,
  MIDNIGHT_THEME,
  ELECTROCHEM_THEME,
  DEFAULT_THEME,
} from 'scichart-engine'

// Use directly
createChart({
  container,
  theme: MIDNIGHT_THEME,
})
```

## Getting Theme by Name

```typescript
import { getThemeByName } from 'scichart-engine'

const theme = getThemeByName('midnight')
```
