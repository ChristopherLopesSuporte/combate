/**
 * =============================================================================
 * PERCEPTION PANEL - PAINEL DE PERCEPÇÃO
 * =============================================================================
 *
 * Interface visual para a fase de percepção do sistema de turnos.
 * Mostra o que cada unidade percebeu sobre os inimigos e permite
 * mudanças de ação com penalidade de 30%.
 */

import React, { useCallback, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { ActionType, TurnPhase } from '../systems/PhaseManager';
import type { PlannedAction, PerceptionResult } from '../systems/PhaseManager';

// =============================================================================
// HELPERS
// =============================================================================

function formatActionDescription(action: PlannedAction, entities: any[]): string {
  switch (action.type) {
    case ActionType.MOVE:
      const pos = action.targetPosition;
      if (pos) {
        return `Mover para (${pos[0].toFixed(1)}, ${pos[2].toFixed(1)})`;
      }
      return 'Mover';
    case ActionType.ATTACK:
      const target = entities.find(e => e.id === action.targetId);
      return `Atacar ${target?.name || 'alvo'}`;
    case ActionType.DEFEND:
      return 'Defender';
    case ActionType.WAIT:
      return 'Esperar';
    case ActionType.USE_ITEM:
      return 'Usar Item';
    case ActionType.SPECIAL:
      return 'Habilidade Especial';
    default:
      return action.type;
  }
}

function getActionTypeName(type: ActionType): string {
  const names: Record<ActionType, string> = {
    [ActionType.MOVE]: 'Movimento',
    [ActionType.ATTACK]: 'Ataque',
    [ActionType.DEFEND]: 'Defesa',
    [ActionType.WAIT]: 'Espera',
    [ActionType.USE_ITEM]: 'Item',
    [ActionType.SPECIAL]: 'Especial',
  };
  return names[type] || type;
}

function getActionIcon(type: ActionType): string {
  const icons: Record<ActionType, string> = {
    [ActionType.MOVE]: '🚶',
    [ActionType.ATTACK]: '⚔️',
    [ActionType.DEFEND]: '🛡️',
    [ActionType.WAIT]: '⏳',
    [ActionType.USE_ITEM]: '🎒',
    [ActionType.SPECIAL]: '✨',
  };
  return icons[type] || '❓';
}

// =============================================================================
// COMPONENTES INTERNOS
// =============================================================================

interface ActionItemProps {
  entity: any;
  action: PlannedAction;
  entities: any[];
  onChangeAction: (entityId: string) => void;
  isEnemy?: boolean;
}

const ActionItem: React.FC<ActionItemProps> = ({
  entity,
  action,
  entities,
  onChangeAction,
  isEnemy = false,
}) => {
  const penaltyMs = action.wasModified ? action.modificationPenalty : 0;

  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-lg transition-all duration-300
        ${isEnemy
          ? 'bg-red-900/40 border-l-4 border-red-500 hover:bg-red-900/60'
          : 'bg-gray-800/70 border-l-4 border-green-500 hover:bg-gray-700/80'
        }
        hover:translate-x-1
      `}
    >
      {/* Ícone da entidade */}
      <div
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          font-bold text-xl text-white shadow-lg flex-shrink-0
          ${isEnemy ? 'ring-2 ring-red-500 animate-pulse' : ''}
        `}
        style={{ backgroundColor: entity.color }}
      >
        {isEnemy ? '⚠️' : entity.name[0]}
      </div>

      {/* Detalhes da ação */}
      <div className="flex-1 flex flex-col gap-1">
        <strong className={`text-lg ${isEnemy ? 'text-red-400' : 'text-white'}`}>
          {entity.name}
        </strong>
        <span className="text-gray-400 text-sm flex items-center gap-2">
          <span>{getActionIcon(action.type)}</span>
          {formatActionDescription(action, entities)}
        </span>
        <span className="text-orange-400 text-xs font-mono">
          ⏱️ {action.currentTimeMs}ms
          {action.wasModified && (
            <span className="text-red-400 ml-2 font-bold">
              (+{penaltyMs}ms penalidade)
            </span>
          )}
        </span>
      </div>

      {/* Botão de mudar ação (só para unidades do jogador) */}
      {!isEnemy && (
        <button
          onClick={() => onChangeAction(entity.id)}
          className="
            px-4 py-2 bg-blue-600 hover:bg-blue-500
            rounded-lg text-white font-bold text-sm
            transition-all duration-300 hover:scale-105
            shadow-lg hover:shadow-blue-500/40
            whitespace-nowrap
          "
        >
          Mudar Ação
        </button>
      )}
    </div>
  );
};

interface PerceptionResultItemProps {
  result: PerceptionResult;
  entities: any[];
  plannedActions: PlannedAction[];
}

const PerceptionResultItem: React.FC<PerceptionResultItemProps> = ({
  result,
  entities,
  plannedActions,
}) => {
  const target = entities.find(e => e.id === result.targetId);
  const targetAction = plannedActions.find(a => a.entityId === result.targetId);

  if (!target) return null;

  return (
    <div className="p-4 bg-red-950/50 rounded-lg border-l-4 border-red-500 transition-all hover:bg-red-900/50 hover:translate-x-1">
      {/* Rolagem */}
      <div className="text-sm text-gray-400 mb-3 font-mono">
        🎲 {result.roll} + {result.perBonus} = <strong className="text-green-400 text-base">{result.total}</strong>
        <span className="mx-2 text-gray-600">vs</span>
        <span>DC {result.difficulty}</span>
        {result.total >= result.difficulty + 10 && (
          <span className="ml-3 text-yellow-400 font-bold animate-pulse">✨ Sucesso Crítico!</span>
        )}
      </div>

      {/* Info do inimigo */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl ring-2 ring-red-500"
          style={{ backgroundColor: target.color }}
        >
          ⚠️
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <strong className="text-red-400">{target.name}</strong>
          {targetAction && (
            <>
              <span className="text-gray-400 text-sm">
                {result.infoRevealed.confidence > 0.7
                  ? formatActionDescription(targetAction, entities)
                  : `Vai fazer algo... (${getActionTypeName(targetAction.type)})`
                }
              </span>
              <span className="text-orange-400 text-xs font-mono">
                ⏱️ ~{targetAction.currentTimeMs}ms
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

interface PerceptionPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onChangeAction?: (entityId: string) => void;
}

export const PerceptionPanel: React.FC<PerceptionPanelProps> = ({
  isOpen = true,
  onClose,
  onChangeAction,
}) => {
  // Estado do store
  const turnPhase = useGameStore(state => state.turnPhase);
  const entities = useGameStore(state => state.entities);
  const plannedActions = useGameStore(state => state.plannedActions);
  const perceptionResults = useGameStore(state => state.perceptionResults);
  const finishPerception = useGameStore(state => state.finishPerception);
  const rollPerception = useGameStore(state => state.rollPerception);

  // Entidades filtradas
  const playerEntities = useMemo(
    () => entities.filter(e => e.isPlayerControlled && e.stats.hp > 0),
    [entities]
  );

  const enemyEntities = useMemo(
    () => entities.filter(e => !e.isPlayerControlled && e.stats.hp > 0),
    [entities]
  );

  // Ações do jogador
  const playerActions = useMemo(
    () => plannedActions.filter(a => playerEntities.some(e => e.id === a.entityId)),
    [plannedActions, playerEntities]
  );

  // Resultados de percepção bem sucedidos
  const successfulPerceptions = useMemo(
    () => perceptionResults.filter(r => r.success),
    [perceptionResults]
  );

  // Handler para rolar todas as percepções
  const handleRollAllPerceptions = useCallback(() => {
    for (const player of playerEntities) {
      for (const enemy of enemyEntities) {
        // Verifica se já rolou
        const alreadyRolled = perceptionResults.some(
          r => r.entityId === player.id && r.targetId === enemy.id
        );
        if (!alreadyRolled) {
          rollPerception(player.id, enemy.id);
        }
      }
    }
  }, [playerEntities, enemyEntities, perceptionResults, rollPerception]);

  // Handler para confirmar e executar
  const handleConfirm = useCallback(() => {
    finishPerception();
  }, [finishPerception]);

  // Handler para mudar ação
  const handleChangeAction = useCallback((entityId: string) => {
    if (onChangeAction) {
      onChangeAction(entityId);
    }
  }, [onChangeAction]);

  // Só mostrar na fase de percepção
  if (turnPhase !== TurnPhase.PERCEPTION || !isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="
          w-[90%] max-w-4xl max-h-[85vh] overflow-y-auto
          bg-gradient-to-br from-gray-900 via-gray-900 to-purple-950
          border-4 border-orange-500 rounded-2xl p-6
          shadow-2xl shadow-orange-500/30
          animate-in fade-in slide-in-from-bottom-4 duration-300
        "
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-orange-500 drop-shadow-lg">
            ⚠️ FASE: PERCEPÇÃO
          </h2>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed">
            Veja o que suas unidades perceberam sobre os inimigos.
            Você pode mudar suas ações agora{' '}
            <strong className="text-red-400">(penalidade: +30% tempo)</strong>.
          </p>
        </div>

        {/* Suas Ações Planejadas */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-green-400 border-b-2 border-green-500 pb-2 mb-4">
            📋 Suas Ações Planejadas
          </h3>
          <div className="flex flex-col gap-3">
            {playerActions.map(action => {
              const entity = playerEntities.find(e => e.id === action.entityId);
              if (!entity) return null;

              return (
                <ActionItem
                  key={action.id}
                  entity={entity}
                  action={action}
                  entities={entities}
                  onChangeAction={handleChangeAction}
                />
              );
            })}
            {playerActions.length === 0 && (
              <p className="text-gray-500 italic text-center py-4">
                Nenhuma ação planejada
              </p>
            )}
          </div>
        </section>

        {/* Percepções */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-yellow-400 border-b-2 border-yellow-500 pb-2 mb-4">
            👁️ O que Suas Unidades Perceberam
          </h3>

          {/* Botão para rolar percepções */}
          {perceptionResults.length === 0 && (
            <button
              onClick={handleRollAllPerceptions}
              className="
                w-full py-3 mb-4 bg-yellow-600 hover:bg-yellow-500
                text-black font-bold rounded-lg transition-all
                hover:scale-[1.02] shadow-lg hover:shadow-yellow-500/40
              "
            >
              👁️ Rolar Todas as Percepções
            </button>
          )}

          {/* Resultados por jogador */}
          {playerEntities.map(observer => {
            const results = perceptionResults.filter(r => r.entityId === observer.id);
            const successful = results.filter(r => r.success);

            return (
              <div key={observer.id} className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-green-500/30">
                <strong className="text-green-400 block mb-3">
                  {observer.name} percebeu:
                </strong>

                {results.length === 0 ? (
                  <span className="text-gray-500 italic">Aguardando rolagem...</span>
                ) : successful.length === 0 ? (
                  <span className="text-gray-500">❌ Não percebeu nada</span>
                ) : (
                  <div className="flex flex-col gap-3">
                    {successful.map((result, idx) => (
                      <PerceptionResultItem
                        key={idx}
                        result={result}
                        entities={entities}
                        plannedActions={plannedActions}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Botões de ação */}
        <div className="text-center pt-4 border-t-2 border-gray-700">
          <button
            onClick={handleConfirm}
            disabled={perceptionResults.length === 0}
            className={`
              px-12 py-4 text-xl font-bold rounded-xl transition-all duration-300
              ${perceptionResults.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-500 text-white hover:scale-105 shadow-lg hover:shadow-green-500/40'
              }
            `}
          >
            ✓ Confirmar e Executar Ações
          </button>
          <p className="text-gray-500 text-sm mt-3 italic">
            Ou mude ações acima antes de confirmar
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerceptionPanel;
