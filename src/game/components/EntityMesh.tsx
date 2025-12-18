/**
 * =============================================================================
 * ENTITY MESH - COMPONENTE VISUAL 3D DE ENTIDADES
 * =============================================================================
 *
 * Componente React Three Fiber para renderizar entidades no mundo 3D.
 * Inclui:
 * - Corpo da entidade (cilindro colorido)
 * - Barra de HP acima
 * - Indicador de seleção (anel)
 * - Interatividade (clique para selecionar)
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Entity as EntityType } from '../types';
import { useGameStore } from '../store/gameStore';

// =============================================================================
// TIPOS
// =============================================================================

interface EntityMeshProps {
  /** Dados da entidade */
  entity: EntityType;
  /** Se a entidade está selecionada */
  isSelected?: boolean;
  /** Callback quando clicada */
  onClick?: () => void;
  /** Mostrar barra de HP */
  showHpBar?: boolean;
  /** Mostrar nome */
  showName?: boolean;
  /** Se está sendo alvo no modo combate */
  isTargeted?: boolean;
}

// =============================================================================
// COMPONENTE DE BARRA DE HP
// =============================================================================

interface HpBarProps {
  hp: number;
  maxHp: number;
  width?: number;
  height?: number;
  yOffset?: number;
}

const HpBar: React.FC<HpBarProps> = ({
  hp,
  maxHp,
  width = 0.8,
  height = 0.1,
  yOffset = 0.3,
}) => {
  const hpPercent = Math.max(0, Math.min(1, hp / maxHp));

  // Cor baseada no HP: verde > amarelo > vermelho
  const color = useMemo(() => {
    if (hpPercent > 0.6) return '#22c55e'; // Verde
    if (hpPercent > 0.3) return '#eab308'; // Amarelo
    return '#ef4444'; // Vermelho
  }, [hpPercent]);

  return (
    <group position={[0, yOffset, 0]}>
      {/* Fundo da barra (cinza escuro) */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>

      {/* Barra de HP atual */}
      <mesh position={[-(width - width * hpPercent) / 2, 0, 0.001]}>
        <planeGeometry args={[width * hpPercent, height * 0.8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Borda da barra */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[width + 0.02, height + 0.02]} />
        <meshBasicMaterial color="#374151" />
      </mesh>
    </group>
  );
};

// =============================================================================
// COMPONENTE DE INDICADOR DE SELEÇÃO
// =============================================================================

interface SelectionRingProps {
  radius: number;
  color?: string;
  animated?: boolean;
}

const SelectionRing: React.FC<SelectionRingProps> = ({
  radius,
  color = '#fbbf24',
  animated = true,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);

  // Animacao de pulsacao
  useFrame((state) => {
    if (ringRef.current && animated) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <ringGeometry args={[radius, radius + 0.1, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// =============================================================================
// COMPONENTE DE INDICADOR DE ALVO (COMBATE)
// =============================================================================

interface TargetIndicatorRingProps {
  radius: number;
}

const TargetIndicatorRing: React.FC<TargetIndicatorRingProps> = ({ radius }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  // Animacao de pulsacao agressiva
  useFrame((state) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
      ringRef.current.scale.set(scale, scale, 1);
    }
    if (innerRef.current) {
      innerRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group>
      {/* Anel externo vermelho pulsante */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[radius + 0.2, radius + 0.35, 32]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Indicador interno giratorio */}
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[radius + 0.05, radius + 0.15, 4]} />
        <meshBasicMaterial
          color="#fca5a5"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// =============================================================================
// COMPONENTE DE INDICADOR DE HOVER
// =============================================================================

interface HoverGlowProps {
  radius: number;
  color: string;
}

const HoverGlow: React.FC<HoverGlowProps> = ({ radius, color }) => {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (glowRef.current) {
      const opacity = 0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <circleGeometry args={[radius + 0.3, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
      />
    </mesh>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL - ENTITY MESH
// =============================================================================

const EntityMesh: React.FC<EntityMeshProps> = ({
  entity,
  isSelected = false,
  onClick,
  showHpBar = true,
  showName = false,
  isTargeted = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Estado de hover
  const [isHovered, setIsHovered] = useState(false);

  // Estado de dano (para animacao de shake)
  const [lastHp, setLastHp] = useState(entity.stats.hp);
  const [damageShake, setDamageShake] = useState(0);
  const [isDying, setIsDying] = useState(false);

  // Estado de movimento suave
  const [currentPos, setCurrentPos] = useState<[number, number, number]>([
    entity.position[0],
    entity.position[1],
    entity.position[2],
  ]);
  const [targetPos, setTargetPos] = useState<[number, number, number]>([
    entity.position[0],
    entity.position[1],
    entity.position[2],
  ]);
  const [isMoving, setIsMoving] = useState(false);
  const [walkCycle, setWalkCycle] = useState(0);

  // Atualiza posição alvo quando a entidade move
  useEffect(() => {
    const newTarget: [number, number, number] = [
      entity.position[0],
      entity.position[1],
      entity.position[2],
    ];

    // Verifica se a posição mudou significativamente
    const dx = Math.abs(newTarget[0] - targetPos[0]);
    const dz = Math.abs(newTarget[2] - targetPos[2]);

    if (dx > 0.01 || dz > 0.01) {
      setTargetPos(newTarget);
      setIsMoving(true);
    }
  }, [entity.position[0], entity.position[1], entity.position[2]]);

  // Detecta dano recebido
  useEffect(() => {
    if (entity.stats.hp < lastHp) {
      // Recebeu dano!
      setDamageShake(1);
      setTimeout(() => setDamageShake(0), 300);

      // Se morreu, inicia animacao de morte
      if (entity.stats.hp <= 0) {
        setIsDying(true);
      }
    }
    setLastHp(entity.stats.hp);
  }, [entity.stats.hp, lastHp]);

  // Animacao principal
  useFrame((state, delta) => {
    // Rotacao quando selecionado
    if (meshRef.current && isSelected) {
      meshRef.current.rotation.y += 0.01;
    }
    if (headRef.current && isSelected) {
      headRef.current.rotation.y += 0.01;
    }

    // Movimento suave (interpolação)
    if (groupRef.current && isMoving && !isDying) {
      const speed = 5; // Velocidade de movimento
      const lerpFactor = Math.min(1, delta * speed);

      // Interpola posição atual para posição alvo
      const newX = currentPos[0] + (targetPos[0] - currentPos[0]) * lerpFactor;
      const newZ = currentPos[2] + (targetPos[2] - currentPos[2]) * lerpFactor;

      // Verifica se chegou perto o suficiente do destino
      const distanceToTarget = Math.sqrt(
        Math.pow(targetPos[0] - newX, 2) + Math.pow(targetPos[2] - newZ, 2)
      );

      if (distanceToTarget < 0.05) {
        // Chegou ao destino
        setCurrentPos([targetPos[0], targetPos[1], targetPos[2]]);
        setIsMoving(false);
        setWalkCycle(0);
        groupRef.current.position.x = targetPos[0];
        groupRef.current.position.z = targetPos[2];
      } else {
        // Ainda movendo
        setCurrentPos([newX, currentPos[1], newZ]);
        groupRef.current.position.x = newX;
        groupRef.current.position.z = newZ;

        // Animação de caminhada (balanço)
        setWalkCycle((prev) => prev + delta * 10);

        // Rotaciona para a direção do movimento
        const angle = Math.atan2(targetPos[2] - currentPos[2], targetPos[0] - currentPos[0]);
        if (meshRef.current) {
          meshRef.current.rotation.y = -angle + Math.PI / 2;
        }
        if (headRef.current) {
          headRef.current.rotation.y = -angle + Math.PI / 2;
        }
      }
    }

    // Shake quando recebe dano (sobrescreve movimento suave)
    if (groupRef.current && damageShake > 0) {
      const shakeIntensity = damageShake * 0.1;
      const baseX = isMoving ? currentPos[0] : entity.position[0];
      const baseZ = isMoving ? currentPos[2] : entity.position[2];
      groupRef.current.position.x = baseX + (Math.random() - 0.5) * shakeIntensity;
      groupRef.current.position.z = baseZ + (Math.random() - 0.5) * shakeIntensity;
      setDamageShake((prev) => Math.max(0, prev - delta * 5));
    } else if (groupRef.current && damageShake === 0 && !isMoving && !isDying) {
      // Reset position quando parado e não está morrendo
      groupRef.current.position.x = entity.position[0];
      groupRef.current.position.z = entity.position[2];
    }

    // Animacao de morte (afundando no chao)
    if (groupRef.current && isDying) {
      if (groupRef.current.position.y > -2) {
        groupRef.current.position.y -= delta * 2;
        groupRef.current.rotation.x = Math.min(Math.PI / 4, groupRef.current.rotation.x + delta);
      }
    }

    // Animação de balanço durante caminhada
    if (groupRef.current && isMoving && !isDying) {
      const bobAmount = Math.sin(walkCycle) * 0.05;
      groupRef.current.position.y = bobAmount;
    }
  });

  // Calcula altura do corpo (cilindro)
  const bodyHeight = entity.size * 0.6;
  const bodyRadius = entity.radius;

  // Posicao Y do corpo (metade da altura + pequeno offset)
  const bodyY = bodyHeight / 2 + 0.1;

  // Posicao da barra de HP (acima do corpo)
  const hpBarY = entity.size + 0.2;

  // Cor com emissao baseada no estado
  const emissiveIntensity = useMemo(() => {
    if (isTargeted) return 0.5;
    if (isSelected) return 0.3;
    if (isHovered) return 0.15;
    return 0;
  }, [isSelected, isHovered, isTargeted]);

  // Cor do emissive
  const emissiveColor = isTargeted ? '#ff0000' : entity.color;

  // Handlers de hover
  const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = 'default';
  };

  // Nao renderiza se morto e ja afundou
  if (isDying && groupRef.current && groupRef.current.position.y <= -2) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      position={entity.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Indicador de hover */}
      {isHovered && !isSelected && !isTargeted && (
        <HoverGlow radius={bodyRadius} color={entity.color} />
      )}

      {/* Corpo da entidade (cilindro) */}
      <mesh
        ref={meshRef}
        position={[0, bodyY, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[bodyRadius, bodyRadius * 0.8, bodyHeight, 16]} />
        <meshStandardMaterial
          color={entity.color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.7}
          metalness={0.1}
          transparent={isDying}
          opacity={isDying ? 0.5 : 1}
        />
      </mesh>

      {/* Cabeca (esfera) */}
      <mesh
        ref={headRef}
        position={[0, bodyY + bodyHeight / 2 + bodyRadius * 0.4, 0]}
        castShadow
      >
        <sphereGeometry args={[bodyRadius * 0.5, 16, 16]} />
        <meshStandardMaterial
          color={entity.color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.7}
          metalness={0.1}
          transparent={isDying}
          opacity={isDying ? 0.5 : 1}
        />
      </mesh>

      {/* Base (para melhor visualizacao) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[bodyRadius * 0.9, 16]} />
        <meshBasicMaterial
          color={entity.color}
          transparent
          opacity={isHovered ? 0.5 : 0.3}
        />
      </mesh>

      {/* Indicador de selecao */}
      {isSelected && (
        <SelectionRing radius={entity.radius + 0.2} />
      )}

      {/* Indicador de alvo (modo combate) */}
      {isTargeted && (
        <TargetIndicatorRing radius={entity.radius} />
      )}

      {/* Barra de HP */}
      {showHpBar && (
        <HpBar
          hp={entity.stats.hp}
          maxHp={entity.stats.maxHp}
          yOffset={hpBarY}
        />
      )}

      {/* Indicador de controle do jogador */}
      {entity.isPlayerControlled && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[bodyRadius + 0.05, bodyRadius + 0.12, 32]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Indicador de dano (flash vermelho) */}
      {damageShake > 0 && (
        <mesh position={[0, bodyY, 0]}>
          <cylinderGeometry args={[bodyRadius + 0.1, bodyRadius * 0.8 + 0.1, bodyHeight + 0.1, 16]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={damageShake * 0.5}
          />
        </mesh>
      )}
    </group>
  );
};

// =============================================================================
// COMPONENTE DE LISTA DE ENTIDADES
// =============================================================================

interface EntityListProps {
  entities: EntityType[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
}

export const EntityList: React.FC<EntityListProps> = ({
  entities,
  selectedEntityId,
  onSelectEntity,
}) => {
  // Pega estado do store
  const targetedEnemyId = useGameStore((state) => state.targetedEnemyId);
  const actionMode = useGameStore((state) => state.actionMode);
  const setActionMode = useGameStore((state) => state.setActionMode);
  const planAction = useGameStore((state) => state.planAction);

  // Handler de clique em entidade
  const handleEntityClick = (clickedEntity: EntityType) => {
    const selectedEntity = entities.find(e => e.id === selectedEntityId);

    // Se está no modo ATAQUE e clicou em entidade do lado oposto
    if (actionMode === 'attack' && selectedEntity) {
      const isOpponent = selectedEntity.isPlayerControlled !== clickedEntity.isPlayerControlled;

      if (isOpponent && clickedEntity.stats.hp > 0) {
        console.log('[EntityList] Planejando ataque:', {
          attackerId: selectedEntity.id,
          attackerName: selectedEntity.name,
          targetId: clickedEntity.id,
          targetName: clickedEntity.name,
        });

        // Cria ação de ataque
        planAction(selectedEntity.id, 'attack' as any, {
          targetId: clickedEntity.id,
          baseTimeMs: 500,
        });

        // Reseta modo de ação
        setActionMode('none');
        return;
      }
    }

    // Caso contrário, apenas seleciona a entidade clicada
    onSelectEntity(clickedEntity.id);
    // Reseta modo de ação ao trocar seleção
    setActionMode('none');
  };

  return (
    <>
      {entities.map((entity) => {
        const selectedEntity = entities.find(e => e.id === selectedEntityId);
        // Destaca entidades que podem ser atacadas no modo ataque
        const isValidTarget = actionMode === 'attack' &&
          selectedEntity &&
          selectedEntity.isPlayerControlled !== entity.isPlayerControlled &&
          entity.stats.hp > 0;

        return (
          <EntityMesh
            key={entity.id}
            entity={entity}
            isSelected={entity.id === selectedEntityId}
            isTargeted={entity.id === targetedEnemyId || isValidTarget}
            onClick={() => handleEntityClick(entity)}
          />
        );
      })}
    </>
  );
};

export default EntityMesh;
