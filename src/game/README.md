# RPG 3D Tático - Sistema de Jogo

## Visão Geral

Este é um jogo RPG 3D tático construído com React, TypeScript e Three.js. O jogo usa o Sistema de Combate RPG v3 como base para todos os cálculos de combate.

## Stack Tecnológica

- **React 18** - Framework de UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **@react-three/fiber** - React renderer para Three.js
- **@react-three/drei** - Helpers para R3F
- **@react-three/rapier** - Física com Rapier
- **Zustand** - Gerenciamento de estado
- **Tailwind CSS** - Estilização

## Estrutura de Pastas

```
src/game/
├── core/                 # Núcleo do jogo
│   ├── Grid.tsx         # Grid 3D do cenário
│   ├── EntityManager.ts # Gerenciador de entidades
│   └── TimelineManager.ts # Sistema de turnos/tempo
├── entities/            # Entidades do jogo
│   ├── Entity.ts        # Classe base de entidade
│   ├── Limb.ts          # Sistema de membros
│   └── entityConfigs.json # Presets de entidades
├── combat/              # Sistema de combate
│   ├── CombatSystem.ts  # Sistema principal
│   ├── AttackTypes.ts   # Tipos de ataque
│   └── DamageCalculator.ts # Cálculo de dano
├── physics/             # Física
│   ├── PhysicsEngine.tsx # Motor de física
│   └── CollisionHandler.ts # Colisões
├── systems/             # Sistemas de jogo
│   ├── MovementSystem.ts # Movimento
│   ├── DecisionSystem.ts # IA
│   ├── GrappleSystem.ts  # Agarramento
│   └── ClimbingSystem.ts # Escalada
├── ui/                  # Interface do usuário
│   ├── HUD.tsx          # Heads Up Display
│   ├── StatsEditor.tsx  # Editor de atributos
│   ├── DebugPanel.tsx   # Debug
│   └── GameControls.tsx # Controles de ação
├── utils/               # Utilitários
│   ├── SaveSystem.ts    # Salvamento
│   └── MathUtils.ts     # Funções matemáticas
├── store/               # Estado global
│   └── gameStore.ts     # Zustand store
├── types/               # Tipos TypeScript
│   └── index.ts         # Definições de tipos
└── Game3D.tsx           # Componente principal
```

## Sistema de Combate

O jogo usa o Sistema de Combate RPG v3 com tempo contínuo em milissegundos.

### Índice de Combate (IC)

```
IC = (VEL × w₁ + HAB × w₂ + AGI × w₃ + FOR × w₄) / 50
```

Onde os pesos variam por tipo de arma/ação.

### Tempo Equipado (TE)

```
TE = Tempo_Base × IC × Mult_Qualidade + Penalidade_Armadura
```

### Atributos

| Sigla | Nome        | Descrição                      |
|-------|-------------|--------------------------------|
| VEL   | Velocidade  | Rapidez de reação e movimento  |
| HAB   | Habilidade  | Precisão e técnica             |
| AGI   | Agilidade   | Esquiva e mobilidade           |
| FOR   | Força       | Dano físico e resistência      |
| RES   | Resistência | HP e defesa                    |
| PER   | Percepção   | Detecção e iniciativa          |

## Fases de Desenvolvimento

### Fase 1 - Estrutura Básica ✅
- [x] Estrutura de pastas
- [x] Tipos TypeScript
- [x] Zustand store
- [x] Cena 3D básica
- [x] Grid do cenário
- [x] Entidades básicas

### Fase 2 - Interação (Pendente)
- [ ] Seleção de entidades
- [ ] Sistema de movimento
- [ ] Pathfinding A*
- [ ] Câmera follow

### Fase 3 - Sistema de Turnos (Pendente)
- [ ] Timeline de ações
- [ ] Fila de comandos
- [ ] Execução de turno
- [ ] Animações

### Fase 4 - Combate (Pendente)
- [ ] Ataques
- [ ] Defesa
- [ ] Dano
- [ ] Morte

### Fase 5 - IA e Polish (Pendente)
- [ ] IA de inimigos
- [ ] Efeitos visuais
- [ ] Sons
- [ ] Save/Load

## Como Usar

### Controles de Câmera
- **Arrastar** - Rotacionar câmera
- **Scroll** - Zoom in/out
- **Shift + Arrastar** - Pan

### Atalhos de Teclado
- **G** - Toggle grid
- **D** - Toggle debug panel
- **H** - Toggle hitboxes
- **ESC** - Deselecionar

### Seleção
- Clique em uma entidade para selecioná-la
- Clique no chão para deselecionar

## API do Store

```typescript
// Entidades
addEntity(entity: Entity)
removeEntity(id: string)
updateEntity(id: string, updates: Partial<Entity>)
selectEntity(id: string | null)
moveEntity(id: string, position: Position3D)

// Estado do Jogo
setGamePhase(phase: GamePhase)
nextTurn()
resetGame()

// Grid
toggleGrid()
setGridMode(mode: GridMode)
setGridSize(size: number)

// Debug
toggleDebug()
toggleHitboxes()
```

## Tipos Principais

```typescript
type Position3D = [number, number, number];
type GamePhase = 'planning' | 'execution' | 'paused' | 'ended';

interface Entity {
  id: string;
  name: string;
  position: Position3D;
  stats: EntityStats;
  type: 'humanoid' | 'creature' | 'object';
  isSelected: boolean;
  isPlayerControlled: boolean;
  color: string;
}

interface EntityStats {
  hp: number;
  maxHp: number;
  vel: number;
  hab: number;
  agi: number;
  for: number;
  res: number;
  per: number;
  speed: number;
}
```

## Integração

O jogo está integrado com o Sistema de Combate RPG existente e usa os mesmos dados e fórmulas. A página `/jogo` exibe o jogo 3D enquanto as outras páginas mostram a documentação e calculadoras do sistema.
