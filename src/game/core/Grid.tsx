/**
 * =============================================================================
 * GRID - SISTEMA DE TABULEIRO 3D CONFIGURÁVEL
 * =============================================================================
 *
 * Componente visual do grid/tabuleiro do jogo.
 * Suporta dois modos de visualização:
 * - Quadrados: Grid visível com células grandes (ex: 1m x 1m)
 * - Metros: Grid muito pequeno/invisível para movimento livre
 */

import React, { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import * as THREE from 'three';
import type { GridMode } from '../types';

// =============================================================================
// CONFIGURAÇÕES DE MODO DO GRID
// =============================================================================

interface GridModeConfig {
  /** Tamanho da célula em metros */
  cellSize: number;
  /** Cor das linhas principais */
  lineColor: string;
  /** Cor das linhas secundárias */
  subLineColor: string;
  /** Opacidade das linhas */
  opacity: number;
  /** Mostrar subdivisions */
  showSubdivisions: boolean;
  /** Divisões por célula */
  subdivisions: number;
}

const GRID_MODE_CONFIGS: Record<GridMode, GridModeConfig> = {
  squares: {
    cellSize: 1,
    lineColor: '#22c55e', // Verde
    subLineColor: '#166534',
    opacity: 0.6,
    showSubdivisions: false,
    subdivisions: 1,
  },
  meters: {
    cellSize: 0.25, // Células pequenas de 25cm
    lineColor: '#3b82f6', // Azul
    subLineColor: '#1e40af',
    opacity: 0.3,
    showSubdivisions: true,
    subdivisions: 4,
  },
  hexagonal: {
    cellSize: 1,
    lineColor: '#a855f7', // Roxo
    subLineColor: '#6b21a8',
    opacity: 0.5,
    showSubdivisions: false,
    subdivisions: 1,
  },
};

// =============================================================================
// COMPONENTE DE PLANO DO CHÃO
// =============================================================================

interface GroundPlaneProps {
  /** Tamanho do plano em metros */
  size: number;
  /** Cor do plano */
  color?: string;
}

/**
 * Plano do chão que serve como base do tabuleiro
 */
export const GroundPlane: React.FC<GroundPlaneProps> = ({
  size,
  color = '#1a1a2e',
}) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[size / 2, -0.01, size / 2]}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
};

// =============================================================================
// COMPONENTE DE LINHAS DO GRID
// =============================================================================

interface GridLinesProps {
  /** Tamanho do grid em metros */
  size: number;
  /** Configuração do modo */
  config: GridModeConfig;
}

/**
 * Linhas do grid para visualização do tabuleiro
 * Usa useMemo para otimizar performance
 */
export const GridLines: React.FC<GridLinesProps> = ({
  size,
  config,
}) => {
  // Cria geometria das linhas principais usando useMemo para performance
  const mainGridLines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const { cellSize } = config;
    const divisions = Math.floor(size / cellSize);

    // Linhas horizontais (ao longo do eixo X)
    for (let i = 0; i <= divisions; i++) {
      const z = i * cellSize;
      points.push(new THREE.Vector3(0, 0, z));
      points.push(new THREE.Vector3(size, 0, z));
    }

    // Linhas verticais (ao longo do eixo Z)
    for (let i = 0; i <= divisions; i++) {
      const x = i * cellSize;
      points.push(new THREE.Vector3(x, 0, 0));
      points.push(new THREE.Vector3(x, 0, size));
    }

    return points;
  }, [size, config.cellSize]);

  // Cria geometria do buffer para linhas principais
  const mainGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(mainGridLines);
    return geo;
  }, [mainGridLines]);

  // Cria linhas de subdivisão se necessário
  const subGridLines = useMemo(() => {
    if (!config.showSubdivisions || config.subdivisions <= 1) return null;

    const points: THREE.Vector3[] = [];
    const subCellSize = config.cellSize / config.subdivisions;
    const divisions = Math.floor(size / subCellSize);

    for (let i = 0; i <= divisions; i++) {
      // Pula linhas que coincidem com as principais
      if (i % config.subdivisions === 0) continue;

      const pos = i * subCellSize;

      // Horizontal
      points.push(new THREE.Vector3(0, 0, pos));
      points.push(new THREE.Vector3(size, 0, pos));

      // Vertical
      points.push(new THREE.Vector3(pos, 0, 0));
      points.push(new THREE.Vector3(pos, 0, size));
    }

    return points;
  }, [size, config]);

  const subGeometry = useMemo(() => {
    if (!subGridLines) return null;
    return new THREE.BufferGeometry().setFromPoints(subGridLines);
  }, [subGridLines]);

  return (
    <group>
      {/* Linhas principais */}
      <lineSegments geometry={mainGeometry} position={[0, 0.01, 0]}>
        <lineBasicMaterial
          color={config.lineColor}
          transparent
          opacity={config.opacity}
        />
      </lineSegments>

      {/* Linhas de subdivisão */}
      {subGeometry && (
        <lineSegments geometry={subGeometry} position={[0, 0.005, 0]}>
          <lineBasicMaterial
            color={config.subLineColor}
            transparent
            opacity={config.opacity * 0.5}
          />
        </lineSegments>
      )}
    </group>
  );
};

// =============================================================================
// COMPONENTE DE BORDA DO GRID
// =============================================================================

interface GridBorderProps {
  size: number;
  color?: string;
}

/**
 * Borda visual ao redor do grid
 */
export const GridBorder: React.FC<GridBorderProps> = ({
  size,
  color = '#fbbf24', // Amarelo
}) => {
  const borderGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(size, 0, 0),
      new THREE.Vector3(size, 0, size),
      new THREE.Vector3(0, 0, size),
      new THREE.Vector3(0, 0, 0), // Fecha o quadrado
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [size]);

  return (
    <line geometry={borderGeometry} position={[0, 0.02, 0]}>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
};

// =============================================================================
// COMPONENTE DE INDICADOR DE CÉLULA (HOVER)
// =============================================================================

interface CellHighlightProps {
  /** Posição X no grid */
  gridX: number;
  /** Posição Z no grid */
  gridZ: number;
  /** Tamanho da célula */
  cellSize: number;
  /** Cor do highlight */
  color?: string;
  /** Opacidade */
  opacity?: number;
}

/**
 * Highlight visual de uma célula do grid
 */
export const CellHighlight: React.FC<CellHighlightProps> = ({
  gridX,
  gridZ,
  cellSize,
  color = '#22c55e',
  opacity = 0.3,
}) => {
  const position: [number, number, number] = [
    gridX * cellSize + cellSize / 2,
    0.02,
    gridZ * cellSize + cellSize / 2,
  ];

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[cellSize * 0.95, cellSize * 0.95]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL DO GRID
// =============================================================================

interface GridProps {
  /** Override do tamanho (opcional, usa store por padrão) */
  size?: number;
  /** Override do modo (opcional, usa store por padrão) */
  mode?: GridMode;
  /** Override de visibilidade (opcional, usa store por padrão) */
  visible?: boolean;
}

/**
 * Grid completo do jogo
 * Inclui plano do chão, linhas de grade e borda
 * Conecta-se ao Zustand store para configurações reativas
 */
const Grid: React.FC<GridProps> = ({ size, mode, visible }) => {
  // Obtém configurações do store
  const gridSize = useGameStore((state) => state.gridSize);
  const showGrid = useGameStore((state) => state.showGrid);
  const gridMode = useGameStore((state) => state.gridMode);

  // Usa props ou valores do store
  const finalSize = size ?? gridSize;
  const finalMode = mode ?? gridMode;
  const finalVisible = visible ?? showGrid;

  // Obtém configuração do modo
  const config = GRID_MODE_CONFIGS[finalMode];

  return (
    <group name="grid-system">
      {/* Plano do chão - sempre visível */}
      <GroundPlane size={finalSize} />

      {/* Linhas do grid - condicionais */}
      {finalVisible && (
        <>
          <GridLines size={finalSize} config={config} />
          <GridBorder size={finalSize} />
        </>
      )}
    </group>
  );
};

export default Grid;

// =============================================================================
// EXPORTS ADICIONAIS
// =============================================================================

export { GRID_MODE_CONFIGS };
export type { GridModeConfig, GridProps };
