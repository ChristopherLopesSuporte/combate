/**
 * =============================================================================
 * PHASE MANAGER - SISTEMA DE FASES DO TURNO
 * =============================================================================
 *
 * Gerencia as fases do turno do jogo:
 * - FASE 1: PLANEJAMENTO - Jogador escolhe ações para suas unidades
 * - FASE 2: PERCEPÇÃO/CONFLITO - Testes de percepção, chance de mudar ações
 * - FASE 3: EXECUÇÃO - Execução simultânea baseada em timing
 * - FASE 4: VERIFICAR NOVOS CONFLITOS - Detecta novos conflitos, loop ou próximo turno
 */

import type { Entity, Position3D, AttackType } from '../types';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Fases do sistema de turnos
 */
export enum TurnPhase {
  PLANNING = 'planning',
  PERCEPTION = 'perception',
  EXECUTION = 'execution',
  CONFLICT_CHECK = 'conflict_check',
}

/**
 * Tipos de conflito que podem ocorrer
 */
export enum ConflictType {
  ALLY_HIT = 'ally_hit',           // Aliado foi atingido
  ALLY_KILLED = 'ally_killed',     // Aliado foi morto
  ENEMY_SPOTTED = 'enemy_spotted', // Inimigo detectado
  AMBUSH = 'ambush',               // Emboscada detectada
  FLANKED = 'flanked',             // Flanqueado
  TARGET_MOVED = 'target_moved',   // Alvo se moveu
  TARGET_DIED = 'target_died',     // Alvo morreu
  OPPORTUNITY = 'opportunity',     // Oportunidade de ataque
}

/**
 * Tipos de ação disponíveis
 */
export enum ActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  DEFEND = 'defend',
  WAIT = 'wait',
  USE_ITEM = 'use_item',
  SPECIAL = 'special',
}

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

/**
 * Ação planejada por uma entidade
 */
export interface PlannedAction {
  /** ID único da ação */
  id: string;
  /** ID da entidade que executa */
  entityId: string;
  /** Tipo da ação */
  type: ActionType;
  /** ID do alvo (para ataques) */
  targetId?: string;
  /** Posição alvo (para movimento) */
  targetPosition?: Position3D;
  /** Tipo de ataque (se for ataque) */
  attackType?: AttackType;
  /** Tempo base de execução em ms */
  baseTimeMs: number;
  /** Tempo atual (com modificadores) em ms */
  currentTimeMs: number;
  /** Se a ação foi modificada após percepção */
  wasModified: boolean;
  /** Penalidade de tempo por modificação (30%) */
  modificationPenalty: number;
  /** Prioridade (menor = executa primeiro em caso de empate) */
  priority: number;
  /** Timestamp de quando a ação foi planejada */
  plannedAt: number;
}

/**
 * Resultado de teste de percepção
 */
export interface PerceptionResult {
  /** ID da entidade que percebeu */
  entityId: string;
  /** ID da entidade/ação percebida */
  targetId: string;
  /** Se a percepção foi bem sucedida */
  success: boolean;
  /** Rolagem do dado (1-20) */
  roll: number;
  /** Bônus de PER (PER ÷ 10) */
  perBonus: number;
  /** Total (roll + bonus) */
  total: number;
  /** Dificuldade do teste */
  difficulty: number;
  /** Informação revelada */
  infoRevealed: PerceivedInfo;
}

/**
 * Informação percebida sobre uma ação inimiga
 */
export interface PerceivedInfo {
  /** Tipo de ação (se percebido) */
  actionType?: ActionType;
  /** Direção geral do movimento */
  movementDirection?: 'north' | 'south' | 'east' | 'west' | 'stationary';
  /** Alvo provável */
  probableTarget?: string;
  /** Se está preparando ataque */
  isPreparingAttack?: boolean;
  /** Nível de confiança da informação (0-1) */
  confidence: number;
}

/**
 * Evento de conflito detectado
 */
export interface ConflictEvent {
  /** ID único do conflito */
  id: string;
  /** Tipo do conflito */
  type: ConflictType;
  /** ID da entidade afetada */
  affectedEntityId: string;
  /** ID da entidade que causou (se houver) */
  causedByEntityId?: string;
  /** Descrição do conflito */
  description: string;
  /** Se permite mudança de ação */
  allowsActionChange: boolean;
  /** Timestamp */
  timestamp: number;
  /** Dados adicionais */
  data?: Record<string, unknown>;
}

/**
 * Estado do sistema de fases
 */
export interface PhaseState {
  /** Fase atual */
  currentPhase: TurnPhase;
  /** Turno atual */
  currentTurn: number;
  /** Tempo atual de execução em ms */
  executionTimeMs: number;
  /** Ações planejadas de todas as entidades */
  plannedActions: Map<string, PlannedAction>;
  /** Resultados de percepção do turno */
  perceptionResults: PerceptionResult[];
  /** Conflitos detectados */
  conflicts: ConflictEvent[];
  /** Entidades que já agiram neste turno */
  actedEntities: Set<string>;
  /** Entidades que podem reagir (mudaram ação na percepção) */
  reactingEntities: Set<string>;
  /** Se está em execução de animação */
  isAnimating: boolean;
  /** Fila de execução ordenada por tempo */
  executionQueue: PlannedAction[];
}

// =============================================================================
// CLASSE PHASE MANAGER
// =============================================================================

/**
 * Gerenciador de fases do turno
 */
class PhaseManager {
  private static instance: PhaseManager;
  private state: PhaseState;

  private constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Obtém instância única (Singleton)
   */
  public static getInstance(): PhaseManager {
    if (!PhaseManager.instance) {
      PhaseManager.instance = new PhaseManager();
    }
    return PhaseManager.instance;
  }

  /**
   * Cria estado inicial
   */
  private createInitialState(): PhaseState {
    return {
      currentPhase: TurnPhase.PLANNING,
      currentTurn: 1,
      executionTimeMs: 0,
      plannedActions: new Map(),
      perceptionResults: [],
      conflicts: [],
      actedEntities: new Set(),
      reactingEntities: new Set(),
      isAnimating: false,
      executionQueue: [],
    };
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /**
   * Obtém estado atual
   */
  getState(): PhaseState {
    return { ...this.state };
  }

  /**
   * Obtém fase atual
   */
  getCurrentPhase(): TurnPhase {
    return this.state.currentPhase;
  }

  /**
   * Obtém turno atual
   */
  getCurrentTurn(): number {
    return this.state.currentTurn;
  }

  /**
   * Obtém ações planejadas
   */
  getPlannedActions(): PlannedAction[] {
    return Array.from(this.state.plannedActions.values());
  }

  /**
   * Obtém ação planejada de uma entidade
   */
  getEntityAction(entityId: string): PlannedAction | undefined {
    return this.state.plannedActions.get(entityId);
  }

  /**
   * Obtém conflitos atuais
   */
  getConflicts(): ConflictEvent[] {
    return [...this.state.conflicts];
  }

  /**
   * Obtém resultados de percepção
   */
  getPerceptionResults(): PerceptionResult[] {
    return [...this.state.perceptionResults];
  }

  // ===========================================================================
  // FASE 1: PLANEJAMENTO
  // ===========================================================================

  /**
   * Inicia fase de planejamento
   */
  startPlanningPhase(): void {
    this.state.currentPhase = TurnPhase.PLANNING;
    this.state.plannedActions.clear();
    this.state.perceptionResults = [];
    this.state.conflicts = [];
    this.state.actedEntities.clear();
    this.state.reactingEntities.clear();
    this.state.executionQueue = [];
    console.log(`[PhaseManager] Turno ${this.state.currentTurn} - Fase de Planejamento iniciada`);
  }

  /**
   * Planeja uma ação para uma entidade
   */
  planAction(
    entityId: string,
    type: ActionType,
    options: {
      targetId?: string;
      targetPosition?: Position3D;
      attackType?: AttackType;
      baseTimeMs?: number;
    } = {}
  ): PlannedAction {
    const baseTime = options.baseTimeMs || this.getDefaultActionTime(type, options.attackType);

    const action: PlannedAction = {
      id: `action_${entityId}_${Date.now()}`,
      entityId,
      type,
      targetId: options.targetId,
      targetPosition: options.targetPosition,
      attackType: options.attackType,
      baseTimeMs: baseTime,
      currentTimeMs: baseTime,
      wasModified: false,
      modificationPenalty: 0,
      priority: this.calculatePriority(type),
      plannedAt: Date.now(),
    };

    this.state.plannedActions.set(entityId, action);
    console.log(`[PhaseManager] Ação planejada para ${entityId}: ${type}`, {
      targetPosition: action.targetPosition,
      fullAction: action,
    });
    return action;
  }

  /**
   * Obtém tempo padrão de uma ação
   */
  private getDefaultActionTime(type: ActionType, attackType?: AttackType): number {
    switch (type) {
      case ActionType.MOVE:
        return 1000; // 1 segundo base
      case ActionType.ATTACK:
        switch (attackType) {
          case 'jab': return 300;
          case 'direto': return 500;
          case 'corte': return 700;
          case 'estocada': return 600;
          case 'aparar': return 400;
          default: return 500;
        }
      case ActionType.DEFEND:
        return 300;
      case ActionType.WAIT:
        return 0;
      case ActionType.USE_ITEM:
        return 800;
      case ActionType.SPECIAL:
        return 1000;
      default:
        return 500;
    }
  }

  /**
   * Calcula prioridade da ação (menor = primeiro)
   */
  private calculatePriority(type: ActionType): number {
    switch (type) {
      case ActionType.DEFEND: return 0;
      case ActionType.ATTACK: return 1;
      case ActionType.MOVE: return 2;
      case ActionType.USE_ITEM: return 3;
      case ActionType.SPECIAL: return 4;
      case ActionType.WAIT: return 5;
      default: return 3;
    }
  }

  /**
   * Remove ação planejada
   */
  cancelAction(entityId: string): boolean {
    const removed = this.state.plannedActions.delete(entityId);
    if (removed) {
      console.log(`[PhaseManager] Ação cancelada para ${entityId}`);
    }
    return removed;
  }

  /**
   * Verifica se todas as entidades planejaram
   */
  allEntitiesPlanned(entities: Entity[]): boolean {
    const playerEntities = entities.filter(e => e.isPlayerControlled);
    return playerEntities.every(e => this.state.plannedActions.has(e.id));
  }

  /**
   * Finaliza fase de planejamento e avança para percepção
   */
  finishPlanning(): void {
    if (this.state.currentPhase !== TurnPhase.PLANNING) {
      console.warn('[PhaseManager] Não está na fase de planejamento');
      return;
    }
    console.log('[PhaseManager] Fase de Planejamento finalizada');
    this.startPerceptionPhase();
  }

  // ===========================================================================
  // FASE 2: PERCEPÇÃO / CONFLITO
  // ===========================================================================

  /**
   * Inicia fase de percepção
   */
  startPerceptionPhase(): void {
    this.state.currentPhase = TurnPhase.PERCEPTION;
    this.state.perceptionResults = [];
    console.log('[PhaseManager] Fase de Percepção iniciada');
  }

  /**
   * Rola teste de percepção
   * Fórmula: d20 + (PER ÷ 10)
   */
  rollPerception(
    entity: Entity,
    targetEntity: Entity,
    difficulty: number = 10
  ): PerceptionResult {
    const roll = Math.floor(Math.random() * 20) + 1; // d20
    const perBonus = Math.floor(entity.stats.per / 10);
    const total = roll + perBonus;
    const success = total >= difficulty;

    // Determina informação revelada baseada no sucesso e margem
    const infoRevealed = this.calculatePerceivedInfo(success, total - difficulty, targetEntity);

    const result: PerceptionResult = {
      entityId: entity.id,
      targetId: targetEntity.id,
      success,
      roll,
      perBonus,
      total,
      difficulty,
      infoRevealed,
    };

    this.state.perceptionResults.push(result);
    console.log(
      `[PhaseManager] Percepção: ${entity.name} vs ${targetEntity.name} - ` +
      `Roll: ${roll} + ${perBonus} = ${total} vs DC ${difficulty} - ${success ? 'SUCESSO' : 'FALHA'}`
    );

    return result;
  }

  /**
   * Calcula informação percebida baseada na margem de sucesso
   */
  private calculatePerceivedInfo(
    success: boolean,
    margin: number,
    target: Entity
  ): PerceivedInfo {
    if (!success) {
      return { confidence: 0 };
    }

    const targetAction = this.state.plannedActions.get(target.id);
    const confidence = Math.min(1, 0.5 + margin * 0.1);

    const info: PerceivedInfo = {
      confidence,
    };

    // Margem >= 0: Tipo de ação
    if (margin >= 0 && targetAction) {
      info.actionType = targetAction.type;
    }

    // Margem >= 5: Direção do movimento
    if (margin >= 5 && targetAction?.targetPosition) {
      info.movementDirection = this.calculateDirection(target.position, targetAction.targetPosition);
    }

    // Margem >= 10: Alvo provável
    if (margin >= 10 && targetAction?.targetId) {
      info.probableTarget = targetAction.targetId;
    }

    // Margem >= 15: Se está preparando ataque
    if (margin >= 15) {
      info.isPreparingAttack = targetAction?.type === ActionType.ATTACK;
    }

    return info;
  }

  /**
   * Calcula direção geral de um movimento
   */
  private calculateDirection(
    from: Position3D,
    to: Position3D
  ): 'north' | 'south' | 'east' | 'west' | 'stationary' {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];

    if (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1) {
      return 'stationary';
    }

    if (Math.abs(dx) > Math.abs(dz)) {
      return dx > 0 ? 'east' : 'west';
    } else {
      return dz > 0 ? 'south' : 'north';
    }
  }

  /**
   * Modifica ação após percepção (aplica penalidade de 30%)
   */
  modifyAction(
    entityId: string,
    newType: ActionType,
    options: {
      targetId?: string;
      targetPosition?: Position3D;
      attackType?: AttackType;
    } = {}
  ): PlannedAction | null {
    const existingAction = this.state.plannedActions.get(entityId);
    if (!existingAction) {
      console.warn(`[PhaseManager] Nenhuma ação existente para ${entityId}`);
      return null;
    }

    const baseTime = this.getDefaultActionTime(newType, options.attackType);
    const penalty = Math.floor(baseTime * 0.3); // 30% de penalidade

    const modifiedAction: PlannedAction = {
      ...existingAction,
      id: `action_${entityId}_${Date.now()}_modified`,
      type: newType,
      targetId: options.targetId,
      targetPosition: options.targetPosition,
      attackType: options.attackType,
      baseTimeMs: baseTime,
      currentTimeMs: baseTime + penalty,
      wasModified: true,
      modificationPenalty: penalty,
    };

    this.state.plannedActions.set(entityId, modifiedAction);
    this.state.reactingEntities.add(entityId);

    console.log(
      `[PhaseManager] Ação modificada para ${entityId}: ${newType} ` +
      `(+${penalty}ms de penalidade)`
    );

    return modifiedAction;
  }

  /**
   * Finaliza fase de percepção e avança para execução
   */
  finishPerception(): void {
    if (this.state.currentPhase !== TurnPhase.PERCEPTION) {
      console.warn('[PhaseManager] Não está na fase de percepção');
      return;
    }
    console.log('[PhaseManager] Fase de Percepção finalizada');
    this.startExecutionPhase();
  }

  // ===========================================================================
  // FASE 3: EXECUÇÃO
  // ===========================================================================

  /**
   * Inicia fase de execução
   */
  startExecutionPhase(): void {
    this.state.currentPhase = TurnPhase.EXECUTION;
    this.state.executionTimeMs = 0;
    this.state.isAnimating = true;

    // Ordena ações por tempo de execução
    this.state.executionQueue = this.sortActionsByTime();

    console.log('[PhaseManager] Fase de Execução iniciada');
    console.log('[PhaseManager] Fila de execução:', this.state.executionQueue.map(a =>
      `${a.entityId}: ${a.type} em ${a.currentTimeMs}ms`
    ));
  }

  /**
   * Ordena ações por tempo de execução
   */
  private sortActionsByTime(): PlannedAction[] {
    return Array.from(this.state.plannedActions.values())
      .sort((a, b) => {
        // Primeiro por tempo
        if (a.currentTimeMs !== b.currentTimeMs) {
          return a.currentTimeMs - b.currentTimeMs;
        }
        // Depois por prioridade
        return a.priority - b.priority;
      });
  }

  /**
   * Obtém próxima ação a executar
   */
  getNextAction(): PlannedAction | null {
    if (this.state.executionQueue.length === 0) {
      return null;
    }
    return this.state.executionQueue[0];
  }

  /**
   * Marca ação como executada
   */
  markActionExecuted(entityId: string): void {
    this.state.actedEntities.add(entityId);
    this.state.executionQueue = this.state.executionQueue.filter(
      a => a.entityId !== entityId
    );
    console.log(`[PhaseManager] Ação executada: ${entityId}`);
  }

  /**
   * Avança tempo de execução
   */
  advanceExecutionTime(deltaMs: number): void {
    this.state.executionTimeMs += deltaMs;
  }

  /**
   * Verifica se execução terminou
   */
  isExecutionComplete(): boolean {
    return this.state.executionQueue.length === 0;
  }

  /**
   * Finaliza fase de execução
   */
  finishExecution(): void {
    if (this.state.currentPhase !== TurnPhase.EXECUTION) {
      console.warn('[PhaseManager] Não está na fase de execução');
      return;
    }
    this.state.isAnimating = false;
    console.log('[PhaseManager] Fase de Execução finalizada');
    this.startConflictCheckPhase();
  }

  // ===========================================================================
  // FASE 4: VERIFICAR CONFLITOS
  // ===========================================================================

  /**
   * Inicia fase de verificação de conflitos
   */
  startConflictCheckPhase(): void {
    this.state.currentPhase = TurnPhase.CONFLICT_CHECK;
    this.state.conflicts = [];
    console.log('[PhaseManager] Fase de Verificação de Conflitos iniciada');
  }

  /**
   * Detecta conflitos no estado atual
   */
  detectConflicts(entities: Entity[]): ConflictEvent[] {
    const newConflicts: ConflictEvent[] = [];

    // Verifica aliados mortos
    const deadAllies = entities.filter(e => e.isPlayerControlled && e.stats.hp <= 0);
    for (const ally of deadAllies) {
      if (!this.state.actedEntities.has(ally.id)) {
        newConflicts.push({
          id: `conflict_${Date.now()}_${ally.id}`,
          type: ConflictType.ALLY_KILLED,
          affectedEntityId: ally.id,
          description: `${ally.name} foi morto!`,
          allowsActionChange: false,
          timestamp: Date.now(),
        });
      }
    }

    // Verifica aliados feridos
    const woundedAllies = entities.filter(
      e => e.isPlayerControlled &&
      e.stats.hp > 0 &&
      e.stats.hp < e.stats.maxHp * 0.5
    );
    for (const ally of woundedAllies) {
      newConflicts.push({
        id: `conflict_${Date.now()}_${ally.id}_hit`,
        type: ConflictType.ALLY_HIT,
        affectedEntityId: ally.id,
        description: `${ally.name} está gravemente ferido!`,
        allowsActionChange: true,
        timestamp: Date.now(),
      });
    }

    // Verifica novos inimigos detectados
    const enemies = entities.filter(e => !e.isPlayerControlled && e.stats.hp > 0);
    for (const enemy of enemies) {
      const wasSpotted = this.state.perceptionResults.some(
        r => r.targetId === enemy.id && r.success
      );
      if (!wasSpotted) {
        newConflicts.push({
          id: `conflict_${Date.now()}_${enemy.id}_spotted`,
          type: ConflictType.ENEMY_SPOTTED,
          affectedEntityId: enemy.id,
          description: `Novo inimigo detectado: ${enemy.name}!`,
          allowsActionChange: true,
          timestamp: Date.now(),
        });
      }
    }

    this.state.conflicts = newConflicts;
    console.log(`[PhaseManager] ${newConflicts.length} conflitos detectados`);
    return newConflicts;
  }

  /**
   * Verifica se há conflitos que permitem mudança de ação
   */
  hasActionableConflicts(): boolean {
    return this.state.conflicts.some(c => c.allowsActionChange);
  }

  /**
   * Finaliza verificação de conflitos
   * Retorna true se deve voltar para percepção, false se avança para próximo turno
   */
  finishConflictCheck(): boolean {
    if (this.state.currentPhase !== TurnPhase.CONFLICT_CHECK) {
      console.warn('[PhaseManager] Não está na fase de verificação de conflitos');
      return false;
    }

    if (this.hasActionableConflicts()) {
      console.log('[PhaseManager] Conflitos detectados - voltando para Percepção');
      this.startPerceptionPhase();
      return true;
    }

    console.log('[PhaseManager] Sem conflitos - avançando para próximo turno');
    this.nextTurn();
    return false;
  }

  // ===========================================================================
  // CONTROLE DE TURNO
  // ===========================================================================

  /**
   * Avança para o próximo turno
   */
  nextTurn(): void {
    this.state.currentTurn++;
    console.log(`[PhaseManager] === TURNO ${this.state.currentTurn} ===`);
    this.startPlanningPhase();
  }

  /**
   * Reseta o sistema de fases
   */
  reset(): void {
    this.state = this.createInitialState();
    console.log('[PhaseManager] Sistema resetado');
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Gera ID único
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém descrição da fase atual
   */
  getPhaseDescription(): string {
    switch (this.state.currentPhase) {
      case TurnPhase.PLANNING:
        return 'Planejamento - Escolha as ações das suas unidades';
      case TurnPhase.PERCEPTION:
        return 'Percepção - Tente detectar as intenções inimigas';
      case TurnPhase.EXECUTION:
        return 'Execução - Ações sendo executadas...';
      case TurnPhase.CONFLICT_CHECK:
        return 'Verificação - Analisando resultados...';
      default:
        return 'Fase desconhecida';
    }
  }

  /**
   * Planeja ação de IA para inimigos
   */
  planEnemyAction(enemy: Entity, playerEntities: Entity[]): PlannedAction {
    // IA simples: encontra o jogador mais próximo e ataca ou move
    let closestPlayer: Entity | null = null;
    let closestDistance = Infinity;

    for (const player of playerEntities) {
      if (player.stats.hp <= 0) continue;

      const dx = player.position[0] - enemy.position[0];
      const dz = player.position[2] - enemy.position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlayer = player;
      }
    }

    if (!closestPlayer) {
      // Nenhum alvo, espera
      return this.planAction(enemy.id, ActionType.WAIT);
    }

    // Se está perto o suficiente, ataca
    if (closestDistance <= 2) {
      return this.planAction(enemy.id, ActionType.ATTACK, {
        targetId: closestPlayer.id,
        attackType: 'direto',
      });
    }

    // Senão, move em direção ao jogador
    const dx = closestPlayer.position[0] - enemy.position[0];
    const dz = closestPlayer.position[2] - enemy.position[2];
    const moveDistance = Math.min(enemy.stats.speed, closestDistance - 1);
    const angle = Math.atan2(dz, dx);

    const targetPosition: Position3D = [
      enemy.position[0] + Math.cos(angle) * moveDistance,
      0,
      enemy.position[2] + Math.sin(angle) * moveDistance,
    ];

    return this.planAction(enemy.id, ActionType.MOVE, {
      targetPosition,
    });
  }
}

// Exporta instância singleton
export const phaseManager = PhaseManager.getInstance();

export default PhaseManager;
