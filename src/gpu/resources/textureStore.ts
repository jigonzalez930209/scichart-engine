/**
 * TextureStore - Manages GPU texture lifecycle
 * 
 * Provides a unified interface for texture management across backends.
 */

import type { TextureId, TextureFormat } from "../types";

export interface TextureEntry {
  id: TextureId;
  format: TextureFormat;
  width: number;
  height: number;
  lastUpdated: number;
}

export interface ITextureStore {
  /** Create or update a 1D texture (for colormaps) */
  createOrUpdate1D(id: TextureId, data: Uint8Array, width?: number): void;
  
  /** Create or update a 2D texture */
  createOrUpdate2D(id: TextureId, data: Uint8Array, width: number, height: number): void;
  
  /** Get texture metadata */
  getInfo(id: TextureId): TextureEntry | undefined;
  
  /** Check if texture exists */
  has(id: TextureId): boolean;
  
  /** Delete a texture */
  delete(id: TextureId): void;
  
  /** Get all texture IDs */
  keys(): IterableIterator<TextureId>;
  
  /** Get texture count */
  readonly size: number;
  
  /** Cleanup all textures */
  destroy(): void;
}

/**
 * Abstract base class for texture stores
 */
export abstract class BaseTextureStore implements ITextureStore {
  protected entries = new Map<TextureId, TextureEntry>();
  
  abstract createOrUpdate1D(id: TextureId, data: Uint8Array, width?: number): void;
  abstract createOrUpdate2D(id: TextureId, data: Uint8Array, width: number, height: number): void;
  abstract delete(id: TextureId): void;
  abstract destroy(): void;
  
  getInfo(id: TextureId): TextureEntry | undefined {
    return this.entries.get(id);
  }
  
  has(id: TextureId): boolean {
    return this.entries.has(id);
  }
  
  keys(): IterableIterator<TextureId> {
    return this.entries.keys();
  }
  
  get size(): number {
    return this.entries.size;
  }
}
