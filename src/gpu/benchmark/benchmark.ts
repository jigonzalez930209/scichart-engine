/**
 * GPU Benchmark Utilities
 * 
 * Provides tools for measuring rendering performance across backends.
 */

export interface BenchmarkResult {
  backend: "webgpu" | "webgl" | "unknown";
  pointCount: number;
  fps: number;
  avgFrameTime: number; // ms
  minFrameTime: number; // ms
  maxFrameTime: number; // ms
  totalFrames: number;
  duration: number; // ms
}

export interface BenchmarkOptions {
  /** Number of points to render */
  pointCount?: number;
  
  /** Duration of benchmark in milliseconds */
  durationMs?: number;
  
  /** Warm-up frames before measuring */
  warmupFrames?: number;
  
  /** Callback for progress updates */
  onProgress?: (progress: number) => void;
}

/**
 * Benchmark runner for GPU backends
 */
export class GpuBenchmark {
  private canvas: HTMLCanvasElement;
  private results: BenchmarkResult[] = [];
  
  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement("canvas");
    if (!canvas) {
      this.canvas.width = 800;
      this.canvas.height = 600;
    }
  }
  
  /**
   * Generate random line data
   */
  private generateLineData(pointCount: number): Float32Array {
    const data = new Float32Array(pointCount * 2);
    for (let i = 0; i < pointCount; i++) {
      data[i * 2] = i / (pointCount - 1); // x: 0 to 1
      data[i * 2 + 1] = Math.random(); // y: random
    }
    return data;
  }
  
  /**
   * Measure frame times
   */
  private async measureFrameTimes(
    renderFn: () => void,
    durationMs: number,
    warmupFrames: number = 10,
    onProgress?: (progress: number) => void
  ): Promise<{ frameTimes: number[]; duration: number }> {
    const frameTimes: number[] = [];
    let lastTime = performance.now();
    let warmupCount = 0;
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const loop = () => {
        const now = performance.now();
        const elapsed = now - startTime;
        
        if (elapsed >= durationMs + (warmupFrames * 16)) {
          resolve({ frameTimes, duration: elapsed - (warmupFrames * 16) });
          return;
        }
        
        renderFn();
        
        if (warmupCount >= warmupFrames) {
          frameTimes.push(now - lastTime);
          
          if (onProgress) {
            const progress = Math.min(1, elapsed / durationMs);
            onProgress(progress);
          }
        } else {
          warmupCount++;
        }
        
        lastTime = now;
        requestAnimationFrame(loop);
      };
      
      requestAnimationFrame(loop);
    });
  }
  
  /**
   * Run benchmark with WebGPU backend
   */
  async benchmarkWebGPU(options: BenchmarkOptions = {}): Promise<BenchmarkResult | null> {
    // Dynamic import to handle environments without WebGPU
    const { WebGPUBackend } = await import("../backends/webgpu/WebGPUBackend");
    
    if (!WebGPUBackend.isSupported()) {
      console.warn("[Benchmark] WebGPU not supported");
      return null;
    }
    
    const pointCount = options.pointCount ?? 100000;
    const durationMs = options.durationMs ?? 5000;
    const warmupFrames = options.warmupFrames ?? 30;
    
    const backend = new WebGPUBackend(this.canvas);
    await backend.init();
    
    backend.setViewport({
      width: this.canvas.width,
      height: this.canvas.height,
      dpr: 1,
    });
    
    const data = this.generateLineData(pointCount);
    backend.createOrUpdateBuffer("bench-line", data, { usage: "vertex" });
    
    const drawList = {
      items: [{
        id: "bench-line",
        kind: "line" as const,
        bufferId: "bench-line",
        count: pointCount,
        visible: true,
        style: { color: [0, 0.9, 1, 1] as const },
      }],
    };
    
    const frame = {
      viewport: { width: this.canvas.width, height: this.canvas.height, dpr: 1 },
      clearColor: [0.1, 0.1, 0.15, 1] as const,
    };
    
    const bounds = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    
    const renderFn = () => {
      (backend as any).renderWithBounds(drawList, frame, bounds);
    };
    
    const { frameTimes, duration } = await this.measureFrameTimes(
      renderFn,
      durationMs,
      warmupFrames,
      options.onProgress
    );
    
    backend.destroy();
    
    const result = this.calculateResult("webgpu", pointCount, frameTimes, duration);
    this.results.push(result);
    return result;
  }
  
  /**
   * Run benchmark with WebGL backend
   */
  async benchmarkWebGL(options: BenchmarkOptions = {}): Promise<BenchmarkResult | null> {
    const { WebGLBackend } = await import("../backends/webgl/WebGLBackend");
    
    if (!WebGLBackend.isSupported()) {
      console.warn("[Benchmark] WebGL not supported");
      return null;
    }
    
    const pointCount = options.pointCount ?? 100000;
    const durationMs = options.durationMs ?? 5000;
    const warmupFrames = options.warmupFrames ?? 30;
    
    const backend = new WebGLBackend(this.canvas);
    await backend.init();
    
    backend.setViewport({
      width: this.canvas.width,
      height: this.canvas.height,
      dpr: 1,
    });
    
    const data = this.generateLineData(pointCount);
    backend.createOrUpdateBuffer("bench-line", data, { usage: "vertex" });
    
    const drawList = {
      items: [{
        id: "bench-line",
        kind: "line" as const,
        bufferId: "bench-line",
        count: pointCount,
        visible: true,
        style: { color: [0, 0.9, 1, 1] as const },
      }],
    };
    
    const frame = {
      viewport: { width: this.canvas.width, height: this.canvas.height, dpr: 1 },
      clearColor: [0.1, 0.1, 0.15, 1] as const,
    };
    
    const bounds = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    
    const renderFn = () => {
      backend.renderWithBounds(drawList, frame, bounds);
    };
    
    const { frameTimes, duration } = await this.measureFrameTimes(
      renderFn,
      durationMs,
      warmupFrames,
      options.onProgress
    );
    
    backend.destroy();
    
    const result = this.calculateResult("webgl", pointCount, frameTimes, duration);
    this.results.push(result);
    return result;
  }
  
  /**
   * Calculate benchmark result from frame times
   */
  private calculateResult(
    backend: "webgpu" | "webgl",
    pointCount: number,
    frameTimes: number[],
    duration: number
  ): BenchmarkResult {
    if (frameTimes.length === 0) {
      return {
        backend,
        pointCount,
        fps: 0,
        avgFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        totalFrames: 0,
        duration,
      };
    }
    
    const sum = frameTimes.reduce((a, b) => a + b, 0);
    const avg = sum / frameTimes.length;
    const min = Math.min(...frameTimes);
    const max = Math.max(...frameTimes);
    
    return {
      backend,
      pointCount,
      fps: Math.round(1000 / avg),
      avgFrameTime: Math.round(avg * 100) / 100,
      minFrameTime: Math.round(min * 100) / 100,
      maxFrameTime: Math.round(max * 100) / 100,
      totalFrames: frameTimes.length,
      duration: Math.round(duration),
    };
  }
  
  /**
   * Run comparative benchmark
   */
  async runComparison(options: BenchmarkOptions = {}): Promise<{
    webgpu: BenchmarkResult | null;
    webgl: BenchmarkResult | null;
    winner: "webgpu" | "webgl" | "tie" | "unknown";
    speedup: number;
  }> {
    const webgpu = await this.benchmarkWebGPU(options);
    const webgl = await this.benchmarkWebGL(options);
    
    let winner: "webgpu" | "webgl" | "tie" | "unknown" = "unknown";
    let speedup = 1;
    
    if (webgpu && webgl) {
      if (webgpu.fps > webgl.fps * 1.05) {
        winner = "webgpu";
        speedup = webgpu.fps / webgl.fps;
      } else if (webgl.fps > webgpu.fps * 1.05) {
        winner = "webgl";
        speedup = webgl.fps / webgpu.fps;
      } else {
        winner = "tie";
        speedup = 1;
      }
    } else if (webgpu) {
      winner = "webgpu";
    } else if (webgl) {
      winner = "webgl";
    }
    
    return { webgpu, webgl, winner, speedup: Math.round(speedup * 100) / 100 };
  }
  
  /**
   * Get all results
   */
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }
  
  /**
   * Clear results
   */
  clearResults(): void {
    this.results = [];
  }
  
  /**
   * Format result as string
   */
  static formatResult(result: BenchmarkResult): string {
    return [
      `Backend: ${result.backend.toUpperCase()}`,
      `Points: ${result.pointCount.toLocaleString()}`,
      `FPS: ${result.fps}`,
      `Avg Frame: ${result.avgFrameTime}ms`,
      `Min/Max: ${result.minFrameTime}ms / ${result.maxFrameTime}ms`,
      `Frames: ${result.totalFrames}`,
      `Duration: ${result.duration}ms`,
    ].join(" | ");
  }
}
