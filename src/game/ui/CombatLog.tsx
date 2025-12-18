/**
 * =============================================================================
 * COMBAT LOG - LOG DE COMBATE
 * =============================================================================
 *
 * Exibe as últimas mensagens de combate em uma lista rolável.
 * Mensagens são coloridas por tipo de ação.
 */

import React, { useEffect, useRef } from 'react';

// =============================================================================
// TIPOS
// =============================================================================

/** Tipo de mensagem de combate */
export type CombatLogType =
  | 'attack'    // Ataque normal
  | 'critical'  // Acerto crítico
  | 'miss'      // Errou
  | 'damage'    // Dano causado
  | 'heal'      // Cura
  | 'death'     // Morte
  | 'info'      // Informação geral
  | 'system';   // Sistema

/** Entrada no log de combate */
export interface CombatLogEntry {
  /** ID único da mensagem */
  id: string;
  /** Texto da mensagem */
  message: string;
  /** Tipo da mensagem */
  type: CombatLogType;
  /** Timestamp */
  timestamp: number;
}

interface CombatLogProps {
  /** Lista de entradas do log */
  entries: CombatLogEntry[];
  /** Número máximo de mensagens visíveis */
  maxVisible?: number;
  /** Posição do log */
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

// =============================================================================
// CORES POR TIPO
// =============================================================================

const LOG_COLORS: Record<CombatLogType, string> = {
  attack: 'text-orange-400',
  critical: 'text-yellow-400',
  miss: 'text-gray-400',
  damage: 'text-red-400',
  heal: 'text-green-400',
  death: 'text-purple-400',
  info: 'text-blue-400',
  system: 'text-gray-500',
};

const LOG_ICONS: Record<CombatLogType, string> = {
  attack: '⚔️',
  critical: '💥',
  miss: '❌',
  damage: '🩸',
  heal: '💚',
  death: '💀',
  info: 'ℹ️',
  system: '⚙️',
};

// =============================================================================
// POSIÇÕES
// =============================================================================

const POSITION_CLASSES: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'bottom-right': 'bottom-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-left': 'bottom-4 left-4',
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export const CombatLog: React.FC<CombatLogProps> = ({
  entries,
  maxVisible = 7,
  position = 'top-right',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  // Pega apenas as últimas mensagens
  const visibleEntries = entries.slice(-maxVisible);

  if (visibleEntries.length === 0) {
    return null;
  }

  return (
    <div
      className={`absolute ${POSITION_CLASSES[position]} w-80 max-h-64 bg-gray-900 bg-opacity-90 rounded-lg overflow-hidden pointer-events-auto`}
    >
      {/* Header */}
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-300">Log de Combate</span>
      </div>

      {/* Lista de mensagens */}
      <div
        ref={scrollRef}
        className="p-2 overflow-y-auto max-h-48 space-y-1"
      >
        {visibleEntries.map((entry) => (
          <CombatLogItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// ITEM DO LOG
// =============================================================================

interface CombatLogItemProps {
  entry: CombatLogEntry;
}

const CombatLogItem: React.FC<CombatLogItemProps> = ({ entry }) => {
  const colorClass = LOG_COLORS[entry.type];
  const icon = LOG_ICONS[entry.type];

  // Formata timestamp
  const time = new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-start gap-2 text-sm animate-fadeIn">
      <span className="flex-shrink-0">{icon}</span>
      <span className={`flex-1 ${colorClass}`}>{entry.message}</span>
      <span className="text-gray-600 text-xs">{time}</span>
    </div>
  );
};

// =============================================================================
// VERSÃO COMPACTA (APENAS ÚLTIMA MENSAGEM)
// =============================================================================

interface CombatLogCompactProps {
  /** Última entrada do log */
  lastEntry: CombatLogEntry | null;
  /** Duração da exibição em ms */
  displayDuration?: number;
}

export const CombatLogCompact: React.FC<CombatLogCompactProps> = ({
  lastEntry,
  displayDuration = 3000,
}) => {
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    if (lastEntry) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), displayDuration);
      return () => clearTimeout(timer);
    }
  }, [lastEntry, displayDuration]);

  if (!visible || !lastEntry) {
    return null;
  }

  const colorClass = LOG_COLORS[lastEntry.type];
  const icon = LOG_ICONS[lastEntry.type];

  return (
    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-90 rounded-lg px-4 py-2 animate-fadeIn">
      <div className="flex items-center gap-2 text-lg">
        <span>{icon}</span>
        <span className={colorClass}>{lastEntry.message}</span>
      </div>
    </div>
  );
};

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Cria uma entrada de log
 */
export const createLogEntry = (
  message: string,
  type: CombatLogType = 'info'
): CombatLogEntry => ({
  id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  message,
  type,
  timestamp: Date.now(),
});

/**
 * Determina o tipo de log baseado na mensagem
 */
export const detectLogType = (message: string): CombatLogType => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('crítico') || lowerMessage.includes('critical')) {
    return 'critical';
  }
  if (lowerMessage.includes('errou') || lowerMessage.includes('falha') || lowerMessage.includes('bloqueado')) {
    return 'miss';
  }
  if (lowerMessage.includes('morreu') || lowerMessage.includes('derrotado') || lowerMessage.includes('💀')) {
    return 'death';
  }
  if (lowerMessage.includes('dano') || lowerMessage.includes('💥')) {
    return 'damage';
  }
  if (lowerMessage.includes('curou') || lowerMessage.includes('recuperou')) {
    return 'heal';
  }
  if (lowerMessage.includes('ataca')) {
    return 'attack';
  }

  return 'info';
};

export default CombatLog;
