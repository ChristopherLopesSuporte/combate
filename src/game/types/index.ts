/**
 * =============================================================================
 * TIPOS GLOBAIS DO JOGO RPG 3D TÁTICO
 * =============================================================================
 *
 * Este arquivo contém todas as interfaces e tipos TypeScript usados no jogo.
 * Centralizar tipos aqui facilita manutenção e evita imports circulares.
 */

// =============================================================================
// TIPOS DE POSIÇÃO E GEOMETRIA
// =============================================================================

/** Posição 3D no espaço [x, y, z] */
export type Position3D = [number, number, number];

/** Posição 2D no grid [x, z] */
export type Position2D = [number, number];

/** Rotação em radianos [x, y, z] */
export type Rotation3D = [number, number, number];

// =============================================================================
// ESTATÍSTICAS DE ENTIDADE
// =============================================================================

/**
 * Estatísticas base de uma entidade
 * Baseado no sistema de combate RPG v3
 */
export interface EntityStats {
  /** Pontos de vida atuais */
  hp: number;
  /** Pontos de vida máximos */
  maxHp: number;
  /** Velocidade - rapidez do movimento */
  vel: number;
  /** Habilidade - técnica e precisão */
  hab: number;
  /** Agilidade - coordenação e equilíbrio */
  agi: number;
  /** Força - potência física */
  for: number;
  /** Resistência - stamina */
  res: number;
  /** Percepção - leitura de combate */
  per: number;
  /** Velocidade de movimento em metros por turno */
  speed: number;
}

// =============================================================================
// ENTIDADE
// =============================================================================

/**
 * Entidade base do jogo (personagens, criaturas, objetos interativos)
 */
export interface Entity {
  /** Identificador único */
  id: string;
  /** Nome da entidade */
  name: string;
  /** Posição no mundo 3D [x, y, z] */
  position: Position3D;
  /** Rotação da entidade */
  rotation: Rotation3D;
  /** Altura em metros */
  size: number;
  /** Raio de ocupação no grid (em metros) */
  radius: number;
  /** Estatísticas de combate */
  stats: EntityStats;
  /** Tipo da entidade */
  type: EntityType;
  /** Se a entidade está selecionada */
  isSelected: boolean;
  /** Se a entidade pode ser controlada pelo jogador */
  isPlayerControlled: boolean;
  /** Cor para visualização 3D */
  color: string;
}

/** Tipos possíveis de entidades */
export type EntityType =
  | 'humanoid'    // Humanos, elfos, etc
  | 'beast'       // Animais
  | 'monster'     // Monstros
  | 'object'      // Objetos interativos
  | 'terrain';    // Obstáculos de terreno

// =============================================================================
// ESTADO DO JOGO
// =============================================================================

/** Fases do jogo */
export type GamePhase =
  | 'planning'       // Jogador planeja ações
  | 'perception'     // Fase de percepção/conflito
  | 'execution'      // Ações sendo executadas
  | 'conflict_check' // Verificar novos conflitos
  | 'paused'         // Jogo pausado
  | 'combat'         // Em combate ativo
  | 'ended';         // Jogo terminado

/** Modos de visualização do grid */
export type GridMode = 'squares' | 'meters' | 'hexagonal';

/**
 * Estado global do jogo (Zustand Store)
 */
export interface GameState {
  // Estado das entidades
  /** Lista de todas as entidades no jogo */
  entities: Entity[];
  /** ID da entidade atualmente selecionada */
  selectedEntityId: string | null;

  // Estado do jogo
  /** Fase atual do jogo */
  gamePhase: GamePhase;
  /** Turno atual */
  currentTurn: number;
  /** Tempo atual em milissegundos (sistema de combate) */
  currentTimeMs: number;

  // Estado de movimento
  /** Se alguma entidade está se movendo */
  isMoving: boolean;
  /** ID da entidade que está se movendo */
  movingEntityId: string | null;
  /** Posição alvo do movimento */
  movementTarget: Position3D | null;
  /** Posição do cursor no grid (hover) */
  cursorPosition: Position3D | null;

  // Estado de combate
  /** Se está em modo de combate */
  combatMode: boolean;
  /** ID do inimigo alvo */
  targetedEnemyId: string | null;
  /** Log de combate */
  combatLog: unknown[];
  /** Efeitos visuais de combate */
  combatEffects: unknown[];
  /** Se está atacando */
  isAttacking: boolean;
  /** Modo de ação selecionado (none, move, attack) */
  actionMode: 'none' | 'move' | 'attack';

  // Configurações do grid
  /** Tamanho do grid em metros */
  gridSize: number;
  /** Se o grid está visível */
  showGrid: boolean;
  /** Modo de visualização do grid */
  gridMode: GridMode;
  /** Tamanho de cada célula do grid em metros */
  cellSize: number;

  // Configurações de câmera
  /** Posição da câmera */
  cameraPosition: Position3D;
  /** Ponto que a câmera está olhando */
  cameraTarget: Position3D;

  // Debug
  /** Mostrar painel de debug */
  showDebug: boolean;
  /** Mostrar hitboxes */
  showHitboxes: boolean;

  // Sistema de Fases
  /** Fase atual do turno (planning, perception, execution, conflict_check) */
  turnPhase: TurnPhase;
  /** Ações planejadas para o turno atual */
  plannedActions: PlannedAction[];
  /** Resultados de percepção */
  perceptionResults: PerceptionResult[];
  /** Conflitos detectados */
  conflicts: ConflictEvent[];
  /** Fila de execução ordenada */
  executionQueue: PlannedAction[];
  /** Se está executando fase */
  isExecutingPhase: boolean;
}

// Tipos do sistema de fases (importados de PhaseManager)
export { TurnPhase, ActionType, ConflictType } from '../systems/PhaseManager';
export type { PlannedAction, PerceptionResult, ConflictEvent, PerceivedInfo } from '../systems/PhaseManager';

/**
 * Ações do Zustand Store
 */
export interface GameActions {
  // Entidades
  /** Adiciona uma nova entidade */
  addEntity: (entity: Entity) => void;
  /** Remove uma entidade por ID */
  removeEntity: (id: string) => void;
  /** Atualiza uma entidade */
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  /** Seleciona uma entidade */
  selectEntity: (id: string | null) => void;
  /** Move uma entidade para nova posição */
  moveEntity: (id: string, position: Position3D) => void;

  // Estado do jogo
  /** Muda a fase do jogo */
  setGamePhase: (phase: GamePhase) => void;
  /** Avança para próximo turno */
  nextTurn: () => void;
  /** Reseta o jogo */
  resetGame: () => void;

  // Movimento
  /** Inicia movimento de uma entidade */
  startMovement: (entityId: string, target: Position3D) => void;
  /** Completa o movimento atual */
  completeMovement: () => void;
  /** Cancela o movimento atual */
  cancelMovement: () => void;
  /** Atualiza posição do cursor no grid */
  setCursorPosition: (position: Position3D | null) => void;

  // Combate
  /** Alterna modo de combate */
  toggleCombatMode: () => void;
  /** Define modo de combate */
  setCombatMode: (enabled: boolean) => void;
  /** Define alvo do combate */
  setTarget: (targetId: string | null) => void;
  /** Adiciona entrada ao log de combate */
  addCombatLog: (entry: unknown) => void;
  /** Adiciona múltiplas entradas ao log */
  addCombatLogs: (entries: unknown[]) => void;
  /** Limpa log de combate */
  clearCombatLog: () => void;
  /** Adiciona efeito de combate */
  addCombatEffect: (effect: unknown) => void;
  /** Adiciona múltiplos efeitos */
  addCombatEffects: (effects: unknown[]) => void;
  /** Remove efeito de combate */
  removeCombatEffect: (effectId: string) => void;
  /** Limpa efeitos de combate */
  clearCombatEffects: () => void;
  /** Inicia ataque */
  startAttack: () => void;
  /** Finaliza ataque */
  endAttack: () => void;
  /** Aplica dano a entidade */
  applyDamage: (entityId: string, damage: number) => void;
  /** Define modo de ação (none, move, attack) */
  setActionMode: (mode: 'none' | 'move' | 'attack') => void;

  // Grid
  /** Toggle visibilidade do grid */
  toggleGrid: () => void;
  /** Muda modo do grid */
  setGridMode: (mode: GridMode) => void;
  /** Define tamanho do grid */
  setGridSize: (size: number) => void;

  // Debug
  /** Toggle painel de debug */
  toggleDebug: () => void;
  /** Toggle hitboxes */
  toggleHitboxes: () => void;

  // Sistema de Fases
  /** Inicia fase de planejamento */
  startPlanningPhase: () => void;
  /** Planeja ação para uma entidade */
  planAction: (
    entityId: string,
    type: ActionType,
    options?: {
      targetId?: string;
      targetPosition?: Position3D;
      attackType?: string;
      baseTimeMs?: number;
    }
  ) => PlannedAction;
  /** Cancela ação planejada */
  cancelAction: (entityId: string) => void;
  /** Finaliza planejamento e inicia percepção */
  finishPlanning: () => void;
  /** Rola teste de percepção */
  rollPerception: (entityId: string, targetId: string, difficulty?: number) => PerceptionResult | null;
  /** Modifica ação após percepção (com penalidade de 30%) */
  modifyAction: (
    entityId: string,
    newType: ActionType,
    options?: {
      targetId?: string;
      targetPosition?: Position3D;
      attackType?: string;
    }
  ) => PlannedAction | null;
  /** Finaliza percepção e inicia execução */
  finishPerception: () => void;
  /** Obtém próxima ação a executar */
  getNextAction: () => PlannedAction | null;
  /** Marca ação como executada */
  markActionExecuted: (entityId: string) => void;
  /** Finaliza execução e inicia verificação de conflitos */
  finishExecution: () => void;
  /** Detecta conflitos no estado atual */
  detectConflicts: () => ConflictEvent[];
  /** Finaliza verificação de conflitos */
  finishConflictCheck: () => boolean;
  /** Planeja ações de IA para inimigos */
  planEnemyActions: () => PlannedAction[];
  /** Obtém fase atual do turno */
  getTurnPhase: () => TurnPhase;
  /** Obtém descrição da fase atual */
  getPhaseDescription: () => string;
}

/** Store completo do jogo */
export type GameStore = GameState & GameActions;

// =============================================================================
// COMBATE
// =============================================================================

/** Tipos de ataque disponíveis */
export type AttackType =
  | 'jab'       // Ataque rápido
  | 'direto'    // Ataque direto
  | 'corte'     // Ataque cortante
  | 'estocada'  // Ataque perfurante
  | 'aparar';   // Defesa

/** Resultado de um ataque */
export interface AttackResult {
  /** Se o ataque acertou */
  hit?: boolean;
  /** Alias para hit (compatibilidade) */
  isHit?: boolean;
  /** Dano causado */
  damage: number;
  /** Tempo de execução em ms */
  timeMs?: number;
  /** Tipo do ataque */
  type?: AttackType;
  /** ID do atacante */
  attackerId: string;
  /** ID do defensor */
  defenderId: string;
  /** Se foi crítico */
  isCritical?: boolean;
  /** Timestamp do ataque */
  timestamp?: number;
}

/** Tipos de arma (do sistema de combate) */
export type WeaponType =
  | 'Desarmado'
  | 'Facas'
  | 'Espadas 1 Mão'
  | 'Rapieira'
  | 'Espadas 2 Mãos'
  | 'Machados'
  | 'Impacto'
  | 'Hastes'
  | 'Flexíveis';

/** Qualidade da arma */
export type WeaponQuality =
  | 'Tosca'
  | 'Comum'
  | 'Boa'
  | 'Excelente'
  | 'Obra-prima'
  | 'Lendária';

/** Dados de uma arma */
export interface Weapon {
  name: string;
  type: WeaponType;
  quality: WeaponQuality;
  damage: number;
  forReq: number;
  reach: number;
  times: {
    jab: number;
    direto: number;
    corte: number | null;
    estocada: number | null;
    aparar: number | null;
  };
}

// =============================================================================
// ARMADURA
// =============================================================================

/** Dados de uma armadura */
export interface Armor {
  name: string;
  penalty: number;      // Penalidade em ms
  fatigueMultiplier: number;
  protection: number;
}

// =============================================================================
// AÇÕES E COMANDOS
// =============================================================================

/** Ação que uma entidade pode executar */
export interface GameAction {
  /** Tipo da ação */
  type: 'move' | 'attack' | 'defend' | 'wait' | 'special';
  /** ID da entidade executando */
  entityId: string;
  /** ID do alvo (se houver) */
  targetId?: string;
  /** Posição alvo (para movimento) */
  targetPosition?: Position3D;
  /** Tempo de execução em ms */
  timeMs: number;
  /** Prioridade (menor = mais cedo) */
  priority: number;
}

/** Fila de ações para execução */
export interface ActionQueue {
  actions: GameAction[];
  currentIndex: number;
  isExecuting: boolean;
}

// =============================================================================
// EVENTOS
// =============================================================================

/** Tipos de eventos do jogo */
export type GameEventType =
  | 'entity_spawned'
  | 'entity_died'
  | 'entity_moved'
  | 'attack_started'
  | 'attack_resolved'
  | 'turn_started'
  | 'turn_ended'
  | 'phase_changed';

/** Evento genérico do jogo */
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

// =============================================================================
// CONFIGURAÇÃO
// =============================================================================

/** Configuração inicial de uma entidade (JSON) */
export interface EntityConfig {
  name: string;
  type: EntityType;
  size: number;
  radius: number;
  color: string;
  baseStats: Omit<EntityStats, 'hp' | 'maxHp'> & { maxHp: number };
  abilities?: string[];
  description?: string;
}

/** Configuração do jogo */
export interface GameConfig {
  /** Tamanho padrão do grid */
  defaultGridSize: number;
  /** Tamanho da célula em metros */
  defaultCellSize: number;
  /** Duração de um turno em ms */
  turnDurationMs: number;
  /** Configurações de física */
  physics: {
    gravity: number;
    friction: number;
  };
}
