/**
 * =============================================================================
 * SIMPLE COMBAT TYPES - TIPOS DO SISTEMA DE COMBATE SIMPLIFICADO
 * =============================================================================
 *
 * Tipos e interfaces para o sistema de combate simplificado.
 * Seguindo princípios de Estrutura.md:
 * - Um arquivo = Uma responsabilidade
 * - Interfaces claras e bem definidas
 * - Nomenclatura descritiva
 */

import type { Position3D } from '../types';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Tipos de ação de combate simplificado
 */
export enum SimpleCombatAction {
  ATTACK = 'attack',   // Atacar um alvo
  MOVE = 'move',       // Mover para posição
  DEFEND = 'defend',   // Defender (bloqueia/esquiva)
  IDLE = 'idle',       // Não fazer nada
}

/**
 * Resultado de uma resolução de combate
 */
export enum CombatOutcome {
  ATTACKER_HITS = 'attacker_hits',         // Atacante acerta
  DEFENDER_EVADES = 'defender_evades',     // Defensor evade
  DEFENDER_BLOCKS = 'defender_blocks',     // Defensor bloqueia
  BOTH_HIT = 'both_hit',                   // Ambos acertam (combate simultâneo)
  MISS = 'miss',                           // Ataque erra
  NO_COMBAT = 'no_combat',                 // Não houve combate
}

// =============================================================================
// INTERFACES - AÇÕES
// =============================================================================

/**
 * Ação planejada por uma entidade
 */
export interface CombatIntent {
  /** ID da entidade que executa */
  entityId: string;
  /** Tipo da ação */
  action: SimpleCombatAction;
  /** ID do alvo (para ataques) */
  targetId?: string;
  /** Posição destino (para movimento) */
  targetPosition?: Position3D;
  /** Tempo da ação em ms */
  timeMs: number;
}

/**
 * Par de intenções de combate (atacante vs defensor)
 */
export interface CombatPair {
  /** Intenção do atacante */
  attacker: CombatIntent;
  /** Intenção do defensor */
  defender: CombatIntent;
}

// =============================================================================
// INTERFACES - RESULTADOS
// =============================================================================

/**
 * Resultado de comparação de tempo
 */
export interface TimeComparison {
  /** ID de quem age primeiro */
  fasterId: string;
  /** ID de quem age depois */
  slowerId: string;
  /** Diferença de tempo em ms */
  timeDifferenceMs: number;
  /** Se os tempos são iguais (empate) */
  isTie: boolean;
}

/**
 * Resultado de teste de percepção
 */
export interface PerceptionCheckResult {
  /** Se a percepção foi bem sucedida */
  success: boolean;
  /** Rolagem do dado (1-100) */
  roll: number;
  /** Valor de percepção da entidade */
  perceptionValue: number;
  /** Dificuldade do teste */
  difficulty: number;
  /** Se pode reagir à ação */
  canReact: boolean;
}

/**
 * Resultado final de uma resolução de combate
 */
export interface CombatResolution {
  /** Resultado geral do combate */
  outcome: CombatOutcome;
  /** ID do vencedor (se houver) */
  winnerId?: string;
  /** Dano causado (se houver) */
  damage?: number;
  /** Se houve teste de percepção */
  perceptionCheck?: PerceptionCheckResult;
  /** Comparação de tempo */
  timeComparison?: TimeComparison;
  /** Descrição do que aconteceu */
  description: string;
}

// =============================================================================
// INTERFACES - CONFIGURAÇÃO
// =============================================================================

/**
 * Configuração de tempos base de ações
 */
export interface ActionTimings {
  /** Tempo base de ataque em ms */
  attack: number;
  /** Tempo base de movimento em ms */
  move: number;
  /** Tempo base de defesa em ms */
  defend: number;
}

/**
 * Configuração do sistema de combate
 */
export interface SimpleCombatConfig {
  /** Tempos base das ações */
  timings: ActionTimings;
  /** Dificuldade base de percepção (1-100) */
  basePerceptionDifficulty: number;
  /** Bônus de percepção por ponto de PER */
  perceptionBonusPerPoint: number;
  /** Dano base de ataque */
  baseDamage: number;
}

/**
 * Configuração padrão do sistema
 */
export const DEFAULT_COMBAT_CONFIG: SimpleCombatConfig = {
  timings: {
    attack: 500,  // 500ms para atacar
    move: 1000,   // 1s para mover
    defend: 300,  // 300ms para defender
  },
  basePerceptionDifficulty: 50,
  perceptionBonusPerPoint: 1,  // +1% por ponto de PER
  baseDamage: 10,
};
