export interface WebGPURendererOptions {
  powerPreference?: "low-power" | "high-performance";
  preferredFormat?: string;
  antialias?: boolean;
}

export class WebGPURenderer {
  public readonly available: boolean;

  private canvas: HTMLCanvasElement;
  private adapter: any;
  private device: any;
  private context: any;

  constructor(canvas: HTMLCanvasElement, opts: WebGPURendererOptions = {}) {
    this.canvas = canvas;
    this.available = WebGPURenderer.isSupported();
    void opts;
  }

  static isSupported(): boolean {
    return (
      typeof (globalThis as any).navigator !== "undefined" &&
      typeof (globalThis as any).navigator.gpu !== "undefined"
    );
  }

  async init(opts: WebGPURendererOptions = {}): Promise<void> {
    if (!this.available) {
      throw new Error("[SciChart] WebGPU is not supported in this environment");
    }

    const gpu = (globalThis as any).navigator.gpu;
    this.adapter = await gpu.requestAdapter({
      powerPreference: opts.powerPreference ?? "high-performance",
    });

    if (!this.adapter) {
      throw new Error("[SciChart] Failed to request WebGPU adapter");
    }

    this.device = await this.adapter.requestDevice();

    const ctx = (this.canvas as any).getContext("webgpu");
    if (!ctx) {
      throw new Error("[SciChart] Failed to get WebGPU context");
    }

    this.context = ctx;

    const format =
      opts.preferredFormat ??
      (gpu.getPreferredCanvasFormat
        ? gpu.getPreferredCanvasFormat()
        : "bgra8unorm");

    this.context.configure({
      device: this.device,
      format,
      alphaMode: "premultiplied",
    });
  }

  destroy(): void {
    this.device = undefined;
    this.adapter = undefined;
    this.context = undefined;
  }
}
