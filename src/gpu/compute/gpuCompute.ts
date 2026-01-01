/**
 * GPU Compute Engine
 * 
 * Provides GPU-accelerated data analysis using WebGPU compute shaders.
 * Includes statistics calculation, bounds computation, downsampling, and peak detection.
 */

import {
  STATS_COMPUTE_WGSL,
  MINMAX_COMPUTE_WGSL,
  DOWNSAMPLE_COMPUTE_WGSL,
  PEAK_DETECT_COMPUTE_WGSL,
} from "./shaders";

export interface DataStats {
  min: number;
  max: number;
  mean: number;
  std: number;
  count: number;
}

export interface DataBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface Peak {
  index: number;
  value: number;
}

export interface GpuComputeOptions {
  /** WebGPU device (if already available) */
  device?: any;
}

/**
 * GPU Compute Engine for data analysis
 */
export class GpuCompute {
  private device: any = null;
  private statsPipeline: any = null;
  private minmaxPipeline: any = null;
  private downsamplePipeline: any = null;
  private peaksPipeline: any = null;
  
  private isInitialized = false;
  
  constructor(private options: GpuComputeOptions = {}) {}
  
  /**
   * Check if GPU compute is available
   */
  static isSupported(): boolean {
    return (
      typeof (globalThis as any).navigator !== "undefined" &&
      typeof (globalThis as any).navigator.gpu !== "undefined"
    );
  }
  
  /**
   * Initialize the compute engine
   */
  async init(): Promise<void> {
    if (this.options.device) {
      this.device = this.options.device;
    } else {
      if (!GpuCompute.isSupported()) {
        throw new Error("[GpuCompute] WebGPU not supported");
      }
      
      const gpu = (globalThis as any).navigator.gpu;
      const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) {
        throw new Error("[GpuCompute] Failed to get adapter");
      }
      
      this.device = await adapter.requestDevice();
    }
    
    // Create pipelines
    await this.createPipelines();
    this.isInitialized = true;
  }
  
  private async createPipelines(): Promise<void> {
    // Stats pipeline
    const statsModule = this.device.createShaderModule({ code: STATS_COMPUTE_WGSL });
    this.statsPipeline = await this.device.createComputePipelineAsync({
      layout: "auto",
      compute: { module: statsModule, entryPoint: "main" },
    });
    
    // MinMax pipeline
    const minmaxModule = this.device.createShaderModule({ code: MINMAX_COMPUTE_WGSL });
    this.minmaxPipeline = await this.device.createComputePipelineAsync({
      layout: "auto",
      compute: { module: minmaxModule, entryPoint: "main" },
    });
    
    // Downsample pipeline
    const downsampleModule = this.device.createShaderModule({ code: DOWNSAMPLE_COMPUTE_WGSL });
    this.downsamplePipeline = await this.device.createComputePipelineAsync({
      layout: "auto",
      compute: { module: downsampleModule, entryPoint: "main" },
    });
    
    // Peak detection pipeline
    const peaksModule = this.device.createShaderModule({ code: PEAK_DETECT_COMPUTE_WGSL });
    this.peaksPipeline = await this.device.createComputePipelineAsync({
      layout: "auto",
      compute: { module: peaksModule, entryPoint: "main" },
    });
  }
  
  /**
   * Calculate statistics for a 1D array of values
   */
  async calculateStats(data: Float32Array): Promise<DataStats> {
    if (!this.isInitialized) {
      throw new Error("[GpuCompute] Not initialized");
    }
    
    const GPUBufferUsage = (globalThis as any).GPUBufferUsage;
    
    // Create input buffer
    const inputBuffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(inputBuffer, 0, data);
    
    // Create result buffer (32 bytes: 5 floats + padding)
    const resultBuffer = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    
    // Create staging buffer for readback
    const stagingBuffer = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    
    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.statsPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: inputBuffer } },
        { binding: 1, resource: { buffer: resultBuffer } },
      ],
    });
    
    // Dispatch
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.statsPipeline);
    pass.setBindGroup(0, bindGroup);
    
    const workgroups = Math.ceil(data.length / 256);
    pass.dispatchWorkgroups(workgroups);
    pass.end();
    
    // Copy result to staging
    encoder.copyBufferToBuffer(resultBuffer, 0, stagingBuffer, 0, 32);
    
    this.device.queue.submit([encoder.finish()]);
    
    // Read back
    await stagingBuffer.mapAsync((globalThis as any).GPUMapMode.READ);
    const resultData = new Float32Array(stagingBuffer.getMappedRange().slice(0));
    stagingBuffer.unmap();
    
    // Cleanup
    inputBuffer.destroy();
    resultBuffer.destroy();
    stagingBuffer.destroy();
    
    const [min, max, sum, sumSq, countFloat] = resultData;
    const count = Math.floor(countFloat);
    const mean = count > 0 ? sum / count : 0;
    const variance = count > 1 ? (sumSq - (sum * sum) / count) / (count - 1) : 0;
    const std = Math.sqrt(Math.max(0, variance));
    
    return { min, max, mean, std, count };
  }
  
  /**
   * Calculate bounds for 2D point data
   */
  async calculateBounds(points: Float32Array): Promise<DataBounds> {
    if (!this.isInitialized) {
      throw new Error("[GpuCompute] Not initialized");
    }
    
    const GPUBufferUsage = (globalThis as any).GPUBufferUsage;
    
    // Create input buffer (vec2 array)
    const inputBuffer = this.device.createBuffer({
      size: points.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(inputBuffer, 0, points);
    
    // Create result buffer (16 bytes: 4 floats)
    const resultBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    
    // Staging buffer
    const stagingBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    
    // Bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.minmaxPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: inputBuffer } },
        { binding: 1, resource: { buffer: resultBuffer } },
      ],
    });
    
    // Dispatch
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.minmaxPipeline);
    pass.setBindGroup(0, bindGroup);
    
    const pointCount = points.length / 2;
    const workgroups = Math.ceil(pointCount / 256);
    pass.dispatchWorkgroups(workgroups);
    pass.end();
    
    encoder.copyBufferToBuffer(resultBuffer, 0, stagingBuffer, 0, 16);
    this.device.queue.submit([encoder.finish()]);
    
    // Read back
    await stagingBuffer.mapAsync((globalThis as any).GPUMapMode.READ);
    const resultData = new Float32Array(stagingBuffer.getMappedRange().slice(0));
    stagingBuffer.unmap();
    
    // Cleanup
    inputBuffer.destroy();
    resultBuffer.destroy();
    stagingBuffer.destroy();
    
    return {
      xMin: resultData[0],
      xMax: resultData[1],
      yMin: resultData[2],
      yMax: resultData[3],
    };
  }
  
  /**
   * Downsample point data using min-max algorithm
   */
  async downsample(
    points: Float32Array,
    targetCount: number
  ): Promise<Float32Array> {
    if (!this.isInitialized) {
      throw new Error("[GpuCompute] Not initialized");
    }
    
    const pointCount = points.length / 2;
    if (pointCount <= targetCount) {
      return points; // No downsampling needed
    }
    
    const GPUBufferUsage = (globalThis as any).GPUBufferUsage;
    
    // Calculate bucket size (output is 2 points per bucket: min and max)
    const outputPairs = Math.ceil(targetCount / 2);
    const bucketSize = Math.ceil(pointCount / outputPairs);
    const outputCount = outputPairs * 2;
    
    // Create params buffer
    const paramsData = new Uint32Array([pointCount, outputCount, bucketSize, 0]);
    const paramsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(paramsBuffer, 0, paramsData);
    
    // Create input buffer
    const inputBuffer = this.device.createBuffer({
      size: points.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(inputBuffer, 0, points);
    
    // Create output buffer
    const outputSize = outputCount * 2 * 4; // vec2 * count * sizeof(float)
    const outputBuffer = this.device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    
    // Staging buffer
    const stagingBuffer = this.device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    
    // Bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.downsamplePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: paramsBuffer } },
        { binding: 1, resource: { buffer: inputBuffer } },
        { binding: 2, resource: { buffer: outputBuffer } },
      ],
    });
    
    // Dispatch
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.downsamplePipeline);
    pass.setBindGroup(0, bindGroup);
    
    const workgroups = Math.ceil(outputPairs / 64);
    pass.dispatchWorkgroups(workgroups);
    pass.end();
    
    encoder.copyBufferToBuffer(outputBuffer, 0, stagingBuffer, 0, outputSize);
    this.device.queue.submit([encoder.finish()]);
    
    // Read back
    await stagingBuffer.mapAsync((globalThis as any).GPUMapMode.READ);
    const result = new Float32Array(stagingBuffer.getMappedRange().slice(0));
    stagingBuffer.unmap();
    
    // Cleanup
    paramsBuffer.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
    stagingBuffer.destroy();
    
    return result;
  }
  
  /**
   * Detect peaks in 1D data
   */
  async detectPeaks(
    data: Float32Array,
    options: { threshold?: number; minDistance?: number } = {}
  ): Promise<Peak[]> {
    if (!this.isInitialized) {
      throw new Error("[GpuCompute] Not initialized");
    }
    
    const threshold = options.threshold ?? 0;
    const minDistance = options.minDistance ?? 1;
    
    const GPUBufferUsage = (globalThis as any).GPUBufferUsage;
    
    // Create params buffer
    const paramsData = new Float32Array([
      data.length,
      threshold,
      minDistance,
      0, // padding
    ]);
    const paramsBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(paramsBuffer, 0, new Uint8Array(paramsData.buffer));
    
    // Input buffer
    const inputBuffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(inputBuffer, 0, data);
    
    // Output buffer (Peak struct = 16 bytes each)
    const outputSize = data.length * 16;
    const outputBuffer = this.device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    
    // Staging buffer
    const stagingBuffer = this.device.createBuffer({
      size: outputSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    
    // Bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.peaksPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: paramsBuffer } },
        { binding: 1, resource: { buffer: inputBuffer } },
        { binding: 2, resource: { buffer: outputBuffer } },
      ],
    });
    
    // Dispatch
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.peaksPipeline);
    pass.setBindGroup(0, bindGroup);
    
    const workgroups = Math.ceil(data.length / 64);
    pass.dispatchWorkgroups(workgroups);
    pass.end();
    
    encoder.copyBufferToBuffer(outputBuffer, 0, stagingBuffer, 0, outputSize);
    this.device.queue.submit([encoder.finish()]);
    
    // Read back
    await stagingBuffer.mapAsync((globalThis as any).GPUMapMode.READ);
    const resultBuffer = new ArrayBuffer(outputSize);
    new Uint8Array(resultBuffer).set(new Uint8Array(stagingBuffer.getMappedRange()));
    stagingBuffer.unmap();
    
    // Parse peaks
    const resultView = new DataView(resultBuffer);
    const peaks: Peak[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const offset = i * 16;
      const isPeak = resultView.getUint32(offset + 8, true);
      
      if (isPeak) {
        peaks.push({
          index: resultView.getUint32(offset, true),
          value: resultView.getFloat32(offset + 4, true),
        });
      }
    }
    
    // Cleanup
    paramsBuffer.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
    stagingBuffer.destroy();
    
    return peaks;
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    // Pipelines are managed by device, no explicit cleanup needed
    this.device = null;
    this.statsPipeline = null;
    this.minmaxPipeline = null;
    this.downsamplePipeline = null;
    this.peaksPipeline = null;
    this.isInitialized = false;
  }
}
