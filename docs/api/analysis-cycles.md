# Cycle Detection

Detect cycles in oscillating or periodic data.

## detectCycles

```typescript
function detectCycles(
  signal: Float32Array | Float64Array | number[],
  tolerance?: number
): CycleInfo[]
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `signal` | `Float32Array \| Float64Array \| number[]` | **required** | The signal data to analyze |
| `tolerance` | `number` | `0.001` | How close to starting value to consider a cycle complete |

### Returns

Array of `CycleInfo` objects:

```typescript
interface CycleInfo {
  number: number      // Cycle number (1-indexed)
  startIndex: number  // Start index in data array
  endIndex: number    // End index in data array
  direction: 1 | -1   // Initial direction (1=forward, -1=reverse)
}
```

### How It Works

The algorithm detects cycles by:
1. Tracking direction changes in the signal
2. After two direction changes, checking if the signal has returned to its starting value (within tolerance)
3. Marking complete cycles and continuing to find more

### Example: Basic Usage

```typescript
import { detectCycles } from 'scichart-engine'

// Oscillating signal (e.g., sine wave)
const signal = new Float32Array(1000)
for (let i = 0; i < 1000; i++) {
  signal[i] = Math.sin(i / 100 * Math.PI * 4)  // 2 complete cycles
}

const cycles = detectCycles(signal)
console.log(`Found ${cycles.length} cycles`)
// Found 2 cycles

cycles.forEach(c => {
  console.log(`Cycle ${c.number}: indices ${c.startIndex}-${c.endIndex}`)
})
```

### Example: Visualize Each Cycle

```typescript
import { detectCycles, generateCycleColors } from 'scichart-engine'

const cycles = detectCycles(xData)
const colors = generateCycleColors(cycles.length)

cycles.forEach((cycle, i) => {
  chart.addSeries({
    id: `cycle-${cycle.number}`,
    name: `Cycle ${cycle.number}`,
    data: {
      x: xData.slice(cycle.startIndex, cycle.endIndex + 1),
      y: yData.slice(cycle.startIndex, cycle.endIndex + 1),
    },
    style: { color: colors[i] },
  })
})
```

### Example: Cycle Statistics

```typescript
import { detectCycles, calculateStats } from 'scichart-engine'

const cycles = detectCycles(xData)

cycles.forEach(cycle => {
  const cycleY = yData.slice(cycle.startIndex, cycle.endIndex + 1)
  const stats = calculateStats(cycleY)
  
  console.log(`Cycle ${cycle.number}:`)
  console.log(`  Points: ${cycleY.length}`)
  console.log(`  Mean: ${stats.mean.toFixed(4)}`)
  console.log(`  Max: ${stats.max.toFixed(4)}`)
})
```

## generateCycleColors

Generate visually distinct colors for multiple cycles/series.

```typescript
function generateCycleColors(count: number): string[]
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `count` | `number` | Number of colors to generate |

### Returns

Array of HSL color strings with evenly distributed hues.

### Example

```typescript
import { generateCycleColors } from 'scichart-engine'

const colors = generateCycleColors(5)
// ['hsl(0, 70%, 55%)', 'hsl(72, 70%, 55%)', 'hsl(144, 70%, 55%)', ...]
```

## Use Cases

- **Cyclic Voltammetry** - Separate forward and reverse scans
- **Oscillation Analysis** - Analyze periodic signals
- **Waveform Processing** - Segment repeating patterns
- **Quality Control** - Compare cycle-to-cycle variation
