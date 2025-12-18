/**
 * =============================================================================
 * PERCEPTION CHECK - VERIFICAÇÃO DE PERCEPÇÃO SIMPLIFICADA
 * =============================================================================
 *
 * Responsabilidade ÚNICA: Realizar testes de percepção para determinar
 * se uma entidade pode reagir à ação de outra.
 *
 * Regras simplificadas:
 * - Rola d100
 * - Soma percepção da entidade
 * - Compara com dificuldade
 * - Se passar, pode reagir
 */

import type { Entity } from '../types';
import type { PerceptionCheckResult, SimpleCombatConfig } from './SimpleCombat.types';
import { DEFAULT_COMBAT_CONFIG } from './SimpleCombat.types';

// =============================================================================
// FUNÇÕES DE PERCEPÇÃO
// =============================================================================

/**
 * Realiza teste de percepção
 *
 * @param entity - Entidade que tenta perceber
 * @param difficulty - Dificuldade do teste (1-100)
 * @param config - Configuração do sistema
 * @returns Resultado do teste
 */
export function rollPerceptionCheck(
  entity: Entity,
  difficulty: number = DEFAULT_COMBAT_CONFIG.basePerceptionDifficulty,
  config: SimpleCombatConfig = DEFAULT_COMBAT_CONFIG
): PerceptionCheckResult {
  // Rola d100 (1-100)
  const roll = Math.floor(Math.random() * 100) + 1;

  // Calcula bônus de percepção
  const perceptionValue = entity.stats.per;
  const bonus = perceptionValue * config.perceptionBonusPerPoint;

  // Total = rolagem + bônus de percepção
  const total = roll + bonus;

  // Sucesso se total >= dificuldade
  const success = total >= difficulty;

  return {
    success,
    roll,
    perceptionValue,
    difficulty,
    canReact: success,
  };
}

/**
 * Calcula dificuldade de percepção baseada na situação
 *
 * @param isTargetMoving - Se o alvo está se movendo
 * @param distance - Distância entre entidades
 * @param baseConfig - Configuração base
 * @returns Dificuldade ajustada
 */
export function calculatePerceptionDifficulty(
  isTargetMoving: boolean,
  distance: number,
  baseConfig: SimpleCombatConfig = DEFAULT_COMBAT_CONFIG
): number {
  let difficulty = baseConfig.basePerceptionDifficulty;

  // Movimento é mais fácil de perceber
  if (isTargetMoving) {
    difficulty -= 20;
  }

  // Distância aumenta dificuldade
  // +5 de dificuldade por metro de distância
  difficulty += Math.floor(distance * 5);

  // Limita entre 10 e 90
  return Math.max(10, Math.min(90, difficulty));
}

/**
 * Verifica se entidade pode perceber ação do alvo
 * Versão simplificada que usa valores padrão
 *
 * @param observer - Entidade que observa
 * @param target - Entidade sendo observada
 * @param isTargetMoving - Se o alvo está se movendo
 * @returns true se percebeu
 */
export function canPerceiveAction(
  observer: Entity,
  target: Entity,
  isTargetMoving: boolean = false
): boolean {
  // Calcula distância
  const dx = target.position[0] - observer.position[0];
  const dz = target.position[2] - observer.position[2];
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Calcula dificuldade
  const difficulty = calculatePerceptionDifficulty(isTargetMoving, distance);

  // Rola teste
  const result = rollPerceptionCheck(observer, difficulty);

  return result.success;
}

/**
 * Teste de percepção com resultado detalhado
 *
 * @param observer - Entidade que observa
 * @param target - Entidade sendo observada
 * @param isTargetMoving - Se o alvo está se movendo
 * @returns Resultado detalhado do teste
 */
export function performPerceptionCheck(
  observer: Entity,
  target: Entity,
  isTargetMoving: boolean = false
): PerceptionCheckResult {
  // Calcula distância
  const dx = target.position[0] - observer.position[0];
  const dz = target.position[2] - observer.position[2];
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Calcula dificuldade
  const difficulty = calculatePerceptionDifficulty(isTargetMoving, distance);

  // Rola teste
  return rollPerceptionCheck(observer, difficulty);
}
