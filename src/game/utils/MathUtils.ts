/**
 * =============================================================================
 * MATH UTILS - UTILITÁRIOS MATEMÁTICOS
 * =============================================================================
 *
 * Funções matemáticas úteis para cálculos de jogo, física e 3D.
 */

import type { Position3D, Rotation3D } from '../types';

// =============================================================================
// CONSTANTES
// =============================================================================

/** PI constante */
export const PI = Math.PI;

/** 2 * PI */
export const TWO_PI = Math.PI * 2;

/** PI / 2 */
export const HALF_PI = Math.PI / 2;

/** Conversão de graus para radianos */
export const DEG_TO_RAD = Math.PI / 180;

/** Conversão de radianos para graus */
export const RAD_TO_DEG = 180 / Math.PI;

/** Epsilon para comparação de floats */
export const EPSILON = 0.0001;

// =============================================================================
// FUNÇÕES DE VETORES 3D
// =============================================================================

/**
 * Soma dois vetores
 */
export function addVectors(a: Position3D, b: Position3D): Position3D {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/**
 * Subtrai dois vetores (a - b)
 */
export function subtractVectors(a: Position3D, b: Position3D): Position3D {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/**
 * Multiplica vetor por escalar
 */
export function scaleVector(v: Position3D, s: number): Position3D {
  return [v[0] * s, v[1] * s, v[2] * s];
}

/**
 * Calcula magnitude (comprimento) do vetor
 */
export function vectorMagnitude(v: Position3D): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/**
 * Normaliza um vetor (comprimento 1)
 */
export function normalizeVector(v: Position3D): Position3D {
  const mag = vectorMagnitude(v);
  if (mag < EPSILON) return [0, 0, 0];
  return [v[0] / mag, v[1] / mag, v[2] / mag];
}

/**
 * Produto escalar (dot product)
 */
export function dotProduct(a: Position3D, b: Position3D): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Produto vetorial (cross product)
 */
export function crossProduct(a: Position3D, b: Position3D): Position3D {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Calcula distância entre dois pontos
 */
export function distance(a: Position3D, b: Position3D): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calcula distância ao quadrado (mais rápido para comparações)
 */
export function distanceSquared(a: Position3D, b: Position3D): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Interpolação linear entre dois vetores
 */
export function lerpVector(a: Position3D, b: Position3D, t: number): Position3D {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Reflete um vetor em relação a uma normal
 */
export function reflectVector(v: Position3D, normal: Position3D): Position3D {
  const d = 2 * dotProduct(v, normal);
  return [
    v[0] - normal[0] * d,
    v[1] - normal[1] * d,
    v[2] - normal[2] * d,
  ];
}

// =============================================================================
// FUNÇÕES DE ÂNGULO E ROTAÇÃO
// =============================================================================

/**
 * Converte graus para radianos
 */
export function toRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

/**
 * Converte radianos para graus
 */
export function toDegrees(radians: number): number {
  return radians * RAD_TO_DEG;
}

/**
 * Normaliza ângulo para range [0, 2*PI)
 */
export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += TWO_PI;
  while (angle >= TWO_PI) angle -= TWO_PI;
  return angle;
}

/**
 * Calcula ângulo entre dois vetores (em radianos)
 */
export function angleBetweenVectors(a: Position3D, b: Position3D): number {
  const dot = dotProduct(normalizeVector(a), normalizeVector(b));
  return Math.acos(clamp(dot, -1, 1));
}

/**
 * Calcula ângulo de rotação para "olhar" de um ponto para outro
 */
export function lookAtAngle(from: Position3D, to: Position3D): Rotation3D {
  const direction = subtractVectors(to, from);
  const yaw = Math.atan2(direction[0], direction[2]);
  const pitch = Math.atan2(direction[1], Math.sqrt(direction[0] ** 2 + direction[2] ** 2));
  return [pitch, yaw, 0];
}

// =============================================================================
// FUNÇÕES DE INTERPOLAÇÃO
// =============================================================================

/**
 * Interpolação linear
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolação suave (smooth step)
 */
export function smoothstep(a: number, b: number, t: number): number {
  t = clamp((t - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Interpolação mais suave (smoother step)
 */
export function smootherstep(a: number, b: number, t: number): number {
  t = clamp((t - a) / (b - a), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Easing in (quadrático)
 */
export function easeIn(t: number): number {
  return t * t;
}

/**
 * Easing out (quadrático)
 */
export function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Easing in-out (quadrático)
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Limita valor entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Mapeia valor de um range para outro
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Verifica se dois números são aproximadamente iguais
 */
export function approximately(a: number, b: number, epsilon: number = EPSILON): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Arredonda para N casas decimais
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Retorna sinal do número (-1, 0, 1)
 */
export function sign(value: number): number {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

// =============================================================================
// FUNÇÕES DE RANDOMIZAÇÃO
// =============================================================================

/**
 * Número aleatório entre min e max
 */
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Inteiro aleatório entre min e max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Chance de sucesso (0-100)
 */
export function rollChance(percent: number): boolean {
  return Math.random() * 100 < percent;
}

/**
 * Escolhe item aleatório de um array
 */
export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Embaralha um array (Fisher-Yates)
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Gera vetor aleatório normalizado
 */
export function randomDirection(): Position3D {
  const theta = Math.random() * TWO_PI;
  const phi = Math.acos(2 * Math.random() - 1);
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi),
  ];
}

// =============================================================================
// FUNÇÕES GEOMÉTRICAS
// =============================================================================

/**
 * Verifica se ponto está dentro de esfera
 */
export function isPointInSphere(
  point: Position3D,
  center: Position3D,
  radius: number
): boolean {
  return distanceSquared(point, center) <= radius * radius;
}

/**
 * Verifica se ponto está dentro de AABB (caixa alinhada aos eixos)
 */
export function isPointInAABB(
  point: Position3D,
  min: Position3D,
  max: Position3D
): boolean {
  return (
    point[0] >= min[0] && point[0] <= max[0] &&
    point[1] >= min[1] && point[1] <= max[1] &&
    point[2] >= min[2] && point[2] <= max[2]
  );
}

/**
 * Calcula área de triângulo dado 3 vértices
 */
export function triangleArea(a: Position3D, b: Position3D, c: Position3D): number {
  const ab = subtractVectors(b, a);
  const ac = subtractVectors(c, a);
  const cross = crossProduct(ab, ac);
  return vectorMagnitude(cross) / 2;
}

/**
 * Calcula centro de um triângulo
 */
export function triangleCenter(a: Position3D, b: Position3D, c: Position3D): Position3D {
  return [
    (a[0] + b[0] + c[0]) / 3,
    (a[1] + b[1] + c[1]) / 3,
    (a[2] + b[2] + c[2]) / 3,
  ];
}

// =============================================================================
// FUNÇÕES DE GRID/WORLD CONVERSION
// =============================================================================

/**
 * Converte posição do grid (célula) para coordenadas 3D do mundo
 * @param gridX - Posição X no grid (coluna)
 * @param gridZ - Posição Z no grid (linha)
 * @param cellSize - Tamanho de cada célula em metros
 * @param centerInCell - Se true, retorna o centro da célula
 * @returns Coordenadas 3D [x, y, z]
 */
export function gridToWorld(
  gridX: number,
  gridZ: number,
  cellSize: number = 1,
  centerInCell: boolean = true
): Position3D {
  const offset = centerInCell ? cellSize / 2 : 0;
  return [
    gridX * cellSize + offset,
    0, // Y é sempre 0 para o chão
    gridZ * cellSize + offset,
  ];
}

/**
 * Converte coordenadas 3D do mundo para posição no grid (célula)
 * @param worldX - Coordenada X no mundo
 * @param worldZ - Coordenada Z no mundo
 * @param cellSize - Tamanho de cada célula em metros
 * @returns Posição no grid [gridX, gridZ]
 */
export function worldToGrid(
  worldX: number,
  worldZ: number,
  cellSize: number = 1
): [number, number] {
  return [
    Math.floor(worldX / cellSize),
    Math.floor(worldZ / cellSize),
  ];
}

/**
 * Verifica se um ponto 2D está dentro de um círculo
 * @param point - Ponto [x, z]
 * @param center - Centro do círculo [x, z]
 * @param radius - Raio do círculo
 * @returns true se o ponto está dentro do círculo
 */
export function isPointInCircle(
  point: [number, number],
  center: [number, number],
  radius: number
): boolean {
  const dx = point[0] - center[0];
  const dz = point[1] - center[1];
  return dx * dx + dz * dz <= radius * radius;
}

/**
 * Calcula distância entre dois pontos 2D (no plano XZ)
 * @param a - Primeiro ponto [x, z]
 * @param b - Segundo ponto [x, z]
 * @returns Distância entre os pontos
 */
export function distance2D(a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Snap de coordenada para centro da célula mais próxima
 * @param worldX - Coordenada X no mundo
 * @param worldZ - Coordenada Z no mundo
 * @param cellSize - Tamanho da célula
 * @returns Coordenadas snappadas [x, z]
 */
export function snapToGrid(
  worldX: number,
  worldZ: number,
  cellSize: number = 1
): [number, number] {
  const [gridX, gridZ] = worldToGrid(worldX, worldZ, cellSize);
  const [snappedX, , snappedZ] = gridToWorld(gridX, gridZ, cellSize, true);
  return [snappedX, snappedZ];
}

/**
 * Verifica se uma posição está dentro dos limites do grid
 * @param worldX - Coordenada X no mundo
 * @param worldZ - Coordenada Z no mundo
 * @param gridSize - Tamanho total do grid em metros
 * @returns true se está dentro dos limites
 */
export function isInGridBounds(
  worldX: number,
  worldZ: number,
  gridSize: number
): boolean {
  return worldX >= 0 && worldX < gridSize && worldZ >= 0 && worldZ < gridSize;
}

/**
 * Obtém todas as células vizinhas de uma posição
 * @param gridX - Posição X no grid
 * @param gridZ - Posição Z no grid
 * @param gridSize - Tamanho do grid em células
 * @param includeCenter - Se true, inclui a célula central
 * @returns Array de posições vizinhas [gridX, gridZ][]
 */
export function getNeighborCells(
  gridX: number,
  gridZ: number,
  gridSize: number,
  includeCenter: boolean = false
): [number, number][] {
  const neighbors: [number, number][] = [];
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],          [1, 0],
    [-1, 1],  [0, 1],  [1, 1],
  ];

  if (includeCenter) {
    neighbors.push([gridX, gridZ]);
  }

  for (const [dx, dz] of directions) {
    const nx = gridX + dx;
    const nz = gridZ + dz;
    if (nx >= 0 && nx < gridSize && nz >= 0 && nz < gridSize) {
      neighbors.push([nx, nz]);
    }
  }

  return neighbors;
}

export default {
  // Constantes
  PI,
  TWO_PI,
  HALF_PI,
  DEG_TO_RAD,
  RAD_TO_DEG,
  EPSILON,
  // Vetores
  addVectors,
  subtractVectors,
  scaleVector,
  vectorMagnitude,
  normalizeVector,
  dotProduct,
  crossProduct,
  distance,
  distanceSquared,
  lerpVector,
  reflectVector,
  // Ângulos
  toRadians,
  toDegrees,
  normalizeAngle,
  angleBetweenVectors,
  lookAtAngle,
  // Interpolação
  lerp,
  smoothstep,
  smootherstep,
  easeIn,
  easeOut,
  easeInOut,
  // Utilitários
  clamp,
  mapRange,
  approximately,
  roundTo,
  sign,
  // Randomização
  randomRange,
  randomInt,
  rollChance,
  randomChoice,
  shuffle,
  randomDirection,
  // Geometria
  isPointInSphere,
  isPointInAABB,
  triangleArea,
  triangleCenter,
  // Grid/World Conversion
  gridToWorld,
  worldToGrid,
  isPointInCircle,
  distance2D,
  snapToGrid,
  isInGridBounds,
  getNeighborCells,
};
