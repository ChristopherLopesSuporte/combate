/**
 * =============================================================================
 * ACTION PANEL - PAINEL DE PLANEJAMENTO DE AÇÕES
 * =============================================================================
 *
 * Painel para o jogador planejar ações na fase de planejamento:
 * - Botões para Mover, Atacar, Esperar, Defender
 * - Exibe ação atualmente planejada
 * - Botão para cancelar ação
 * - Botão para iniciar execução
 */

import React, { useCallback } from 'react';
import { useGameStore, selectSelectedEntity } from '../store/gameStore';
import { timelineManager, type PlannedAction, type ActionType } from '../core/TimelineManager';

// =============================================================================
// TIPOS
// =============================================================================

interface ActionButtonProps {
  icon: string;
  label: string;
  actionType: ActionType;
  disabled?: boolean;
  onClick: (type: ActionType) => void;
  isActive?: boolean;
}

// =============================================================================
// BOTÃO DE AÇÃO
// =============================================================================

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  actionType,
  disabled = false,
  onClick,
  isActive = false,
}) => {
  const baseClasses = 'flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-[70px]';
  const enabledClasses = isActive
    ? 'bg-yellow-600 text-white ring-2 ring-yellow-400'
    : 'bg-gray-700 hover:bg-gray-600 text-white';
  const disabledClasses = 'bg-gray-800 text-gray-500 cursor-not-allowed';

  return (
    <button
      onClick={() => !disabled && onClick(actionType)}
      disabled={disabled}
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const ActionPanel: React.FC = () => {
  const selectedEntity = useGameStore(selectSelectedEntity);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const isMoving = useGameStore((state) => state.isMoving);
  const cursorPosition = useGameStore((state) => state.cursorPosition);
  const targetedEnemyId = useGameStore((state) => state.targetedEnemyId);
  const entities = useGameStore((state) => state.entities);

  // Pega ação planejada da entidade selecionada
  const plannedAction = selectedEntity
    ? timelineManager.getPlannedAction(selectedEntity.id)
    : undefined;

  const isPlanning = gamePhase === 'planning';
  const canPlan = isPlanning && selectedEntity?.isPlayerControlled;

  // Handler para planejar ação
  const handleActionClick = useCallback((actionType: ActionType) => {
    if (!selectedEntity || !canPlan) return;

    let target: PlannedAction['target'] | undefined;

    switch (actionType) {
      case 'move':
        if (cursorPosition) {
          target = cursorPosition;
        } else {
          // Marca que está aguardando seleção de posição
          console.log('[ActionPanel] Selecione uma posição no grid para mover');
          return;
        }
        break;
      case 'attack':
        if (targetedEnemyId) {
          target = targetedEnemyId;
        } else {
          console.log('[ActionPanel] Selecione um inimigo para atacar');
          return;
        }
        break;
      case 'wait':
      case 'defend':
        // Não precisa de alvo
        break;
    }

    timelineManager.planAction(selectedEntity.id, {
      type: actionType,
      target,
    });
  }, [selectedEntity, canPlan, cursorPosition, targetedEnemyId]);

  // Handler para cancelar ação
  const handleCancelAction = useCallback(() => {
    if (!selectedEntity || !canPlan) return;
    timelineManager.cancelAction(selectedEntity.id);
  }, [selectedEntity, canPlan]);

  // Handler para iniciar execução
  const handleStartExecution = useCallback(() => {
    if (!isPlanning) return;

    const plannedActions = timelineManager.getPlannedActions();
    if (plannedActions.size === 0) {
      console.log('[ActionPanel] Nenhuma ação planejada');
      return;
    }

    timelineManager.startExecution();
  }, [isPlanning]);

  // Se não há entidade selecionada, não mostra o painel
  if (!selectedEntity) {
    return null;
  }

  // Tradução dos tipos de ação
  const actionLabels: Record<ActionType, string> = {
    move: 'Mover',
    attack: 'Atacar',
    wait: 'Esperar',
    defend: 'Defender',
  };

  // Ícones dos tipos de ação
  const actionIcons: Record<ActionType, string> = {
    move: '🚶',
    attack: '⚔️',
    wait: '⏳',
    defend: '🛡️',
  };

  // Descrição do alvo da ação
  const getTargetDescription = (action: PlannedAction): string => {
    if (!action.target) return '';

    if (Array.isArray(action.target)) {
      const [x, y, z] = action.target;
      return `para (${x.toFixed(1)}, ${z.toFixed(1)})`;
    }

    const targetEntity = entities.find((e) => e.id === action.target);
    return targetEntity ? `em ${targetEntity.name}` : '';
  };

  return (
    <div className="bg-gray-900 bg-opacity-95 rounded-lg p-4 text-white min-w-[280px]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gray-300">
          Ações - {selectedEntity.name}
        </div>
        {!canPlan && (
          <div className="text-xs text-yellow-400">
            {gamePhase === 'execution' ? 'Executando...' : 'Aguarde'}
          </div>
        )}
      </div>

      {/* Ação Planejada Atual */}
      {plannedAction && (
        <div className="mb-4 p-2 bg-gray-800 rounded-lg border border-yellow-600">
          <div className="text-xs text-gray-400 mb-1">Ação Planejada:</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{actionIcons[plannedAction.type]}</span>
              <span className="font-medium">{actionLabels[plannedAction.type]}</span>
              <span className="text-xs text-gray-400">
                {getTargetDescription(plannedAction)}
              </span>
            </div>
            {canPlan && (
              <button
                onClick={handleCancelAction}
                className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-gray-700 rounded"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <ActionButton
          icon="🚶"
          label="Mover"
          actionType="move"
          disabled={!canPlan}
          onClick={handleActionClick}
          isActive={plannedAction?.type === 'move'}
        />
        <ActionButton
          icon="⚔️"
          label="Atacar"
          actionType="attack"
          disabled={!canPlan}
          onClick={handleActionClick}
          isActive={plannedAction?.type === 'attack'}
        />
        <ActionButton
          icon="🛡️"
          label="Defender"
          actionType="defend"
          disabled={!canPlan}
          onClick={handleActionClick}
          isActive={plannedAction?.type === 'defend'}
        />
        <ActionButton
          icon="⏳"
          label="Esperar"
          actionType="wait"
          disabled={!canPlan}
          onClick={handleActionClick}
          isActive={plannedAction?.type === 'wait'}
        />
      </div>

      {/* Dica de Contexto */}
      {canPlan && !plannedAction && (
        <div className="text-xs text-gray-500 text-center mb-3">
          {cursorPosition ? (
            <>Clique em <span className="text-blue-400">Mover</span> para ir até a posição selecionada</>
          ) : targetedEnemyId ? (
            <>Clique em <span className="text-red-400">Atacar</span> para atacar o inimigo</>
          ) : (
            <>Selecione uma ação ou clique no grid/inimigo</>
          )}
        </div>
      )}

      {/* Botão de Executar */}
      {isPlanning && (
        <button
          onClick={handleStartExecution}
          disabled={timelineManager.getPlannedActions().size === 0}
          className={`w-full py-2 rounded-lg font-bold transition-colors ${
            timelineManager.getPlannedActions().size > 0
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Executar Turno
        </button>
      )}

      {/* Indicador de Execução */}
      {gamePhase === 'execution' && (
        <div className="w-full py-2 bg-yellow-600 rounded-lg text-center">
          <div className="text-sm font-bold">Executando...</div>
          <div className="w-full h-1 bg-yellow-800 mt-2 rounded overflow-hidden">
            <div className="h-full bg-yellow-300 animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPanel;
