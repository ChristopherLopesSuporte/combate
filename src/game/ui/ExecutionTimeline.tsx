/**
 * =============================================================================
 * EXECUTION TIMELINE - LINHA DO TEMPO VISUAL
 * =============================================================================
 *
 * Barra horizontal mostrando a ordem de execução das ações baseada no tempo.
 * Aparece durante a fase de execução para visualizar quem age primeiro.
 */

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { ActionType, TurnPhase } from '../systems/PhaseManager';
import type { PlannedAction } from '../systems/PhaseManager';

// =============================================================================
// CONSTANTES
// =============================================================================

const ACTION_ICONS: Record<ActionType, string> = {
  [ActionType.MOVE]: '🚶',
  [ActionType.ATTACK]: '⚔️',
  [ActionType.DEFEND]: '🛡️',
  [ActionType.WAIT]: '⏳',
  [ActionType.USE_ITEM]: '🎒',
  [ActionType.SPECIAL]: '✨',
};

const ACTION_NAMES: Record<ActionType, string> = {
  [ActionType.MOVE]: 'Mover',
  [ActionType.ATTACK]: 'Atacar',
  [ActionType.DEFEND]: 'Defender',
  [ActionType.WAIT]: 'Esperar',
  [ActionType.USE_ITEM]: 'Item',
  [ActionType.SPECIAL]: 'Especial',
};

// =============================================================================
// ITEM DA TIMELINE
// =============================================================================

interface TimelineItemProps {
  action: PlannedAction;
  entity: any;
  position: number; // 0-100%
  isActive: boolean;
  isExecuted: boolean;
  maxTimeMs: number;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  action,
  entity,
  position,
  isActive,
  isExecuted,
  maxTimeMs,
}) => {
  const isEnemy = !entity.isPlayerControlled;

  return (
    <div
      className={`
        absolute transform -translate-x-1/2 transition-all duration-300
        ${isActive ? 'scale-110 z-20' : 'scale-100 z-10'}
        ${isExecuted ? 'opacity-50' : 'opacity-100'}
      `}
      style={{ left: `${position}%` }}
    >
      {/* Marcador vertical */}
      <div
        className={`
          w-0.5 h-4 mx-auto mb-1
          ${isEnemy ? 'bg-red-500' : 'bg-green-500'}
          ${isActive ? 'animate-pulse' : ''}
        `}
      />

      {/* Avatar da entidade */}
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          text-white font-bold text-sm shadow-lg
          transition-all duration-300
          ${isActive ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}
          ${isEnemy ? 'ring-2 ring-red-500' : ''}
        `}
        style={{ backgroundColor: entity.color }}
        title={`${entity.name}: ${ACTION_NAMES[action.type]} (${action.currentTimeMs}ms)`}
      >
        {isExecuted ? '✓' : ACTION_ICONS[action.type]}
      </div>

      {/* Nome e tempo */}
      <div className="text-center mt-1 w-20 -ml-5">
        <div
          className={`
            text-xs font-medium truncate
            ${isEnemy ? 'text-red-400' : 'text-green-400'}
          `}
        >
          {entity.name}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          {action.currentTimeMs}ms
        </div>
      </div>

      {/* Indicador de ação atual */}
      {isActive && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold animate-bounce">
            AGINDO
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MARCADOR DE TEMPO
// =============================================================================

interface TimeMarkerProps {
  timeMs: number;
  position: number;
}

const TimeMarker: React.FC<TimeMarkerProps> = ({ timeMs, position }) => {
  return (
    <div
      className="absolute transform -translate-x-1/2"
      style={{ left: `${position}%`, bottom: '100%' }}
    >
      <div className="text-[10px] text-gray-600 font-mono mb-1">
        {timeMs}ms
      </div>
      <div className="w-px h-2 bg-gray-700 mx-auto" />
    </div>
  );
};

// =============================================================================
// CURSOR DE PROGRESSO
// =============================================================================

interface ProgressCursorProps {
  progress: number; // 0-100%
  currentTimeMs: number;
}

const ProgressCursor: React.FC<ProgressCursorProps> = ({
  progress,
  currentTimeMs,
}) => {
  return (
    <div
      className="absolute top-0 bottom-0 w-1 bg-yellow-400 transition-all duration-100 z-30"
      style={{ left: `${progress}%` }}
    >
      {/* Cabeça do cursor */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded font-mono font-bold">
          {currentTimeMs}ms
        </div>
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-400 mx-auto" />
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface ExecutionTimelineProps {
  isVisible?: boolean;
  onActionStart?: (action: PlannedAction) => void;
  onActionComplete?: (action: PlannedAction) => void;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  isVisible = true,
  onActionStart,
  onActionComplete,
}) => {
  // Estado do store
  const turnPhase = useGameStore(state => state.turnPhase);
  const entities = useGameStore(state => state.entities);
  const executionQueue = useGameStore(state => state.executionQueue);
  const currentTurn = useGameStore(state => state.currentTurn);

  // Estado local de animação
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [activeActionIndex, setActiveActionIndex] = useState(-1);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Ordena ações por tempo
  const sortedActions = useMemo(() => {
    return [...executionQueue].sort((a, b) => a.currentTimeMs - b.currentTimeMs);
  }, [executionQueue]);

  // Tempo máximo para escala
  const maxTimeMs = useMemo(() => {
    if (sortedActions.length === 0) return 1000;
    return Math.max(
      ...sortedActions.map(a => a.currentTimeMs),
      1000
    ) * 1.1; // 10% de margem
  }, [sortedActions]);

  // Calcula posição de cada ação na timeline
  const actionPositions = useMemo(() => {
    return sortedActions.map(action => ({
      action,
      entity: entities.find(e => e.id === action.entityId),
      position: (action.currentTimeMs / maxTimeMs) * 100,
    }));
  }, [sortedActions, entities, maxTimeMs]);

  // Marcadores de tempo (a cada 200ms ou 500ms dependendo da escala)
  const timeMarkers = useMemo(() => {
    const interval = maxTimeMs > 2000 ? 500 : 200;
    const markers: number[] = [];
    for (let t = 0; t <= maxTimeMs; t += interval) {
      markers.push(t);
    }
    return markers;
  }, [maxTimeMs]);

  // Inicia animação quando entra na fase de execução
  useEffect(() => {
    if (turnPhase === TurnPhase.EXECUTION && sortedActions.length > 0) {
      setIsAnimating(true);
      setCurrentTimeMs(0);
      setActiveActionIndex(-1);
      setExecutedActions(new Set());
      lastTimeRef.current = performance.now();
    } else {
      setIsAnimating(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [turnPhase, sortedActions.length]);

  // Loop de animação
  useEffect(() => {
    if (!isAnimating) return;

    const animate = (timestamp: number) => {
      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setCurrentTimeMs(prev => {
        const newTime = prev + deltaMs * 0.5; // Velocidade da animação (0.5x)

        // Verifica se alguma ação deve iniciar
        sortedActions.forEach((action, index) => {
          if (
            newTime >= action.currentTimeMs &&
            !executedActions.has(action.id) &&
            activeActionIndex < index
          ) {
            setActiveActionIndex(index);
            onActionStart?.(action);

            // Marca como executado após um delay
            setTimeout(() => {
              setExecutedActions(prev => new Set(prev).add(action.id));
              onActionComplete?.(action);
            }, 500);
          }
        });

        // Para animação quando passou do tempo máximo
        if (newTime >= maxTimeMs) {
          setIsAnimating(false);
          return maxTimeMs;
        }

        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, sortedActions, maxTimeMs, activeActionIndex, executedActions, onActionStart, onActionComplete]);

  // Não renderiza fora da fase de execução
  if (turnPhase !== TurnPhase.EXECUTION || !isVisible || sortedActions.length === 0) {
    return null;
  }

  const progressPercent = (currentTimeMs / maxTimeMs) * 100;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div
        className="
          bg-gradient-to-r from-gray-900/95 via-gray-900/95 to-gray-900/95
          backdrop-blur-sm border-2 border-cyan-500/50 rounded-xl
          shadow-2xl shadow-cyan-500/20 p-4
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="text-lg font-bold text-cyan-400">
                FASE: EXECUÇÃO
              </h3>
              <p className="text-xs text-gray-500">
                Turno {currentTurn} • {sortedActions.length} ações na fila
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">Aliados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-400">Inimigos</span>
            </div>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative h-24 mx-8">
          {/* Marcadores de tempo */}
          <div className="absolute inset-x-0 bottom-16">
            {timeMarkers.map(time => (
              <TimeMarker
                key={time}
                timeMs={time}
                position={(time / maxTimeMs) * 100}
              />
            ))}
          </div>

          {/* Barra de fundo */}
          <div className="absolute inset-x-0 top-8 h-2 bg-gray-800 rounded-full overflow-hidden">
            {/* Progresso */}
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Cursor de progresso */}
          <div className="absolute inset-x-0 top-6 h-6">
            <ProgressCursor
              progress={progressPercent}
              currentTimeMs={Math.round(currentTimeMs)}
            />
          </div>

          {/* Items da timeline */}
          <div className="absolute inset-x-0 top-12">
            {actionPositions.map(({ action, entity, position }, index) => {
              if (!entity) return null;
              return (
                <TimelineItem
                  key={action.id}
                  action={action}
                  entity={entity}
                  position={position}
                  isActive={activeActionIndex === index}
                  isExecuted={executedActions.has(action.id)}
                  maxTimeMs={maxTimeMs}
                />
              );
            })}
          </div>
        </div>

        {/* Footer com estatísticas */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            <span className="text-cyan-400 font-mono">{Math.round(currentTimeMs)}ms</span>
            <span className="mx-2">/</span>
            <span className="font-mono">{Math.round(maxTimeMs)}ms</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-500">
              Executadas: <span className="text-green-400 font-bold">{executedActions.size}</span>
            </span>
            <span className="text-gray-500">
              Pendentes: <span className="text-yellow-400 font-bold">{sortedActions.length - executedActions.size}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionTimeline;
