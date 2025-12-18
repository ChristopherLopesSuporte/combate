/**
 * =============================================================================
 * MOVEMENT RANGE INDICATOR - INDICADOR DE ALCANCE DE MOVIMENTO
 * =============================================================================
 *
 * Renderiza um círculo semi-transparente no chão mostrando o alcance
 * de movimento da entidade selecionada.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Entity } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

interface MovementRangeIndicatorProps {
  /** Entidade selecionada */
  entity: Entity;
  /** Cor do círculo (padrão: verde) */
  color?: string;
  /** Opacidade do círculo */
  opacity?: number;
  /** Mostrar borda */
  showBorder?: boolean;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const MovementRangeIndicator: React.FC<MovementRangeIndicatorProps> = ({
  entity,
  color = '#22c55e',
  opacity = 0.15,
  showBorder = true,
}) => {
  // Raio = velocidade da entidade (metros por turno)
  const radius = entity.stats.speed || 5;
  const position = entity.position;

  // Geometria do círculo preenchido
  const circleGeometry = useMemo(() => {
    return new THREE.CircleGeometry(radius, 64);
  }, [radius]);

  // Geometria da borda do círculo
  const borderGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 64;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          0,
          Math.sin(theta) * radius
        )
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <group position={[position[0], 0.02, position[2]]}>
      {/* Círculo preenchido */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={circleGeometry} attach="geometry" />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Borda do círculo */}
      {showBorder && (
        <line geometry={borderGeometry}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={opacity * 3}
            linewidth={2}
          />
        </line>
      )}
    </group>
  );
};

// =============================================================================
// COMPONENTE DE ALCANCE ANIMADO (PULSO)
// =============================================================================

interface AnimatedRangeIndicatorProps extends MovementRangeIndicatorProps {
  /** Velocidade da animação de pulso */
  pulseSpeed?: number;
}

export const AnimatedRangeIndicator: React.FC<AnimatedRangeIndicatorProps> = ({
  entity,
  color = '#22c55e',
  opacity = 0.15,
  showBorder = true,
}) => {
  const radius = entity.stats.speed || 5;
  const position = entity.position;

  // Geometria do círculo preenchido
  const circleGeometry = useMemo(() => {
    return new THREE.CircleGeometry(radius, 64);
  }, [radius]);

  // Geometria da borda
  const borderGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 64;

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * radius,
          0,
          Math.sin(theta) * radius
        )
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <group position={[position[0], 0.02, position[2]]}>
      {/* Círculo preenchido */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={circleGeometry} attach="geometry" />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Borda do círculo */}
      {showBorder && (
        <line geometry={borderGeometry}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={opacity * 3}
          />
        </line>
      )}
    </group>
  );
};

export default MovementRangeIndicator;
