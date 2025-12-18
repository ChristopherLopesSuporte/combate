/**
 * =============================================================================
 * HUD - HEADS UP DISPLAY
 * =============================================================================
 *
 * Interface do usuário sobreposta ao jogo 3D.
 * Mostra HP, turno atual, controles e informações da entidade selecionada.
 */

import React from 'react';
import { useGameStore, selectSelectedEntity } from '../store/gameStore';

// =============================================================================
// COMPONENTE PRINCIPAL HUD
// =============================================================================

export const HUD: React.FC = () => {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const selectedEntity = useGameStore(selectSelectedEntity);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Header - Turno e Fase */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <TurnIndicator turn={currentTurn} phase={gamePhase} />
      </div>

      {/* Entidade Selecionada */}
      {selectedEntity && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <EntityPanel entity={selectedEntity} />
        </div>
      )}

      {/* Controles de Jogo */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <GameControls />
      </div>

      {/* Minimap placeholder */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <Minimap />
      </div>
    </div>
  );
};

// =============================================================================
// INDICADOR DE TURNO
// =============================================================================

interface TurnIndicatorProps {
  turn: number;
  phase: string;
}

const TurnIndicator: React.FC<TurnIndicatorProps> = ({ turn, phase }) => {
  const phaseColors: Record<string, string> = {
    planning: 'bg-blue-600',
    execution: 'bg-yellow-600',
    paused: 'bg-gray-600',
    ended: 'bg-red-600',
  };

  const phaseLabels: Record<string, string> = {
    planning: 'Planejamento',
    execution: 'Execução',
    paused: 'Pausado',
    ended: 'Finalizado',
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 rounded-lg p-3 text-white min-w-[150px]">
      <div className="text-sm text-gray-400 mb-1">Turno</div>
      <div className="text-3xl font-bold text-yellow-400">{turn}</div>
      <div className={`mt-2 px-2 py-1 rounded text-xs text-center ${phaseColors[phase] || 'bg-gray-600'}`}>
        {phaseLabels[phase] || phase}
      </div>
    </div>
  );
};

// =============================================================================
// PAINEL DA ENTIDADE
// =============================================================================

interface EntityPanelProps {
  entity: {
    id: string;
    name: string;
    stats: {
      hp: number;
      maxHp: number;
      vel: number;
      hab: number;
      agi: number;
      for: number;
      res: number;
      per: number;
    };
    color: string;
  };
}

const EntityPanel: React.FC<EntityPanelProps> = ({ entity }) => {
  const hpPercent = (entity.stats.hp / entity.stats.maxHp) * 100;

  const getHpColor = (percent: number) => {
    if (percent > 60) return 'bg-green-500';
    if (percent > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 rounded-lg p-4 text-white min-w-[250px]">
      {/* Nome e Cor */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: entity.color }}
        />
        <span className="font-bold text-lg">{entity.name}</span>
      </div>

      {/* Barra de HP */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">HP</span>
          <span className="text-white">
            {entity.stats.hp} / {entity.stats.maxHp}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getHpColor(hpPercent)} transition-all duration-300`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Atributos */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <StatBadge label="VEL" value={entity.stats.vel} />
        <StatBadge label="HAB" value={entity.stats.hab} />
        <StatBadge label="AGI" value={entity.stats.agi} />
        <StatBadge label="FOR" value={entity.stats.for} />
        <StatBadge label="RES" value={entity.stats.res} />
        <StatBadge label="PER" value={entity.stats.per} />
      </div>
    </div>
  );
};

// =============================================================================
// BADGE DE ATRIBUTO
// =============================================================================

interface StatBadgeProps {
  label: string;
  value: number;
}

const StatBadge: React.FC<StatBadgeProps> = ({ label, value }) => {
  const getStatColor = (val: number) => {
    if (val >= 70) return 'text-green-400';
    if (val >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800 rounded p-1 text-center">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className={`font-bold ${getStatColor(value)}`}>{value}</div>
    </div>
  );
};

// =============================================================================
// CONTROLES DO JOGO
// =============================================================================

const GameControls: React.FC = () => {
  const toggleGrid = useGameStore((state) => state.toggleGrid);
  const toggleDebug = useGameStore((state) => state.toggleDebug);
  const toggleHitboxes = useGameStore((state) => state.toggleHitboxes);
  const showGrid = useGameStore((state) => state.showGrid);
  const showDebug = useGameStore((state) => state.showDebug);
  const showHitboxes = useGameStore((state) => state.showHitboxes);

  return (
    <div className="bg-gray-900 bg-opacity-90 rounded-lg p-3 text-white">
      <div className="text-sm text-gray-400 mb-2">Controles</div>
      <div className="space-y-2">
        <ToggleButton
          label="Grid"
          active={showGrid}
          onClick={toggleGrid}
        />
        <ToggleButton
          label="Debug"
          active={showDebug}
          onClick={toggleDebug}
        />
        <ToggleButton
          label="Hitboxes"
          active={showHitboxes}
          onClick={toggleHitboxes}
        />
      </div>
    </div>
  );
};

// =============================================================================
// BOTÃO TOGGLE
// =============================================================================

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-1 rounded text-sm transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );
};

// =============================================================================
// MINIMAP
// =============================================================================

const Minimap: React.FC = () => {
  const entities = useGameStore((state) => state.entities);
  const gridSize = useGameStore((state) => state.gridSize);

  const mapSize = 120; // pixels

  return (
    <div className="bg-gray-900 bg-opacity-90 rounded-lg p-2">
      <div className="text-xs text-gray-400 mb-1">Mapa</div>
      <div
        className="relative bg-gray-800 rounded border border-gray-700"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#4a5568 1px, transparent 1px), linear-gradient(90deg, #4a5568 1px, transparent 1px)',
            backgroundSize: `${mapSize / gridSize}px ${mapSize / gridSize}px`,
          }}
        />

        {/* Entidades */}
        {entities.map((entity) => {
          const x = (entity.position[0] / gridSize) * mapSize;
          const z = (entity.position[2] / gridSize) * mapSize;

          return (
            <div
              key={entity.id}
              className="absolute w-2 h-2 rounded-full transform -translate-x-1 -translate-y-1"
              style={{
                left: x,
                top: z,
                backgroundColor: entity.color,
                boxShadow: entity.isSelected ? '0 0 4px white' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default HUD;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Barra de ações
// - Inventário
// - Sistema de notificações
// - Log de combate
// - Tooltip de entidades
// - Menu de pause
