/**
 * =============================================================================
 * MOVEMENT SYSTEM - SISTEMA DE MOVIMENTO
 * =============================================================================
 *
 * Gerencia o movimento de entidades no mundo 3D.
 * Inclui pathfinding básico, velocidade e obstáculos.
 *
 * TODO: Fase 2 - Implementar pathfinding A*
 */

import type { Entity, Position3D } from '../types';
import { useGameStore } from '../store/gameStore';

// =============================================================================
// TIPOS
// =============================================================================

/** Direções cardeais */
export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

/** Resultado de um movimento */
export interface MovementResult {
  success: boolean;
  newPosition: Position3D;
  distanceMoved: number;
  timeMs: number;
  blocked: boolean;
  reason?: string;
}

/** Caminho calculado */
export interface Path {
  waypoints: Position3D[];
  totalDistance: number;
  estimatedTimeMs: number;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/** Velocidade base em metros por segundo */
const BASE_SPEED_MPS = 5;

/** Custo de movimento diagonal */
const DIAGONAL_COST = 1.414;

/** Tamanho da célula do grid para pathfinding */
const CELL_SIZE = 1;

// =============================================================================
// CLASSE MOVEMENT SYSTEM
// =============================================================================

/**
 * Sistema de movimento singleton
 */
class MovementSystem {
  private static instance: MovementSystem;
  private obstacles: Set<string> = new Set(); // Posições bloqueadas como "x,y,z"
  private movingEntities: Map<string, { target: Position3D; path: Path }> = new Map();

  private constructor() {}

  /**
   * Obtém instância única
   */
  public static getInstance(): MovementSystem {
    if (!MovementSystem.instance) {
      MovementSystem.instance = new MovementSystem();
    }
    return MovementSystem.instance;
  }

  // ===========================================================================
  // MOVIMENTO BÁSICO
  // ===========================================================================

  /**
   * Move uma entidade para uma posição
   */
  moveEntity(entity: Entity, targetPosition: Position3D): MovementResult {
    const currentPos = entity.position;
    const distance = this.calculateDistance(currentPos, targetPosition);

    // Verifica se pode mover
    if (!this.canMoveTo(targetPosition)) {
      return {
        success: false,
        newPosition: currentPos,
        distanceMoved: 0,
        timeMs: 0,
        blocked: true,
        reason: 'Posição bloqueada',
      };
    }

    // Calcula tempo baseado na velocidade
    const speed = this.getEntitySpeed(entity);
    const timeMs = (distance / speed) * 1000;

    // Atualiza posição no store
    useGameStore.getState().moveEntity(entity.id, targetPosition);

    return {
      success: true,
      newPosition: targetPosition,
      distanceMoved: distance,
      timeMs,
      blocked: false,
    };
  }

  /**
   * Move uma entidade em uma direção
   */
  moveInDirection(entity: Entity, direction: Direction, distance: number = 1): MovementResult {
    const currentPos = entity.position;
    const offset = this.directionToOffset(direction);

    const targetPosition: Position3D = [
      currentPos[0] + offset[0] * distance,
      currentPos[1] + offset[1] * distance,
      currentPos[2] + offset[2] * distance,
    ];

    return this.moveEntity(entity, targetPosition);
  }

  /**
   * Move uma entidade ao longo de um caminho
   */
  async moveAlongPath(entity: Entity, path: Path): Promise<MovementResult[]> {
    const results: MovementResult[] = [];

    for (const waypoint of path.waypoints) {
      const result = this.moveEntity(entity, waypoint);
      results.push(result);

      if (!result.success) break;

      // Aguarda tempo de movimento (para animação)
      await this.delay(result.timeMs);
    }

    return results;
  }

  // ===========================================================================
  // PATHFINDING
  // ===========================================================================

  /**
   * Calcula caminho entre dois pontos (simplificado)
   * TODO: Implementar A* completo na Fase 2
   */
  findPath(start: Position3D, end: Position3D): Path | null {
    // Por enquanto, retorna caminho direto se não houver obstáculos
    if (!this.canMoveTo(end)) {
      return null;
    }

    const distance = this.calculateDistance(start, end);

    return {
      waypoints: [end],
      totalDistance: distance,
      estimatedTimeMs: (distance / BASE_SPEED_MPS) * 1000,
    };
  }

  /**
   * Verifica se há linha de visão entre dois pontos
   */
  hasLineOfSight(from: Position3D, to: Position3D): boolean {
    // Simplificado: usa raycasting básico
    const steps = Math.ceil(this.calculateDistance(from, to) / CELL_SIZE);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const checkPos: Position3D = [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t,
      ];

      if (!this.canMoveTo(checkPos)) {
        return false;
      }
    }

    return true;
  }

  // ===========================================================================
  // OBSTÁCULOS
  // ===========================================================================

  /**
   * Adiciona um obstáculo
   */
  addObstacle(position: Position3D): void {
    this.obstacles.add(this.positionToKey(position));
  }

  /**
   * Remove um obstáculo
   */
  removeObstacle(position: Position3D): void {
    this.obstacles.delete(this.positionToKey(position));
  }

  /**
   * Verifica se uma posição está bloqueada
   */
  isBlocked(position: Position3D): boolean {
    return this.obstacles.has(this.positionToKey(position));
  }

  /**
   * Verifica se pode mover para uma posição
   */
  canMoveTo(position: Position3D): boolean {
    // Verifica obstáculos
    if (this.isBlocked(position)) return false;

    // Verifica limites do grid (assumindo 0-100)
    if (
      position[0] < 0 || position[0] > 100 ||
      position[1] < 0 || position[1] > 100 ||
      position[2] < 0 || position[2] > 100
    ) {
      return false;
    }

    return true;
  }

  // ===========================================================================
  // VERIFICAÇÃO DE ALCANCE
  // ===========================================================================

  /**
   * Verifica se uma posição está dentro do alcance de movimento
   * @param fromPos Posição de origem
   * @param toPos Posição de destino
   * @param maxRange Alcance máximo em metros
   */
  isPositionInRange(
    fromPos: Position3D,
    toPos: Position3D,
    maxRange: number
  ): boolean {
    const distance = this.calculateDistance2D(fromPos, toPos);
    return distance <= maxRange;
  }

  /**
   * Calcula distância 2D (ignora Y) entre duas posições
   * Usado para movimento no plano XZ
   */
  calculateDistance2D(a: Position3D, b: Position3D): number {
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Obtém o alcance de movimento de uma entidade
   * Baseado no stat 'speed' (metros por turno)
   */
  getMovementRange(entity: Entity): number {
    return entity.stats.speed || 5;
  }

  // ===========================================================================
  // VERIFICAÇÃO DE COLISÃO
  // ===========================================================================

  /**
   * Verifica colisão com outras entidades
   * @param position Posição a verificar
   * @param radius Raio da entidade
   * @param excludeId ID da entidade a excluir (a própria)
   * @returns Entidade colidida ou null
   */
  checkCollision(
    position: Position3D,
    radius: number,
    excludeId?: string
  ): Entity | null {
    const entities = useGameStore.getState().entities;

    for (const entity of entities) {
      if (entity.id === excludeId) continue;

      const distance = this.calculateDistance2D(position, entity.position);
      const minDistance = radius + entity.radius;

      if (distance < minDistance) {
        return entity;
      }
    }

    return null;
  }

  /**
   * Verifica se uma posição é válida para movimento
   * @param position Posição alvo
   * @param entityId ID da entidade que quer mover
   * @param entityRadius Raio da entidade
   */
  isValidMovePosition(
    position: Position3D,
    entityId: string,
    entityRadius: number = 0.5
  ): { valid: boolean; reason?: string } {
    const { gridSize } = useGameStore.getState();

    // Verifica limites do grid
    if (
      position[0] < entityRadius ||
      position[0] > gridSize - entityRadius ||
      position[2] < entityRadius ||
      position[2] > gridSize - entityRadius
    ) {
      return { valid: false, reason: 'Fora dos limites do grid' };
    }

    // Verifica obstáculos
    if (this.isBlocked(position)) {
      return { valid: false, reason: 'Posição bloqueada' };
    }

    // Verifica colisão com outras entidades
    const collision = this.checkCollision(position, entityRadius, entityId);
    if (collision) {
      return { valid: false, reason: `Posição ocupada por ${collision.name}` };
    }

    return { valid: true };
  }

  /**
   * Tenta mover entidade validando alcance e colisões
   */
  tryMoveEntity(
    entity: Entity,
    targetPosition: Position3D
  ): MovementResult {
    // Verifica alcance
    const range = this.getMovementRange(entity);
    if (!this.isPositionInRange(entity.position, targetPosition, range)) {
      return {
        success: false,
        newPosition: entity.position,
        distanceMoved: 0,
        timeMs: 0,
        blocked: true,
        reason: 'Fora do alcance de movimento',
      };
    }

    // Verifica se posição é válida
    const validation = this.isValidMovePosition(
      targetPosition,
      entity.id,
      entity.radius
    );

    if (!validation.valid) {
      return {
        success: false,
        newPosition: entity.position,
        distanceMoved: 0,
        timeMs: 0,
        blocked: true,
        reason: validation.reason,
      };
    }

    // Movimento válido - executa
    return this.moveEntity(entity, targetPosition);
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Calcula distância entre duas posições (3D)
   */
  calculateDistance(a: Position3D, b: Position3D): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calcula distância Manhattan (grid)
   */
  calculateManhattanDistance(a: Position3D, b: Position3D): number {
    return Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) + Math.abs(b[2] - a[2]);
  }

  /**
   * Obtém velocidade de uma entidade
   */
  getEntitySpeed(entity: Entity): number {
    return entity.stats.speed || BASE_SPEED_MPS;
  }

  /**
   * Converte direção para offset de posição
   */
  directionToOffset(direction: Direction): Position3D {
    switch (direction) {
      case 'north': return [0, 0, -1];
      case 'south': return [0, 0, 1];
      case 'east': return [1, 0, 0];
      case 'west': return [-1, 0, 0];
      case 'up': return [0, 1, 0];
      case 'down': return [0, -1, 0];
    }
  }

  /**
   * Converte posição para chave de string
   */
  private positionToKey(position: Position3D): string {
    return `${Math.round(position[0])},${Math.round(position[1])},${Math.round(position[2])}`;
  }

  /**
   * Delay assíncrono
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Limpa todos os obstáculos
   */
  clearObstacles(): void {
    this.obstacles.clear();
  }

  /**
   * Obtém todas as posições bloqueadas
   */
  getBlockedPositions(): Position3D[] {
    return Array.from(this.obstacles).map((key) => {
      const [x, y, z] = key.split(',').map(Number);
      return [x, y, z] as Position3D;
    });
  }
}

// Exporta instância singleton
export const movementSystem = MovementSystem.getInstance();

export default MovementSystem;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Pathfinding A* completo
// - Navmesh para terrenos complexos
// - Movimento suave com interpolação
// - Sistema de formação (grupo)
// - Evasão de colisão entre entidades
// - Terrain cost (diferentes velocidades por terreno)
