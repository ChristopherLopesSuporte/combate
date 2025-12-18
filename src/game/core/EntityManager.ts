/**
 * =============================================================================
 * ENTITY MANAGER - GERENCIADOR DE ENTIDADES
 * =============================================================================
 *
 * Responsável por gerenciar o ciclo de vida das entidades no jogo.
 * Criação, destruição, busca e manipulação de entidades.
 *
 * TODO: Fase 2 - Implementar funcionalidades completas
 */

import type { Entity, Position3D, EntityType, EntityStats } from '../types';
import { useGameStore, generateEntityId, createDefaultEntity } from '../store/gameStore';
import entityConfigs from '../entities/entityConfigs.json';

// Tipo para presets de entidades
type EntityPresetKey = keyof typeof entityConfigs.presets;

// =============================================================================
// CLASSE ENTITY MANAGER
// =============================================================================

/**
 * Gerenciador de entidades do jogo
 * Singleton que fornece métodos utilitários para manipulação de entidades
 */
class EntityManager {
  private static instance: EntityManager;

  private constructor() {
    // Construtor privado para singleton
  }

  /**
   * Obtém instância única do EntityManager
   */
  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  // ===========================================================================
  // CRIAÇÃO DE ENTIDADES
  // ===========================================================================

  /**
   * Cria uma nova entidade com valores customizados
   */
  createEntity(config: {
    name: string;
    position: Position3D;
    type?: EntityType;
    size?: number;
    radius?: number;
    color?: string;
    stats?: Partial<EntityStats>;
    isPlayerControlled?: boolean;
  }): Entity {
    const entity = createDefaultEntity({
      id: generateEntityId(),
      name: config.name,
      position: config.position,
      type: config.type || 'humanoid',
      size: config.size || 1.8,
      radius: config.radius || 0.5,
      color: config.color || '#4a90d9',
      isPlayerControlled: config.isPlayerControlled ?? true,
      stats: {
        hp: config.stats?.hp ?? 100,
        maxHp: config.stats?.maxHp ?? 100,
        vel: config.stats?.vel ?? 50,
        hab: config.stats?.hab ?? 50,
        agi: config.stats?.agi ?? 50,
        for: config.stats?.for ?? 50,
        res: config.stats?.res ?? 50,
        per: config.stats?.per ?? 50,
        speed: config.stats?.speed ?? 5,
      },
    });

    return entity;
  }

  /**
   * Spawna uma entidade no jogo (cria e adiciona ao store)
   */
  spawnEntity(config: Parameters<typeof this.createEntity>[0]): Entity {
    const entity = this.createEntity(config);
    useGameStore.getState().addEntity(entity);
    return entity;
  }

  /**
   * Spawna uma entidade a partir de um preset do entityConfigs.json
   */
  spawnFromPreset(
    presetKey: string,
    position: Position3D,
    isPlayerControlled: boolean = false
  ): Entity | null {
    const preset = entityConfigs.presets[presetKey as EntityPresetKey];
    if (!preset) {
      console.warn(`Preset "${presetKey}" not found in entityConfigs.json`);
      return null;
    }

    const entity = createDefaultEntity({
      id: generateEntityId(),
      name: preset.name,
      position: position,
      type: preset.type as EntityType,
      size: preset.size,
      radius: preset.radius,
      color: preset.color,
      isPlayerControlled: isPlayerControlled,
      stats: {
        hp: preset.stats.hp,
        maxHp: preset.stats.maxHp,
        vel: preset.stats.vel,
        hab: preset.stats.hab,
        agi: preset.stats.agi,
        for: preset.stats.for,
        res: preset.stats.res,
        per: preset.stats.per,
        speed: preset.stats.speed,
      },
    });

    useGameStore.getState().addEntity(entity);
    return entity;
  }

  /**
   * Obtém lista de todos os presets disponíveis
   */
  getAvailablePresets(): { key: string; name: string; type: string }[] {
    return Object.entries(entityConfigs.presets).map(([key, preset]) => ({
      key,
      name: preset.name,
      type: preset.type,
    }));
  }

  /**
   * Obtém informações de um preset específico
   */
  getPresetInfo(presetKey: string): typeof entityConfigs.presets[EntityPresetKey] | null {
    return entityConfigs.presets[presetKey as EntityPresetKey] || null;
  }

  // ===========================================================================
  // BUSCA DE ENTIDADES
  // ===========================================================================

  /**
   * Obtém todas as entidades
   */
  getAllEntities(): Entity[] {
    return useGameStore.getState().entities;
  }

  /**
   * Busca entidade por ID
   */
  getEntityById(id: string): Entity | undefined {
    return useGameStore.getState().entities.find((e) => e.id === id);
  }

  /**
   * Busca entidades por tipo
   */
  getEntitiesByType(type: EntityType): Entity[] {
    return useGameStore.getState().entities.filter((e) => e.type === type);
  }

  /**
   * Obtém entidade selecionada
   */
  getSelectedEntity(): Entity | undefined {
    const state = useGameStore.getState();
    return state.entities.find((e) => e.id === state.selectedEntityId);
  }

  /**
   * Obtém entidades em um raio de uma posição
   */
  getEntitiesInRadius(center: Position3D, radius: number): Entity[] {
    return useGameStore.getState().entities.filter((e) => {
      const dx = e.position[0] - center[0];
      const dy = e.position[1] - center[1];
      const dz = e.position[2] - center[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return distance <= radius;
    });
  }

  // ===========================================================================
  // MANIPULAÇÃO DE ENTIDADES
  // ===========================================================================

  /**
   * Remove uma entidade do jogo
   */
  destroyEntity(id: string): void {
    useGameStore.getState().removeEntity(id);
  }

  /**
   * Move uma entidade para nova posição
   */
  moveEntity(id: string, newPosition: Position3D): void {
    useGameStore.getState().moveEntity(id, newPosition);
  }

  /**
   * Aplica dano a uma entidade
   */
  damageEntity(id: string, damage: number): void {
    const entity = this.getEntityById(id);
    if (!entity) return;

    const newHp = Math.max(0, entity.stats.hp - damage);
    useGameStore.getState().updateEntity(id, {
      stats: { ...entity.stats, hp: newHp },
    });

    // Se HP chegou a 0, entidade morre
    if (newHp <= 0) {
      this.onEntityDeath(id);
    }
  }

  /**
   * Cura uma entidade
   */
  healEntity(id: string, amount: number): void {
    const entity = this.getEntityById(id);
    if (!entity) return;

    const newHp = Math.min(entity.stats.maxHp, entity.stats.hp + amount);
    useGameStore.getState().updateEntity(id, {
      stats: { ...entity.stats, hp: newHp },
    });
  }

  // ===========================================================================
  // EVENTOS DE ENTIDADE
  // ===========================================================================

  /**
   * Chamado quando uma entidade morre
   */
  private onEntityDeath(id: string): void {
    // TODO: Fase 3 - Implementar sistema de morte
    // - Animação de morte
    // - Drop de loot
    // - Evento de morte
    console.log(`Entity ${id} died`);
  }

  // ===========================================================================
  // VALIDAÇÃO
  // ===========================================================================

  /**
   * Verifica se uma posição está ocupada
   */
  isPositionOccupied(position: Position3D, excludeId?: string): boolean {
    return useGameStore.getState().entities.some((e) => {
      if (e.id === excludeId) return false;

      const dx = e.position[0] - position[0];
      const dz = e.position[2] - position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      return distance < e.radius;
    });
  }

  /**
   * Verifica se uma posição está dentro do grid
   */
  isPositionInGrid(position: Position3D): boolean {
    const { gridSize } = useGameStore.getState();
    return (
      position[0] >= 0 &&
      position[0] <= gridSize &&
      position[2] >= 0 &&
      position[2] <= gridSize
    );
  }
}

// Exporta instância singleton
export const entityManager = EntityManager.getInstance();

export default EntityManager;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Sistema de spawn points
// - Pooling de entidades para performance
// - Sistema de grupos/times
// - Pathfinding integration
// - Sistema de visibilidade (fog of war)
