/**
 * =============================================================================
 * TUTORIAL OVERLAY - OVERLAY DE TUTORIAL INICIAL
 * =============================================================================
 *
 * Overlay que aparece na primeira vez que o jogador abre o jogo.
 * Explica os controles básicos e mecânicas do jogo.
 */

import React, { useState, useEffect } from 'react';

// =============================================================================
// TIPOS
// =============================================================================

interface TutorialStep {
  icon: string;
  title: string;
  description: string;
}

interface TutorialOverlayProps {
  onComplete: () => void;
}

// =============================================================================
// PASSOS DO TUTORIAL
// =============================================================================

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🖱️',
    title: 'Selecionar Entidades',
    description: 'Clique em uma entidade para selecioná-la. Entidades com borda azul são controláveis pelo jogador.',
  },
  {
    icon: '🚶',
    title: 'Movimento',
    description: 'Com uma entidade selecionada, clique no grid para mover. O círculo verde mostra o alcance de movimento.',
  },
  {
    icon: '⚔️',
    title: 'Combate',
    description: 'Pressione C para modo combate. Clique em inimigos para selecionar alvo e atacar quando em alcance.',
  },
  {
    icon: '📋',
    title: 'Sistema de Turnos',
    description: 'Planeje ações para suas unidades na fase de PLANEJAMENTO. Use os botões Mover, Atacar, Defender ou Esperar.',
  },
  {
    icon: '⚡',
    title: 'Execução Simultânea',
    description: 'Clique em "Executar Turno" - todas entidades agem ao mesmo tempo! O sistema pausa quando detecta conflitos.',
  },
  {
    icon: '⚠️',
    title: 'Resolução de Conflitos',
    description: 'Quando algo importante acontece (inimigo avistado, ataque recebido), você escolhe como reagir.',
  },
  {
    icon: '🎮',
    title: 'Controles Extras',
    description: 'G = Toggle Grid | D = Debug | C = Combate | ESC = Cancelar | Scroll = Zoom | Arraste = Rotacionar câmera',
  },
];

// =============================================================================
// CONSTANTE DE STORAGE
// =============================================================================

const TUTORIAL_STORAGE_KEY = 'rpg3d_tutorial_completed';

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Verifica se já completou o tutorial
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (completed === 'true') {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  // Handler para próximo passo
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handler para passo anterior
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handler para completar
  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    }
    setIsVisible(false);
    onComplete();
  };

  // Handler para pular
  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    }
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-[500px] max-w-[90vw] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              RPG 3D Tático - Tutorial
            </h2>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white text-sm"
            >
              Pular
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1 mt-3">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-400' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="text-6xl mb-4">{step.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-gray-300 leading-relaxed">{step.description}</p>
          </div>

          {/* Step indicator */}
          <div className="text-center text-gray-500 text-sm mt-4">
            {currentStep + 1} / {TUTORIAL_STEPS.length}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          {/* Don't show again */}
          <div className="flex items-center justify-center mb-4">
            <label className="flex items-center gap-2 text-gray-400 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              Não mostrar novamente
            </label>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isFirstStep
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              Anterior
            </button>

            {isLastStep ? (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
              >
                Começar!
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// HOOK PARA VERIFICAR SE TUTORIAL FOI COMPLETADO
// =============================================================================

export const useTutorialCompleted = (): boolean => {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true');
  }, []);

  return completed;
};

// =============================================================================
// FUNÇÃO PARA RESETAR TUTORIAL
// =============================================================================

export const resetTutorial = (): void => {
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
};

export default TutorialOverlay;
