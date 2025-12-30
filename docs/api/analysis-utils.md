# Data Utilities

General-purpose utilities for data processing and formatting.

## calculateStats

Calculate basic statistics for a dataset.

```typescript
function calculateStats(
  data: Float32Array | Float64Array | number[]
): DataStats
```

### Returns

```typescript
interface DataStats {
  min: number     // Minimum value
  max: number     // Maximum value
  mean: number    // Arithmetic mean
  stdDev: number  // Standard deviation
  count: number   // Number of points
}
```

### Example

```typescript
import { calculateStats } from 'scichart-engine'

const stats = calculateStats(yData)

console.log(`Count: ${stats.count}`)
console.log(`Range: ${stats.min.toFixed(4)} to ${stats.max.toFixed(4)}`)
console.log(`Mean: ${stats.mean.toFixed(4)}`)
console.log(`Std Dev: ${stats.stdDev.toFixed(4)}`)
```

---

## movingAverage

Apply moving average smoothing to reduce noise.

```typescript
function movingAverage(
  data: Float32Array | Float64Array | number[],
  windowSize: number
): Float32Array
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Float32Array \| Float64Array \| number[]` | Input data |
| `windowSize` | `number` | Number of points to average (should be odd) |

### Example

```typescript
import { movingAverage } from 'scichart-engine'

// Smooth noisy data with 5-point moving average
const smoothed = movingAverage(noisyData, 5)

chart.addSeries({
  id: 'smoothed',
  data: { x: xData, y: smoothed },
  style: { color: '#00ff88' },
})
```

---

## downsampleLTTB

Reduce point count using the Largest Triangle Three Buckets (LTTB) algorithm. Preserves visual shape while dramatically reducing data size.

```typescript
function downsampleLTTB(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  targetPoints: number
): { x: Float32Array; y: Float32Array }
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `x` | `Float32Array \| Float64Array` | X values |
| `y` | `Float32Array \| Float64Array` | Y values |
| `targetPoints` | `number` | Desired number of output points |

### Example

```typescript
import { downsampleLTTB } from 'scichart-engine'

// Reduce 10 million points to 10,000 for display
const { x: sampledX, y: sampledY } = downsampleLTTB(
  originalX,
  originalY,
  10000
)

chart.addSeries({
  id: 'data',
  data: { x: sampledX, y: sampledY },
})
```

### When to Use

- Displaying very large datasets (1M+ points)
- Reducing data transfer size
- Improving render performance
- Creating thumbnails or previews

---

## validateData

Check for invalid values (NaN, Infinity, -Infinity).

```typescript
function validateData(
  data: Float32Array | Float64Array | number[]
): ValidationResult
```

### Returns

```typescript
interface ValidationResult {
  valid: boolean          // True if all values are finite
  invalidCount: number    // Number of invalid values
  firstInvalidIndex: number  // Index of first invalid (-1 if none)
}
```

### Example

```typescript
import { validateData } from 'scichart-engine'

const result = validateData(yData)

if (!result.valid) {
  console.warn(`Found ${result.invalidCount} invalid values`)
  console.warn(`First invalid at index ${result.firstInvalidIndex}`)
}
```

---

## formatWithPrefix

Format numbers with automatic SI prefix (k, M, G, m, µ, n, p).

```typescript
function formatWithPrefix(
  value: number,
  unit: string,
  decimals?: number
): string
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `number` | **required** | Value to format |
| `unit` | `string` | **required** | Unit symbol (V, A, m, s, etc.) |
| `decimals` | `number` | `2` | Decimal places |

### Example

```typescript
import { formatWithPrefix } from 'scichart-engine'

formatWithPrefix(0.000001, 'A')    // "1.00 µA"
formatWithPrefix(0.5, 'V')         // "500.00 mV"
formatWithPrefix(1500, 'm')        // "1.50 km"
formatWithPrefix(2.5e-9, 's')      // "2.50 ns"
formatWithPrefix(1e6, 'Hz')        // "1.00 MHz"
```

---

## formatValue

Format a number with automatic scientific notation for extreme values.

```typescript
function formatValue(value: number, decimals?: number): string
```

### Example

```typescript
import { formatValue } from 'scichart-engine'

formatValue(123.456)      // "123.456"
formatValue(0.0001)       // "1.000e-4"
formatValue(1234567)      // "1.235e+6"
```

---

## formatScientific

Always format in scientific notation.

```typescript
function formatScientific(value: number, decimals?: number): string
```

### Example

```typescript
import { formatScientific } from 'scichart-engine'

formatScientific(123.456)    // "1.23e+2"
formatScientific(0.001)      // "1.00e-3"
```

---

## getBestPrefix

Get the optimal SI prefix for a value.

```typescript
function getBestPrefix(value: number): PrefixInfo
```

### Returns

```typescript
interface PrefixInfo {
  symbol: string   // 'p' | 'n' | 'µ' | 'm' | '' | 'k' | 'M' | 'G'
  factor: number   // Multiplication factor (e.g., 1e-6 for µ)
}
```

### Example

```typescript
import { getBestPrefix } from 'scichart-engine'

const prefix = getBestPrefix(0.000001)
// { symbol: 'µ', factor: 1e-6 }

const scaled = 0.000001 / prefix.factor  // 1
console.log(`${scaled} ${prefix.symbol}A`)  // "1 µA"
```
