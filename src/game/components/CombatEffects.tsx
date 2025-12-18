/**
 * =============================================================================
 * COMBAT EFFECTS - EFEITOS VISUAIS DE COMBATE
 * =============================================================================
 *
 * Efeitos visuais para o sistema de combate:
 * - Linha de ataque (do atacante ao defensor)
 * - Números de dano flutuantes
 * - Efeito de impacto
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { Position3D } from '../types';

// =============================================================================
// LINHA DE ATAQUE
// =============================================================================

interface AttackLineProps {
  /** Posição do atacante */
  from: Position3D;
  /** Posição do defensor */
  to: Position3D;
  /** Cor da linha */
  color?: string;
  /** Duração da animação em ms */
  duration?: number;
  /** Callback quando animação termina */
  onComplete?: () => void;
}

export const AttackLine: React.FC<AttackLineProps> = ({
  from,
  to,
  color = '#ef4444',
  duration = 300,
  onComplete,
}) => {
  const lineRef = useRef<THREE.Line>(null);
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());

  // Geometria da linha
  const lineGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(from[0], 1, from[2]),
      new THREE.Vector3(to[0], 1, to[2]),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [from, to]);

  // Animação
  useFrame(() => {
    const elapsed = Date.now() - startTime.current;
    const newProgress = Math.min(1, elapsed / duration);
    setProgress(newProgress);

    if (newProgress >= 1 && onComplete) {
      onComplete();
    }
  });

  // Opacidade baseada no progresso (fade out)
  const opacity = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;

  return (
    <line ref={lineRef} geometry={lineGeometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        linewidth={3}
      />
    </line>
  );
};

// =============================================================================
// NÚMERO DE DANO FLUTUANTE
// =============================================================================

interface FloatingDamageProps {
  /** Posição inicial */
  position: Position3D;
  /** Valor do dano */
  damage: number;
  /** Se foi crítico */
  isCritical?: boolean;
  /** Duração da animação em ms */
  duration?: number;
  /** Callback quando animação termina */
  onComplete?: () => void;
}

export const FloatingDamage: React.FC<FloatingDamageProps> = ({
  position,
  damage,
  isCritical = false,
  duration = 1500,
  onComplete,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const [visible, setVisible] = useState(true);

  // Animação
  useFrame(() => {
    if (!groupRef.current || !visible) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(1, elapsed / duration);

    // Move para cima
    groupRef.current.position.y = position[1] + 1 + progress * 2;

    // Escala inicial maior para crítico
    const baseScale = isCritical ? 1.5 : 1;
    const scale = baseScale * (1 - progress * 0.5);
    groupRef.current.scale.setScalar(scale);

    if (progress >= 1) {
      setVisible(false);
      if (onComplete) onComplete();
    }
  });

  if (!visible) return null;

  const color = damage === 0 ? '#9ca3af' : isCritical ? '#fbbf24' : '#ef4444';
  const text = damage === 0 ? 'MISS' : `-${damage}`;

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + 1, position[2]]}
    >
      <Html center distanceFactor={10}>
        <div
          className="pointer-events-none select-none"
          style={{
            color,
            fontSize: isCritical ? '28px' : '24px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
          {isCritical && <span className="ml-1">💥</span>}
        </div>
      </Html>
    </group>
  );
};

// =============================================================================
// EFEITO DE IMPACTO
// =============================================================================

interface ImpactEffectProps {
  /** Posição do impacto */
  position: Position3D;
  /** Cor do efeito */
  color?: string;
  /** Duração em ms */
  duration?: number;
  /** Callback quando termina */
  onComplete?: () => void;
}

export const ImpactEffect: React.FC<ImpactEffectProps> = ({
  position,
  color = '#ef4444',
  duration = 400,
  onComplete,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  const [visible, setVisible] = useState(true);

  // Geometria do anel
  const ringGeometry = useMemo(() => {
    return new THREE.RingGeometry(0.1, 0.5, 32);
  }, []);

  // Animação
  useFrame(() => {
    if (!ringRef.current || !visible) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(1, elapsed / duration);

    // Expande o anel
    const scale = 1 + progress * 3;
    ringRef.current.scale.setScalar(scale);

    // Fade out
    const material = ringRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 1 - progress;

    if (progress >= 1) {
      setVisible(false);
      if (onComplete) onComplete();
    }
  });

  if (!visible) return null;

  return (
    <mesh
      ref={ringRef}
      position={[position[0], 0.1, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <primitive object={ringGeometry} attach="geometry" />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// =============================================================================
// GERENCIADOR DE EFEITOS DE COMBATE
// =============================================================================

export interface CombatEffectData {
  id: string;
  type: 'attackLine' | 'floatingDamage' | 'impact';
  from?: Position3D;
  to?: Position3D;
  position?: Position3D;
  damage?: number;
  isCritical?: boolean;
  color?: string;
}

interface CombatEffectsManagerProps {
  /** Lista de efeitos ativos */
  effects: CombatEffectData[];
  /** Callback para remover efeito */
  onEffectComplete?: (id: string) => void;
}

export const CombatEffectsManager: React.FC<CombatEffectsManagerProps> = ({
  effects,
  onEffectComplete,
}) => {
  const handleComplete = (id: string) => {
    if (onEffectComplete) {
      onEffectComplete(id);
    }
  };

  return (
    <group>
      {effects.map((effect) => {
        switch (effect.type) {
          case 'attackLine':
            return effect.from && effect.to ? (
              <AttackLine
                key={effect.id}
                from={effect.from}
                to={effect.to}
                color={effect.color}
                onComplete={() => handleComplete(effect.id)}
              />
            ) : null;

          case 'floatingDamage':
            return effect.position ? (
              <FloatingDamage
                key={effect.id}
                position={effect.position}
                damage={effect.damage ?? 0}
                isCritical={effect.isCritical}
                onComplete={() => handleComplete(effect.id)}
              />
            ) : null;

          case 'impact':
            return effect.position ? (
              <ImpactEffect
                key={effect.id}
                position={effect.position}
                color={effect.color}
                onComplete={() => handleComplete(effect.id)}
              />
            ) : null;

          default:
            return null;
        }
      })}
    </group>
  );
};

// =============================================================================
// UTILITÁRIOS
// =============================================================================

let effectIdCounter = 0;

/**
 * Cria um efeito de combate completo (linha + dano + impacto)
 */
export const createCombatEffects = (
  attackerPos: Position3D,
  defenderPos: Position3D,
  damage: number,
  isCritical: boolean
): CombatEffectData[] => {
  const baseId = `effect_${Date.now()}_${effectIdCounter++}`;

  const effects: CombatEffectData[] = [
    // Linha de ataque
    {
      id: `${baseId}_line`,
      type: 'attackLine',
      from: attackerPos,
      to: defenderPos,
      color: isCritical ? '#fbbf24' : '#ef4444',
    },
    // Impacto no defensor
    {
      id: `${baseId}_impact`,
      type: 'impact',
      position: defenderPos,
      color: isCritical ? '#fbbf24' : '#ef4444',
    },
    // Número de dano
    {
      id: `${baseId}_damage`,
      type: 'floatingDamage',
      position: defenderPos,
      damage,
      isCritical,
    },
  ];

  return effects;
};

export default CombatEffectsManager;
