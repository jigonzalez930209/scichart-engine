# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-12-31

### Added
- **Annotation System** - Complete annotation support for charts
  - Horizontal lines with labels
  - Vertical lines with labels  
  - Rectangles with fill and stroke
  - Bands (horizontal and vertical regions)
  - Text annotations with rotation and anchoring
  - Arrows with customizable heads
- New `AnnotationManager` class for programmatic control
- `chart.addAnnotation()`, `chart.removeAnnotation()`, `chart.updateAnnotation()` methods
- `chart.getAnnotations()` and `chart.clearAnnotations()` methods
- Full TypeScript support with exported annotation types
- Comprehensive documentation in `/docs/api/annotations.md`
- Interactive annotations demo in documentation

- **Step Charts** - New series types for discrete data visualization
  - `step` - Pure step chart (no point markers)
  - `step+scatter` - Step chart with point markers
  - Three step modes: `before`, `after`, `center`
  - Full WebGL-accelerated rendering
  - Documentation in `/docs/api/step-charts.md`

- **Data Export** - Export chart data to CSV and JSON
  - `chart.exportCSV(options?)` - Export to CSV format
  - `chart.exportJSON(options?)` - Export to JSON format
  - Configurable precision, delimiter, and series selection
  - Documentation in `/docs/api/export.md`

- **Error Bars** - Visualize uncertainty in scientific data
  - Symmetric Y error bars (±value)
  - Asymmetric Y error bars (different upper/lower)
  - X error bars (horizontal)
  - Customizable styling (color, width, caps, opacity)
  - Direction control (both, positive, negative)
- **Scatter Symbols** - Multiple high-performance marker shapes
  - 8 built-in shapes: `circle`, `square`, `diamond`, `triangle`, `triangleDown`, `cross`, `x`, `star`
  - GPU-accelerated rendering using Signed Distance Fields (SDF)
  - Customizable point size per series
  - Sharp rendering at any scale and resolution
  - Documentation in `/docs/api/scatter-symbols.md`

- **Multiple Y-Axes** - Display series with different units in the same chart
  - Support for multiple axes on left and right sides
  - Independent auto-scaling per axis
  - Independent zoom/pan per axis: scroll over an axis to modify only its range
  - Automatic axis stacking and offset calculation
  - Series-to-axis linking via `yAxisId`
  - Interactive example in `/docs/examples/multiple-y-axes.md`

- **Real-time Streaming** - Optimized for high-frequency data acquisition
  - `chart.appendData()` - $O(\Delta N)$ partial GPU buffer updates
  - `autoScroll` - Automatically follow the newest data points
  - `maxPoints` - Built-in rolling window (circular buffer behavior)
  - Smooth 60fps visualization even with high-frequency updates
  - Documentation and interactive demo in `/docs/examples/realtime.md`

### Changed
- `Chart` interface extended with annotation, step, and export methods
- `SeriesType` now includes `step` and `step+scatter`
- `SeriesStyle` now includes `stepMode`, `errorBars`, and `symbol` properties
- `SeriesData` extended with error data arrays
- Documentation updated with 4 new feature sections and interactive examples

## [0.1.1] - 2025-12-30

### Fixed
- Documentation URL updates

## [0.1.0] - 2025-12-30

### Added
- Initial standalone release of scichart-engine.
- WebGL specialized renderer for scientific data.
- React components and hooks support.
- Support for Panning and Box Zoom.
- Axis-specific zooming capabilities.
- Documentation site base with VitePress.
- CI/CD workflows for NPM and GitHub Pages.
