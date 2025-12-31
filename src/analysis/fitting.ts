/**
 * Curve Fitting and Regression Analysis
 */
import { solveLinearSystem, calculateR2 } from './math';

export type FitType = 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'power';

export interface FitOptions {
  /** Degree for polynomial fit (default: 2) */
  degree?: number;
  /** Custom label for the equation */
  label?: string;
  /** Number of decimals in equation string */
  precision?: number;
}

export interface FitResult {
  type: FitType;
  /** Coefficients (a, b, c...) */
  coefficients: number[];
  /** Formatted equation string */
  equation: string;
  /** Coefficient of determination */
  rSquared: number;
  /** Function to calculate value at X */
  predict: (x: number) => number;
}

/**
 * Perform regression on a dataset
 */
export function fitData(
  x: number[] | Float32Array,
  y: number[] | Float32Array,
  type: FitType,
  options: FitOptions = {}
): FitResult {
  const n = x.length;
  if (n < 2) throw new Error("At least 2 points are required for fitting");

  switch (type) {
    case 'linear':
      return fitLinear(x, y, options);
    case 'polynomial':
      return fitPolynomial(x, y, options.degree ?? 2, options);
    case 'exponential':
      return fitExponential(x, y, options);
    case 'logarithmic':
      return fitLogarithmic(x, y, options);
    case 'power':
      return fitPower(x, y, options);
    default:
      throw new Error(`Unsupported fit type: ${type}`);
  }
}

function fitLinear(x: any, y: any, opts: FitOptions): FitResult {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predict = (v: number) => slope * v + intercept;
  const prec = opts.precision ?? 4;
  
  return {
    type: 'linear',
    coefficients: [slope, intercept],
    equation: `y = ${slope.toFixed(prec)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(prec)}`,
    rSquared: calculateR2(x, y, predict),
    predict
  };
}

function fitPolynomial(x: any, y: any, degree: number, opts: FitOptions): FitResult {
  const n = x.length;
  const m = degree + 1;
  const A: number[][] = Array.from({ length: m }, () => new Array(m).fill(0));
  const B: number[] = new Array(m).fill(0);

  // Normal equations for least squares polynomial fit
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += Math.pow(x[k], i + j);
      }
      A[i][j] = sum;
    }

    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += y[k] * Math.pow(x[k], i);
    }
    B[i] = sum;
  }

  const coeffs = solveLinearSystem(A, B); // c0, c1, c2...

  const predict = (v: number) => {
    let res = 0;
    for (let i = 0; i < coeffs.length; i++) {
      res += coeffs[i] * Math.pow(v, i);
    }
    return res;
  };

  const prec = opts.precision ?? 4;
  let equation = "y = ";
  for (let i = coeffs.length - 1; i >= 0; i--) {
    const c = coeffs[i];
    if (i < coeffs.length - 1) equation += c >= 0 ? " + " : " - ";
    else if (c < 0) equation += "-";
    
    equation += `${Math.abs(c).toFixed(prec)}${i > 0 ? (i > 1 ? `x^${i}` : 'x') : ''}`;
  }

  return {
    type: 'polynomial',
    coefficients: coeffs,
    equation,
    rSquared: calculateR2(x, y, predict),
    predict
  };
}

function fitExponential(x: any, y: any, opts: FitOptions): FitResult {
  // y = a * e^(bx)  =>  ln(y) = ln(a) + bx
  // Use linear fit on (x, ln(y))
  const n = x.length;
  const xPrime = [];
  const yPrime = [];

  for (let i = 0; i < n; i++) {
    if (y[i] > 0) {
      xPrime.push(x[i]);
      yPrime.push(Math.log(y[i]));
    }
  }

  const result = fitLinear(xPrime, yPrime, opts);
  const b = result.coefficients[0];
  const a = Math.exp(result.coefficients[1]);

  const predict = (v: number) => a * Math.exp(b * v);
  const prec = opts.precision ?? 4;

  return {
    type: 'exponential',
    coefficients: [a, b],
    equation: `y = ${a.toFixed(prec)} * e^(${b.toFixed(prec)}x)`,
    rSquared: calculateR2(x, y, predict),
    predict
  };
}

function fitLogarithmic(x: any, y: any, opts: FitOptions): FitResult {
  // y = a + b * ln(x)
  // Use linear fit on (ln(x), y)
  const n = x.length;
  const xPrime = [];
  const yPrime = [];

  for (let i = 0; i < n; i++) {
    if (x[i] > 0) {
      xPrime.push(Math.log(x[i]));
      yPrime.push(y[i]);
    }
  }

  const result = fitLinear(xPrime, yPrime, opts);
  const b = result.coefficients[0];
  const a = result.coefficients[1];

  const predict = (v: number) => a + b * Math.log(v);
  const prec = opts.precision ?? 4;

  return {
    type: 'logarithmic',
    coefficients: [a, b],
    equation: `y = ${a.toFixed(prec)} ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(prec)} * ln(x)`,
    rSquared: calculateR2(x, y, predict),
    predict
  };
}

function fitPower(x: any, y: any, opts: FitOptions): FitResult {
  // y = a * x^b => ln(y) = ln(a) + b * ln(x)
  const n = x.length;
  const xPrime = [];
  const yPrime = [];

  for (let i = 0; i < n; i++) {
    if (x[i] > 0 && y[i] > 0) {
      xPrime.push(Math.log(x[i]));
      yPrime.push(Math.log(y[i]));
    }
  }

  const result = fitLinear(xPrime, yPrime, opts);
  const b = result.coefficients[0];
  const a = Math.exp(result.coefficients[1]);

  const predict = (v: number) => a * Math.pow(v, b);
  const prec = opts.precision ?? 4;

  return {
    type: 'power',
    coefficients: [a, b],
    equation: `y = ${a.toFixed(prec)} * x^(${b.toFixed(prec)})`,
    rSquared: calculateR2(x, y, predict),
    predict
  };
}
