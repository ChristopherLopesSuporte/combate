/**
 * =============================================================================
 * GRID CLICK HANDLER - MANIPULADOR DE CLIQUES NO GRID
 * =============================================================================
 *
 * Plano invisível que detecta cliques e hover no grid.
 * Comunica com o store para atualizar cursor e executar movimento.
 */

import React, { useCallback, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, selectSelectedEntity } from '../store/gameStore';
import { movementSystem } from '../systems/MovementSystem';
import { TurnPhase, ActionType } from '../systems/PhaseManager';
import type { Position3D } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

interface GridClickHandlerProps {
  /** Tamanho do grid */
  gridSize: number;
  /** Callback quando movimento é tentado */
  onMoveAttempt?: (success: boolean, reason?: string) => void;
  /** Habilitar hover */
  enableHover?: boolean;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const GridClickHandler: React.FC<GridClickHandlerProps> = ({
  gridSize,
  onMoveAttempt,
  enableHover = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Estado do store
  const selectedEntity = useGameStore(selectSelectedEntity);
  const isMoving = useGameStore((state) => state.isMoving);
  const turnPhase = useGameStore((state) => state.turnPhase);
  const actionMode = useGameStore((state) => state.actionMode);
  const setActionMode = useGameStore((state) => state.setActionMode);
  const setCursorPosition = useGameStore((state) => state.setCursorPosition);
  const startMovement = useGameStore((state) => state.startMovement);
  const completeMovement = useGameStore((state) => state.completeMovement);
  const planAction = useGameStore((state) => state.planAction);

  // Handler de clique no grid
  const handleClick = useCallback(
    (event: THREE.Event & { point?: THREE.Vector3 }) => {
      console.log('[GridClickHandler] Clique detectado!', {
        hasSelectedEntity: !!selectedEntity,
        isMoving,
        hasPoint: !!event.point,
        point: event.point ? { x: event.point.x, y: event.point.y, z: event.point.z } : null,
        turnPhase,
        actionMode,
      });

      if (!selectedEntity || isMoving) {
        console.log('[GridClickHandler] Bloqueado: sem entidade ou movendo');
        return;
      }
      if (!event.point) {
        console.log('[GridClickHandler] Bloqueado: sem point no evento');
        return;
      }

      // Só permite mover se estiver no modo MOVE
      if (actionMode !== 'move') {
        console.log('[GridClickHandler] Bloqueado: não está no modo mover');
        return;
      }

      event.stopPropagation?.();

      const targetPosition: Position3D = [
        Math.round(event.point.x),
        0,
        Math.round(event.point.z),
      ];

      console.log('[GridClickHandler] Posição alvo calculada:', targetPosition);

      // Se está na fase de PLANEJAMENTO, registra ação de movimento
      if (turnPhase === TurnPhase.PLANNING) {
        console.log('[GridClickHandler] Planejando movimento:', {
          entityId: selectedEntity.id,
          entityName: selectedEntity.name,
          from: selectedEntity.position,
          to: targetPosition,
        });

        // Planeja a ação de movimento (não move ainda!)
        planAction(selectedEntity.id, ActionType.MOVE, {
          targetPosition,
          baseTimeMs: 500, // Tempo base para movimento
        });

        // Reseta modo de ação
        setActionMode('none');
        onMoveAttempt?.(true);
        return;
      }

      // Fora da fase de planejamento, movimento direto (comportamento antigo)
      const result = movementSystem.tryMoveEntity(selectedEntity, targetPosition);

      if (result.success) {
        // Inicia animação de movimento
        startMovement(selectedEntity.id, targetPosition);

        // Completa movimento após delay (animação simples)
        setTimeout(() => {
          completeMovement();
        }, 300);

        onMoveAttempt?.(true);
      } else {
        onMoveAttempt?.(false, result.reason);
      }
    },
    [selectedEntity, isMoving, turnPhase, actionMode, setActionMode, startMovement, completeMovement, planAction, onMoveAttempt]
  );

  // Handler de hover
  const handlePointerMove = useCallback(
    (event: THREE.Event & { point?: THREE.Vector3 }) => {
      if (!enableHover || !selectedEntity) {
        setCursorPosition(null);
        return;
      }
      if (!event.point) return;

      const cursorPos: Position3D = [
        event.point.x,
        0,
        event.point.z,
      ];

      setCursorPosition(cursorPos);
    },
    [enableHover, selectedEntity, setCursorPosition]
  );

  // Handler quando mouse sai do grid
  const handlePointerLeave = useCallback(() => {
    setCursorPosition(null);
  }, [setCursorPosition]);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[gridSize / 2, 0.001, gridSize / 2]}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <planeGeometry args={[gridSize, gridSize]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default GridClickHandler;
