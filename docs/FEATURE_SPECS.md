# 📋 Feature Specifications

> Especificaciones técnicas detalladas para las features prioritarias de SciChart Engine.

---

## 🎯 SPEC-001: Sistema de Anotaciones

### Overview
Sistema extensible para agregar elementos visuales sobre el chart (líneas, rectángulos, texto, etc.)

### Tipos de Anotaciones

#### 1. Horizontal Line
```typescript
interface HorizontalLineAnnotation {
  type: 'horizontal-line';
  id?: string;          // Auto-generado si no se provee
  y: number;            // Valor Y en coordenadas de datos
  xMin?: number;        // Opcional: limitar extensión
  xMax?: number;
  color?: string;       // Default: theme color
  lineWidth?: number;   // Default: 1
  lineDash?: number[];  // Default: solid [0]
  label?: string;       // Texto opcional
  labelPosition?: 'left' | 'right' | 'center';
  interactive?: boolean; // Permitir arrastrar
}
```

#### 2. Vertical Line
```typescript
interface VerticalLineAnnotation {
  type: 'vertical-line';
  id?: string;
  x: number;            // Valor X en coordenadas de datos
  yMin?: number;
  yMax?: number;
  color?: string;
  lineWidth?: number;
  lineDash?: number[];
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'center';
  interactive?: boolean;
}
```

#### 3. Rectangle/Band
```typescript
interface RectangleAnnotation {
  type: 'rectangle' | 'band';
  id?: string;
  xMin: number;
  xMax: number;
  yMin?: number;        // Full height si no definido
  yMax?: number;
  fillColor?: string;   // Con alpha para transparencia
  strokeColor?: string;
  strokeWidth?: number;
  label?: string;
  interactive?: boolean;
}
```

#### 4. Text Annotation
```typescript
interface TextAnnotation {
  type: 'text';
  id?: string;
  x: number;
  y: number;
  text: string;
  fontSize?: number;    // Default: 12
  fontFamily?: string;  // Default: theme font
  color?: string;
  backgroundColor?: string;
  padding?: number;
  rotation?: number;    // Grados
  anchor?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

#### 5. Arrow Annotation
```typescript
interface ArrowAnnotation {
  type: 'arrow';
  id?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  lineWidth?: number;
  headSize?: number;    // Default: 8
  headStyle?: 'filled' | 'open';
  label?: string;
}
```

### API del Chart

```typescript
interface Chart {
  // Agregar anotación
  addAnnotation(annotation: Annotation): string; // Retorna ID
  
  // Remover anotación
  removeAnnotation(id: string): boolean;
  
  // Actualizar anotación
  updateAnnotation(id: string, updates: Partial<Annotation>): void;
  
  // Obtener todas las anotaciones
  getAnnotations(): Annotation[];
  
  // Limpiar todas
  clearAnnotations(): void;
  
  // Eventos
  on('annotationClick', (annotation: Annotation) => void): void;
  on('annotationDrag', (id: string, newPosition: Point) => void): void;
}
```

### Implementación

**Archivos a modificar:**
- `core/OverlayRenderer.ts` - Agregar métodos de render
- `core/Chart.ts` - Agregar API pública
- `types.ts` - Agregar tipos de anotación

**Nuevo archivo:**
- `core/AnnotationManager.ts` - Gestión de anotaciones

```typescript
// core/AnnotationManager.ts
export class AnnotationManager {
  private annotations: Map<string, Annotation> = new Map();
  private idCounter = 0;
  
  add(annotation: Annotation): string {
    const id = annotation.id ?? `ann-${++this.idCounter}`;
    this.annotations.set(id, { ...annotation, id });
    return id;
  }
  
  remove(id: string): boolean {
    return this.annotations.delete(id);
  }
  
  update(id: string, updates: Partial<Annotation>): void {
    const existing = this.annotations.get(id);
    if (existing) {
      this.annotations.set(id, { ...existing, ...updates });
    }
  }
  
  getAll(): Annotation[] {
    return Array.from(this.annotations.values());
  }
  
  render(ctx: CanvasRenderingContext2D, plotArea: PlotArea, bounds: Bounds): void {
    for (const annotation of this.annotations.values()) {
      this.renderAnnotation(ctx, annotation, plotArea, bounds);
    }
  }
  
  private renderAnnotation(
    ctx: CanvasRenderingContext2D,
    annotation: Annotation,
    plotArea: PlotArea,
    bounds: Bounds
  ): void {
    switch (annotation.type) {
      case 'horizontal-line':
        this.renderHorizontalLine(ctx, annotation, plotArea, bounds);
        break;
      case 'vertical-line':
        this.renderVerticalLine(ctx, annotation, plotArea, bounds);
        break;
      // ... etc
    }
  }
}
```

---

## 🎯 SPEC-002: Multiple Y-Axes

### Overview
Soporte para múltiples ejes Y independientes con series asignadas a cada eje.

### Configuración

```typescript
interface ChartOptions {
  xAxis?: AxisOptions;
  yAxis?: AxisOptions | AxisOptions[]; // Permite array
}

interface AxisOptions {
  id?: string;          // Requerido si múltiples ejes
  label?: string;
  scale?: 'linear' | 'log';
  position?: 'left' | 'right'; // Para ejes Y
  min?: number;
  max?: number;
  auto?: boolean;
  color?: string;       // Color del eje
  gridVisible?: boolean;
  tickFormat?: (value: number) => string;
}

interface SeriesOptions {
  // ... existing
  yAxisId?: string;     // NUEVO: asociar a un eje específico
}
```

### Ejemplo de Uso

```typescript
const chart = createChart({
  container,
  xAxis: { label: 'Time (s)' },
  yAxis: [
    {
      id: 'current',
      label: 'I / µA',
      position: 'left',
      color: '#ff0055'
    },
    {
      id: 'voltage',
      label: 'E / V',
      position: 'right',
      color: '#00f2ff'
    }
  ]
});

chart.addSeries({
  id: 'current-data',
  yAxisId: 'current',
  data: { x, y: currentData },
  style: { color: '#ff0055' }
});

chart.addSeries({
  id: 'voltage-data',
  yAxisId: 'voltage',
  data: { x, y: voltageData },
  style: { color: '#00f2ff' }
});
```

### Layout de Múltiples Ejes

```
┌────────────────────────────────────────────────────┐
│                      Title                          │
├──────┬────────────────────────────────────┬────────┤
│      │                                    │        │
│  Y1  │                                    │   Y2   │
│  µA  │         Plot Area                  │   V    │
│      │                                    │        │
│      │                                    │        │
├──────┴────────────────────────────────────┴────────┤
│                    X Axis (Time)                    │
└────────────────────────────────────────────────────┘
```

### Consideraciones de Implementación

1. **Bounds separados por eje**: Cada eje Y tiene su propio min/max
2. **Autoscale independiente**: Cada eje puede auto-escalar según sus series
3. **Zoom sincronizado en X**: X zoom afecta a todas las series
4. **Zoom independiente en Y**: Wheel zoom sobre un eje afecta solo ese eje
5. **Colores coordinados**: El eje coincide en color con sus series

### Cambios en WebGL Renderer

```typescript
// Cada serie necesita sus propios uniforms de escala
renderSeries(
  series: SeriesRenderData,
  uniforms: {
    scaleY: number;      // Escala del eje Y específico
    translateY: number;  // Traslación del eje Y específico
    scaleX: number;      // Compartido
    translateX: number;  // Compartido
  }
): void
```

---

## 🎯 SPEC-003: Rolling Window Buffer

### Overview
Buffer circular para datos en tiempo real que mantiene solo los últimos N puntos.

### API

```typescript
interface StreamingOptions {
  mode: 'append' | 'rolling' | 'replace';
  windowSize?: number;   // Número de puntos
  windowTime?: number;   // O por tiempo (ms)
  autoScroll?: boolean;  // Seguir datos más recientes
}

interface ChartOptions {
  streaming?: StreamingOptions;
}

// Nuevos métodos en Chart
interface Chart {
  appendData(seriesId: string, data: {
    x: Float32Array;
    y: Float32Array;
  }): void;
  
  setAutoScroll(enabled: boolean): void;
  isAutoScrolling(): boolean;
  
  getBufferStats(): {
    currentSize: number;
    maxSize: number;
    droppedPoints: number;
  };
}
```

### Implementación del Buffer Circular

```typescript
// workers/CircularBuffer.ts
export class CircularBuffer {
  private xBuffer: Float32Array;
  private yBuffer: Float32Array;
  private head = 0;      // Posición de escritura
  private size = 0;      // Puntos actuales
  private capacity: number;
  
  constructor(capacity: number) {
    this.capacity = capacity;
    this.xBuffer = new Float32Array(capacity);
    this.yBuffer = new Float32Array(capacity);
  }
  
  append(x: Float32Array, y: Float32Array): number {
    const count = x.length;
    
    for (let i = 0; i < count; i++) {
      this.xBuffer[this.head] = x[i];
      this.yBuffer[this.head] = y[i];
      this.head = (this.head + 1) % this.capacity;
      if (this.size < this.capacity) this.size++;
    }
    
    return count;
  }
  
  getContiguousData(): { x: Float32Array; y: Float32Array } {
    if (this.size < this.capacity) {
      // Buffer no está lleno, datos son contiguos desde 0
      return {
        x: this.xBuffer.subarray(0, this.size),
        y: this.yBuffer.subarray(0, this.size)
      };
    }
    
    // Buffer lleno, necesitamos reordenar
    const x = new Float32Array(this.capacity);
    const y = new Float32Array(this.capacity);
    
    // Copiar desde head hasta el final
    const tailSize = this.capacity - this.head;
    x.set(this.xBuffer.subarray(this.head), 0);
    y.set(this.yBuffer.subarray(this.head), 0);
    
    // Copiar desde inicio hasta head
    x.set(this.xBuffer.subarray(0, this.head), tailSize);
    y.set(this.yBuffer.subarray(0, this.head), tailSize);
    
    return { x, y };
  }
  
  clear(): void {
    this.head = 0;
    this.size = 0;
  }
}
```

### Optimización GPU

En lugar de recrear el buffer WebGL en cada append:

```typescript
// Usar GL_DYNAMIC_DRAW con buffer pre-allocado
gl.bufferData(gl.ARRAY_BUFFER, maxPoints * 2 * 4, gl.DYNAMIC_DRAW);

// Solo actualizar la porción modificada
gl.bufferSubData(gl.ARRAY_BUFFER, offset, newData);
```

---

## 🎯 SPEC-004: Heatmaps

### Overview
Visualización de datos 2D como matriz de colores.

### API

```typescript
interface HeatmapOptions {
  id: string;
  xValues: Float32Array;  // Eje X (ej: frecuencias)
  yValues: Float32Array;  // Eje Y (ej: tiempo)
  zValues: Float32Array;  // Datos (row-major order)
  colorScale?: ColorScale;
  interpolation?: 'nearest' | 'bilinear';
  opacity?: number;
  showColorbar?: boolean;
  colorbarPosition?: 'left' | 'right' | 'top' | 'bottom';
}

interface ColorScale {
  name?: 'viridis' | 'plasma' | 'inferno' | 'magma' | 'jet' | 'grayscale';
  colors?: string[];      // Custom: ['#000', '#f00', '#ff0', '#fff']
  min?: number;           // Clamp values
  max?: number;
  logScale?: boolean;
}

interface Chart {
  addHeatmap(options: HeatmapOptions): void;
  updateHeatmap(id: string, zValues: Float32Array): void;
  removeHeatmap(id: string): void;
}
```

### WebGL Implementation

```glsl
// heatmap_vertex.glsl
attribute vec2 position;   // Grid position (i, j)
attribute float value;     // Z value
varying float vValue;

uniform vec2 uScale;
uniform vec2 uTranslate;
uniform vec2 uGridSize;    // (cols, rows)

void main() {
  // Map grid position to normalized coordinates
  vec2 uv = position / uGridSize;
  vec2 pos = uv * 2.0 - 1.0;
  
  pos = pos * uScale + uTranslate;
  gl_Position = vec4(pos, 0.0, 1.0);
  
  vValue = value;
}

// heatmap_fragment.glsl
precision highp float;
varying float vValue;
uniform sampler2D uColormap;  // 1D texture con colormap
uniform float uMin;
uniform float uMax;
uniform bool uLogScale;

void main() {
  float normalized;
  if (uLogScale) {
    normalized = (log(vValue) - log(uMin)) / (log(uMax) - log(uMin));
  } else {
    normalized = (vValue - uMin) / (uMax - uMin);
  }
  
  normalized = clamp(normalized, 0.0, 1.0);
  
  vec4 color = texture2D(uColormap, vec2(normalized, 0.5));
  gl_FragColor = color;
}
```

### Colormaps Predefinidos

```typescript
const COLORMAPS = {
  viridis: [
    '#440154', '#482878', '#3e4989', '#31688e', '#26828e',
    '#1f9e89', '#35b779', '#6ece58', '#b5de2b', '#fde725'
  ],
  plasma: [
    '#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786',
    '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'
  ],
  inferno: [
    '#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60',
    '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'
  ],
  jet: [
    '#000080', '#0000ff', '#00ffff', '#00ff00', 
    '#ffff00', '#ff0000', '#800000'
  ]
};

function createColormapTexture(gl: WebGLRenderingContext, name: string): WebGLTexture {
  const colors = COLORMAPS[name];
  const width = 256;
  const data = new Uint8Array(width * 4);
  
  for (let i = 0; i < width; i++) {
    const t = i / (width - 1);
    const color = interpolateColor(colors, t);
    data[i * 4 + 0] = color.r;
    data[i * 4 + 1] = color.g;
    data[i * 4 + 2] = color.b;
    data[i * 4 + 3] = 255;
  }
  
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  
  return texture;
}
```

---

## 🎯 SPEC-005: WebGPU Renderer

### Overview
Renderer de próxima generación usando WebGPU para máximo rendimiento.

### Feature Detection

```typescript
async function createOptimalRenderer(canvas: HTMLCanvasElement): Promise<IRenderer> {
  // Intentar WebGPU primero
  if (await WebGPURenderer.isSupported()) {
    return WebGPURenderer.create(canvas);
  }
  
  // Fallback a WebGL2
  if (WebGL2Renderer.isSupported()) {
    return new WebGL2Renderer(canvas);
  }
  
  // Fallback final a WebGL1
  return new NativeWebGLRenderer(canvas);
}

class WebGPURenderer {
  static async isSupported(): Promise<boolean> {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }
}
```

### API Unificada

```typescript
interface IRenderer {
  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;
  
  // Buffer management
  createBuffer(id: string, data: Float32Array): void;
  updateBuffer(id: string, data: Float32Array, offset?: number): void;
  deleteBuffer(id: string): void;
  
  // Rendering
  beginFrame(): void;
  clear(color: [number, number, number, number]): void;
  renderLines(bufferId: string, count: number, options: RenderOptions): void;
  renderPoints(bufferId: string, count: number, options: RenderOptions): void;
  endFrame(): void;
  
  // Info
  getCapabilities(): RendererCapabilities;
}

interface RendererCapabilities {
  maxTextureSize: number;
  maxBufferSize: number;
  supportsCompute: boolean;
  supportsInstancing: boolean;
  backend: 'webgpu' | 'webgl2' | 'webgl';
}
```

### WebGPU Shader (WGSL)

```wgsl
// line_shader.wgsl
struct Uniforms {
  scale: vec2<f32>,
  translate: vec2<f32>,
  color: vec4<f32>,
  resolution: vec2<f32>,
};

@binding(0) @group(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@vertex
fn vs_main(@location(0) pos: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  let transformed = pos * uniforms.scale + uniforms.translate;
  output.position = vec4<f32>(transformed, 0.0, 1.0);
  output.color = uniforms.color;
  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
```

### Compute Shader para Downsampling

```wgsl
// lttb_compute.wgsl
struct DataPoint {
  x: f32,
  y: f32,
};

@binding(0) @group(0) var<storage, read> input: array<DataPoint>;
@binding(1) @group(0) var<storage, read_write> output: array<DataPoint>;
@binding(2) @group(0) var<uniform> params: DownsampleParams;

struct DownsampleParams {
  inputLength: u32,
  outputLength: u32,
  bucketSize: f32,
};

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let bucketIndex = id.x;
  if (bucketIndex >= params.outputLength - 2u) { return; }
  
  let bucketStart = u32(f32(bucketIndex + 1u) * params.bucketSize) + 1u;
  let bucketEnd = u32(f32(bucketIndex + 2u) * params.bucketSize) + 1u;
  
  // Find point with largest triangle area
  var maxArea: f32 = -1.0;
  var maxIndex: u32 = bucketStart;
  
  // ... LTTB algorithm implementation
  
  output[bucketIndex + 1u] = input[maxIndex];
}
```

---

## 📊 Testing Strategy

### Unit Tests (Vitest)

```typescript
// annotations.test.ts
describe('AnnotationManager', () => {
  it('should add horizontal line annotation', () => {
    const manager = new AnnotationManager();
    const id = manager.add({
      type: 'horizontal-line',
      y: 0.5,
      color: '#ff0000'
    });
    
    expect(manager.get(id)).toBeDefined();
    expect(manager.get(id).y).toBe(0.5);
  });
  
  it('should update annotation', () => {
    const manager = new AnnotationManager();
    const id = manager.add({ type: 'horizontal-line', y: 0.5 });
    
    manager.update(id, { y: 1.0 });
    
    expect(manager.get(id).y).toBe(1.0);
  });
});
```

### Visual Regression Tests

```typescript
// visual/heatmap.visual.test.ts
describe('Heatmap Visual', () => {
  it('should render viridis colormap correctly', async () => {
    const chart = await createTestChart();
    
    chart.addHeatmap({
      id: 'test',
      xValues: new Float32Array([0, 1, 2]),
      yValues: new Float32Array([0, 1, 2]),
      zValues: new Float32Array([0, 0.5, 1, 0.5, 0.75, 0.25, 1, 0.25, 0.5]),
      colorScale: { name: 'viridis' }
    });
    
    await expect(chart.canvas).toMatchImageSnapshot();
  });
});
```

### Performance Benchmarks

```typescript
// bench/rendering.bench.ts
import { bench } from 'vitest';

bench('render 1M points', async () => {
  const chart = createChart({ container });
  const data = generateRandomData(1_000_000);
  
  chart.addSeries({ id: 'test', data });
  chart.render();
});

bench('append 10K points to rolling buffer', () => {
  const buffer = new CircularBuffer(100_000);
  const newData = generateRandomData(10_000);
  
  buffer.append(newData.x, newData.y);
});
```

---

## 🔧 Development Workflow

### Branch Strategy

```
main
 ├── develop
 │   ├── feature/annotations
 │   ├── feature/multi-y-axes
 │   ├── feature/rolling-buffer
 │   └── feature/heatmaps
 └── release/v0.2.0
```

### Commit Convention

```
feat(annotations): add horizontal line annotation type
fix(renderer): correct buffer update offset calculation
perf(webgl): optimize shader uniform updates
docs(api): add multi-y-axes documentation
test(heatmap): add visual regression tests
```

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated
- [ ] Visual tests pass (if applicable)
- [ ] Performance not regressed
- [ ] Breaking changes documented
