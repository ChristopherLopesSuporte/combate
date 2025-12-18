# 🗺️ ROADMAP DE EVOLUÇÃO - RPG 3D TÁTICO

**Estratégia:** Começar simples, evoluir gradualmente, preparar para multiplayer

---

## 📊 VISÃO GERAL DAS FASES

```
FASE 1 (Prompts 1-7)
└─ MVP Jogável
   ├─ Combate simples (d20 + stats)
   ├─ Turnos simultâneos básicos
   ├─ Reações nível 1 (binário)
   └─ 2-3 tipos de armas

FASE 1.5 (Prompts 8-10)
└─ Preparação & Polish
   ├─ Arquitetura multiplayer preparada
   ├─ Sistema de armas expandido
   ├─ Reações nível 2 (commitment)
   └─ Sistema de stamina/fadiga

FASE 2 (Prompts 11-14)
└─ Física Completa
   ├─ Rapier integrado
   ├─ Colisões realistas
   ├─ Arremessos e ragdoll
   └─ Objetos destrutíveis

FASE 3 (Prompts 15-18)
└─ Sistema de Combate Avançado
   ├─ Migração para ruego.md
   ├─ Tempos em milissegundos
   ├─ IC (Índice de Combate)
   ├─ Armaduras e qualidade
   └─ Reações nível 3 (completo)

FASE 4 (Prompts 19-20)
└─ Multiplayer
   ├─ WebSocket server
   ├─ Sincronização de estado
   ├─ 1v1 depois 2v2+
   └─ Anti-trapaça

FASE 5+ (Futuro)
└─ Desmembramento, Escalada, Modelos 3D, etc
```

---

## 🎯 FASE 1: MVP (ATUAL - Prompts 1-7)

### Sistema de Combate: SIMPLES

```typescript
// Combate básico - d20 + atributos
interface CombatSimple {
  attack: number;    // 1d20 + strength
  defense: number;   // 1d20 + agility
  damage: number;    // attack - defense (se positivo)
}

// Stats básicos
interface Stats {
  strength: number;   // 0-100
  agility: number;    // 0-100
  perception: number; // 0-100
  hp: number;
  stamina: number;
}

// Armas simples
interface WeaponSimple {
  name: string;
  damage: number;
  range: number;
  attackTime: number; // turnos abstratos
}
```

### Sistema de Reações: NÍVEL 1 (Binário)

```typescript
// Percepção simples
function canPerceive(observer: Entity, action: Action): boolean {
  const roll = rollDice(20);
  return (roll + observer.perception / 10) > 15; // DC fixo
}

// Sem penalidades
// Jogador pode trocar ação livremente se perceber
```

### Características Fase 1:
- ✅ Jogo jogável end-to-end
- ✅ Combate funcional mas simples
- ✅ Turnos simultâneos com pausas
- ✅ 2-3 tipos de personagens
- ✅ UI completa e polida
- ❌ Sem física avançada
- ❌ Sem sistema de tempo preciso
- ❌ Sem multiplayer

---

## 🔧 FASE 1.5: PREPARAÇÃO & POLISH (Prompts 8-10)

### PROMPT 8: Arquitetura Multiplayer Preparada

**Objetivo:** Preparar código para multiplayer futuro SEM implementar

```typescript
// 1. Separar lógica de apresentação
// ANTES (Fase 1):
function executeAttack(attacker: Entity, target: Entity) {
  const damage = calculateDamage(...);
  target.hp -= damage;
  updateUI(); // ❌ Acoplado
}

// DEPOIS (Fase 1.5):
function executeAttack(attacker: Entity, target: Entity): CombatEvent {
  const damage = calculateDamage(...);
  return {
    type: 'attack',
    attackerId: attacker.id,
    targetId: target.id,
    damage,
    timestamp: Date.now()
  }; // ✅ Retorna evento, não muta diretamente
}

// 2. Sistema de eventos determinísticos
class GameState {
  applyEvent(event: GameEvent): void {
    // Determinístico - mesmo input = mesmo output
    // Essencial para multiplayer
  }
}

// 3. Validação server-side ready
class ActionValidator {
  validateAction(action: PlannedAction, state: GameState): ValidationResult {
    // Pode ser rodado no servidor futuramente
    if (!this.hasStamina(action, state)) return { valid: false, reason: 'no_stamina' };
    if (!this.inRange(action, state)) return { valid: false, reason: 'out_of_range' };
    return { valid: true };
  }
}

// 4. Separar input de execução
interface InputCommand {
  playerId: string;
  entityId: string;
  action: PlannedAction;
  timestamp: number;
}

// No futuro: InputCommand vem do servidor
// Por enquanto: InputCommand vem local
```

**Estrutura de pastas adicional:**
```
src/
├── core/
│   └── GameState.ts          // Estado determinístico
├── network/ (criar vazio)
│   ├── NetworkManager.ts     // TODO: Fase 4
│   ├── EventSynchronizer.ts  // TODO: Fase 4
│   └── types.ts              // Tipos prontos agora
└── validation/
    └── ActionValidator.ts    // Validação server-ready
```

### PROMPT 9: Expansão de Armas e Stamina

**Sistema de Armas Expandido:**

```typescript
interface Weapon {
  // Básico (já existe)
  name: string;
  damage: number;
  range: number;
  
  // NOVO: Múltiplas ações
  actions: {
    [key in AttackAction]: {
      time: number;      // Ainda abstrato (turnos)
      staminaCost: number;
      damageMultiplier: number;
    }
  };
}

enum AttackAction {
  JAB = 'jab',           // Rápido, pouco dano
  STRIKE = 'strike',     // Normal
  HEAVY = 'heavy',       // Lento, muito dano
  THRUST = 'thrust',     // Estocada
}

// Preparado para ruego.md
interface WeaponAdvanced extends Weapon {
  // Campos opcionais que virão na Fase 3
  weaponType?: WeaponType;     // Para calcular IC
  actionTimesMs?: Map<AttackAction, number>; // Tempos precisos
  forceRequired?: number;
}
```

**Sistema de Stamina/Fadiga:**

```typescript
interface StaminaSystem {
  current: number;
  max: number;
  regenRate: number;      // Por turno
  
  // Preparado para ruego.md
  fatigueLevel?: number;  // 0-100 (Fase 3)
  fatigueModifier?: number; // Multiplicador de tempo (Fase 3)
}

// Fadiga simples (Fase 1.5)
function getFatigueModSimple(stamina: number, maxStamina: number): number {
  const percent = stamina / maxStamina;
  if (percent > 0.5) return 1.0;      // Sem fadiga
  if (percent > 0.25) return 1.1;     // +10%
  return 1.3;                          // +30%
}

// Fadiga complexa (Fase 3 - ruego.md)
function getFatigueModComplex(fatiguePercent: number): number {
  if (fatiguePercent < 25) return 1.0;
  if (fatiguePercent < 50) return 1.1;
  if (fatiguePercent < 75) return 1.3;
  return 1.6; // 76-100%
}
```

### PROMPT 10: Sistema de Reações Nível 2 (Commitment)

**Commitment System:**

```typescript
interface ActionInProgress {
  entityId: string;
  action: PlannedAction;
  
  // Timing
  startTime: number;
  currentProgress: number;    // 0-1
  totalTime: number;
  
  // Commitment
  commitmentLevel: number;    // 0-1
  canCancel: boolean;
  
  // NOVO: Penalidades
  cancelPenalty: number;      // % adicional se cancelar
  changePenalty: number;      // % adicional se mudar
}

// Cálculo de commitment
function calculateCommitment(progress: number, actionType: ActionType): number {
  // Ações rápidas (jab) comprometem menos
  // Ações lentas (heavy) comprometem mais
  
  const baseCommitment = progress;
  
  const multipliers = {
    jab: 0.7,      // Pouco comprometimento
    strike: 1.0,   // Normal
    heavy: 1.5,    // Alto comprometimento
  };
  
  return Math.min(1, baseCommitment * (multipliers[actionType] || 1.0));
}

// Penalidades baseadas em commitment
function getCancelPenalty(commitment: number): number {
  // 0% commitment = sem penalidade
  // 50% commitment = +25% tempo
  // 100% commitment = +50% tempo
  return commitment * 0.5;
}

function getChangePenalty(commitment: number): number {
  // Trocar é menos penoso que cancelar
  return commitment * 0.3;
}
```

**Janela de Reação Melhorada:**

```typescript
interface ReactionWindow {
  timeRemaining: number;
  commitment: number;
  
  options: ReactionOption[];
}

interface ReactionOption {
  type: 'continue' | 'defend' | 'dodge' | 'counter' | 'cancel';
  label: string;
  description: string;
  
  // NOVO: Penalidades visuais
  timePenalty: number;        // % adicional
  staminaCost: number;
  
  // Indica viabilidade
  recommended: boolean;
  warning?: string;           // "Alto risco de falha!"
}

// Exemplo de opções
function generateReactionOptions(
  action: ActionInProgress,
  threat: PerceivedThreat
): ReactionOption[] {
  
  const commitment = action.commitmentLevel;
  
  return [
    {
      type: 'continue',
      label: 'Continuar Ataque',
      description: 'Seguir com o ataque original',
      timePenalty: 0,
      staminaCost: 0,
      recommended: commitment > 0.7, // Já investiu muito
    },
    {
      type: 'defend',
      label: 'Mudar para Defesa',
      description: 'Aparar ou bloquear',
      timePenalty: getCancelPenalty(commitment) * 0.5,
      staminaCost: 10,
      recommended: threat.damage > 20,
      warning: commitment > 0.5 ? 'Já muito comprometido' : undefined,
    },
    {
      type: 'dodge',
      label: 'Esquivar',
      description: 'Rolar para o lado',
      timePenalty: getCancelPenalty(commitment) * 0.6,
      staminaCost: 15,
      recommended: threat.isAOE,
    },
    {
      type: 'cancel',
      label: 'Cancelar e Recuar',
      description: 'Abortar ação e recuar',
      timePenalty: getCancelPenalty(commitment),
      staminaCost: 5,
      recommended: false,
      warning: commitment > 0.3 ? 'Grande penalidade!' : undefined,
    },
  ];
}
```

### Características Fase 1.5:
- ✅ Código preparado para multiplayer
- ✅ Sistema de eventos determinístico
- ✅ Validação server-ready
- ✅ Armas com múltiplas ações
- ✅ Stamina e fadiga básicos
- ✅ Commitment system funcional
- ✅ Reações com penalidades
- ❌ Ainda sem multiplayer real
- ❌ Ainda sem tempos precisos (ms)

---

## ⚙️ FASE 2: FÍSICA COMPLETA (Prompts 11-14)

### PROMPT 11: Integração Rapier Physics

**Já documentado nos prompts originais**

Foco: Física, colisões, arremessos, ragdoll

### PROMPT 12-14: Desmembramento

**Já documentado nos prompts originais**

---

## 🎮 FASE 3: SISTEMA RUEGO.MD COMPLETO (Prompts 15-18)

### PROMPT 15: Migração para Sistema de Tempo em MS

**Transição Gradual:**

```typescript
// ANTES (Fase 1.5 - Turnos abstratos)
interface Action {
  time: number; // "turnos" (1, 2, 3...)
}

// DURANTE (Fase 3 - Híbrido)
interface Action {
  time: number;           // Ainda em turnos para compatibilidade
  timeMs?: number;        // NOVO: tempo preciso em milissegundos
  usePreciseTiming: boolean; // Flag para alternar
}

// DEPOIS (Fase 3 completa)
interface Action {
  timeMs: number;         // Apenas MS
}
```

**Sistema de Conversão:**

```typescript
class TimingMigration {
  // Converte sistema antigo para novo
  static turnToMs(turns: number): number {
    // 1 turno abstrato = ~300ms (ajustável)
    return turns * 300;
  }
  
  // Converte armas antigas
  static migrateWeapon(oldWeapon: WeaponSimple): WeaponAdvanced {
    return {
      ...oldWeapon,
      actionTimesMs: new Map([
        ['jab', this.turnToMs(oldWeapon.attackTime * 0.7)],
        ['strike', this.turnToMs(oldWeapon.attackTime)],
        ['heavy', this.turnToMs(oldWeapon.attackTime * 1.5)],
      ]),
      usePreciseTiming: true,
    };
  }
}
```

### PROMPT 16: Implementar IC (Índice de Combate)

**Sistema IC - ruego.md:**

```typescript
interface CombatIndex {
  // Índice de Combate calculado
  ic: number; // 0.20 a 1.00
  
  // Pesos por tipo de arma
  weights: {
    velocity: number;
    skill: number;
    agility: number;
    force: number;
  };
}

// Cálculo do IC
function calculateIC(
  stats: EntityStats,
  weaponType: WeaponType
): number {
  
  const weights = getWeaponWeights(weaponType);
  
  const ic = (100 
    - stats.velocidade * weights.velocity
    - stats.habilidade * weights.skill
    - stats.agilidade * weights.agility
    - stats.forca * weights.force
  ) / 100;
  
  // Limitar mínimo
  return Math.max(0.20, ic);
}

// Pesos por tipo (ruego.md)
function getWeaponWeights(type: WeaponType): ICWeights {
  const weaponWeights = {
    unarmed: { velocity: 0.20, skill: 0.15, agility: 0.15, force: 0.00 },
    dagger: { velocity: 0.20, skill: 0.20, agility: 0.10, force: 0.00 },
    sword_1h: { velocity: 0.15, skill: 0.20, agility: 0.10, force: 0.05 },
    sword_2h: { velocity: 0.10, skill: 0.15, agility: 0.05, force: 0.20 },
    axe: { velocity: 0.05, skill: 0.10, agility: 0.05, force: 0.30 },
    // ... etc (ver ruego.md)
  };
  
  return weaponWeights[type];
}

// Calcular TE (Tempo Equipado)
function calculateTE(
  baseTimeMs: number,
  ic: number,
  armor: Armor,
  weaponQuality: WeaponQuality
): number {
  
  // TE = (Tempo_Arma × IC × Mult_Força × Mult_Qualidade) + Pen_Armadura
  
  let te = baseTimeMs * ic;
  
  // Qualidade
  te *= weaponQuality.timeMultiplier;
  
  // Armadura (não afeta esquiva)
  if (!action.isDodge) {
    te += armor.timePenaltyMs;
  }
  
  return Math.round(te);
}
```

### PROMPT 17: Sistema de Armadura e Qualidade

**Armaduras (ruego.md):**

```typescript
interface Armor {
  name: string;
  timePenaltyMs: number;      // +10ms a +100ms
  fatigueMultiplier: number;  // ×1.0 a ×2.0
  protection: number;         // 0 a 45
}

const armors: Armor[] = [
  { name: 'None', timePenaltyMs: 0, fatigueMultiplier: 1.0, protection: 0 },
  { name: 'Leather', timePenaltyMs: 10, fatigueMultiplier: 1.0, protection: 5 },
  { name: 'Chainmail', timePenaltyMs: 40, fatigueMultiplier: 1.3, protection: 20 },
  { name: 'Full Plate', timePenaltyMs: 100, fatigueMultiplier: 2.0, protection: 45 },
];
```

**Qualidade de Armas (ruego.md):**

```typescript
interface WeaponQuality {
  name: string;
  timeMultiplier: number;     // ×0.80 a ×1.10
  damageMultiplier: number;   // ×0.9 a ×1.5
  skillRequired: number;      // 0 a 95
}

const qualities: WeaponQuality[] = [
  { name: 'Poor', timeMultiplier: 1.10, damageMultiplier: 0.9, skillRequired: 0 },
  { name: 'Common', timeMultiplier: 1.00, damageMultiplier: 1.0, skillRequired: 0 },
  { name: 'Good', timeMultiplier: 0.95, damageMultiplier: 1.1, skillRequired: 40 },
  { name: 'Excellent', timeMultiplier: 0.90, damageMultiplier: 1.2, skillRequired: 60 },
  { name: 'Masterwork', timeMultiplier: 0.85, damageMultiplier: 1.3, skillRequired: 80 },
  { name: 'Legendary', timeMultiplier: 0.80, damageMultiplier: 1.5, skillRequired: 95 },
];

// Aproveitamento (ruego.md)
function calculateUtilization(skill: number, required: number): number {
  return Math.min(1, skill / required);
}

function getEffectiveMultiplier(
  baseMultiplier: number,
  skill: number,
  required: number
): number {
  const utilization = calculateUtilization(skill, required);
  return 1 - (1 - baseMultiplier) * utilization;
}
```

### PROMPT 18: Sistema de Reações Nível 3 (COMPLETO)

**Percepção Contínua:**

```typescript
class PerceptionSystem {
  private checkInterval = 50; // Verificar a cada 50ms
  
  continuousPerceptionCheck(
    observer: Entity,
    actions: Map<string, ActionInProgress>,
    currentTime: number
  ): PerceptionEvent[] {
    
    const events: PerceptionEvent[] = [];
    
    for (const [entityId, action] of actions) {
      if (entityId === observer.id) continue; // Não percebe a si mesmo
      
      // Visibilidade baseada em progresso
      const visibility = this.calculateVisibility(action);
      
      // Teste de percepção
      const perceptionRoll = rollDice(20) + observer.stats.perception / 10;
      const dc = 15 - visibility * 10; // Mais visível = mais fácil perceber
      
      if (perceptionRoll >= dc && !action.wasPerceivedBy.has(observer.id)) {
        events.push({
          type: 'action_perceived',
          observerId: observer.id,
          actorId: entityId,
          action: action.action,
          timeRemaining: action.totalTime - action.currentProgress,
          threat: this.assessThreat(action, observer),
        });
        
        action.wasPerceivedBy.add(observer.id);
      }
    }
    
    return events;
  }
  
  // Visibilidade aumenta com progresso
  private calculateVisibility(action: ActionInProgress): number {
    // 0-30% progresso: 20% visível
    // 30-60%: 60% visível
    // 60-100%: 100% visível
    
    const progress = action.currentProgress / action.totalTime;
    
    if (progress < 0.3) return 0.2;
    if (progress < 0.6) return 0.6;
    return 1.0;
  }
  
  // Avaliar ameaça
  private assessThreat(action: ActionInProgress, target: Entity): ThreatAssessment {
    const actor = this.getEntity(action.entityId);
    
    return {
      damage: this.estimateDamage(actor, action.action, target),
      willHit: this.estimateHitChance(actor, action.action, target),
      timeToImpact: action.totalTime - action.currentProgress,
      severity: 'low' | 'medium' | 'high' | 'critical',
    };
  }
}
```

**Modificadores Situacionais (ruego.md):**

```typescript
interface SituationalModifiers {
  guard: 'high' | 'medium' | 'low';       // +10%, 0%, -10%
  fatigue: number;                         // 0-100%
  position: 'advantage' | 'neutral' | 'disadvantage'; // -10%, 0%, +20%
  injuries: Injury[];
  terrain: 'stable' | 'unstable';
}

function calculateSituationalMultiplier(mods: SituationalModifiers): number {
  let totalMod = 0;
  
  // Guarda
  const guardMods = { high: 10, medium: 0, low: -10 };
  totalMod += guardMods[mods.guard];
  
  // Fadiga (ruego.md)
  if (mods.fatigue < 25) totalMod += 0;
  else if (mods.fatigue < 50) totalMod += 10;
  else if (mods.fatigue < 75) totalMod += 30;
  else totalMod += 60;
  
  // Posição
  const posMods = { advantage: -10, neutral: 0, disadvantage: 20 };
  totalMod += posMods[mods.position];
  
  // Ferimentos
  for (const injury of mods.injuries) {
    if (injury.limb === 'arm') totalMod += 15;
    if (injury.limb === 'leg') totalMod += 10;
  }
  
  // Terreno
  if (mods.terrain === 'unstable') totalMod += 10;
  
  return 1 + (totalMod / 100);
}

// Tempo final completo (ruego.md)
function calculateFinalTime(
  te: number,
  situationalMods: SituationalModifiers,
  magicMod: number = 1.0
): number {
  
  const sitMult = calculateSituationalMultiplier(situationalMods);
  
  return Math.round(te * sitMult * magicMod);
}
```

**Exemplo Completo (dois soldados):**

```typescript
// Marcus vs Goblin (exemplo do ruego.md)

// 1. DECLARAÇÃO
Marcus.declareAction({
  type: 'attack',
  attackType: 'slash',
  targetId: goblin.id,
});

Goblin.declareAction({
  type: 'attack',
  attackType: 'jab',
  targetId: marcus.id,
});

// 2. CÁLCULO DE TEMPOS
// Marcus: Espada Longa (Corte)
const marcusIC = 0.651; // Calculado com seus stats
const marcusTE = 320 * marcusIC; // 208ms
const marcusArmor = 40; // Cota de malha
const marcusFinal = marcusTE + marcusArmor; // 248ms

// Goblin: Adaga (Jab)
const goblinIC = 0.720;
const goblinTE = 120 * goblinIC; // 86ms
const goblinArmor = 0; // Sem armadura
const goblinFinal = goblinTE; // 86ms

// 3. EXECUÇÃO SIMULTÂNEA
timeline.start();

// t=30ms - Goblin ficou 35% visível
const perceptionRoll = rollDice(20) + marcus.stats.perception / 10;
// Marcus PER 72: roll 15 = 22 (sucesso! DC era 18)

// PAUSA - Janela de reação Marcus
const commitment = 30 / 248 = 0.12; // 12% comprometido

options = [
  { type: 'continue', penalty: 0 },
  { type: 'defend', penalty: 0.12 * 0.3 }, // +3.6% tempo
  { type: 'dodge', penalty: 0.12 * 0.4 },  // +4.8% tempo
];

// Marcus escolhe defender
newAction = 'parry';
newTE = 150 * 0.648 + 40 = 137ms;
penalty = 137 * 1.036 = 142ms;
finalTime = 30 + 142 = 172ms;

// t=86ms - Goblin ataca (Marcus ainda defendendo)
// t=172ms - Marcus bloqueia
// Resultado: Bloqueio bem sucedido!
```

### Características Fase 3:
- ✅ Tempo em milissegundos preciso
- ✅ IC (Índice de Combate) completo
- ✅ Sistema de armaduras e qualidade
- ✅ Modificadores situacionais (ruego.md)
- ✅ Percepção contínua
- ✅ Reações completas com commitment
- ✅ Sistema 100% compatível com ruego.md
- ✅ Código ainda funciona sem multiplayer

---

## 🌐 FASE 4: MULTIPLAYER (Prompts 19-20)

### PROMPT 19: WebSocket Server e Sincronização

**Tecnologias:**
- **Server:** Node.js + Socket.io ou Colyseus
- **Protocolo:** WebSocket
- **Autoridade:** Server autoritativo

**Arquitetura:**

```typescript
// Cliente
class NetworkClient {
  socket: Socket;
  
  sendInput(input: InputCommand): void {
    // Enviar para servidor
    this.socket.emit('input', input);
  }
  
  onStateUpdate(callback: (state: GameState) => void): void {
    // Receber estado do servidor
    this.socket.on('state_update', callback);
  }
}

// Servidor
class GameServer {
  private gameState: GameState;
  private inputBuffer: InputCommand[] = [];
  
  onPlayerInput(playerId: string, input: InputCommand): void {
    // Validar input
    if (!this.validator.validate(input, this.gameState)) {
      return; // Ignorar input inválido (anti-trapaça)
    }
    
    // Adicionar ao buffer
    this.inputBuffer.push(input);
  }
  
  update(deltaTime: number): void {
    // Processar inputs
    for (const input of this.inputBuffer) {
      this.gameState.applyInput(input);
    }
    this.inputBuffer = [];
    
    // Simular física/combate
    this.gameState.update(deltaTime);
    
    // Broadcast estado
    this.broadcastState();
  }
  
  broadcastState(): void {
    // Enviar estado para todos clientes
    const serialized = this.gameState.serialize();
    this.io.emit('state_update', serialized);
  }
}
```

**Estado Determinístico:**

```typescript
// CRÍTICO: Mesmo input = mesmo output
class GameState {
  private rng: SeededRandom; // RNG com seed
  
  applyInput(input: InputCommand): void {
    // Processar deterministicamente
    const entity = this.entities.get(input.entityId);
    
    // Validar (redundante, servidor já validou)
    if (!this.canExecuteAction(entity, input.action)) {
      return;
    }
    
    // Aplicar
    entity.planAction(input.action);
  }
  
  // Rolagem de dados determinística
  rollDice(sides: number): number {
    return this.rng.nextInt(1, sides);
  }
}
```

### PROMPT 20: Matchmaking e Anti-Trapaça

**Sistema de Salas:**

```typescript
interface GameRoom {
  id: string;
  players: Player[];
  maxPlayers: number;
  state: 'waiting' | 'playing' | 'finished';
  gameState: GameState;
}

class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();
  
  createRoom(hostId: string, config: RoomConfig): GameRoom {
    const room = {
      id: generateId(),
      players: [{ id: hostId, ready: false }],
      maxPlayers: config.maxPlayers,
      state: 'waiting',
      gameState: new GameState(config),
    };
    
    this.rooms.set(room.id, room);
    return room;
  }
  
  joinRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return false;
    }
    
    room.players.push({ id: playerId, ready: false });
    return true;
  }
}
```

**Anti-Trapaça:**

```typescript
class CheatDetection {
  // Detectar inputs impossíveis
  validateInput(input: InputCommand, state: GameState): ValidationResult {
    const entity = state.entities.get(input.entityId);
    
    // Player controla essa entidade?
    if (entity.controllerId !== input.playerId) {
      return { valid: false, reason: 'not_controlled', suspicious: true };
    }
    
    // Ação é fisicamente possível?
    if (!this.isPhysicallyPossible(input.action, entity, state)) {
      return { valid: false, reason: 'impossible_action', suspicious: true };
    }
    
    // Taxa de input razoável?
    if (this.getInputRate(input.playerId) > 10) { // 10 inputs/segundo
      return { valid: false, reason: 'too_many_inputs', suspicious: true };
    }
    
    return { valid: true };
  }
  
  // Detectar padrões suspeitos
  analyzePlayerBehavior(playerId: string): TrustScore {
    const history = this.getInputHistory(playerId);
    
    let suspicionLevel = 0;
    
    // Precisão sobre-humana?
    if (this.getAverageAccuracy(history) > 0.95) {
      suspicionLevel += 30;
    }
    
    // Tempo de reação sobre-humano?
    if (this.getAverageReactionTime(history) < 100) { // <100ms
      suspicionLevel += 40;
    }
    
    // Inputs perfeitamente regulares? (bot)
    if (this.getInputVariance(history) < 0.01) {
      suspicionLevel += 50;
    }
    
    return {
      playerId,
      suspicionLevel,
      trusted: suspicionLevel < 50,
    };
  }
}
```

### Características Fase 4:
- ✅ Multiplayer 1v1
- ✅ Multiplayer 2v2
- ✅ Sistema de salas
- ✅ Matchmaking básico
- ✅ Anti-trapaça
- ✅ Sincronização confiável
- ✅ Servidor autoritativo

---

## 📋 CHECKLIST DE COMPATIBILIDADE

### Ao Implementar Cada Fase:

**✓ Fase 1 → Fase 1.5:**
- [ ] Stats existentes ainda funcionam
- [ ] Armas antigas migram automaticamente
- [ ] Save/load ainda funciona
- [ ] UI não quebrou

**✓ Fase 1.5 → Fase 2:**
- [ ] Física não quebra combate
- [ ] Eventos determinísticos funcionam
- [ ] Validação server-ready funciona

**✓ Fase 2 → Fase 3:**
- [ ] Turnos abstratos → MS com conversão
- [ ] IC calculado corretamente
- [ ] Modificadores aplicam
- [ ] Sistema antigo ainda jogável (flag)

**✓ Fase 3 → Fase 4:**
- [ ] Estado serializa/deserializa
- [ ] Inputs validam no servidor
- [ ] RNG é determinístico
- [ ] Sem desync entre clientes

---

## 🎯 RESUMO EXECUTIVO

### Timeline Estimado:
- **Fase 1:** 2-4 horas (7 prompts)
- **Fase 1.5:** 1-2 horas (3 prompts)
- **Fase 2:** 2-3 horas (física)
- **Fase 3:** 3-4 horas (ruego.md completo)
- **Fase 4:** 4-6 horas (multiplayer)

**Total:** ~15-20 horas de desenvolvimento com Claude

### Quando Fazer Cada Fase:
1. **Agora:** Fase 1 (MVP jogável)
2. **Depois de testar bem:** Fase 1.5 (preparação)
3. **Quando satisfeito com gameplay:** Fase 2 (física)
4. **Quando física estável:** Fase 3 (ruego.md)
5. **Quando sistema completo:** Fase 4 (multiplayer)

---

**Próximos Passos:**
1. ✅ Executar Prompts 1-7 (MVP)
2. ⏸️ Testar e iterar
3. ➡️ Decidir quando avançar para Fase 1.5

**Lembrete:** Sempre consultar `ARCHITECTURE_REFERENCE.md` antes de cada prompt!
