/**
 * =============================================================================
 * PLANNING PANEL - PAINEL DE PLANEJAMENTO DE FASES
 * =============================================================================
 *
 * Interface para o sistema de fases do turno.
 * Mostra a fase atual e permite planejar ações para as unidades.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { TurnPhase, ActionType, type PlannedAction, type PerceptionResult, type ConflictEvent } from '../systems/PhaseManager';

// =============================================================================
// TIPOS
// =============================================================================

interface PlanningPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const PHASE_COLORS: Record<TurnPhase, string> = {
  [TurnPhase.PLANNING]: 'bg-blue-600',
  [TurnPhase.PERCEPTION]: 'bg-yellow-600',
  [TurnPhase.EXECUTION]: 'bg-red-600',
  [TurnPhase.CONFLICT_CHECK]: 'bg-purple-600',
};

const PHASE_ICONS: Record<TurnPhase, string> = {
  [TurnPhase.PLANNING]: '📋',
  [TurnPhase.PERCEPTION]: '👁️',
  [TurnPhase.EXECUTION]: '⚔️',
  [TurnPhase.CONFLICT_CHECK]: '⚠️',
};

const ACTION_ICONS: Record<ActionType, string> = {
  [ActionType.MOVE]: '🚶',
  [ActionType.ATTACK]: '⚔️',
  [ActionType.DEFEND]: '🛡️',
  [ActionType.WAIT]: '⏳',
  [ActionType.USE_ITEM]: '🎒',
  [ActionType.SPECIAL]: '✨',
};

// =============================================================================
// COMPONENTE DE INDICADOR DE FASE
// =============================================================================

interface PhaseIndicatorProps {
  currentPhase: TurnPhase;
  currentTurn: number;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ currentPhase, currentTurn }) => {
  const phases = [
    TurnPhase.PLANNING,
    TurnPhase.PERCEPTION,
    TurnPhase.EXECUTION,
    TurnPhase.CONFLICT_CHECK,
  ];

  const phaseIndex = phases.indexOf(currentPhase);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Turno {currentTurn}</span>
        <span className={`text-sm px-2 py-1 rounded ${PHASE_COLORS[currentPhase]}`}>
          {PHASE_ICONS[currentPhase]} {currentPhase.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Barra de progresso das fases */}
      <div className="flex gap-1">
        {phases.map((phase, index) => (
          <div
            key={phase}
            className={`flex-1 h-2 rounded ${
              index < phaseIndex
                ? 'bg-green-500'
                : index === phaseIndex
                ? PHASE_COLORS[phase]
                : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE DE LISTA DE AÇÕES PLANEJADAS
// =============================================================================

interface PlannedActionsListProps {
  actions: PlannedAction[];
  onCancelAction: (entityId: string) => void;
}

const PlannedActionsList: React.FC<PlannedActionsListProps> = ({ actions, onCancelAction }) => {
  const entities = useGameStore((state) => state.entities);

  if (actions.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Nenhuma ação planejada
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => {
        const entity = entities.find((e) => e.id === action.entityId);
        const target = action.targetId ? entities.find((e) => e.id === action.targetId) : null;

        return (
          <div
            key={action.id}
            className={`flex items-center justify-between p-2 rounded ${
              action.wasModified ? 'bg-yellow-900/50 border border-yellow-600' : 'bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{ACTION_ICONS[action.type]}</span>
              <div>
                <div className="text-sm font-medium text-white">
                  {entity?.name || action.entityId}
                </div>
                <div className="text-xs text-gray-400">
                  {action.type === ActionType.ATTACK && target
                    ? `Atacar ${target.name}`
                    : action.type === ActionType.MOVE
                    ? `Mover para (${action.targetPosition?.[0].toFixed(1)}, ${action.targetPosition?.[2].toFixed(1)})`
                    : action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {action.currentTimeMs}ms
                {action.wasModified && (
                  <span className="text-yellow-500 ml-1">
                    (+{action.modificationPenalty}ms)
                  </span>
                )}
              </span>
              <button
                onClick={() => onCancelAction(action.entityId)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// COMPONENTE DE RESULTADOS DE PERCEPÇÃO
// =============================================================================

interface PerceptionResultsProps {
  results: PerceptionResult[];
}

const PerceptionResults: React.FC<PerceptionResultsProps> = ({ results }) => {
  const entities = useGameStore((state) => state.entities);

  if (results.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Nenhum teste de percepção realizado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result, index) => {
        const entity = entities.find((e) => e.id === result.entityId);
        const target = entities.find((e) => e.id === result.targetId);

        return (
          <div
            key={index}
            className={`p-2 rounded ${
              result.success ? 'bg-green-900/50' : 'bg-red-900/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">
                {entity?.name} → {target?.name}
              </span>
              <span className={`text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'SUCESSO' : 'FALHA'}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              d20({result.roll}) + PER({result.perBonus}) = {result.total} vs DC {result.difficulty}
            </div>
            {result.success && result.infoRevealed.actionType && (
              <div className="text-xs text-blue-400 mt-1">
                Ação detectada: {result.infoRevealed.actionType}
                {result.infoRevealed.movementDirection && (
                  <span> | Direção: {result.infoRevealed.movementDirection}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// COMPONENTE DE LISTA DE CONFLITOS
// =============================================================================

interface ConflictsListProps {
  conflicts: ConflictEvent[];
}

const ConflictsList: React.FC<ConflictsListProps> = ({ conflicts }) => {
  if (conflicts.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Nenhum conflito detectado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className={`p-2 rounded ${
            conflict.allowsActionChange ? 'bg-yellow-900/50' : 'bg-red-900/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="text-sm font-medium text-white">
                {conflict.description}
              </div>
              <div className="text-xs text-gray-400">
                {conflict.allowsActionChange
                  ? 'Permite mudança de ação'
                  : 'Não permite mudança'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// COMPONENTE DE BOTÕES DE AÇÃO RÁPIDA
// =============================================================================

interface QuickActionButtonsProps {
  selectedEntityId: string | null;
  onAction: (type: ActionType) => void;
  disabled?: boolean;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  selectedEntityId,
  onAction,
  disabled = false,
}) => {
  const actions: { type: ActionType; label: string; icon: string }[] = [
    { type: ActionType.MOVE, label: 'Mover', icon: '🚶' },
    { type: ActionType.ATTACK, label: 'Atacar', icon: '⚔️' },
    { type: ActionType.DEFEND, label: 'Defender', icon: '🛡️' },
    { type: ActionType.WAIT, label: 'Esperar', icon: '⏳' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => (
        <button
          key={action.type}
          onClick={() => onAction(action.type)}
          disabled={disabled || !selectedEntityId}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded transition-colors ${
            disabled || !selectedEntityId
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <span>{action.icon}</span>
          <span className="text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL - PLANNING PANEL
// =============================================================================

export const PlanningPanel: React.FC<PlanningPanelProps> = ({ isOpen = true, onClose }) => {
  // Estado do store
  const turnPhase = useGameStore((state) => state.turnPhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const plannedActions = useGameStore((state) => state.plannedActions);
  const perceptionResults = useGameStore((state) => state.perceptionResults);
  const conflicts = useGameStore((state) => state.conflicts);
  const selectedEntityId = useGameStore((state) => state.selectedEntityId);
  const entities = useGameStore((state) => state.entities);

  // Ações do store
  const planAction = useGameStore((state) => state.planAction);
  const cancelAction = useGameStore((state) => state.cancelAction);
  const finishPlanning = useGameStore((state) => state.finishPlanning);
  const rollPerception = useGameStore((state) => state.rollPerception);
  const finishPerception = useGameStore((state) => state.finishPerception);
  const finishExecution = useGameStore((state) => state.finishExecution);
  const detectConflicts = useGameStore((state) => state.detectConflicts);
  const finishConflictCheck = useGameStore((state) => state.finishConflictCheck);
  const planEnemyActions = useGameStore((state) => state.planEnemyActions);
  const getPhaseDescription = useGameStore((state) => state.getPhaseDescription);

  // Estado local
  const [showPerceptionDetails, setShowPerceptionDetails] = useState(false);

  // Entidades do jogador que ainda não planejaram
  const unplannedPlayerEntities = useMemo(() => {
    return entities.filter(
      (e) =>
        e.isPlayerControlled &&
        e.stats.hp > 0 &&
        !plannedActions.some((a) => a.entityId === e.id)
    );
  }, [entities, plannedActions]);

  // Todas as unidades do jogador planejaram?
  const allPlayerUnitsPlanned = unplannedPlayerEntities.length === 0;

  // Handlers
  const handleQuickAction = useCallback(
    (type: ActionType) => {
      if (!selectedEntityId) return;

      // Para ações simples como WAIT e DEFEND, não precisa de alvo
      if (type === ActionType.WAIT || type === ActionType.DEFEND) {
        planAction(selectedEntityId, type);
        return;
      }

      // Para MOVE, não faz nada aqui - o jogador precisa clicar no grid
      if (type === ActionType.MOVE) {
        // Ignora - movimento é definido clicando no grid
        console.log('[PlanningPanel] Para mover, clique no grid');
        return;
      }

      // Para ATTACK, precisa de alvo
      if (type === ActionType.ATTACK) {
        // Encontra a entidade selecionada para determinar alvos válidos
        const selectedEntity = entities.find((e) => e.id === selectedEntityId);
        if (!selectedEntity) return;

        // Alvos são entidades do lado oposto (jogador ataca inimigos, inimigo ataca jogadores)
        const validTargets = entities.filter(
          (e) => e.isPlayerControlled !== selectedEntity.isPlayerControlled && e.stats.hp > 0
        );
        if (validTargets.length > 0) {
          planAction(selectedEntityId, type, {
            targetId: validTargets[0].id,
            attackType: 'direto',
          });
        }
      }
    },
    [selectedEntityId, planAction, entities]
  );

  // Ações do store para movimento
  const moveEntity = useGameStore((state) => state.moveEntity);

  // Pega função de aplicar dano
  const applyDamage = useGameStore((state) => state.applyDamage);

  const handleFinishPlanning = useCallback(() => {
    console.log('[PlanningPanel] handleFinishPlanning - Ações planejadas:', plannedActions);

    // Processa todas as ações planejadas
    for (const action of plannedActions) {
      console.log('[PlanningPanel] Processando ação:', action);

      // MOVIMENTO
      if (action.type === ActionType.MOVE && action.targetPosition) {
        console.log('[PlanningPanel] Movendo entidade:', action.entityId, 'para:', action.targetPosition);
        moveEntity(action.entityId, action.targetPosition);
      }

      // ATAQUE - Aplica dano ao alvo
      if (action.type === ActionType.ATTACK && action.targetId) {
        const attacker = entities.find(e => e.id === action.entityId);
        const target = entities.find(e => e.id === action.targetId);

        if (attacker && target) {
          // Calcula dano base (simplificado: FOR / 5)
          const baseDamage = Math.max(10, Math.floor(attacker.stats.for / 5));
          console.log('[PlanningPanel] Ataque! ', attacker.name, ' -> ', target.name, ' Dano:', baseDamage);

          // Aplica dano ao alvo
          applyDamage(action.targetId, baseDamage);
        }
      }
    }

    // Reseta para planejamento do próximo turno
    setTimeout(() => {
      useGameStore.getState().startPlanningPhase();
      useGameStore.getState().nextTurn();
    }, 500);
  }, [plannedActions, moveEntity, applyDamage, entities]);

  const handleRollAllPerception = useCallback(() => {
    const playerEntities = entities.filter((e) => e.isPlayerControlled && e.stats.hp > 0);
    const enemyEntities = entities.filter((e) => !e.isPlayerControlled && e.stats.hp > 0);

    // Cada jogador tenta perceber cada inimigo
    for (const player of playerEntities) {
      for (const enemy of enemyEntities) {
        rollPerception(player.id, enemy.id);
      }
    }
  }, [entities, rollPerception]);

  const handleFinishPerception = useCallback(() => {
    finishPerception();
  }, [finishPerception]);

  const handleFinishExecution = useCallback(() => {
    finishExecution();
    detectConflicts();
  }, [finishExecution, detectConflicts]);

  const handleFinishConflictCheck = useCallback(() => {
    finishConflictCheck();
  }, [finishConflictCheck]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 left-4 w-80 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          {PHASE_ICONS[turnPhase]} Sistema de Fases
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Indicador de fase */}
        <PhaseIndicator currentPhase={turnPhase} currentTurn={currentTurn} />

        {/* Descrição da fase */}
        <div className="text-sm text-gray-300 mb-4 p-2 bg-gray-800 rounded">
          {getPhaseDescription()}
        </div>

        {/* Conteúdo específico da fase */}
        {turnPhase === TurnPhase.PLANNING && (
          <>
            {/* Instrução */}
            <div className="mb-4 p-3 bg-blue-900/50 rounded-lg border border-blue-500">
              <p className="text-sm text-blue-200">
                <strong>Como jogar:</strong>
              </p>
              <ol className="text-xs text-blue-300 mt-2 list-decimal list-inside space-y-1">
                <li>Selecione um personagem azul</li>
                <li>Clique no grid para escolher destino</li>
                <li>Clique em "Executar Movimentos"</li>
              </ol>
            </div>

            {/* Personagem selecionado */}
            {selectedEntityId && (
              <div className="mb-4 p-2 bg-green-900/50 rounded border border-green-500">
                <span className="text-xs text-green-400">Selecionado: </span>
                <span className="text-sm text-white font-bold">
                  {entities.find(e => e.id === selectedEntityId)?.name || 'Nenhum'}
                </span>
              </div>
            )}

            {/* Lista de ações planejadas */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 mb-2">
                Movimentos Planejados ({plannedActions.length})
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <PlannedActionsList
                  actions={plannedActions}
                  onCancelAction={cancelAction}
                />
              </div>
            </div>

            {/* Botão de finalizar */}
            <button
              onClick={handleFinishPlanning}
              disabled={plannedActions.length === 0}
              className={`w-full py-3 rounded font-bold transition-colors ${
                plannedActions.length > 0
                  ? 'bg-green-600 hover:bg-green-500 text-white text-lg'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {plannedActions.length > 0
                ? `▶ Executar Movimentos (${plannedActions.length})`
                : 'Selecione um personagem e clique no grid'}
            </button>
          </>
        )}

        {turnPhase === TurnPhase.PERCEPTION && (
          <>
            {/* Botão de rolar percepção */}
            <button
              onClick={handleRollAllPerception}
              className="w-full py-2 mb-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors"
            >
              👁️ Rolar Percepção
            </button>

            {/* Resultados de percepção */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 mb-2">
                Resultados de Percepção ({perceptionResults.length})
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <PerceptionResults results={perceptionResults} />
              </div>
            </div>

            {/* Botão de finalizar */}
            <button
              onClick={handleFinishPerception}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded transition-colors"
            >
              Iniciar Execução →
            </button>
          </>
        )}

        {turnPhase === TurnPhase.EXECUTION && (
          <>
            {/* Lista de ações em execução */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 mb-2">
                Fila de Execução
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <PlannedActionsList
                  actions={plannedActions}
                  onCancelAction={() => {}}
                />
              </div>
            </div>

            {/* Botão de finalizar (para debug/teste) */}
            <button
              onClick={handleFinishExecution}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-colors"
            >
              Finalizar Execução →
            </button>
          </>
        )}

        {turnPhase === TurnPhase.CONFLICT_CHECK && (
          <>
            {/* Lista de conflitos */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-gray-400 mb-2">
                Conflitos Detectados ({conflicts.length})
              </h3>
              <div className="max-h-40 overflow-y-auto">
                <ConflictsList conflicts={conflicts} />
              </div>
            </div>

            {/* Botão de finalizar */}
            <button
              onClick={handleFinishConflictCheck}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors"
            >
              {conflicts.some((c) => c.allowsActionChange)
                ? 'Reagir aos Conflitos →'
                : 'Próximo Turno →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlanningPanel;
