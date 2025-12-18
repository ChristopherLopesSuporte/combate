/**
 * =============================================================================
 * TIME RESOLVER - RESOLUÇÃO DE TEMPO DE COMBATE
 * =============================================================================
 *
 * Responsabilidade ÚNICA: Comparar tempos de ações e determinar quem age primeiro.
 *
 * Regras:
 * - Ação com menor tempo executa primeiro
 * - Em caso de empate, usa prioridade de ação
 * - Retorna comparação clara entre duas ações
 */

import type { CombatIntent, TimeComparison } from './SimpleCombat.types';
import { SimpleCombatAction } from './SimpleCombat.types';

// =============================================================================
// PRIORIDADES DE AÇÃO (usado para desempate)
// =============================================================================

/**
 * Prioridade de ações em caso de tempo igual
 * Menor número = maior prioridade
 */
const ACTION_PRIORITY: Record<SimpleCombatAction, number> = {
  [SimpleCombatAction.DEFEND]: 0,   // Defesa tem maior prioridade
  [SimpleCombatAction.ATTACK]: 1,
  [SimpleCombatAction.MOVE]: 2,
  [SimpleCombatAction.IDLE]: 3,
};

// =============================================================================
// FUNÇÕES DE RESOLUÇÃO DE TEMPO
// =============================================================================

/**
 * Compara duas intenções e determina quem age primeiro
 *
 * @param intentA - Primeira intenção
 * @param intentB - Segunda intenção
 * @returns Comparação de tempo entre as duas ações
 */
export function compareActionTimes(
  intentA: CombatIntent,
  intentB: CombatIntent
): TimeComparison {
  const timeDiff = intentA.timeMs - intentB.timeMs;

  // Se tempos diferentes, o menor vence
  if (timeDiff !== 0) {
    const aIsFaster = timeDiff < 0;
    return {
      fasterId: aIsFaster ? intentA.entityId : intentB.entityId,
      slowerId: aIsFaster ? intentB.entityId : intentA.entityId,
      timeDifferenceMs: Math.abs(timeDiff),
      isTie: false,
    };
  }

  // Tempos iguais - usa prioridade de ação
  const priorityA = ACTION_PRIORITY[intentA.action];
  const priorityB = ACTION_PRIORITY[intentB.action];

  if (priorityA !== priorityB) {
    const aHasPriority = priorityA < priorityB;
    return {
      fasterId: aHasPriority ? intentA.entityId : intentB.entityId,
      slowerId: aHasPriority ? intentB.entityId : intentA.entityId,
      timeDifferenceMs: 0,
      isTie: false,
    };
  }

  // Empate total - primeiro na lista ganha (intentA)
  return {
    fasterId: intentA.entityId,
    slowerId: intentB.entityId,
    timeDifferenceMs: 0,
    isTie: true,
  };
}

/**
 * Ordena lista de intenções por tempo de execução
 *
 * @param intents - Lista de intenções
 * @returns Lista ordenada (menor tempo primeiro)
 */
export function sortByExecutionTime(intents: CombatIntent[]): CombatIntent[] {
  return [...intents].sort((a, b) => {
    // Primeiro por tempo
    if (a.timeMs !== b.timeMs) {
      return a.timeMs - b.timeMs;
    }
    // Depois por prioridade
    return ACTION_PRIORITY[a.action] - ACTION_PRIORITY[b.action];
  });
}

/**
 * Verifica se ação A é mais rápida que ação B
 *
 * @param intentA - Primeira ação
 * @param intentB - Segunda ação
 * @returns true se A é mais rápida
 */
export function isFaster(intentA: CombatIntent, intentB: CombatIntent): boolean {
  const comparison = compareActionTimes(intentA, intentB);
  return comparison.fasterId === intentA.entityId && !comparison.isTie;
}

/**
 * Calcula tempo efetivo de uma ação considerando modificadores
 *
 * @param baseTimeMs - Tempo base em ms
 * @param speedMultiplier - Multiplicador de velocidade (1.0 = normal)
 * @returns Tempo final em ms
 */
export function calculateEffectiveTime(
  baseTimeMs: number,
  speedMultiplier: number = 1.0
): number {
  // Multiplier < 1 = mais rápido, > 1 = mais lento
  return Math.round(baseTimeMs * speedMultiplier);
}
