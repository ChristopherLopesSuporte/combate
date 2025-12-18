# 🎮 RPG 3D Tático - Guia de Desenvolvimento em Fases

## 📋 Visão Geral

Este documento contém todos os prompts necessários para construir um RPG 3D tático com física realista, sistema de desmembramento, escalada e combate baseado em turnos pausados.

## 📚 DOCUMENTOS COMPLEMENTARES

**⚠️ IMPORTANTE:** Este é apenas um dos documentos do projeto. Consulte também:

1. **ARCHITECTURE_REFERENCE.md** - Estruturas de dados canônicas, templates de criação
2. **ROADMAP.md** - Evolução detalhada do sistema por fases, preparação para multiplayer
3. **MIGRATION_GUIDE.md** - Como migrar do sistema simples para ruego.md
4. **ruego.md** - Sistema de combate completo (Fase 3)

**Ordem de leitura recomendada:**
1. Este arquivo (rpg-3d-prompts.md) - Prompts 1-7
2. ARCHITECTURE_REFERENCE.md - Antes de qualquer expansão
3. ROADMAP.md - Para entender as próximas fases
4. MIGRATION_GUIDE.md - Quando for evoluir o sistema

**Stack Tecnológico:**
- React + TypeScript + Vite
- React Three Fiber
- @react-three/drei
- @react-three/rapier (física)
- Zustand (estado)

**Filosofia de Desenvolvimento:**
- Começar simples, arquitetura preparada para expansão
- Cada prompt adiciona uma camada de funcionalidade
- Código modular e testável

---

## 🚀 PROMPT 1: Setup Inicial e Arquitetura Base

```
Preciso criar um jogo RPG 3D tático com React, TypeScript e Vite. Este será um projeto modular construído em fases.

STACK OBRIGATÓRIO:
- React 18 + TypeScript
- Vite (build tool)
- React Three Fiber (@react-three/fiber)
- @react-three/drei
- @react-three/rapier
- Zustand

OBJETIVO DESTE PROMPT:
Criar a estrutura inicial do projeto com:
1. Setup do Vite com TypeScript configurado
2. Estrutura de pastas modular (veja abaixo)
3. Configuração básica do Three.js/R3F
4. Cena 3D mínima funcionando (plano, câmera, luz)
5. Zustand store básico
6. README.md explicando o projeto

ESTRUTURA DE PASTAS OBRIGATÓRIA:

src/
├── core/
│   ├── Grid.tsx               # Sistema de tabuleiro (criar vazio)
│   ├── EntityManager.ts       # Gerencia entidades (criar vazio)
│   └── TimelineManager.ts     # Sistema de turnos (criar vazio)
├── entities/
│   ├── Entity.ts              # Classe base de entidade
│   ├── Limb.ts                # Para membros (criar vazio, usar no futuro)
│   └── entityConfigs.json     # Configurações de criaturas
├── combat/
│   ├── CombatSystem.ts        # Cálculos de combate (criar vazio)
│   ├── AttackTypes.ts         # Tipos de ataque (criar vazio)
│   └── DamageCalculator.ts    # Cálculo de dano (criar vazio)
├── physics/
│   ├── PhysicsEngine.tsx      # Wrapper Rapier (criar vazio)
│   └── CollisionHandler.ts    # Colisões (criar vazio)
├── systems/
│   ├── MovementSystem.ts      # Sistema de movimento (criar vazio)
│   ├── DecisionSystem.ts      # Conflitos/pausas (criar vazio)
│   ├── GrappleSystem.ts       # Agarrar (criar vazio)
│   └── ClimbingSystem.ts      # Escalada (criar vazio)
├── ui/
│   ├── HUD.tsx                # Interface principal
│   ├── StatsEditor.tsx        # Editor de stats (criar vazio)
│   ├── DebugPanel.tsx         # Painel debug (criar vazio)
│   └── GameControls.tsx       # Controles (criar vazio)
├── utils/
│   ├── SaveSystem.ts          # Salvar/carregar (criar vazio)
│   └── MathUtils.ts           # Utilitários matemáticos
├── store/
│   └── gameStore.ts           # Zustand store principal
├── types/
│   └── index.ts               # TypeScript types globais
└── App.tsx

CENA 3D INICIAL:
- Canvas R3F configurado
- Câmera perspectiva com OrbitControls
- Luz ambiente + luz direcional
- Plano cinza representando o tabuleiro (10x10 metros)
- Grid helper visível

ZUSTAND STORE INICIAL:
interface GameState {
  entities: Entity[];
  selectedEntityId: string | null;
  gamePhase: 'planning' | 'execution' | 'paused';
  gridSize: number;
  showGrid: boolean;
  gridMode: 'squares' | 'meters';
}

TYPES BÁSICOS:
interface Entity {
  id: string;
  name: string;
  position: [number, number, number];
  size: number; // altura em metros
  radius: number; // raio de ocupação
  stats: EntityStats;
}

interface EntityStats {
  hp: number;
  maxHp: number;
  strength: number;
  perception: number;
  speed: number; // metros por turno
}

README.md DEVE CONTER:
- Descrição do projeto
- Como instalar e rodar
- Explicação da arquitetura
- Roadmap das próximas fases
- Decisões técnicas importantes

IMPORTANTE:
- Comente TODO o código
- Use TypeScript estrito
- Marque arquivos vazios com comentário: "// TODO: Fase X - Implementar [funcionalidade]"
- Garanta que o projeto rode com npm install && npm run dev

Crie o projeto completo funcionando com essa estrutura base.
```

---

## 📐 PROMPT 2: Sistema de Grid e Configurações

```
Continuando o projeto RPG 3D. Agora vou implementar o sistema de grid dinâmico e configurações.

CONTEXTO:
Você já criou a estrutura base no prompt anterior. Agora preciso:

1. SISTEMA DE GRID CONFIGURÁVEL (core/Grid.tsx)

O Grid deve suportar dois modos:
- Modo "Quadrados": Grid visível com células grandes (ex: 1m x 1m)
- Modo "Metros": Grid muito pequeno/invisível para movimento livre

Funcionalidades:
- Tamanho configurável (de 10x10 até 100x100 metros)
- Toggle para mostrar/esconder linhas do grid
- Alternar entre modo quadrados e metros
- Grid renderizado com <gridHelper> ou geometria customizada
- Cores: linhas verdes semi-transparentes

2. PAINEL DE CONFIGURAÇÕES (ui/GameControls.tsx)

Criar painel lateral direito com:
- Slider: "Tamanho do Tabuleiro" (10 a 100)
- Toggle: "Mostrar Grid" (checkbox)
- Radio buttons: "Modo Quadrados" / "Modo Metros"
- Botão: "Reset Câmera"

Estilização:
- Position: fixed, direita, top: 20px
- Background semi-transparente
- Padding e bordas arredondadas
- Use CSS-in-JS ou styled-components

3. INTEGRAÇÃO COM ZUSTAND

Atualizar gameStore.ts:
- gridSize: number (padrão: 20)
- showGrid: boolean (padrão: true)
- gridMode: 'squares' | 'meters' (padrão: 'squares')
- Ações: setGridSize, toggleGrid, setGridMode

4. ATUALIZAR APP.TSX

Integrar:
- Grid component conectado ao store
- GameControls component
- Garantir que mudanças sejam reativas

5. MATH UTILS (utils/MathUtils.ts)

Criar funções úteis:
```typescript
// Converter posição do grid para coordenadas 3D
export function gridToWorld(x: number, y: number, gridSize: number): [number, number, number]

// Converter coordenadas 3D para posição no grid
export function worldToGrid(x: number, z: number, gridSize: number): [number, number]

// Verificar se ponto está dentro de círculo
export function isPointInCircle(point: [number, number], center: [number, number], radius: number): boolean

// Calcular distância entre dois pontos 2D
export function distance2D(a: [number, number], b: [number, number]): number
```

REQUISITOS:
- Grid deve atualizar em tempo real quando configurações mudam
- Performance: use useMemo para grid geometry
- Adicione comentários explicativos
- Teste que todos controles funcionam

Implemente essas funcionalidades mantendo a estrutura existente.
```

---

## 👤 PROMPT 3: Sistema de Entidades e Spawning

```
Continuando o RPG 3D. Agora vou implementar o sistema de entidades e capacidade de spawnar criaturas.

JÁ EXISTE:
- Estrutura base do projeto
- Grid configurável e funcional
- Zustand store básico

IMPLEMENTAR AGORA:

1. CONFIGURAÇÕES DE ENTIDADES (entities/entityConfigs.json)

Criar JSON com pelo menos 3 tipos de criaturas:
```json
{
  "human_warrior": {
    "name": "Guerreiro Humano",
    "size": 1.8,
    "radius": 0.4,
    "color": "#4488ff",
    "stats": {
      "maxHp": 100,
      "strength": 15,
      "agility": 12,
      "perception": 10,
      "speed": 6
    }
  },
  "goblin": {
    "name": "Goblin",
    "size": 1.2,
    "radius": 0.3,
    "color": "#44ff44",
    "stats": {
      "maxHp": 50,
      "strength": 8,
      "agility": 15,
      "perception": 8,
      "speed": 5
    }
  },
  "orc": {
    "name": "Orc",
    "size": 2.2,
    "radius": 0.5,
    "color": "#ff4444",
    "stats": {
      "maxHp": 150,
      "strength": 20,
      "agility": 8,
      "perception": 6,
      "speed": 5
    }
  }
}
```

2. CLASSE ENTITY (entities/Entity.ts)

```typescript
export class Entity {
  id: string;
  type: string;
  name: string;
  position: [number, number, number];
  size: number;
  radius: number;
  color: string;
  stats: {
    hp: number;
    maxHp: number;
    strength: number;
    agility: number;
    perception: number;
    speed: number;
  };
  
  constructor(type: string, position: [number, number, number])
  
  // Métodos úteis:
  takeDamage(amount: number): void
  heal(amount: number): void
  isAlive(): boolean
  getDistanceTo(other: Entity): number
}
```

3. ENTITY MANAGER (core/EntityManager.ts)

```typescript
export class EntityManager {
  private entities: Map<string, Entity>;
  
  spawnEntity(type: string, position: [number, number, number]): Entity
  removeEntity(id: string): void
  getEntity(id: string): Entity | undefined
  getAllEntities(): Entity[]
  getEntitiesInRange(position: [number, number, number], range: number): Entity[]
}
```

4. COMPONENTE VISUAL DE ENTIDADE

Criar src/components/EntityMesh.tsx:
- Renderizar cilindro colorido representando a entidade
- Altura = entity.size
- Raio = entity.radius
- Cor = entity.color
- Mostrar HP bar acima (plano verde/vermelho)
- Highlight quando selecionado (outline dourado)
- Clicável para selecionar

5. UI DE SPAWNING (adicionar em GameControls.tsx)

Adicionar seção:
- Dropdown com tipos de criaturas
- Botão "Spawnar no Centro"
- Botão "Spawnar em Mouse" (spawna onde clicou no grid)
- Lista de entidades spawned (com botão delete)

6. ATUALIZAR ZUSTAND STORE

Adicionar:
- entities: Entity[]
- selectedEntityId: string | null
- Ações: addEntity, removeEntity, selectEntity, clearSelection

7. DEBUG INFO

Adicionar em ui/DebugPanel.tsx:
- Contador de entidades no cenário
- Stats da entidade selecionada
- Posição da entidade selecionada

IMPORTANTE:
- Entidades devem aparecer visualmente no grid
- Clique em entidade deve selecioná-la (mostrar outline)
- HP bar deve atualizar quando HP muda
- Performance: use instancing se mais de 10 entidades

Implemente tudo mantendo a arquitetura modular.
```

---

## 🎯 PROMPT 4: Sistema de Movimento

```
Continuando o RPG 3D. Agora vou implementar o sistema de movimento baseado em alcance circular.

JÁ FUNCIONA:
- Grid configurável
- Sistema de entidades
- Spawning de criaturas

IMPLEMENTAR AGORA:

1. SISTEMA DE MOVIMENTO (systems/MovementSystem.ts)

```typescript
export class MovementSystem {
  // Calcular se posição está dentro do alcance de movimento
  isPositionInRange(
    fromPos: [number, number, number],
    toPos: [number, number, number],
    maxRange: number
  ): boolean
  
  // Calcular caminho (linha reta por enquanto)
  calculatePath(
    from: [number, number, number],
    to: [number, number, number]
  ): [number, number, number][]
  
  // Mover entidade instantaneamente
  moveEntity(entity: Entity, targetPos: [number, number, number]): void
  
  // Verificar colisão com outras entidades
  checkCollision(
    position: [number, number, number],
    radius: number,
    excludeId?: string
  ): Entity | null
}
```

2. COMPONENTE DE ALCANCE DE MOVIMENTO

Criar src/components/MovementRangeIndicator.tsx:
- Renderizar círculo no chão mostrando alcance
- Usar <mesh> com CircleGeometry
- Material: semi-transparente verde (#00ff0050)
- Raio = entity.stats.speed (em metros)
- Só aparecer quando entidade está selecionada

3. INDICADOR DE DESTINO

Criar src/components/TargetIndicator.tsx:
- Mostrar onde o mouse está apontando no grid
- Círculo pequeno amarelo
- Só aparecer quando entidade selecionada
- Mudar de cor se destino está fora de alcance (vermelho)

4. LÓGICA DE CLIQUE NO GRID

Atualizar App.tsx ou criar componente GridClickHandler:
- Detectar clique no plano do grid
- Se entidade selecionada:
  - Se clique dentro do alcance: mover entidade
  - Se clique fora: mostrar mensagem "Fora de alcance"
- Usar raycasting para detectar posição 3D do clique

5. ANIMAÇÃO DE MOVIMENTO (OPCIONAL/SIMPLES)

- Interpolar posição com lerp
- Duração: 0.5 segundos
- Pode usar useFrame do R3F

6. UI DE MOVIMENTO (adicionar em HUD.tsx)

Mostrar quando entidade selecionada:
- Nome da entidade
- HP atual/máximo
- Velocidade de movimento
- Botão "Cancelar Seleção"
- Instrução: "Clique no grid para mover"

7. ATUALIZAR ZUSTAND STORE

Adicionar:
- isMoving: boolean
- movementTarget: [number, number, number] | null

Ações:
- startMovement(entityId, target)
- completeMovement()
- cancelMovement()

8. FEEDBACK VISUAL

- Linha pontilhada do personagem até o cursor (se dentro do alcance)
- Som de "clique" quando move (use howler.js ou Web Audio API)

REGRAS IMPORTANTES:
- Movimento só funciona em entidade selecionada
- Não pode mover se estiver fora do alcance
- Não pode mover para posição ocupada por outra entidade
- Movimento em linha reta (pathfinding complexo virá depois)

TESTES:
1. Spawnar 2 personagens
2. Selecionar um
3. Ver círculo de alcance
4. Clicar dentro do alcance - deve mover
5. Clicar fora - deve mostrar feedback negativo

Implemente tudo isso mantendo código limpo e comentado.
```

---

## ⚔️ PROMPT 5: Sistema de Combate Simples

```
Continuando o RPG 3D. Agora vou implementar o sistema de combate baseado em dados e stats.

JÁ FUNCIONA:
- Grid, entidades, spawning
- Sistema de movimento com alcance circular
- Seleção de entidades

IMPLEMENTAR AGORA:

1. CALCULADORA DE DANO (combat/DamageCalculator.ts)

```typescript
export class DamageCalculator {
  // Rolar dado (1 a max)
  rollDice(sides: number): number
  
  // Calcular ataque total
  calculateAttack(
    attackerStrength: number,
    diceRoll: number
  ): number
  
  // Calcular defesa total
  calculateDefense(
    defenderAgility: number,
    diceRoll: number
  ): number
  
  // Calcular dano final
  calculateDamage(
    attackTotal: number,
    defenseTotal: number
  ): number
}
```

2. SISTEMA DE COMBATE (combat/CombatSystem.ts)

```typescript
export interface CombatResult {
  attackerId: string;
  defenderId: string;
  attackRoll: number;
  defenseRoll: number;
  attackTotal: number;
  defenseTotal: number;
  damage: number;
  defenderDied: boolean;
  log: string[];
}

export class CombatSystem {
  private damageCalculator: DamageCalculator;
  
  // Verificar se atacante pode atacar alvo
  canAttack(
    attacker: Entity,
    target: Entity,
    attackRange: number
  ): boolean
  
  // Executar ataque
  executeAttack(
    attacker: Entity,
    target: Entity
  ): CombatResult
  
  // Processar resultado do combate
  applyCombatResult(result: CombatResult): void
}
```

3. INDICADOR DE ALCANCE DE ATAQUE

Criar src/components/AttackRangeIndicator.tsx:
- Similar ao MovementRangeIndicator
- Cor: vermelho semi-transparente (#ff000040)
- Raio: 2 metros (configurável depois)
- Aparecer quando "Modo Ataque" ativo

4. UI DE COMBATE (atualizar ui/HUD.tsx)

Quando entidade selecionada está perto de inimigo:
- Botão "Atacar [Nome do Inimigo]"
- Mostrar alcance de ataque
- Ao clicar:
  - Executar ataque
  - Mostrar animação/efeito
  - Atualizar HP
  - Mostrar log

5. LOG DE COMBATE (criar ui/CombatLog.tsx)

Componente fixo no canto inferior esquerdo:
- Últimas 5-7 mensagens
- Auto-scroll
- Cores diferentes para ações:
  - Azul: movimento
  - Vermelho: ataque
  - Verde: cura
  - Amarelo: eventos
- Exemplo: "Guerreiro atacou Goblin - Dano: 15 (Ataque: 18 vs Defesa: 3)"

6. EFEITOS VISUAIS DE COMBATE

Criar src/components/CombatEffects.tsx:
- Linha vermelha do atacante ao defensor (flash rápido)
- Número de dano flutuando acima do defensor
- Shake na câmera (sutil)
- Partículas de sangue simples (opcional)

7. ATUALIZAR entityConfigs.json

Adicionar para cada criatura:
```json
{
  "combat": {
    "attackRange": 2.0,
    "attackDice": 20,
    "defenseDice": 20
  }
}
```

8. ATUALIZAR ZUSTAND STORE

Adicionar:
- combatLog: string[]
- combatMode: boolean
- targetedEnemyId: string | null

Ações:
- addCombatLog(message)
- toggleCombatMode()
- setTarget(entityId)

9. LÓGICA DE COMBATE

No HUD ou GameControls:
- Detectar inimigos no alcance de ataque
- Mostrar botão de ataque apenas se válido
- Ao atacar:
  1. Rolar dados
  2. Calcular dano
  3. Aplicar dano
  4. Adicionar ao log
  5. Verificar morte
  6. Se morreu: remover entidade

10. MORTE DE ENTIDADE

Quando HP ≤ 0:
- Animação simples (fade out ou cair)
- Remover do cenário após 1 segundo
- Adicionar ao log: "[Nome] foi derrotado!"

FÓRMULAS DE COMBATE:
```
AtaqueTotal = 1d20 + Força do Atacante
DefesaTotal = 1d20 + Agilidade do Defensor
Dano = max(0, AtaqueTotal - DefesaTotal)
```

TESTES:
1. Spawnar Guerreiro (azul) e Goblin (verde)
2. Mover Guerreiro perto do Goblin
3. Clicar "Atacar Goblin"
4. Verificar:
   - Log mostra dados e cálculo
   - HP do Goblin diminui
   - Efeito visual aparece
5. Atacar até Goblin morrer
6. Goblin deve desaparecer

IMPORTANTE:
- Não pode atacar aliados (verificar por cor ou facção)
- Só pode atacar se dentro do alcance
- Um ataque por turno (implementar depois)

Implemente tudo mantendo código modular e comentado.
```

---

## ⏱️ PROMPT 6: Sistema de Turnos Timeline-Based

```
Continuando o RPG 3D. Agora vou implementar o sistema de turnos único deste jogo.

JÁ FUNCIONA:
- Grid, entidades, movimento, combate simples

CONCEITO DO SISTEMA:
Este NÃO é um sistema de turnos tradicional (um por vez). É um sistema onde:
1. PLANEJAMENTO: Jogador escolhe ações para suas unidades
2. EXECUÇÃO: Todas entidades (jogador + IA) agem simultaneamente
3. PAUSA: Sistema pausa quando detecta "conflitos" que exigem decisão

IMPLEMENTAR:

1. TIMELINE MANAGER (core/TimelineManager.ts)

```typescript
export type GamePhase = 'planning' | 'execution' | 'paused' | 'finished';

export interface PlannedAction {
  entityId: string;
  type: 'move' | 'attack' | 'wait';
  target?: [number, number, number] | string; // posição ou entityId
}

export interface ConflictEvent {
  type: 'enemy_spotted' | 'attack_incoming' | 'collision';
  entityId: string;
  data: any;
}

export class TimelineManager {
  private phase: GamePhase;
  private plannedActions: Map<string, PlannedAction>;
  private conflicts: ConflictEvent[];
  
  // Adicionar ação planejada
  planAction(entityId: string, action: PlannedAction): void
  
  // Executar todas ações simultaneamente
  executeAllActions(): void
  
  // Detectar conflitos durante execução
  detectConflicts(): ConflictEvent[]
  
  // Pausar em conflito
  pauseForConflict(conflict: ConflictEvent): void
  
  // Resolver conflito e continuar
  resolveConflict(entityId: string, newAction?: PlannedAction): void
  
  // Resetar turno
  resetTurn(): void
}
```

2. SISTEMA DE DECISÃO (systems/DecisionSystem.ts)

```typescript
export class DecisionSystem {
  // Verificar se entidade vê inimigo
  canSeeEnemy(entity: Entity, enemy: Entity, visionRange: number): boolean
  
  // Detectar se vai ser atacado
  isUnderAttack(entity: Entity, allActions: PlannedAction[]): boolean
  
  // Detectar colisões em paths
  detectPathCollision(
    path: [number, number, number][],
    otherPaths: [number, number, number][][]
  ): boolean
  
  // IA simples para inimigos
  planEnemyAction(enemy: Entity, playerEntities: Entity[]): PlannedAction
}
```

3. UI DE FASES (atualizar ui/HUD.tsx)

Grande indicador no topo central:
- FASE DE PLANEJAMENTO: Verde, "Planeje suas ações"
- FASE DE EXECUÇÃO: Amarelo, "Executando ações..." (com loading)
- FASE DE PAUSA: Vermelho, "CONFLITO DETECTADO" + descrição

4. PAINEL DE AÇÕES (criar ui/ActionPanel.tsx)

Quando entidade selecionada, mostrar opções:
- Botão: "Mover" (ativa modo movimento)
- Botão: "Atacar" (ativa modo ataque, mostra inimigos no alcance)
- Botão: "Esperar" (não faz nada este turno)
- Mostrar ação planejada atual (se houver)
- Botão: "Cancelar Ação"

5. BOTÃO DE EXECUTAR TURNO

Grande botão no canto inferior direito:
- "Executar Turno" (verde) quando phase = 'planning'
- "Aguarde..." (cinza, disabled) quando phase = 'execution'
- "Resolver Conflito" (vermelho) quando phase = 'paused'

6. MODAL DE CONFLITO (criar ui/ConflictModal.tsx)

Quando pausar por conflito:
- Overlay escurecendo o jogo
- Modal centralizado explicando o conflito:
  - "Goblin avistou você!"
  - "Você está prestes a ser atacado!"
  - "Sua unidade está em rota de colisão!"
- Opções:
  - "Continuar com ação planejada"
  - "Mudar para: [nova ação]"
  - "Esperar/Defender"

7. IA SIMPLES PARA INIMIGOS (atualizar systems/DecisionSystem.ts)

Comportamento básico da IA:
```typescript
planEnemyAction(enemy: Entity, players: Entity[]) {
  const nearestPlayer = this.findNearest(enemy, players);
  const distance = enemy.getDistanceTo(nearestPlayer);
  
  // Se dentro do alcance de ataque: atacar
  if (distance <= enemy.combat.attackRange) {
    return { type: 'attack', target: nearestPlayer.id };
  }
  
  // Se longe: mover em direção ao jogador
  const direction = this.getDirectionTo(enemy, nearestPlayer);
  const moveTarget = this.calculateMovePosition(enemy, direction);
  return { type: 'move', target: moveTarget };
}
```

8. FLUXO COMPLETO DO TURNO

```typescript
// FASE 1: PLANEJAMENTO
- Jogador clica em unidades e planeja ações
- IA já planeja ações automaticamente (invisível para jogador)
- Botão "Executar Turno" fica disponível

// FASE 2: EXECUÇÃO
- Todas ações começam simultaneamente
- Sistema detecta conflitos em tempo real:
  - Visão: Entity A move e vê Entity B
  - Ataque iminente: Entity A vai atacar Entity B
  - Colisão: Dois paths se cruzam
- Se conflito detectado: PAUSAR

// FASE 3: PAUSA (se houver conflito)
- Mostrar modal explicando conflito
- Jogador pode mudar ação ou confirmar
- Ao resolver: voltar para execução

// FASE 4: FIM DO TURNO
- Todas ações completadas
- Aplicar dano de combates
- Verificar vitória/derrota
- Resetar para PLANEJAMENTO
```

9. DETECÇÃO DE CONFLITOS

Implementar checagens durante execução:
```typescript
// Durante movimento
onEntityMove(entity: Entity, newPos: [number, number, number]) {
  // Checar visão
  const enemies = this.getEnemiesInVisionRange(entity, newPos);
  if (enemies.length > 0 && !entity.wasAwareOf(enemies[0])) {
    this.createConflict('enemy_spotted', entity, enemies[0]);
  }
  
  // Checar ataque iminente
  if (this.willBeAttackedNextTurn(entity)) {
    this.createConflict('attack_incoming', entity);
  }
}
```

10. ATUALIZAR ZUSTAND STORE

```typescript
interface GameState {
  // ... estados anteriores
  gamePhase: GamePhase;
  plannedActions: Map<string, PlannedAction>;
  currentConflict: ConflictEvent | null;
  turnNumber: number;
}

// Ações
- setGamePhase(phase)
- planAction(entityId, action)
- executeTurn()
- pauseForConflict(conflict)
- resolveConflict(resolution)
- nextTurn()
```

11. VISUALIZAÇÕES DURANTE PLANEJAMENTO

Quando ação planejada:
- Movimento: Seta do personagem até destino
- Ataque: Linha vermelha até alvo
- Esperar: Ícone de "pausa" acima da entidade

12. ANIMAÇÃO DE EXECUÇÃO

Durante fase de execução:
- Todas entidades se movem simultaneamente (lerp)
- Ataques acontecem quando alcançam posição
- Partículas/efeitos visuais

CONFIGURAÇÕES TESTÁVEIS (adicionar em entityConfigs.json):
```json
{
  "vision": {
    "range": 10,
    "fieldOfView": 180
  },
  "ai": {
    "aggressiveness": 0.7,
    "cowardice": 0.3
  }
}
```

TESTES DO SISTEMA:
1. Spawnar Guerreiro e Goblin (longe um do outro)
2. Planejar: Guerreiro move em direção ao Goblin
3. Executar turno
4. Sistema deve pausar quando Guerreiro avistar Goblin
5. Jogador escolhe continuar ou mudar ação
6. Se continuar, move até alcance de ataque
7. Próximo turno: ambos planejam ataque
8. Sistema detecta ataque iminente em ambos
9. Pausa para jogador decidir (atacar ou defender)

IMPORTANTE:
- Sistema de pausa deve ser fluido, não travar o jogo
- Conflitos só acontecem para unidades do jogador
- IA não precisa de confirmação, age automaticamente
- Múltiplos conflitos = pausar no primeiro, depois continuar

Este é o sistema mais complexo até agora. Implemente com cuidado e muitos comentários!
```

---

## 🎨 PROMPT 7: UI, Debug Tools e Polish

```
Continuando o RPG 3D. Último prompt da fase 1: finalizar UI, ferramentas de debug e polish geral.

JÁ FUNCIONA:
- Grid configurável
- Entidades, movimento, combate
- Sistema de turnos timeline-based

IMPLEMENTAR AGORA:

1. EDITOR DE STATS EM TEMPO REAL (ui/StatsEditor.tsx)

Modal ou painel lateral que abre ao clicar botão "Editar Stats" de entidade selecionada:
```typescript
- Input numérico para cada stat:
  - Max HP
  - Força
  - Agilidade  
  - Percepção
  - Velocidade
  - Alcance de ataque
  - Alcance de visão

- Botão "Aplicar" (atualiza entidade imediatamente)
- Botão "Resetar" (volta para valores do entityConfigs.json)
- Botão "Fechar"

Estilo: Modal centralizado, semi-transparente, fácil de usar
```

2. PAINEL DE DEBUG COMPLETO (ui/DebugPanel.tsx)

Painel fixo no canto superior esquerdo, pode minimizar/expandir:
```typescript
SEÇÃO: Informações Gerais
- FPS (usar stats.js ou custom)
- Número de entidades no cenário
- Fase atual do jogo
- Número do turno

SEÇÃO: Entidade Selecionada
- ID, Nome, Tipo
- Posição exata [x, y, z]
- Stats completos
- Ação planejada (se houver)

SEÇÃO: Grid
- Tamanho atual
- Modo (quadrados/metros)
- Grid visível? (sim/não)

SEÇÃO: Controles Rápidos
- Toggle "Mostrar Hitboxes" (desenhar wireframe dos colliders)
- Toggle "Mostrar Alcances" (sempre mostrar círculos de movimento/ataque)
- Toggle "Modo Deus" (entidades do jogador não morrem)
- Slider "Velocidade de Execução" (0.5x a 2x)

SEÇÃO: Spawn Rápido
- Botão "Spawnar em Mouse" (cada tipo de criatura)
- Input de coordenadas manuais
- Botão "Limpar Todas Entidades"
```

3. SISTEMA DE SAVE/LOAD (utils/SaveSystem.ts)

```typescript
export interface GameSave {
  version: string;
  timestamp: number;
  gridConfig: {
    size: number;
    mode: 'squares' | 'meters';
    showGrid: boolean;
  };
  entities: Entity[];
  turnNumber: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export class SaveSystem {
  // Salvar estado atual
  saveGame(name: string): void {
    const save = this.captureCurrentState();
    localStorage.setItem(`rpg3d_save_${name}`, JSON.stringify(save));
  }
  
  // Carregar estado
  loadGame(name: string): GameSave | null {
    const data = localStorage.getItem(`rpg3d_save_${name}`);
    if (!data) return null;
    return JSON.parse(data);
  }
  
  // Listar saves disponíveis
  listSaves(): string[] {
    const keys = Object.keys(localStorage);
    return keys.filter(k => k.startsWith('rpg3d_save_'));
  }
  
  // Deletar save
  deleteSave(name: string): void {
    localStorage.removeItem(`rpg3d_save_${name}`);
  }
  
  // Export para arquivo JSON
  exportToFile(name: string): void
  
  // Import de arquivo JSON
  importFromFile(file: File): void
}
```

4. UI DE SAVE/LOAD (criar ui/SaveLoadMenu.tsx)

Menu acessível por botão "Menu" no HUD:
```
SAVES DISPONÍVEIS:
┌─────────────────────────────────┐
│ Save 1 - 15/12/2024 14:30       │ [Carregar] [Deletar]
│ Save 2 - 15/12/2024 15:45       │ [Carregar] [Deletar]
│ Save 3 - 16/12/2024 10:20       │ [Carregar] [Deletar]
└─────────────────────────────────┘

NOVO SAVE:
[Input: nome do save] [Salvar]

EXPORT/IMPORT:
[Exportar Save Atual] [Importar de Arquivo]
```

5. FEEDBACK VISUAL MELHORADO

Implementar:
- **Seleção**: Outline dourado + anel girando na base
- **Hover**: Leve highlight quando mouse sobre entidade
- **Ação planejada**: Ícone flutuando acima da entidade
- **Dano recebido**: Número vermelho flutuando e desaparecendo
- **Cura**: Número verde flutuando
- **Morte**: Fade out + queda (rotate no eixo X)
- **Turno completo**: Flash verde rápido na tela

6. SONS E FEEDBACK SONORO (opcional mas recomendado)

Usar Howler.js ou Web Audio API:
```typescript
// sons básicos
- Clique no grid: "click.mp3"
- Movimento: "step.mp3"
- Ataque: "sword_slash.mp3" ou "punch.mp3"
- Hit: "impact.mp3"
- Morte: "death.mp3"
- UI: "ui_click.mp3"
- Fase muda: "phase_change.mp3"

Adicionar toggle "Sons" no menu de opções
```

7. TUTORIAL/INSTRUÇÕES INICIAIS

Criar ui/TutorialOverlay.tsx:
- Aparece na primeira vez que abre o jogo
- Explicação rápida:
  1. "Clique em entidades para selecioná-las"
  2. "Clique no grid para mover (círculo verde)"
  3. "Use botão Atacar quando próximo de inimigos"
  4. "Botão Executar Turno faz todos agirem juntos"
  5. "Sistema pausa quando algo importante acontece"
- Checkbox "Não mostrar novamente"
- Botão "Começar"

8. MENU DE OPÇÕES (criar ui/SettingsMenu.tsx)

Acessível por ícone de engrenagem no HUD:
```
GRÁFICOS:
- Toggle "Sombras"
- Toggle "Anti-aliasing"
- Slider "Qualidade das Sombras"

SOM:
- Slider "Volume Geral"
- Toggle "Sons de UI"
- Toggle "Sons de Combate"

GAMEPLAY:
- Toggle "Pausar ao avistar inimigo"
- Toggle "Pausar ao ser atacado"
- Toggle "Confirmação antes de executar turno"
- Slider "Velocidade de animação"

CÂMERA:
- Slider "Velocidade de Pan"
- Slider "Velocidade de Zoom"
- Toggle "Inverter zoom"
- Botão "Resetar Câmera"
```

9. HUD FINAL COMPLETO (atualizar ui/HUD.tsx)

Layout final:
```
┌─────────────────────────────────────────┐
│  [Menu] [?]          TURNO 5          📊│  <- Topo
├─────────────────────────────────────────┤
│                                         │
│  [Grid Config]              [Debug]    │  <- Laterais
│  [Spawn]                    [Stats]    │
│                                         │
│  FASE: Planejamento (verde)            │
│                                         │
├─────────────────────────────────────────┤
│  [LOG]                                  │  <- Embaixo
│  > Guerreiro moveu (5, 0, 3)           │
│  > Goblin planejou ataque               │
│  > Turno 4 completo                     │
│                                         │
│              [EXECUTAR TURNO]           │
└─────────────────────────────────────────┘
```

10. POLISH VISUAL

Melhorias finais:
- **Iluminação**: Adicionar ambient occlusion (se performance permitir)
- **Sombras**: Soft shadows com blur
- **Chão**: Adicionar textura sutil (pode ser procedural)
- **Grid**: Fade out no limite (não aparece até o infinito)
- **Céu**: SkyBox simples ou gradiente
- **Post-processing**: Leve bloom, vinheta

11. OTIMIZAÇÕES

Implementar:
```typescript
// Instancing para múltiplas entidades do mesmo tipo
- Use <instancedMesh> para grupos grandes
- LOD (Level of Detail) para entidades distantes
- Frustum culling (já vem no Three.js)
- Object pooling para efeitos visuais

// Performance monitoring
- Adicionar stats.js
- Alertar se FPS < 30
- Sugerir reduzir qualidade
```

12. README.md FINAL

Atualizar com:
```markdown
# RPG 3D Tático - Sistema de Combate Timeline-Based

## 🎮 Como Jogar
1. Clique em entidades para selecioná-las
2. Planeje ações (mover, atacar, esperar)
3. Clique "Executar Turno" - todos agem simultaneamente
4. Sistema pausa quando detecta conflitos importantes
5. Resolva conflitos e continue

## ⌨️ Controles
- **Click Esquerdo**: Selecionar/Mover
- **Click Direito**: Pan câmera
- **Scroll**: Zoom
- **WASD**: Pan câmera (alternativo)
- **Esc**: Cancelar seleção

## 🛠️ Debug Mode
Pressione ` (crase) para abrir console de debug
Comandos:
- `spawn(tipo, x, z)` - Spawnar entidade
- `kill(id)` - Matar entidade
- `heal(id, amount)` - Curar
- `tp(id, x, z)` - Teleportar

## 📋 Roadmap
- [x] Grid configurável
- [x] Sistema de entidades
- [x] Movimento circular
- [x] Combate básico
- [x] Turnos timeline-based
- [ ] Física completa (Fase 2)
- [ ] Desmembramento (Fase 3)
- [ ] Escalada (Fase 4)
- [ ] Modelos 3D (Fase 5)

## 🏗️ Arquitetura
Ver documentação em /docs/architecture.md

## 🐛 Problemas Conhecidos
- Nenhum no momento

## 📝 Licença
MIT
```

13. TESTES FINAIS

Criar checklist de testes:
```
FUNCIONALIDADES:
✓ Spawnar múltiplas entidades
✓ Mover entidades (dentro e fora de alcance)
✓ Combate (matar entidade)
✓ Sistema de turnos (pausar em conflito)
✓ Salvar e carregar jogo
✓ Editar stats em tempo real
✓ Todas configurações de grid funcionam

PERFORMANCE:
✓ 60 FPS com 20+ entidades
✓ Sem memory leaks (testar por 5 minutos)
✓ Carrega em < 3 segundos

UX:
✓ Todos botões têm tooltip
✓ Feedback visual em todas ações
✓ Tutorial é compreensível
✓ Save/Load funciona corretamente
```

14. BUILD DE PRODUÇÃO

Configurar:
```json
// package.json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext ts,tsx",
  "test": "vitest"
}
```

Otimizações de build:
- Code splitting
- Tree shaking
- Minificação agressiva
- Comprimir assets

ENTREGA FINAL:
- Código totalmente funcional
- Performance otimizada
- UI polida e intuitiva
- README completo
- Sem bugs conhecidos críticos

Este é o último prompt da Fase 1! Depois disso, o jogo estará jogável e pronto para expansões (física, desmembramento, etc).

Implemente tudo com capricho - este é o MVP completo! 🎮
```

---

## 📚 Próximas Fases (Para Referência Futura)

### Fase 2: Física Completa com Rapier
- Integração total do Rapier Physics
- Colisões realistas
- Arremessos e ragdoll
- Objetos destrutíveis

### Fase 3: Sistema de Desmembramento
- Membros separáveis
- HP individual por membro
- Membros no chão com física
- Sangue e efeitos

### Fase 4: Escalada e Montarias
- Sistema de agarrar superfícies
- Escalar criaturas grandes
- Montarias funcionais
- Peso e centro de gravidade

### Fase 5: Modelos 3D e Animações
- Importação de modelos GLTF
- Sistema de esqueleto
- Animações (idle, walk, attack, death)
- Blend entre animações

### Fase 6: IA Avançada
- Pathfinding com A*
- Comportamentos complexos
- Formações táticas
- Teamwork de NPCs

---

## 💡 Dicas de Uso dos Prompts

1. **Use um prompt por vez**: Cole um, espere implementar completamente, depois próximo
2. **Teste entre prompts**: Garanta que tudo funciona antes de avançar
3. **Customize se necessário**: Estes prompts são base, ajuste conforme sua visão
4. **Guarde o código**: Versione com Git após cada prompt completado
5. **Performance primeiro**: Se ficar lento, otimize antes de adicionar features

---

## 🎯 Resultado Final da Fase 1

Após completar todos os 7 prompts, você terá:

✅ Jogo totalmente funcional e jogável
✅ Sistema de combate baseado em dados
✅ Turnos simultâneos com pausas inteligentes
✅ UI polida com todas ferramentas de debug
✅ Sistema de save/load
✅ Editor de stats em tempo real
✅ Arquitetura preparada para expansões futuras
✅ Performance otimizada (60 FPS com 20+ entidades)
✅ Código limpo, comentado e modular

**Tempo estimado**: 2-4 horas com Claude
**Complexidade**: Intermediária
**Resultado**: MVP profissional de RPG 3D tático

---

**Boa sorte com o desenvolvimento! 🚀**
