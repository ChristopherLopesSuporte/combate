/**
 * =============================================================================
 * TARGET INDICATOR - INDICADOR DE DESTINO
 * =============================================================================
 *
 * Mostra onde o mouse está apontando no grid.
 * Muda de cor baseado em se o destino está dentro do alcance.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Position3D } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

interface TargetIndicatorProps {
  /** Posição do cursor no grid */
  position: Position3D;
  /** Se a posição está dentro do alcance */
  inRange: boolean;
  /** Se a posição é válida (sem colisões) */
  isValid: boolean;
  /** Tamanho do indicador */
  size?: number;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const TargetIndicator: React.FC<TargetIndicatorProps> = ({
  position,
  inRange,
  isValid,
  size = 0.3,
}) => {
  // Determina cor baseado no estado
  const color = useMemo(() => {
    if (!inRange) return '#ef4444'; // Vermelho - fora do alcance
    if (!isValid) return '#f59e0b'; // Amarelo - colisão
    return '#22c55e'; // Verde - válido
  }, [inRange, isValid]);

  // Geometria do círculo do indicador
  const circleGeometry = useMemo(() => {
    return new THREE.RingGeometry(size * 0.6, size, 32);
  }, [size]);

  // Geometria da cruz central
  const crossGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const crossSize = size * 0.4;

    // Linha horizontal
    points.push(new THREE.Vector3(-crossSize, 0, 0));
    points.push(new THREE.Vector3(crossSize, 0, 0));
    // Linha vertical
    points.push(new THREE.Vector3(0, 0, -crossSize));
    points.push(new THREE.Vector3(0, 0, crossSize));

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [size]);

  return (
    <group position={[position[0], 0.03, position[2]]}>
      {/* Anel externo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={circleGeometry} attach="geometry" />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Cruz central */}
      <lineSegments geometry={crossGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.9} />
      </lineSegments>

      {/* Ponto central */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.15, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// =============================================================================
// INDICADOR DE DESTINO COM PREVIEW DE ENTIDADE
// =============================================================================

interface TargetPreviewProps extends TargetIndicatorProps {
  /** Raio da entidade (para preview de ocupação) */
  entityRadius?: number;
}

export const TargetPreview: React.FC<TargetPreviewProps> = ({
  position,
  inRange,
  isValid,
  size = 0.3,
  entityRadius = 0.5,
}) => {
  const color = useMemo(() => {
    if (!inRange) return '#ef4444';
    if (!isValid) return '#f59e0b';
    return '#22c55e';
  }, [inRange, isValid]);

  // Preview do raio de ocupação
  const occupancyGeometry = useMemo(() => {
    return new THREE.RingGeometry(entityRadius * 0.9, entityRadius, 32);
  }, [entityRadius]);

  return (
    <group position={[position[0], 0.03, position[2]]}>
      {/* Preview da ocupação da entidade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={occupancyGeometry} attach="geometry" />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Indicador central */}
      <TargetIndicator
        position={[0, 0, 0]}
        inRange={inRange}
        isValid={isValid}
        size={size}
      />
    </group>
  );
};

export default TargetIndicator;
