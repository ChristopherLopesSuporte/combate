/**
 * =============================================================================
 * DECISION SYSTEM - SISTEMA DE DECISÃO (IA)
 * =============================================================================
 *
 * Sistema de inteligência artificial para entidades controladas pelo computador.
 * Implementa behavior trees simplificadas e estados de IA.
 *
 * Inclui:
 * - Detecção de visão (canSeeEnemy)
 * - Detecção de ataques recebidos (isUnderAttack)
 * - Detecção de colisões de caminho (detectPathCollision)
 * - Planejamento de ações inimigas (planEnemyAction)
 */

import type { Entity, Position3D, GameAction } from '../types';
import type { PlannedAction, ActionType } from '../core/TimelineManager';
import { movementSystem } from './MovementSystem';

// =============================================================================
// TIPOS
// =============================================================================

/** Estados de IA */
export type AIState =
  | 'idle'           // Parado
  | 'patrol'         // Patrulhando
  | 'chase'          // Perseguindo
  | 'attack'         // Atacando
  | 'flee'           // Fugindo
  | 'seek_cover'     // Buscando cobertura
  | 'support'        // Apoiando aliado
  | 'investigate';   // Investigando

/** Configuração de comportamento de IA */
export interface AIBehavior {
  aggressiveness: number;   // 0-100: Tendência a atacar
  courage: number;          // 0-100: Tendência a fugir com HP baixo
  teamwork: number;         // 0-100: Tendência a ajudar aliados
  caution: number;          // 0-100: Tendência a buscar cobertura
  patrolRadius: number;     // Raio de patrulha
  detectionRange: number;   // Alcance de detecção de inimigos
  attackRange: number;      // Alcance de ataque
  fleeThreshold: number;    // HP% para começar a fugir
}

/** Decisão tomada pela IA */
export interface AIDecision {
  action: 'move' | 'attack' | 'defend' | 'wait' | 'flee' | 'support';
  target?: string;          // ID do alvo (entidade ou posição)
  targetPosition?: Position3D;
  priority: number;         // 0-100: Prioridade da ação
  reason: string;           // Motivo da decisão (para debug)
}

// =============================================================================
// CONSTANTES
// =============================================================================

/** Comportamento padrão de IA */
const DEFAULT_BEHAVIOR: AIBehavior = {
  aggressiveness: 50,
  courage: 50,
  teamwork: 50,
  caution: 50,
  patrolRadius: 10,
  detectionRange: 15,
  attackRange: 2,
  fleeThreshold: 20,
};

/** Configuração de visão */
export interface VisionConfig {
  /** Alcance de visão em metros */
  range: number;
  /** Campo de visão em graus (180 = semicírculo frontal) */
  fieldOfView: number;
}

/** Configuração padrão de visão */
const DEFAULT_VISION: VisionConfig = {
  range: 10,
  fieldOfView: 180,
};

// =============================================================================
// CLASSE DECISION SYSTEM
// =============================================================================

/**
 * Sistema de decisão de IA singleton
 */
class DecisionSystem {
  private static instance: DecisionSystem;
  private entityStates: Map<string, AIState> = new Map();
  private entityBehaviors: Map<string, AIBehavior> = new Map();
  private entityTargets: Map<string, string> = new Map();
  private entityVision: Map<string, VisionConfig> = new Map();
  /** Ações planejadas pelos inimigos */
  private plannedEnemyActions: Map<string, PlannedAction> = new Map();

  private constructor() {}

  /**
   * Obtém instância única
   */
  public static getInstance(): DecisionSystem {
    if (!DecisionSystem.instance) {
      DecisionSystem.instance = new DecisionSystem();
    }
    return DecisionSystem.instance;
  }

  // ===========================================================================
  // GERENCIAMENTO DE ESTADO
  // ===========================================================================

  /**
   * Registra uma entidade no sistema de IA
   */
  registerEntity(
    entityId: string,
    behavior?: Partial<AIBehavior>,
    vision?: Partial<VisionConfig>
  ): void {
    this.entityStates.set(entityId, 'idle');
    this.entityBehaviors.set(entityId, { ...DEFAULT_BEHAVIOR, ...behavior });
    this.entityVision.set(entityId, { ...DEFAULT_VISION, ...vision });
  }

  /**
   * Remove uma entidade do sistema de IA
   */
  unregisterEntity(entityId: string): void {
    this.entityStates.delete(entityId);
    this.entityBehaviors.delete(entityId);
    this.entityTargets.delete(entityId);
    this.entityVision.delete(entityId);
    this.plannedEnemyActions.delete(entityId);
  }

  /**
   * Obtém estado atual de uma entidade
   */
  getState(entityId: string): AIState {
    return this.entityStates.get(entityId) || 'idle';
  }

  /**
   * Define estado de uma entidade
   */
  setState(entityId: string, state: AIState): void {
    this.entityStates.set(entityId, state);
  }

  /**
   * Obtém comportamento de uma entidade
   */
  getBehavior(entityId: string): AIBehavior {
    return this.entityBehaviors.get(entityId) || DEFAULT_BEHAVIOR;
  }

  // ===========================================================================
  // TOMADA DE DECISÃO
  // ===========================================================================

  /**
   * Processa decisão para uma entidade
   */
  makeDecision(entity: Entity, enemies: Entity[], allies: Entity[]): AIDecision {
    const state = this.getState(entity.id);
    const behavior = this.getBehavior(entity.id);

    // Verifica condições prioritárias

    // 1. HP baixo - considerar fuga
    const hpPercent = (entity.stats.hp / entity.stats.maxHp) * 100;
    if (hpPercent <= behavior.fleeThreshold && behavior.courage < 80) {
      return this.decideFlee(entity, enemies);
    }

    // 2. Inimigo próximo - considerar ataque ou defesa
    const nearestEnemy = this.findNearest(entity, enemies);
    if (nearestEnemy) {
      const distance = movementSystem.calculateDistance(entity.position, nearestEnemy.position);

      if (distance <= behavior.attackRange) {
        if (behavior.aggressiveness > 50) {
          return this.decideAttack(entity, nearestEnemy);
        } else {
          return this.decideDefend(entity, nearestEnemy);
        }
      } else if (distance <= behavior.detectionRange) {
        return this.decideChase(entity, nearestEnemy);
      }
    }

    // 3. Aliado em perigo - considerar suporte
    const alliedInDanger = allies.find(
      (a) => (a.stats.hp / a.stats.maxHp) * 100 < 30
    );
    if (alliedInDanger && behavior.teamwork > 60) {
      return this.decideSupport(entity, alliedInDanger);
    }

    // 4. Sem ameaças - patrulhar ou esperar
    if (state === 'patrol') {
      return this.decidePatrol(entity, behavior.patrolRadius);
    }

    return this.decideWait(entity);
  }

  /**
   * Converte decisão para ação do jogo
   */
  decisionToAction(decision: AIDecision, entity: Entity): GameAction {
    const baseAction: GameAction = {
      type: 'wait',
      entityId: entity.id,
      timeMs: 500,
    };

    switch (decision.action) {
      case 'move':
        return {
          ...baseAction,
          type: 'move',
          targetPosition: decision.targetPosition,
          timeMs: 1000,
        };

      case 'attack':
        return {
          ...baseAction,
          type: 'attack',
          targetId: decision.target,
          timeMs: 300,
        };

      case 'defend':
        return {
          ...baseAction,
          type: 'defend',
          timeMs: 200,
        };

      case 'flee':
      case 'support':
        return {
          ...baseAction,
          type: 'move',
          targetPosition: decision.targetPosition,
          timeMs: 800,
        };

      default:
        return baseAction;
    }
  }

  // ===========================================================================
  // DECISÕES ESPECÍFICAS
  // ===========================================================================

  private decideAttack(entity: Entity, target: Entity): AIDecision {
    this.setState(entity.id, 'attack');
    this.entityTargets.set(entity.id, target.id);

    return {
      action: 'attack',
      target: target.id,
      priority: 80,
      reason: `Atacando ${target.name} em alcance`,
    };
  }

  private decideDefend(entity: Entity, threat: Entity): AIDecision {
    return {
      action: 'defend',
      target: threat.id,
      priority: 70,
      reason: `Defendendo contra ${threat.name}`,
    };
  }

  private decideChase(entity: Entity, target: Entity): AIDecision {
    this.setState(entity.id, 'chase');
    this.entityTargets.set(entity.id, target.id);

    return {
      action: 'move',
      target: target.id,
      targetPosition: target.position,
      priority: 60,
      reason: `Perseguindo ${target.name}`,
    };
  }

  private decideFlee(entity: Entity, threats: Entity[]): AIDecision {
    this.setState(entity.id, 'flee');

    // Calcula direção oposta às ameaças
    const fleePosition = this.calculateFleePosition(entity, threats);

    return {
      action: 'flee',
      targetPosition: fleePosition,
      priority: 90,
      reason: 'HP baixo, fugindo',
    };
  }

  private decideSupport(entity: Entity, ally: Entity): AIDecision {
    this.setState(entity.id, 'support');

    return {
      action: 'support',
      target: ally.id,
      targetPosition: ally.position,
      priority: 65,
      reason: `Apoiando ${ally.name}`,
    };
  }

  private decidePatrol(entity: Entity, radius: number): AIDecision {
    // Gera posição aleatória no raio de patrulha
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;

    const targetPosition: Position3D = [
      entity.position[0] + Math.cos(angle) * distance,
      entity.position[1],
      entity.position[2] + Math.sin(angle) * distance,
    ];

    return {
      action: 'move',
      targetPosition,
      priority: 20,
      reason: 'Patrulhando área',
    };
  }

  private decideWait(entity: Entity): AIDecision {
    this.setState(entity.id, 'idle');

    return {
      action: 'wait',
      priority: 10,
      reason: 'Sem ameaças, aguardando',
    };
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Encontra entidade mais próxima
   */
  private findNearest(from: Entity, entities: Entity[]): Entity | null {
    let nearest: Entity | null = null;
    let minDistance = Infinity;

    for (const entity of entities) {
      if (entity.id === from.id) continue;

      const distance = movementSystem.calculateDistance(from.position, entity.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = entity;
      }
    }

    return nearest;
  }

  /**
   * Calcula posição de fuga
   */
  private calculateFleePosition(entity: Entity, threats: Entity[]): Position3D {
    // Calcula centro das ameaças
    let centerX = 0;
    let centerZ = 0;

    for (const threat of threats) {
      centerX += threat.position[0];
      centerZ += threat.position[2];
    }

    centerX /= threats.length || 1;
    centerZ /= threats.length || 1;

    // Foge na direção oposta
    const dx = entity.position[0] - centerX;
    const dz = entity.position[2] - centerZ;
    const length = Math.sqrt(dx * dx + dz * dz) || 1;

    const fleeDistance = 10;

    return [
      entity.position[0] + (dx / length) * fleeDistance,
      entity.position[1],
      entity.position[2] + (dz / length) * fleeDistance,
    ];
  }

  /**
   * Limpa todos os estados
   */
  reset(): void {
    this.entityStates.clear();
    this.entityBehaviors.clear();
    this.entityTargets.clear();
    this.entityVision.clear();
    this.plannedEnemyActions.clear();
  }

  // ===========================================================================
  // SISTEMA DE VISÃO
  // ===========================================================================

  /**
   * Obtém configuração de visão de uma entidade
   */
  getVision(entityId: string): VisionConfig {
    return this.entityVision.get(entityId) || DEFAULT_VISION;
  }

  /**
   * Verifica se uma entidade pode ver outra
   * Considera distância e campo de visão
   */
  canSeeEnemy(observer: Entity, target: Entity): boolean {
    const vision = this.getVision(observer.id);
    const distance = movementSystem.calculateDistance(observer.position, target.position);

    // Fora do alcance de visão
    if (distance > vision.range) {
      return false;
    }

    // Verifica campo de visão (simplificado: baseado na rotação Y)
    if (vision.fieldOfView < 360) {
      const dx = target.position[0] - observer.position[0];
      const dz = target.position[2] - observer.position[2];
      const angleToTarget = Math.atan2(dx, dz);

      // Rotação do observador (Y)
      const observerAngle = observer.rotation[1];

      // Diferença angular
      let angleDiff = Math.abs(angleToTarget - observerAngle);
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }

      // Converte campo de visão para radianos
      const halfFOV = (vision.fieldOfView / 2) * (Math.PI / 180);

      if (angleDiff > halfFOV) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtém lista de entidades visíveis para uma entidade
   */
  getVisibleEntities(observer: Entity, allEntities: Entity[]): Entity[] {
    return allEntities.filter(
      (e) => e.id !== observer.id && this.canSeeEnemy(observer, e)
    );
  }

  /**
   * Obtém lista de inimigos visíveis para uma entidade
   */
  getVisibleEnemies(observer: Entity, allEntities: Entity[]): Entity[] {
    return allEntities.filter(
      (e) =>
        e.id !== observer.id &&
        e.isPlayerControlled !== observer.isPlayerControlled &&
        this.canSeeEnemy(observer, e)
    );
  }

  // ===========================================================================
  // DETECÇÃO DE AMEAÇAS
  // ===========================================================================

  /**
   * Verifica se uma entidade está sob ataque
   * Analisa ações planejadas dos inimigos
   */
  isUnderAttack(entityId: string): boolean {
    for (const [attackerId, action] of this.plannedEnemyActions) {
      if (action.type === 'attack' && action.target === entityId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtém lista de atacantes direcionados a uma entidade
   */
  getAttackers(entityId: string, entities: Entity[]): Entity[] {
    const attackerIds: string[] = [];

    for (const [attackerId, action] of this.plannedEnemyActions) {
      if (action.type === 'attack' && action.target === entityId) {
        attackerIds.push(attackerId);
      }
    }

    return entities.filter((e) => attackerIds.includes(e.id));
  }

  /**
   * Detecta colisão de caminho entre duas posições de destino
   */
  detectPathCollision(
    pos1: Position3D,
    pos2: Position3D,
    threshold: number = 1
  ): boolean {
    const distance = movementSystem.calculateDistance(pos1, pos2);
    return distance < threshold;
  }

  /**
   * Detecta todas as colisões entre ações planejadas
   */
  detectAllCollisions(
    plannedActions: Map<string, PlannedAction>
  ): Array<{ entity1: string; entity2: string; position: Position3D }> {
    const collisions: Array<{
      entity1: string;
      entity2: string;
      position: Position3D;
    }> = [];
    const moveActions: Array<{ entityId: string; target: Position3D }> = [];

    // Coleta todas as ações de movimento
    plannedActions.forEach((action, entityId) => {
      if (action.type === 'move' && Array.isArray(action.target)) {
        moveActions.push({ entityId, target: action.target as Position3D });
      }
    });

    // Verifica colisões
    for (let i = 0; i < moveActions.length; i++) {
      for (let j = i + 1; j < moveActions.length; j++) {
        if (this.detectPathCollision(moveActions[i].target, moveActions[j].target)) {
          collisions.push({
            entity1: moveActions[i].entityId,
            entity2: moveActions[j].entityId,
            position: moveActions[i].target,
          });
        }
      }
    }

    return collisions;
  }

  // ===========================================================================
  // PLANEJAMENTO DE AÇÕES INIMIGAS
  // ===========================================================================

  /**
   * Planeja ação para uma entidade inimiga
   * Chamado no início da fase de planejamento
   */
  planEnemyAction(enemy: Entity, playerEntities: Entity[]): PlannedAction {
    const behavior = this.getBehavior(enemy.id);
    const visiblePlayers = this.getVisibleEnemies(enemy, playerEntities);
    const hpPercent = (enemy.stats.hp / enemy.stats.maxHp) * 100;

    let action: PlannedAction;

    // 1. HP baixo - considerar fuga
    if (hpPercent <= behavior.fleeThreshold && behavior.courage < 70) {
      const fleePos = this.calculateFleePosition(enemy, playerEntities);
      action = {
        entityId: enemy.id,
        type: 'move',
        target: fleePos,
        timestamp: Date.now(),
        priority: 90,
      };
      this.setState(enemy.id, 'flee');
    }
    // 2. Jogador visível em alcance de ataque
    else if (visiblePlayers.length > 0) {
      const nearest = this.findNearest(enemy, visiblePlayers);
      if (nearest) {
        const distance = movementSystem.calculateDistance(
          enemy.position,
          nearest.position
        );

        if (distance <= behavior.attackRange) {
          // Ataca
          action = {
            entityId: enemy.id,
            type: 'attack',
            target: nearest.id,
            timestamp: Date.now(),
            priority: 80,
          };
          this.setState(enemy.id, 'attack');
        } else {
          // Persegue
          action = {
            entityId: enemy.id,
            type: 'move',
            target: nearest.position,
            timestamp: Date.now(),
            priority: 60,
          };
          this.setState(enemy.id, 'chase');
        }
      } else {
        action = this.createWaitAction(enemy.id);
      }
    }
    // 3. Sem jogadores visíveis - patrulha ou espera
    else {
      if (this.getState(enemy.id) === 'patrol') {
        const patrolPos = this.getPatrolPosition(enemy, behavior.patrolRadius);
        action = {
          entityId: enemy.id,
          type: 'move',
          target: patrolPos,
          timestamp: Date.now(),
          priority: 20,
        };
      } else {
        action = this.createWaitAction(enemy.id);
      }
    }

    // Salva ação planejada
    this.plannedEnemyActions.set(enemy.id, action);
    return action;
  }

  /**
   * Cria ação de espera
   */
  private createWaitAction(entityId: string): PlannedAction {
    return {
      entityId,
      type: 'wait',
      timestamp: Date.now(),
      priority: 10,
    };
  }

  /**
   * Obtém posição de patrulha
   */
  private getPatrolPosition(entity: Entity, radius: number): Position3D {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;

    return [
      entity.position[0] + Math.cos(angle) * distance,
      entity.position[1],
      entity.position[2] + Math.sin(angle) * distance,
    ];
  }

  /**
   * Planeja ações para todos os inimigos
   */
  planAllEnemyActions(enemies: Entity[], playerEntities: Entity[]): Map<string, PlannedAction> {
    this.plannedEnemyActions.clear();

    enemies.forEach((enemy) => {
      this.planEnemyAction(enemy, playerEntities);
    });

    return new Map(this.plannedEnemyActions);
  }

  /**
   * Obtém ações planejadas dos inimigos
   */
  getPlannedEnemyActions(): Map<string, PlannedAction> {
    return new Map(this.plannedEnemyActions);
  }

  /**
   * Limpa ações planejadas dos inimigos
   */
  clearPlannedEnemyActions(): void {
    this.plannedEnemyActions.clear();
  }
}

// Exporta instância singleton
export const decisionSystem = DecisionSystem.getInstance();

export default DecisionSystem;

// Exporta tipos
export type { VisionConfig };
