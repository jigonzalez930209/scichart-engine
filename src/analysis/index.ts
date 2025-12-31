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
  subtractBaseline,
} from './utils';

export {
  solveLinearSystem,
  calculateR2,
  integrate,
  derivative,
  cumulativeIntegral,
} from './math';

export {
  fitData,
} from './fitting';

export type { 
  CycleInfo, 
  Peak, 
  PrefixInfo, 
  ValidationResult,
  DataStats,
} from './utils';

export type {
  FitType,
  FitOptions,
  FitResult,
} from './fitting';
