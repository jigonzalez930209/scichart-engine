/**
 * Chart Plugin Types
 */
import { Chart, ChartPlugin } from "../types";

export type { Chart, ChartPlugin };

export interface PluginManager {
  /** Attach a plugin */
  use(plugin: ChartPlugin): void;
  /** Remove a plugin by name */
  remove(name: string): boolean;
  /** Get a plugin by name */
  get(name: string): ChartPlugin | undefined;
  /** Notify all plugins of an event */
  notify(hook: keyof Omit<ChartPlugin, 'name' | 'init'>, ...args: any[]): void;
}
