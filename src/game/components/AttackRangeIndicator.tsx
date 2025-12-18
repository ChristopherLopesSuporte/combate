/**
 * =============================================================================
 * ATTACK RANGE INDICATOR - INDICADOR DE ALCANCE DE ATAQUE
 * =============================================================================
 *
 * Renderiza um círculo vermelho semi-transparente no chão mostrando o alcance
 * de ataque da entidade selecionada quando em modo de combate.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Entity } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

interface AttackRangeIndicatorProps {
  /** Entidade selecionada */
  entity: Entity;
  /** Alcance de ataque em metros */
  attackRange?: number;
  /** Cor do círculo (padrão: vermelho) */
  color?: string;
  /** Opacidade do círculo */
  opacity?: number;
  /** Mostrar borda */
  showBorder?: boolean;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const AttackRangeIndicator: React.FC<AttackRangeIndicatorProps> = ({
  entity,
  attackRange = 2.0,
  color = '#ef4444',
  opacity = 0.15,
  showBorder = true,
}) => {
  // Raio efetivo = alcance de ataque + raio da entidade
  const radius = attackRange + entity.radius;
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
    <group position={[position[0], 0.025, position[2]]}>
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
// INDICADOR DE ALCANCE COM ALVO
// =============================================================================

interface AttackRangeWithTargetProps extends AttackRangeIndicatorProps {
  /** Entidade alvo */
  target: Entity | null;
}

export const AttackRangeWithTarget: React.FC<AttackRangeWithTargetProps> = ({
  entity,
  target,
  attackRange = 2.0,
  color = '#ef4444',
  opacity = 0.15,
  showBorder = true,
}) => {
  const radius = attackRange + entity.radius;
  const position = entity.position;

  // Calcula se o alvo está no alcance
  const isTargetInRange = useMemo(() => {
    if (!target) return false;
    const dx = target.position[0] - entity.position[0];
    const dz = target.position[2] - entity.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= attackRange + entity.radius + target.radius;
  }, [entity, target, attackRange]);

  // Cor muda baseado se alvo está no alcance
  const indicatorColor = useMemo(() => {
    if (!target) return color;
    return isTargetInRange ? '#22c55e' : '#ef4444'; // Verde se no alcance, vermelho se fora
  }, [target, isTargetInRange, color]);

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

  // Linha até o alvo
  const lineToTargetGeometry = useMemo(() => {
    if (!target) return null;
    const points = [
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(
        target.position[0] - position[0],
        0.05,
        target.position[2] - position[2]
      ),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [target, position]);

  return (
    <group position={[position[0], 0.025, position[2]]}>
      {/* Círculo preenchido */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={circleGeometry} attach="geometry" />
        <meshBasicMaterial
          color={indicatorColor}
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
            color={indicatorColor}
            transparent
            opacity={opacity * 3}
          />
        </line>
      )}

      {/* Linha até o alvo */}
      {lineToTargetGeometry && (
        <line geometry={lineToTargetGeometry}>
          <lineBasicMaterial
            color={indicatorColor}
            transparent
            opacity={0.6}
          />
        </line>
      )}
    </group>
  );
};

export default AttackRangeIndicator;
