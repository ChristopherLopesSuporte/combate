/**
 * =============================================================================
 * ACTION SELECTOR - SELETOR DE AÇÕES
 * =============================================================================
 *
 * Modal para selecionar ações detalhadas para uma entidade.
 * Permite escolher tipo de ação, alvo e configurações.
 */

import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ActionType } from '../systems/PhaseManager';
import type { Entity, Position3D, AttackType } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

interface ActionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
}

interface ActionOption {
  type: ActionType;
  label: string;
  icon: string;
  description: string;
  requiresTarget: boolean;
  requiresPosition: boolean;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const ACTION_OPTIONS: ActionOption[] = [
  {
    type: ActionType.MOVE,
    label: 'Mover',
    icon: '🚶',
    description: 'Move para uma posição no grid',
    requiresTarget: false,
    requiresPosition: true,
  },
  {
    type: ActionType.ATTACK,
    label: 'Atacar',
    icon: '⚔️',
    description: 'Ataca um inimigo próximo',
    requiresTarget: true,
    requiresPosition: false,
  },
  {
    type: ActionType.DEFEND,
    label: 'Defender',
    icon: '🛡️',
    description: 'Assume posição defensiva (+defesa, -mobilidade)',
    requiresTarget: false,
    requiresPosition: false,
  },
  {
    type: ActionType.WAIT,
    label: 'Esperar',
    icon: '⏳',
    description: 'Aguarda o próximo turno sem agir',
    requiresTarget: false,
    requiresPosition: false,
  },
  {
    type: ActionType.USE_ITEM,
    label: 'Usar Item',
    icon: '🎒',
    description: 'Usa um item do inventário',
    requiresTarget: false,
    requiresPosition: false,
  },
  {
    type: ActionType.SPECIAL,
    label: 'Habilidade',
    icon: '✨',
    description: 'Usa uma habilidade especial',
    requiresTarget: true,
    requiresPosition: false,
  },
];

const ATTACK_TYPES: { type: AttackType; label: string; timeMs: number; damage: string }[] = [
  { type: 'jab', label: 'Jab (Rápido)', timeMs: 300, damage: 'Baixo' },
  { type: 'direto', label: 'Direto', timeMs: 500, damage: 'Médio' },
  { type: 'corte', label: 'Corte', timeMs: 700, damage: 'Alto' },
  { type: 'estocada', label: 'Estocada', timeMs: 600, damage: 'Médio-Alto' },
  { type: 'aparar', label: 'Aparar (Defesa)', timeMs: 400, damage: '-' },
];

// =============================================================================
// COMPONENTE DE SELEÇÃO DE ALVO
// =============================================================================

interface TargetSelectorProps {
  targets: Entity[];
  selectedTarget: string | null;
  onSelect: (targetId: string) => void;
}

const TargetSelector: React.FC<TargetSelectorProps> = ({
  targets,
  selectedTarget,
  onSelect,
}) => {
  if (targets.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Nenhum alvo disponível
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {targets.map((target) => (
        <button
          key={target.id}
          onClick={() => onSelect(target.id)}
          className={`w-full flex items-center justify-between p-3 rounded transition-colors ${
            selectedTarget === target.id
              ? 'bg-red-900 border border-red-500'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: target.color }}
            />
            <div className="text-left">
              <div className="text-sm font-medium text-white">{target.name}</div>
              <div className="text-xs text-gray-400">
                HP: {target.stats.hp}/{target.stats.maxHp}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {Math.sqrt(
              Math.pow(target.position[0], 2) + Math.pow(target.position[2], 2)
            ).toFixed(1)}m
          </div>
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// COMPONENTE DE SELEÇÃO DE TIPO DE ATAQUE
// =============================================================================

interface AttackTypeSelectorProps {
  selectedType: AttackType;
  onSelect: (type: AttackType) => void;
}

const AttackTypeSelector: React.FC<AttackTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  return (
    <div className="space-y-2">
      {ATTACK_TYPES.map((attack) => (
        <button
          key={attack.type}
          onClick={() => onSelect(attack.type)}
          className={`w-full flex items-center justify-between p-3 rounded transition-colors ${
            selectedType === attack.type
              ? 'bg-blue-900 border border-blue-500'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          <div className="text-left">
            <div className="text-sm font-medium text-white">{attack.label}</div>
            <div className="text-xs text-gray-400">
              Tempo: {attack.timeMs}ms | Dano: {attack.damage}
            </div>
          </div>
          {selectedType === attack.type && (
            <span className="text-blue-400">✓</span>
          )}
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// COMPONENTE DE SELEÇÃO DE POSIÇÃO
// =============================================================================

interface PositionSelectorProps {
  currentPosition: Position3D;
  maxDistance: number;
  selectedPosition: Position3D | null;
  onSelect: (position: Position3D) => void;
}

const PositionSelector: React.FC<PositionSelectorProps> = ({
  currentPosition,
  maxDistance,
  selectedPosition,
  onSelect,
}) => {
  // Grid simplificado de posições
  const gridSize = 5;
  const cellSize = maxDistance / gridSize;

  return (
    <div className="p-2">
      <div className="text-xs text-gray-400 mb-2">
        Distância máxima: {maxDistance}m
      </div>
      <div className="text-xs text-gray-400 mb-2">
        {selectedPosition
          ? `Selecionado: (${selectedPosition[0].toFixed(1)}, ${selectedPosition[2].toFixed(1)})`
          : 'Clique no grid 3D para selecionar posição'}
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 25 }).map((_, index) => {
          const x = (index % 5) - 2;
          const z = Math.floor(index / 5) - 2;
          const posX = currentPosition[0] + x * cellSize;
          const posZ = currentPosition[2] + z * cellSize;
          const isCenter = x === 0 && z === 0;
          const isSelected =
            selectedPosition &&
            Math.abs(selectedPosition[0] - posX) < cellSize / 2 &&
            Math.abs(selectedPosition[2] - posZ) < cellSize / 2;

          return (
            <button
              key={index}
              onClick={() => onSelect([posX, 0, posZ])}
              disabled={isCenter}
              className={`w-8 h-8 rounded text-xs transition-colors ${
                isCenter
                  ? 'bg-blue-600 cursor-not-allowed'
                  : isSelected
                  ? 'bg-green-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isCenter ? '●' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL - ACTION SELECTOR
// =============================================================================

export const ActionSelector: React.FC<ActionSelectorProps> = ({
  isOpen,
  onClose,
  entityId,
}) => {
  // Estado do store
  const entities = useGameStore((state) => state.entities);
  const planAction = useGameStore((state) => state.planAction);

  // Entidade atual
  const entity = useMemo(
    () => entities.find((e) => e.id === entityId),
    [entities, entityId]
  );

  // Estado local
  const [selectedAction, setSelectedAction] = useState<ActionType>(ActionType.WAIT);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position3D | null>(null);
  const [selectedAttackType, setSelectedAttackType] = useState<AttackType>('direto');
  const [step, setStep] = useState<'action' | 'details'>('action');

  // Alvos disponíveis (inimigos vivos)
  const availableTargets = useMemo(
    () => entities.filter((e) => !e.isPlayerControlled && e.stats.hp > 0),
    [entities]
  );

  // Opção de ação atual
  const currentOption = ACTION_OPTIONS.find((o) => o.type === selectedAction);

  // Handlers
  const handleActionSelect = (type: ActionType) => {
    setSelectedAction(type);
    const option = ACTION_OPTIONS.find((o) => o.type === type);

    if (option?.requiresTarget || option?.requiresPosition) {
      setStep('details');
    } else {
      // Ação não precisa de configuração adicional
      handleConfirm(type);
    }
  };

  const handleConfirm = (type?: ActionType) => {
    const actionType = type || selectedAction;

    planAction(entityId, actionType, {
      targetId: selectedTarget || undefined,
      targetPosition: selectedPosition || undefined,
      attackType: actionType === ActionType.ATTACK ? selectedAttackType : undefined,
    });

    // Reset e fecha
    setSelectedAction(ActionType.WAIT);
    setSelectedTarget(null);
    setSelectedPosition(null);
    setSelectedAttackType('direto');
    setStep('action');
    onClose();
  };

  const handleBack = () => {
    setStep('action');
  };

  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-96 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">
              {step === 'action' ? 'Selecionar Ação' : 'Configurar Ação'}
            </h2>
            <p className="text-sm text-gray-400">{entity.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'action' && (
            <div className="space-y-2">
              {ACTION_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleActionSelect(option.type)}
                  className="w-full flex items-center gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl">{option.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 'details' && (
            <div>
              {/* Info da ação selecionada */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg mb-4">
                <span className="text-2xl">{currentOption?.icon}</span>
                <div>
                  <div className="text-sm font-bold text-white">
                    {currentOption?.label}
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentOption?.description}
                  </div>
                </div>
              </div>

              {/* Seletor específico */}
              {currentOption?.requiresTarget && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-400 mb-2">
                    Selecionar Alvo
                  </h3>
                  <TargetSelector
                    targets={availableTargets}
                    selectedTarget={selectedTarget}
                    onSelect={setSelectedTarget}
                  />
                </div>
              )}

              {selectedAction === ActionType.ATTACK && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-400 mb-2">
                    Tipo de Ataque
                  </h3>
                  <AttackTypeSelector
                    selectedType={selectedAttackType}
                    onSelect={setSelectedAttackType}
                  />
                </div>
              )}

              {currentOption?.requiresPosition && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-gray-400 mb-2">
                    Selecionar Destino
                  </h3>
                  <PositionSelector
                    currentPosition={entity.position}
                    maxDistance={entity.stats.speed}
                    selectedPosition={selectedPosition}
                    onSelect={setSelectedPosition}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'details' && (
          <div className="flex gap-3 p-4 border-t border-gray-700">
            <button
              onClick={handleBack}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={() => handleConfirm()}
              disabled={
                (currentOption?.requiresTarget && !selectedTarget) ||
                (currentOption?.requiresPosition && !selectedPosition)
              }
              className={`flex-1 py-2 rounded font-bold transition-colors ${
                (currentOption?.requiresTarget && !selectedTarget) ||
                (currentOption?.requiresPosition && !selectedPosition)
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionSelector;
