<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const chartContainer = ref<HTMLElement | null>(null)
const fps = ref(0)
const minFps = ref(Infinity)
const maxFps = ref(0)
const isLoading = ref(true)
const progress = ref(0)
const startTime = ref(0)
const totalTime = ref(0)

let chart: any = null
let frameCount = 0
const WARMUP_FRAMES = 120 // 2 seconds at 60fps to settle

const TOTAL_SERIES = 3
const POINTS_PER_SERIES = 10_000_000
const POINT_COUNT = POINTS_PER_SERIES * TOTAL_SERIES

onMounted(async () => {
  if (typeof window === 'undefined' || !chartContainer.value) return
  
  const { createChart } = await import('@src/index')
  
  chart = createChart({
    container: chartContainer.value,
    xAxis: { label: 'Index', auto: true, scientific: true },
    yAxis: { label: 'Signal Amplitude', auto: true },
    theme: 'midnight',
    showControls: true,
  })
  
  chart.on('render', (e: any) => {
    // Smoothed FPS (Exponential Moving Average)
    const alpha = 0.05 // Very slow updates
    const currentFps = e.fps
    
    if (fps.value === 0) {
      fps.value = Math.round(currentFps)
    } else {
      fps.value = Math.round(fps.value * (1 - alpha) + currentFps * alpha)
    }

    // Track min/max only after warmup and loading
    if (!isLoading.value) {
      frameCount++
      if (frameCount > WARMUP_FRAMES) {
        if (currentFps < minFps.value) minFps.value = Math.round(currentFps)
        if (currentFps > maxFps.value) maxFps.value = Math.round(currentFps)
      }
    }
  })
  
  generateData()
})

onUnmounted(() => {
  if (chart) chart.destroy()
  if (cinematicRaf) cancelAnimationFrame(cinematicRaf)
})

async function generateData() {
  const start = performance.now()
  startTime.value = start
  
  const seriesData = [
    { id: 'series-1', color: '#00f2ff', offset: 0 },
    { id: 'series-2', color: '#a855f7', offset: 2 },
    { id: 'series-3', color: '#ffea00', offset: -2 }
  ]

  const chunkSize = 1_000_000
  let currentSeriesIdx = 0
  let offset = 0
  
  // Pre-allocate arrays for ONE series to save memory during generation
  let x = new Float32Array(POINTS_PER_SERIES)
  let y = new Float32Array(POINTS_PER_SERIES)

  const processChunk = () => {
    const end = Math.min(offset + chunkSize, POINTS_PER_SERIES)
    const baseOffset = seriesData[currentSeriesIdx].offset
    
    for (let i = offset; i < end; i++) {
        x[i] = i
        // Unique pattern for each series
        if (currentSeriesIdx === 0) {
          y[i] = Math.sin(i * 0.0001) * Math.cos(i * 0.00003) + Math.sin(i * 0.005) * 0.2 + baseOffset
        } else if (currentSeriesIdx === 1) {
          y[i] = Math.cos(i * 0.00012) * Math.sin(i * 0.00005) * 1.5 + Math.cos(i * 0.008) * 0.15 + baseOffset
        } else {
          y[i] = Math.sin(i * 0.00008) * 2 + Math.sin(i * 0.01) * 0.1 + baseOffset
        }
    }
    
    offset = end
    const totalProcessed = (currentSeriesIdx * POINTS_PER_SERIES) + offset
    progress.value = Math.round((totalProcessed / POINT_COUNT) * 100)
    
    if (offset < POINTS_PER_SERIES) {
      requestAnimationFrame(processChunk)
    } else {
      // Add series to chart
      chart.addSeries({
        id: seriesData[currentSeriesIdx].id,
        name: `Signal ${currentSeriesIdx + 1}`,
        type: 'line',
        data: { x, y },
        style: { color: seriesData[currentSeriesIdx].color, width: 1, opacity: 0.7 }
      })

      currentSeriesIdx++
      if (currentSeriesIdx < TOTAL_SERIES) {
        offset = 0
        x = new Float32Array(POINTS_PER_SERIES)
        y = new Float32Array(POINTS_PER_SERIES)
        requestAnimationFrame(processChunk)
      } else {
        finalize()
      }
    }
  }
  
  const finalize = () => {
    totalTime.value = Math.round(performance.now() - start)
    isLoading.value = false
    chart.autoScale()
  }
  
  processChunk()
}

const isCinematic = ref(false)
let cinematicRaf: number | null = null

function toggleCinematic() {
  isCinematic.value = !isCinematic.value
  if (isCinematic.value) {
    runCinematic()
  } else if (cinematicRaf) {
    cancelAnimationFrame(cinematicRaf)
  }
}

function runCinematic() {
  if (!chart || !isCinematic.value) return

  const duration = 30000 // 30 seconds for a more complex loop
  const start = performance.now()
  
  const animate = () => {
    if (!isCinematic.value) return
    const elapsed = performance.now() - start
    const t = (elapsed % duration) / duration
    
    // Multi-stage cinematic path
    let xMin, xMax, yMin, yMax
    
    if (t < 0.2) {
      // Stage 1: Initial Slow Zoom-out
      const p = t / 0.2
      const spread = POINTS_PER_SERIES * (0.01 + 0.99 * p)
      xMin = 0
      xMax = spread
      yMin = -5
      yMax = 5
    } else if (t < 0.5) {
      // Stage 2: Fast Pan "Scan"
      const p = (t - 0.2) / 0.3
      const window = POINTS_PER_SERIES * 0.05
      const center = p * POINTS_PER_SERIES
      xMin = center - window
      xMax = center + window
      // Vertical oscillation during scan
      const vOsc = Math.sin(p * Math.PI * 4) * 2
      yMin = -2 + vOsc
      yMax = 2 + vOsc
    } else if (t < 0.8) {
      // Stage 3: Micro-Detail Zoom and Bounce
      const p = (t - 0.5) / 0.3
      const bounce = Math.abs(Math.sin(p * Math.PI * 8)) * 0.5
      const zoom = 0.001 + bounce * 0.01
      const center = POINTS_PER_SERIES * 0.8
      xMin = center - (POINTS_PER_SERIES * zoom)
      xMax = center + (POINTS_PER_SERIES * zoom)
      yMin = -1
      yMax = 1
    } else {
      // Stage 4: Cinematic Pull-back to Hero Shot
      const p = (t - 0.8) / 0.2
      const pull = Math.pow(p, 2)
      xMin = -POINTS_PER_SERIES * 0.05 * (1-pull)
      xMax = POINTS_PER_SERIES * (zoomOut(pull))
      yMin = -5 * (pull + 0.2)
      yMax = 5 * (pull + 0.2)
    }

    function zoomOut(p: number) { return 0.01 + 0.99 * p }

    chart.zoom({
      x: [xMin, xMax],
      y: [yMin, yMax]
    })
    
    cinematicRaf = requestAnimationFrame(animate)
  }
  
  cinematicRaf = requestAnimationFrame(animate)
}
</script>

<template>
  <div class="ten-million-wrapper">
    <!-- Toolbar outside the chart -->
    <div class="demo-toolbar" v-if="!isLoading">
      <div class="toolbar-metrics">
        <div class="metric-block">
          <span class="label">POINTS</span>
          <span class="value cyan">30,000,000</span>
        </div>
        <div class="metric-block">
          <span class="label">FPS (AVG/MIN/MAX)</span>
          <div class="fps-values">
            <span class="value" :class="{ 'green': fps >= 55, 'yellow': fps < 55 }">{{ fps }}</span>
            <span class="sub-value red" v-if="minFps !== Infinity">{{ minFps }}</span>
            <span class="sub-value cyan" v-if="maxFps !== 0">{{ maxFps }}</span>
          </div>
        </div>
        <div class="metric-block">
          <span class="label">GEN TIME</span>
          <span class="value">{{ totalTime }}ms</span>
        </div>
      </div>
      
      <div class="toolbar-actions">
        <button @click="toggleCinematic" class="btn-cinematic" :class="{ active: isCinematic }">
          <span class="icon">{{ isCinematic ? '🎬' : '📹' }}</span>
          {{ isCinematic ? 'Cinematic Active' : 'Start Cinematic' }}
        </button>
      </div>
    </div>

    <div class="ten-million-demo">
      <div v-if="isLoading" class="loader-overlay">
        <div class="loader-content">
          <div class="spinner"></div>
          <div class="text-container">
            <h3>Generating 10,000,000 Points</h3>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <p>{{ progress }}% - Please wait...</p>
          </div>
        </div>
      </div>
      
      <div ref="chartContainer" class="chart-canvas-container"></div>
      
      <div class="controls-hint" v-if="!isLoading">
        <span>🖱️ Scroll to Zoom</span>
        <span>↔️ Drag to Pan</span>
        <span>⚡ WebGL Accelerated</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ten-million-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.demo-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 15, 25, 0.8);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  flex-wrap: wrap;
  gap: 1rem;
}

.toolbar-metrics {
  display: flex;
  gap: 2rem;
}

.metric-block {
  display: flex;
  flex-direction: column;
}

.metric-block .label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-bottom: 0.2rem;
}

.metric-block .value {
  font-size: 1.2rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  line-height: 1.1;
}

.fps-values {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.sub-value {
  font-size: 0.8rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}

.sub-value.red { color: #f85149; }
.sub-value.cyan { color: #58a6ff; }

.value.cyan { color: #00f2ff; text-shadow: 0 0 10px rgba(0, 242, 255, 0.3); }
.value.green { color: #3fb950; text-shadow: 0 0 10px rgba(63, 185, 80, 0.3); }
.value.yellow { color: #d29922; }

.btn-cinematic {
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid #a855f7;
  color: #d8b4fe;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-cinematic:hover {
  background: rgba(168, 85, 247, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
}

.btn-cinematic.active {
  background: #a855f7;
  color: white;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
}

.btn-cinematic .icon {
  font-size: 1.1rem;
}

.ten-million-demo {
  position: relative;
  width: 100%;
  height: 550px;
  background: #05050a;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.chart-canvas-container {
  width: 100%;
  height: 100%;
}

.loader-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: #05050a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loader-content {
  text-align: center;
  width: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 242, 255, 0.1);
  border-top-color: #00f2ff;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00f2ff, #a855f7);
  transition: width 0.1s linear;
}

.controls-hint {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 5;
  display: flex;
  gap: 1.5rem;
  background: rgba(15, 15, 25, 0.6);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  backdrop-filter: blur(4px);
}

@media (max-width: 768px) {
  .demo-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar-metrics {
    justify-content: space-between;
    gap: 1rem;
  }
  .btn-cinematic {
    width: 100%;
    justify-content: center;
  }
}
</style>
