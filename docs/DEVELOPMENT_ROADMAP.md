# 🚀 SciChart Engine - Development Roadmap

> **Versión actual**: v0.1.1  
> **Última actualización**: 2026-01-01 (00:00)  
> **Objetivo**: Convertir SciChart Engine en la librería de charting científico WebGL/WebGPU más potente y accesible del ecosistema open-source.

---

## 📊 Estado Actual de la Librería

### ✅ Features Implementadas

| Categoría | Feature | Estado |
|-----------|---------|--------|
| **Rendering** | WebGL Renderer nativo | ✅ Completo |
| **Series** | Line charts | ✅ Completo |
| **Series** | Scatter plots | ✅ Completo |
| **Series** | Line+Scatter combo | ✅ Completo |
| **Series** | Step Charts | ✅ Completo |
| **Series** | Error Bars | ✅ Completo |
| **Series** | Band Series (Area Fill) | ✅ Completo |
| **Series** | Area Charts | ✅ Completo |
| **Series** | Bar Charts | ✅ Completo |
| **Series** | Heatmaps | ✅ Completo |
| **Series** | Scatter Symbols (SDF) | ✅ Completo |
| **Interacciones** | Pan (arrastrar) | ✅ Completo |
| **Interacciones** | Wheel Zoom | ✅ Completo |
| **Interacciones** | Wheel Zoom por Eje | ✅ Completo |
| **Interacciones** | Box Zoom | ✅ Completo |
| **Interacciones** | Cursor/Crosshair | ✅ Completo |
| **Temas** | Dark, Midnight, Light, Electrochemistry | ✅ Completo |
| **React** | Componente SciChart | ✅ Completo |
| **React** | Hook useSciChart | ✅ Completo |
| **Análisis** | Cycle Detection | ✅ Completo |
| **Análisis** | Peak Detection | ✅ Completo |
| **Análisis** | Peak Integration | ✅ Completo |
| **Análisis** | Baseline Subtraction | ✅ Completo |
| **Análisis** | LTTB Downsampling | ✅ Completo |
| **Análisis** | Moving Average | ✅ Completo |
| **Análisis** | Curve Fitting (Linear, Poly, Exp) | ✅ Completo |
| **Análisis** | Statistics Panel | ✅ Completo |
| **Análisis** | SI Prefix Formatting | ✅ Completo |
| **UI** | Controls Panel | ✅ Completo |
| **UI** | Legend (draggable) | ✅ Completo |
| **Export** | PNG/JPEG Image | ✅ Completo |
| **Export** | CSV/JSON Data | ✅ Completo |
| **Multiple Axes** | Multi Y-Axes | ✅ Completo |
| **Annotations** | Annotations System | ✅ Completo |
| **Streaming** | Real-time Append | ✅ Completo |
| **Streaming** | Rolling Window | ✅ Completo |
| **Streaming** | Auto-scroll | ✅ Completo |

### 🏗️ Arquitectura Actual

```
src/
├── core/
│   ├── Chart.ts              # Re-exports (~22 LOC)
│   ├── chart/                 # Módulos refactorizados
│   │   ├── ChartCore.ts       # Clase principal (~340 LOC)
│   │   ├── ChartExporter.ts   # Export CSV/JSON/Image (~142 LOC)
│   │   ├── ChartNavigation.ts # Zoom/Pan/AutoScale (~259 LOC)
│   │   ├── ChartRenderer.ts   # Render loop (~214 LOC)
│   │   ├── ChartSeries.ts     # Series CRUD (~220 LOC)
│   │   ├── ChartSetup.ts      # Inicialización (~195 LOC)
│   │   ├── types.ts           # Interfaces (~84 LOC)
│   │   └── index.ts           # Barrel export
│   ├── ChartControls.ts       # Panel de controles
│   ├── ChartLegend.ts         # Leyenda draggable
│   ├── ChartStatistics.ts     # Panel de estadísticas
│   ├── EventEmitter.ts        # Sistema de eventos
│   ├── InteractionManager.ts  # Manejo de interacciones
│   ├── OverlayRenderer.ts     # Capa de anotaciones
│   └── Series.ts              # Gestión de series
├── renderer/
│   ├── NativeWebGLRenderer.ts # Facade (re-exports)
│   ├── native/                # WebGL renderer refactor (<250 LOC por módulo)
│   ├── BarRenderer.ts         # Interleaving/logic para barras
│   ├── HeatmapRenderer.ts     # Interleaving/colormap helpers
│   └── shaders.ts             # Shaders GLSL legacy
├── overlay/
│   └── CanvasOverlay.ts       # Canvas 2D para ejes/texto
├── analysis/
│   ├── index.ts               # Barrel export
│   ├── math.ts                # Curve fitting (linear, poly, exp)
│   ├── peaks.ts               # Peak detection & integration
│   └── utils.ts               # Utilidades de análisis
├── workers/
│   └── downsample.ts          # Algoritmos de downsampling
├── theme/
│   └── index.ts               # Sistema de temas
├── react/
│   ├── SciChart.tsx           # Componente React
│   └── useSciChart.ts         # Hook personalizado
└── scales/
    └── index.ts               # Escalas lineal/log
```

---

## 🎯 Matriz de Priorización: Impacto vs Esfuerzo

```
                    ALTO IMPACTO
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    │   TIER 2           │   TIER 3           │
    │   Core Expansions  │   Advanced         │
    │                    │   Features         │
    │   • SVG Export     │   • WebGPU         │
    │   • WebSocket      │   • GPU Analysis   │
    │   • Linked Charts  │   • Instanced      │
    │   • SVG Export     │     Rendering      │
    │                    │                    │
BAJO ────────────────────┼──────────────────── ALTO
ESFUERZO                 │                    ESFUERZO
    │                    │                    │
    │   TIER 1           │   TIER 4           │
    │   Quick Wins 🚀    │   Nice to Have     │
    │                    │                    │
    │   • Annotations    │   • 3D Charts      │
    │   • Step Charts    │   • VR Support     │
    │   • Error Bars     │   • Mobile Native  │
    │   • CSV Export     │                    │
    │   • Scatter Symbol │                    │
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                    BAJO IMPACTO
```

---

## 🏆 TOP 5 Features Más Disruptivas

### 1. 🌟 WebGPU Renderer (GAME CHANGER)

**Impacto**: ⭐⭐⭐⭐⭐  
**Esfuerzo**: ⭐⭐⭐⭐⭐  
**Diferenciación**: ÚNICA librería open-source con WebGPU

```typescript
// Futuro API
const chart = createChart({
  container,
  renderer: 'webgpu', // o 'webgl' (fallback)
  computeAnalysis: true // GPU-accelerated analysis
});

// Renderizar 100M puntos a 60fps
chart.addSeries({
  id: 'massive',
  data: generateMassiveDataset(100_000_000)
});
```

**Beneficios**:
- 10-100x más rendimiento vs WebGL
- Compute shaders para análisis en GPU
- Downsampling en tiempo real en GPU
- 100M+ puntos a 60fps

---

### 2. 🔥 Heatmaps / Spectrogramas 2D

**Impacto**: ⭐⭐⭐⭐⭐  
**Esfuerzo**: ✅ Implementado  
**Casos de uso**: EIS, análisis espectral, correlación

```typescript
chart.addHeatmap({
  id: 'eis-nyquist',
  data: impedanceMatrix, // Float32Array 2D
  colorScale: 'viridis',
  interpolation: 'bilinear'
});
```

---

### 3. 📊 Synchronized Multi-Chart Layouts

**Impacto**: ⭐⭐⭐⭐  
**Esfuerzo**: ⭐⭐⭐  
**Casos de uso**: Dashboards, comparaciones

```typescript
const layout = createChartLayout({
  rows: 2,
  cols: 2,
  syncZoom: true,
  syncCursor: true
});

layout.addChart(0, 0, { title: 'Voltage' });
layout.addChart(0, 1, { title: 'Current' });
layout.addChart(1, 0, { title: 'Power' });
layout.addChart(1, 1, { title: 'Temperature' });
```

---

### 4. 🧮 GPU-Accelerated Analysis

**Impacto**: ⭐⭐⭐⭐  
**Esfuerzo**: ⭐⭐⭐⭐  

```typescript
// FFT en GPU
const spectrum = await chart.compute.fft(signal);

// Curve fitting en GPU
const fit = await chart.compute.fit(data, {
  type: 'polynomial',
  degree: 3
});

// Convolution/Smoothing en GPU
const smoothed = await chart.compute.smooth(data, {
  kernel: 'gaussian',
  sigma: 2
});
```

---

### 5. 🔌 Plugin Architecture

**Impacto**: ⭐⭐⭐⭐  
**Esfuerzo**: ⭐⭐⭐  

```typescript
import { electrochemPlugin } from '@scichart/electrochem-plugin';
import { financePlugin } from '@scichart/finance-plugin';

const chart = createChart({
  plugins: [
    electrochemPlugin({ nisquist: true, tafel: true }),
    financePlugin({ indicators: ['sma', 'rsi'] })
  ]
});
```

---

## 📅 Roadmap de Implementación

### 🎯 FASE 1: Fundamentos (v0.2.0) 
**Timeline**: 2-3 semanas  
**Objetivo**: Completar feature set básico

| Feature | Prioridad | Esfuerzo | Dependencias |
|---------|-----------|----------|--------------|
| **Annotations System** | 🔴 Alta | ✅ Completo | OverlayRenderer |
| • Horizontal lines | | ✅ | |
| • Vertical lines | | ✅ | |
| • Rectangles/Bands | | ✅ | |
| • Text labels | | ✅ | |
| • Arrows | | ✅ | |
| **Multiple Y-Axes** | 🔴 Alta | ✅ Completo | Core refactor |
| **Step Charts** | 🟡 Media | ✅ Completo | Shaders |
| **Error Bars** | 🟡 Media | ✅ Completo | Series system |
| **Scatter Symbols** | 🟢 Baja | ✅ Completo | Point shader |
| **Export CSV/JSON** | 🟢 Baja | ✅ Completo | None |
| **Partial Buffer Update**| 🔴 Alta | ✅ Completo | WebGL optimization |

<details>
<summary>📝 Especificación: Sistema de Anotaciones</summary>

```typescript
// API propuesta
chart.addAnnotation({
  type: 'horizontal-line',
  y: -0.5,
  color: '#ff0055',
  lineWidth: 2,
  lineDash: [5, 5],
  label: 'Cathodic Peak'
});

chart.addAnnotation({
  type: 'vertical-line',
  x: 0.2,
  color: '#00ff55'
});

chart.addAnnotation({
  type: 'band',
  xMin: 0.1,
  xMax: 0.3,
  color: 'rgba(255, 100, 100, 0.2)',
  label: 'Region of Interest'
});

chart.addAnnotation({
  type: 'text',
  x: 0.5,
  y: 1e-5,
  text: 'Peak Current',
  fontSize: 14,
  anchor: 'bottom-left'
});

chart.removeAnnotation(id);
chart.updateAnnotation(id, { color: '#00ff00' });
```

</details>

<details>
<summary>📝 Especificación: Multiple Y-Axes</summary>

```typescript
const chart = createChart({
  container,
  xAxis: { label: 'Time (s)' },
  yAxis: [
    { id: 'current', label: 'I / µA', position: 'left' },
    { id: 'voltage', label: 'E / V', position: 'right' }
  ]
});

chart.addSeries({
  id: 'current',
  yAxisId: 'current',
  data: { x, y: currentData },
  style: { color: '#ff0055' }
});

chart.addSeries({
  id: 'voltage',
  yAxisId: 'voltage',
  data: { x, y: voltageData },
  style: { color: '#00f2ff' }
});
```

</details>

---

### 🎯 FASE 2: Real-Time Pro (v0.3.0)
**Timeline**: 2-3 semanas  
**Objetivo**: Streaming optimizado

| Feature | Prioridad | Esfuerzo | Dependencias |
|---------|-----------|----------|--------------|
| **Rolling Window Buffer** | 🔴 Alta | ✅ Completo | Series system |
| **Append-Only Mode** | 🔴 Alta | ✅ Completo | WebGL optimization |
| **Auto-scroll** | 🟡 Media | ✅ Completo | View management |
| **Threshold Lines** | ⚠️ Media | ✅ Completo | Annotations |
| **WebSocket Helpers** | 🟢 Baja | ✅ Completo | None |

<details>
<summary>📝 Especificación: Rolling Window</summary>

```typescript
const chart = createChart({
  streaming: {
    mode: 'rolling',
    windowSize: 10000, // puntos
    windowTime: 30000, // o por tiempo (ms)
  }
});

// Append sin recrear buffers
chart.appendData('signal', {
  x: new Float32Array([newTimestamp]),
  y: new Float32Array([newValue])
});

// Auto-scroll sigue los datos más recientes
chart.setAutoScroll(true);
```

</details>

---

### 🎯 FASE 3: Análisis Científico (v0.4.0)
**Timeline**: 3-4 semanas  
**Objetivo**: Herramientas de análisis avanzado

| Feature | Prioridad | Esfuerzo | Dependencias |
|---------|-----------|----------|--------------|
| **Linear Fitting** | 🔴 Alta | ✅ Completo | Math utils |
| **Polynomial Fitting** | 🔴 Alta | ✅ Completo | Linear fitting |
| **Baseline Correction** | 🟡 Media | ✅ Completo | None |
| **Peak Integration** | 🟡 Media | ✅ Completo | Peak detection |
| **Derivative/Integral** | 🟡 Media | ✅ Completo | None |
| **Statistics Panel** | 🟢 Baja | ✅ Completo | Analysis utils |

<details>
<summary>📝 Especificación: Curve Fitting</summary>

```typescript
import { fitLinear, fitPolynomial, fitExponential } from 'scichart-engine/analysis';

// Fit lineal
const linear = fitLinear(x, y);
console.log(`y = ${linear.slope}x + ${linear.intercept}`);
console.log(`R² = ${linear.rSquared}`);

// Fit polinomial
const poly = fitPolynomial(x, y, { degree: 3 });
console.log(`Coefficients: ${poly.coefficients}`);

// Agregar línea de fit al chart
chart.addFitLine('current', {
  type: 'polynomial',
  degree: 2,
  style: { color: '#ffaa00', lineDash: [5, 5] },
  showEquation: true
});
```

</details>

---

### 🎯 FASE 4: Visualizaciones Avanzadas (v0.5.0)
**Timeline**: 4-5 semanas  
**Objetivo**: Nuevos tipos de visualización

| Feature | Prioridad | Esfuerzo | Dependencias |
|---------|-----------|----------|--------------|
| **Area Charts** | 🔴 Alta | ✅ Completo | Band rendering |
| **Stacked Area** | 🔴 Alta | ✅ Completo | Area charts |
| **Heatmaps** | 🔴 Alta | ✅ Completo | Heatmap renderer |
| **Contour Plots** | 🟡 Media | ⏳ Pendiente | Heatmaps |
| **Bar Charts** | 🟡 Media | ✅ Completo | Bar renderer |
| **Candlestick** | 🟢 Baja | ✅ Completo | OHLC data |

<details>
<summary>📝 Especificación: Heatmaps</summary>

```typescript
chart.addHeatmap({
  id: 'impedance',
  data: {
    xValues: frequencies,
    yValues: timePoints,
    zValues: impedanceMatrix,
  },
  style: {
    colorScale: {
      name: 'viridis',
      min: 0,
      max: 1000,
      logScale: false,
    },
    interpolation: 'bilinear',
    showColorbar: true,
  }
});
```

</details>

---

### 🎯 FASE 5: Ecosistema (v0.6.0)
**Timeline**: 4-5 semanas  
**Objetivo**: Integraciones y extensibilidad

| Feature | Prioridad | Esfuerzo | Dependencias |
|---------|-----------|----------|--------------|
| **SVG Export** | 🔴 Alta | ✅ Completo | All series types |
| **PDF Export** | 🟡 Media | ⏳ Pendiente | SVG export |
| **Plugin System** | 🔴 Alta | ✅ Completo | Core refactor |
| **Linked Charts** | 🔴 Alta | ⏳ Pendiente | Event system |
| **Vue Bindings** | 🟡 Media | ⏳ Pendiente | Core stable |
| **Svelte Bindings** | 🟡 Media | ⏳ Pendiente | Core stable |

<details>
<summary>📝 Especificación: Plugin System</summary>

```typescript
// Plugin interface
interface SciChartPlugin {
  name: string;
  version: string;
  
  install(chart: Chart, options?: any): void;
  uninstall(chart: Chart): void;
  
  // Hooks
  onSeriesAdd?(series: Series): void;
  onRender?(ctx: RenderContext): void;
  onZoom?(bounds: Bounds): void;
}

// Ejemplo: Electrochemistry Plugin
const electrochemPlugin: SciChartPlugin = {
  name: '@scichart/electrochem',
  version: '1.0.0',
  
  install(chart, options) {
    // Agregar métodos específicos
    chart.analyzeTafel = (seriesId) => { ... };
    chart.detectRedox = (seriesId) => { ... };
    
    // Agregar anotaciones automáticas
    if (options.autoAnnotate) {
      chart.on('dataChange', this.autoAnnotatePeaks);
    }
  }
};
```

</details>

---

### 🎯 FASE 6: Next-Gen Performance (v1.0.0)
**Timeline**: 6-8 semanas  
**Objetivo**: WebGPU y rendimiento extremo

| Feature | Prioridad | Esfuerzo | Dependencias |
|---------|-----------|----------|--------------|
| **WebGPU Renderer** | 🔴 Alta | ⚠️ Experimental | None |
| **GPU Compute Shaders** | 🔴 Alta | ⚠️ Experimental | WebGPU |
| **Instanced Rendering** | 🟡 Media | ⚠️ Experimental | WebGPU |
| **LOD System** | 🟡 Media | ⚠️ Experimental | Downsampling |
| **100M+ Point Support** | 🟡 Media | ⚠️ Experimental | All above |

> ⚠️ **Nota**: WebGPU está en desarrollo experimental. El código existe pero no ha sido testeado en producción.
> Los archivos relacionados están en `src/gpu/` pero la sección de documentación está comentada.

<details>
<summary>📝 Especificación: WebGPU Renderer</summary>

```typescript
import { createChart, WebGPURenderer } from 'scichart-engine';

const chart = createChart({
  container,
  renderer: await WebGPURenderer.create({
    preferredFormat: 'bgra8unorm',
    antialias: true,
    powerPreference: 'high-performance'
  })
});

// Feature detection
if (WebGPURenderer.isSupported()) {
  // Use WebGPU
} else {
  // Fallback to WebGL
}

// GPU-accelerated analysis
const fft = await chart.compute({
  type: 'fft',
  input: signalData,
  windowFunction: 'hann'
});
```

</details>

---

## 📊 Comparación con Competencia

| Feature | SciChart Engine | Chart.js | Plotly | D3.js | SciChart.js |
|---------|----------------|----------|--------|-------|-------------|
| **Max Points @ 60fps** | 10M+ (actual: 1M) | ~10K | ~100K | ~50K | 10M+ |
| **WebGL** | ✅ | ❌ | Parcial | ❌ | ✅ |
| **WebGPU** | 🔜 v1.0 | ❌ | ❌ | ❌ | ✅ |
| **React Support** | ✅ First-class | Plugin | ✅ | Manual | ✅ |
| **Heatmaps** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Multiple Y-Axes** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Real-time Streaming** | ✅ | ⚠️ Lento | ⚠️ Lento | Manual | ✅ |
| **Open Source** | ✅ MIT | ✅ MIT | ✅ MIT | ✅ BSD | ❌ Comercial |
| **Bundle Size** | ~50KB | ~200KB | ~3MB | ~250KB | ~500KB |
| **TypeScript** | ✅ Native | ✅ | ✅ | ⚠️ Types | ✅ |

---

## 🎪 Nichos de Mercado Target

### 1. 🔬 Electrochemistry (Foco Actual)
- Cyclic Voltammetry (CV)
- Linear Sweep Voltammetry (LSV)
- Electrochemical Impedance Spectroscopy (EIS)
- Tafel Analysis
- Randles Circuit Fitting

### 2. 📡 Signal Processing (Nuevo)
- Oscilloscope displays
- Spectrum analyzer
- Filter visualization
- Real-time FFT

### 3. 💰 Finance (Lucrativo)
- Candlestick charts
- Volume indicators
- Technical analysis
- High-frequency trading

### 4. 📱 IoT/Sensors (Creciente)
- Multi-sensor dashboards
- Anomaly detection
- Threshold monitoring
- Edge computing viz

### 5. 🏥 Medical/Bio (Premium)
- ECG visualization
- EEG multi-lead
- Biosensor data
- Clinical trials

---

## 🛠️ Guía de Contribución por Feature

### Para Contribuidores

Cada feature tiene un nivel de dificultad:

- 🟢 **Beginner Friendly** - Buen primer issue
- 🟡 **Intermediate** - Requiere conocimiento del codebase
- 🔴 **Advanced** - Requiere experiencia con WebGL/GPU

| Feature | Dificultad | Archivos Principales | Tests Requeridos |
|---------|------------|---------------------|------------------|
| Annotations | 🟢 | `OverlayRenderer.ts` | Unit + Visual |
| Step Charts | 🟢 | `shaders.ts`, `Series.ts` | Unit + Visual |
| Error Bars | 🟡 | `NativeWebGLRenderer.ts` | Unit + Visual |
| Multiple Y-Axes | 🟡 | `Chart.ts`, `CanvasOverlay.ts` | Integration |
| Heatmaps | 🔴 | `renderer/native/*`, `HeatmapRenderer.ts` | Unit + Visual |
| WebGPU | 🔴 | New renderer module | Full suite |

---

## 📈 Métricas de Éxito

### KPIs por Fase

| Fase | Metric | Target |
|------|--------|--------|
| v0.2 | Features completadas | 6/6 |
| v0.3 | Streaming benchmark | 100K pts/s append |
| v0.4 | Analysis accuracy | R² error < 0.001 |
| v0.5 | Chart types | 8 tipos soportados |
| v0.6 | Framework bindings | React, Vue, Svelte |
| v1.0 | Max points @ 60fps | 100M+ |

### Community Goals

- ⭐ GitHub Stars: 100 → 1000
- 📦 NPM Downloads: 100/week → 1000/week
- 🐛 Open Issues: < 10 bloqueantes
- 📖 Docs Coverage: 100% API documentada
- 🧪 Test Coverage: > 80%

---

## 🏁 Próximos Pasos Inmediatos

### Esta Semana ✅ COMPLETADO (2025-12-31)

1. [x] ~~Crear issues en GitHub para FASE 1~~ Fase 1 completada
2. [x] ~~Implementar sistema de Annotations básico~~ ✅ Completo
3. [x] ~~Diseñar API para Multiple Y-Axes~~ ✅ Completo
4. [x] ~~Agregar tests para features existentes~~ Documentación agregada
5. [x] **Band Series** - Soporte para area fill entre dos curvas ✅ NUEVO
6. [x] **Peak Analysis Demo** - Demo interactiva con baseline, integración y anotaciones ✅ NUEVO
7. [x] **Statistics Panel** - Panel colapsable con Min/Max/Mean/Count/Area ✅ NUEVO
8. [x] **Curve Fitting** - Linear, Polynomial y Exponential fitting ✅ NUEVO
9. [x] **Refactorización Chart.ts** - Dividido en 8 módulos (<250 LOC cada uno) ✅ NUEVO
10. [x] **Bug fixes** - Leyenda vacía, zoom en eje Y secundario ✅ CORREGIDO

### Próximos Pasos

1. [ ] Publicar v0.2.0 en NPM con todas las mejoras
2. [x] ~~Escribir documentación para curve fitting y peak analysis~~ ✅ Completo
3. [x] ~~Area Charts (stacked fill)~~ ✅ Completo - Nuevo tipo de serie 'area'
4. [x] ~~Heatmaps~~ ✅ Completo - Nuevo tipo de serie 'heatmap'
5. [ ] Tests unitarios para nuevos módulos
6. [ ] WebGPU: scaffolding + feature detection + fallback (experimental)
7. [x] **Documentación Band Series** - API docs para series tipo 'band' ✅ NUEVO
8. [x] **Documentación Statistics Panel** - API docs para el panel de estadísticas ✅ NUEVO

---

## 📚 Referencias

- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [LTTB Algorithm Paper](https://skemman.is/bitstream/1946/15343/3/SS_MSthesis.pdf)
- [High-Performance WebGL](https://webglfundamentals.org/webgl/lessons/webgl-optimization.html)
- [React + WebGL Best Practices](https://react.dev/learn/synchronizing-with-effects)

---

*Este roadmap es un documento vivo que se actualizará conforme avance el desarrollo.*
