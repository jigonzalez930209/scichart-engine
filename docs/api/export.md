---
title: Data Export
description: Export chart data to CSV, JSON, PNG and SVG formats
---

# Data Export

SciChart Engine provides built-in methods to export your chart data to CSV, JSON, PNG, and SVG formats. This is useful for saving experiment results, generating reports, or sharing high-quality vector graphics.

## Quick Example

```typescript
// Export to CSV
const csvData = chart.exportCSV();
console.log(csvData);
// Output:
// series1_x,series1_y
// 0.000000,1.234567
// 0.100000,2.345678
// ...

// Export to JSON
const jsonData = chart.exportJSON();
console.log(jsonData);
// Output: { exportDate: "...", chartBounds: {...}, series: {...} }

// Export to SVG (Vector)
const svgString = chart.exportSVG();
// Output: "<svg xmlns='...'>...</svg>"

// Export to Image (Raster)
const dataUrl = chart.exportImage();
// Output: "data:image/png;base64,..."
```

## CSV Export

### Basic Usage

```typescript
const csv = chart.exportCSV();
```

This generates a CSV string with headers and all series data:

```csv
series1_x,series1_y,series2_x,series2_y
0.000000,0.001234,0.000000,0.002345
0.100000,0.001456,0.100000,0.002567
...
```

### Options

```typescript
interface ExportOptions {
  seriesIds?: string[];      // Export specific series
  includeHeaders?: boolean;  // Include column headers (default: true)
  precision?: number;        // Decimal places (default: 6)
  delimiter?: string;        // Column separator (default: ',')
}
```

### Export Specific Series

```typescript
const csv = chart.exportCSV({
  seriesIds: ['current', 'voltage']
});
```

### Custom Formatting

```typescript
const csv = chart.exportCSV({
  includeHeaders: true,
  precision: 3,        // 3 decimal places
  delimiter: '\t'      // Tab-separated for Excel
});
```

### Download as File

```typescript
function downloadCSV(chart, filename = 'chart-data.csv') {
  const csvData = chart.exportCSV();
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Usage
downloadCSV(chart, 'experiment-001.csv');
```

## JSON Export

### Basic Usage

```typescript
const json = chart.exportJSON();
```

This generates a structured JSON object:

```json
{
  "exportDate": "2025-12-31T12:00:00.000Z",
  "chartBounds": {
    "xMin": -0.5,
    "xMax": 0.5,
    "yMin": -0.00001,
    "yMax": 0.00001
  },
  "series": {
    "current": {
      "id": "current",
      "type": "line",
      "style": { "color": "#00f2ff", "width": 1.5 },
      "data": {
        "x": [0, 0.1, 0.2, ...],
        "y": [0.000001, 0.000002, ...]
      },
      "pointCount": 1000
    }
  }
}
```

### Options

```typescript
const json = chart.exportJSON({
  seriesIds: ['current'],  // Specific series
  precision: 4             // Decimal precision
});
```

### Parse and Use

```typescript
const jsonString = chart.exportJSON();
const data = JSON.parse(jsonString);

// Access series data
const currentData = data.series.current.data;
console.log(`Points: ${currentData.x.length}`);

// Access bounds
console.log(`X range: ${data.chartBounds.xMin} to ${data.chartBounds.xMax}`);
```

### Download as File

```typescript
function downloadJSON(chart, filename = 'chart-data.json') {
  const jsonData = chart.exportJSON();
  const blob = new Blob([jsonData], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

## SVG Export (Vector)

SVG export provides high-quality vector graphics that remain sharp at any zoom level, making them ideal for academic papers and print media.

### Basic Usage

```typescript
const svg = chart.exportSVG();
```

The generated SVG includes:
- All visible series (Lines, Scatter, Bars, Candlesticks, Areas).
- X and Y axes with ticks.
- Grid lines matched to the current theme.
- Legends and Annotations.

### Supported Series Types

The SVG exporter supports all internal series types:
- **Line/Step**: Orthogonal or direct paths.
- **Scatter**: Circle, Square, Diamond, etc., using vector primitives.
- **Bar/Candlestick**: Sharp rectangles and wicks.
- **Area/Band**: High-fidelity polygons with customizable opacity.

## Image Export (Raster)

Export the current chart view as a PNG or JPEG image.

### Basic Usage

```typescript
const dataUrl = chart.exportImage('image/png');
```

### Options

```typescript
const dataUrl = chart.exportImage('image/jpeg', 0.9); // 90% quality
```

### Configuration

The image export uses the current canvas state and is limited by the screen resolution (multiplied by the Device Pixel Ratio). For higher quality print results, **SVG Export** is recommended.

## React Integration

```tsx
import { useRef } from 'react';
import { SciChart } from '@jigonzalez930209/scichart-engine/react';

function ChartWithExport() {
  const chartRef = useRef(null);

  const handleExportCSV = () => {
    const chart = chartRef.current?.getChart();
    if (chart) {
      const csv = chart.exportCSV();
      // Download or process the CSV
      console.log(csv);
    }
  };

  const handleExportJSON = () => {
    const chart = chartRef.current?.getChart();
    if (chart) {
      const json = chart.exportJSON();
      console.log(json);
    }
  };

  return (
    <div>
      <SciChart ref={chartRef} series={[...]} />
      <button onClick={handleExportCSV}>Export CSV</button>
      <button onClick={handleExportJSON}>Export JSON</button>
    </div>
  );
}
```

## Use Cases

### Scientific Reports

Export experiment data for inclusion in papers:

```typescript
const csv = chart.exportCSV({
  precision: 8,  // High precision for scientific data
  delimiter: ','
});
```

### Excel/Spreadsheet Import

Tab-separated values work well with Excel:

```typescript
const tsv = chart.exportCSV({
  delimiter: '\t',
  includeHeaders: true
});
```

### Data Archiving

JSON format preserves all metadata:

```typescript
const archive = {
  experimentName: 'CV Scan #42',
  date: new Date().toISOString(),
  parameters: { scanRate: 0.1 },
  chartData: JSON.parse(chart.exportJSON())
};

// Save to localStorage, database, or file
localStorage.setItem('experiment-42', JSON.stringify(archive));
```

### Data Processing Pipeline

Export for further analysis in Python, R, or other tools:

```typescript
// Export CSV
const csv = chart.exportCSV({ precision: 10 });

// Send to backend for processing
fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'text/csv' },
  body: csv
});
```

## Type Definitions

```typescript
interface ExportOptions {
  /** Series IDs to export (default: all) */
  seriesIds?: string[];
  /** Include headers in CSV (default: true) */
  includeHeaders?: boolean;
  /** Decimal precision (default: 6) */
  precision?: number;
  /** CSV delimiter (default: ',') */
  delimiter?: string;
}

interface Chart {
  exportCSV(options?: ExportOptions): string;
  exportJSON(options?: ExportOptions): string;
}
```

## Notes

- **Memory**: For very large datasets (millions of points), the export string can be quite large. Consider streaming or chunked exports for such cases.
- **Precision**: The default precision of 6 decimal places works well for most scientific applications. Adjust as needed.
- **Encoding**: Both CSV and JSON outputs are UTF-8 encoded strings.
