/**
 * =============================================================================
 * JOGO PAGE - PÁGINA DO JOGO 3D FULLSCREEN
 * =============================================================================
 *
 * Página que contém o jogo RPG 3D tático em modo fullscreen.
 * Ocupa toda a tela sem scroll, focado na experiência de jogo.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Importa o jogo 3D de forma lazy para melhor performance
const Game3D = lazy(() => import('../game/Game3D'));

// =============================================================================
// LOADING OVERLAY
// =============================================================================

const LoadingOverlay = () => (
  <div className="game-loading-overlay">
    <div className="game-loading-spinner" />
    <p className="text-gray-400 mt-4 text-lg">Carregando jogo...</p>
    <p className="text-gray-600 text-sm mt-2">Preparando ambiente 3D</p>
  </div>
);

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

const JogoPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Ativa modo fullscreen ao montar
  useEffect(() => {
    // Adiciona classe ao HTML para desabilitar scroll
    document.documentElement.classList.add('game-mode');
    document.body.style.overflow = 'hidden';

    // Simula tempo de carregamento minimo para transicao suave
    const timer = setTimeout(() => setIsLoaded(true), 100);

    // Cleanup ao desmontar
    return () => {
      document.documentElement.classList.remove('game-mode');
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, []);

  // Handler para sair do jogo
  const handleExit = () => {
    navigate('/');
  };

  // Handler para tecla ESC sair do jogo (duplo ESC)
  useEffect(() => {
    let escPressCount = 0;
    let escTimer = null;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        escPressCount++;

        if (escPressCount === 1) {
          // Primeiro ESC - inicia timer
          escTimer = setTimeout(() => {
            escPressCount = 0;
          }, 500);
        } else if (escPressCount >= 2) {
          // Duplo ESC - sai do jogo
          clearTimeout(escTimer);
          escPressCount = 0;
          handleExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (escTimer) clearTimeout(escTimer);
    };
  }, [navigate]);

  return (
    <div className="game-fullscreen">
      {/* Botao de sair */}
      <button
        className="game-exit-button"
        onClick={handleExit}
        title="Voltar ao menu (ou pressione ESC duas vezes)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Sair</span>
      </button>

      {/* Jogo 3D */}
      <Suspense fallback={<LoadingOverlay />}>
        {isLoaded && (
          <div className="w-full h-full">
            <Game3D />
          </div>
        )}
      </Suspense>

      {/* Hint de controles (aparece brevemente) */}
      <ControlsHint />
    </div>
  );
};

// =============================================================================
// HINT DE CONTROLES
// =============================================================================

const ControlsHint = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2
                 bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3
                 text-gray-300 text-sm flex items-center gap-6
                 animate-pulse z-50 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span>
        <kbd className="bg-gray-700 px-2 py-1 rounded text-xs mr-1">Arrastar</kbd>
        Rotacionar
      </span>
      <span>
        <kbd className="bg-gray-700 px-2 py-1 rounded text-xs mr-1">Scroll</kbd>
        Zoom
      </span>
      <span>
        <kbd className="bg-gray-700 px-2 py-1 rounded text-xs mr-1">ESC ESC</kbd>
        Sair
      </span>
    </div>
  );
};

export default JogoPage;
