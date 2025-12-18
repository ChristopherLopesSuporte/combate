/**
 * =============================================================================
 * GAME CONTROLS - CONTROLES DO JOGO
 * =============================================================================
 *
 * Controles de ação do jogo: mover, atacar, defender, etc.
 * Aparece quando uma entidade está selecionada.
 */

import React, { useState } from 'react';
import { useGameStore, selectSelectedEntity } from '../store/gameStore';
import { timelineManager } from '../core/TimelineManager';
import type { GameAction } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  hotkey?: string;
  color?: string;
}

type ActionMode = 'none' | 'move' | 'attack' | 'defend' | 'wait';

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const GameControls: React.FC = () => {
  const selectedEntity = useGameStore(selectSelectedEntity);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const [actionMode, setActionMode] = useState<ActionMode>('none');

  // Não mostra se não há entidade selecionada ou não está em planejamento
  if (!selectedEntity || gamePhase !== 'planning') return null;

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleMove = () => {
    setActionMode(actionMode === 'move' ? 'none' : 'move');
    // TODO: Ativar modo de seleção de destino
  };

  const handleAttack = () => {
    setActionMode(actionMode === 'attack' ? 'none' : 'attack');
    // TODO: Ativar modo de seleção de alvo
  };

  const handleDefend = () => {
    const action: GameAction = {
      type: 'defend',
      entityId: selectedEntity.id,
      timeMs: 200,
    };
    timelineManager.queueAction(action);
    setActionMode('none');
  };

  const handleWait = () => {
    const action: GameAction = {
      type: 'wait',
      entityId: selectedEntity.id,
      timeMs: 500,
    };
    timelineManager.queueAction(action);
    setActionMode('none');
  };

  const handleEndTurn = () => {
    timelineManager.startExecution();
  };

  const handleCancelAction = () => {
    timelineManager.cancelAction(selectedEntity.id);
    setActionMode('none');
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
      <div className="bg-gray-900 bg-opacity-95 rounded-lg p-4 shadow-xl">
        {/* Entidade Selecionada */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedEntity.color }}
          />
          <span className="text-white font-bold">{selectedEntity.name}</span>
          <span className="text-gray-400 text-sm">
            HP: {selectedEntity.stats.hp}/{selectedEntity.stats.maxHp}
          </span>
        </div>

        {/* Ações */}
        <div className="flex gap-2 mb-3">
          <ActionButton
            icon="↗"
            label="Mover"
            onClick={handleMove}
            active={actionMode === 'move'}
            hotkey="M"
            color="blue"
          />
          <ActionButton
            icon="⚔"
            label="Atacar"
            onClick={handleAttack}
            active={actionMode === 'attack'}
            hotkey="A"
            color="red"
          />
          <ActionButton
            icon="🛡"
            label="Defender"
            onClick={handleDefend}
            hotkey="D"
            color="yellow"
          />
          <ActionButton
            icon="⏳"
            label="Esperar"
            onClick={handleWait}
            hotkey="W"
            color="gray"
          />
        </div>

        {/* Instruções do Modo */}
        {actionMode !== 'none' && (
          <div className="mb-3 p-2 bg-gray-800 rounded text-sm">
            {actionMode === 'move' && (
              <span className="text-blue-400">
                Clique no grid para definir o destino
              </span>
            )}
            {actionMode === 'attack' && (
              <span className="text-red-400">
                Clique em um inimigo para atacar
              </span>
            )}
          </div>
        )}

        {/* Botões de Controle */}
        <div className="flex gap-2">
          <button
            onClick={handleCancelAction}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-sm transition-colors"
          >
            Cancelar Ações
          </button>
          <button
            onClick={handleEndTurn}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-white font-bold text-sm transition-colors"
          >
            Executar Turno
          </button>
        </div>

        {/* Atalhos */}
        <div className="mt-3 pt-3 border-t border-gray-700 text-center">
          <span className="text-gray-500 text-xs">
            Atalhos: [M]over, [A]tacar, [D]efender, [W]ait, [Enter] Executar
          </span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BOTÃO DE AÇÃO
// =============================================================================

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  hotkey,
  color = 'gray',
}) => {
  const colorClasses: Record<string, { bg: string; hover: string; active: string }> = {
    blue: {
      bg: 'bg-blue-900',
      hover: 'hover:bg-blue-800',
      active: 'bg-blue-600',
    },
    red: {
      bg: 'bg-red-900',
      hover: 'hover:bg-red-800',
      active: 'bg-red-600',
    },
    yellow: {
      bg: 'bg-yellow-900',
      hover: 'hover:bg-yellow-800',
      active: 'bg-yellow-600',
    },
    gray: {
      bg: 'bg-gray-700',
      hover: 'hover:bg-gray-600',
      active: 'bg-gray-500',
    },
  };

  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center
        w-16 h-16 rounded-lg transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active ? colors.active : `${colors.bg} ${colors.hover}`}
        border-2 ${active ? 'border-white' : 'border-transparent'}
      `}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-white text-xs">{label}</span>
      {hotkey && (
        <span className="absolute top-1 right-1 text-gray-400 text-[10px] bg-black bg-opacity-50 px-1 rounded">
          {hotkey}
        </span>
      )}
    </button>
  );
};

export default GameControls;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Sistema de habilidades especiais
// - Preview de movimento no grid
// - Preview de alcance de ataque
// - Sistema de reações
// - Múltiplas ações por turno
// - Barra de ação/tempo
