# Installation

## Package Manager

```bash
# npm
npm install @jigonzalez930209/scichart-engine

# pnpm
pnpm add @jigonzalez930209/scichart-engine

# yarn
yarn add @jigonzalez930209/scichart-engine
```

## Peer Dependencies

For React usage, ensure you have React 16.8+ installed:

```bash
npm install react react-dom
```

## Imports

### ES Modules

```typescript
// Core API
import { createChart } from '@jigonzalez930209/scichart-engine'

// React components
import { SciChart, useSciChart } from '@jigonzalez930209/scichart-engine/react'

// Analysis utilities
import { detectPeaks, detectCycles } from '@jigonzalez930209/scichart-engine'

// Themes
import { DARK_THEME, MIDNIGHT_THEME } from '@jigonzalez930209/scichart-engine'
```

### CommonJS

```javascript
const { createChart } = require('@jigonzalez930209/scichart-engine')
```

## CDN Usage

For quick prototyping, you can use a CDN:

```html
<script type="module">
  import { createChart } from 'https://esm.sh/@jigonzalez930209/scichart-engine'
  
  const chart = createChart({
    container: document.getElementById('chart'),
  })
</script>
```

## TypeScript

SciChart Engine is written in TypeScript and includes full type definitions. No additional `@types` package is needed.

```typescript
import { createChart, type Chart, type ChartOptions } from 'scichart-engine'

const options: ChartOptions = {
  container: document.getElementById('chart')!,
  xAxis: { label: 'X', auto: true },
  yAxis: { label: 'Y', auto: true },
}

const chart: Chart = createChart(options)
```

## Bundle Size

SciChart Engine is designed to be lightweight:

| Import | Size (gzip) |
|--------|-------------|
| Core only | ~30KB |
| With React | ~35KB |
| Full bundle | ~50KB |

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

WebGL 2.0 is required. Most modern browsers support this.

## Next Steps

- [Quick Start](/guide/quick-start) - Create your first chart
