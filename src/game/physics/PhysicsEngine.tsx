/**
 * =============================================================================
 * PHYSICS ENGINE - MOTOR DE FÍSICA
 * =============================================================================
 *
 * Componente React que configura o motor de física usando @react-three/rapier.
 * Gerencia colisões, gravidade e simulação física do mundo 3D.
 *
 * TODO: Fase 3 - Implementar física completa
 */

import React from 'react';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';

// =============================================================================
// TIPOS
// =============================================================================

interface PhysicsEngineProps {
  children: React.ReactNode;
  gravity?: [number, number, number];
  debug?: boolean;
  paused?: boolean;
}

interface PhysicsBodyProps {
  children: React.ReactNode;
  position?: [number, number, number];
  type?: 'fixed' | 'dynamic' | 'kinematicPosition' | 'kinematicVelocity';
  colliderType?: 'cuboid' | 'ball' | 'capsule';
  colliderArgs?: number[];
  mass?: number;
  friction?: number;
  restitution?: number;
  onCollision?: (other: string) => void;
}

// =============================================================================
// CONSTANTES DE FÍSICA
// =============================================================================

/** Gravidade padrão (Terra) */
export const DEFAULT_GRAVITY: [number, number, number] = [0, -9.81, 0];

/** Gravidade reduzida (para gameplay mais fluido) */
export const REDUCED_GRAVITY: [number, number, number] = [0, -6.0, 0];

/** Sem gravidade */
export const ZERO_GRAVITY: [number, number, number] = [0, 0, 0];

// =============================================================================
// COMPONENTE PHYSICS ENGINE
// =============================================================================

/**
 * Wrapper do motor de física Rapier
 * Envolve toda a cena 3D que precisa de física
 */
export const PhysicsEngine: React.FC<PhysicsEngineProps> = ({
  children,
  gravity = REDUCED_GRAVITY,
  debug = false,
  paused = false,
}) => {
  return (
    <Physics
      gravity={gravity}
      debug={debug}
      paused={paused}
      timeStep="vary"
      updatePriority={-50}
    >
      {children}
    </Physics>
  );
};

// =============================================================================
// COMPONENTE PHYSICS BODY
// =============================================================================

/**
 * Wrapper para adicionar física a um objeto 3D
 */
export const PhysicsBody: React.FC<PhysicsBodyProps> = ({
  children,
  position = [0, 0, 0],
  type = 'dynamic',
  colliderType = 'cuboid',
  colliderArgs = [0.5, 0.5, 0.5],
  mass = 1,
  friction = 0.5,
  restitution = 0.2,
  onCollision,
}) => {
  const rigidBodyRef = React.useRef<RapierRigidBody>(null);

  const handleCollisionEnter = React.useCallback(
    (event: { other: { rigidBodyObject?: { name?: string } } }) => {
      if (onCollision && event.other.rigidBodyObject?.name) {
        onCollision(event.other.rigidBodyObject.name);
      }
    },
    [onCollision]
  );

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type={type}
      mass={mass}
      friction={friction}
      restitution={restitution}
      onCollisionEnter={handleCollisionEnter}
    >
      {children}
      {colliderType === 'cuboid' && (
        <CuboidCollider args={colliderArgs as [number, number, number]} />
      )}
    </RigidBody>
  );
};

// =============================================================================
// COMPONENTE GROUND PLANE (COM FÍSICA)
// =============================================================================

interface PhysicsGroundProps {
  size?: [number, number];
  position?: [number, number, number];
}

/**
 * Plano de chão com colisão
 */
export const PhysicsGround: React.FC<PhysicsGroundProps> = ({
  size = [100, 100],
  position = [0, 0, 0],
}) => {
  return (
    <RigidBody type="fixed" position={position} name="ground">
      <CuboidCollider args={[size[0] / 2, 0.1, size[1] / 2]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#2d3436" transparent opacity={0.8} />
      </mesh>
    </RigidBody>
  );
};

// =============================================================================
// HOOKS DE FÍSICA
// =============================================================================

/**
 * Hook para obter referência a um RigidBody
 */
export const usePhysicsBody = () => {
  const ref = React.useRef<RapierRigidBody>(null);

  const applyImpulse = React.useCallback((impulse: [number, number, number]) => {
    if (ref.current) {
      ref.current.applyImpulse({ x: impulse[0], y: impulse[1], z: impulse[2] }, true);
    }
  }, []);

  const applyForce = React.useCallback((force: [number, number, number]) => {
    if (ref.current) {
      ref.current.addForce({ x: force[0], y: force[1], z: force[2] }, true);
    }
  }, []);

  const setPosition = React.useCallback((position: [number, number, number]) => {
    if (ref.current) {
      ref.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
    }
  }, []);

  const getPosition = React.useCallback((): [number, number, number] | null => {
    if (ref.current) {
      const pos = ref.current.translation();
      return [pos.x, pos.y, pos.z];
    }
    return null;
  }, []);

  const setVelocity = React.useCallback((velocity: [number, number, number]) => {
    if (ref.current) {
      ref.current.setLinvel({ x: velocity[0], y: velocity[1], z: velocity[2] }, true);
    }
  }, []);

  const getVelocity = React.useCallback((): [number, number, number] | null => {
    if (ref.current) {
      const vel = ref.current.linvel();
      return [vel.x, vel.y, vel.z];
    }
    return null;
  }, []);

  return {
    ref,
    applyImpulse,
    applyForce,
    setPosition,
    getPosition,
    setVelocity,
    getVelocity,
  };
};

export default PhysicsEngine;

// =============================================================================
// TODO: Fase 3 - Implementar
// =============================================================================
// - Raycasting para detecção de linha de visão
// - Sistema de trigger zones
// - Física de ragdoll
// - Veículos e montarias
// - Objetos destrutíveis
// - Física de água/fluidos
