/**
 * =============================================================================
 * ZUSTAND STORE - ESTADO GLOBAL DO JOGO
 * =============================================================================
 *
 * Este arquivo contém o estado global do jogo usando Zustand.
 * Centraliza todo o estado e ações do jogo em um único lugar.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  GameStore,
  GameState,
  Entity,
  Position3D,
  GamePhase,
  GridMode,
} from '../types';
import type { CombatLogEntry } from '../ui/CombatLog';
import type { CombatEffectData } from '../components/CombatEffects';
import {
  phaseManager,
  TurnPhase,
  ActionType,
  type PlannedAction,
  type PerceptionResult,
  type ConflictEvent,
} from '../systems/PhaseManager';

// =============================================================================
// ESTADO INICIAL
// =============================================================================

/**
 * Estado inicial do jogo
 * Valores padrão para começar uma nova sessão
 */
const initialState: GameState = {
  // Entidades
  entities: [],
  selectedEntityId: null,

  // Estado do jogo
  gamePhase: 'planning',
  currentTurn: 1,
  currentTimeMs: 0,

  // Estado de movimento
  isMoving: false,
  movingEntityId: null,
  movementTarget: null,
  cursorPosition: null,

  // Estado de combate
  combatMode: false,
  targetedEnemyId: null,
  combatLog: [],
  combatEffects: [],
  isAttacking: false,
  actionMode: 'none',

  // Configurações do grid
  gridSize: 10,        // 10x10 metros
  showGrid: true,
  gridMode: 'meters',
  cellSize: 1,         // 1 metro por célula

  // Configurações de câmera
  cameraPosition: [15, 15, 15],
  cameraTarget: [5, 0, 5],

  // Debug
  showDebug: false,
  showHitboxes: false,

  // Sistema de Fases
  turnPhase: TurnPhase.PLANNING,
  plannedActions: [],
  perceptionResults: [],
  conflicts: [],
  executionQueue: [],
  isExecutingPhase: false,
};

// =============================================================================
// CRIAÇÃO DO STORE
// =============================================================================

/**
 * Store Zustand do jogo
 *
 * Usa middleware:
 * - devtools: Integração com Redux DevTools para debug
 * - persist: Salva estado no localStorage
 */
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Spread do estado inicial
        ...initialState,

        // =====================================================================
        // AÇÕES DE ENTIDADES
        // =====================================================================

        /**
         * Adiciona uma nova entidade ao jogo
         */
        addEntity: (entity: Entity) => {
          set(
            (state) => ({
              entities: [...state.entities, entity],
            }),
            false,
            'addEntity'
          );
        },

        /**
         * Remove uma entidade por ID
         */
        removeEntity: (id: string) => {
          set(
            (state) => ({
              entities: state.entities.filter((e) => e.id !== id),
              // Limpa seleção se a entidade removida estava selecionada
              selectedEntityId:
                state.selectedEntityId === id ? null : state.selectedEntityId,
            }),
            false,
            'removeEntity'
          );
        },

        /**
         * Atualiza propriedades de uma entidade
         */
        updateEntity: (id: string, updates: Partial<Entity>) => {
          set(
            (state) => ({
              entities: state.entities.map((e) =>
                e.id === id ? { ...e, ...updates } : e
              ),
            }),
            false,
            'updateEntity'
          );
        },

        /**
         * Seleciona uma entidade (ou null para desselecionar)
         */
        selectEntity: (id: string | null) => {
          set(
            (state) => ({
              selectedEntityId: id,
              // Atualiza flag isSelected nas entidades
              entities: state.entities.map((e) => ({
                ...e,
                isSelected: e.id === id,
              })),
            }),
            false,
            'selectEntity'
          );
        },

        /**
         * Move uma entidade para nova posição
         */
        moveEntity: (id: string, position: Position3D) => {
          set(
            (state) => ({
              entities: state.entities.map((e) =>
                e.id === id ? { ...e, position } : e
              ),
            }),
            false,
            'moveEntity'
          );
        },

        // =====================================================================
        // AÇÕES DE ESTADO DO JOGO
        // =====================================================================

        /**
         * Muda a fase do jogo
         */
        setGamePhase: (phase: GamePhase) => {
          set({ gamePhase: phase }, false, 'setGamePhase');
        },

        /**
         * Avança para o próximo turno
         */
        nextTurn: () => {
          set(
            (state) => ({
              currentTurn: state.currentTurn + 1,
              gamePhase: 'planning',
            }),
            false,
            'nextTurn'
          );
        },

        /**
         * Reseta o jogo para estado inicial
         */
        resetGame: () => {
          set(
            {
              ...initialState,
              // Mantém configurações de debug
              showDebug: get().showDebug,
              showHitboxes: get().showHitboxes,
            },
            false,
            'resetGame'
          );
        },

        // =====================================================================
        // AÇÕES DE MOVIMENTO
        // =====================================================================

        /**
         * Inicia movimento de uma entidade para uma posição
         */
        startMovement: (entityId: string, target: Position3D) => {
          set(
            {
              isMoving: true,
              movingEntityId: entityId,
              movementTarget: target,
            },
            false,
            'startMovement'
          );
        },

        /**
         * Completa o movimento atual (move a entidade para o target)
         */
        completeMovement: () => {
          const { movingEntityId, movementTarget, entities } = get();
          if (!movingEntityId || !movementTarget) return;

          set(
            {
              entities: entities.map((e) =>
                e.id === movingEntityId ? { ...e, position: movementTarget } : e
              ),
              isMoving: false,
              movingEntityId: null,
              movementTarget: null,
            },
            false,
            'completeMovement'
          );
        },

        /**
         * Cancela o movimento atual
         */
        cancelMovement: () => {
          set(
            {
              isMoving: false,
              movingEntityId: null,
              movementTarget: null,
            },
            false,
            'cancelMovement'
          );
        },

        /**
         * Atualiza posição do cursor no grid
         */
        setCursorPosition: (position: Position3D | null) => {
          set({ cursorPosition: position }, false, 'setCursorPosition');
        },

        // =====================================================================
        // AÇÕES DE COMBATE
        // =====================================================================

        /**
         * Alterna modo de combate
         */
        toggleCombatMode: () => {
          set(
            (state) => ({
              combatMode: !state.combatMode,
              targetedEnemyId: state.combatMode ? null : state.targetedEnemyId,
            }),
            false,
            'toggleCombatMode'
          );
        },

        /**
         * Define modo de combate
         */
        setCombatMode: (enabled: boolean) => {
          set(
            {
              combatMode: enabled,
              targetedEnemyId: enabled ? null : null,
            },
            false,
            'setCombatMode'
          );
        },

        /**
         * Define alvo do combate
         */
        setTarget: (targetId: string | null) => {
          set({ targetedEnemyId: targetId }, false, 'setTarget');
        },

        /**
         * Adiciona entrada ao log de combate
         */
        addCombatLog: (entry: CombatLogEntry) => {
          set(
            (state) => ({
              combatLog: [...state.combatLog.slice(-49), entry], // Mantém últimas 50
            }),
            false,
            'addCombatLog'
          );
        },

        /**
         * Adiciona múltiplas entradas ao log
         */
        addCombatLogs: (entries: CombatLogEntry[]) => {
          set(
            (state) => ({
              combatLog: [...state.combatLog, ...entries].slice(-50),
            }),
            false,
            'addCombatLogs'
          );
        },

        /**
         * Limpa log de combate
         */
        clearCombatLog: () => {
          set({ combatLog: [] }, false, 'clearCombatLog');
        },

        /**
         * Adiciona efeito de combate
         */
        addCombatEffect: (effect: CombatEffectData) => {
          set(
            (state) => ({
              combatEffects: [...state.combatEffects, effect],
            }),
            false,
            'addCombatEffect'
          );
        },

        /**
         * Adiciona múltiplos efeitos de combate
         */
        addCombatEffects: (effects: CombatEffectData[]) => {
          set(
            (state) => ({
              combatEffects: [...state.combatEffects, ...effects],
            }),
            false,
            'addCombatEffects'
          );
        },

        /**
         * Remove efeito de combate por ID
         */
        removeCombatEffect: (effectId: string) => {
          set(
            (state) => ({
              combatEffects: state.combatEffects.filter((e) => e.id !== effectId),
            }),
            false,
            'removeCombatEffect'
          );
        },

        /**
         * Limpa todos os efeitos de combate
         */
        clearCombatEffects: () => {
          set({ combatEffects: [] }, false, 'clearCombatEffects');
        },

        /**
         * Inicia animação de ataque
         */
        startAttack: () => {
          set({ isAttacking: true }, false, 'startAttack');
        },

        /**
         * Finaliza animação de ataque
         */
        endAttack: () => {
          set({ isAttacking: false }, false, 'endAttack');
        },

        /**
         * Aplica dano a uma entidade
         */
        applyDamage: (entityId: string, damage: number) => {
          set(
            (state) => ({
              entities: state.entities.map((e) =>
                e.id === entityId
                  ? {
                      ...e,
                      stats: {
                        ...e.stats,
                        hp: Math.max(0, e.stats.hp - damage),
                      },
                    }
                  : e
              ),
            }),
            false,
            'applyDamage'
          );
        },

        setActionMode: (mode: 'none' | 'move' | 'attack') => {
          set({ actionMode: mode }, false, 'setActionMode');
        },

        // =====================================================================
        // AÇÕES DO GRID
        // =====================================================================

        /**
         * Toggle visibilidade do grid
         */
        toggleGrid: () => {
          set(
            (state) => ({ showGrid: !state.showGrid }),
            false,
            'toggleGrid'
          );
        },

        /**
         * Muda modo de visualização do grid
         */
        setGridMode: (mode: GridMode) => {
          set({ gridMode: mode }, false, 'setGridMode');
        },

        /**
         * Define tamanho do grid
         */
        setGridSize: (size: number) => {
          set({ gridSize: size }, false, 'setGridSize');
        },

        // =====================================================================
        // AÇÕES DE DEBUG
        // =====================================================================

        /**
         * Toggle painel de debug
         */
        toggleDebug: () => {
          set(
            (state) => ({ showDebug: !state.showDebug }),
            false,
            'toggleDebug'
          );
        },

        /**
         * Toggle visualização de hitboxes
         */
        toggleHitboxes: () => {
          set(
            (state) => ({ showHitboxes: !state.showHitboxes }),
            false,
            'toggleHitboxes'
          );
        },

        // =====================================================================
        // AÇÕES DO SISTEMA DE FASES
        // =====================================================================

        /**
         * Inicia fase de planejamento
         */
        startPlanningPhase: () => {
          phaseManager.startPlanningPhase();
          set(
            {
              turnPhase: TurnPhase.PLANNING,
              plannedActions: [],
              perceptionResults: [],
              conflicts: [],
              executionQueue: [],
              isExecutingPhase: false,
            },
            false,
            'startPlanningPhase'
          );
        },

        /**
         * Planeja ação para uma entidade
         */
        planAction: (
          entityId: string,
          type: ActionType,
          options: {
            targetId?: string;
            targetPosition?: Position3D;
            attackType?: string;
            baseTimeMs?: number;
          } = {}
        ) => {
          console.log('[gameStore.planAction] Recebido:', {
            entityId,
            type,
            options,
            targetPosition: options.targetPosition,
          });
          const action = phaseManager.planAction(entityId, type, options as any);
          console.log('[gameStore.planAction] Ação criada:', action);
          set(
            (state) => ({
              plannedActions: [
                ...state.plannedActions.filter((a) => a.entityId !== entityId),
                action,
              ],
            }),
            false,
            'planAction'
          );
          return action;
        },

        /**
         * Cancela ação planejada
         */
        cancelAction: (entityId: string) => {
          phaseManager.cancelAction(entityId);
          set(
            (state) => ({
              plannedActions: state.plannedActions.filter(
                (a) => a.entityId !== entityId
              ),
            }),
            false,
            'cancelAction'
          );
        },

        /**
         * Finaliza planejamento e inicia percepção
         */
        finishPlanning: () => {
          phaseManager.finishPlanning();
          set(
            {
              turnPhase: TurnPhase.PERCEPTION,
              gamePhase: 'perception',
            },
            false,
            'finishPlanning'
          );
        },

        /**
         * Rola teste de percepção
         */
        rollPerception: (entityId: string, targetId: string, difficulty?: number) => {
          const { entities } = get();
          const entity = entities.find((e) => e.id === entityId);
          const target = entities.find((e) => e.id === targetId);

          if (!entity || !target) return null;

          const result = phaseManager.rollPerception(entity, target, difficulty);
          set(
            (state) => ({
              perceptionResults: [...state.perceptionResults, result],
            }),
            false,
            'rollPerception'
          );
          return result;
        },

        /**
         * Modifica ação após percepção (com penalidade de 30%)
         */
        modifyAction: (
          entityId: string,
          newType: ActionType,
          options: {
            targetId?: string;
            targetPosition?: Position3D;
            attackType?: string;
          } = {}
        ) => {
          const modified = phaseManager.modifyAction(entityId, newType, options as any);
          if (modified) {
            set(
              (state) => ({
                plannedActions: state.plannedActions.map((a) =>
                  a.entityId === entityId ? modified : a
                ),
              }),
              false,
              'modifyAction'
            );
          }
          return modified;
        },

        /**
         * Finaliza percepção e inicia execução
         */
        finishPerception: () => {
          phaseManager.finishPerception();
          const queue = phaseManager.getState().executionQueue;
          set(
            {
              turnPhase: TurnPhase.EXECUTION,
              gamePhase: 'execution',
              executionQueue: queue,
              isExecutingPhase: true,
            },
            false,
            'finishPerception'
          );
        },

        /**
         * Obtém próxima ação a executar
         */
        getNextAction: () => {
          return phaseManager.getNextAction();
        },

        /**
         * Marca ação como executada
         */
        markActionExecuted: (entityId: string) => {
          phaseManager.markActionExecuted(entityId);
          set(
            (state) => ({
              executionQueue: state.executionQueue.filter(
                (a) => a.entityId !== entityId
              ),
            }),
            false,
            'markActionExecuted'
          );
        },

        /**
         * Finaliza execução e inicia verificação de conflitos
         */
        finishExecution: () => {
          phaseManager.finishExecution();
          set(
            {
              turnPhase: TurnPhase.CONFLICT_CHECK,
              gamePhase: 'conflict_check',
              isExecutingPhase: false,
            },
            false,
            'finishExecution'
          );
        },

        /**
         * Detecta conflitos no estado atual
         */
        detectConflicts: () => {
          const { entities } = get();
          const conflicts = phaseManager.detectConflicts(entities);
          set({ conflicts }, false, 'detectConflicts');
          return conflicts;
        },

        /**
         * Finaliza verificação de conflitos
         * Retorna true se volta para percepção, false se avança turno
         */
        finishConflictCheck: () => {
          const backToPerception = phaseManager.finishConflictCheck();
          if (backToPerception) {
            set(
              {
                turnPhase: TurnPhase.PERCEPTION,
                gamePhase: 'perception',
              },
              false,
              'finishConflictCheck_backToPerception'
            );
          } else {
            const state = phaseManager.getState();
            set(
              {
                turnPhase: TurnPhase.PLANNING,
                gamePhase: 'planning',
                currentTurn: state.currentTurn,
                plannedActions: [],
                perceptionResults: [],
                conflicts: [],
                executionQueue: [],
              },
              false,
              'finishConflictCheck_nextTurn'
            );
          }
          return backToPerception;
        },

        /**
         * Planeja ações de IA para inimigos
         */
        planEnemyActions: () => {
          const { entities } = get();
          const enemies = entities.filter((e) => !e.isPlayerControlled && e.stats.hp > 0);
          const players = entities.filter((e) => e.isPlayerControlled && e.stats.hp > 0);

          const actions: PlannedAction[] = [];
          for (const enemy of enemies) {
            const action = phaseManager.planEnemyAction(enemy, players);
            actions.push(action);
          }

          set(
            (state) => ({
              plannedActions: [...state.plannedActions, ...actions],
            }),
            false,
            'planEnemyActions'
          );

          return actions;
        },

        /**
         * Obtém fase atual do turno
         */
        getTurnPhase: () => {
          return phaseManager.getCurrentPhase();
        },

        /**
         * Obtém descrição da fase atual
         */
        getPhaseDescription: () => {
          return phaseManager.getPhaseDescription();
        },
      }),
      {
        name: 'rpg-game-storage', // Nome da key no localStorage
        partialize: (state) => ({
          // Seleciona quais partes do estado persistir
          gridSize: state.gridSize,
          showGrid: state.showGrid,
          gridMode: state.gridMode,
          showDebug: state.showDebug,
          showHitboxes: state.showHitboxes,
        }),
      }
    ),
    { name: 'RPG Game Store' }
  )
);

// =============================================================================
// SELETORES (para performance)
// =============================================================================

/**
 * Seletor para obter entidade por ID
 */
export const selectEntityById = (id: string) => (state: GameState) =>
  state.entities.find((e) => e.id === id);

/**
 * Seletor para obter entidade selecionada
 */
export const selectSelectedEntity = (state: GameState) =>
  state.entities.find((e) => e.id === state.selectedEntityId);

/**
 * Seletor para obter apenas entidades controláveis pelo jogador
 */
export const selectPlayerEntities = (state: GameState) =>
  state.entities.filter((e) => e.isPlayerControlled);

/**
 * Seletor para obter entidades inimigas
 */
export const selectEnemyEntities = (state: GameState) =>
  state.entities.filter((e) => !e.isPlayerControlled);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Gera ID único para entidades
 */
export const generateEntityId = (): string => {
  return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Cria uma entidade com valores padrão
 */
export const createDefaultEntity = (
  overrides: Partial<Entity> = {}
): Entity => {
  return {
    id: generateEntityId(),
    name: 'Nova Entidade',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    size: 1.8,      // Altura humana média
    radius: 0.5,    // Raio de ocupação
    stats: {
      hp: 100,
      maxHp: 100,
      vel: 50,
      hab: 50,
      agi: 50,
      for: 50,
      res: 50,
      per: 50,
      speed: 5,     // 5 metros por turno
    },
    type: 'humanoid',
    isSelected: false,
    isPlayerControlled: true,
    color: '#4a90d9',
    ...overrides,
  };
};
