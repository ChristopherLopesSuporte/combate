/**
 * =============================================================================
 * PATH LINE - LINHA DE CAMINHO
 * =============================================================================
 *
 * Renderiza uma linha pontilhada do personagem até o destino.
 * Cor muda baseado em se o destino está no alcance.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Position3D } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

interface PathLineProps {
  /** Posição de origem */
  from: Position3D;
  /** Posição de destino */
  to: Position3D;
  /** Se está dentro do alcance */
  inRange: boolean;
  /** Se é uma posição válida */
  isValid: boolean;
  /** Altura da linha acima do chão */
  height?: number;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const PathLine: React.FC<PathLineProps> = ({
  from,
  to,
  inRange,
  isValid,
  height = 0.1,
}) => {
  // Determina cor baseado no estado
  const color = useMemo(() => {
    if (!inRange) return '#ef4444'; // Vermelho - fora do alcance
    if (!isValid) return '#f59e0b'; // Amarelo - colisão
    return '#22c55e'; // Verde - válido
  }, [inRange, isValid]);

  // Geometria da linha
  const lineGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(from[0], height, from[2]),
      new THREE.Vector3(to[0], height, to[2]),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [from, to, height]);

  // Cria linha tracejada com múltiplos segmentos
  const dashedLineGeometry = useMemo(() => {
    const start = new THREE.Vector3(from[0], height, from[2]);
    const end = new THREE.Vector3(to[0], height, to[2]);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const dashLength = 0.3;
    const gapLength = 0.15;
    const segmentLength = dashLength + gapLength;
    const numSegments = Math.floor(length / segmentLength);

    const points: THREE.Vector3[] = [];
    direction.normalize();

    for (let i = 0; i < numSegments; i++) {
      const segmentStart = start
        .clone()
        .add(direction.clone().multiplyScalar(i * segmentLength));
      const segmentEnd = segmentStart
        .clone()
        .add(direction.clone().multiplyScalar(dashLength));

      // Garante que não ultrapassa o fim
      if (segmentEnd.distanceTo(start) > length) {
        segmentEnd.copy(end);
      }

      points.push(segmentStart, segmentEnd);
    }

    // Adiciona último segmento até o destino se necessário
    const lastPoint = points[points.length - 1];
    if (lastPoint && lastPoint.distanceTo(end) > gapLength) {
      const remainingStart = lastPoint
        .clone()
        .add(direction.clone().multiplyScalar(gapLength));
      points.push(remainingStart, end);
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [from, to, height]);

  return (
    <group>
      {/* Linha tracejada */}
      <lineSegments geometry={dashedLineGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.7}
        />
      </lineSegments>
    </group>
  );
};

// =============================================================================
// LINHA COM SETA NO FINAL
// =============================================================================

interface PathArrowProps extends PathLineProps {
  /** Tamanho da seta */
  arrowSize?: number;
}

export const PathArrow: React.FC<PathArrowProps> = ({
  from,
  to,
  inRange,
  isValid,
  height = 0.1,
  arrowSize = 0.3,
}) => {
  const color = useMemo(() => {
    if (!inRange) return '#ef4444';
    if (!isValid) return '#f59e0b';
    return '#22c55e';
  }, [inRange, isValid]);

  // Calcula direção e ângulo
  const { arrowGeometry, rotation } = useMemo(() => {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    const angle = Math.atan2(dx, dz);

    // Triângulo da seta
    const shape = new THREE.Shape();
    shape.moveTo(0, arrowSize);
    shape.lineTo(-arrowSize * 0.5, 0);
    shape.lineTo(arrowSize * 0.5, 0);
    shape.lineTo(0, arrowSize);

    const geometry = new THREE.ShapeGeometry(shape);

    return {
      arrowGeometry: geometry,
      rotation: -angle,
    };
  }, [from, to, arrowSize]);

  return (
    <group>
      {/* Linha */}
      <PathLine
        from={from}
        to={to}
        inRange={inRange}
        isValid={isValid}
        height={height}
      />

      {/* Seta no destino */}
      <mesh
        position={[to[0], height + 0.01, to[2]]}
        rotation={[-Math.PI / 2, 0, rotation]}
      >
        <primitive object={arrowGeometry} attach="geometry" />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default PathLine;
