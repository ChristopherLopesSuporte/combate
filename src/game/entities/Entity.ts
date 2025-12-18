/**
 * =============================================================================
 * ENTITY - CLASSE BASE DE ENTIDADES
 * =============================================================================
 *
 * Classe base para todas as entidades do jogo (personagens, NPCs, objetos).
 * Implementa o padrão de composição para permitir diferentes tipos de entidades.
 *
 * TODO: Fase 2 - Expandir com sistema de componentes
 */

import type { Entity as EntityType, Position3D, Rotation3D, EntityStats } from '../types';
import { generateEntityId } from '../store/gameStore';

// =============================================================================
// CLASSE ENTITY
// =============================================================================

/**
 * Classe base para entidades do jogo
 * Gerencia estado, posição e comportamento básico
 */
export class Entity implements EntityType {
  id: string;
  name: string;
  position: Position3D;
  rotation: Rotation3D;
  size: number;
  radius: number;
  stats: EntityStats;
  type: 'humanoid' | 'creature' | 'object';
  isSelected: boolean;
  isPlayerControlled: boolean;
  color: string;

  // Estado interno
  private _isAlive: boolean = true;
  private _isMoving: boolean = false;
  private _currentAction: string | null = null;

  constructor(config: Partial<EntityType> = {}) {
    this.id = config.id || generateEntityId();
    this.name = config.name || 'Entidade';
    this.position = config.position || [0, 0, 0];
    this.rotation = config.rotation || [0, 0, 0];
    this.size = config.size || 1.8;
    this.radius = config.radius || 0.5;
    this.stats = config.stats || this.getDefaultStats();
    this.type = config.type || 'humanoid';
    this.isSelected = config.isSelected || false;
    this.isPlayerControlled = config.isPlayerControlled ?? true;
    this.color = config.color || '#4a90d9';
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get isAlive(): boolean {
    return this._isAlive && this.stats.hp > 0;
  }

  get isMoving(): boolean {
    return this._isMoving;
  }

  get currentAction(): string | null {
    return this._currentAction;
  }

  get isDead(): boolean {
    return !this.isAlive;
  }

  // ===========================================================================
  // MÉTODOS DE ESTADO
  // ===========================================================================

  /**
   * Retorna stats padrão para uma entidade
   */
  private getDefaultStats(): EntityStats {
    return {
      hp: 100,
      maxHp: 100,
      vel: 50,
      hab: 50,
      agi: 50,
      for: 50,
      res: 50,
      per: 50,
      speed: 5,
    };
  }

  /**
   * Aplica dano à entidade
   */
  takeDamage(amount: number): number {
    const actualDamage = Math.max(0, amount);
    this.stats.hp = Math.max(0, this.stats.hp - actualDamage);

    if (this.stats.hp <= 0) {
      this._isAlive = false;
      this.onDeath();
    }

    return actualDamage;
  }

  /**
   * Cura a entidade
   */
  heal(amount: number): number {
    const actualHeal = Math.min(amount, this.stats.maxHp - this.stats.hp);
    this.stats.hp += actualHeal;
    return actualHeal;
  }

  /**
   * Move a entidade para uma nova posição
   */
  moveTo(position: Position3D): void {
    this._isMoving = true;
    this.position = position;
    this._isMoving = false;
  }

  /**
   * Rotaciona a entidade
   */
  rotateTo(rotation: Rotation3D): void {
    this.rotation = rotation;
  }

  /**
   * Define a ação atual
   */
  setAction(action: string | null): void {
    this._currentAction = action;
  }

  // ===========================================================================
  // EVENTOS
  // ===========================================================================

  /**
   * Chamado quando a entidade morre
   */
  protected onDeath(): void {
    console.log(`Entity ${this.name} (${this.id}) has died`);
    // TODO: Fase 3 - Implementar sistema de eventos de morte
  }

  /**
   * Chamado a cada frame/tick
   */
  update(deltaTime: number): void {
    // TODO: Fase 2 - Implementar lógica de update
  }

  // ===========================================================================
  // SERIALIZAÇÃO
  // ===========================================================================

  /**
   * Converte a entidade para objeto serializável
   */
  toJSON(): EntityType {
    return {
      id: this.id,
      name: this.name,
      position: this.position,
      rotation: this.rotation,
      size: this.size,
      radius: this.radius,
      stats: { ...this.stats },
      type: this.type,
      isSelected: this.isSelected,
      isPlayerControlled: this.isPlayerControlled,
      color: this.color,
    };
  }

  /**
   * Cria uma entidade a partir de dados serializados
   */
  static fromJSON(data: EntityType): Entity {
    return new Entity(data);
  }
}

export default Entity;

// =============================================================================
// TODO: Fase 2 - Implementar
// =============================================================================
// - Sistema de componentes (Component pattern)
// - Sistema de buffs/debuffs
// - Sistema de inventário
// - Sistema de habilidades
// - Animações de estado
