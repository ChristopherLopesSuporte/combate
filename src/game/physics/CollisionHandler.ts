/**
 * =============================================================================
 * COLLISION HANDLER - GERENCIADOR DE COLISÕES
 * =============================================================================
 *
 * Gerencia detecção e resposta a colisões entre entidades e objetos do mundo.
 *
 * TODO: Fase 3 - Implementar sistema completo de colisões
 */

import type { Position3D, Entity } from '../types';

// =============================================================================
// TIPOS
// =============================================================================

/** Tipos de colisores */
export type ColliderType = 'sphere' | 'box' | 'capsule' | 'mesh';

/** Informação de um colisor */
export interface Collider {
  id: string;
  type: ColliderType;
  position: Position3D;
  radius?: number;           // Para esfera/cápsula
  size?: Position3D;         // Para caixa [width, height, depth]
  height?: number;           // Para cápsula
  isTrigger: boolean;        // Se é trigger (não bloqueia)
  layer: CollisionLayer;     // Camada de colisão
  entityId?: string;         // ID da entidade associada
}

/** Camadas de colisão */
export type CollisionLayer =
  | 'default'
  | 'player'
  | 'enemy'
  | 'projectile'
  | 'obstacle'
  | 'trigger'
  | 'terrain';

/** Resultado de uma colisão */
export interface CollisionResult {
  colliderA: Collider;
  colliderB: Collider;
  point: Position3D;         // Ponto de contato
  normal: Position3D;        // Normal da colisão
  depth: number;             // Profundidade de penetração
}

/** Matriz de colisão (quais camadas colidem) */
const COLLISION_MATRIX: Record<CollisionLayer, CollisionLayer[]> = {
  default: ['default', 'player', 'enemy', 'projectile', 'obstacle', 'terrain'],
  player: ['default', 'enemy', 'projectile', 'obstacle', 'trigger', 'terrain'],
  enemy: ['default', 'player', 'projectile', 'obstacle', 'trigger', 'terrain'],
  projectile: ['default', 'player', 'enemy', 'obstacle', 'terrain'],
  obstacle: ['default', 'player', 'enemy', 'projectile'],
  trigger: ['player', 'enemy'],
  terrain: ['default', 'player', 'enemy', 'projectile'],
};

// =============================================================================
// CLASSE COLLISION HANDLER
// =============================================================================

/**
 * Gerenciador de colisões singleton
 */
class CollisionHandler {
  private static instance: CollisionHandler;
  private colliders: Map<string, Collider> = new Map();
  private callbacks: Map<string, ((result: CollisionResult) => void)[]> = new Map();

  private constructor() {}

  /**
   * Obtém instância única
   */
  public static getInstance(): CollisionHandler {
    if (!CollisionHandler.instance) {
      CollisionHandler.instance = new CollisionHandler();
    }
    return CollisionHandler.instance;
  }

  // ===========================================================================
  // GERENCIAMENTO DE COLISORES
  // ===========================================================================

  /**
   * Registra um colisor
   */
  registerCollider(collider: Collider): void {
    this.colliders.set(collider.id, collider);
  }

  /**
   * Remove um colisor
   */
  unregisterCollider(id: string): void {
    this.colliders.delete(id);
    this.callbacks.delete(id);
  }

  /**
   * Atualiza posição de um colisor
   */
  updateColliderPosition(id: string, position: Position3D): void {
    const collider = this.colliders.get(id);
    if (collider) {
      collider.position = position;
    }
  }

  /**
   * Obtém um colisor por ID
   */
  getCollider(id: string): Collider | undefined {
    return this.colliders.get(id);
  }

  // ===========================================================================
  // DETECÇÃO DE COLISÕES
  // ===========================================================================

  /**
   * Verifica todas as colisões ativas
   */
  checkAllCollisions(): CollisionResult[] {
    const results: CollisionResult[] = [];
    const colliderArray = Array.from(this.colliders.values());

    for (let i = 0; i < colliderArray.length; i++) {
      for (let j = i + 1; j < colliderArray.length; j++) {
        const a = colliderArray[i];
        const b = colliderArray[j];

        // Verifica se as camadas podem colidir
        if (!this.canCollide(a.layer, b.layer)) continue;

        const collision = this.checkCollision(a, b);
        if (collision) {
          results.push(collision);
          this.notifyCollision(collision);
        }
      }
    }

    return results;
  }

  /**
   * Verifica colisão entre dois colisores
   */
  checkCollision(a: Collider, b: Collider): CollisionResult | null {
    // Esfera vs Esfera
    if (a.type === 'sphere' && b.type === 'sphere') {
      return this.sphereVsSphere(a, b);
    }

    // Box vs Box
    if (a.type === 'box' && b.type === 'box') {
      return this.boxVsBox(a, b);
    }

    // Esfera vs Box
    if (a.type === 'sphere' && b.type === 'box') {
      return this.sphereVsBox(a, b);
    }
    if (a.type === 'box' && b.type === 'sphere') {
      return this.sphereVsBox(b, a);
    }

    // TODO: Implementar outros tipos de colisão
    return null;
  }

  /**
   * Colisão esfera vs esfera
   */
  private sphereVsSphere(a: Collider, b: Collider): CollisionResult | null {
    const radiusA = a.radius || 0.5;
    const radiusB = b.radius || 0.5;

    const dx = b.position[0] - a.position[0];
    const dy = b.position[1] - a.position[1];
    const dz = b.position[2] - a.position[2];

    const distSq = dx * dx + dy * dy + dz * dz;
    const minDist = radiusA + radiusB;

    if (distSq >= minDist * minDist) return null;

    const dist = Math.sqrt(distSq);
    const normal: Position3D = dist > 0 ? [dx / dist, dy / dist, dz / dist] : [0, 1, 0];

    const point: Position3D = [
      a.position[0] + normal[0] * radiusA,
      a.position[1] + normal[1] * radiusA,
      a.position[2] + normal[2] * radiusA,
    ];

    return {
      colliderA: a,
      colliderB: b,
      point,
      normal,
      depth: minDist - dist,
    };
  }

  /**
   * Colisão box vs box (AABB)
   */
  private boxVsBox(a: Collider, b: Collider): CollisionResult | null {
    const sizeA = a.size || [1, 1, 1];
    const sizeB = b.size || [1, 1, 1];

    const aMin = [
      a.position[0] - sizeA[0] / 2,
      a.position[1] - sizeA[1] / 2,
      a.position[2] - sizeA[2] / 2,
    ];
    const aMax = [
      a.position[0] + sizeA[0] / 2,
      a.position[1] + sizeA[1] / 2,
      a.position[2] + sizeA[2] / 2,
    ];
    const bMin = [
      b.position[0] - sizeB[0] / 2,
      b.position[1] - sizeB[1] / 2,
      b.position[2] - sizeB[2] / 2,
    ];
    const bMax = [
      b.position[0] + sizeB[0] / 2,
      b.position[1] + sizeB[1] / 2,
      b.position[2] + sizeB[2] / 2,
    ];

    // Verifica sobreposição em cada eixo
    if (
      aMax[0] < bMin[0] || aMin[0] > bMax[0] ||
      aMax[1] < bMin[1] || aMin[1] > bMax[1] ||
      aMax[2] < bMin[2] || aMin[2] > bMax[2]
    ) {
      return null;
    }

    // Calcula penetração em cada eixo
    const overlapX = Math.min(aMax[0] - bMin[0], bMax[0] - aMin[0]);
    const overlapY = Math.min(aMax[1] - bMin[1], bMax[1] - aMin[1]);
    const overlapZ = Math.min(aMax[2] - bMin[2], bMax[2] - aMin[2]);

    // Encontra eixo de menor penetração
    let normal: Position3D;
    let depth: number;

    if (overlapX <= overlapY && overlapX <= overlapZ) {
      normal = a.position[0] < b.position[0] ? [-1, 0, 0] : [1, 0, 0];
      depth = overlapX;
    } else if (overlapY <= overlapZ) {
      normal = a.position[1] < b.position[1] ? [0, -1, 0] : [0, 1, 0];
      depth = overlapY;
    } else {
      normal = a.position[2] < b.position[2] ? [0, 0, -1] : [0, 0, 1];
      depth = overlapZ;
    }

    const point: Position3D = [
      (a.position[0] + b.position[0]) / 2,
      (a.position[1] + b.position[1]) / 2,
      (a.position[2] + b.position[2]) / 2,
    ];

    return {
      colliderA: a,
      colliderB: b,
      point,
      normal,
      depth,
    };
  }

  /**
   * Colisão esfera vs box
   */
  private sphereVsBox(sphere: Collider, box: Collider): CollisionResult | null {
    const radius = sphere.radius || 0.5;
    const size = box.size || [1, 1, 1];

    // Encontra ponto mais próximo na box
    const closest: Position3D = [
      Math.max(box.position[0] - size[0] / 2, Math.min(sphere.position[0], box.position[0] + size[0] / 2)),
      Math.max(box.position[1] - size[1] / 2, Math.min(sphere.position[1], box.position[1] + size[1] / 2)),
      Math.max(box.position[2] - size[2] / 2, Math.min(sphere.position[2], box.position[2] + size[2] / 2)),
    ];

    const dx = sphere.position[0] - closest[0];
    const dy = sphere.position[1] - closest[1];
    const dz = sphere.position[2] - closest[2];
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq >= radius * radius) return null;

    const dist = Math.sqrt(distSq);
    const normal: Position3D = dist > 0 ? [dx / dist, dy / dist, dz / dist] : [0, 1, 0];

    return {
      colliderA: sphere,
      colliderB: box,
      point: closest,
      normal,
      depth: radius - dist,
    };
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Verifica se duas camadas podem colidir
   */
  canCollide(layerA: CollisionLayer, layerB: CollisionLayer): boolean {
    return COLLISION_MATRIX[layerA].includes(layerB);
  }

  /**
   * Registra callback de colisão para um colisor
   */
  onCollision(colliderId: string, callback: (result: CollisionResult) => void): void {
    if (!this.callbacks.has(colliderId)) {
      this.callbacks.set(colliderId, []);
    }
    this.callbacks.get(colliderId)!.push(callback);
  }

  /**
   * Notifica callbacks de colisão
   */
  private notifyCollision(result: CollisionResult): void {
    const callbacksA = this.callbacks.get(result.colliderA.id) || [];
    const callbacksB = this.callbacks.get(result.colliderB.id) || [];

    callbacksA.forEach((cb) => cb(result));
    callbacksB.forEach((cb) => cb(result));
  }

  /**
   * Raycast - lança um raio e retorna a primeira colisão
   */
  raycast(
    origin: Position3D,
    direction: Position3D,
    maxDistance: number,
    layerMask?: CollisionLayer[]
  ): { collider: Collider; distance: number; point: Position3D } | null {
    // TODO: Fase 3 - Implementar raycast
    console.log('Raycast not implemented yet');
    return null;
  }

  /**
   * Limpa todos os colisores
   */
  clear(): void {
    this.colliders.clear();
    this.callbacks.clear();
  }
}

// Exporta instância singleton
export const collisionHandler = CollisionHandler.getInstance();

export default CollisionHandler;

// =============================================================================
// TODO: Fase 3 - Implementar
// =============================================================================
// - Raycast completo
// - Cápsulas de colisão
// - Mesh colliders
// - Spatial hashing para otimização
// - Continuous collision detection
// - Eventos de trigger (enter, stay, exit)
