<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  type?: 'basic' | 'realtime' | 'large' | 'scatter' | 'multi' | 'annotations' | 'step' | 'errorbars' | 'symbols' | 'multi-axis'
  height?: string
  points?: number
}>()

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const pointCount = ref(0)
const isRunning = ref(false)

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

function startRealtime() {
  isRunning.value = true
  dataRef = { x: new Float32Array(0), y: new Float32Array(0) }
  tRef = 0
  
  chart.addSeries({
    id: 'stream',
    type: 'line',
    data: dataRef,
    style: { color: '#00f2ff', width: 2 },
    maxPoints: 50000 // Enable rolling window
  })

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
  <div class="chart-demo">
    <div class="chart-header">
      <div class="chart-stats">
        <span class="stat">
          📊 <strong>{{ pointCount.toLocaleString() }}</strong> points
        </span>
        <span class="stat" :class="{ good: fps >= 55, warn: fps >= 30 && fps < 55, bad: fps < 30 }">
          🚀 <strong>{{ fps }}</strong> FPS
        </span>
      </div>
      <div class="chart-controls">
        <button v-if="type === 'realtime'" @click="toggleRealtime" class="btn">
          {{ isRunning ? '⏸ Pause' : '▶ Start' }}
        </button>
        <button @click="resetDemo" class="btn">🔄 Reset</button>
      </div>
    </div>
    <div 
      ref="chartContainer" 
      class="chart-container"
      :style="{ height: height || '400px' }"
    ></div>
    <p class="chart-hint">
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
  padding: 6px 12px;
  font-size: 13px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  color: var(--vp-c-text-1);
  transition: all 0.2s;
}

.btn:hover {
  background: var(--vp-c-bg-mute);
  border-color: var(--vp-c-brand);
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
