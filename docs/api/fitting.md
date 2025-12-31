---
title: Curve Fitting API
description: Documentation for the automated regression analysis system
---

# Curve Fitting API

The Curve Fitting system allows you to mathematically analyze data series and visualize trends. It uses high-performance numerical solvers to compute regressions and automatically renders them as stylized fit lines with equations.

## Using `addFitLine`

The most common way to use curve fitting is via the `addFitLine` method on the `Chart` instance.

### Signature
```typescript
chart.addFitLine(seriesId: string, type: FitType, options?: FitOptions): string;
```

### Parameters
| Name | Type | Description |
|------|------|-------------|
| `seriesId` | `string` | The ID of the series to analyze. |
| `type` | `FitType` | The regression model to use. |
| `options` | `FitOptions` | Optional configuration for the fit. |

### Returns
- `string`: The ID of the newly created fit series.

## Supported Models (`FitType`)

| Type | equation | Use Case |
|------|----------|----------|
| `'linear'` | $y = ax + b$ | General trends, calibration curves. |
| `'polynomial'` | $y = a_n x^n + ... + a_0$ | Non-linear trends, complex curves. |
| `'exponential'`| $y = a \cdot e^{bx}$ | Growth, decay, kinetics. |
| `'logarithmic'`| $y = a + b \cdot \ln(x)$ | Signal saturation, pH changes. |
| `'power'` | $y = a \cdot x^b$ | Scaling laws, physics models. |

## Options (`FitOptions`)

```typescript
interface FitOptions {
  /** Degree for polynomial fit (default: 2) */
  degree?: number;
  /** Number of decimals in equation string (default: 4) */
  precision?: number;
  /** Custom label for the equation annotation */
  label?: string;
}
```

## Low-level API (`fitData`)

If you want to perform the regression math without automatically adding a series to the chart, you can use the `fitData` utility.

```typescript
import { fitData } from 'scichart-engine/analysis';

const result = fitData(xValues, yValues, 'polynomial', { degree: 3 });

console.log(result.equation); // "y = 1.25x^3 - 0.50x^2 + ..."
console.log(result.rSquared); // 0.9985
const predictedY = result.predict(2.5);
```

### `FitResult` structure
```typescript
interface FitResult {
  type: FitType;
  coefficients: number[];
  equation: string;
  rSquared: number;
  predict: (x: number) => number;
}
```

## Mathematical Implementation

The engine uses **Gaussian elimination with partial pivoting** to solve the normal equations of the least squares problem. This provides robustness against ill-conditioned matrices common in high-degree polynomial fitting.

For non-linear models (Exponential, Power, Logarithmic), the data is linearized using logarithmic transformations before performing a linear regression.
