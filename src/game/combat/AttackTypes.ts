/**
 * =============================================================================
 * ATTACK TYPES - TIPOS DE ATAQUE
 * =============================================================================
 *
 * Define os diferentes tipos de ataques disponíveis no sistema de combate.
 * Baseado no Sistema de Combate RPG v3.
 *
 * TODO: Fase 4 - Expandir com mais tipos de ataque
 */

// =============================================================================
// TIPOS DE ATAQUE
// =============================================================================

/** Tipos de ataque disponíveis */
export type AttackType =
  | 'jab'       // Ataque rápido (50% dano, tempo reduzido)
  | 'normal'    // Ataque normal (100% dano)
  | 'heavy'     // Ataque pesado (150% dano, mais lento)
  | 'thrust'    // Estocada (perfurante)
  | 'slash'     // Corte (cortante)
  | 'smash'     // Esmagamento (contundente)
  | 'special';  // Habilidades especiais

/** Tipos de dano */
export type DamageType = 'slashing' | 'piercing' | 'bludgeoning' | 'magical' | 'elemental';

// =============================================================================
// CONFIGURAÇÕES DE ATAQUE
// =============================================================================

/** Configuração de um tipo de ataque */
export interface AttackConfig {
  name: string;
  description: string;
  baseTimeMs: number;          // Tempo base em milissegundos
  timeMultiplier: number;      // Multiplicador de tempo
  damageMultiplier: number;    // Multiplicador de dano
  staminaCost: number;         // Custo de stamina (se implementado)
  hitModifier: number;         // Modificador de chance de acerto (%)
  critModifier: number;        // Modificador de chance de crítico (%)
  damageType: DamageType;      // Tipo de dano principal
  canBeParried: boolean;       // Pode ser aparado
  canBeDodged: boolean;        // Pode ser esquivado
  knockbackForce: number;      // Força de empurrão (0-1)
}

/** Configurações de todos os tipos de ataque */
export const ATTACK_CONFIGS: Record<AttackType, AttackConfig> = {
  jab: {
    name: 'Jab',
    description: 'Ataque rápido com metade do dano',
    baseTimeMs: 150,
    timeMultiplier: 0.5,
    damageMultiplier: 0.5,
    staminaCost: 5,
    hitModifier: 10,
    critModifier: -5,
    damageType: 'bludgeoning',
    canBeParried: true,
    canBeDodged: true,
    knockbackForce: 0.1,
  },

  normal: {
    name: 'Ataque Normal',
    description: 'Ataque padrão com dano completo',
    baseTimeMs: 300,
    timeMultiplier: 1.0,
    damageMultiplier: 1.0,
    staminaCost: 10,
    hitModifier: 0,
    critModifier: 0,
    damageType: 'slashing',
    canBeParried: true,
    canBeDodged: true,
    knockbackForce: 0.2,
  },

  heavy: {
    name: 'Ataque Pesado',
    description: 'Ataque lento mas devastador',
    baseTimeMs: 500,
    timeMultiplier: 1.5,
    damageMultiplier: 1.5,
    staminaCost: 20,
    hitModifier: -10,
    critModifier: 10,
    damageType: 'slashing',
    canBeParried: true,
    canBeDodged: true,
    knockbackForce: 0.5,
  },

  thrust: {
    name: 'Estocada',
    description: 'Ataque perfurante direto',
    baseTimeMs: 250,
    timeMultiplier: 0.8,
    damageMultiplier: 0.9,
    staminaCost: 12,
    hitModifier: 5,
    critModifier: 15,
    damageType: 'piercing',
    canBeParried: true,
    canBeDodged: true,
    knockbackForce: 0.1,
  },

  slash: {
    name: 'Corte',
    description: 'Ataque cortante em arco',
    baseTimeMs: 350,
    timeMultiplier: 1.1,
    damageMultiplier: 1.1,
    staminaCost: 15,
    hitModifier: 5,
    critModifier: 5,
    damageType: 'slashing',
    canBeParried: true,
    canBeDodged: true,
    knockbackForce: 0.3,
  },

  smash: {
    name: 'Esmagamento',
    description: 'Ataque contundente poderoso',
    baseTimeMs: 450,
    timeMultiplier: 1.3,
    damageMultiplier: 1.3,
    staminaCost: 18,
    hitModifier: -5,
    critModifier: 0,
    damageType: 'bludgeoning',
    canBeParried: false,
    canBeDodged: true,
    knockbackForce: 0.6,
  },

  special: {
    name: 'Especial',
    description: 'Habilidade especial',
    baseTimeMs: 400,
    timeMultiplier: 1.0,
    damageMultiplier: 1.2,
    staminaCost: 25,
    hitModifier: 0,
    critModifier: 10,
    damageType: 'magical',
    canBeParried: false,
    canBeDodged: true,
    knockbackForce: 0.4,
  },
};

// =============================================================================
// COMBOS E SEQUÊNCIAS
// =============================================================================

/** Definição de um combo */
export interface ComboDefinition {
  name: string;
  sequence: AttackType[];
  bonusDamage: number;       // Bônus de dano ao completar (%)
  bonusSpeed: number;        // Bônus de velocidade nos ataques seguintes (%)
  maxTimeBetweenMs: number;  // Tempo máximo entre ataques para manter combo
}

/** Combos pré-definidos */
export const COMBO_DEFINITIONS: ComboDefinition[] = [
  {
    name: 'Jab Duplo',
    sequence: ['jab', 'jab'],
    bonusDamage: 10,
    bonusSpeed: 5,
    maxTimeBetweenMs: 500,
  },
  {
    name: 'Combo Básico',
    sequence: ['jab', 'normal', 'heavy'],
    bonusDamage: 25,
    bonusSpeed: 0,
    maxTimeBetweenMs: 600,
  },
  {
    name: 'Rajada Rápida',
    sequence: ['jab', 'jab', 'thrust'],
    bonusDamage: 20,
    bonusSpeed: 10,
    maxTimeBetweenMs: 400,
  },
  {
    name: 'Golpe Devastador',
    sequence: ['normal', 'slash', 'heavy'],
    bonusDamage: 35,
    bonusSpeed: -5,
    maxTimeBetweenMs: 700,
  },
];

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Obtém configuração de um tipo de ataque
 */
export function getAttackConfig(type: AttackType): AttackConfig {
  return ATTACK_CONFIGS[type];
}

/**
 * Calcula dano base de um ataque
 */
export function getBaseDamage(type: AttackType, weaponDamage: number): number {
  const config = ATTACK_CONFIGS[type];
  return Math.round(weaponDamage * config.damageMultiplier);
}

/**
 * Obtém tempo base de um ataque
 */
export function getBaseTime(type: AttackType): number {
  return ATTACK_CONFIGS[type].baseTimeMs;
}

/**
 * Verifica se um tipo de ataque pode ser aparado
 */
export function canParry(type: AttackType): boolean {
  return ATTACK_CONFIGS[type].canBeParried;
}

/**
 * Verifica se um tipo de ataque pode ser esquivado
 */
export function canDodge(type: AttackType): boolean {
  return ATTACK_CONFIGS[type].canBeDodged;
}

export default ATTACK_CONFIGS;

// =============================================================================
// TODO: Fase 4 - Implementar
// =============================================================================
// - Mais tipos de ataque (sweep, uppercut, charge, etc.)
// - Sistema de combo em tempo real
// - Ataques especiais por arma
// - Ataques mágicos
// - Ataques à distância
