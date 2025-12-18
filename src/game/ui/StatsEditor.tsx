/**
 * =============================================================================
 * STATS EDITOR - EDITOR DE ATRIBUTOS
 * =============================================================================
 *
 * Componente para editar atributos de entidades.
 * Usado para configurar personagens e testar o sistema de combate.
 */

import React, { useState, useEffect } from 'react';
import type { Entity, EntityStats } from '../types';
import { useGameStore, createDefaultEntity } from '../store/gameStore';

// =============================================================================
// TIPOS
// =============================================================================

interface StatsEditorProps {
  entityId?: string;
  onSave?: (entity: Entity) => void;
  onCancel?: () => void;
  // Novo formato para modal
  isOpen?: boolean;
  onClose?: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const STAT_INFO: Record<keyof Omit<EntityStats, 'hp' | 'maxHp' | 'speed'>, { name: string; desc: string }> = {
  vel: { name: 'Velocidade', desc: 'Rapidez de reação e movimento' },
  hab: { name: 'Habilidade', desc: 'Precisão e técnica' },
  agi: { name: 'Agilidade', desc: 'Esquiva e mobilidade' },
  for: { name: 'Força', desc: 'Dano físico e resistência' },
  res: { name: 'Resistência', desc: 'HP e defesa' },
  per: { name: 'Percepção', desc: 'Detecção e iniciativa' },
};

const PRESET_BUILDS: Record<string, Partial<EntityStats>> = {
  balanced: { vel: 50, hab: 50, agi: 50, for: 50, res: 50, per: 50 },
  warrior: { vel: 40, hab: 55, agi: 35, for: 70, res: 60, per: 40 },
  rogue: { vel: 70, hab: 60, agi: 75, for: 35, res: 35, per: 65 },
  tank: { vel: 30, hab: 45, agi: 25, for: 55, res: 80, per: 35 },
  assassin: { vel: 80, hab: 70, agi: 65, for: 45, res: 30, per: 50 },
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const StatsEditor: React.FC<StatsEditorProps> = ({
  entityId,
  onSave,
  onCancel,
  isOpen,
  onClose,
}) => {
  const selectedEntityId = useGameStore((state) => state.selectedEntityId);
  const effectiveEntityId = entityId || selectedEntityId;

  const existingEntity = useGameStore((state) =>
    state.entities.find((e) => e.id === effectiveEntityId)
  );
  const addEntity = useGameStore((state) => state.addEntity);
  const updateEntity = useGameStore((state) => state.updateEntity);

  // IMPORTANTE: Hooks devem vir ANTES de qualquer return condicional
  const [entity, setEntity] = useState<Entity>(() =>
    existingEntity || createDefaultEntity()
  );

  const [totalPoints, setTotalPoints] = useState(0);
  const maxPoints = 300; // Total de pontos permitidos

  // Sincroniza estado local quando entidade muda
  useEffect(() => {
    if (existingEntity) {
      setEntity(existingEntity);
    }
  }, [existingEntity]);

  // Calcula pontos usados
  useEffect(() => {
    const used =
      entity.stats.vel +
      entity.stats.hab +
      entity.stats.agi +
      entity.stats.for +
      entity.stats.res +
      entity.stats.per;
    setTotalPoints(used);
  }, [entity.stats]);

  // Atualiza HP baseado em RES
  useEffect(() => {
    const newMaxHp = entity.stats.res * 2;
    if (entity.stats.maxHp !== newMaxHp) {
      setEntity((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          maxHp: newMaxHp,
          hp: Math.min(prev.stats.hp, newMaxHp),
        },
      }));
    }
  }, [entity.stats.res]);

  // Se usando formato modal e não está aberto, não renderiza
  if (isOpen !== undefined && !isOpen) {
    return null;
  }

  // Se não há entidade, não renderiza
  if (!existingEntity && isOpen !== undefined) {
    return null;
  }

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleStatChange = (stat: keyof EntityStats, value: number) => {
    setEntity((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: Math.max(1, Math.min(100, value)),
      },
    }));
  };

  const handleNameChange = (name: string) => {
    setEntity((prev) => ({ ...prev, name }));
  };

  const handleColorChange = (color: string) => {
    setEntity((prev) => ({ ...prev, color }));
  };

  const handlePresetSelect = (preset: keyof typeof PRESET_BUILDS) => {
    const presetStats = PRESET_BUILDS[preset];
    setEntity((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        ...presetStats,
      },
    }));
  };

  const handleSave = () => {
    if (effectiveEntityId) {
      updateEntity(effectiveEntityId, entity);
    } else {
      addEntity(entity);
    }
    onSave?.(entity);
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  // Wrapper modal se usando formato isOpen
  const content = (
    <div className="bg-gray-900 rounded-lg p-6 text-white max-w-md">
      {/* Header */}
      <h2 className="text-xl font-bold text-yellow-400 mb-4">
        {entityId ? 'Editar Entidade' : 'Nova Entidade'}
      </h2>

      {/* Nome e Cor */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome</label>
          <input
            type="text"
            value={entity.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Cor</label>
          <input
            type="color"
            value={entity.color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Presets</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESET_BUILDS).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetSelect(preset as keyof typeof PRESET_BUILDS)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm capitalize transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Pontos */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Pontos Usados</span>
          <span className={totalPoints > maxPoints ? 'text-red-400' : 'text-green-400'}>
            {totalPoints} / {maxPoints}
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              totalPoints > maxPoints ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, (totalPoints / maxPoints) * 100)}%` }}
          />
        </div>
      </div>

      {/* Atributos */}
      <div className="space-y-3 mb-6">
        {(Object.keys(STAT_INFO) as Array<keyof typeof STAT_INFO>).map((stat) => (
          <StatSlider
            key={stat}
            stat={stat}
            value={entity.stats[stat]}
            label={STAT_INFO[stat].name}
            description={STAT_INFO[stat].desc}
            onChange={(value) => handleStatChange(stat, value)}
          />
        ))}
      </div>

      {/* Derivados */}
      <div className="bg-gray-800 rounded p-3 mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Valores Derivados</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">HP:</span>
            <span className="text-green-400 font-bold">{entity.stats.maxHp}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Velocidade:</span>
            <span className="text-blue-400 font-bold">{entity.stats.speed} m/turno</span>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={totalPoints > maxPoints}
          className={`flex-1 py-2 rounded font-bold transition-colors ${
            totalPoints > maxPoints
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-500 text-black'
          }`}
        >
          {effectiveEntityId ? 'Salvar' : 'Criar'}
        </button>
        {(onCancel || onClose) && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );

  // Se formato modal, envolve em overlay
  if (isOpen !== undefined) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        {content}
      </div>
    );
  }

  return content;
};

// =============================================================================
// SLIDER DE ATRIBUTO
// =============================================================================

interface StatSliderProps {
  stat: string;
  value: number;
  label: string;
  description: string;
  onChange: (value: number) => void;
}

const StatSlider: React.FC<StatSliderProps> = ({
  stat,
  value,
  label,
  description,
  onChange,
}) => {
  const getStatColor = (val: number) => {
    if (val >= 70) return 'text-green-400';
    if (val >= 50) return 'text-yellow-400';
    if (val >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div>
          <span className="text-sm font-medium text-gray-300">{label}</span>
          <span className="text-xs text-gray-500 ml-2">({stat.toUpperCase()})</span>
        </div>
        <span className={`font-bold ${getStatColor(value)}`}>{value}</span>
      </div>
      <input
        type="range"
        min="1"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
      />
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
};

export default StatsEditor;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Seleção de equipamento
// - Seleção de habilidades
// - Sistema de pontos de experiência
// - Import/Export de personagens
// - Visualização 3D do personagem
