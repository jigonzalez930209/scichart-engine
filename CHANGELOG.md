# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-12-31

### Added
- **Band Series Support**: New `band` series type for rendering filled areas between two curves (high-performance `TRIANGLE_STRIP` rendering).
- **Area Charts**: New `area` series type for solid fills from a curve to the baseline (y=0).
- **Statistics Panel**: Built-in collapsible overlay showing real-time Min, Max, Mean, Count, and Integrated Area for visible data.
- **Peak Analysis**:
  - Interactive example showing baseline subtraction, peak integration, and automatic peak labeling.
  - New analysis utilities for numerical integration and background correction.
- **Annotation System**: Complete support for Horizontal/Vertical lines, Rectangles, Bands, Text, and Arrows.
- **Step Charts**: New series types `step` and `step+scatter` with `before`, `after`, and `center` modes.
- **Data Export**: Export chart data to CSV and JSON formats with customizable precision.
- **Error Bars**: Support for symmetric/asymmetric Y error bars and horizontal X error bars.
- **Scatter Symbols**: 8 high-performance shapes (circle, square, diamond, triangle, etc.) using GPU-accelerated SDF rendering.
- **Enhanced Multi-Axis**: Independent scroll-zoom per axis, automatic stacking, and right-hand axis support.

### Changed
- **Modular Architecture (The Great Refactor)**: Rebuilt `Chart.ts` from a monolith into 8 specialized, maintainable modules (<250 LOC each).
- **Enhanced Data Analysis**: Improved `fitData` utility with better numerical stability for high-order polynomials.
- **Real-time Rolling Windows**: Improved `appendData` with circular buffer logic and selectable window sizes in demos.

### Fixed
- **Empty Legend Regression**: Resolved issue where legend didn't sync after series additions.
- **Secondary Axis Wheel Zoom**: Corrected hit-testing for right-positioned Y-axes.
- **Theme Transitions**: Improved resizing logic during dynamic theme switching.
- **Documentation**: Fixed asset paths and deployment URLs for GitHub Pages.

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
