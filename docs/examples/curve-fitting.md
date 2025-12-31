---
title: Curve Fitting Demo
description: Automatic trend lines and regression analysis
---

# Curve Fitting Demo

SciChart Engine provides a powerful and flexible curve fitting system. You can automatically calculate and render trend lines for any existing series using various mathematical models.

## Interactive Example

The following demo shows two datasets:
1. **Blue dots**: A linear calibration plot ($y = ax + b$) with random noise, fitted with a linear regression.
2. **Red squares**: A 3rd-degree polynomial dataset with noise, fitted with a cubic polynomial regression.

<ChartDemo type="fitting" height="500px" />

## How it Works

The `addFitLine` method performs the mathematical regression on the GPU-ready data of a series and automatically:
- Generates a smooth trend line series.
- Styles it as a dashed line with matched colors.
- Adds an interactive text annotation with the **equation** and the **$R^2$** value.

## Configuration

```typescript
// Add a linear fit
chart.addFitLine('my-series', 'linear', { 
  precision: 3 
});

// Add a high-order polynomial fit
chart.addFitLine('data-points', 'polynomial', { 
  degree: 3, 
  precision: 2 
});

// Other supported types: 'exponential', 'logarithmic', 'power'
chart.addFitLine('growth-data', 'exponential');
```

## Features

- **Linear Regression**: Best fit line using least squares.
- **Polynomial Fit**: Supports any degree (typically 2-5).
- **Non-linear Models**: Logarithmic, Exponential, and Power fits.
- **Automatic Labels**: Equation and $R^2$ are automatically updated and placed.
- **Dashed Lines**: Uses the new `lineDash` styling property for better visualization.

## Use Cases

- **Electrochemistry**: Calibration curves, Tafel plots, and kinetic analysis.
- **Physics**: Data modeling and trend identification.
- **Economics**: Forecasts and growth modeling.
- **Quality Control**: Monitoring drift and stability.
