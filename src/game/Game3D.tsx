/**
 * =============================================================================
 * GAME 3D - COMPONENTE PRINCIPAL DO JOGO
 * =============================================================================
 *
 * Componente React que renderiza a cena 3D do jogo usando React Three Fiber.
 * Este é o ponto de entrada do jogo 3D.
 *
 * Integra:
 * - Grid configurável via Zustand store
 * - Painel de configurações (SettingsPanel)
 * - Entidades 3D via EntityMesh
 * - Sistema de spawn de entidades
 * - Câmera orbital com controles
 */

import React, { Suspense, useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Componentes do jogo
import Grid from './core/Grid';
import SettingsPanel from './ui/SettingsPanel';
import DebugPanel from './ui/DebugPanel';
import { EntityList } from './components/EntityMesh';
import { MovementRangeIndicator } from './components/MovementRangeIndicator';
import { TargetIndicator } from './components/TargetIndicator';
import { PathLine } from './components/PathLine';
import { GridClickHandler } from './components/GridClickHandler';
import { AttackRangeIndicator } from './components/AttackRangeIndicator';
import { CombatEffectsManager, createCombatEffects } from './components/CombatEffects';
import { createLogEntry, detectLogType } from './ui/CombatLog';
import type { CombatLogEntry } from './ui/CombatLog';
import { useGameStore, selectSelectedEntity } from './store/gameStore';
import { movementSystem } from './systems/MovementSystem';
import { combatSystem } from './combat/CombatSystem';
import type { Entity } from './types';

// Sistema de turnos
import { timelineManager, type TurnPhase } from './core/TimelineManager';
import { decisionSystem } from './systems/DecisionSystem';
import { ActionPanel } from './ui/ActionPanel';
import { ConflictModalContainer } from './ui/ConflictModal';
import { PhaseIndicator, PlannedActionsIndicator } from './ui/PhaseIndicator';

// Sistema de fases avançado
import { PlanningPanel } from './ui/PlanningPanel';
import { ActionSelector } from './ui/ActionSelector';
import { TurnPhase as NewTurnPhase } from './systems/PhaseManager';
import { PerceptionPanel } from './ui/PerceptionPanel';
import { ExecutionTimeline } from './ui/ExecutionTimeline';
import { PlannedActionIndicators } from './components/PlannedActionIndicators';

// UI Final
import { TutorialOverlay } from './ui/TutorialOverlay';
import { GameHUD } from './ui/GameHUD';

// =============================================================================
// CONTROLES DE CÂMERA COM REF
// =============================================================================

interface CameraControlsProps {
  gridSize: number;
  controlsRef: React.RefObject<{ reset: () => void }>;
}

const CameraControls: React.FC<CameraControlsProps> = ({ gridSize, controlsRef }) => {
  const { camera } = useThree();
  const orbitRef = useRef<any>(null);

  // Expõe método de reset via ref
  useEffect(() => {
    if (controlsRef.current === null) return;

    (controlsRef as any).current = {
      reset: () => {
        if (orbitRef.current) {
          // Reset câmera para posição padrão
          camera.position.set(gridSize * 1.5, gridSize * 1.2, gridSize * 1.5);
          orbitRef.current.target.set(gridSize / 2, 0, gridSize / 2);
          orbitRef.current.update();
        }
      },
    };
  }, [camera, gridSize, controlsRef]);

  // Atualiza target quando gridSize muda
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.set(gridSize / 2, 0, gridSize / 2);
      orbitRef.current.update();
    }
  }, [gridSize]);

  return (
    <OrbitControls
      ref={orbitRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={Math.max(50, gridSize * 2)}
      maxPolarAngle={Math.PI / 2 - 0.1}
      target={[gridSize / 2, 0, gridSize / 2]}
    />
  );
};

// =============================================================================
// CENA 3D
// =============================================================================

interface SceneProps {
  entities: Entity[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  gridSize: number;
  controlsRef: React.RefObject<{ reset: () => void }>;
  onMoveAttempt?: (success: boolean, reason?: string) => void;
  combatMode: boolean;
  targetedEnemyId: string | null;
  onAttack?: (attackerId: string, defenderId: string) => void;
}

const Scene: React.FC<SceneProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  gridSize,
  controlsRef,
  onMoveAttempt,
  combatMode,
  targetedEnemyId,
  onAttack,
}) => {
  // Estado de movimento do store
  const cursorPosition = useGameStore((state) => state.cursorPosition);
  const isMoving = useGameStore((state) => state.isMoving);
  const combatEffects = useGameStore((state) => state.combatEffects);
  const removeCombatEffect = useGameStore((state) => state.removeCombatEffect);

  // Entidade selecionada
  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === selectedEntityId) || null,
    [entities, selectedEntityId]
  );

  // Entidade alvo (para combate)
  const targetedEntity = useMemo(
    () => entities.find((e) => e.id === targetedEnemyId) || null,
    [entities, targetedEnemyId]
  );

  // Calcula se cursor está no alcance e se posição é válida
  const cursorState = useMemo(() => {
    if (!selectedEntity || !cursorPosition) {
      return { inRange: false, isValid: false };
    }

    const range = movementSystem.getMovementRange(selectedEntity);
    const inRange = movementSystem.isPositionInRange(
      selectedEntity.position,
      cursorPosition,
      range
    );

    const validation = movementSystem.isValidMovePosition(
      cursorPosition,
      selectedEntity.id,
      selectedEntity.radius
    );

    return { inRange, isValid: validation.valid };
  }, [selectedEntity, cursorPosition]);

  return (
    <>
      {/* Câmera */}
      <PerspectiveCamera
        makeDefault
        position={[gridSize * 1.5, gridSize * 1.2, gridSize * 1.5]}
        fov={50}
      />

      {/* Controles orbitais */}
      <CameraControls gridSize={gridSize} controlsRef={controlsRef} />

      {/* ================================================================ */}
      {/* ILUMINACAO MELHORADA */}
      {/* ================================================================ */}

      {/* Luz ambiente suave */}
      <ambientLight intensity={0.3} color="#b4c6ff" />

      {/* Luz principal do sol */}
      <directionalLight
        position={[gridSize * 1.5, gridSize * 2, gridSize * 0.5]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={gridSize * 4}
        shadow-camera-left={-gridSize}
        shadow-camera-right={gridSize}
        shadow-camera-top={gridSize}
        shadow-camera-bottom={-gridSize}
        shadow-bias={-0.0001}
      />

      {/* Luz de preenchimento (fill light) */}
      <directionalLight
        position={[-gridSize, gridSize, -gridSize]}
        intensity={0.3}
        color="#6b8cff"
      />

      {/* Luz de borda (rim light) */}
      <pointLight
        position={[gridSize / 2, gridSize * 0.5, -gridSize]}
        intensity={0.5}
        color="#ffaa55"
        distance={gridSize * 2}
      />

      {/* Hemisphere light para iluminacao mais natural */}
      <hemisphereLight
        color="#87ceeb"
        groundColor="#553311"
        intensity={0.4}
      />

      {/* ================================================================ */}
      {/* SKYBOX - Ceu com estrelas */}
      {/* ================================================================ */}

      {/* Cor de fundo */}
      <color attach="background" args={['#0d1117']} />

      {/* Estrelas de fundo */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Ceu com gradiente (noite) */}
      <Sky
        distance={450000}
        sunPosition={[gridSize * 5, gridSize * 0.5, -gridSize * 5]}
        inclination={0.05}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.5}
        turbidity={10}
      />

      {/* Nevoeiro atmosferico */}
      <fog attach="fog" args={['#1a1a2e', gridSize * 2, gridSize * 5]} />

      {/* Grid do jogo (conectado ao store) */}
      <Grid />

      {/* Handler de cliques no grid */}
      <GridClickHandler
        gridSize={gridSize}
        onMoveAttempt={onMoveAttempt}
      />

      {/* Indicador de alcance de movimento (quando NÃO em modo combate) */}
      {selectedEntity && !isMoving && !combatMode && (
        <MovementRangeIndicator entity={selectedEntity} />
      )}

      {/* Indicador de alcance de ataque (quando EM modo combate) */}
      {selectedEntity && combatMode && !isMoving && (
        <AttackRangeIndicator
          entity={selectedEntity}
          attackRange={combatSystem.getAttackRange(selectedEntity)}
        />
      )}

      {/* Linha do personagem ao cursor */}
      {selectedEntity && cursorPosition && !isMoving && (
        <PathLine
          from={selectedEntity.position}
          to={cursorPosition}
          inRange={cursorState.inRange}
          isValid={cursorState.isValid}
        />
      )}

      {/* Indicador de destino (cursor) */}
      {selectedEntity && cursorPosition && !isMoving && (
        <TargetIndicator
          position={cursorPosition}
          inRange={cursorState.inRange}
          isValid={cursorState.isValid}
        />
      )}

      {/* Entidades do store */}
      <EntityList
        entities={entities}
        selectedEntityId={selectedEntityId}
        onSelectEntity={onSelectEntity}
      />

      {/* Efeitos de combate */}
      <CombatEffectsManager
        effects={combatEffects}
        onEffectComplete={removeCombatEffect}
      />

      {/* Indicadores visuais 3D das ações planejadas */}
      <PlannedActionIndicators showEnemyActions={true} />
    </>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

const Game3D: React.FC = () => {
  const controlsRef = useRef<{ reset: () => void }>(null);
  const [moveMessage, setMoveMessage] = useState<string | null>(null);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('planning');
  const [tutorialComplete, setTutorialComplete] = useState(false);

  // Sistema de fases avançado
  const [showPlanningPanel, setShowPlanningPanel] = useState(true);
  const [showActionSelector, setShowActionSelector] = useState(false);
  const [actionSelectorEntity, setActionSelectorEntity] = useState<string | null>(null);

  // Estado do store
  const gridSize = useGameStore((state) => state.gridSize);
  const entities = useGameStore((state) => state.entities);
  const selectedEntityId = useGameStore((state) => state.selectedEntityId);
  const showDebug = useGameStore((state) => state.showDebug);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const combatMode = useGameStore((state) => state.combatMode);
  const targetedEnemyId = useGameStore((state) => state.targetedEnemyId);
  const combatLog = useGameStore((state) => state.combatLog);

  // Ações do store
  const selectEntity = useGameStore((state) => state.selectEntity);
  const cancelMovement = useGameStore((state) => state.cancelMovement);
  const toggleCombatMode = useGameStore((state) => state.toggleCombatMode);
  const setTarget = useGameStore((state) => state.setTarget);
  const addCombatLogs = useGameStore((state) => state.addCombatLogs);
  const addCombatEffects = useGameStore((state) => state.addCombatEffects);
  const applyDamage = useGameStore((state) => state.applyDamage);

  // Encontra entidade selecionada
  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || null;

  // Encontra entidade alvo
  const targetedEntity = entities.find((e) => e.id === targetedEnemyId) || null;

  // Entidades por tipo
  const playerEntities = useMemo(
    () => entities.filter((e) => e.isPlayerControlled),
    [entities]
  );
  const enemyEntities = useMemo(
    () => entities.filter((e) => !e.isPlayerControlled),
    [entities]
  );

  // ==========================================================================
  // CONFIGURAÇÃO DO SISTEMA DE TURNOS
  // ==========================================================================

  // Setup do TimelineManager callbacks
  useEffect(() => {
    // Callback quando fase muda
    timelineManager.setOnPhaseChange((phase) => {
      setTurnPhase(phase);
      useGameStore.getState().setGamePhase(phase as any);

      // Se entrou em fase de planejamento, planeja ações dos inimigos
      if (phase === 'planning') {
        const currentEntities = useGameStore.getState().entities;
        const enemies = currentEntities.filter((e) => !e.isPlayerControlled);
        const players = currentEntities.filter((e) => e.isPlayerControlled);

        // Registra inimigos no sistema de decisão se não estiverem
        enemies.forEach((enemy) => {
          if (!decisionSystem.getState(enemy.id)) {
            decisionSystem.registerEntity(enemy.id);
          }
        });

        // Planeja ações dos inimigos
        if (enemies.length > 0) {
          decisionSystem.planAllEnemyActions(enemies, players);

          // Adiciona ações dos inimigos ao TimelineManager
          const enemyActions = decisionSystem.getPlannedEnemyActions();
          enemyActions.forEach((action, entityId) => {
            timelineManager.planAction(entityId, {
              type: action.type,
              target: action.target,
            });
          });
        }
      }

      // Se entrou em execução, detecta conflitos iniciais
      if (phase === 'execution') {
        const currentEntities = useGameStore.getState().entities;
        const conflicts = timelineManager.detectConflicts(
          currentEntities,
          (a, b) => movementSystem.calculateDistance(a, b)
        );

        // Se detectou conflitos, pausa para o primeiro
        if (conflicts.length > 0) {
          timelineManager.pauseForConflict(conflicts[0]);
        }
      }

      // Se fase finalizada, prepara próximo turno
      if (phase === 'finished') {
        setTimeout(() => {
          timelineManager.nextTurn();
        }, 1000);
      }
    });

    // Callback quando ação é completada
    timelineManager.setOnActionComplete((entityId, action) => {
      const store = useGameStore.getState();
      const entity = store.entities.find((e) => e.id === entityId);

      if (!entity) return;

      // Aplica efeito da ação
      switch (action.type) {
        case 'move':
          if (Array.isArray(action.target)) {
            store.moveEntity(entityId, action.target);
          }
          break;

        case 'attack':
          if (typeof action.target === 'string') {
            const target = store.entities.find((e) => e.id === action.target);
            if (target) {
              const result = combatSystem.executeD20Attack(entity, target);

              // Log
              const logEntries: CombatLogEntry[] = result.logs.map((msg) =>
                createLogEntry(msg, detectLogType(msg))
              );
              store.addCombatLogs(logEntries);

              // Efeitos visuais
              const effects = createCombatEffects(
                entity.position,
                target.position,
                result.damage,
                result.isCritical
              );
              store.addCombatEffects(effects);

              // Aplica dano
              if (result.damage > 0) {
                store.applyDamage(target.id, result.damage);
              }
            }
          }
          break;

        case 'defend':
          // TODO: Implementar efeito de defesa
          break;

        case 'wait':
          // Nada a fazer
          break;
      }
    });

    // Callback quando turno termina
    timelineManager.setOnTurnEnd((turnNumber) => {
      console.log(`[Game3D] Turno ${turnNumber} finalizado`);
    });

    // Inicia primeiro turno
    timelineManager.startTurn();

    return () => {
      // Cleanup (se necessário)
    };
  }, []); // Executa apenas uma vez

  // Handler para reset de câmera
  const handleResetCamera = useCallback(() => {
    if (controlsRef.current?.reset) {
      controlsRef.current.reset();
    }
  }, []);

  // Handler para tentativa de movimento
  const handleMoveAttempt = useCallback((success: boolean, reason?: string) => {
    if (!success && reason) {
      setMoveMessage(reason);
      setTimeout(() => setMoveMessage(null), 2000);
    }
  }, []);

  // Handler para ataque
  const handleAttack = useCallback(() => {
    if (!selectedEntity || !targetedEntity) return;

    // Verifica se pode atacar
    const canAttackResult = combatSystem.canAttack(selectedEntity, targetedEntity);
    if (!canAttackResult.canAttack) {
      setMoveMessage(canAttackResult.reason || 'Não pode atacar');
      setTimeout(() => setMoveMessage(null), 2000);
      return;
    }

    // Executa o ataque
    const result = combatSystem.executeD20Attack(selectedEntity, targetedEntity);

    // Cria entradas de log
    const logEntries: CombatLogEntry[] = result.logs.map((msg) =>
      createLogEntry(msg, detectLogType(msg))
    );
    addCombatLogs(logEntries);

    // Cria efeitos visuais
    const effects = createCombatEffects(
      selectedEntity.position,
      targetedEntity.position,
      result.damage,
      result.isCritical
    );
    addCombatEffects(effects);

    // Aplica dano
    if (result.damage > 0) {
      applyDamage(targetedEntity.id, result.damage);
    }

    // Limpa alvo se morreu
    if (result.defenderDied) {
      setTarget(null);
    }
  }, [selectedEntity, targetedEntity, addCombatLogs, addCombatEffects, applyDamage, setTarget]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const toggleGrid = useGameStore.getState().toggleGrid;
      const toggleDebug = useGameStore.getState().toggleDebug;

      switch (e.key.toLowerCase()) {
        case 'g':
          toggleGrid();
          break;
        case 'd':
          toggleDebug();
          break;
        case 'c':
          toggleCombatMode();
          break;
        case 'escape':
          selectEntity(null);
          cancelMovement();
          setTarget(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectEntity, cancelMovement, toggleCombatMode, setTarget]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-gray-900">
      {/* Canvas 3D */}
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene
            entities={entities}
            selectedEntityId={selectedEntityId}
            onSelectEntity={(id) => {
              // Em modo combate, selecionar outra entidade define como alvo
              if (combatMode && id && id !== selectedEntityId) {
                const entity = entities.find((e) => e.id === id);
                if (entity && !entity.isPlayerControlled) {
                  setTarget(id);
                  return;
                }
              }
              selectEntity(id);
            }}
            gridSize={gridSize}
            controlsRef={controlsRef}
            onMoveAttempt={handleMoveAttempt}
            combatMode={combatMode}
            targetedEnemyId={targetedEnemyId}
            onAttack={handleAttack}
          />
        </Suspense>
      </Canvas>

      {/* ================================================================== */}
      {/* GAME HUD - Interface completa */}
      {/* ================================================================== */}
      <GameHUD onResetCamera={handleResetCamera} />

      {/* Modal de conflito (centralizado, sobrepõe tudo) */}
      <ConflictModalContainer />

      {/* Painel de configurações (lateral) */}
      <SettingsPanel onResetCamera={handleResetCamera} />

      {/* Painel de debug (condicional) */}
      {showDebug && <DebugPanel selectedEntity={selectedEntity} />}

      {/* Mensagem de movimento */}
      {moveMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900 bg-opacity-90 rounded-lg px-4 py-2 text-white animate-pulse z-50">
          {moveMessage}
        </div>
      )}

      {/* Tutorial Overlay (primeira vez) */}
      {!tutorialComplete && (
        <TutorialOverlay onComplete={() => setTutorialComplete(true)} />
      )}

      {/* ================================================================== */}
      {/* SISTEMA DE FASES AVANÇADO */}
      {/* ================================================================== */}

      {/* Painel de Planejamento */}
      {showPlanningPanel && (
        <PlanningPanel
          isOpen={showPlanningPanel}
          onClose={() => setShowPlanningPanel(false)}
        />
      )}

      {/* Seletor de Ações (modal) */}
      {showActionSelector && actionSelectorEntity && (
        <ActionSelector
          isOpen={showActionSelector}
          onClose={() => {
            setShowActionSelector(false);
            setActionSelectorEntity(null);
          }}
          entityId={actionSelectorEntity}
        />
      )}

      {/* Botão toggle para painel de planejamento */}
      {!showPlanningPanel && (
        <button
          onClick={() => setShowPlanningPanel(true)}
          className="absolute top-4 left-4 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg z-40 flex items-center gap-2"
        >
          <span>📋</span>
          <span className="text-sm font-medium">Fases</span>
        </button>
      )}

      {/* ================================================================== */}
      {/* NOVOS COMPONENTES DO PROMPT 9 */}
      {/* ================================================================== */}

      {/* Painel de Percepção */}
      <PerceptionPanel
        isOpen={true}
        onChangeAction={(entityId) => {
          setActionSelectorEntity(entityId);
          setShowActionSelector(true);
        }}
      />

      {/* Timeline de Execução */}
      <ExecutionTimeline isVisible={true} />
    </div>
  );
};

export default Game3D;
