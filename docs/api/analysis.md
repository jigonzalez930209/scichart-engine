# Data Analysis

SciChart Engine includes built-in utilities for common data analysis tasks.

## Overview

```typescript
import {
  detectCycles,
  detectPeaks,
  calculateStats,
  movingAverage,
  downsampleLTTB,
  validateData,
  formatWithPrefix,
  generateCycleColors,
} from 'scichart-engine'
```

## Functions

### detectCycles

Detect cycles in oscillating data. Useful for periodic signals, waveforms, and cyclic measurements.

```typescript
function detectCycles(
  signal: Float32Array | Float64Array | number[],
  tolerance?: number
): CycleInfo[]
```

[Full documentation →](/api/analysis-cycles)

### detectPeaks

Find local maxima and minima in data.

```typescript
function detectPeaks(
  x: Float32Array | Float64Array | number[],
  y: Float32Array | Float64Array | number[],
  options?: { minProminence?: number; type?: 'max' | 'min' | 'both' }
): Peak[]
```

[Full documentation →](/api/analysis-peaks)

### calculateStats

Calculate basic statistics for a dataset.

```typescript
function calculateStats(
  data: Float32Array | Float64Array | number[]
): DataStats
```

[Full documentation →](/api/analysis-utils#calculatestats)

### movingAverage

Apply moving average smoothing.

```typescript
function movingAverage(
  data: Float32Array | Float64Array | number[],
  windowSize: number
): Float32Array
```

[Full documentation →](/api/analysis-utils#movingaverage)

### downsampleLTTB

Reduce point count using LTTB algorithm while preserving visual shape.

```typescript
function downsampleLTTB(
  x: Float32Array | Float64Array,
  y: Float32Array | Float64Array,
  targetPoints: number
): { x: Float32Array; y: Float32Array }
```

[Full documentation →](/api/analysis-utils#downsamplelttb)

### validateData

Check for invalid values (NaN, Infinity).

```typescript
function validateData(
  data: Float32Array | Float64Array | number[]
): ValidationResult
```

[Full documentation →](/api/analysis-utils#validatedata)

### formatWithPrefix

Format numbers with automatic SI prefix.

```typescript
function formatWithPrefix(
  value: number,
  unit: string,
  decimals?: number
): string
```

[Full documentation →](/api/analysis-utils#formatwithprefix)

### generateCycleColors

Generate distinct colors for multiple series.

```typescript
function generateCycleColors(count: number): string[]
```

## Quick Examples

```typescript
import { 
  detectCycles, 
  detectPeaks, 
  calculateStats,
  downsampleLTTB 
} from 'scichart-engine'

// Detect cycles in oscillating data
const cycles = detectCycles(signalData)
console.log(`Found ${cycles.length} cycles`)

// Find peaks
const peaks = detectPeaks(x, y, { minProminence: 0.1 })
peaks.forEach(p => console.log(`Peak at x=${p.x}, y=${p.y}`))

// Get statistics
const stats = calculateStats(y)
console.log(`Mean: ${stats.mean}, StdDev: ${stats.stdDev}`)

// Downsample for display
const { x: sampledX, y: sampledY } = downsampleLTTB(x, y, 1000)
```
