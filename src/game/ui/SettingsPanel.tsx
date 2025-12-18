/**
 * =============================================================================
 * SETTINGS PANEL - PAINEL DE CONFIGURAÇÕES DO JOGO
 * =============================================================================
 *
 * Painel lateral direito com controles para configurar o jogo:
 * - Tamanho do tabuleiro (slider)
 * - Toggle de visibilidade do grid
 * - Seleção de modo (quadrados/metros)
 * - Reset de câmera
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { entityManager } from '../core/EntityManager';
import type { GridMode } from '../types';

// =============================================================================
// ESTILOS INLINE (CSS-in-JS)
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '260px',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: '12px',
    padding: '16px',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(75, 85, 99, 0.5)',
    zIndex: 1000,
    pointerEvents: 'auto',
  },
  panelMinimized: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: 'auto',
    padding: '8px 12px',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: '8px',
    cursor: 'pointer',
    zIndex: 1000,
    pointerEvents: 'auto',
    border: '1px solid rgba(75, 85, 99, 0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(75, 85, 99, 0.5)',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fbbf24',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 4px',
  },
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  slider: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    appearance: 'none',
    backgroundColor: '#374151',
    cursor: 'pointer',
  },
  sliderValue: {
    minWidth: '40px',
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: 500,
    color: '#22c55e',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '8px 0',
  },
  checkboxInput: {
    width: '18px',
    height: '18px',
    accentColor: '#22c55e',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#e5e7eb',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    transition: 'background-color 0.2s',
    border: '1px solid transparent',
  },
  radioOptionSelected: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  radioInput: {
    width: '16px',
    height: '16px',
    accentColor: '#22c55e',
    cursor: 'pointer',
  },
  radioLabelContainer: {
    flex: 1,
  },
  radioLabel: {
    fontSize: '14px',
    color: '#e5e7eb',
  },
  radioDescription: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  button: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    backgroundColor: '#4b5563',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    margin: '16px 0',
  },
  infoText: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '4px',
  },
  shortcutsInfo: {
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'center',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    fontSize: '14px',
    cursor: 'pointer',
  },
  entityList: {
    maxHeight: '150px',
    overflowY: 'auto' as const,
    marginTop: '8px',
  },
  entityItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px',
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: '4px',
    marginBottom: '4px',
  },
  entityColor: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '8px',
  },
  entityName: {
    flex: 1,
    fontSize: '13px',
    color: '#e5e7eb',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 6px',
  },
  buttonSmall: {
    padding: '8px 12px',
    fontSize: '13px',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
  },
  buttonGreen: {
    backgroundColor: '#22c55e',
  },
  counter: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },
};

// =============================================================================
// DESCRIÇÕES DOS MODOS DE GRID
// =============================================================================

const GRID_MODE_INFO: Record<GridMode, { label: string; description: string; color: string }> = {
  squares: {
    label: 'Quadrados',
    description: 'Células de 1m x 1m para movimento por casas',
    color: '#22c55e',
  },
  meters: {
    label: 'Metros',
    description: 'Grid fino de 25cm para movimento livre',
    color: '#3b82f6',
  },
  hexagonal: {
    label: 'Hexagonal',
    description: 'Grid hexagonal (em desenvolvimento)',
    color: '#a855f7',
  },
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface SettingsPanelProps {
  /** Callback para resetar a câmera */
  onResetCamera?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onResetCamera }) => {
  // Estado local para minimizar
  const [minimized, setMinimized] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('goblin');
  const [activeTab, setActiveTab] = useState<'grid' | 'entities'>('grid');
  const [spawnAsPlayer, setSpawnAsPlayer] = useState(true); // Novo: toggle para jogador/inimigo

  // Estado do store
  const gridSize = useGameStore((state) => state.gridSize);
  const showGrid = useGameStore((state) => state.showGrid);
  const gridMode = useGameStore((state) => state.gridMode);
  const showDebug = useGameStore((state) => state.showDebug);
  const entities = useGameStore((state) => state.entities);

  // Ações do store
  const setGridSize = useGameStore((state) => state.setGridSize);
  const toggleGrid = useGameStore((state) => state.toggleGrid);
  const setGridMode = useGameStore((state) => state.setGridMode);
  const toggleDebug = useGameStore((state) => state.toggleDebug);
  const resetGame = useGameStore((state) => state.resetGame);
  const removeEntity = useGameStore((state) => state.removeEntity);

  // Lista de presets disponíveis
  const availablePresets = useMemo(() => entityManager.getAvailablePresets(), []);

  // Handler para mudança de tamanho do grid
  const handleGridSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      setGridSize(value);
    },
    [setGridSize]
  );

  // Handler para mudança de modo
  const handleModeChange = useCallback(
    (mode: GridMode) => {
      setGridMode(mode);
    },
    [setGridMode]
  );

  // Handler para reset de câmera
  const handleResetCamera = useCallback(() => {
    if (onResetCamera) {
      onResetCamera();
    }
  }, [onResetCamera]);

  // Handler para spawnar entidade no centro
  const handleSpawnAtCenter = useCallback(() => {
    const centerPos: [number, number, number] = [
      gridSize / 2 + (Math.random() - 0.5) * 2,
      0,
      gridSize / 2 + (Math.random() - 0.5) * 2,
    ];
    entityManager.spawnFromPreset(selectedPreset, centerPos, spawnAsPlayer);
  }, [selectedPreset, gridSize, spawnAsPlayer]);

  // Handler para spawnar entidade em posição aleatória
  const handleSpawnRandom = useCallback(() => {
    const randomPos: [number, number, number] = [
      1 + Math.random() * (gridSize - 2),
      0,
      1 + Math.random() * (gridSize - 2),
    ];
    entityManager.spawnFromPreset(selectedPreset, randomPos, spawnAsPlayer);
  }, [selectedPreset, gridSize, spawnAsPlayer]);

  // Handler para remover entidade
  const handleRemoveEntity = useCallback(
    (id: string) => {
      removeEntity(id);
    },
    [removeEntity]
  );

  // Handler para limpar todas as entidades
  const handleClearAllEntities = useCallback(() => {
    entities.forEach((e) => removeEntity(e.id));
  }, [entities, removeEntity]);

  // Se minimizado, mostra apenas botão para expandir
  if (minimized) {
    return (
      <div style={styles.panelMinimized} onClick={() => setMinimized(false)}>
        <span style={{ fontSize: '16px', color: '#fbbf24' }}>⚙️</span>
      </div>
    );
  }

  // Estilos para abas
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    backgroundColor: isActive ? '#374151' : 'transparent',
    color: isActive ? '#fbbf24' : '#9ca3af',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 400,
    borderRadius: '6px',
    transition: 'all 0.2s',
  });

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>⚙️ Painel</h3>
        <button style={styles.closeButton} onClick={() => setMinimized(true)}>
          ✕
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        <button style={tabStyle(activeTab === 'grid')} onClick={() => setActiveTab('grid')}>
          🗺️ Grid
        </button>
        <button style={tabStyle(activeTab === 'entities')} onClick={() => setActiveTab('entities')}>
          👾 Entidades ({entities.length})
        </button>
      </div>

      {/* Conteúdo da aba Grid */}
      {activeTab === 'grid' && (
        <>
          {/* Tamanho do Tabuleiro */}
          <div style={styles.section}>
            <label style={styles.label}>Tamanho do Tabuleiro</label>
            <div style={styles.sliderContainer}>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={gridSize}
                onChange={handleGridSizeChange}
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{gridSize}m</span>
            </div>
            <div style={styles.infoText}>
              Grid de {gridSize}x{gridSize} metros
            </div>
          </div>

          {/* Toggle Grid */}
          <div style={styles.section}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={toggleGrid}
                style={styles.checkboxInput}
              />
              <span style={styles.checkboxLabel}>Mostrar Grid</span>
            </label>
          </div>

          {/* Modo do Grid */}
          <div style={styles.section}>
            <label style={styles.label}>Modo do Grid</label>
            <div style={styles.radioGroup}>
              {(Object.keys(GRID_MODE_INFO) as GridMode[]).map((mode) => {
                const info = GRID_MODE_INFO[mode];
                const isSelected = gridMode === mode;

                return (
                  <label
                    key={mode}
                    style={{
                      ...styles.radioOption,
                      ...(isSelected ? styles.radioOptionSelected : {}),
                      borderColor: isSelected ? info.color : 'transparent',
                    }}
                    onClick={() => handleModeChange(mode)}
                  >
                    <input
                      type="radio"
                      name="gridMode"
                      checked={isSelected}
                      onChange={() => handleModeChange(mode)}
                      style={{
                        ...styles.radioInput,
                        accentColor: info.color,
                      }}
                    />
                    <div style={styles.radioLabelContainer}>
                      <div style={styles.radioLabel}>{info.label}</div>
                      <div style={styles.radioDescription}>{info.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={styles.divider} />

          {/* Toggle Debug */}
          <div style={styles.section}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={showDebug}
                onChange={toggleDebug}
                style={styles.checkboxInput}
              />
              <span style={styles.checkboxLabel}>Modo Debug</span>
            </label>
          </div>

          {/* Botões de Ação */}
          <div style={styles.buttonContainer}>
            <button style={styles.button} onClick={handleResetCamera}>
              🎥 Reset Câmera
            </button>

            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={resetGame}
            >
              🔄 Reset Jogo
            </button>
          </div>
        </>
      )}

      {/* Conteúdo da aba Entidades */}
      {activeTab === 'entities' && (
        <>
          {/* Seleção de Criatura */}
          <div style={styles.section}>
            <label style={styles.label}>Tipo de Criatura</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              style={styles.select}
            >
              {availablePresets.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.name} ({preset.type})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Jogador/Inimigo */}
          <div style={styles.section}>
            <label style={styles.label}>Controle</label>
            <div style={styles.buttonRow}>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonSmall,
                  flex: 1,
                  backgroundColor: spawnAsPlayer ? '#22c55e' : '#374151',
                  borderColor: spawnAsPlayer ? '#22c55e' : '#4b5563',
                }}
                onClick={() => setSpawnAsPlayer(true)}
              >
                🎮 Jogador
              </button>
              <button
                style={{
                  ...styles.button,
                  ...styles.buttonSmall,
                  flex: 1,
                  backgroundColor: !spawnAsPlayer ? '#ef4444' : '#374151',
                  borderColor: !spawnAsPlayer ? '#ef4444' : '#4b5563',
                }}
                onClick={() => setSpawnAsPlayer(false)}
              >
                👾 Inimigo
              </button>
            </div>
          </div>

          {/* Botões de Spawn */}
          <div style={styles.section}>
            <label style={styles.label}>Spawnar</label>
            <div style={styles.buttonRow}>
              <button
                style={{ ...styles.button, ...styles.buttonGreen, ...styles.buttonSmall, flex: 1 }}
                onClick={handleSpawnAtCenter}
              >
                🎯 Centro
              </button>
              <button
                style={{ ...styles.button, ...styles.buttonSmall, flex: 1 }}
                onClick={handleSpawnRandom}
              >
                🎲 Aleatório
              </button>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Lista de Entidades */}
          <div style={styles.section}>
            <label style={styles.label}>Entidades no Cenário</label>
            {entities.length === 0 ? (
              <div style={styles.infoText}>Nenhuma entidade spawned</div>
            ) : (
              <>
                <div style={styles.entityList}>
                  {entities.map((entity) => (
                    <div key={entity.id} style={styles.entityItem}>
                      <div
                        style={{ ...styles.entityColor, backgroundColor: entity.color }}
                      />
                      <span style={styles.entityName}>
                        {entity.name}
                        <span style={{ color: '#6b7280', fontSize: '11px', marginLeft: '4px' }}>
                          ({entity.stats.hp}/{entity.stats.maxHp})
                        </span>
                      </span>
                      <button
                        style={styles.deleteButton}
                        onClick={() => handleRemoveEntity(entity.id)}
                        title="Remover entidade"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div style={styles.counter}>
                  Total: {entities.length} entidades
                </div>
              </>
            )}
          </div>

          {/* Botão Limpar Tudo */}
          {entities.length > 0 && (
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={handleClearAllEntities}
            >
              🗑️ Limpar Todas
            </button>
          )}
        </>
      )}

      {/* Info de Atalhos */}
      <div style={{ ...styles.divider, marginBottom: '12px' }} />
      <div style={styles.shortcutsInfo}>
        Atalhos: G (Grid) • D (Debug) • ESC (Deselecionar)
      </div>
    </div>
  );
};

export default SettingsPanel;
