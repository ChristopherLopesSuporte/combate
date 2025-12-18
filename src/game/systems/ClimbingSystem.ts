/**
 * =============================================================================
 * CLIMBING SYSTEM - SISTEMA DE ESCALADA
 * =============================================================================
 *
 * Sistema para escalar superfícies, pular e se mover verticalmente.
 * Permite navegação em ambientes 3D complexos.
 *
 * TODO: Fase 3 - Implementar sistema de escalada
 */

import type { Entity, Position3D } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

/** Estados de escalada */
export type ClimbState =
  | 'grounded'        // No chão
  | 'climbing'        // Escalando
  | 'hanging'         // Pendurado
  | 'jumping'         // Pulando
  | 'falling'         // Caindo
  | 'ledge_grab';     // Agarrado em borda

/** Tipos de superfície */
export type SurfaceType =
  | 'ground'          // Chão normal
  | 'wall'            // Parede
  | 'ladder'          // Escada
  | 'rope'            // Corda
  | 'ledge'           // Borda
  | 'climbable';      // Superfície escalável

/** Ponto de escalada */
export interface ClimbPoint {
  position: Position3D;
  surfaceType: SurfaceType;
  normal: Position3D;           // Normal da superfície
  difficulty: number;           // 0-100
  canRest: boolean;             // Se pode descansar neste ponto
  nextPoints: string[];         // IDs de pontos conectados
}

/** Resultado de uma ação de escalada */
export interface ClimbResult {
  success: boolean;
  newPosition: Position3D;
  newState: ClimbState;
  staminaCost: number;
  timeMs: number;
  message: string;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/** Velocidade de escalada (m/s) */
const CLIMB_SPEED = 2;

/** Altura do pulo (metros) */
const JUMP_HEIGHT = 2;

/** Custo de stamina por metro escalado */
const STAMINA_PER_METER = 5;

/** Gravidade para quedas */
const GRAVITY = 9.81;

// =============================================================================
// CLASSE CLIMBING SYSTEM
// =============================================================================

/**
 * Sistema de escalada singleton
 */
class ClimbingSystem {
  private static instance: ClimbingSystem;
  private climbPoints: Map<string, ClimbPoint> = new Map();
  private entityStates: Map<string, ClimbState> = new Map();
  private entityStamina: Map<string, number> = new Map();

  private constructor() {}

  /**
   * Obtém instância única
   */
  public static getInstance(): ClimbingSystem {
    if (!ClimbingSystem.instance) {
      ClimbingSystem.instance = new ClimbingSystem();
    }
    return ClimbingSystem.instance;
  }

  // ===========================================================================
  // GERENCIAMENTO DE ESTADO
  // ===========================================================================

  /**
   * Registra entidade no sistema
   */
  registerEntity(entityId: string, maxStamina: number = 100): void {
    this.entityStates.set(entityId, 'grounded');
    this.entityStamina.set(entityId, maxStamina);
  }

  /**
   * Remove entidade do sistema
   */
  unregisterEntity(entityId: string): void {
    this.entityStates.delete(entityId);
    this.entityStamina.delete(entityId);
  }

  /**
   * Obtém estado de uma entidade
   */
  getState(entityId: string): ClimbState {
    return this.entityStates.get(entityId) || 'grounded';
  }

  /**
   * Define estado de uma entidade
   */
  setState(entityId: string, state: ClimbState): void {
    this.entityStates.set(entityId, state);
  }

  /**
   * Obtém stamina de uma entidade
   */
  getStamina(entityId: string): number {
    return this.entityStamina.get(entityId) || 0;
  }

  // ===========================================================================
  // PONTOS DE ESCALADA
  // ===========================================================================

  /**
   * Adiciona um ponto de escalada
   */
  addClimbPoint(id: string, point: ClimbPoint): void {
    this.climbPoints.set(id, point);
  }

  /**
   * Remove um ponto de escalada
   */
  removeClimbPoint(id: string): void {
    this.climbPoints.delete(id);
  }

  /**
   * Encontra ponto de escalada mais próximo
   */
  findNearestClimbPoint(position: Position3D, maxDistance: number = 2): ClimbPoint | null {
    let nearest: ClimbPoint | null = null;
    let minDist = maxDistance;

    for (const point of this.climbPoints.values()) {
      const dist = this.distance(position, point.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = point;
      }
    }

    return nearest;
  }

  // ===========================================================================
  // AÇÕES DE ESCALADA
  // ===========================================================================

  /**
   * Inicia escalada
   */
  startClimb(entity: Entity, targetPoint: ClimbPoint): ClimbResult {
    const currentState = this.getState(entity.id);
    const stamina = this.getStamina(entity.id);

    // Verifica se pode iniciar escalada
    if (currentState !== 'grounded' && currentState !== 'hanging') {
      return {
        success: false,
        newPosition: entity.position,
        newState: currentState,
        staminaCost: 0,
        timeMs: 0,
        message: 'Não pode iniciar escalada neste estado',
      };
    }

    // Verifica stamina
    if (stamina < 10) {
      return {
        success: false,
        newPosition: entity.position,
        newState: currentState,
        staminaCost: 0,
        timeMs: 0,
        message: 'Stamina insuficiente',
      };
    }

    // Verifica dificuldade vs habilidade
    const skillCheck = this.checkClimbSkill(entity, targetPoint.difficulty);
    if (!skillCheck) {
      return {
        success: false,
        newPosition: entity.position,
        newState: 'falling',
        staminaCost: 5,
        timeMs: 500,
        message: 'Falhou ao iniciar escalada',
      };
    }

    this.setState(entity.id, 'climbing');

    return {
      success: true,
      newPosition: targetPoint.position,
      newState: 'climbing',
      staminaCost: 10,
      timeMs: 1000,
      message: 'Iniciou escalada',
    };
  }

  /**
   * Move durante escalada
   */
  climbMove(entity: Entity, direction: 'up' | 'down' | 'left' | 'right'): ClimbResult {
    const currentState = this.getState(entity.id);

    if (currentState !== 'climbing' && currentState !== 'hanging') {
      return {
        success: false,
        newPosition: entity.position,
        newState: currentState,
        staminaCost: 0,
        timeMs: 0,
        message: 'Não está escalando',
      };
    }

    // Calcula nova posição
    const moveDistance = 1;
    const offset = this.directionToOffset(direction);
    const newPosition: Position3D = [
      entity.position[0] + offset[0] * moveDistance,
      entity.position[1] + offset[1] * moveDistance,
      entity.position[2] + offset[2] * moveDistance,
    ];

    // Consome stamina
    const staminaCost = direction === 'up' ? 8 : direction === 'down' ? 2 : 5;
    const newStamina = this.getStamina(entity.id) - staminaCost;
    this.entityStamina.set(entity.id, Math.max(0, newStamina));

    // Se stamina zerou, cai
    if (newStamina <= 0) {
      this.setState(entity.id, 'falling');
      return {
        success: false,
        newPosition: entity.position,
        newState: 'falling',
        staminaCost,
        timeMs: 500,
        message: 'Stamina esgotada! Caindo!',
      };
    }

    const timeMs = (moveDistance / CLIMB_SPEED) * 1000;

    return {
      success: true,
      newPosition,
      newState: 'climbing',
      staminaCost,
      timeMs,
      message: `Moveu ${direction}`,
    };
  }

  /**
   * Pula
   */
  jump(entity: Entity, direction?: Position3D): ClimbResult {
    const currentState = this.getState(entity.id);

    if (currentState === 'falling' || currentState === 'jumping') {
      return {
        success: false,
        newPosition: entity.position,
        newState: currentState,
        staminaCost: 0,
        timeMs: 0,
        message: 'Já está no ar',
      };
    }

    // Calcula vetor de pulo
    const jumpVector: Position3D = direction || [0, 1, 0];
    const jumpDistance = JUMP_HEIGHT * (entity.stats.agi / 50);

    const newPosition: Position3D = [
      entity.position[0] + jumpVector[0] * jumpDistance,
      entity.position[1] + jumpVector[1] * jumpDistance,
      entity.position[2] + jumpVector[2] * jumpDistance,
    ];

    this.setState(entity.id, 'jumping');

    return {
      success: true,
      newPosition,
      newState: 'jumping',
      staminaCost: 15,
      timeMs: 500,
      message: 'Pulou',
    };
  }

  /**
   * Solta e cai
   */
  drop(entity: Entity): ClimbResult {
    this.setState(entity.id, 'falling');

    return {
      success: true,
      newPosition: entity.position,
      newState: 'falling',
      staminaCost: 0,
      timeMs: 0,
      message: 'Soltou',
    };
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Verifica se entidade passa no check de escalada
   */
  private checkClimbSkill(entity: Entity, difficulty: number): boolean {
    // Usa AGI e FOR para determinar capacidade de escalada
    const climbSkill = (entity.stats.agi * 0.6 + entity.stats.for * 0.4);
    const roll = Math.random() * 100;
    return climbSkill + roll >= difficulty;
  }

  /**
   * Calcula distância entre dois pontos
   */
  private distance(a: Position3D, b: Position3D): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Converte direção para offset
   */
  private directionToOffset(direction: string): Position3D {
    switch (direction) {
      case 'up': return [0, 1, 0];
      case 'down': return [0, -1, 0];
      case 'left': return [-1, 0, 0];
      case 'right': return [1, 0, 0];
      default: return [0, 0, 0];
    }
  }

  /**
   * Limpa o sistema
   */
  reset(): void {
    this.climbPoints.clear();
    this.entityStates.clear();
    this.entityStamina.clear();
  }
}

// Exporta instância singleton
export const climbingSystem = ClimbingSystem.getInstance();

export default ClimbingSystem;

// =============================================================================
// TODO: Fase 3 - Implementar
// =============================================================================
// - Física de queda realista
// - Animações de escalada
// - Detecção automática de superfícies escaláveis
// - Sistema de corda e rapel
// - Salto entre paredes (wall jump)
// - Recuperação de stamina em pontos de descanso
