export enum ViewMode {
  THEORY = 'theory',
  SIMULATOR = 'simulator',
  PROBLEMS = 'problems'
}

export enum FunctionType {
  LINEAR = 'linear',
  QUADRATIC = 'quadratic',
  EXPONENTIAL = 'exponential',
  RATIONAL = 'rational'
}

export interface LinearParams {
  m: number; // Pendiente
  n: number; // Ordenada en el origen
}

export interface QuadraticParams {
  a: number;
  b: number;
  c: number;
}

export interface ExponentialParams {
  base: number;
  k: number; // Coeficiente inicial
}

export interface DataPoint {
  x: number;
  y: number;
  y2?: number; // Para comparaciones
}
