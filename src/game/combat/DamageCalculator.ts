/**
 * =============================================================================
 * DAMAGE CALCULATOR - CALCULADORA DE DANO
 * =============================================================================
 *
 * Calcula dano de ataques baseado em rolagem de dados d20.
 *
 * FÓRMULAS:
 * - AtaqueTotal = 1d20 + Força do Atacante
 * - DefesaTotal = 1d20 + Agilidade do Defensor
 * - Dano = max(0, AtaqueTotal - DefesaTotal)
 */

import type { Entity } from '../types';
import { AttackType, ATTACK_CONFIGS, DamageType } from './AttackTypes';

// =============================================================================
// TIPOS
// =============================================================================

/** Resultado de uma rolagem de dado */
export interface DiceRollResult {
  /** Valor base rolado no dado */
  roll: number;
  /** Modificador aplicado */
  modifier: number;
  /** Total (roll + modifier) */
  total: number;
  /** Se foi um acerto crítico (20 natural) */
  isCritical: boolean;
  /** Se foi uma falha crítica (1 natural) */
  isFumble: boolean;
}

/** Resultado do cálculo de combate */
export interface CombatRollResult {
  /** Rolagem de ataque */
  attackRoll: DiceRollResult;
  /** Rolagem de defesa */
  defenseRoll: DiceRollResult;
  /** Dano causado */
  damage: number;
  /** Se o ataque acertou */
  hit: boolean;
  /** Se foi crítico */
  isCritical: boolean;
  /** Se foi fumble */
  isFumble: boolean;
}

/** Resultado detalhado do cálculo de dano */
export interface DamageBreakdown {
  baseDamage: number;
  strengthModifier: number;
  attackTypeMultiplier: number;
  criticalMultiplier: number;
  armorReduction: number;
  resistanceReduction: number;
  finalDamage: number;
  damageType: DamageType;
  overkill: number;
}

/** Resistências de uma entidade */
export interface DamageResistances {
  slashing: number;
  piercing: number;
  bludgeoning: number;
  magical: number;
  elemental: number;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/** Dano base para ataques desarmados */
const UNARMED_BASE_DAMAGE = 5;

/** Multiplicador de crítico padrão */
const DEFAULT_CRIT_MULTIPLIER = 2.0;

/** Resistências padrão (nenhuma) */
const DEFAULT_RESISTANCES: DamageResistances = {
  slashing: 0,
  piercing: 0,
  bludgeoning: 0,
  magical: 0,
  elemental: 0,
};

// =============================================================================
// CLASSE DAMAGE CALCULATOR
// =============================================================================

/**
 * Calculadora de dano singleton
 */
export class DamageCalculator {
  private static instance: DamageCalculator;

  private constructor() {}

  /**
   * Obtém instância única
   */
  public static getInstance(): DamageCalculator {
    if (!DamageCalculator.instance) {
      DamageCalculator.instance = new DamageCalculator();
    }
    return DamageCalculator.instance;
  }

  // ===========================================================================
  // ROLAGEM DE DADOS (NOVO SISTEMA d20)
  // ===========================================================================

  /**
   * Rola um dado com número de lados especificado
   * @param sides Número de lados do dado (padrão: 20)
   * @returns Valor entre 1 e sides (inclusive)
   */
  rollDice(sides: number = 20): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Calcula o total de ataque
   * AtaqueTotal = 1d20 + Força do Atacante
   */
  calculateAttackRoll(attackerStrength: number): DiceRollResult {
    const roll = this.rollDice(20);
    const modifier = Math.floor(attackerStrength / 10); // FOR/10 como modificador
    return {
      roll,
      modifier,
      total: roll + modifier,
      isCritical: roll === 20,
      isFumble: roll === 1,
    };
  }

  /**
   * Calcula o total de defesa
   * DefesaTotal = 1d20 + Agilidade do Defensor
   */
  calculateDefenseRoll(defenderAgility: number): DiceRollResult {
    const roll = this.rollDice(20);
    const modifier = Math.floor(defenderAgility / 10); // AGI/10 como modificador
    return {
      roll,
      modifier,
      total: roll + modifier,
      isCritical: roll === 20,
      isFumble: roll === 1,
    };
  }

  /**
   * Calcula dano baseado na fórmula simplificada
   * Dano = max(0, AtaqueTotal - DefesaTotal)
   */
  calculateSimpleDamage(attackTotal: number, defenseTotal: number): number {
    return Math.max(0, attackTotal - defenseTotal);
  }

  /**
   * Executa um combate completo com rolagens de dados
   */
  resolveCombat(attacker: Entity, defender: Entity): CombatRollResult {
    const attackRoll = this.calculateAttackRoll(attacker.stats.for);
    const defenseRoll = this.calculateDefenseRoll(defender.stats.agi);

    let damage = this.calculateSimpleDamage(attackRoll.total, defenseRoll.total);

    // Crítico dobra o dano
    if (attackRoll.isCritical && !defenseRoll.isCritical) {
      damage = damage * 2;
    }

    // Fumble do atacante = sem dano
    if (attackRoll.isFumble) {
      damage = 0;
    }

    // Defesa crítica = sem dano
    if (defenseRoll.isCritical && !attackRoll.isCritical) {
      damage = 0;
    }

    return {
      attackRoll,
      defenseRoll,
      damage,
      hit: damage > 0,
      isCritical: attackRoll.isCritical,
      isFumble: attackRoll.isFumble,
    };
  }

  // ===========================================================================
  // CÁLCULO PRINCIPAL (SISTEMA ORIGINAL - MANTIDO PARA COMPATIBILIDADE)
  // ===========================================================================

  /**
   * Calcula dano de um ataque (sistema original com tipos)
   */
  calculateDamage(
    attacker: Entity,
    defender: Entity,
    attackType: AttackType,
    isCritical: boolean = false,
    weaponDamage: number = UNARMED_BASE_DAMAGE
  ): number {
    const breakdown = this.calculateDamageBreakdown(
      attacker,
      defender,
      attackType,
      isCritical,
      weaponDamage
    );

    return breakdown.finalDamage;
  }

  /**
   * Calcula dano com breakdown detalhado
   */
  calculateDamageBreakdown(
    attacker: Entity,
    defender: Entity,
    attackType: AttackType,
    isCritical: boolean = false,
    weaponDamage: number = UNARMED_BASE_DAMAGE
  ): DamageBreakdown {
    const config = ATTACK_CONFIGS[attackType];

    // 1. Dano base da arma
    const baseDamage = weaponDamage;

    // 2. Modificador de força (FOR/50)
    const strengthModifier = attacker.stats.for / 50;

    // 3. Multiplicador do tipo de ataque
    const attackTypeMultiplier = config.damageMultiplier;

    // 4. Multiplicador de crítico
    const criticalMultiplier = isCritical ? DEFAULT_CRIT_MULTIPLIER : 1.0;

    // 5. Calcula dano bruto
    const rawDamage = baseDamage * strengthModifier * attackTypeMultiplier * criticalMultiplier;

    // 6. Redução de armadura (assumindo 0 se não tiver)
    const armorValue = 0; // TODO: Implementar sistema de armadura
    const armorReduction = this.calculateArmorReduction(rawDamage, armorValue);

    // 7. Redução de resistência
    const resistance = this.getResistance(defender, config.damageType);
    const resistanceReduction = this.calculateResistanceReduction(rawDamage - armorReduction, resistance);

    // 8. Dano final
    const damageAfterArmor = rawDamage - armorReduction;
    const finalDamage = Math.max(1, Math.round(damageAfterArmor - resistanceReduction));

    // 9. Overkill (dano além do HP atual)
    const overkill = Math.max(0, finalDamage - defender.stats.hp);

    return {
      baseDamage,
      strengthModifier,
      attackTypeMultiplier,
      criticalMultiplier,
      armorReduction,
      resistanceReduction,
      finalDamage,
      damageType: config.damageType,
      overkill,
    };
  }

  // ===========================================================================
  // CÁLCULOS AUXILIARES
  // ===========================================================================

  /**
   * Calcula redução de armadura
   * Armadura reduz dano fixo até um limite
   */
  calculateArmorReduction(damage: number, armorValue: number): number {
    // Armadura reduz dano fixo, mas nunca mais que 80% do dano
    const maxReduction = damage * 0.8;
    return Math.min(armorValue, maxReduction);
  }

  /**
   * Calcula redução por resistência
   * Resistência reduz dano percentual
   */
  calculateResistanceReduction(damage: number, resistance: number): number {
    // Resistência é percentual (0-100)
    // Resistência negativa = vulnerabilidade
    const reductionPercent = resistance / 100;
    return damage * reductionPercent;
  }

  /**
   * Obtém resistência de uma entidade a um tipo de dano
   */
  getResistance(entity: Entity, damageType: DamageType): number {
    // TODO: Implementar sistema de resistências por entidade
    // Por enquanto, usa RES para resistência geral
    const baseResistance = (entity.stats.res - 50) / 5; // -10 a +10 para RES 0-100
    return baseResistance;
  }

  /**
   * Calcula dano de queda
   */
  calculateFallDamage(height: number, entity: Entity): number {
    if (height < 3) return 0; // Menos de 3 metros não causa dano

    const baseDamage = (height - 2) * 10; // 10 de dano por metro acima de 2
    const agilityReduction = entity.stats.agi / 200; // AGI reduz até 50%

    return Math.round(baseDamage * (1 - agilityReduction));
  }

  /**
   * Calcula dano ao longo do tempo (DOT)
   */
  calculateDotDamage(
    baseDamage: number,
    ticksRemaining: number,
    totalTicks: number
  ): number {
    // Dano por tick é constante
    return Math.round(baseDamage / totalTicks);
  }

  /**
   * Calcula dano de área (AOE)
   */
  calculateAoeDamage(
    baseDamage: number,
    distanceFromCenter: number,
    maxRadius: number
  ): number {
    if (distanceFromCenter > maxRadius) return 0;

    // Dano diminui linearmente com distância
    const falloff = 1 - (distanceFromCenter / maxRadius);
    return Math.round(baseDamage * falloff);
  }

  // ===========================================================================
  // CÁLCULOS ESPECIAIS
  // ===========================================================================

  /**
   * Calcula dano de contra-ataque
   */
  calculateCounterDamage(
    attacker: Entity,
    defender: Entity,
    originalDamage: number
  ): number {
    // Contra-ataque causa 50% do dano original + bônus de HAB
    const habBonus = defender.stats.hab / 100;
    return Math.round(originalDamage * 0.5 * (1 + habBonus));
  }

  /**
   * Calcula dano refletido
   */
  calculateReflectedDamage(
    originalDamage: number,
    reflectPercent: number
  ): number {
    return Math.round(originalDamage * (reflectPercent / 100));
  }

  /**
   * Calcula dano de execução (finisher)
   */
  calculateExecutionDamage(
    attacker: Entity,
    defender: Entity,
    hpThreshold: number = 0.2
  ): number {
    // Se HP do defensor está abaixo do threshold, causa dano massivo
    const hpPercent = defender.stats.hp / defender.stats.maxHp;

    if (hpPercent <= hpThreshold) {
      return defender.stats.hp * 2; // Garante a morte
    }

    return 0;
  }
}

// Exporta instância singleton
export const damageCalculator = DamageCalculator.getInstance();

export default DamageCalculator;

// =============================================================================
// TODO: Fase 4 - Implementar
// =============================================================================
// - Sistema de armadura por parte do corpo
// - Sistema de resistências elementais
// - Dano verdadeiro (ignora armadura)
// - Dano por sangramento
// - Dano por veneno
// - Bônus de dano por posição (backstab, flanking)
