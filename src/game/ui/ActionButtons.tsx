/**
 * =============================================================================
 * ACTION BUTTONS - BOTÕES DE AÇÃO DO JOGADOR
 * =============================================================================
 *
 * Botões para selecionar ações durante a fase de planejamento:
 * - Mover: Clique no grid para definir destino
 * - Atacar: Clique em um inimigo para atacar
 * - Defender: Preparar defesa
 * - Esperar: Não fazer nada
 */

import React, { useCallback } from 'react';
import { useGameStore, selectSelectedEntity } from '../store/gameStore';
import { ActionType } from '../systems/PhaseManager';

// =============================================================================
// TIPOS
// =============================================================================

export type ActionMode = 'none' | 'move' | 'attack';

interface ActionButtonsProps {
  /** Modo de ação atual */
  actionMode: ActionMode;
  /** Callback quando modo muda */
  onActionModeChange: (mode: ActionMode) => void;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  actionMode,
  onActionModeChange,
}) => {
  // Estado do store
  const selectedEntity = useGameStore(selectSelectedEntity);
  const turnPhase = useGameStore((state) => state.turnPhase);
  const plannedActions = useGameStore((state) => state.plannedActions);
  const planAction = useGameStore((state) => state.planAction);
  const entities = useGameStore((state) => state.entities);

  // Verifica se está na fase de planejamento
  const isPlanning = turnPhase === 'planning';

  // Verifica se a entidade já tem ação planejada
  const hasPlannedAction = selectedEntity
    ? plannedActions.some((a) => a.entityId === selectedEntity.id)
    : false;

  // Handler para defender
  const handleDefend = useCallback(() => {
    if (!selectedEntity || !isPlanning) return;
    planAction(selectedEntity.id, ActionType.DEFEND);
    onActionModeChange('none');
  }, [selectedEntity, isPlanning, planAction, onActionModeChange]);

  // Handler para esperar
  const handleWait = useCallback(() => {
    if (!selectedEntity || !isPlanning) return;
    planAction(selectedEntity.id, ActionType.WAIT);
    onActionModeChange('none');
  }, [selectedEntity, isPlanning, planAction, onActionModeChange]);

  // Handler para mover
  const handleMove = useCallback(() => {
    if (!selectedEntity || !isPlanning) return;
    onActionModeChange(actionMode === 'move' ? 'none' : 'move');
  }, [selectedEntity, isPlanning, actionMode, onActionModeChange]);

  // Handler para atacar
  const handleAttack = useCallback(() => {
    if (!selectedEntity || !isPlanning) return;
    onActionModeChange(actionMode === 'attack' ? 'none' : 'attack');
  }, [selectedEntity, isPlanning, actionMode, onActionModeChange]);

  // Não renderiza se não há entidade selecionada ou não está planejando
  if (!selectedEntity || !isPlanning) {
    return null;
  }

  // Encontra inimigos válidos para ataque
  const validTargets = entities.filter(
    (e) => e.isPlayerControlled !== selectedEntity.isPlayerControlled && e.stats.hp > 0
  );

  return (
    <div className="bg-gray-900 bg-opacity-95 rounded-lg p-3 text-white min-w-[200px] pointer-events-auto">
      {/* Header */}
      <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
        Ações - {selectedEntity.name}
      </div>

      {/* Status de ação planejada */}
      {hasPlannedAction && (
        <div className="mb-2 px-2 py-1 bg-green-900 bg-opacity-50 rounded text-xs text-green-400">
          Ação já planejada para este turno
        </div>
      )}

      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-2">
        {/* Mover */}
        <button
          onClick={handleMove}
          disabled={hasPlannedAction}
          className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
            actionMode === 'move'
              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
              : hasPlannedAction
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <span className="text-2xl mb-1">🚶</span>
          <span className="text-xs font-medium">Mover</span>
        </button>

        {/* Atacar */}
        <button
          onClick={handleAttack}
          disabled={hasPlannedAction || validTargets.length === 0}
          className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
            actionMode === 'attack'
              ? 'bg-red-600 text-white ring-2 ring-red-400'
              : hasPlannedAction || validTargets.length === 0
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <span className="text-2xl mb-1">⚔️</span>
          <span className="text-xs font-medium">Atacar</span>
        </button>

        {/* Defender */}
        <button
          onClick={handleDefend}
          disabled={hasPlannedAction}
          className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
            hasPlannedAction
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <span className="text-2xl mb-1">🛡️</span>
          <span className="text-xs font-medium">Defender</span>
        </button>

        {/* Esperar */}
        <button
          onClick={handleWait}
          disabled={hasPlannedAction}
          className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
            hasPlannedAction
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <span className="text-2xl mb-1">⏳</span>
          <span className="text-xs font-medium">Esperar</span>
        </button>
      </div>

      {/* Instrução do modo atual */}
      {actionMode !== 'none' && (
        <div className="mt-3 px-2 py-2 bg-gray-800 rounded text-xs text-center">
          {actionMode === 'move' && (
            <span className="text-blue-400">Clique no grid para mover</span>
          )}
          {actionMode === 'attack' && (
            <span className="text-red-400">Clique em um inimigo para atacar</span>
          )}
        </div>
      )}

      {/* Botão cancelar modo */}
      {actionMode !== 'none' && (
        <button
          onClick={() => onActionModeChange('none')}
          className="mt-2 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
        >
          Cancelar (ESC)
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
