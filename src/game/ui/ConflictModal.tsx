/**
 * =============================================================================
 * CONFLICT MODAL - MODAL DE RESOLUÇÃO DE CONFLITOS (ATUALIZADO)
 * =============================================================================
 *
 * Modal que aparece quando o jogo pausa para conflitos:
 * - Inimigo avistado
 * - Ataque recebido
 * - Colisão de movimento
 *
 * Atualizado para usar o novo sistema de fases (PhaseManager).
 */

import React, { useCallback, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { TurnPhase, ConflictType, ActionType } from '../systems/PhaseManager';
import type { ConflictEvent, PlannedAction } from '../systems/PhaseManager';

// =============================================================================
// TIPOS
// =============================================================================

interface ConflictModalProps {
  conflict: ConflictEvent;
  onResolve?: (resolution: ConflictResolution) => void;
  onClose?: () => void;
}

interface ConflictResolution {
  conflictId: string;
  action: 'continue' | 'change_action' | 'abort';
  newAction?: {
    type: ActionType;
    targetId?: string;
  };
}

// =============================================================================
// CONFIGURAÇÃO VISUAL POR TIPO DE CONFLITO
// =============================================================================

const conflictConfig: Record<
  ConflictType,
  { icon: string; color: string; bgColor: string; borderColor: string; title: string }
> = {
  [ConflictType.SAME_TARGET]: {
    icon: '🎯',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/50',
    borderColor: 'border-yellow-500',
    title: 'MESMO ALVO',
  },
  [ConflictType.COLLISION]: {
    icon: '💥',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/50',
    borderColor: 'border-orange-500',
    title: 'COLISÃO DETECTADA',
  },
  [ConflictType.COUNTER_ATTACK]: {
    icon: '⚔️',
    color: 'text-red-400',
    bgColor: 'bg-red-900/50',
    borderColor: 'border-red-500',
    title: 'CONTRA-ATAQUE',
  },
  [ConflictType.SIMULTANEOUS]: {
    icon: '⚡',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/50',
    borderColor: 'border-purple-500',
    title: 'AÇÃO SIMULTÂNEA',
  },
};

// =============================================================================
// DESCRIÇÕES DE CONFLITOS
// =============================================================================

function getConflictDescription(conflict: ConflictEvent, entities: any[]): string {
  const entity1 = entities.find(e => e.id === conflict.entityIds[0]);
  const entity2 = entities.find(e => e.id === conflict.entityIds[1]);

  const name1 = entity1?.name || 'Entidade';
  const name2 = entity2?.name || 'Alvo';

  switch (conflict.type) {
    case ConflictType.SAME_TARGET:
      return `${name1} e outra unidade escolheram atacar o mesmo alvo!`;
    case ConflictType.COLLISION:
      return `${name1} e ${name2} estão se movendo para a mesma posição!`;
    case ConflictType.COUNTER_ATTACK:
      return `${name1} e ${name2} estão atacando um ao outro simultaneamente!`;
    case ConflictType.SIMULTANEOUS:
      return `Múltiplas ações estão ocorrendo ao mesmo tempo!`;
    default:
      return 'Um conflito foi detectado.';
  }
}

// =============================================================================
// COMPONENTE DE ENTIDADE ENVOLVIDA
// =============================================================================

interface InvolvedEntityProps {
  entity: any;
  action?: PlannedAction;
  isPlayer?: boolean;
}

const InvolvedEntity: React.FC<InvolvedEntityProps> = ({ entity, action, isPlayer }) => {
  const getActionIcon = (type: ActionType): string => {
    const icons: Record<ActionType, string> = {
      [ActionType.MOVE]: '🚶',
      [ActionType.ATTACK]: '⚔️',
      [ActionType.DEFEND]: '🛡️',
      [ActionType.WAIT]: '⏳',
      [ActionType.USE_ITEM]: '🎒',
      [ActionType.SPECIAL]: '✨',
    };
    return icons[type] || '❓';
  };

  return (
    <div
      className={`
        p-3 rounded-lg border-l-4 transition-all
        ${isPlayer
          ? 'bg-green-900/30 border-green-500'
          : 'bg-red-900/30 border-red-500'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
          style={{ backgroundColor: entity.color }}
        >
          {entity.name[0]}
        </div>
        <div className="flex-1">
          <strong className={isPlayer ? 'text-green-400' : 'text-red-400'}>
            {entity.name}
          </strong>
          {action && (
            <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
              <span>{getActionIcon(action.type)}</span>
              <span>{action.type}</span>
              <span className="text-orange-400 text-xs font-mono">
                ({action.currentTimeMs}ms)
              </span>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          HP: {entity.stats.hp}/{entity.stats.maxHp}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// BOTÕES DE RESOLUÇÃO
// =============================================================================

interface ResolutionButtonProps {
  label: string;
  icon: string;
  description: string;
  color: string;
  onClick: () => void;
}

const ResolutionButton: React.FC<ResolutionButtonProps> = ({
  label,
  icon,
  description,
  color,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg text-left transition-all duration-300
        bg-gray-800/70 hover:bg-gray-700/80
        border-2 border-transparent hover:border-${color}-500
        hover:translate-x-1 hover:shadow-lg
        group
      `}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl group-hover:scale-110 transition-transform">
          {icon}
        </span>
        <div className="flex-1">
          <div className="font-bold text-white">{label}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
        <span className="text-gray-500 group-hover:text-white transition-colors">
          →
        </span>
      </div>
    </button>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL - CONFLICT MODAL
// =============================================================================

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflict,
  onResolve,
  onClose,
}) => {
  const entities = useGameStore(state => state.entities);
  const plannedActions = useGameStore(state => state.plannedActions);
  const currentTurn = useGameStore(state => state.currentTurn);

  // Configuração visual
  const config = conflictConfig[conflict.type];

  // Entidades envolvidas
  const involvedEntities = useMemo(() => {
    return conflict.entityIds.map(id => {
      const entity = entities.find(e => e.id === id);
      const action = plannedActions.find(a => a.entityId === id);
      return { entity, action };
    }).filter(item => item.entity);
  }, [conflict.entityIds, entities, plannedActions]);

  // Descrição do conflito
  const description = useMemo(
    () => getConflictDescription(conflict, entities),
    [conflict, entities]
  );

  // Handlers de resolução
  const handleContinue = useCallback(() => {
    onResolve?.({
      conflictId: conflict.id,
      action: 'continue',
    });
    onClose?.();
  }, [conflict.id, onResolve, onClose]);

  const handleChangeAction = useCallback(() => {
    onResolve?.({
      conflictId: conflict.id,
      action: 'change_action',
    });
    onClose?.();
  }, [conflict.id, onResolve, onClose]);

  const handleAbort = useCallback(() => {
    onResolve?.({
      conflictId: conflict.id,
      action: 'abort',
    });
    onClose?.();
  }, [conflict.id, onResolve, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className={`
          w-[90%] max-w-lg max-h-[85vh] overflow-y-auto
          bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950
          border-4 ${config.borderColor} rounded-2xl
          shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300
        `}
      >
        {/* Header com animação de pulso */}
        <div className={`${config.bgColor} p-5 border-b ${config.borderColor}`}>
          <div className="flex items-center gap-4">
            <span className="text-5xl animate-pulse">{config.icon}</span>
            <div>
              <h2 className={`text-2xl font-bold ${config.color} drop-shadow-lg`}>
                {config.title}
              </h2>
              <p className="text-gray-400 text-sm">
                Turno {currentTurn} • Tempo: {conflict.timeMs}ms
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          {/* Descrição */}
          <div className="mb-5 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-300 leading-relaxed">{description}</p>
          </div>

          {/* Entidades Envolvidas */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
              Entidades Envolvidas
            </h3>
            <div className="flex flex-col gap-2">
              {involvedEntities.map(({ entity, action }) => (
                <InvolvedEntity
                  key={entity!.id}
                  entity={entity}
                  action={action}
                  isPlayer={entity!.isPlayerControlled}
                />
              ))}
            </div>
          </div>

          {/* Opções de Resolução */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">
              Como Resolver?
            </h3>
            <div className="flex flex-col gap-3">
              <ResolutionButton
                icon="▶️"
                label="Continuar"
                description="Mantém as ações como planejadas (conflito será resolvido por tempo)"
                color="green"
                onClick={handleContinue}
              />
              <ResolutionButton
                icon="✏️"
                label="Mudar Ação"
                description="Voltar ao planejamento para ajustar ações (+30% tempo)"
                color="blue"
                onClick={handleChangeAction}
              />
              <ResolutionButton
                icon="🛑"
                label="Cancelar Ações"
                description="Aborta as ações envolvidas no conflito"
                color="red"
                onClick={handleAbort}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-800/50 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500 italic">
            O jogo está pausado até você decidir
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// CONTAINER QUE MONITORA CONFLITOS
// =============================================================================

interface ConflictModalContainerProps {
  onResolve?: (resolution: ConflictResolution) => void;
}

export const ConflictModalContainer: React.FC<ConflictModalContainerProps> = ({
  onResolve,
}) => {
  const turnPhase = useGameStore(state => state.turnPhase);
  const conflicts = useGameStore(state => state.conflicts);

  // Pega o primeiro conflito não resolvido
  const currentConflict = useMemo(
    () => conflicts.find(c => !c.resolved),
    [conflicts]
  );

  // Só mostra na fase de verificação de conflitos e se houver conflito
  if (turnPhase !== TurnPhase.CONFLICT_CHECK || !currentConflict) {
    return null;
  }

  return (
    <ConflictModal
      conflict={currentConflict}
      onResolve={onResolve}
    />
  );
};

export default ConflictModal;
