/**
 * =============================================================================
 * SETTINGS MENU - MENU DE CONFIGURAÇÕES
 * =============================================================================
 *
 * Menu de configurações do jogo.
 * Inclui opções de gráficos, som, gameplay e câmera.
 */

import React, { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { resetTutorial } from './TutorialOverlay';

// =============================================================================
// TIPOS
// =============================================================================

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onResetCamera?: () => void;
}

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

interface ToggleSettingProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

const SliderSetting: React.FC<SliderSettingProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => v.toString(),
}) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-gray-300">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <span className="text-white w-12 text-right">{formatValue(value)}</span>
    </div>
  </div>
);

const ToggleSetting: React.FC<ToggleSettingProps> = ({
  label,
  value,
  onChange,
  description,
}) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <span className="text-gray-300">{label}</span>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        value ? 'bg-blue-600' : 'bg-gray-700'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wide mb-2 pt-4 first:pt-0">
    <span>{icon}</span>
    <span>{title}</span>
  </div>
);

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  onResetCamera,
}) => {
  // Estados de configuração (locais para demo - idealmente viriam de um store)
  const [shadows, setShadows] = useState(true);
  const [antiAliasing, setAntiAliasing] = useState(true);
  const [shadowQuality, setShadowQuality] = useState(2);
  const [volumeGeneral, setVolumeGeneral] = useState(80);
  const [soundUI, setSoundUI] = useState(true);
  const [soundCombat, setSoundCombat] = useState(true);
  const [pauseOnSpot, setPauseOnSpot] = useState(true);
  const [pauseOnAttack, setPauseOnAttack] = useState(true);
  const [confirmExecution, setConfirmExecution] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [cameraPanSpeed, setCameraPanSpeed] = useState(1);
  const [cameraZoomSpeed, setCameraZoomSpeed] = useState(1);
  const [invertZoom, setInvertZoom] = useState(false);

  // Store
  const toggleGrid = useGameStore((state) => state.toggleGrid);
  const showGrid = useGameStore((state) => state.showGrid);

  // Handler para resetar configurações
  const handleResetSettings = useCallback(() => {
    setShadows(true);
    setAntiAliasing(true);
    setShadowQuality(2);
    setVolumeGeneral(80);
    setSoundUI(true);
    setSoundCombat(true);
    setPauseOnSpot(true);
    setPauseOnAttack(true);
    setConfirmExecution(false);
    setAnimationSpeed(1);
    setCameraPanSpeed(1);
    setCameraZoomSpeed(1);
    setInvertZoom(false);
  }, []);

  // Handler para resetar tutorial
  const handleResetTutorial = useCallback(() => {
    resetTutorial();
    alert('Tutorial será exibido novamente na próxima vez que abrir o jogo.');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-[450px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚙️</span>
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Gráficos */}
          <SectionTitle icon="🎨" title="Gráficos" />
          <div className="bg-gray-800 rounded-lg p-3">
            <ToggleSetting
              label="Sombras"
              value={shadows}
              onChange={setShadows}
            />
            <ToggleSetting
              label="Anti-aliasing"
              value={antiAliasing}
              onChange={setAntiAliasing}
            />
            <SliderSetting
              label="Qualidade de Sombras"
              value={shadowQuality}
              min={0}
              max={3}
              onChange={setShadowQuality}
              formatValue={(v) => ['Baixa', 'Média', 'Alta', 'Ultra'][v]}
            />
            <ToggleSetting
              label="Mostrar Grid"
              value={showGrid}
              onChange={() => toggleGrid()}
            />
          </div>

          {/* Som */}
          <SectionTitle icon="🔊" title="Som" />
          <div className="bg-gray-800 rounded-lg p-3">
            <SliderSetting
              label="Volume Geral"
              value={volumeGeneral}
              min={0}
              max={100}
              onChange={setVolumeGeneral}
              formatValue={(v) => `${v}%`}
            />
            <ToggleSetting
              label="Sons de UI"
              value={soundUI}
              onChange={setSoundUI}
            />
            <ToggleSetting
              label="Sons de Combate"
              value={soundCombat}
              onChange={setSoundCombat}
            />
          </div>

          {/* Gameplay */}
          <SectionTitle icon="🎮" title="Gameplay" />
          <div className="bg-gray-800 rounded-lg p-3">
            <ToggleSetting
              label="Pausar ao avistar inimigo"
              value={pauseOnSpot}
              onChange={setPauseOnSpot}
              description="Pausa o jogo quando uma unidade avista um inimigo"
            />
            <ToggleSetting
              label="Pausar ao ser atacado"
              value={pauseOnAttack}
              onChange={setPauseOnAttack}
              description="Pausa quando uma unidade está prestes a receber dano"
            />
            <ToggleSetting
              label="Confirmar execução"
              value={confirmExecution}
              onChange={setConfirmExecution}
              description="Pede confirmação antes de executar o turno"
            />
            <SliderSetting
              label="Velocidade de Animação"
              value={animationSpeed}
              min={0.5}
              max={2}
              step={0.25}
              onChange={setAnimationSpeed}
              formatValue={(v) => `${v}x`}
            />
          </div>

          {/* Câmera */}
          <SectionTitle icon="📷" title="Câmera" />
          <div className="bg-gray-800 rounded-lg p-3">
            <SliderSetting
              label="Velocidade de Pan"
              value={cameraPanSpeed}
              min={0.5}
              max={2}
              step={0.25}
              onChange={setCameraPanSpeed}
              formatValue={(v) => `${v}x`}
            />
            <SliderSetting
              label="Velocidade de Zoom"
              value={cameraZoomSpeed}
              min={0.5}
              max={2}
              step={0.25}
              onChange={setCameraZoomSpeed}
              formatValue={(v) => `${v}x`}
            />
            <ToggleSetting
              label="Inverter Zoom"
              value={invertZoom}
              onChange={setInvertZoom}
            />
            {onResetCamera && (
              <button
                onClick={onResetCamera}
                className="w-full mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                Resetar Câmera
              </button>
            )}
          </div>

          {/* Outros */}
          <SectionTitle icon="📋" title="Outros" />
          <div className="bg-gray-800 rounded-lg p-3">
            <button
              onClick={handleResetTutorial}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors mb-2"
            >
              Mostrar Tutorial Novamente
            </button>
            <button
              onClick={handleResetSettings}
              className="w-full px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded transition-colors"
            >
              Restaurar Padrões
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
