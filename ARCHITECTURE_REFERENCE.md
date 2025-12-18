# 🏗️ REFERÊNCIA DE ARQUITETURA - RPG 3D TÁTICO

**⚠️ DOCUMENTO CRÍTICO: Este arquivo deve ser consultado em TODOS os prompts futuros**

Este documento define a arquitetura canônica do sistema. Ao adicionar novas funcionalidades, SEMPRE siga estas estruturas para evitar quebrar o código existente.

---

## 📐 PRINCÍPIOS FUNDAMENTAIS

### ⚠️ ESTRATÉGIA DE DESENVOLVIMENTO

**DECISÃO ARQUITETURAL CRÍTICA:**
- Sistema começa SIMPLES e evolui GRADUALMENTE
- Código preparado desde o início para expansões futuras
- Evitar refatorações grandes - apenas adicionar camadas
- Multiplayer: arquitetura preparada, implementação depois da Fase 3

### 1. Sistema de Unidades
- **Unidade base**: Metros (m)
- **Grid**: Células pequenas (ex: 0.1m x 0.1m) para movimento preciso
- **Tempo**: Começa em turnos abstratos → evolui para milissegundos (ruego.md)
- **Física**: Todos objetos têm massa, volume e podem colidir

### 2. Hierarquia de Entidades
```
Entity (classe base abstrata)
├── Creature (tem membros, pode morrer)
│   ├── Humanoid (bípede, 2 braços, 2 pernas, 1 cabeça, 1 torso)
│   ├── Quadruped (4 pernas, 1 cabeça, 1 torso, opcional: cauda)
│   ├── Arthropod (N pernas, 1 cabeça, N segmentos)
│   └── Dragon (4 pernas, 2 asas, 1 cauda, 1 cabeça, 1 torso)
├── Vehicle (montável, não tem membros)
└── Prop (objeto inanimado, destrutível)
```

### 3. Sistema Modular
- **Cada sistema é independente** (Movement, Combat, Physics, etc)
- **Comunicação via eventos** (EventEmitter pattern)
- **Estado centralizado** (Zustand store único)
- **Nenhum sistema conhece implementação interna de outro**

---

## 🗂️ ESTRUTURA DE DADOS CANÔNICA

### Entity Base (entities/Entity.ts)
```typescript
export interface EntityData {
  // Identificação
  id: string;                    // UUID único
  type: string;                  // Ex: "human_warrior", "goblin", "horse"
  category: EntityCategory;       // "creature" | "vehicle" | "prop"
  name: string;                  // Nome para display
  
  // Física e Espacial
  position: Vector3;             // [x, y, z] em metros
  rotation: Vector3;             // [x, y, z] em radianos
  velocity: Vector3;             // [x, y, z] m/s (usado pela física)
  size: Vector3;                 // [largura, altura, profundidade] em metros
  mass: number;                  // kg
  
  // Visual
  color: string;                 // Hex color (temporário, até ter modelos)
  modelPath?: string;            // Path para modelo 3D (futuro)
  
  // Gameplay
  faction: Faction;              // "player" | "enemy" | "neutral"
  isAlive: boolean;              
  isSelectable: boolean;
  isControllable: boolean;       // Só entidades do jogador
  
  // Stats (se for criatura)
  stats?: CreatureStats;
  
  // Membros (se for criatura)
  limbs?: Limb[];
  
  // Montaria (se for vehicle)
  mountData?: MountData;
  
  // Estado atual
  currentAction?: PlannedAction;
  statusEffects: StatusEffect[];
}
```

### Creature Stats (entities/Entity.ts)
```typescript
export interface CreatureStats {
  // HP e Sobrevivência
  hp: number;                    // HP atual
  maxHp: number;                 // HP máximo
  stamina: number;               // Stamina atual (para ações)
  maxStamina: number;
  
  // Atributos Primários
  strength: number;              // Força física (1-100)
  agility: number;               // Agilidade/Destreza (1-100)
  constitution: number;          // Resistência (1-100)
  perception: number;            // Percepção/Visão (1-100)
  intelligence: number;          // Inteligência (1-100)
  
  // Atributos Derivados (calculados)
  speed: number;                 // Metros por turno (baseado em agility)
  carryCapacity: number;         // kg (baseado em strength)
  visionRange: number;           // Metros (baseado em perception)
  
  // Combate
  attackPower: number;           // Dano base (baseado em strength)
  defense: number;               // Defesa (baseado em constitution + agility)
  criticalChance: number;        // % (0-100)
  
  // Modificadores
  modifiers: StatModifier[];     // Buffs/debuffs temporários
}
```

### Limb System (entities/Limb.ts)
```typescript
export interface Limb {
  // Identificação
  id: string;                    // Ex: "left_leg", "head", "wing_right"
  type: LimbType;                // Ver enum abaixo
  name: string;                  // Para display
  
  // Hierarquia
  parentEntityId: string;        // ID da entidade dona
  parentLimbId?: string;         // Se conectado a outro membro
  childLimbIds: string[];        // Membros conectados a este
  
  // Física
  position: Vector3;             // Relativo ao corpo
  rotation: Vector3;
  size: Vector3;                 // Dimensões
  mass: number;                  // kg
  
  // Joint (articulação)
  joint?: {
    type: 'hinge' | 'ball' | 'fixed';
    limits: {
      minAngle: Vector3;
      maxAngle: Vector3;
    };
    strength: number;            // Força da junta (0-100)
  };
  
  // Combate
  hp: number;
  maxHp: number;
  canBeTargeted: boolean;        // Pode ser alvo de ataque específico
  vital: boolean;                // Membro vital (head, torso)
  
  // Estado
  isAttached: boolean;           // Conectado ao corpo?
  isFunctional: boolean;         // Funcional? (HP > 0)
  isDamaged: boolean;            // Danificado? (HP < 50%)
  bleeding: number;              // Taxa de sangramento (0-100)
  
  // Visual
  modelPath?: string;
  bloodColor: string;            // Hex color
}

export enum LimbType {
  HEAD = 'head',
  TORSO = 'torso',
  ARM_LEFT = 'arm_left',
  ARM_RIGHT = 'arm_right',
  HAND_LEFT = 'hand_left',
  HAND_RIGHT = 'hand_right',
  LEG_LEFT = 'leg_left',
  LEG_RIGHT = 'leg_right',
  FOOT_LEFT = 'foot_left',
  FOOT_RIGHT = 'foot_right',
  WING_LEFT = 'wing_left',
  WING_RIGHT = 'wing_right',
  TAIL = 'tail',
  SEGMENT = 'segment',           // Para criaturas segmentadas
}
```

### Combat System (combat/CombatSystem.ts)
```typescript
export interface AttackData {
  attackerId: string;
  targetId: string;
  targetLimbId?: string;         // Ataque específico a membro
  attackType: AttackType;        // Ver enum abaixo
  
  // Área de efeito (se aplicável)
  aoe?: {
    shape: 'circle' | 'cone' | 'line' | 'rectangle';
    size: number;                // Raio/largura em metros
    angle?: number;              // Para cone (graus)
    direction?: Vector3;         // Para cone/linha
  };
  
  // Modificadores
  chargeTime: number;            // Turnos para carregar
  staminaCost: number;
  criticalMultiplier: number;    // Se crítico (ex: 2.0 = dano x2)
  
  // Dados
  diceType: number;              // Ex: 20 para d20
  diceCount: number;             // Número de dados
  bonusDamage: number;           // Dano adicional fixo
}

export enum AttackType {
  MELEE_SLASH = 'melee_slash',
  MELEE_PIERCE = 'melee_pierce',
  MELEE_BLUNT = 'melee_blunt',
  RANGED_ARROW = 'ranged_arrow',
  RANGED_THROWN = 'ranged_thrown',
  MAGIC_FIRE = 'magic_fire',
  MAGIC_ICE = 'magic_ice',
  GRAPPLE = 'grapple',
  BITE = 'bite',
  CLAW = 'claw',
}

export interface CombatResult {
  success: boolean;
  
  // Rolagens
  attackRoll: number;
  defenseRoll: number;
  attackTotal: number;
  defenseTotal: number;
  
  // Resultado
  damage: number;
  wasCritical: boolean;
  wasBlocked: boolean;
  wasDodged: boolean;
  
  // Alvos atingidos
  hitTargets: {
    targetId: string;
    limbId?: string;
    damageDealt: number;
    effects: StatusEffect[];
  }[];
  
  // Log
  logMessages: string[];
  
  // Consequências
  limbsSevered: string[];        // IDs de membros cortados
  entitiesKilled: string[];
}
```

### Movement System (systems/MovementSystem.ts)
```typescript
export interface MovementData {
  entityId: string;
  startPosition: Vector3;
  targetPosition: Vector3;
  
  // Tipo de movimento
  movementType: MovementType;    // Ver enum abaixo
  
  // Pathfinding
  path: Vector3[];               // Pontos do caminho
  pathIndex: number;             // Posição atual no caminho
  
  // Física
  maxSpeed: number;              // m/s
  acceleration: number;          // m/s²
  
  // Estado
  isMoving: boolean;
  progress: number;              // 0-1
  
  // Obstáculos
  avoidObstacles: boolean;
  personalSpace: number;         // Distância mínima de outras entidades
}

export enum MovementType {
  WALK = 'walk',
  RUN = 'run',
  SNEAK = 'sneak',
  CLIMB = 'climb',
  FLY = 'fly',
  SWIM = 'swim',
  JUMP = 'jump',
  TELEPORT = 'teleport',
}
```

### Grapple System (systems/GrappleSystem.ts)
```typescript
export interface GrappleData {
  grapplerIds: string[];         // Entidades agarrando
  targetId: string;              // Entidade sendo agarrada
  targetLimbId?: string;         // Membro específico (opcional)
  
  // Força
  totalStrength: number;         // Soma da força dos agarradores
  resistanceStrength: number;    // Força do alvo resistindo
  
  // Estado
  isActive: boolean;
  duration: number;              // Turnos ativos
  
  // Ações possíveis
  canPull: boolean;
  canPush: boolean;
  canThrow: boolean;
  canImmobilize: boolean;
  
  // Teste de força
  strengthTest: {
    grapplerRoll: number;
    targetRoll: number;
    winner: string;              // ID da entidade vencedora
  };
}

export interface ThrowData {
  throwerId: string;
  targetId: string;
  
  // Física
  direction: Vector3;
  force: number;                 // Newtons
  spinRate: number;              // Rotação durante voo (rad/s)
  
  // Trajetória
  trajectory: Vector3[];         // Pontos da trajetória
  landingPosition: Vector3;
  landingVelocity: Vector3;
  
  // Colisões durante voo
  collisions: {
    position: Vector3;
    entityId: string;
    damage: number;
  }[];
  
  // Resultado
  landingDamage: number;
  knockedProne: boolean;
  stunDuration: number;          // Turnos atordoado
}
```

### Climbing System (systems/ClimbingSystem.ts)
```typescript
export interface ClimbData {
  climberId: string;
  targetId: string;              // Entidade sendo escalada
  
  // Posição na escalada
  currentGripPoint: Vector3;     // Ponto de apoio atual
  targetGripPoint: Vector3;      // Próximo ponto de apoio
  
  // Mecânica
  gripsRequired: number;         // Apoios necessários (mãos+pés)
  currentGrips: {
    limbId: string;              // Qual membro está segurando
    position: Vector3;           // Onde está segurando
    strength: number;            // Força do grip (0-100)
  }[];
  
  // Estado
  isClimbing: boolean;
  progress: number;              // 0-1 até próximo grip point
  stamina: number;               // Stamina sendo consumida
  
  // Risco
  fallRisk: number;              // % de chance de cair (0-100)
  fallDamage: number;            // Dano se cair agora
  
  // Alcance
  reachDistance: number;         // Metros que pode alcançar
  canReachNext: boolean;
}

export interface MountData {
  riderId: string;
  mountId: string;
  
  // Posição na montaria
  seatPosition: Vector3;         // Relativo ao mount
  
  // Controle
  hasControl: boolean;           // Cavaleiro controla?
  mountWillingness: number;      // Vontade do mount obedecer (0-100)
  
  // Combate em montaria
  combatBonus: {
    attackBonus: number;
    defenseBonus: number;
    speedBonus: number;
  };
  
  // Estado
  isMounted: boolean;
  canDismount: boolean;
  forceDismountOnDamage: boolean;
}
```

### Turn System (core/TimelineManager.ts)
```typescript
export interface TurnData {
  turnNumber: number;
  phase: GamePhase;              // Ver enum abaixo
  
  // Ações planejadas
  plannedActions: Map<string, PlannedAction>;
  
  // Execução
  executionOrder: string[];      // IDs em ordem de iniciativa
  currentExecutionIndex: number;
  
  // Conflitos
  activeConflicts: ConflictEvent[];
  resolvedConflicts: string[];   // IDs de conflitos já resolvidos
  
  // Timeline
  timeElapsed: number;           // Segundos no turno atual
  pausedAt?: number;             // Quando pausou (se pausado)
}

export enum GamePhase {
  PLANNING = 'planning',         // Jogador planejando
  EXECUTION = 'execution',       // Todos agindo simultaneamente
  PAUSED = 'paused',             // Pausado em conflito
  RESOLUTION = 'resolution',     // Resolvendo efeitos do turno
  FINISHED = 'finished',         // Jogo acabou
}

export interface PlannedAction {
  entityId: string;
  actionType: ActionType;        // Ver enum abaixo
  
  // Alvo (depende do tipo de ação)
  targetPosition?: Vector3;
  targetEntityId?: string;
  targetLimbId?: string;
  
  // Timing
  priority: number;              // Ordem de execução (maior = primeiro)
  chargeTime: number;            // Turnos para preparar
  
  // Recursos
  staminaCost: number;
  
  // Estado
  isExecuting: boolean;
  isComplete: boolean;
  wasCancelled: boolean;
  
  // Dados adicionais (depende do tipo)
  extraData?: any;
}

export enum ActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  DEFEND = 'defend',
  GRAPPLE = 'grapple',
  THROW = 'throw',
  CLIMB = 'climb',
  MOUNT = 'mount',
  DISMOUNT = 'dismount',
  USE_ITEM = 'use_item',
  WAIT = 'wait',
  FLEE = 'flee',
}

export interface ConflictEvent {
  id: string;
  type: ConflictType;            // Ver enum abaixo
  triggerEntityId: string;       // Quem causou o conflito
  affectedEntityIds: string[];   // Quem é afetado
  
  // Contexto
  description: string;
  options: ConflictOption[];
  
  // Dados específicos
  data: any;
  
  // Resolução
  isResolved: boolean;
  chosenOption?: string;
  resolution?: any;
}

export enum ConflictType {
  ENEMY_SPOTTED = 'enemy_spotted',
  ATTACK_INCOMING = 'attack_incoming',
  ALLY_WOUNDED = 'ally_wounded',
  PATH_BLOCKED = 'path_blocked',
  AMBUSH = 'ambush',
  OPPORTUNITY_ATTACK = 'opportunity_attack',
  FRIENDLY_FIRE = 'friendly_fire',
  SURPRISE_ENCOUNTER = 'surprise_encounter',
}

export interface ConflictOption {
  id: string;
  label: string;
  description: string;
  action: PlannedAction;         // Nova ação para substituir
  consequences?: string[];       // O que acontece se escolher
}
```

---

## 📋 TEMPLATES DE CRIAÇÃO

### Como Criar um Soldado Humanóide
```typescript
// 1. Adicionar em entityConfigs.json
{
  "soldier_basic": {
    "name": "Soldado",
    "category": "creature",
    "size": [0.5, 1.8, 0.4],     // [largura, altura, profundidade]
    "mass": 80,                   // kg
    "color": "#4488ff",
    "faction": "player",
    
    "stats": {
      "maxHp": 100,
      "maxStamina": 100,
      "strength": 15,
      "agility": 12,
      "constitution": 14,
      "perception": 10,
      "intelligence": 10
    },
    
    "limbs": [
      { "type": "head", "maxHp": 30, "vital": true, "size": [0.2, 0.25, 0.2] },
      { "type": "torso", "maxHp": 50, "vital": true, "size": [0.5, 0.6, 0.3] },
      { "type": "arm_left", "maxHp": 20, "size": [0.1, 0.6, 0.1] },
      { "type": "arm_right", "maxHp": 20, "size": [0.1, 0.6, 0.1] },
      { "type": "leg_left", "maxHp": 25, "size": [0.15, 0.9, 0.15] },
      { "type": "leg_right", "maxHp": 25, "size": [0.15, 0.9, 0.15] }
    ],
    
    "combat": {
      "attackRange": 2.0,
      "attackType": "melee_slash",
      "attackDice": 20,
      "defenseDice": 20
    },
    
    "ai": {
      "behavior": "aggressive",
      "courage": 70,
      "groupCohesion": 80
    }
  }
}

// 2. Sistema criará automaticamente:
// - Entity base com stats derivados
// - Limbs conectados por joints
// - Rigidbodies para física
// - Colliders para cada membro
```

### Como Criar uma Criatura Quadrúpede
```typescript
{
  "wolf": {
    "name": "Lobo",
    "category": "creature",
    "size": [0.6, 0.8, 1.2],
    "mass": 40,
    "color": "#888888",
    "faction": "enemy",
    
    "stats": {
      "maxHp": 60,
      "maxStamina": 120,
      "strength": 12,
      "agility": 18,              // Ágil!
      "constitution": 10,
      "perception": 16,            // Boa percepção
      "intelligence": 6
    },
    
    "limbs": [
      { "type": "head", "maxHp": 20, "vital": true, "size": [0.3, 0.25, 0.4] },
      { "type": "torso", "maxHp": 30, "vital": true, "size": [0.6, 0.5, 1.0] },
      { "type": "leg_front_left", "maxHp": 15, "size": [0.1, 0.6, 0.1] },
      { "type": "leg_front_right", "maxHp": 15, "size": [0.1, 0.6, 0.1] },
      { "type": "leg_back_left", "maxHp": 15, "size": [0.1, 0.6, 0.1] },
      { "type": "leg_back_right", "maxHp": 15, "size": [0.1, 0.6, 0.1] },
      { "type": "tail", "maxHp": 10, "vital": false, "size": [0.1, 0.1, 0.5] }
    ],
    
    "combat": {
      "attackRange": 1.5,
      "attackType": "bite",
      "attackDice": 12,
      "defenseDice": 20,
      "specialAttacks": [
        {
          "name": "Derrubar",
          "type": "grapple",
          "targetLimb": "leg",   // Ataca pernas para derrubar
          "successChance": 0.6
        }
      ]
    },
    
    "ai": {
      "behavior": "pack_hunter",  // Caça em grupo
      "courage": 50,
      "fleeAtHpPercent": 30
    }
  }
}
```

### Como Criar um Dragão Gigante
```typescript
{
  "dragon_red": {
    "name": "Dragão Vermelho",
    "category": "creature",
    "size": [15, 12, 25],         // ENORME!
    "mass": 15000,                // 15 toneladas
    "color": "#ff0000",
    "faction": "enemy",
    
    "stats": {
      "maxHp": 1000,              // Boss HP
      "maxStamina": 500,
      "strength": 90,             // Muito forte
      "agility": 30,              // Lento
      "constitution": 80,
      "perception": 50,
      "intelligence": 40
    },
    
    "limbs": [
      { "type": "head", "maxHp": 200, "vital": true, "size": [3, 3, 4] },
      { "type": "neck", "maxHp": 150, "size": [2, 2, 5] },
      { "type": "torso", "maxHp": 400, "vital": true, "size": [10, 8, 12] },
      { "type": "leg_front_left", "maxHp": 150, "size": [2, 6, 2] },
      { "type": "leg_front_right", "maxHp": 150, "size": [2, 6, 2] },
      { "type": "leg_back_left", "maxHp": 150, "size": [2, 6, 2] },
      { "type": "leg_back_right", "maxHp": 150, "size": [2, 6, 2] },
      { "type": "wing_left", "maxHp": 100, "size": [1, 8, 12] },
      { "type": "wing_right", "maxHp": 100, "size": [1, 8, 12] },
      { "type": "tail", "maxHp": 120, "size": [2, 2, 15] }
    ],
    
    "combat": {
      "attackRange": 8.0,         // Alcance longo
      "attackType": "bite",
      "attackDice": 100,          // d100!
      "defenseDice": 50,
      "specialAttacks": [
        {
          "name": "Baforada de Fogo",
          "type": "magic_fire",
          "aoe": { "shape": "cone", "size": 20, "angle": 60 },
          "damage": "10d20",
          "cooldown": 3
        },
        {
          "name": "Varredura de Cauda",
          "type": "melee_blunt",
          "aoe": { "shape": "circle", "size": 10 },
          "knockback": true
        }
      ]
    },
    
    "climbable": true,            // Pode ser escalado!
    "climbingDifficulty": 80,     // Muito difícil
    "weakPoints": [               // Pontos fracos quando escalado
      { "position": [0, 8, -5], "limbType": "neck", "damageMultiplier": 2.0 },
      { "position": [0, 10, 0], "limbType": "head", "damageMultiplier": 3.0 }
    ],
    
    "ai": {
      "behavior": "territorial_aggressive",
      "usesFlightAdvantage": true,
      "targetsPriority": ["strongest", "closest"]
    }
  }
}
```

### Como Criar uma Centopeia (Muitos Segmentos)
```typescript
{
  "giant_centipede": {
    "name": "Centopeia Gigante",
    "category": "creature",
    "size": [1.5, 1.0, 8.0],
    "mass": 150,
    "color": "#332211",
    "faction": "enemy",
    
    "stats": {
      "maxHp": 200,
      "maxStamina": 80,
      "strength": 20,
      "agility": 15,
      "constitution": 25,
      "perception": 12,
      "intelligence": 3
    },
    
    "limbs": [
      { "type": "head", "maxHp": 40, "vital": true, "size": [0.8, 0.6, 1.0] },
      // Segmentos (15 no total)
      ...Array.from({ length: 15 }, (_, i) => ({
        type: "segment",
        id: `segment_${i}`,
        maxHp: 15,
        vital: i < 3,             // Primeiros 3 segmentos são vitais
        size: [1.2, 0.8, 0.5],
        // Cada segmento tem 2 pernas
        legs: [
          { side: "left", size: [0.1, 0.4, 0.1] },
          { side: "right", size: [0.1, 0.4, 0.1] }
        ]
      }))
    ],
    
    "segmentBehavior": {
      "independent": false,       // Segmentos não agem sozinhos
      "canSurviveSevered": true,  // Mas continuam vivos se cortados
      "regenerationRate": 0.1     // HP/turno
    },
    
    "combat": {
      "attackRange": 2.0,
      "attackType": "bite",
      "attackDice": 20,
      "defenseDice": 15,
      "specialAttacks": [
        {
          "name": "Constrição",
          "type": "grapple",
          "wrapsAroundTarget": true,
          "damagePerTurn": "2d6"
        }
      ]
    }
  }
}
```

---

## 🔧 REGRAS DE IMPLEMENTAÇÃO

### 1. Ao Adicionar Novo Sistema
```typescript
// SEMPRE seguir este padrão:

// 1. Criar interface no types/
export interface NewSystemData { ... }

// 2. Criar classe em systems/
export class NewSystem {
  constructor(private store: GameStore) {}
  
  initialize(): void { ... }
  update(deltaTime: number): void { ... }
  cleanup(): void { ... }
}

// 3. Adicionar ao GameStore
interface GameState {
  newSystem: NewSystemData;
}

// 4. Integrar no EntityManager
// Se o sistema afeta entidades, EntityManager deve conhecê-lo

// 5. Adicionar eventos
export enum SystemEvents {
  NEW_SYSTEM_INITIALIZED = 'new_system_initialized',
  NEW_SYSTEM_ACTION = 'new_system_action',
}
```

### 2. Ao Adicionar Nova Ação
```typescript
// 1. Adicionar ao ActionType enum
export enum ActionType {
  // ... existing
  NEW_ACTION = 'new_action',
}

// 2. Criar dados específicos
export interface NewActionData {
  // campos específicos
}

// 3. Implementar em TimelineManager
class TimelineManager {
  private executeNewAction(action: PlannedAction): void {
    // lógica
  }
}

// 4. Adicionar UI
// Em ActionPanel.tsx, adicionar botão

// 5. Adicionar conflitos possíveis
// Se a ação pode gerar conflitos, adicionar ConflictType
```

### 3. Ao Adicionar Novo Tipo de Ataque
```typescript
// 1. Adicionar ao AttackType enum
export enum AttackType {
  // ... existing
  NEW_ATTACK = 'new_attack',
}

// 2. Adicionar dados no entityConfigs.json
{
  "specialAttacks": [
    {
      "name": "Novo Ataque",
      "type": "new_attack",
      "damage": "3d8",
      "range": 5.0,
      "aoe": { ... },
      "effects": [ ... ]
    }
  ]
}

// 3. Implementar cálculo em CombatSystem
class CombatSystem {
  private calculateNewAttack(attack: AttackData): CombatResult {
    // lógica específica
  }
}

// 4. Adicionar efeitos visuais
// Em CombatEffects.tsx
```

### 4. Regras de Física (CRÍTICO)
```typescript
// TODO fisica com Rapier nas fases futuras:

// 1. Todos objetos físicos DEVEM ter:
interface PhysicsObject {
  rigidBody: RigidBody;         // Rapier RigidBody
  collider: Collider;           // Rapier Collider
  mass: number;
  friction: number;
  restitution: number;          // Elasticidade (0-1)
}

// 2. Forças são aplicadas em Newtons
const force = mass * acceleration;  // F = ma

// 3. Colisões sempre geram eventos
eventEmitter.emit('collision', {
  entityA: string,
  entityB: string,
  impactForce: number,
  position: Vector3,
});

// 4. Desmembramento ocorre quando:
if (impactForce > limb.jointStrength) {
  this.severLimb(limbId);
}

// 5. Gravidade
const GRAVITY = -9.81; // m/s² (Terra)
```

---

## 📊 FLUXOS PRINCIPAIS

### Fluxo de Turno Completo
```
1. INÍCIO DO TURNO (Planning Phase)
   ├─ Resetar ações planejadas
   ├─ IA planeja automaticamente
   ├─ Jogador seleciona unidades e planeja
   └─ Botão "Executar Turno" habilitado

2. EXECUÇÃO (Execution Phase)
   ├─ Ordenar ações por prioridade
   ├─ Para cada ação:
   │  ├─ Verificar pré-requisitos (stamina, alcance, etc)
   │  ├─ Executar movimento/ataque/etc
   │  ├─ Detectar conflitos
   │  └─ Se conflito: PAUSAR → ir para 3
   └─ Se sem conflitos: continuar até fim

3. PAUSA (Paused Phase)
   ├─ Mostrar modal de conflito
   ├─ Apresentar opções ao jogador
   ├─ Jogador escolhe resolução
   └─ Atualizar ação planejada → voltar para 2

4. RESOLUÇÃO (Resolution Phase)
   ├─ Aplicar dano de todos combates
   ├─ Remover entidades mortas
   ├─ Atualizar status effects
   ├─ Calcular sangramento de membros
   ├─ Verificar condição de vitória/derrota
   └─ Se jogo não acabou: voltar para 1
```

### Fluxo de Combate com Desmembramento
```
1. ATAQUE DECLARADO
   ├─ Verificar alcance
   ├─ Verificar linha de visão
   └─ Se válido: rolar dados

2. ROLAR DADOS
   ├─ Ataque = dXX + Strength
   ├─ Defesa = dYY + Agility
   └─ Calcular dano = max(0, Ataque - Defesa)

3. APLICAR DANO
   ├─ Se ataque a membro específico:
   │  ├─ Dano vai para limb.hp
   │  └─ Se limb.hp <= 0: DESMEMBRAR
   └─ Se ataque geral:
      └─ Dano distribuído por membros

4. DESMEMBRAMENTO
   ├─ limb.isAttached = false
   ├─ Criar novo Entity para membro solto
   ├─ Membro ganha RigidBody próprio
   ├─ Aplicar força de separação
   ├─ Membro cai no chão (física)
   ├─ Se membro vital: entity pode morrer
   └─ Começar sangramento em entity principal

5. SANGRAMENTO
   ├─ A cada turno: entity.hp -= bleedingRate
   ├─ bleedingRate baseado em membros perdidos
   └─ Pode ser estancado com ação "Curar"
```

### Fluxo de Escalada
```
1. INICIAR ESCALADA
   ├─ Verificar se alvo é escalável
   ├─ Verificar distância (deve estar adjacente)
   └─ Criar ClimbData

2. ESCALANDO
   ├─ A cada turno:
   │  ├─ Consumir stamina
   │  ├─ Calcular fallRisk baseado em:
   │  │  ├─ Número de grips atuais
   │  │  ├─ Stamina restante
   │  │  ├─ Dificuldade da superfície
   │  │  └─ Se está sendo atacado
   │  └─ Mover para próximo grip point
   └─ Repeat até chegar ao topo

3. ATACAR ENQUANTO ESCALANDO
   ├─ Escolher weak point
   ├─ Calcular dano com bonus
   ├─ Alvo tem dificuldade em defender
   └─ Risco: pode cair se contra-atacado

4. CAIR
   ├─ Calcular altura da queda
   ├─ Dano = (altura em metros) * 1d6
   ├─ Knockdown (caído no chão)
   └─ Perder turno para se levantar
```

---

## ⚠️ REGRAS CRÍTICAS

### 1. NUNCA Quebrar Compatibilidade
- Ao modificar interfaces existentes, sempre adicionar campos opcionais
- Nunca remover campos, apenas depreciar
- Manter backward compatibility por pelo menos 2 versões

### 2. Sistema de Eventos
- Todos sistemas se comunicam via eventos, não diretamente
- EventEmitter centralizado
- Evita acoplamento

### 3. Performance
- Máximo 100 entidades simultâneas (otimizar se mais)
- Instancing para objetos repetidos
- LOD para criaturas distantes
- Object pooling para efeitos visuais

### 4. Salvamento
- TODO estado DEVE ser serializável em JSON
- Não guardar referências circulares
- IDs, não objetos

### 5. Física e Gameplay
- Física é simulada, mas gameplay tem prioridade
- Se realismo conflitar com diversão: escolher diversão
- Exemplo: dragão deveria ser pesado demais para voar, mas deixa voar porque é legal

---

## 📝 CHECKLIST ANTES DE ADICIONAR FEATURE

Antes de adicionar qualquer feature nova, pergunte:

```
☐ A feature segue a estrutura de dados definida aqui?
☐ Os tipos TypeScript estão corretos?
☐ Adiciona campos ao GameState de forma não-breaking?
☐ Dispara eventos apropriados?
☐ Funciona com o sistema de save/load?
☐ Performance testada? (60 FPS com carga normal)
☐ UI/UX considerada?
☐ Debug tools adicionadas?
☐ Comentários/documentação atualizados?
☐ Não quebra funcionalidades existentes?
```

---

## 🎯 PROMPTS FUTUROS DEVEM INCLUIR

**SEMPRE começar próximos prompts com:**

```
CONTEXTO: Continuando o RPG 3D Tático.

CONSULTE: /ARCHITECTURE_REFERENCE.md para estruturas de dados.

IMPORTANTE: 
- Seguir EXATAMENTE as interfaces definidas
- NÃO modificar estruturas existentes sem adicionar campos opcionais
- Todos novos sistemas devem usar o padrão definido
- Manter compatibilidade com save/load

[resto do prompt específico da feature]
```

---

## 🔮 PRÓXIMAS FASES PLANEJADAS

### Fase 2: Física com Rapier ✓
- RigidBodies para todas entidades
- Colliders precisos
- Forças, impulsos, arremessos
- Ragdoll em membros

### Fase 3: Desmembramento ✓
- Membros separáveis
- HP individual por membro
- Sangramento
- Membros no chão com física

### Fase 4: Escalada e Grappling ✓
- Sistema de grip points
- Escalar criaturas grandes
- Agarrar e arrastar
- Arremessar entidades

### Fase 5: Modelos 3D e Animações
- Importar GLTF/GLB
- Animações (idle, walk, attack, death)
- Blend entre animações
- IK (Inverse Kinematics)

### Fase 6: IA Avançada
- Pathfinding com A*
- Comportamentos complexos (FSM)
- Formações táticas
- Comunicação entre NPCs

### Fase 7: Sistema de Items e Inventário
- Equipamentos (armas, armaduras)
- Inventário
- Crafting
- Efeitos de items

### Fase 8: Magia e Habilidades Especiais
- Sistema de mana
- Spells com efeitos visuais
- Cooldowns
- Buffs/Debuffs

---

**FIM DA REFERÊNCIA DE ARQUITETURA**

Este documento é vivo e deve ser atualizado conforme o projeto evolui.
Sempre consulte antes de adicionar novas funcionalidades! 🏗️
