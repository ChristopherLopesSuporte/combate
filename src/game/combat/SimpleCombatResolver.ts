/**
 * =============================================================================
 * SIMPLE COMBAT RESOLVER - RESOLUÇÃO DE COMBATE SIMPLIFICADO
 * =============================================================================
 *
 * Responsabilidade ÚNICA: Resolver um combate entre duas entidades
 * baseado em suas intenções.
 *
 * Regras do usuário:
 * 1. Se jogador1 ataca jogador2 e jogador2 não faz nada → ataque acontece
 * 2. Se jogador2 se move → jogador1 precisa de teste de percepção para reagir
 * 3. Quem tem tempo menor ataca/age primeiro
 * 4. Defesa pode bloquear ataque se for mais rápida
 */

import type { Entity } from '../types';
import type {
  CombatIntent,
  CombatPair,
  CombatResolution,
  SimpleCombatConfig,
} from './SimpleCombat.types';
import { SimpleCombatAction, CombatOutcome, DEFAULT_COMBAT_CONFIG } from './SimpleCombat.types';
import { compareActionTimes } from './TimeResolver';
import { performPerceptionCheck } from './PerceptionCheck';

// =============================================================================
// FUNÇÃO PRINCIPAL DE RESOLUÇÃO
// =============================================================================

/**
 * Resolve um combate entre atacante e defensor
 *
 * @param attacker - Entidade atacante
 * @param defender - Entidade defensora
 * @param attackerIntent - Intenção do atacante
 * @param defenderIntent - Intenção do defensor
 * @param config - Configuração do sistema
 * @returns Resultado da resolução
 */
export function resolveCombat(
  attacker: Entity,
  defender: Entity,
  attackerIntent: CombatIntent,
  defenderIntent: CombatIntent,
  config: SimpleCombatConfig = DEFAULT_COMBAT_CONFIG
): CombatResolution {
  // Se atacante não está atacando, não há combate
  if (attackerIntent.action !== SimpleCombatAction.ATTACK) {
    return {
      outcome: CombatOutcome.NO_COMBAT,
      description: 'Atacante não executou ataque',
    };
  }

  // Se o alvo do ataque não é o defensor, não há combate direto
  if (attackerIntent.targetId !== defender.id) {
    return {
      outcome: CombatOutcome.NO_COMBAT,
      description: 'Ataque direcionado a outro alvo',
    };
  }

  // Compara tempos
  const timeComparison = compareActionTimes(attackerIntent, defenderIntent);

  // CASO 1: Defensor está parado (IDLE) - ataque acontece normalmente
  if (defenderIntent.action === SimpleCombatAction.IDLE) {
    return {
      outcome: CombatOutcome.ATTACKER_HITS,
      winnerId: attacker.id,
      damage: config.baseDamage,
      timeComparison,
      description: `${attacker.name} ataca ${defender.name} que não reagiu!`,
    };
  }

  // CASO 2: Defensor tenta MOVER - atacante precisa de percepção
  if (defenderIntent.action === SimpleCombatAction.MOVE) {
    const perceptionCheck = performPerceptionCheck(attacker, defender, true);

    if (!perceptionCheck.success) {
      // Atacante não percebeu o movimento - defensor escapa
      return {
        outcome: CombatOutcome.DEFENDER_EVADES,
        winnerId: defender.id,
        perceptionCheck,
        timeComparison,
        description: `${defender.name} se moveu e ${attacker.name} não percebeu a tempo!`,
      };
    }

    // Atacante percebeu - verifica quem é mais rápido
    if (timeComparison.fasterId === attacker.id) {
      // Atacante mais rápido - acerta antes do movimento
      return {
        outcome: CombatOutcome.ATTACKER_HITS,
        winnerId: attacker.id,
        damage: config.baseDamage,
        perceptionCheck,
        timeComparison,
        description: `${attacker.name} percebeu o movimento e atacou primeiro!`,
      };
    } else {
      // Defensor mais rápido - escapa
      return {
        outcome: CombatOutcome.DEFENDER_EVADES,
        winnerId: defender.id,
        perceptionCheck,
        timeComparison,
        description: `${defender.name} se moveu mais rápido que o ataque!`,
      };
    }
  }

  // CASO 3: Defensor tenta DEFENDER
  if (defenderIntent.action === SimpleCombatAction.DEFEND) {
    // Verifica quem é mais rápido
    if (timeComparison.fasterId === defender.id) {
      // Defesa mais rápida - bloqueia
      return {
        outcome: CombatOutcome.DEFENDER_BLOCKS,
        winnerId: defender.id,
        timeComparison,
        description: `${defender.name} bloqueou o ataque de ${attacker.name}!`,
      };
    } else {
      // Ataque mais rápido - acerta antes da defesa
      return {
        outcome: CombatOutcome.ATTACKER_HITS,
        winnerId: attacker.id,
        damage: config.baseDamage,
        timeComparison,
        description: `${attacker.name} atacou antes de ${defender.name} conseguir defender!`,
      };
    }
  }

  // CASO 4: Defensor também está ATACANDO (combate mútuo)
  if (defenderIntent.action === SimpleCombatAction.ATTACK) {
    // Verifica quem é mais rápido
    if (timeComparison.isTie) {
      // Empate - ambos acertam
      return {
        outcome: CombatOutcome.BOTH_HIT,
        damage: config.baseDamage,
        timeComparison,
        description: `${attacker.name} e ${defender.name} se acertam simultaneamente!`,
      };
    }

    if (timeComparison.fasterId === attacker.id) {
      return {
        outcome: CombatOutcome.ATTACKER_HITS,
        winnerId: attacker.id,
        damage: config.baseDamage,
        timeComparison,
        description: `${attacker.name} foi mais rápido e acertou ${defender.name}!`,
      };
    } else {
      // Defensor atacou primeiro
      return {
        outcome: CombatOutcome.ATTACKER_HITS, // Do ponto de vista do defensor
        winnerId: defender.id,
        damage: config.baseDamage,
        timeComparison,
        description: `${defender.name} foi mais rápido e acertou ${attacker.name}!`,
      };
    }
  }

  // Caso padrão - ataque acerta
  return {
    outcome: CombatOutcome.ATTACKER_HITS,
    winnerId: attacker.id,
    damage: config.baseDamage,
    timeComparison,
    description: `${attacker.name} acerta ${defender.name}!`,
  };
}

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Cria uma intenção de combate
 *
 * @param entityId - ID da entidade
 * @param action - Tipo de ação
 * @param timeMs - Tempo em ms
 * @param targetId - ID do alvo (opcional)
 * @param targetPosition - Posição alvo (opcional)
 * @returns Intenção de combate
 */
export function createIntent(
  entityId: string,
  action: SimpleCombatAction,
  timeMs: number,
  targetId?: string,
  targetPosition?: [number, number, number]
): CombatIntent {
  return {
    entityId,
    action,
    timeMs,
    targetId,
    targetPosition,
  };
}

/**
 * Cria intenção de ataque
 */
export function createAttackIntent(
  entityId: string,
  targetId: string,
  timeMs: number = DEFAULT_COMBAT_CONFIG.timings.attack
): CombatIntent {
  return createIntent(entityId, SimpleCombatAction.ATTACK, timeMs, targetId);
}

/**
 * Cria intenção de movimento
 */
export function createMoveIntent(
  entityId: string,
  targetPosition: [number, number, number],
  timeMs: number = DEFAULT_COMBAT_CONFIG.timings.move
): CombatIntent {
  return createIntent(entityId, SimpleCombatAction.MOVE, timeMs, undefined, targetPosition);
}

/**
 * Cria intenção de defesa
 */
export function createDefendIntent(
  entityId: string,
  timeMs: number = DEFAULT_COMBAT_CONFIG.timings.defend
): CombatIntent {
  return createIntent(entityId, SimpleCombatAction.DEFEND, timeMs);
}

/**
 * Cria intenção de não fazer nada
 */
export function createIdleIntent(entityId: string): CombatIntent {
  return createIntent(entityId, SimpleCombatAction.IDLE, 0);
}

/**
 * Resolve múltiplos combates de uma vez
 *
 * @param pairs - Lista de pares de combate
 * @param entities - Mapa de entidades por ID
 * @param config - Configuração
 * @returns Lista de resoluções
 */
export function resolveAllCombats(
  pairs: CombatPair[],
  entities: Map<string, Entity>,
  config: SimpleCombatConfig = DEFAULT_COMBAT_CONFIG
): CombatResolution[] {
  return pairs.map(pair => {
    const attacker = entities.get(pair.attacker.entityId);
    const defender = entities.get(pair.defender.entityId);

    if (!attacker || !defender) {
      return {
        outcome: CombatOutcome.NO_COMBAT,
        description: 'Entidade não encontrada',
      };
    }

    return resolveCombat(attacker, defender, pair.attacker, pair.defender, config);
  });
}
