/**
 * Tooltip Templates - Barrel Export
 * 
 * All available tooltip templates for different use cases.
 * 
 * @module tooltip/templates
 */

// Default template - Clean data point display
export { DefaultTooltipTemplate, defaultTooltipTemplate } from './DefaultTemplate';

// Minimal template - Ultra-compact values
export { MinimalTooltipTemplate, minimalTooltipTemplate } from './MinimalTemplate';

// Crosshair template - Multi-series at X position
export { CrosshairTooltipTemplate, crosshairTooltipTemplate } from './CrosshairTemplate';

// Heatmap template - Z values with color preview
export { HeatmapTooltipTemplate, heatmapTooltipTemplate } from './HeatmapTemplate';

// Scientific template - Full precision with notation
export { ScientificTooltipTemplate, scientificTooltipTemplate } from './ScientificTemplate';

// Annotation template - Labels and values for markers/lines
export { AnnotationTooltipTemplate, annotationTooltipTemplate } from './AnnotationTemplate';

// Range template - Statistics for data selections
export { RangeTooltipTemplate, rangeTooltipTemplate } from './RangeTemplate';

// Template registry for easy lookup
import type { TooltipTemplate, TooltipData } from '../types';
import { defaultTooltipTemplate } from './DefaultTemplate';
import { minimalTooltipTemplate } from './MinimalTemplate';
import { crosshairTooltipTemplate } from './CrosshairTemplate';
import { heatmapTooltipTemplate } from './HeatmapTemplate';
import { scientificTooltipTemplate } from './ScientificTemplate';
import { annotationTooltipTemplate } from './AnnotationTemplate';
import { rangeTooltipTemplate } from './RangeTemplate';

/** All built-in templates */
export const BUILTIN_TEMPLATES: TooltipTemplate<TooltipData>[] = [
  defaultTooltipTemplate as TooltipTemplate<TooltipData>,
  minimalTooltipTemplate as TooltipTemplate<TooltipData>,
  crosshairTooltipTemplate as TooltipTemplate<TooltipData>,
  heatmapTooltipTemplate as TooltipTemplate<TooltipData>,
  scientificTooltipTemplate as TooltipTemplate<TooltipData>,
  annotationTooltipTemplate as TooltipTemplate<TooltipData>,
  rangeTooltipTemplate as TooltipTemplate<TooltipData>
];

/** Template ID type */
export type BuiltinTemplateId = 'default' | 'minimal' | 'crosshair' | 'heatmap' | 'scientific' | 'annotation' | 'range';

/**
 * Get a built-in template by ID
 */
export function getBuiltinTemplate(id: BuiltinTemplateId | string): TooltipTemplate<TooltipData> | undefined {
  return BUILTIN_TEMPLATES.find(t => t.id === id);
}

/**
 * Get template for a tooltip type
 */
export function getDefaultTemplateForType(type: string): TooltipTemplate<TooltipData> {
  switch (type) {
    case 'datapoint':
      return defaultTooltipTemplate as TooltipTemplate<TooltipData>;
    case 'crosshair':
      return crosshairTooltipTemplate as TooltipTemplate<TooltipData>;
    case 'heatmap':
      return heatmapTooltipTemplate as TooltipTemplate<TooltipData>;
    case 'annotation':
      return annotationTooltipTemplate as TooltipTemplate<TooltipData>;
    case 'range':
      return rangeTooltipTemplate as TooltipTemplate<TooltipData>;
    default:
      return defaultTooltipTemplate as TooltipTemplate<TooltipData>;
  }
}
