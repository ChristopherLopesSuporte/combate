/**
 * =============================================================================
 * TIMELINE MANAGER - GERENCIAMENTO DE FASES E TURNOS
 * =============================================================================
 *
 * Sistema de turnos único:
 * - PLANNING: Jogador planeja ações para suas unidades
 * - EXECUTION: Todas as entidades agem simultaneamente
 * - PAUSED: Sistema pausa quando detecta conflitos
 * - FINISHED: Turno finalizado
 */

import type { Position3D, Entity, GameAction } from '../types';

// =============================================================================
// TIPOS DO SISTEMA DE TURNOS
// =============================================================================

/** Fases do turno */
export type TurnPhase = 'planning' | 'execution' | 'paused' | 'finished';

/** Tipos de ação planejada */
export type ActionType = 'move' | 'attack' | 'wait' | 'defend';

/** Ação planejada por uma entidade */
export interface PlannedAction {
  /** ID da entidade que executará a ação */
  entityId: string;
  /** Tipo da ação */
  type: ActionType;
  /** Alvo: posição para movimento, ID para ataque */
  target?: Position3D | string;
  /** Prioridade da ação (menor = primeiro) */
  priority?: number;
  /** Timestamp do planejamento */
  timestamp: number;
}

/** Tipos de conflito que podem ocorrer */
export type ConflictType =
  | 'enemy_spotted'      // Inimigo entrou no campo de visão
  | 'attack_incoming'    // Ataque direcionado à entidade
  | 'collision'          // Duas entidades tentando ocupar mesmo espaço
  | 'ambush'             // Inimigo atacando de surpresa
  | 'opportunity';       // Oportunidade de ataque (inimigo exposto)

/** Evento de conflito que requer decisão */
export interface ConflictEvent {
  /** ID único do conflito */
  id: string;
  /** Tipo do conflito */
  type: ConflictType;
  /** ID da entidade afetada */
  entityId: string;
  /** Dados adicionais do conflito */
  data: {
    /** ID do inimigo envolvido */
    enemyId?: string;
    /** Posição do conflito */
    position?: Position3D;
    /** Descrição do conflito */
    description: string;
    /** Opções disponíveis */
    options?: ConflictResolutionOption[];
  };
  /** Timestamp do conflito */
  timestamp: number;
  /** Se foi resolvido */
  resolved: boolean;
}

/** Opção de resolução de conflito */
export interface ConflictResolutionOption {
  /** ID da opção */
  id: string;
  /** Label para exibição */
  label: string;
  /** Descrição da opção */
  description: string;
  /** Nova ação resultante */
  resultAction?: Partial<PlannedAction>;
}

/** Estado da execução de uma ação */
export interface ActionExecution {
  action: PlannedAction;
  progress: number; // 0 a 1
  startTime: number;
  duration: number;
  completed: boolean;
}

/** Item da fila de ações antiga (compatibilidade) */
interface ActionQueueItem {
  action: GameAction;
  executionTime: number;
  status: 'pending' | 'executing' | 'completed' | 'cancelled';
}

// =============================================================================
// TIMELINE MANAGER
// =============================================================================

/**
 * Gerenciador de timeline do jogo
 * Controla fases, ações planejadas e detecção de conflitos
 */
class TimelineManager {
  private static instance: TimelineManager;

  // === Estado do turno ===
  /** Fase atual do turno */
  private phase: TurnPhase = 'planning';

  /** Número do turno atual */
  private turnNumber: number = 1;

  // === Ações planejadas (novo sistema) ===
  /** Ações planejadas por entidade */
  private plannedActions: Map<string, PlannedAction> = new Map();

  /** Execuções em andamento */
  private executions: Map<string, ActionExecution> = new Map();

  // === Conflitos ===
  /** Lista de conflitos detectados */
  private conflicts: ConflictEvent[] = [];

  /** Conflito atual sendo resolvido */
  private currentConflict: ConflictEvent | null = null;

  // === Fila de ações antiga (compatibilidade) ===
  private actionQueue: ActionQueueItem[] = [];
  private currentTime: number = 0;
  private isExecuting: boolean = false;

  // === Callbacks ===
  private eventCallbacks: Map<string, Function[]> = new Map();
  private onPhaseChange?: (phase: TurnPhase) => void;
  private onConflictDetected?: (conflict: ConflictEvent) => void;
  private onActionComplete?: (entityId: string, action: PlannedAction) => void;
  private onTurnEnd?: (turnNumber: number) => void;

  /** Contador de IDs */
  private idCounter: number = 0;

  private constructor() {
    // Construtor privado para singleton
  }

  /**
   * Obtém instância única do TimelineManager
   */
  public static getInstance(): TimelineManager {
    if (!TimelineManager.instance) {
      TimelineManager.instance = new TimelineManager();
    }
    return TimelineManager.instance;
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  /** Retorna fase atual */
  getPhase(): TurnPhase {
    return this.phase;
  }

  /** Retorna número do turno */
  getTurnNumber(): number {
    return this.turnNumber;
  }

  /** Retorna ações planejadas */
  getPlannedActions(): Map<string, PlannedAction> {
    return new Map(this.plannedActions);
  }

  /** Retorna ação planejada de uma entidade */
  getPlannedAction(entityId: string): PlannedAction | undefined {
    return this.plannedActions.get(entityId);
  }

  /** Retorna lista de conflitos */
  getConflicts(): ConflictEvent[] {
    return [...this.conflicts];
  }

  /** Retorna conflito atual */
  getCurrentConflict(): ConflictEvent | null {
    return this.currentConflict;
  }

  /** Verifica se entidade tem ação planejada */
  hasPlannedAction(entityId: string): boolean {
    return this.plannedActions.has(entityId);
  }

  /** Obtém tempo atual do jogo */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /** Obtém turno atual (alias) */
  getCurrentTurn(): number {
    return this.turnNumber;
  }

  // ===========================================================================
  // SETTERS DE CALLBACKS
  // ===========================================================================

  setOnPhaseChange(callback: (phase: TurnPhase) => void): void {
    this.onPhaseChange = callback;
  }

  setOnConflictDetected(callback: (conflict: ConflictEvent) => void): void {
    this.onConflictDetected = callback;
  }

  setOnActionComplete(callback: (entityId: string, action: PlannedAction) => void): void {
    this.onActionComplete = callback;
  }

  setOnTurnEnd(callback: (turnNumber: number) => void): void {
    this.onTurnEnd = callback;
  }

  // ===========================================================================
  // PLANEJAMENTO DE AÇÕES
  // ===========================================================================

  /**
   * Planeja uma ação para uma entidade
   * Só funciona na fase de planejamento
   */
  planAction(entityId: string, action: Omit<PlannedAction, 'entityId' | 'timestamp'>): boolean {
    if (this.phase !== 'planning') {
      console.warn('[TimelineManager] Só é possível planejar ações na fase de planejamento');
      return false;
    }

    const plannedAction: PlannedAction = {
      ...action,
      entityId,
      timestamp: Date.now(),
      priority: action.priority ?? 0,
    };

    this.plannedActions.set(entityId, plannedAction);
    this.emit('actionPlanned', { entityId, action: plannedAction });
    console.log(`[TimelineManager] Ação planejada para ${entityId}:`, plannedAction);
    return true;
  }

  /**
   * Cancela ação planejada de uma entidade
   */
  cancelAction(entityId: string): boolean {
    if (this.phase !== 'planning') {
      console.warn('[TimelineManager] Só é possível cancelar ações na fase de planejamento');
      return false;
    }

    const removed = this.plannedActions.delete(entityId);
    if (removed) {
      this.emit('actionCancelled', { entityId });
      console.log(`[TimelineManager] Ação cancelada para ${entityId}`);
    }
    return removed;
  }

  /**
   * Limpa todas as ações planejadas
   */
  clearAllActions(): void {
    this.plannedActions.clear();
    this.emit('actionsCleared', {});
    console.log('[TimelineManager] Todas as ações foram limpas');
  }

  // ===========================================================================
  // EXECUÇÃO DE AÇÕES
  // ===========================================================================

  /**
   * Inicia a execução de todas as ações planejadas
   */
  startExecution(): boolean {
    if (this.phase !== 'planning') {
      console.warn('[TimelineManager] Execução só pode iniciar da fase de planejamento');
      return false;
    }

    if (this.plannedActions.size === 0) {
      console.warn('[TimelineManager] Nenhuma ação planejada para executar');
      return false;
    }

    this.setPhase('execution');
    this.isExecuting = true;
    console.log(`[TimelineManager] Iniciando execução de ${this.plannedActions.size} ações`);

    // Inicia execuções para cada ação
    this.plannedActions.forEach((action, entityId) => {
      this.executions.set(entityId, {
        action,
        progress: 0,
        startTime: Date.now(),
        duration: this.getActionDuration(action.type),
        completed: false,
      });
    });

    this.emit('executionStarted', { count: this.plannedActions.size });
    return true;
  }

  /**
   * Retorna duração estimada de uma ação em ms
   */
  private getActionDuration(type: ActionType): number {
    switch (type) {
      case 'move':
        return 1000;
      case 'attack':
        return 800;
      case 'defend':
        return 500;
      case 'wait':
        return 300;
      default:
        return 500;
    }
  }

  /**
   * Atualiza execuções (chamar no game loop)
   * Retorna true se todas as ações foram completadas
   */
  updateExecutions(deltaTime: number): boolean {
    if (this.phase !== 'execution') {
      return false;
    }

    let allCompleted = true;
    const now = Date.now();

    this.executions.forEach((execution, entityId) => {
      if (execution.completed) return;

      const elapsed = now - execution.startTime;
      execution.progress = Math.min(1, elapsed / execution.duration);

      if (execution.progress >= 1) {
        execution.completed = true;
        console.log(`[TimelineManager] Ação completada para ${entityId}`);

        if (this.onActionComplete) {
          this.onActionComplete(entityId, execution.action);
        }
        this.emit('actionCompleted', { entityId, action: execution.action });
      } else {
        allCompleted = false;
      }
    });

    if (allCompleted && this.executions.size > 0) {
      this.finishExecution();
    }

    return allCompleted;
  }

  /**
   * Obtém progresso da execução de uma entidade (0-1)
   */
  getExecutionProgress(entityId: string): number {
    return this.executions.get(entityId)?.progress ?? 0;
  }

  /**
   * Finaliza a fase de execução
   */
  private finishExecution(): void {
    console.log('[TimelineManager] Execução finalizada');
    this.executions.clear();
    this.isExecuting = false;
    this.setPhase('finished');

    if (this.onTurnEnd) {
      this.onTurnEnd(this.turnNumber);
    }
    this.emit('executionCompleted', { turn: this.turnNumber });
  }

  // ===========================================================================
  // DETECÇÃO E RESOLUÇÃO DE CONFLITOS
  // ===========================================================================

  /**
   * Detecta conflitos baseado nas ações planejadas e estado do jogo
   * Retorna lista de conflitos detectados
   */
  detectConflicts(
    entities: Entity[],
    getDistance: (a: Position3D, b: Position3D) => number
  ): ConflictEvent[] {
    const newConflicts: ConflictEvent[] = [];
    const playerEntities = entities.filter(e => e.isPlayerControlled);
    const enemyEntities = entities.filter(e => !e.isPlayerControlled);

    // Detectar colisões de movimento
    const moveActions: Array<{ entityId: string; target: Position3D }> = [];
    this.plannedActions.forEach((action, entityId) => {
      if (action.type === 'move' && Array.isArray(action.target)) {
        moveActions.push({ entityId, target: action.target as Position3D });
      }
    });

    // Verificar colisões entre movimentos
    for (let i = 0; i < moveActions.length; i++) {
      for (let j = i + 1; j < moveActions.length; j++) {
        const distance = getDistance(moveActions[i].target, moveActions[j].target);
        if (distance < 1) { // Menos de 1 metro = colisão
          newConflicts.push(this.createConflict('collision', moveActions[i].entityId, {
            enemyId: moveActions[j].entityId,
            position: moveActions[i].target,
            description: 'Duas unidades tentando ocupar a mesma posição!',
            options: this.getCollisionOptions(),
          }));
        }
      }
    }

    // Detectar ataques recebidos por jogadores
    this.plannedActions.forEach((action, entityId) => {
      if (action.type === 'attack' && typeof action.target === 'string') {
        const targetEntity = entities.find(e => e.id === action.target);
        if (targetEntity?.isPlayerControlled) {
          newConflicts.push(this.createConflict('attack_incoming', action.target as string, {
            enemyId: entityId,
            position: targetEntity.position,
            description: `Ataque inimigo detectado!`,
            options: this.getAttackIncomingOptions(),
          }));
        }
      }
    });

    // Detectar inimigos no campo de visão (simples: baseado em distância)
    playerEntities.forEach(player => {
      enemyEntities.forEach(enemy => {
        const distance = getDistance(player.position, enemy.position);
        const visionRange = 10; // Raio de visão padrão

        if (distance <= visionRange) {
          // Verificar se já não há conflito para esta combinação
          const exists = newConflicts.some(
            c => c.entityId === player.id && c.data.enemyId === enemy.id
          );

          if (!exists && !this.hasPlannedAction(player.id)) {
            newConflicts.push(this.createConflict('enemy_spotted', player.id, {
              enemyId: enemy.id,
              position: enemy.position,
              description: `${enemy.name} avistado a ${distance.toFixed(1)}m!`,
              options: this.getEnemySpottedOptions(),
            }));
          }
        }
      });
    });

    this.conflicts = [...this.conflicts, ...newConflicts];
    return newConflicts;
  }

  /**
   * Cria um evento de conflito
   */
  private createConflict(
    type: ConflictType,
    entityId: string,
    data: ConflictEvent['data']
  ): ConflictEvent {
    return {
      id: `conflict_${Date.now()}_${this.idCounter++}`,
      type,
      entityId,
      data,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  /**
   * Opções para conflito de colisão
   */
  private getCollisionOptions(): ConflictResolutionOption[] {
    return [
      {
        id: 'wait',
        label: 'Esperar',
        description: 'Aguardar a outra unidade mover primeiro',
        resultAction: { type: 'wait' },
      },
      {
        id: 'change',
        label: 'Mudar rota',
        description: 'Escolher outro destino',
      },
      {
        id: 'continue',
        label: 'Continuar',
        description: 'Manter a rota (pode haver confronto)',
      },
    ];
  }

  /**
   * Opções para ataque recebido
   */
  private getAttackIncomingOptions(): ConflictResolutionOption[] {
    return [
      {
        id: 'defend',
        label: 'Defender',
        description: 'Assumir postura defensiva',
        resultAction: { type: 'defend' },
      },
      {
        id: 'counterattack',
        label: 'Contra-atacar',
        description: 'Responder com ataque',
        resultAction: { type: 'attack' },
      },
      {
        id: 'evade',
        label: 'Esquivar',
        description: 'Tentar sair do caminho',
        resultAction: { type: 'move' },
      },
      {
        id: 'continue',
        label: 'Manter ação',
        description: 'Ignorar e continuar com plano atual',
      },
    ];
  }

  /**
   * Opções para inimigo avistado
   */
  private getEnemySpottedOptions(): ConflictResolutionOption[] {
    return [
      {
        id: 'attack',
        label: 'Atacar',
        description: 'Engajar o inimigo',
        resultAction: { type: 'attack' },
      },
      {
        id: 'approach',
        label: 'Aproximar',
        description: 'Mover em direção ao inimigo',
        resultAction: { type: 'move' },
      },
      {
        id: 'wait',
        label: 'Observar',
        description: 'Manter posição e observar',
        resultAction: { type: 'wait' },
      },
      {
        id: 'ignore',
        label: 'Ignorar',
        description: 'Continuar com ação atual',
      },
    ];
  }

  /**
   * Pausa o jogo para resolver um conflito
   */
  pauseForConflict(conflict: ConflictEvent): void {
    if (this.phase === 'execution') {
      this.setPhase('paused');
      this.currentConflict = conflict;
      this.isExecuting = false;
      console.log('[TimelineManager] Pausado para conflito:', conflict);

      if (this.onConflictDetected) {
        this.onConflictDetected(conflict);
      }
      this.emit('conflictDetected', { conflict });
    }
  }

  /**
   * Resolve o conflito atual
   */
  resolveConflict(optionId: string, newAction?: Partial<PlannedAction>): boolean {
    if (!this.currentConflict || this.phase !== 'paused') {
      console.warn('[TimelineManager] Nenhum conflito para resolver');
      return false;
    }

    const conflict = this.currentConflict;
    const option = conflict.data.options?.find(o => o.id === optionId);

    if (!option) {
      console.warn('[TimelineManager] Opção inválida:', optionId);
      return false;
    }

    // Aplica nova ação se fornecida
    if (newAction || option.resultAction) {
      const action = { ...option.resultAction, ...newAction };
      if (action.type) {
        this.plannedActions.set(conflict.entityId, {
          entityId: conflict.entityId,
          type: action.type,
          target: action.target,
          timestamp: Date.now(),
          priority: 0,
        });
      }
    }

    // Marca conflito como resolvido
    conflict.resolved = true;
    this.currentConflict = null;

    // Verifica se há mais conflitos não resolvidos
    const nextConflict = this.conflicts.find(c => !c.resolved);
    if (nextConflict) {
      this.pauseForConflict(nextConflict);
    } else {
      // Retoma execução
      this.setPhase('execution');
      this.isExecuting = true;
      console.log('[TimelineManager] Conflito resolvido, retomando execução');
      this.emit('conflictResolved', { conflict, optionId });
    }

    return true;
  }

  // ===========================================================================
  // CONTROLE DE TURNO
  // ===========================================================================

  /**
   * Muda a fase do turno
   */
  private setPhase(phase: TurnPhase): void {
    const oldPhase = this.phase;
    this.phase = phase;
    console.log(`[TimelineManager] Fase: ${oldPhase} -> ${phase}`);

    if (this.onPhaseChange) {
      this.onPhaseChange(phase);
    }
    this.emit('phaseChanged', { oldPhase, newPhase: phase });
  }

  /**
   * Inicia um novo turno
   */
  startTurn(): void {
    this.setPhase('planning');
    this.emit('turnStarted', { turn: this.turnNumber });
  }

  /**
   * Avança para o próximo turno
   */
  nextTurn(): void {
    this.turnNumber++;
    this.resetTurn();
    console.log(`[TimelineManager] Iniciando turno ${this.turnNumber}`);
  }

  /**
   * Finaliza o turno atual
   */
  endTurn(): void {
    this.actionQueue = [];
    this.isExecuting = false;
    this.emit('turnEnded', { turn: this.turnNumber });
    this.nextTurn();
  }

  /**
   * Reseta o turno atual para fase de planejamento
   */
  resetTurn(): void {
    this.plannedActions.clear();
    this.conflicts = [];
    this.currentConflict = null;
    this.executions.clear();
    this.actionQueue = [];
    this.isExecuting = false;
    this.setPhase('planning');
  }

  /**
   * Reinicia completamente (novo jogo)
   */
  reset(): void {
    this.turnNumber = 1;
    this.currentTime = 0;
    this.resetTurn();
    console.log('[TimelineManager] Sistema reiniciado');
  }

  // ===========================================================================
  // FILA DE AÇÕES ANTIGA (COMPATIBILIDADE)
  // ===========================================================================

  /**
   * Adiciona uma ação à fila (sistema antigo)
   */
  queueAction(action: GameAction): void {
    const executionTime = this.currentTime + action.timeMs;

    const queueItem: ActionQueueItem = {
      action,
      executionTime,
      status: 'pending',
    };

    const insertIndex = this.actionQueue.findIndex(
      (item) => item.executionTime > executionTime
    );

    if (insertIndex === -1) {
      this.actionQueue.push(queueItem);
    } else {
      this.actionQueue.splice(insertIndex, 0, queueItem);
    }

    this.emit('actionQueued', { action, executionTime });
  }

  /**
   * Obtém ações pendentes de uma entidade
   */
  getEntityActions(entityId: string): GameAction[] {
    return this.actionQueue
      .filter((item) => item.action.entityId === entityId && item.status === 'pending')
      .map((item) => item.action);
  }

  /**
   * Limpa toda a fila de ações
   */
  clearActionQueue(): void {
    this.actionQueue = [];
  }

  /**
   * Pausa a execução
   */
  pauseExecution(): void {
    this.isExecuting = false;
    this.setPhase('paused');
    this.emit('executionPaused', {});
  }

  /**
   * Retoma a execução
   */
  resumeExecution(): void {
    if (!this.isExecuting && this.phase === 'paused') {
      this.setPhase('execution');
      this.isExecuting = true;
      this.emit('executionResumed', {});
    }
  }

  // ===========================================================================
  // SISTEMA DE EVENTOS
  // ===========================================================================

  /**
   * Registra callback para um evento
   */
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Remove callback de um evento
   */
  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emite um evento
   */
  private emit(event: string, data: Record<string, unknown>): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

/** Instância global do TimelineManager */
export const timelineManager = TimelineManager.getInstance();

export default TimelineManager;
