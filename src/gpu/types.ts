import type { DrawList } from "./drawList";
import type { FrameUniforms } from "./frame";

export type GpuBackendType = "webgpu" | "webgl";

export type RGBA = readonly [number, number, number, number];

export interface GpuViewport {
  width: number;
  height: number;
  dpr: number;
}

export interface GpuLimits {
  maxTextureDimension2D?: number;
  maxBufferSize?: number;
  [key: string]: unknown;
}

export interface GpuBackendInfo {
  type: GpuBackendType;
  available: boolean;
  limits?: GpuLimits;
}

export type BufferId = string;
export type TextureId = string;

export type BufferUsage = "vertex" | "index" | "uniform";

export interface BufferDescriptor {
  id: BufferId;
  usage: BufferUsage;
  byteStride?: number;
}

export type TextureFormat = "rgba8unorm" | "bgra8unorm";

export interface Texture1DDescriptor {
  id: TextureId;
  format: TextureFormat;
  width: number;
}

export interface Dispose {
  destroy(): void;
}

export interface GpuBackend extends Dispose {
  readonly info: GpuBackendInfo;

  init(): Promise<void>;

  setViewport(viewport: GpuViewport): void;

  createOrUpdateBuffer(
    id: BufferId,
    data: ArrayBufferView,
    desc?: Partial<BufferDescriptor>
  ): void;
  deleteBuffer(id: BufferId): void;

  createOrUpdateTexture1D(
    id: TextureId,
    data: Uint8Array,
    desc?: Partial<Texture1DDescriptor>
  ): void;
  deleteTexture(id: TextureId): void;

  render(drawList: DrawList, frame: FrameUniforms): void;
}
