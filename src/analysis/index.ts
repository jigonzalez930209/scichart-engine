/**
 * Data Analysis module exports
 *
 * General-purpose utilities for data formatting, cycle detection,
 * peak detection, and data validation.
 */

export {
  formatWithPrefix,
  formatValue,
  formatScientific,
  getBestPrefix,
  detectCycles,
  generateCycleColors,
  detectPeaks,
  validateData,
  calculateStats,
  movingAverage,
  downsampleLTTB,
} from './utils';

export type { 
  CycleInfo, 
  Peak, 
  PrefixInfo, 
  ValidationResult,
  DataStats,
} from './utils';
