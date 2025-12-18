/**
 * =============================================================================
 * PHASE INDICATOR - INDICADOR DE FASE DO TURNO
 * =============================================================================
 *
 * Componente visual que indica a fase atual do turno:
 * - PLANNING: Verde, "Planeje suas ações"
 * - EXECUTION: Amarelo, "Executando ações..."
 * - PAUSED: Vermelho pulsante, "CONFLITO DETECTADO"
 * - FINISHED: Azul, "Turno finalizado"
 */

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { timelineManager, type TurnPhase } from '../core/TimelineManager';

// =============================================================================
// CONFIGURAÇÃO DAS FASES
// =============================================================================

interface PhaseConfig {
  label: string;
  sublabel: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  animate?: boolean;
}

const phaseConfigs: Record<TurnPhase, PhaseConfig> = {
  planning: {
    label: 'PLANEJAMENTO',
    sublabel: 'Planeje suas ações',
    bgColor: 'bg-green-900',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
    icon: '📋',
  },
  execution: {
    label: 'EXECUÇÃO',
    sublabel: 'Executando ações...',
    bgColor: 'bg-yellow-900',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    icon: '⚡',
    animate: true,
  },
  paused: {
    label: 'CONFLITO',
    sublabel: 'Decisão necessária!',
    bgColor: 'bg-red-900',
    textColor: 'text-red-400',
    borderColor: 'border-red-500',
    icon: '⚠️',
    animate: true,
  },
  finished: {
    label: 'FINALIZADO',
    sublabel: 'Próximo turno...',
    bgColor: 'bg-blue-900',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    icon: '✅',
  },
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const PhaseIndicator: React.FC = () => {
  const gamePhase = useGameStore((state) => state.gamePhase) as TurnPhase;
  const currentTurn = useGameStore((state) => state.currentTurn);

  // Usa a fase do TimelineManager se disponível
  const phase = timelineManager.getPhase() || gamePhase;
  const turn = timelineManager.getTurnNumber() || currentTurn;

  const config = phaseConfigs[phase] || phaseConfigs.planning;

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor}
        border-2 rounded-lg p-3 min-w-[180px]
        ${config.animate ? 'animate-pulse' : ''}
        transition-all duration-300
      `}
    >
      {/* Ícone e Label */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{config.icon}</span>
        <span className={`text-sm font-bold ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* Sublabel */}
      <div className="text-xs text-gray-400 mb-2">{config.sublabel}</div>

      {/* Turno */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Turno</span>
        <span className="text-lg font-bold text-white">{turn}</span>
      </div>

      {/* Barra de progresso para execução */}
      {phase === 'execution' && <ExecutionProgress />}
    </div>
  );
};

// =============================================================================
// BARRA DE PROGRESSO DA EXECUÇÃO
// =============================================================================

const ExecutionProgress: React.FC = () => {
  // Aqui poderíamos calcular o progresso real das execuções
  // Por enquanto, mostramos uma animação

  return (
    <div className="mt-2">
      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{
            width: '100%',
            animation: 'progress 1.5s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};

// =============================================================================
// VERSÃO COMPACTA (para HUD)
// =============================================================================

export const PhaseIndicatorCompact: React.FC = () => {
  const gamePhase = useGameStore((state) => state.gamePhase) as TurnPhase;
  const phase = timelineManager.getPhase() || gamePhase;
  const config = phaseConfigs[phase] || phaseConfigs.planning;

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor}
        border rounded px-2 py-1 flex items-center gap-1
        ${config.animate ? 'animate-pulse' : ''}
      `}
    >
      <span className="text-sm">{config.icon}</span>
      <span className={`text-xs font-bold ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
};

// =============================================================================
// INDICADOR DE AÇÕES PLANEJADAS
// =============================================================================

export const PlannedActionsIndicator: React.FC = () => {
  const entities = useGameStore((state) => state.entities);
  const playerEntities = entities.filter((e) => e.isPlayerControlled);

  const plannedActions = timelineManager.getPlannedActions();
  const plannedCount = Array.from(plannedActions.keys()).filter((id) =>
    playerEntities.some((e) => e.id === id)
  ).length;

  const totalPlayerUnits = playerEntities.length;

  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2">
      <div className="text-xs text-gray-400 mb-1">Ações Planejadas</div>
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold text-white">
          {plannedCount} / {totalPlayerUnits}
        </div>
        {plannedCount === totalPlayerUnits && totalPlayerUnits > 0 && (
          <span className="text-green-400 text-xs">✓ Pronto</span>
        )}
      </div>
      {/* Indicadores visuais por unidade */}
      <div className="flex gap-1 mt-1">
        {playerEntities.map((entity) => {
          const hasAction = plannedActions.has(entity.id);
          return (
            <div
              key={entity.id}
              className={`w-2 h-2 rounded-full ${
                hasAction ? 'bg-green-500' : 'bg-gray-600'
              }`}
              title={`${entity.name}: ${hasAction ? 'Planejado' : 'Pendente'}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PhaseIndicator;
