/**
 * =============================================================================
 * PLANNED ACTION INDICATORS - INDICADORES VISUAIS 3D
 * =============================================================================
 *
 * Componentes 3D para visualizar ações planejadas no grid:
 * - Setas de movimento
 * - Linhas de ataque
 * - Áreas de efeito
 * - Indicadores de defesa/espera
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text, Cone, Sphere, Ring } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { ActionType, TurnPhase } from '../systems/PhaseManager';
import type { PlannedAction } from '../systems/PhaseManager';
import type { Entity, Position3D } from '../types';

// =============================================================================
// CONSTANTES
// =============================================================================

const ARROW_HEIGHT = 0.3;
const INDICATOR_OPACITY = 0.8;
const ANIMATION_SPEED = 2;

// Cores por tipo de ação
const ACTION_COLORS: Record<ActionType, string> = {
  [ActionType.MOVE]: '#22c55e',      // Verde
  [ActionType.ATTACK]: '#ef4444',    // Vermelho
  [ActionType.DEFEND]: '#3b82f6',    // Azul
  [ActionType.WAIT]: '#a855f7',      // Roxo
  [ActionType.USE_ITEM]: '#f59e0b',  // Laranja
  [ActionType.SPECIAL]: '#ec4899',   // Rosa
};

// =============================================================================
// SETA DE MOVIMENTO
// =============================================================================

interface MovementArrowProps {
  from: Position3D;
  to: Position3D;
  color?: string;
  isEnemy?: boolean;
}

const MovementArrow: React.FC<MovementArrowProps> = ({
  from,
  to,
  color = ACTION_COLORS[ActionType.MOVE],
  isEnemy = false,
}) => {
  const arrowRef = useRef<THREE.Group>(null);
  const dashOffset = useRef(0);

  // Animação de pulso e dash
  useFrame((_, delta) => {
    if (arrowRef.current) {
      dashOffset.current += delta * ANIMATION_SPEED;
    }
  });

  // Calcula direção e distância
  const direction = useMemo(() => {
    const dir = new THREE.Vector3(
      to[0] - from[0],
      0,
      to[2] - from[2]
    );
    return dir;
  }, [from, to]);

  const distance = direction.length();
  const normalizedDir = direction.clone().normalize();

  // Pontos para a linha tracejada
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = Math.max(Math.floor(distance * 2), 4);

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      pts.push([
        from[0] + direction.x * t,
        ARROW_HEIGHT,
        from[2] + direction.z * t,
      ]);
    }
    return pts;
  }, [from, direction, distance]);

  // Posição da ponta da seta
  const arrowTipPos: [number, number, number] = [
    to[0],
    ARROW_HEIGHT,
    to[2],
  ];

  // Rotação da seta (apontando na direção do movimento)
  const arrowRotation = useMemo(() => {
    const angle = Math.atan2(normalizedDir.x, normalizedDir.z);
    return [Math.PI, angle, 0] as [number, number, number];
  }, [normalizedDir]);

  return (
    <group ref={arrowRef}>
      {/* Linha tracejada */}
      <Line
        points={points}
        color={isEnemy ? '#ef4444' : color}
        lineWidth={3}
        dashed
        dashSize={0.3}
        dashScale={1}
        gapSize={0.15}
        opacity={INDICATOR_OPACITY}
        transparent
      />

      {/* Ponta da seta (cone) */}
      <Cone
        args={[0.15, 0.4, 8]}
        position={arrowTipPos}
        rotation={arrowRotation}
      >
        <meshStandardMaterial
          color={isEnemy ? '#ef4444' : color}
          emissive={isEnemy ? '#ef4444' : color}
          emissiveIntensity={0.5}
          transparent
          opacity={INDICATOR_OPACITY}
        />
      </Cone>

      {/* Círculo no destino */}
      <Ring
        args={[0.3, 0.4, 32]}
        position={[to[0], 0.05, to[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color={isEnemy ? '#ef4444' : color}
          emissive={isEnemy ? '#ef4444' : color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </Ring>
    </group>
  );
};

// =============================================================================
// LINHA DE ATAQUE
// =============================================================================

interface AttackLineProps {
  from: Position3D;
  to: Position3D;
  isEnemy?: boolean;
  timeMs?: number;
}

const AttackLine: React.FC<AttackLineProps> = ({
  from,
  to,
  isEnemy = false,
  timeMs = 500,
}) => {
  const lineRef = useRef<THREE.Group>(null);
  const pulseRef = useRef(0);

  // Animação de pulso
  useFrame((_, delta) => {
    pulseRef.current += delta * 4;
    if (lineRef.current) {
      const scale = 1 + Math.sin(pulseRef.current) * 0.1;
      lineRef.current.scale.setScalar(scale);
    }
  });

  // Pontos da linha
  const points: [number, number, number][] = [
    [from[0], ARROW_HEIGHT + 0.5, from[2]],
    [to[0], ARROW_HEIGHT + 0.5, to[2]],
  ];

  // Ponto médio para o indicador de tempo
  const midPoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    ARROW_HEIGHT + 0.8,
    (from[2] + to[2]) / 2,
  ];

  const color = isEnemy ? '#ef4444' : '#ef4444';

  return (
    <group ref={lineRef}>
      {/* Linha de ataque */}
      <Line
        points={points}
        color={color}
        lineWidth={4}
        opacity={0.9}
        transparent
      />

      {/* Ícone de espada no ponto médio */}
      <Sphere args={[0.12, 16, 16]} position={midPoint}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </Sphere>

      {/* Texto com tempo */}
      <Text
        position={[midPoint[0], midPoint[1] + 0.3, midPoint[2]]}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {`${timeMs}ms`}
      </Text>

      {/* Círculo de alvo */}
      <Ring
        args={[0.4, 0.5, 32]}
        position={[to[0], 0.05, to[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </Ring>
    </group>
  );
};

// =============================================================================
// INDICADOR DE DEFESA
// =============================================================================

interface DefendIndicatorProps {
  position: Position3D;
  entityColor: string;
}

const DefendIndicator: React.FC<DefendIndicatorProps> = ({
  position,
  entityColor,
}) => {
  const shieldRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);

  // Animação de rotação suave
  useFrame((_, delta) => {
    rotationRef.current += delta * 0.5;
    if (shieldRef.current) {
      shieldRef.current.rotation.y = rotationRef.current;
    }
  });

  const color = ACTION_COLORS[ActionType.DEFEND];

  return (
    <group ref={shieldRef} position={[position[0], ARROW_HEIGHT + 0.5, position[2]]}>
      {/* Anel de proteção externo */}
      <Ring args={[0.6, 0.7, 32]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Anel interno */}
      <Ring args={[0.35, 0.45, 32]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </Ring>

      {/* Esfera central */}
      <Sphere args={[0.15, 16, 16]}>
        <meshStandardMaterial
          color={entityColor}
          emissive={entityColor}
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Texto */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.18}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        DEFENDENDO
      </Text>
    </group>
  );
};

// =============================================================================
// INDICADOR DE ESPERA
// =============================================================================

interface WaitIndicatorProps {
  position: Position3D;
  entityColor: string;
}

const WaitIndicator: React.FC<WaitIndicatorProps> = ({
  position,
  entityColor,
}) => {
  const indicatorRef = useRef<THREE.Group>(null);
  const pulseRef = useRef(0);

  // Animação de pulso
  useFrame((_, delta) => {
    pulseRef.current += delta * 2;
    if (indicatorRef.current) {
      const scale = 0.8 + Math.sin(pulseRef.current) * 0.2;
      indicatorRef.current.scale.setScalar(scale);
    }
  });

  const color = ACTION_COLORS[ActionType.WAIT];

  return (
    <group
      ref={indicatorRef}
      position={[position[0], ARROW_HEIGHT + 0.3, position[2]]}
    >
      {/* Círculos concêntricos representando tempo */}
      {[0.3, 0.5, 0.7].map((radius, i) => (
        <Ring
          key={i}
          args={[radius - 0.05, radius, 32]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.4 - i * 0.1}
            side={THREE.DoubleSide}
          />
        </Ring>
      ))}

      {/* Texto */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.18}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        ESPERANDO
      </Text>
    </group>
  );
};

// =============================================================================
// INDICADOR DE ITEM
// =============================================================================

interface ItemIndicatorProps {
  position: Position3D;
}

const ItemIndicator: React.FC<ItemIndicatorProps> = ({ position }) => {
  const indicatorRef = useRef<THREE.Group>(null);
  const bounceRef = useRef(0);

  // Animação de bounce
  useFrame((_, delta) => {
    bounceRef.current += delta * 3;
    if (indicatorRef.current) {
      indicatorRef.current.position.y =
        ARROW_HEIGHT + 0.5 + Math.sin(bounceRef.current) * 0.1;
    }
  });

  const color = ACTION_COLORS[ActionType.USE_ITEM];

  return (
    <group ref={indicatorRef} position={[position[0], ARROW_HEIGHT + 0.5, position[2]]}>
      {/* Cubo representando item */}
      <mesh>
        <boxGeometry args={[0.25, 0.25, 0.25]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Texto */}
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.15}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        USANDO ITEM
      </Text>
    </group>
  );
};

// =============================================================================
// INDICADOR DE HABILIDADE ESPECIAL
// =============================================================================

interface SpecialIndicatorProps {
  position: Position3D;
  targetPosition?: Position3D;
}

const SpecialIndicator: React.FC<SpecialIndicatorProps> = ({
  position,
  targetPosition,
}) => {
  const particlesRef = useRef<THREE.Group>(null);
  const rotationRef = useRef(0);

  // Animação de partículas girando
  useFrame((_, delta) => {
    rotationRef.current += delta * 2;
    if (particlesRef.current) {
      particlesRef.current.rotation.y = rotationRef.current;
    }
  });

  const color = ACTION_COLORS[ActionType.SPECIAL];

  return (
    <group position={[position[0], ARROW_HEIGHT + 0.5, position[2]]}>
      {/* Partículas girando */}
      <group ref={particlesRef}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 0.4;
          const z = Math.sin(angle) * 0.4;
          return (
            <Sphere key={i} args={[0.08, 8, 8]} position={[x, 0, z]}>
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.8}
              />
            </Sphere>
          );
        })}
      </group>

      {/* Centro */}
      <Sphere args={[0.15, 16, 16]}>
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={1}
        />
      </Sphere>

      {/* Linha para alvo se houver */}
      {targetPosition && (
        <Line
          points={[
            [0, 0, 0],
            [
              targetPosition[0] - position[0],
              0,
              targetPosition[2] - position[2],
            ],
          ]}
          color={color}
          lineWidth={2}
          dashed
          dashSize={0.2}
          gapSize={0.1}
          opacity={0.7}
          transparent
        />
      )}
    </group>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface PlannedActionIndicatorsProps {
  showEnemyActions?: boolean;
  opacity?: number;
}

export const PlannedActionIndicators: React.FC<PlannedActionIndicatorsProps> = ({
  showEnemyActions = false,
  opacity = 1,
}) => {
  const entities = useGameStore((state) => state.entities);
  const plannedActions = useGameStore((state) => state.plannedActions);
  const turnPhase = useGameStore((state) => state.turnPhase);
  const perceptionResults = useGameStore((state) => state.perceptionResults);

  // Filtra entidades vivas
  const aliveEntities = useMemo(
    () => entities.filter((e) => e.stats.hp > 0),
    [entities]
  );

  // Ações a mostrar (filtrar baseado em percepção na fase de percepção)
  const visibleActions = useMemo(() => {
    // Na fase de planejamento, mostra só as do jogador
    if (turnPhase === TurnPhase.PLANNING) {
      return plannedActions.filter((action) => {
        const entity = aliveEntities.find((e) => e.id === action.entityId);
        return entity?.isPlayerControlled;
      });
    }

    // Na fase de percepção, mostra as do jogador + inimigos percebidos
    if (turnPhase === TurnPhase.PERCEPTION) {
      const perceivedEnemyIds = new Set(
        perceptionResults.filter((r) => r.success).map((r) => r.targetId)
      );

      return plannedActions.filter((action) => {
        const entity = aliveEntities.find((e) => e.id === action.entityId);
        if (!entity) return false;

        if (entity.isPlayerControlled) return true;
        if (showEnemyActions && perceivedEnemyIds.has(entity.id)) return true;

        return false;
      });
    }

    // Na execução, mostra todas
    if (turnPhase === TurnPhase.EXECUTION) {
      return plannedActions.filter((action) => {
        const entity = aliveEntities.find((e) => e.id === action.entityId);
        return entity && (entity.isPlayerControlled || showEnemyActions);
      });
    }

    return [];
  }, [
    turnPhase,
    plannedActions,
    aliveEntities,
    perceptionResults,
    showEnemyActions,
  ]);

  // Renderiza indicador baseado no tipo de ação
  const renderActionIndicator = (action: PlannedAction, entity: Entity) => {
    const isEnemy = !entity.isPlayerControlled;

    switch (action.type) {
      case ActionType.MOVE:
        if (!action.targetPosition) return null;
        return (
          <MovementArrow
            key={action.id}
            from={entity.position}
            to={action.targetPosition}
            isEnemy={isEnemy}
          />
        );

      case ActionType.ATTACK:
        const target = aliveEntities.find((e) => e.id === action.targetId);
        if (!target) return null;
        return (
          <AttackLine
            key={action.id}
            from={entity.position}
            to={target.position}
            isEnemy={isEnemy}
            timeMs={action.currentTimeMs}
          />
        );

      case ActionType.DEFEND:
        return (
          <DefendIndicator
            key={action.id}
            position={entity.position}
            entityColor={entity.color}
          />
        );

      case ActionType.WAIT:
        return (
          <WaitIndicator
            key={action.id}
            position={entity.position}
            entityColor={entity.color}
          />
        );

      case ActionType.USE_ITEM:
        return <ItemIndicator key={action.id} position={entity.position} />;

      case ActionType.SPECIAL:
        const specialTarget = action.targetId
          ? aliveEntities.find((e) => e.id === action.targetId)
          : null;
        return (
          <SpecialIndicator
            key={action.id}
            position={entity.position}
            targetPosition={specialTarget?.position}
          />
        );

      default:
        return null;
    }
  };

  // Não mostra indicadores fora das fases relevantes
  if (
    turnPhase !== TurnPhase.PLANNING &&
    turnPhase !== TurnPhase.PERCEPTION &&
    turnPhase !== TurnPhase.EXECUTION
  ) {
    return null;
  }

  return (
    <group name="planned-action-indicators">
      {visibleActions.map((action) => {
        const entity = aliveEntities.find((e) => e.id === action.entityId);
        if (!entity) return null;
        return renderActionIndicator(action, entity);
      })}
    </group>
  );
};

export default PlannedActionIndicators;
