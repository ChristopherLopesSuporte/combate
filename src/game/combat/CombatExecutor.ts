/**
 * =============================================================================
 * COMBAT EXECUTOR - EXECUTOR DE COMBATE NO SISTEMA DE FASES
 * =============================================================================
 *
 * Responsabilidade ÚNICA: Integrar o sistema de combate simplificado
 * com o sistema de fases (PhaseManager) existente.
 *
 * Converte PlannedActions em CombatIntents e executa resoluções.
 */

import type { Entity, Position3D } from '../types';
import type { PlannedAction } from '../systems/PhaseManager';
import { ActionType } from '../systems/PhaseManager';
import type { CombatIntent, CombatResolution } from './SimpleCombat.types';
import { SimpleCombatAction, DEFAULT_COMBAT_CONFIG } from './SimpleCombat.types';
import { resolveCombat, createIdleIntent } from './SimpleCombatResolver';
import { sortByExecutionTime } from './TimeResolver';

// =============================================================================
// CONVERSÃO DE AÇÕES
// =============================================================================

/**
 * Converte PlannedAction do PhaseManager em CombatIntent
 */
export function plannedActionToCombatIntent(action: PlannedAction): CombatIntent {
  switch (action.type) {
    case ActionType.ATTACK:
      return {
        entityId: action.entityId,
        action: SimpleCombatAction.ATTACK,
        targetId: action.targetId,
        timeMs: action.currentTimeMs,
      };

    case ActionType.MOVE:
      return {
        entityId: action.entityId,
        action: SimpleCombatAction.MOVE,
        targetPosition: action.targetPosition,
        timeMs: action.currentTimeMs,
      };

    case ActionType.DEFEND:
      return {
        entityId: action.entityId,
        action: SimpleCombatAction.DEFEND,
        timeMs: action.currentTimeMs,
      };

    case ActionType.WAIT:
    default:
      return {
        entityId: action.entityId,
        action: SimpleCombatAction.IDLE,
        timeMs: 0,
      };
  }
}

// =============================================================================
// DETECÇÃO DE PARES DE COMBATE
// =============================================================================

/**
 * Par de combate identificado
 */
export interface CombatPairInfo {
  attackerId: string;
  defenderId: string;
  attackerIntent: CombatIntent;
  defenderIntent: CombatIntent;
}

/**
 * Identifica pares de combate a partir das ações planejadas
 */
export function identifyCombatPairs(
  actions: PlannedAction[],
  entities: Entity[]
): CombatPairInfo[] {
  const pairs: CombatPairInfo[] = [];
  const intents = new Map<string, CombatIntent>();

  // Converte todas as ações em intents
  for (const action of actions) {
    intents.set(action.entityId, plannedActionToCombatIntent(action));
  }

  // Encontra ataques e seus alvos
  for (const action of actions) {
    if (action.type === ActionType.ATTACK && action.targetId) {
      const attackerIntent = intents.get(action.entityId);
      let defenderIntent = intents.get(action.targetId);

      if (!attackerIntent) continue;

      // Se defensor não tem ação planejada, assume IDLE
      if (!defenderIntent) {
        defenderIntent = createIdleIntent(action.targetId);
      }

      pairs.push({
        attackerId: action.entityId,
        defenderId: action.targetId,
        attackerIntent,
        defenderIntent,
      });
    }
  }

  return pairs;
}

// =============================================================================
// EXECUÇÃO DE COMBATES
// =============================================================================

/**
 * Resultado de execução de combate
 */
export interface CombatExecutionResult {
  /** Resoluções de todos os combates */
  resolutions: CombatResolution[];
  /** Danos a aplicar (entityId -> damage) */
  damageToApply: Map<string, number>;
  /** Movimentos a executar (entityId -> position) */
  movementsToExecute: Map<string, Position3D>;
  /** Logs para exibir */
  logs: string[];
}

/**
 * Executa todos os combates de um turno
 */
export function executeTurnCombats(
  actions: PlannedAction[],
  entities: Entity[]
): CombatExecutionResult {
  const result: CombatExecutionResult = {
    resolutions: [],
    damageToApply: new Map(),
    movementsToExecute: new Map(),
    logs: [],
  };

  // Cria mapa de entidades
  const entityMap = new Map<string, Entity>();
  for (const entity of entities) {
    entityMap.set(entity.id, entity);
  }

  // Identifica pares de combate
  const pairs = identifyCombatPairs(actions, entities);

  // Ordena ações por tempo
  const intents = actions.map(plannedActionToCombatIntent);
  const sortedIntents = sortByExecutionTime(intents);

  result.logs.push(`[CombatExecutor] ${pairs.length} combates identificados`);
  result.logs.push(`[CombatExecutor] Ordem de execução: ${sortedIntents.map(i => i.entityId).join(' -> ')}`);

  // Resolve cada par de combate
  for (const pair of pairs) {
    const attacker = entityMap.get(pair.attackerId);
    const defender = entityMap.get(pair.defenderId);

    if (!attacker || !defender) {
      result.logs.push(`[CombatExecutor] Entidade não encontrada para combate`);
      continue;
    }

    const resolution = resolveCombat(
      attacker,
      defender,
      pair.attackerIntent,
      pair.defenderIntent,
      DEFAULT_COMBAT_CONFIG
    );

    result.resolutions.push(resolution);
    result.logs.push(resolution.description);

    // Acumula dano
    if (resolution.damage) {
      if (resolution.winnerId === attacker.id) {
        // Atacante venceu - dano no defensor
        const currentDamage = result.damageToApply.get(defender.id) || 0;
        result.damageToApply.set(defender.id, currentDamage + resolution.damage);
      } else if (resolution.winnerId === defender.id && pair.defenderIntent.action === SimpleCombatAction.ATTACK) {
        // Defensor venceu atacando - dano no atacante
        const currentDamage = result.damageToApply.get(attacker.id) || 0;
        result.damageToApply.set(attacker.id, currentDamage + resolution.damage);
      }
    }
  }

  // Processa movimentos (não combate)
  for (const action of actions) {
    if (action.type === ActionType.MOVE && action.targetPosition) {
      // Verifica se entidade não está em combate perdedor
      const wasHit = Array.from(result.damageToApply.keys()).includes(action.entityId);

      // Se foi atingido, pode não completar movimento (dependendo do resultado)
      if (!wasHit) {
        result.movementsToExecute.set(action.entityId, action.targetPosition);
        result.logs.push(`[CombatExecutor] ${action.entityId} move para ${action.targetPosition}`);
      }
    }
  }

  return result;
}

/**
 * Aplica resultados de combate às entidades
 */
export function applyCombatResults(
  entities: Entity[],
  results: CombatExecutionResult
): Entity[] {
  return entities.map(entity => {
    let updatedEntity = { ...entity };

    // Aplica dano
    const damage = results.damageToApply.get(entity.id);
    if (damage) {
      updatedEntity = {
        ...updatedEntity,
        stats: {
          ...updatedEntity.stats,
          hp: Math.max(0, updatedEntity.stats.hp - damage),
        },
      };
    }

    // Aplica movimento
    const newPosition = results.movementsToExecute.get(entity.id);
    if (newPosition) {
      updatedEntity = {
        ...updatedEntity,
        position: newPosition,
      };
    }

    return updatedEntity;
  });
}
