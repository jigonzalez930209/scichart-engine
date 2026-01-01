/**
 * PipelineCache - Manages GPU pipeline lifecycle
 * 
 * Caches compiled pipelines to avoid recompilation overhead.
 */

export type PipelineKind = 
  | "triangle"
  | "line"
  | "point"
  | "band"
  | "heatmap";

export interface PipelineKey {
  kind: PipelineKind;
  variant?: string; // For future shader variants
}

export interface IPipelineCache {
  /** Get or create a pipeline */
  getOrCreate<T>(key: PipelineKey, factory: () => T): T;
  
  /** Check if pipeline exists */
  has(key: PipelineKey): boolean;
  
  /** Delete a pipeline */
  delete(key: PipelineKey): void;
  
  /** Get pipeline count */
  readonly size: number;
  
  /** Cleanup all pipelines */
  destroy(): void;
}

function keyToString(key: PipelineKey): string {
  return key.variant ? `${key.kind}:${key.variant}` : key.kind;
}

/**
 * Generic pipeline cache implementation
 */
export class PipelineCache implements IPipelineCache {
  private pipelines = new Map<string, any>();
  
  getOrCreate<T>(key: PipelineKey, factory: () => T): T {
    const keyStr = keyToString(key);
    
    if (!this.pipelines.has(keyStr)) {
      const pipeline = factory();
      this.pipelines.set(keyStr, pipeline);
    }
    
    return this.pipelines.get(keyStr) as T;
  }
  
  has(key: PipelineKey): boolean {
    return this.pipelines.has(keyToString(key));
  }
  
  delete(key: PipelineKey): void {
    this.pipelines.delete(keyToString(key));
  }
  
  get size(): number {
    return this.pipelines.size;
  }
  
  destroy(): void {
    // Note: Actual pipeline destruction is backend-specific
    this.pipelines.clear();
  }
}
