/**
 * =============================================================================
 * DEBUG PANEL - PAINEL DE DEBUG COMPLETO
 * =============================================================================
 *
 * Painel para visualizar informações de debug durante o desenvolvimento.
 * Mostra FPS, estado do jogo, entidades, performance e controles rápidos.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore, createDefaultEntity } from '../store/gameStore';
import { timelineManager } from '../core/TimelineManager';
import entityConfigs from '../entities/entityConfigs.json';

// =============================================================================
// HOOK DE FPS
// =============================================================================

const useFPS = () => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measure = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measure);
    };

    const frameId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return fps;
};

// =============================================================================
// TIPOS
// =============================================================================

interface DebugPanelProps {
  selectedEntity?: import('../types').Entity | null;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const DebugPanel: React.FC<DebugPanelProps> = ({ selectedEntity: propSelectedEntity }) => {
  const entities = useGameStore((state) => state.entities);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const gridSize = useGameStore((state) => state.gridSize);
  const gridMode = useGameStore((state) => state.gridMode);
  const showGrid = useGameStore((state) => state.showGrid);
  const showHitboxes = useGameStore((state) => state.showHitboxes);
  const selectedEntityId = useGameStore((state) => state.selectedEntityId);
  const addEntity = useGameStore((state) => state.addEntity);
  const removeEntity = useGameStore((state) => state.removeEntity);
  const toggleHitboxes = useGameStore((state) => state.toggleHitboxes);

  const fps = useFPS();
  const [expanded, setExpanded] = useState(true);
  const [showRanges, setShowRanges] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [executionSpeed, setExecutionSpeed] = useState(1);
  const [spawnCoords, setSpawnCoords] = useState({ x: 5, z: 5 });

  // Usa prop ou busca do store
  const selectedEntity = propSelectedEntity ?? entities.find((e) => e.id === selectedEntityId);

  // Spawnar entidade
  const handleSpawn = useCallback((presetKey: string) => {
    const preset = (entityConfigs.presets as Record<string, any>)[presetKey];
    if (!preset) return;

    const entity = createDefaultEntity({
      name: preset.name,
      position: [spawnCoords.x, 0, spawnCoords.z],
      size: preset.size,
      radius: preset.radius,
      color: preset.color,
      type: preset.type,
      isPlayerControlled: false,
      stats: {
        ...preset.stats,
      },
    });

    addEntity(entity);
  }, [spawnCoords, addEntity]);

  // Limpar todas entidades
  const handleClearAll = useCallback(() => {
    if (window.confirm('Remover todas as entidades?')) {
      entities.forEach((e) => removeEntity(e.id));
    }
  }, [entities, removeEntity]);

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
      <div className="bg-black bg-opacity-80 rounded-lg text-white text-xs font-mono">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-gray-700 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-yellow-400 font-bold">DEBUG</span>
          <div className="flex items-center gap-3">
            <FPSIndicator fps={fps} />
            <span className="text-gray-500">{expanded ? '▼' : '▶'}</span>
          </div>
        </div>

        {expanded && (
          <div className="p-3 space-y-3 max-w-md">
            {/* Game State */}
            <Section title="Game State">
              <DebugRow label="Phase" value={gamePhase} />
              <DebugRow label="Turn" value={currentTurn} />
              <DebugRow label="Grid Size" value={`${gridSize}x${gridSize}`} />
              <DebugRow label="Timeline Time" value={`${timelineManager.getCurrentTime()} ms`} />
            </Section>

            {/* Entities */}
            <Section title={`Entities (${entities.length})`}>
              {entities.length === 0 ? (
                <span className="text-gray-500">Nenhuma entidade</span>
              ) : (
                entities.map((entity) => (
                  <div
                    key={entity.id}
                    className={`flex items-center gap-2 py-1 ${
                      entity.id === selectedEntityId ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entity.color }}
                    />
                    <span className="truncate max-w-[100px]">{entity.name}</span>
                    <span className="text-gray-500">
                      [{entity.position.map((p) => p.toFixed(1)).join(', ')}]
                    </span>
                    <span className="text-green-400">
                      {entity.stats.hp}/{entity.stats.maxHp}
                    </span>
                  </div>
                ))
              )}
            </Section>

            {/* Selected Entity Details */}
            {selectedEntity && (
              <Section title="Selected Entity">
                <DebugRow label="ID" value={selectedEntity.id.slice(0, 12) + '...'} />
                <DebugRow label="Name" value={selectedEntity.name} />
                <DebugRow label="Type" value={selectedEntity.type} />
                <DebugRow label="Position" value={selectedEntity.position.map((p) => p.toFixed(2)).join(', ')} />
                <DebugRow label="Rotation" value={selectedEntity.rotation.map((r) => r.toFixed(2)).join(', ')} />
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <span className="text-gray-500">Stats:</span>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    <span>VEL: {selectedEntity.stats.vel}</span>
                    <span>HAB: {selectedEntity.stats.hab}</span>
                    <span>AGI: {selectedEntity.stats.agi}</span>
                    <span>FOR: {selectedEntity.stats.for}</span>
                    <span>RES: {selectedEntity.stats.res}</span>
                    <span>PER: {selectedEntity.stats.per}</span>
                  </div>
                </div>
              </Section>
            )}

            {/* Grid Info */}
            <Section title="Grid">
              <DebugRow label="Size" value={`${gridSize}x${gridSize}`} />
              <DebugRow label="Mode" value={gridMode} />
              <DebugRow label="Visible" value={showGrid ? 'Yes' : 'No'} />
            </Section>

            {/* Performance */}
            <Section title="Performance">
              <DebugRow label="FPS" value={fps} />
              <DebugRow label="Memory" value={getMemoryUsage()} />
              <DebugRow label="Entities" value={entities.length} />
            </Section>

            {/* Quick Controls */}
            <Section title="Quick Controls">
              <div className="space-y-2">
                <ToggleButton
                  label="Show Hitboxes"
                  value={showHitboxes}
                  onChange={toggleHitboxes}
                />
                <ToggleButton
                  label="Show Ranges"
                  value={showRanges}
                  onChange={() => setShowRanges(!showRanges)}
                />
                <ToggleButton
                  label="God Mode"
                  value={godMode}
                  onChange={() => setGodMode(!godMode)}
                />
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Exec Speed:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="range"
                      min="0.25"
                      max="2"
                      step="0.25"
                      value={executionSpeed}
                      onChange={(e) => setExecutionSpeed(parseFloat(e.target.value))}
                      className="w-16 h-1"
                    />
                    <span className="text-white w-8">{executionSpeed}x</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Quick Spawn */}
            <Section title="Quick Spawn">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={spawnCoords.x}
                    onChange={(e) => setSpawnCoords({ ...spawnCoords, x: parseFloat(e.target.value) || 0 })}
                    placeholder="X"
                    className="w-12 px-1 bg-gray-800 border border-gray-700 rounded text-center"
                  />
                  <input
                    type="number"
                    value={spawnCoords.z}
                    onChange={(e) => setSpawnCoords({ ...spawnCoords, z: parseFloat(e.target.value) || 0 })}
                    placeholder="Z"
                    className="w-12 px-1 bg-gray-800 border border-gray-700 rounded text-center"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Object.keys(entityConfigs.presets).slice(0, 6).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSpawn(key)}
                      className="px-1 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-[10px] truncate"
                      title={key}
                    >
                      {(entityConfigs.presets as Record<string, any>)[key]?.name || key}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleClearAll}
                  className="w-full px-2 py-1 bg-red-800 hover:bg-red-700 rounded text-xs"
                >
                  Clear All Entities
                </button>
              </div>
            </Section>

            {/* Keyboard Shortcuts */}
            <Section title="Shortcuts">
              <div className="text-gray-400 space-y-1">
                <div>G - Toggle Grid</div>
                <div>D - Toggle Debug</div>
                <div>H - Toggle Hitboxes</div>
                <div>C - Combat Mode</div>
                <div>ESC - Deselect</div>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTES
// =============================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div>
    <div className="text-cyan-400 font-bold mb-1">{title}</div>
    <div className="pl-2 text-gray-300">{children}</div>
  </div>
);

interface DebugRowProps {
  label: string;
  value: string | number;
}

const DebugRow: React.FC<DebugRowProps> = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}:</span>
    <span className="text-white">{value}</span>
  </div>
);

interface ToggleButtonProps {
  label: string;
  value: boolean;
  onChange: () => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-400">{label}:</span>
    <button
      onClick={onChange}
      className={`px-2 py-0.5 rounded text-xs ${
        value ? 'bg-green-600' : 'bg-gray-700'
      }`}
    >
      {value ? 'ON' : 'OFF'}
    </button>
  </div>
);

interface FPSIndicatorProps {
  fps: number;
}

const FPSIndicator: React.FC<FPSIndicatorProps> = ({ fps }) => {
  const getColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <span className={`${getColor(fps)}`}>
      {fps} FPS
    </span>
  );
};

// =============================================================================
// UTILITÁRIOS
// =============================================================================

const getMemoryUsage = (): string => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    if (memory) {
      const mb = memory.usedJSHeapSize / 1024 / 1024;
      return `${mb.toFixed(1)} MB`;
    }
  }
  return 'N/A';
};

export default DebugPanel;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Gráfico de FPS ao longo do tempo
// - Profiler de performance
// - Log de eventos em tempo real
// - Controles de tempo (slow-mo, pause)
// - Inspector de componentes 3D
