/**
 * =============================================================================
 * GAME HUD - INTERFACE PRINCIPAL DO JOGO
 * =============================================================================
 *
 * HUD completo do jogo com todos os elementos de interface:
 * - Barra superior (menu, turno, fase)
 * - Painéis laterais (grid, spawn, debug, stats)
 * - Barra inferior (log, ações)
 */

import React, { useState, useCallback } from 'react';
import { useGameStore, selectSelectedEntity } from '../store/gameStore';
import { timelineManager } from '../core/TimelineManager';
import type { Entity } from '../types';

// Componentes
import { PhaseIndicator, PlannedActionsIndicator } from './PhaseIndicator';
import { CombatLog, type CombatLogEntry } from './CombatLog';
import { SaveLoadMenu } from './SaveLoadMenu';
import { SettingsMenu } from './SettingsMenu';
import { StatsEditor } from './StatsEditor';
import { ActionButtons, type ActionMode } from './ActionButtons';

// =============================================================================
// TIPOS
// =============================================================================

interface GameHUDProps {
  onResetCamera?: () => void;
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

interface IconButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onClick,
  active = false,
  badge,
}) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
    }`}
    title={label}
  >
    <span className="text-lg">{icon}</span>
    <span className="text-sm hidden sm:inline">{label}</span>
    {badge && (
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

// =============================================================================
// COMPONENTE DE INFORMAÇÕES DA ENTIDADE SELECIONADA
// =============================================================================

interface EntityInfoProps {
  entity: Entity;
  onEditStats: () => void;
}

const EntityInfo: React.FC<EntityInfoProps> = ({ entity, onEditStats }) => {
  const hpPercent = (entity.stats.hp / entity.stats.maxHp) * 100;
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-gray-900 bg-opacity-95 rounded-lg p-4 text-white min-w-[280px] pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: entity.color }}
          />
          <span className="font-bold text-lg">{entity.name}</span>
          {entity.isPlayerControlled && (
            <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">Jogador</span>
          )}
        </div>
        <button
          onClick={onEditStats}
          className="text-gray-400 hover:text-white text-sm px-2 py-1 bg-gray-800 rounded"
          title="Editar Stats"
        >
          Edit
        </button>
      </div>

      {/* HP Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">HP</span>
          <span className="text-white">
            {entity.stats.hp} / {entity.stats.maxHp}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${hpColor} transition-all duration-300`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div className="bg-gray-800 rounded p-2 text-center">
          <div className="text-gray-500 text-xs">FOR</div>
          <div className="text-yellow-400 font-bold">{entity.stats.for}</div>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <div className="text-gray-500 text-xs">AGI</div>
          <div className="text-green-400 font-bold">{entity.stats.agi}</div>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <div className="text-gray-500 text-xs">VEL</div>
          <div className="text-cyan-400 font-bold">{entity.stats.vel}</div>
        </div>
      </div>

      {/* Position */}
      <div className="text-xs text-gray-500">
        Posição: ({entity.position[0].toFixed(1)}, {entity.position[2].toFixed(1)})
        | Alcance: {entity.stats.speed}m
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const GameHUD: React.FC<GameHUDProps> = ({ onResetCamera }) => {
  // Estados de modais
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatsEditor, setShowStatsEditor] = useState(false);

  // Estado do store
  const selectedEntity = useGameStore(selectSelectedEntity);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const combatLog = useGameStore((state) => state.combatLog);
  const combatMode = useGameStore((state) => state.combatMode);
  const showDebug = useGameStore((state) => state.showDebug);
  const toggleDebug = useGameStore((state) => state.toggleDebug);
  const toggleCombatMode = useGameStore((state) => state.toggleCombatMode);
  const actionMode = useGameStore((state) => state.actionMode);
  const setActionMode = useGameStore((state) => state.setActionMode);

  // Handler para abrir editor de stats
  const handleEditStats = useCallback(() => {
    if (selectedEntity) {
      setShowStatsEditor(true);
    }
  }, [selectedEntity]);

  return (
    <>
      {/* ================================================================== */}
      {/* BARRA SUPERIOR */}
      {/* ================================================================== */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-none z-20">
        {/* Esquerda - Menu e Info */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Botões de Menu */}
          <div className="flex gap-2">
            <IconButton
              icon="Menu"
              label="Menu"
              onClick={() => setShowSaveLoad(true)}
            />
            <IconButton
              icon="Cfg"
              label="Opções"
              onClick={() => setShowSettings(true)}
            />
          </div>

          {/* Indicador de Fase */}
          <PhaseIndicator />

          {/* Indicador de Ações Planejadas */}
          <PlannedActionsIndicator />
        </div>

        {/* Centro - Turno */}
        <div className="bg-gray-900 bg-opacity-90 rounded-lg px-6 py-3 text-center pointer-events-auto">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Turno</div>
          <div className="text-4xl font-bold text-yellow-400">{currentTurn}</div>
        </div>

        {/* Direita - Controles */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <IconButton
              icon={combatMode ? 'Atk' : 'Mov'}
              label={combatMode ? 'Combate' : 'Movimento'}
              onClick={toggleCombatMode}
              active={combatMode}
            />
            <IconButton
              icon="Dbg"
              label="Debug"
              onClick={toggleDebug}
              active={showDebug}
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* LATERAL ESQUERDA - ENTIDADE SELECIONADA */}
      {/* ================================================================== */}
      {selectedEntity && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          <EntityInfo entity={selectedEntity} onEditStats={handleEditStats} />
          <ActionButtons
            actionMode={actionMode}
            onActionModeChange={setActionMode}
          />
        </div>
      )}

      {/* ================================================================== */}
      {/* CENTRO INFERIOR - LOG DE COMBATE */}
      {/* ================================================================== */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <CombatLog entries={combatLog as CombatLogEntry[]} maxVisible={5} />
      </div>

      {/* ================================================================== */}
      {/* INSTRUÇÕES (parte inferior) */}
      {/* ================================================================== */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-gray-500 text-xs pointer-events-none z-10">
        {combatMode
          ? 'Modo Combate: Clique em inimigos para atacar | C: Modo Movimento | ESC: Cancelar'
          : selectedEntity
          ? 'Clique no grid para mover | C: Modo Combate | ESC: Desselecionar'
          : 'Clique para selecionar | Scroll: Zoom | Arraste: Rotacionar'}
      </div>

      {/* ================================================================== */}
      {/* MODAIS */}
      {/* ================================================================== */}
      <SaveLoadMenu isOpen={showSaveLoad} onClose={() => setShowSaveLoad(false)} />
      <SettingsMenu
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onResetCamera={onResetCamera}
      />
      <StatsEditor
        isOpen={showStatsEditor}
        onClose={() => setShowStatsEditor(false)}
      />
    </>
  );
};

export default GameHUD;
