/**
 * Plugin Manager Implementation
 */
import { ChartPlugin, PluginManager as IPluginManager } from "./types";
import { Chart } from "../types";

export class PluginManagerImpl implements IPluginManager {
  private plugins = new Map<string, ChartPlugin>();
  private chart: Chart;

  constructor(chart: Chart) {
    this.chart = chart;
  }

  use(plugin: ChartPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[SciChart] Plugin "${plugin.name}" is already registered.`);
      return;
    }
    this.plugins.set(plugin.name, plugin);
    plugin.init?.(this.chart);
  }

  remove(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy?.();
      return this.plugins.delete(name);
    }
    return false;
  }

  get(name: string): ChartPlugin | undefined {
    return this.plugins.get(name);
  }

  notify(hook: keyof Omit<ChartPlugin, 'name' | 'init'>, ...args: any[]): void {
    this.plugins.forEach(plugin => {
      const handler = plugin[hook] as Function;
      if (typeof handler === 'function') {
        try {
          handler(...args);
        } catch (e) {
          console.error(`[SciChart] Error in plugin "${plugin.name}" hook "${String(hook)}":`, e);
        }
      }
    });
  }

  destroy(): void {
    this.plugins.forEach(plugin => plugin.destroy?.());
    this.plugins.clear();
  }
}
