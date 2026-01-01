/**
 * BufferStore - Manages GPU buffer lifecycle
 * 
 * Provides a unified interface for buffer management across backends.
 * Handles buffer creation, updates, and cleanup.
 */

import type { BufferId, BufferUsage } from "../types";

export interface BufferEntry {
  id: BufferId;
  usage: BufferUsage;
  byteLength: number;
  lastUpdated: number;
}

export interface IBufferStore {
  /** Create or update a buffer with new data */
  createOrUpdate(id: BufferId, data: ArrayBufferView, usage?: BufferUsage): void;
  
  /** Partially update a buffer at an offset */
  partialUpdate(id: BufferId, data: ArrayBufferView, offsetBytes: number): boolean;
  
  /** Get buffer metadata */
  getInfo(id: BufferId): BufferEntry | undefined;
  
  /** Check if buffer exists */
  has(id: BufferId): boolean;
  
  /** Delete a buffer */
  delete(id: BufferId): void;
  
  /** Get all buffer IDs */
  keys(): IterableIterator<BufferId>;
  
  /** Get buffer count */
  readonly size: number;
  
  /** Cleanup all buffers */
  destroy(): void;
}

/**
 * Abstract base class for buffer stores
 */
export abstract class BaseBufferStore implements IBufferStore {
  protected entries = new Map<BufferId, BufferEntry>();
  
  abstract createOrUpdate(id: BufferId, data: ArrayBufferView, usage?: BufferUsage): void;
  abstract partialUpdate(id: BufferId, data: ArrayBufferView, offsetBytes: number): boolean;
  abstract delete(id: BufferId): void;
  abstract destroy(): void;
  
  getInfo(id: BufferId): BufferEntry | undefined {
    return this.entries.get(id);
  }
  
  has(id: BufferId): boolean {
    return this.entries.has(id);
  }
  
  keys(): IterableIterator<BufferId> {
    return this.entries.keys();
  }
  
  get size(): number {
    return this.entries.size;
  }
}
