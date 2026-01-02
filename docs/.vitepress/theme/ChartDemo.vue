<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  type?: 'basic' | 'realtime' | 'large' | 'scatter' | 'multi' | 'annotations' | 'step' | 'errorbars' | 'symbols' | 'multi-axis' | 'fitting' | 'analysis' | 'area' | 'bar' | 'heatmap' | 'candlestick' | 'stacked' | 'statistics' | 'tooltips'
  height?: string
  points?: number
}>()



const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const pointCount = ref(0)
const isRunning = ref(false)
const windowSize = ref<number | null>(50000) // null = infinite
const windowSizeOptions = [
  { label: '10K', value: 10000 },
  { label: '20K', value: 20000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
  { label: '∞ Infinite', value: null }
]

let chart: any = null
let animationId: number | null = null
let dataRef = { x: new Float32Array(0), y: new Float32Array(0) }
let tRef = 0

const chartTheme = computed(() => isDark.value ? 'midnight' : 'light')

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  const { createChart } = await import('@src/index')
  
  const chartOptions: any = {
    container: chartContainer.value,
    xAxis: { label: 'Time (s)', auto: true },
    theme: chartTheme.value,
    showControls: true,
    showStatistics: props.type === 'statistics' || props.type === 'analysis'
  };

  if (props.type === 'multi-axis') {
    chartOptions.yAxis = [
      { id: 'left', label: 'Amperage (µA)', position: 'left' },
      { id: 'right', label: 'Potential (V)', position: 'right' }
    ];
  } else {
    chartOptions.yAxis = { label: 'Value', auto: true };
  }

  chart = createChart(chartOptions);
  
  chart.on('render', (e: any) => {
    fps.value = Math.round(e.fps)
  })
  
  initDemo()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (chart) chart.destroy()
})

// Watch for theme changes
watch(isDark, async (val) => {
  console.log('[ChartDemo] Theme changed, isDark:', val);
  if (!chart) {
    console.warn('[ChartDemo] No chart instance to update theme');
    return;
  }
  
  try {
    // 1. Update theme
    chart.setTheme(chartTheme.value);
    
    // 2. Multiple resize attempts to handle CSS transitions
    // VitePress and many modern frameworks use CSS transitions for theme switching
    // which can cause the layout to be in flux for a few hundred milliseconds.
    const attempts = [0, 50, 150, 300, 500];
    attempts.forEach(delay => {
      setTimeout(() => {
        if (chart) {
          chart.resize();
          chart.render();
        }
      }, delay);
    });
  } catch (err) {
    console.error('[ChartDemo] Error updating theme:', err);
    // Fallback: full recreation if setTheme fails
    resetDemo();
  }
})

function initDemo() {
  const type = props.type || 'basic'
  const n = props.points || (type === 'large' ? 1000000 : type === 'realtime' ? 0 : 10000)
  
  if (type === 'realtime') {
    startRealtime()
  } else if (type === 'large') {
    generateLargeDataset(n)
  } else if (type === 'scatter') {
    generateScatterData(n)
  } else if (type === 'multi') {
    generateMultiSeries()
  } else if (type === 'annotations') {
    generateAnnotationsDemo()
  } else if (type === 'step') {
    generateStepDemo()
  } else if (type === 'errorbars') {
    generateErrorBarsDemo()
  } else if (type === 'symbols') {
    generateSymbolsDemo()
  } else if (type === 'multi-axis') {
    generateMultiAxisDemo()
  } else if (type === 'fitting') {
    generateFittingDemo()
  } else if (type === 'analysis') {
    generateAnalysisDemo()
  } else if (type === 'area') {
    generateAreaDemo()
  } else if (type === 'bar') {
    generateBarDemo()
  } else if (type === 'heatmap') {
    generateHeatmapDemo()
  } else if (type === 'candlestick') {
    generateCandlestickDemo()
  } else if (type === 'stacked') {
    generateStackedDemo()
  } else if (type === 'statistics') {
    generateBasicData(1000)
  } else if (type === 'tooltips') {
    generateTooltipsDemo()
  } else {
    generateBasicData(n)
  }
}

function generateBasicData(n: number) {
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i / (n / 20)
    y[i] = Math.sin(x[i]) * Math.cos(x[i] * 0.5) + Math.sin(x[i] * 3) * 0.3 + Math.random() * 0.1
  }
  
  chart.addSeries({
    id: 'data',
    type: 'line',
    data: { x, y },
    style: { color: '#00f2ff', width: 1.5 },
  })
  
  pointCount.value = n
}

function generateScatterData(n: number) {
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * 5 + Math.random() * 5
    x[i] = Math.cos(angle) * r
    y[i] = Math.sin(angle) * r + Math.random() * 0.5
  }
  
  chart.addSeries({
    id: 'scatter',
    type: 'scatter',
    data: { x, y },
    style: { color: '#ff6b6b', pointSize: 3 },
  })
  
  pointCount.value = n
}

function generateMultiSeries() {
  const n = 5000
  const x = new Float32Array(n)
  const y1 = new Float32Array(n)
  const y2 = new Float32Array(n)
  const y3 = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i / 100
    y1[i] = Math.sin(x[i]) + Math.random() * 0.1
    y2[i] = Math.cos(x[i]) + Math.random() * 0.1
    y3[i] = Math.sin(x[i] * 2) * 0.5 + Math.random() * 0.1
  }
  
  chart.addSeries({
    id: 'sin',
    type: 'line',
    data: { x, y: y1 },
    style: { color: '#ff6b6b', width: 1.5 },
  })
  
  chart.addSeries({
    id: 'cos',
    type: 'line',
    data: { x, y: y2 },
    style: { color: '#4ecdc4', width: 1.5 },
  })
  
  chart.addSeries({
    id: 'sin2',
    type: 'line',
    data: { x, y: y3 },
    style: { color: '#ffe66d', width: 1.5 },
  })
  
  pointCount.value = n * 3
}

function generateLargeDataset(n: number) {
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i
    y[i] = Math.sin(i * 0.0001) * Math.cos(i * 0.00003) + Math.random() * 0.1
  }
  
  chart.addSeries({
    id: 'big',
    type: 'line',
    data: { x, y },
    style: { color: '#a855f7', width: 1 },
  })
  
  pointCount.value = n
}

function generateStepDemo() {
  // Generate discrete sensor-like data
  const n = 50
  const x = new Float32Array(n)
  const y1 = new Float32Array(n)
  const y2 = new Float32Array(n)
  const y3 = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i
    // Step-like discrete values
    y1[i] = Math.floor(Math.sin(i * 0.3) * 3 + 5)
    y2[i] = Math.floor(Math.cos(i * 0.2) * 2 + 3)
    y3[i] = Math.floor(Math.sin(i * 0.15) * 4 + 8)
  }
  
  // Step with "after" mode (default)
  chart.addSeries({
    id: 'step-after',
    type: 'step',
    data: { x, y: y1 },
    style: { 
      color: '#ff6b6b', 
      width: 2,
      stepMode: 'after'
    },
  })
  
  // Step with "before" mode
  chart.addSeries({
    id: 'step-before',
    type: 'step',
    data: { x, y: y2 },
    style: { 
      color: '#4ecdc4', 
      width: 2,
      stepMode: 'before'
    },
  })
  
  // Step with "center" mode and scatter points
  chart.addSeries({
    id: 'step-center',
    type: 'step+scatter',
    data: { x, y: y3 },
    style: { 
      color: '#ffe66d', 
      width: 2,
      pointSize: 5,
      stepMode: 'center'
    },
  })
  
  // Add labels as annotations
  chart.addAnnotation({
    type: 'text',
    x: 2,
    y: 5,
    text: 'After Mode (red)',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.7)'
  })
  
  chart.addAnnotation({
    type: 'text',
    x: 2,
    y: 3,
    text: 'Before Mode (teal)',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.7)'
  })
  
  chart.addAnnotation({
    type: 'text',
    x: 2,
    y: 8,
    text: 'Center Mode (yellow)',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.7)'
  })
  
  pointCount.value = n * 3
}

function generateErrorBarsDemo() {
  // Generate calibration-like data with error bars
  const n = 8
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  const yError = new Float32Array(n)
  
  // Linear calibration with some noise
  for (let i = 0; i < n; i++) {
    x[i] = (i + 1) * 0.1  // Concentration: 0.1, 0.2, 0.3...
    y[i] = x[i] * 50 + 2 + (Math.random() - 0.5) * 3  // Current ~ 50 * concentration + offset
    yError[i] = 1 + Math.random() * 2  // Random error between 1-3
  }
  
  // Symmetric error bars
  chart.addSeries({
    id: 'calibration',
    type: 'line+scatter',
    data: { x, y, yError },
    style: { 
      color: '#00f2ff',
      width: 2,
      pointSize: 8,
      errorBars: {
        color: '#00f2ff',
        width: 1.5,
        capWidth: 10,
        opacity: 0.8
      }
    },
  })
  
  // Asymmetric error bars example
  const x2 = new Float32Array([0.2, 0.4, 0.6, 0.8])
  const y2 = new Float32Array([8, 18, 30, 42])
  const yErrorPlus = new Float32Array([4, 3, 5, 6])
  const yErrorMinus = new Float32Array([2, 1.5, 2.5, 3])
  
  chart.addSeries({
    id: 'asymmetric',
    type: 'scatter',
    data: { 
      x: x2, 
      y: y2, 
      yErrorPlus,
      yErrorMinus 
    },
    style: { 
      color: '#ff6b6b',
      pointSize: 10,
      errorBars: {
        color: '#ff6b6b',
        width: 2,
        capWidth: 8,
        opacity: 0.7
      }
    },
  })
  
  // Add labels
  chart.addAnnotation({
    type: 'text',
    x: 0.6,
    y: 50,
    text: '🔵 Symmetric Error',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)'
  })
  
  chart.addAnnotation({
    type: 'text',
    x: 0.6,
    y: 45,
    text: '🔴 Asymmetric Error',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.7)'
  })
  
  pointCount.value = n + 4
}

function generateSymbolsDemo() {
  const symbols: any[] = ['circle', 'square', 'diamond', 'triangle', 'triangleDown', 'cross', 'x', 'star']
  const colors = ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff', '#4dffff', '#ff994d', '#994dff']
  
  let totalPoints = 0
  
  symbols.forEach((symbol, i) => {
    const n = 20
    const x = new Float32Array(n)
    const y = new Float32Array(n)
    
    for (let j = 0; j < n; j++) {
      x[j] = j
      y[j] = i * 2 + Math.sin(j * 0.5)
    }
    
    chart.addSeries({
      id: `sym-${symbol}`,
      type: 'scatter',
      data: { x, y },
      style: {
        color: colors[i],
        pointSize: 10,
        symbol: symbol
      }
    })
    
    // Add text label
    chart.addAnnotation({
      type: 'text',
      x: -2,
      y: i * 2,
      text: symbol.charAt(0).toUpperCase() + symbol.slice(1),
      fontSize: 10,
      color: colors[i]
    })
    
    totalPoints += n
  })
  
  pointCount.value = totalPoints
}

function generateMultiAxisDemo() {
  const n = 2000;
  const x = new Float32Array(n);
  const y1 = new Float32Array(n);
  const y2 = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    const t = i / 100;
    x[i] = t;
    // Current-like signal (low amplitude)
    y1[i] = Math.sin(t * 2) * 2 + Math.cos(t * 5) * 0.5 + Math.random() * 0.2;
    // Voltage-like signal (high amplitude)
    y2[i] = Math.sin(t * 0.5) * 50 + 100 + Math.random() * 2;
  }
  
  chart.addSeries({
    id: 'current',
    type: 'line',
    yAxisId: 'left',
    data: { x, y: y1 },
    style: { color: '#00f2ff', width: 2 }
  });
  
  chart.addSeries({
    id: 'voltage',
    type: 'line',
    yAxisId: 'right',
    data: { x, y: y2 },
    style: { color: '#ff6b6b', width: 2 }
  });
  
  pointCount.value = n * 2;
}

function generateFittingDemo() {
  // 1. Linear Calibration Example
  const n1 = 12
  const x1 = new Float32Array(n1)
  const y1 = new Float32Array(n1)
  for (let i = 0; i < n1; i++) {
    x1[i] = (i + 1) * 0.1
    y1[i] = x1[i] * 45 + 5 + (Math.random() - 0.5) * 4
  }
  
  chart.addSeries({
    id: 'calibration',
    type: 'scatter',
    data: { x: x1, y: y1 },
    style: { color: '#00f2ff', pointSize: 8, symbol: 'circle' }
  })
  
  // Apply linear fit
  chart.addFitLine('calibration', 'linear', { precision: 3 })

  // 2. Polynomial Fit Example
  const n2 = 25
  const x2 = new Float32Array(n2)
  const y2 = new Float32Array(n2)
  for (let i = 0; i < n2; i++) {
    const t = (i / (n2 - 1)) * 4 - 2
    x2[i] = t
    y2[i] = (t * t * t) - (2 * t * t) + t + 10 + (Math.random() - 0.5) * 2
  }
  
  chart.addSeries({
    id: 'noisy-data',
    type: 'scatter',
    data: { x: x2, y: y2 },
    style: { color: '#ff6b6b', pointSize: 6, symbol: 'square' }
  })
  
  // Apply 3rd degree polynomial fit
  chart.addFitLine('noisy-data', 'polynomial', { degree: 3, precision: 2 })
  
  pointCount.value = n1 + n2
}

function generateAnalysisDemo() {
  // Generate a peak with a linear drift baseline
  const n = 100
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  const peakCenter = 0.5
  const peakWidth = 0.08
  const peakHeight = 10
  
  for (let i = 0; i < n; i++) {
    const val = i / (n - 1)
    x[i] = val
    // Gaussian peak + linear baseline (y = 2x + 1) + noise
    const gaussian = peakHeight * Math.exp(-Math.pow(val - peakCenter, 2) / (2 * Math.pow(peakWidth, 2)))
    const baseline = 2 * val + 1
    y[i] = gaussian + baseline + (Math.random() - 0.5) * 0.1
  }

  // 1. Calculate baseline points (anchors at x=0.15 and x=0.85)
  const x1 = 0.15
  const x2 = 0.85
  const i1 = Math.floor(x1 * n)
  const i2 = Math.floor(x2 * n)
  const y1 = y[i1]
  const y2 = y[i2]

  const slope = (y2 - y1) / (x[i2] - x[i1])
  const intercept = y1 - slope * x[i1]
  const getBaseline = (xv) => slope * xv + intercept

  // Create baseline data for the full range for the band fill
  const yBaseline = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    yBaseline[i] = getBaseline(x[i])
  }

  // 2. Add Area Fill (Band Series)
  // ONLY for the points between x1 and x2
  const bandX = x.slice(i1, i2 + 1)
  const bandY = y.slice(i1, i2 + 1)
  const bandBaseline = yBaseline.slice(i1, i2 + 1)

  chart.addSeries({
    id: 'peak-fill',
    type: 'band',
    data: { x: bandX, y: bandY, y2: bandBaseline },
    style: { color: '#ffcc00', opacity: 0.4 }
  })
  
  // 3. Add Raw Data
  chart.addSeries({
    id: 'raw-data',
    type: 'line',
    data: { x, y },
    style: { color: '#ffcc00', width: 2.5 }
  })

  // 4. Add Baseline Line (Clipped to integration range)
  chart.addSeries({
    id: 'baseline-line',
    type: 'line',
    data: { 
      x: new Float32Array([x1, x2]), 
      y: new Float32Array([y1, y2]) 
    },
    style: { color: '#00f2ff', width: 2, lineDash: [5, 5], opacity: 1 }
  })

  // 5. Add Anchor Points
  chart.addSeries({
    id: 'anchors',
    type: 'scatter',
    data: { x: new Float32Array([x1, x2]), y: new Float32Array([y1, y2]) },
    style: { color: '#00f2ff', pointSize: 8, symbol: 'circle' }
  })

  // 6. Calculate Area
  const totalArea = chart.analysis.integrate(x, y, x1, x2)
  const baselineArea = (x2 - x1) * (y1 + y2) / 2
  const peakArea = totalArea - baselineArea

  chart.addAnnotation({
    type: 'text',
    x: peakCenter,
    y: 12,
    text: `Peak Area: ${peakArea.toFixed(4)}\n(Background Subtracted)`,
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    anchor: 'bottom-center',
    borderRadius: 4
  })

  pointCount.value = n
}

function generateAreaDemo() {
  const n = 200
  const x = new Float32Array(n)
  
  // Dataset 1: Sine wave
  const y1 = new Float32Array(n)
  // Dataset 2: Shifted sine
  const y2 = new Float32Array(n)
  // Dataset 3: Damped oscillation
  const y3 = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    x[i] = i / 10
    y1[i] = Math.sin(x[i]) * 0.5 + 0.6
    y2[i] = Math.sin(x[i] + 1) * 0.4 + 0.4
    y3[i] = Math.sin(x[i] * 2) * Math.exp(-x[i] / 10) * 0.3 + 0.8
  }
  
  // Add areas back-to-front for proper layering
  chart.addSeries({
    id: 'area-3',
    type: 'area',
    data: { x, y: y3 },
    style: { color: 'rgba(255, 85, 85, 0.4)' }
  })
  
  chart.addSeries({
    id: 'area-2',
    type: 'area',
    data: { x, y: y2 },
    style: { color: 'rgba(255, 234, 0, 0.4)' }
  })
  
  chart.addSeries({
    id: 'area-1',
    type: 'area',
    data: { x, y: y1 },
    style: { color: 'rgba(0, 242, 255, 0.4)' }
  })
  
  // Add line overlays for clarity
  chart.addSeries({
    id: 'line-1',
    type: 'line',
    data: { x, y: y1 },
    style: { color: '#00f2ff', width: 2 }
  })
  
  chart.addSeries({
    id: 'line-2',
    type: 'line',
    data: { x, y: y2 },
    style: { color: '#ffea00', width: 2 }
  })
  
  chart.addSeries({
    id: 'line-3',
    type: 'line',
    data: { x, y: y3 },
    style: { color: '#ff5555', width: 2 }
  })
  
  pointCount.value = n * 3
}

function generateAnnotationsDemo() {
  // Generate a simple CV-like waveform
  const n = 2000
  const x = new Float32Array(n)
  const y = new Float32Array(n)
  
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 4 * Math.PI
    x[i] = Math.sin(t) * 0.5  // Potential sweep
    y[i] = (Math.sin(t) * Math.cos(t * 1.5) * 0.5 + Math.random() * 0.05) * 1e-5  // Current response
  }
  
  chart.addSeries({
    id: 'cv-data',
    type: 'line',
    data: { x, y },
    style: { color: '#00f2ff', width: 1.5 },
  })
  
  // Add various annotations
  
  // Horizontal lines for peak detection
  chart.addAnnotation({
    type: 'horizontal-line',
    y: 3e-6,
    color: '#ff6b6b',
    lineWidth: 2,
    lineDash: [5, 5],
    label: 'Anodic Peak',
    labelPosition: 'right'
  })
  
  chart.addAnnotation({
    type: 'horizontal-line',
    y: -3e-6,
    color: '#4ecdc4',
    lineWidth: 2,
    lineDash: [5, 5],
    label: 'Cathodic Peak',
    labelPosition: 'right'
  })
  
  // Zero baseline
  chart.addAnnotation({
    type: 'horizontal-line',
    y: 0,
    color: 'rgba(255,255,255,0.3)',
    lineWidth: 1
  })
  
  // Vertical line for E1/2
  chart.addAnnotation({
    type: 'vertical-line',
    x: 0,
    color: '#a855f7',
    lineWidth: 2,
    lineDash: [3, 3],
    label: 'E½',
    labelPosition: 'top'
  })
  
  // Highlight region of interest
  chart.addAnnotation({
    type: 'band',
    xMin: -0.3,
    xMax: 0.3,
    fillColor: 'rgba(168, 85, 247, 0.1)',
    label: 'Redox Region'
  })
  
  // Text annotation
  chart.addAnnotation({
    type: 'text',
    x: 0.35,
    y: 4e-6,
    text: '📊 CV Scan #1',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6
  })
  
  // Arrow pointing to feature
  chart.addAnnotation({
    type: 'arrow',
    x1: 0.4,
    y1: 2e-6,
    x2: 0.15,
    y2: 3.5e-6,
    color: '#ffe66d',
    lineWidth: 2,
    headSize: 8
  })
  
  pointCount.value = n
}

function generateBarDemo() {
  const n = 12;
  const x = new Float32Array(n).map((_, i) => i);
  const y = new Float32Array(n).map(() => 10 + Math.random() * 50);
  
  chart.addBar({
    id: 'bars',
    data: { x, y },
    style: { 
      color: '#00f2ff',
      barWidth: 0.7
    }
  });
  
  pointCount.value = n;
}

function generateHeatmapDemo() {
  const w = 50;
  const h = 50;
  const x = new Float32Array(w).map((_, i) => i);
  const y = new Float32Array(h).map((_, i) => i);
  const z = new Float32Array(w * h);
  
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const dx = (i - w / 2) / 5;
      const dy = (j - h / 2) / 5;
      z[j * w + i] = Math.cos(dx * dx + dy * dy) * Math.exp(-(dx * dx + dy * dy) / 10);
    }
  }
  
  chart.addHeatmap({
    id: 'heatmap',
    data: { xValues: x, yValues: y, zValues: z },
    style: {
      colorScale: { 
        name: 'viridis',
        min: -1,
        max: 1
      },
      interpolation: 'bilinear'
    }
  });
  
  // Set initial view to show the heatmap better
  chart.zoom({ x: [0, w-1], y: [0, h-1] });
  
  pointCount.value = w * h;
}

function generateCandlestickDemo() {
  const n = 100;
  const x = new Float32Array(n);
  const open = new Float32Array(n);
  const high = new Float32Array(n);
  const low = new Float32Array(n);
  const close = new Float32Array(n);
  
  let current = 100;
  for (let i = 0; i < n; i++) {
    x[i] = i;
    open[i] = current;
    const change = (Math.random() - 0.5) * 10;
    close[i] = current + change;
    high[i] = Math.max(open[i], close[i]) + Math.random() * 5;
    low[i] = Math.min(open[i], close[i]) - Math.random() * 5;
    current = close[i];
  }
  
  chart.addSeries({
    id: 'candles',
    type: 'candlestick',
    data: { x, open, high, low, close },
    style: {
      bullishColor: '#26a69a',
      bearishColor: '#ef5350',
      barWidth: 0.7
    }
  });
  
  pointCount.value = n;
}

function generateStackedDemo() {
  const n = 100;
  const x = new Float32Array(n);
  const y1 = new Float32Array(n);
  const y2 = new Float32Array(n);
  const y3 = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    x[i] = i;
    y1[i] = 10 + Math.sin(i * 0.1) * 5 + Math.random() * 2;
    y2[i] = 8 + Math.cos(i * 0.1) * 4 + Math.random() * 2;
    y3[i] = 12 + Math.sin(i * 0.15) * 6 + Math.random() * 2;
  }
  
  const stackId = 'my-stack';
  
  chart.addSeries({
    id: 'Baseline (S1)',
    type: 'area',
    stackId,
    data: { x, y: y1 },
    style: { color: 'rgba(255, 107, 107, 0.7)' }
  });
  
  chart.addSeries({
    id: 'Middle (S2)',
    type: 'area',
    stackId,
    data: { x, y: y2 },
    style: { color: 'rgba(78, 205, 196, 0.7)' }
  });
  
  chart.addSeries({
    id: 'Top (S3)',
    type: 'area',
    stackId,
    data: { x, y: y3 },
    style: { color: 'rgba(255, 230, 109, 0.7)' }
  });
  
  // Ensure Y axis starts at 0 for stacked charts to show layers
  chart.zoom({ y: [0, 40] });
  
  pointCount.value = n * 3;
}

function startRealtime() {
  isRunning.value = true
  dataRef = { x: new Float32Array(0), y: new Float32Array(0) }
  tRef = 0
  
  // Build series options with optional maxPoints for rolling window
  const seriesOptions: any = {
    id: 'stream',
    type: 'line',
    data: dataRef,
    style: { color: '#00f2ff', width: 2 },
  }
  
  // Only set maxPoints if a window size is selected (not infinite)
  if (windowSize.value !== null) {
    seriesOptions.maxPoints = windowSize.value
  }
  
  chart.addSeries(seriesOptions)
  chart.setAutoScroll(true);
  
  let lastUpdate = performance.now()
  const pointsPerFrame = 25; // High stress test
  
  const animate = () => {
    if (!chart || !isRunning.value) return
    
    const now = performance.now()
    // Update every frame for smoothness
    const batchX = new Float32Array(pointsPerFrame)
    const batchY = new Float32Array(pointsPerFrame)
    
    for (let i = 0; i < pointsPerFrame; i++) {
      batchX[i] = tRef
      
      const phase = Math.floor(tRef / 100) % 4
      let signal: number
      if (phase === 0) {
        signal = Math.sin(tRef * 0.1)
      } else if (phase === 1) {
        signal = Math.sin(tRef * 0.1) + Math.sin(tRef * 0.3) / 3
      } else if (phase === 2) {
        signal = ((tRef * 0.05) % (2 * Math.PI)) / Math.PI - 1
      } else {
        signal = Math.sin(tRef * 0.1 + Math.sin(tRef * 0.01) * 3)
      }
      
      batchY[i] = signal + Math.random() * 0.05
      tRef += 0.01
    }

    chart.appendData('stream', batchX, batchY);
    pointCount.value = chart.getSeries('stream').getPointCount();
    
    animationId = requestAnimationFrame(animate)
  }
  
  animationId = requestAnimationFrame(animate)
}

function toggleRealtime() {
  if (isRunning.value) {
    isRunning.value = false
    if (animationId) cancelAnimationFrame(animationId)
  } else {
    startRealtime()
  }
}

function generateTooltipsDemo() {
  const n = 1000;
  const x = new Float32Array(n);
  const y1 = new Float32Array(n);
  const y2 = new Float32Array(n);
  
  for (let i = 0; i < n; i++) {
    x[i] = i / 20;
    y1[i] = Math.sin(x[i] * 0.5) * 5 + 10;
    y2[i] = Math.cos(x[i] * 0.8) * 3 + 5;
  }
  
  chart.addSeries({
    id: 'primary',
    name: 'Primary Sensor',
    type: 'line',
    data: { x, y: y1 },
    style: { color: '#00f2ff', width: 2 }
  });
  
  chart.addSeries({
    id: 'secondary',
    name: 'Secondary Input',
    type: 'scatter',
    data: { x, y: y2 },
    style: { color: '#ff6b6b', pointSize: 6 }
  });

  // Add some annotations with tooltips
  chart.addAnnotation({
    type: 'horizontal-line',
    y: 10,
    color: 'rgba(255, 255, 255, 0.2)',
    label: 'Threshold',
    tooltip: 'Standard operation threshold'
  });

  // Initial configuration
  chart.tooltip.configure({
    enabled: true,
    theme: chartTheme.value === 'midnight' ? 'glass' : 'light',
    followCursor: true,
    showDelay: 0,
    dataPoint: {
      snapToPoint: true,
      hitRadius: 25
    }
  });

  pointCount.value = n * 2;
}

function resetDemo() {
  if (animationId) cancelAnimationFrame(animationId)
  isRunning.value = false
  
  chart.getAllSeries().forEach((s: any) => {
    chart.removeSeries(s.getId())
  })
  
  // Clear annotations if the method exists
  if (chart.clearAnnotations) {
    chart.clearAnnotations()
  }
  
  dataRef = { x: new Float32Array(0), y: new Float32Array(0) }
  tRef = 0
  pointCount.value = 0
  
  initDemo()
}
</script>

<template>
  <div class="chart-demo" :class="{ dark: isDark }">
    <div class="chart-header">
      <div class="chart-stats">
        <span class="stat">
          📊 <strong>{{ pointCount.toLocaleString() }}</strong> points
        </span>
        <span class="stat" :class="{ good: fps >= 55, warn: fps >= 30 && fps < 55, bad: fps < 30 }">
          🚀 <strong>{{ fps }}</strong> FPS
        </span>
        <span v-if="type === 'realtime'" class="stat">
          📏 Window: <strong>{{ windowSize === null ? '∞' : (windowSize / 1000) + 'K' }}</strong>
        </span>
      </div>
      <div class="chart-controls">
        <template v-if="type === 'realtime'">
          <button @click="toggleRealtime" class="btn btn-primary">
            {{ isRunning ? '⏸ Pause' : '▶ Start' }}
          </button>
          <select v-model="windowSize" @change="resetDemo" class="btn select" :disabled="isRunning">
            <option v-for="opt in windowSizeOptions" :key="opt.label" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div 
      ref="chartContainer" 
      class="chart-container"
      :style="{ height: height || '400px' }"
    ></div>
    <p class="chart-hint">
      <template v-if="type === 'realtime'">
        Use the dropdown to change window size (requires reset) • 
      </template>
      Scroll to zoom • Drag to pan • Right-drag for box zoom
    </p>
  </div>
</template>

<style scoped>
.chart-demo {
  margin: 1.5rem 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chart-stats {
  display: flex;
  gap: 1rem;
  font-size: 14px;
}

.stat {
  color: var(--vp-c-text-2);
}

.stat strong {
  color: var(--vp-c-brand);
}

.stat.good strong { color: #3fb950; }
.stat.warn strong { color: #d29922; }
.stat.bad strong { color: #f85149; }

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 4px 10px;
  font-size: 11px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  cursor: pointer;
  color: var(--vp-c-text-1);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn:hover:not(:disabled) {
  background: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary {
  background: var(--vp-c-brand);
  color: white !important;
  border-color: var(--vp-c-brand);
}

.btn-primary:hover:not(:disabled) {
  background: var(--vp-c-brand-dark) !important;
  border-color: var(--vp-c-brand-dark);
}

.btn.select {
  min-width: 110px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat !important;
  background-position: right 12px center !important;
  background-size: 14px !important;
  padding: 8px 36px 8px 16px;
  outline: none;
}

.chart-demo.dark .btn.select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}

.btn.select option {
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

/* Ensure the dropdown list itself is styled on some browsers */
.btn.select:focus {
  border-color: var(--vp-c-brand);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.chart-container {
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  overflow: hidden;
}

.chart-hint {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-top: 0.5rem;
  text-align: center;
}
</style>
