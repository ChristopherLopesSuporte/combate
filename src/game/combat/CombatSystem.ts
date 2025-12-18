/**
 * =============================================================================
 * COMBAT SYSTEM - SISTEMA DE COMBATE
 * =============================================================================
 *
 * Sistema central de combate do jogo usando dados d20.
 *
 * FÓRMULAS:
 * - AtaqueTotal = 1d20 + Força do Atacante
 * - DefesaTotal = 1d20 + Agilidade do Defensor
 * - Dano = max(0, AtaqueTotal - DefesaTotal)
 */

import type { Entity, AttackResult, Position3D } from '../types';
import { DamageCalculator, CombatRollResult, DiceRollResult } from './DamageCalculator';
import { AttackType, ATTACK_CONFIGS } from './AttackTypes';

// =============================================================================
// TIPOS DO SISTEMA DE COMBATE
// =============================================================================

/** Resultado completo de um combate com dados */
export interface CombatResult {
  /** ID do atacante */
  attackerId: string;
  /** ID do defensor */
  defenderId: string;
  /** Rolagem de ataque */
  attackRoll: DiceRollResult;
  /** Rolagem de defesa */
  defenseRoll: DiceRollResult;
  /** Dano causado */
  damage: number;
  /** Se o defensor morreu */
  defenderDied: boolean;
  /** HP restante do defensor */
  defenderHpRemaining: number;
  /** Se foi crítico */
  isCritical: boolean;
  /** Se foi fumble */
  isFumble: boolean;
  /** Mensagens de log */
  logs: string[];
  /** Timestamp */
  timestamp: number;
}

/** Resultado de uma tentativa de ataque */
export interface CombatAction {
  attackerId: string;
  defenderId: string;
  attackType: AttackType;
  timeMs: number;
  result?: AttackResult;
}

/** Estado de um combate */
export interface CombatState {
  isActive: boolean;
  participants: string[];
  currentAction: CombatAction | null;
  actionHistory: CombatAction[];
  startTime: number;
  currentTime: number;
}

/** Configuração de alcance de ataque padrão */
const DEFAULT_ATTACK_RANGE = 2.0; // 2 metros

// =============================================================================
// CLASSE COMBAT SYSTEM
// =============================================================================

/**
 * Sistema de combate singleton
 * Gerencia toda a lógica de combate do jogo
 */
class CombatSystem {
  private static instance: CombatSystem;
  private damageCalculator: DamageCalculator;
  private combatState: CombatState;

  private constructor() {
    this.damageCalculator = DamageCalculator.getInstance();
    this.combatState = this.getInitialState();
  }

  /**
   * Obtém instância única do CombatSystem
   */
  public static getInstance(): CombatSystem {
    if (!CombatSystem.instance) {
      CombatSystem.instance = new CombatSystem();
    }
    return CombatSystem.instance;
  }

  /**
   * Retorna estado inicial do combate
   */
  private getInitialState(): CombatState {
    return {
      isActive: false,
      participants: [],
      currentAction: null,
      actionHistory: [],
      startTime: 0,
      currentTime: 0,
    };
  }

  // ===========================================================================
  // CONTROLE DE COMBATE
  // ===========================================================================

  /**
   * Inicia um combate entre entidades
   */
  startCombat(participantIds: string[]): void {
    this.combatState = {
      ...this.getInitialState(),
      isActive: true,
      participants: participantIds,
      startTime: Date.now(),
    };

    console.log(`Combat started with ${participantIds.length} participants`);
  }

  /**
   * Finaliza o combate atual
   */
  endCombat(): CombatState {
    const finalState = { ...this.combatState };
    this.combatState = this.getInitialState();
    console.log('Combat ended');
    return finalState;
  }

  /**
   * Verifica se há combate ativo
   */
  isInCombat(): boolean {
    return this.combatState.isActive;
  }

  // ===========================================================================
  // SISTEMA D20 - MÉTODOS PRINCIPAIS
  // ===========================================================================

  /**
   * Verifica se uma entidade pode atacar outra
   * @returns Objeto com resultado e motivo se não puder
   */
  canAttack(
    attacker: Entity,
    defender: Entity,
    attackRange: number = DEFAULT_ATTACK_RANGE
  ): { canAttack: boolean; reason?: string } {
    // Verifica se são a mesma entidade
    if (attacker.id === defender.id) {
      return { canAttack: false, reason: 'Não pode atacar a si mesmo' };
    }

    // Verifica se atacante está vivo
    if (attacker.stats.hp <= 0) {
      return { canAttack: false, reason: 'Atacante está morto' };
    }

    // Verifica se defensor está vivo
    if (defender.stats.hp <= 0) {
      return { canAttack: false, reason: 'Alvo já está morto' };
    }

    // Verifica distância
    const distance = this.calculateDistance(attacker.position, defender.position);
    const effectiveRange = attackRange + attacker.radius + defender.radius;

    if (distance > effectiveRange) {
      return {
        canAttack: false,
        reason: `Fora do alcance (${distance.toFixed(1)}m > ${effectiveRange.toFixed(1)}m)`,
      };
    }

    return { canAttack: true };
  }

  /**
   * Obtém o alcance de ataque de uma entidade
   */
  getAttackRange(entity: Entity): number {
    // Por enquanto usa range padrão, pode ser expandido com armas
    return DEFAULT_ATTACK_RANGE;
  }

  /**
   * Executa um ataque usando sistema d20
   * AtaqueTotal = 1d20 + FOR/10
   * DefesaTotal = 1d20 + AGI/10
   * Dano = max(0, AtaqueTotal - DefesaTotal)
   */
  executeD20Attack(attacker: Entity, defender: Entity): CombatResult {
    const logs: string[] = [];

    // Rolagem de dados
    const combatRoll = this.damageCalculator.resolveCombat(attacker, defender);
    const { attackRoll, defenseRoll, damage, isCritical, isFumble } = combatRoll;

    // Gera logs
    logs.push(`${attacker.name} ataca ${defender.name}!`);
    logs.push(
      `Ataque: ${attackRoll.roll} + ${attackRoll.modifier} = ${attackRoll.total}` +
        (attackRoll.isCritical ? ' (CRÍTICO!)' : '') +
        (attackRoll.isFumble ? ' (FALHA!)' : '')
    );
    logs.push(
      `Defesa: ${defenseRoll.roll} + ${defenseRoll.modifier} = ${defenseRoll.total}` +
        (defenseRoll.isCritical ? ' (DEFESA PERFEITA!)' : '')
    );

    // Calcula HP restante
    const defenderHpRemaining = Math.max(0, defender.stats.hp - damage);
    const defenderDied = defenderHpRemaining <= 0;

    if (damage > 0) {
      logs.push(`💥 Dano: ${damage} HP`);
      if (isCritical) {
        logs.push('⚔️ Acerto crítico! Dano dobrado!');
      }
    } else {
      if (isFumble) {
        logs.push('❌ Falha crítica! O ataque errou feio!');
      } else if (defenseRoll.isCritical) {
        logs.push('🛡️ Defesa perfeita! Nenhum dano!');
      } else {
        logs.push('🛡️ Ataque bloqueado!');
      }
    }

    if (defenderDied) {
      logs.push(`💀 ${defender.name} foi derrotado!`);
    }

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      attackRoll,
      defenseRoll,
      damage,
      defenderDied,
      defenderHpRemaining,
      isCritical,
      isFumble,
      logs,
      timestamp: Date.now(),
    };
  }

  /**
   * Aplica o resultado do combate às entidades
   * Retorna a entidade defender atualizada
   */
  applyCombatResult(defender: Entity, result: CombatResult): Entity {
    return {
      ...defender,
      stats: {
        ...defender.stats,
        hp: result.defenderHpRemaining,
      },
    };
  }

  // ===========================================================================
  // AÇÕES DE COMBATE (SISTEMA ORIGINAL - MANTIDO PARA COMPATIBILIDADE)
  // ===========================================================================

  /**
   * Executa um ataque (sistema original)
   */
  executeAttack(
    attacker: Entity,
    defender: Entity,
    attackType: AttackType = 'normal'
  ): AttackResult {
    const attackConfig = ATTACK_CONFIGS[attackType];

    // Calcula tempo do ataque baseado nos stats
    const baseTime = this.calculateAttackTime(attacker, attackType);

    // Calcula se acertou
    const hitRoll = Math.random() * 100;
    const hitChance = this.calculateHitChance(attacker, defender, attackType);
    const isHit = hitRoll <= hitChance;

    // Calcula dano se acertou
    let damage = 0;
    let isCritical = false;

    if (isHit) {
      const critRoll = Math.random() * 100;
      isCritical = critRoll <= this.calculateCritChance(attacker);

      damage = this.damageCalculator.calculateDamage(
        attacker,
        defender,
        attackType,
        isCritical
      );
    }

    // Cria resultado
    const result: AttackResult = {
      attackerId: attacker.id,
      defenderId: defender.id,
      damage,
      isCritical,
      isHit,
      timestamp: Date.now(),
    };

    // Registra ação no histórico
    const action: CombatAction = {
      attackerId: attacker.id,
      defenderId: defender.id,
      attackType,
      timeMs: baseTime,
      result,
    };

    this.combatState.actionHistory.push(action);
    this.combatState.currentAction = action;

    return result;
  }

  /**
   * Executa uma defesa (aparar ou esquivar)
   */
  executeDefense(
    defender: Entity,
    attacker: Entity,
    defenseType: 'parry' | 'dodge'
  ): { success: boolean; timeMs: number } {
    const defenseTime = this.calculateDefenseTime(defender, defenseType);
    const successChance = this.calculateDefenseChance(defender, defenseType);

    const roll = Math.random() * 100;
    const success = roll <= successChance;

    return {
      success,
      timeMs: defenseTime,
    };
  }

  // ===========================================================================
  // CÁLCULOS DE COMBATE
  // ===========================================================================

  /**
   * Calcula o tempo de ataque em ms
   * Baseado no Sistema de Combate RPG v3
   */
  calculateAttackTime(entity: Entity, attackType: AttackType): number {
    const stats = entity.stats;
    const config = ATTACK_CONFIGS[attackType];

    // IC = Índice de Combate (quanto menor, mais rápido)
    // IC = (VEL×0.30 + HAB×0.25 + AGI×0.20 + FOR×0.25) / 50
    const ic = this.calculateIC(stats.vel, stats.hab, stats.agi, stats.for);

    // Tempo base do tipo de ataque * multiplicador de tempo * IC
    const baseTime = config.baseTimeMs;
    const finalTime = baseTime * ic * config.timeMultiplier;

    return Math.round(finalTime);
  }

  /**
   * Calcula o tempo de defesa em ms
   */
  calculateDefenseTime(entity: Entity, defenseType: 'parry' | 'dodge'): number {
    const stats = entity.stats;

    if (defenseType === 'parry') {
      // Aparar: VEL×0.25 + HAB×0.30 + AGI×0.20 + FOR×0.25
      const ic = this.calculateICDefense(stats.vel, stats.hab, stats.agi, stats.for, 'parry');
      return Math.round(200 * ic); // 200ms base para aparar
    } else {
      // Esquiva: VEL×0.20 + HAB×0.20 + AGI×0.40 + FOR×0.20
      const ic = this.calculateICDefense(stats.vel, stats.hab, stats.agi, stats.for, 'dodge');
      return Math.round(150 * ic); // 150ms base para esquiva
    }
  }

  /**
   * Calcula chance de acerto
   */
  calculateHitChance(attacker: Entity, defender: Entity, attackType: AttackType): number {
    const baseChance = 70; // 70% base
    const config = ATTACK_CONFIGS[attackType];

    // Bônus/penalidade do tipo de ataque
    const typeModifier = config.hitModifier || 0;

    // Diferença de habilidade
    const habDiff = (attacker.stats.hab - defender.stats.agi) / 2;

    // Diferença de percepção
    const perBonus = (attacker.stats.per - 50) / 10;

    const finalChance = baseChance + typeModifier + habDiff + perBonus;

    return Math.max(5, Math.min(95, finalChance)); // Entre 5% e 95%
  }

  /**
   * Calcula chance de crítico
   */
  calculateCritChance(attacker: Entity): number {
    const baseCrit = 5; // 5% base
    const habBonus = (attacker.stats.hab - 50) / 20;
    const perBonus = (attacker.stats.per - 50) / 25;

    return Math.max(1, Math.min(30, baseCrit + habBonus + perBonus));
  }

  /**
   * Calcula chance de defesa bem sucedida
   */
  calculateDefenseChance(defender: Entity, defenseType: 'parry' | 'dodge'): number {
    const stats = defender.stats;
    const baseChance = 50;

    if (defenseType === 'parry') {
      return Math.max(10, Math.min(80, baseChance + (stats.hab - 50) / 2 + (stats.for - 50) / 4));
    } else {
      return Math.max(10, Math.min(80, baseChance + (stats.agi - 50) / 2 + (stats.vel - 50) / 4));
    }
  }

  /**
   * Calcula Índice de Combate (IC)
   * Baseado no Sistema v3
   */
  private calculateIC(vel: number, hab: number, agi: number, forAttr: number): number {
    // IC para armas (pesos padrão)
    const ic = (vel * 0.30 + hab * 0.25 + agi * 0.20 + forAttr * 0.25) / 50;
    return Math.max(0.20, ic); // Mínimo 0.20 para seres sobrenaturais
  }

  /**
   * Calcula IC defensivo
   */
  private calculateICDefense(
    vel: number,
    hab: number,
    agi: number,
    forAttr: number,
    type: 'parry' | 'dodge'
  ): number {
    if (type === 'parry') {
      return (vel * 0.25 + hab * 0.30 + agi * 0.20 + forAttr * 0.25) / 50;
    } else {
      return (vel * 0.20 + hab * 0.20 + agi * 0.40 + forAttr * 0.20) / 50;
    }
  }

  // ===========================================================================
  // UTILITÁRIOS
  // ===========================================================================

  /**
   * Calcula distância entre duas entidades
   */
  calculateDistance(pos1: Position3D, pos2: Position3D): number {
    const dx = pos2[0] - pos1[0];
    const dy = pos2[1] - pos1[1];
    const dz = pos2[2] - pos1[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Verifica se entidades estão em alcance de combate
   */
  isInMeleeRange(entity1: Entity, entity2: Entity, weaponReach: number = 1.5): boolean {
    const distance = this.calculateDistance(entity1.position, entity2.position);
    return distance <= entity1.radius + entity2.radius + weaponReach;
  }

  /**
   * Obtém histórico de ações do combate
   */
  getActionHistory(): CombatAction[] {
    return [...this.combatState.actionHistory];
  }

  /**
   * Obtém estado atual do combate
   */
  getCombatState(): CombatState {
    return { ...this.combatState };
  }

  /**
   * Reseta o sistema de combate
   */
  reset(): void {
    this.combatState = this.getInitialState();
  }
}

// Exporta instância singleton
export const combatSystem = CombatSystem.getInstance();

export default CombatSystem;

// =============================================================================
// TODO: Fase 4 - Implementar
// =============================================================================
// - Sistema de iniciativa
// - Combate simultâneo (tempo real baseado em ms)
// - Sistema de reações
// - Sistema de oportunidade de ataque
// - Combate em grupo
// - Sistema de flanqueamento
// - Bônus de terreno
