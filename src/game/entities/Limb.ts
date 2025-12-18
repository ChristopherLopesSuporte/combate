/**
 * =============================================================================
 * LIMB - SISTEMA DE MEMBROS E PARTES DO CORPO
 * =============================================================================
 *
 * Gerencia os membros/partes do corpo das entidades para o sistema de
 * combate localizado. Permite ataques direcionados a partes específicas.
 *
 * TODO: Fase 4 - Implementar sistema completo de membros
 */

// =============================================================================
// TIPOS
// =============================================================================

/** Tipos de membros disponíveis */
export type LimbType =
  | 'head'
  | 'torso'
  | 'leftArm'
  | 'rightArm'
  | 'leftLeg'
  | 'rightLeg'
  | 'leftHand'
  | 'rightHand'
  | 'leftFoot'
  | 'rightFoot';

/** Status de um membro */
export type LimbStatus = 'healthy' | 'injured' | 'crippled' | 'destroyed';

/** Interface de um membro */
export interface ILimb {
  type: LimbType;
  name: string;
  hp: number;
  maxHp: number;
  status: LimbStatus;
  armor: number;
  hitChance: number; // Chance base de acertar este membro (%)
  damageMultiplier: number; // Multiplicador de dano ao acertar
  criticalMultiplier: number; // Multiplicador extra em crítico
}

// =============================================================================
// CONFIGURAÇÕES PADRÃO DE MEMBROS
// =============================================================================

/** Configuração padrão de membros humanoides */
export const DEFAULT_HUMANOID_LIMBS: Record<LimbType, Omit<ILimb, 'hp' | 'maxHp' | 'status'>> = {
  head: {
    type: 'head',
    name: 'Cabeça',
    armor: 0,
    hitChance: 10,
    damageMultiplier: 2.0,
    criticalMultiplier: 3.0,
  },
  torso: {
    type: 'torso',
    name: 'Torso',
    armor: 0,
    hitChance: 40,
    damageMultiplier: 1.0,
    criticalMultiplier: 1.5,
  },
  leftArm: {
    type: 'leftArm',
    name: 'Braço Esquerdo',
    armor: 0,
    hitChance: 10,
    damageMultiplier: 0.8,
    criticalMultiplier: 1.2,
  },
  rightArm: {
    type: 'rightArm',
    name: 'Braço Direito',
    armor: 0,
    hitChance: 10,
    damageMultiplier: 0.8,
    criticalMultiplier: 1.2,
  },
  leftLeg: {
    type: 'leftLeg',
    name: 'Perna Esquerda',
    armor: 0,
    hitChance: 10,
    damageMultiplier: 0.7,
    criticalMultiplier: 1.2,
  },
  rightLeg: {
    type: 'rightLeg',
    name: 'Perna Direita',
    armor: 0,
    hitChance: 10,
    damageMultiplier: 0.7,
    criticalMultiplier: 1.2,
  },
  leftHand: {
    type: 'leftHand',
    name: 'Mão Esquerda',
    armor: 0,
    hitChance: 5,
    damageMultiplier: 0.5,
    criticalMultiplier: 1.0,
  },
  rightHand: {
    type: 'rightHand',
    name: 'Mão Direita',
    armor: 0,
    hitChance: 5,
    damageMultiplier: 0.5,
    criticalMultiplier: 1.0,
  },
  leftFoot: {
    type: 'leftFoot',
    name: 'Pé Esquerdo',
    armor: 0,
    hitChance: 0,
    damageMultiplier: 0.4,
    criticalMultiplier: 1.0,
  },
  rightFoot: {
    type: 'rightFoot',
    name: 'Pé Direito',
    armor: 0,
    hitChance: 0,
    damageMultiplier: 0.4,
    criticalMultiplier: 1.0,
  },
};

// =============================================================================
// CLASSE LIMB
// =============================================================================

/**
 * Representa um membro/parte do corpo de uma entidade
 */
export class Limb implements ILimb {
  type: LimbType;
  name: string;
  hp: number;
  maxHp: number;
  status: LimbStatus;
  armor: number;
  hitChance: number;
  damageMultiplier: number;
  criticalMultiplier: number;

  constructor(type: LimbType, maxHp: number = 20, config?: Partial<ILimb>) {
    const defaultConfig = DEFAULT_HUMANOID_LIMBS[type];

    this.type = type;
    this.name = config?.name || defaultConfig.name;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.status = 'healthy';
    this.armor = config?.armor ?? defaultConfig.armor;
    this.hitChance = config?.hitChance ?? defaultConfig.hitChance;
    this.damageMultiplier = config?.damageMultiplier ?? defaultConfig.damageMultiplier;
    this.criticalMultiplier = config?.criticalMultiplier ?? defaultConfig.criticalMultiplier;
  }

  // ===========================================================================
  // MÉTODOS
  // ===========================================================================

  /**
   * Aplica dano ao membro
   */
  takeDamage(amount: number): { actualDamage: number; statusChanged: boolean } {
    const damageAfterArmor = Math.max(0, amount - this.armor);
    const previousStatus = this.status;

    this.hp = Math.max(0, this.hp - damageAfterArmor);
    this.updateStatus();

    return {
      actualDamage: damageAfterArmor,
      statusChanged: this.status !== previousStatus,
    };
  }

  /**
   * Cura o membro
   */
  heal(amount: number): number {
    const actualHeal = Math.min(amount, this.maxHp - this.hp);
    this.hp += actualHeal;
    this.updateStatus();
    return actualHeal;
  }

  /**
   * Atualiza o status baseado no HP
   */
  private updateStatus(): void {
    const hpPercent = this.hp / this.maxHp;

    if (hpPercent <= 0) {
      this.status = 'destroyed';
    } else if (hpPercent <= 0.25) {
      this.status = 'crippled';
    } else if (hpPercent <= 0.5) {
      this.status = 'injured';
    } else {
      this.status = 'healthy';
    }
  }

  /**
   * Verifica se o membro pode ser usado
   */
  isUsable(): boolean {
    return this.status !== 'destroyed' && this.status !== 'crippled';
  }

  /**
   * Retorna penalidade baseada no status
   */
  getStatusPenalty(): number {
    switch (this.status) {
      case 'healthy':
        return 0;
      case 'injured':
        return 0.1; // 10% penalidade
      case 'crippled':
        return 0.5; // 50% penalidade
      case 'destroyed':
        return 1.0; // 100% penalidade (inutilizável)
      default:
        return 0;
    }
  }
}

export default Limb;

// =============================================================================
// TODO: Fase 4 - Implementar
// =============================================================================
// - Sistema de sangramento por membro
// - Efeitos visuais por status
// - Sistema de tratamento/cura por membro
// - Equipamento específico por membro (luvas, botas, etc.)
// - Ataques que visam membros específicos
