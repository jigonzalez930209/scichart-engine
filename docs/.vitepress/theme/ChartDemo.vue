<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useData } from 'vitepress'

const props = defineProps<{
  type?: 'basic' | 'realtime' | 'large' | 'scatter' | 'multi'
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
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'X', auto: true },
    yAxis: { label: 'Y', auto: true },
    theme: chartTheme.value,
    showControls: true,
  })
  
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

function startRealtime() {
  isRunning.value = true
  dataRef = { x: new Float32Array(0), y: new Float32Array(0) }
  tRef = 0
  
  chart.addSeries({
    id: 'stream',
    type: 'line',
    data: dataRef,
    style: { color: '#00f2ff', width: 1.5 },
  })
  
  let lastUpdate = performance.now()
  const pointsPerFrame = 10
  
  const animate = () => {
    if (!chart) return
    
    const now = performance.now()
    if (now - lastUpdate >= 16) {
      lastUpdate = now
      
      const prev = dataRef
      const newX = new Float32Array(prev.x.length + pointsPerFrame)
      const newY = new Float32Array(prev.y.length + pointsPerFrame)
      newX.set(prev.x)
      newY.set(prev.y)
      
      for (let i = 0; i < pointsPerFrame; i++) {
        const idx = prev.x.length + i
        newX[idx] = tRef
        
        // Varying waveform
        const phase = Math.floor(tRef / 500) % 4
        let signal: number
        if (phase === 0) {
          signal = Math.sin(tRef * 0.02)
        } else if (phase === 1) {
          signal = Math.sin(tRef * 0.02) + Math.sin(tRef * 0.06) / 3
        } else if (phase === 2) {
          signal = ((tRef * 0.01) % (2 * Math.PI)) / Math.PI - 1
        } else {
          signal = Math.sin(tRef * 0.02 + Math.sin(tRef * 0.002) * 3)
        }
        
        newY[idx] = signal + Math.random() * 0.1
        tRef += 0.1
      }
      
      dataRef = { x: newX, y: newY }
      chart.updateSeries('stream', { x: newX, y: newY })
      pointCount.value = newX.length
    }
    
    if (isRunning.value) {
      animationId = requestAnimationFrame(animate)
    }
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
