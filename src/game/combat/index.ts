/**
 * =============================================================================
 * COMBAT MODULE - EXPORTAÇÕES DO MÓDULO DE COMBATE
 * =============================================================================
 *
 * Ponto central de exportação para todos os sistemas de combate.
 * Facilita imports e mantém API limpa.
 */

// =============================================================================
// TIPOS DO COMBATE SIMPLIFICADO
// =============================================================================

export {
  // Enums
  SimpleCombatAction,
  CombatOutcome,
  // Types
  type CombatIntent,
  type CombatPair,
  type TimeComparison,
  type PerceptionCheckResult,
  type CombatResolution,
  type ActionTimings,
  type SimpleCombatConfig,
  // Config
  DEFAULT_COMBAT_CONFIG,
} from './SimpleCombat.types';

// =============================================================================
// RESOLUÇÃO DE TEMPO
// =============================================================================

export {
  compareActionTimes,
  sortByExecutionTime,
  isFaster,
  calculateEffectiveTime,
} from './TimeResolver';

// =============================================================================
// VERIFICAÇÃO DE PERCEPÇÃO
// =============================================================================

export {
  rollPerceptionCheck,
  calculatePerceptionDifficulty,
  canPerceiveAction,
  performPerceptionCheck,
} from './PerceptionCheck';

// =============================================================================
// RESOLUÇÃO DE COMBATE
// =============================================================================

export {
  resolveCombat,
  createIntent,
  createAttackIntent,
  createMoveIntent,
  createDefendIntent,
  createIdleIntent,
  resolveAllCombats,
} from './SimpleCombatResolver';

// =============================================================================
// EXECUTOR DE COMBATE (INTEGRAÇÃO COM PHASES)
// =============================================================================

export {
  plannedActionToCombatIntent,
  identifyCombatPairs,
  executeTurnCombats,
  applyCombatResults,
  type CombatPairInfo,
  type CombatExecutionResult,
} from './CombatExecutor';

// =============================================================================
// SISTEMA LEGADO (MANTIDO PARA COMPATIBILIDADE)
// =============================================================================

export { combatSystem } from './CombatSystem';
export type { CombatResult, CombatAction, CombatState } from './CombatSystem';
