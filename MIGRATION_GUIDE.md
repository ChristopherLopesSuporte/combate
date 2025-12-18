# 🔄 GUIA DE TRANSIÇÃO - Sistema Simples → Ruego.md

**Objetivo:** Migrar gradualmente do sistema de combate simples para o sistema complexo ruego.md sem quebrar funcionalidades existentes.

---

## 📊 COMPARAÇÃO DOS SISTEMAS

### Sistema Simples (Fase 1)
```typescript
// Combate básico
attack = 1d20 + strength
defense = 1d20 + agility
damage = max(0, attack - defense)

// Tempo abstrato
actionTime = 1-3 "turnos"
```

### Sistema Ruego.md (Fase 3)
```typescript
// Combate complexo
IC = (100 - VEL×PesoVel - HAB×PesoHab - AGI×PesoAgi - FOR×PesoFor) ÷ 100
TE = (Tempo_Arma × IC × Mult_Qualidade × Mult_Força) + Penalidade_Armadura
Tempo_Final = TE × Mult_Situacional × Mult_Magia

// Tempo preciso
actionTimeMs = 100-500 milissegundos
```

---

## 🗂️ ESTRUTURA DE DADOS EVOLUTIVA

### Fase 1: Stats Simples
```typescript
interface StatsPhase1 {
  strength: number;      // 0-100
  agility: number;       // 0-100
  perception: number;    // 0-100
  hp: number;
  stamina: number;
}
```

### Fase 1.5: Preparação
```typescript
interface StatsPhase15 extends StatsPhase1 {
  // Campos opcionais para ruego.md
  velocidade?: number;   // Será usado na Fase 3
  habilidade?: number;   // Será usado na Fase 3
  resistencia?: number;  // Será usado na Fase 3
  
  // Mapeamento temporário
  _legacyMode: boolean;  // Se true, usar sistema antigo
}

// Auto-converter quando necessário
function normalizeStats(stats: StatsPhase15): StatsRuego {
  if (stats._legacyMode) {
    return {
      velocidade: stats.agility,        // Agility → Velocidade
      habilidade: stats.perception,     // Perception → Habilidade
      agilidade: stats.agility,         // Mantém
      forca: stats.strength,            // Strength → Força
      resistencia: stats.hp / 2,        // HP → Resistência
      percepcao: stats.perception,      // Mantém
    };
  }
  return stats as StatsRuego;
}
```

### Fase 3: Stats Ruego.md Completo
```typescript
interface StatsRuego {
  // Atributos ruego.md
  velocidade: number;    // VEL (0-100+)
  habilidade: number;    // HAB (0-100+)
  agilidade: number;     // AGI (0-100+)
  forca: number;         // FOR (0-100+)
  resistencia: number;   // RES (0-100+)
  percepcao: number;     // PER (0-100+)
  
  // Derivados
  hp: number;            // RES × 2
  maxHp: number;
  stamina: number;
  maxStamina: number;
}
```

---

## 🗡️ MIGRAÇÃO DE ARMAS

### Fase 1: Arma Simples
```typescript
interface WeaponPhase1 {
  name: string;
  damage: number;        // Dano fixo
  range: number;         // Alcance em metros
  attackTime: number;    // Tempo em "turnos" abstratos
}

// Exemplo
const sword: WeaponPhase1 = {
  name: "Iron Sword",
  damage: 20,
  range: 2,
  attackTime: 2, // "2 turnos"
};
```

### Fase 1.5: Arma com Múltiplas Ações
```typescript
interface WeaponPhase15 extends WeaponPhase1 {
  // Múltiplas ações
  actions?: {
    jab: { time: number; damage: number; stamina: number };
    strike: { time: number; damage: number; stamina: number };
    heavy: { time: number; damage: number; stamina: number };
  };
  
  // Preparação para ruego.md
  weaponType?: WeaponType;
  forceRequired?: number;
}

// Exemplo
const sword: WeaponPhase15 = {
  name: "Iron Sword",
  damage: 20,
  range: 2,
  attackTime: 2,
  
  actions: {
    jab: { time: 1.5, damage: 15, stamina: 10 },
    strike: { time: 2, damage: 20, stamina: 15 },
    heavy: { time: 3, damage: 30, stamina: 25 },
  },
  
  weaponType: 'sword_1h',
  forceRequired: 30,
};
```

### Fase 3: Arma Ruego.md Completa
```typescript
interface WeaponRuego {
  name: string;
  weaponType: WeaponType;
  
  // Tempos em MS por ação (ruego.md)
  actionTimesMs: {
    jab: number;
    direto: number;
    corte: number;
    estocada: number;
    aparar: number;
  };
  
  // Dano base
  damageBase: number;
  
  // Requisitos
  forceRequired: number;  // FOR necessária
  
  // Alcance
  range: number;
  
  // Qualidade (opcional)
  quality?: WeaponQuality;
}

// Exemplo (Espada Longa - ruego.md)
const espadaLonga: WeaponRuego = {
  name: "Espada Longa",
  weaponType: 'sword_1h',
  
  actionTimesMs: {
    jab: 220,
    direto: 350,
    corte: 320,
    estocada: 380,
    aparar: 150,
  },
  
  damageBase: 22,
  forceRequired: 40,
  range: 2,
  
  quality: {
    name: 'Excellent',
    timeMultiplier: 0.90,
    damageMultiplier: 1.2,
    skillRequired: 60,
  },
};
```

---

## 🔧 SISTEMA DE CONVERSÃO AUTOMÁTICA

### Conversor de Armas
```typescript
class WeaponMigration {
  // Fase 1 → Fase 1.5
  static upgradeToPhase15(weapon: WeaponPhase1): WeaponPhase15 {
    const baseTime = weapon.attackTime;
    
    return {
      ...weapon,
      actions: {
        jab: { 
          time: baseTime * 0.7, 
          damage: weapon.damage * 0.7, 
          stamina: 10 
        },
        strike: { 
          time: baseTime, 
          damage: weapon.damage, 
          stamina: 15 
        },
        heavy: { 
          time: baseTime * 1.5, 
          damage: weapon.damage * 1.5, 
          stamina: 25 
        },
      },
      weaponType: this.guessWeaponType(weapon),
      forceRequired: this.estimateForceRequired(weapon),
    };
  }
  
  // Fase 1.5 → Fase 3
  static upgradeToPhase3(weapon: WeaponPhase15): WeaponRuego {
    const TURN_TO_MS = 300; // 1 turno abstrato = 300ms
    
    return {
      name: weapon.name,
      weaponType: weapon.weaponType || 'sword_1h',
      
      actionTimesMs: {
        jab: weapon.actions!.jab.time * TURN_TO_MS,
        direto: weapon.actions!.strike.time * TURN_TO_MS,
        corte: weapon.actions!.strike.time * TURN_TO_MS,
        estocada: weapon.actions!.heavy.time * TURN_TO_MS,
        aparar: weapon.actions!.jab.time * TURN_TO_MS * 0.7,
      },
      
      damageBase: weapon.damage,
      forceRequired: weapon.forceRequired || 0,
      range: weapon.range,
    };
  }
  
  // Helper: adivinhar tipo da arma
  private static guessWeaponType(weapon: WeaponPhase1): WeaponType {
    const name = weapon.name.toLowerCase();
    
    if (name.includes('dagger') || name.includes('knife')) return 'dagger';
    if (name.includes('sword') && name.includes('two')) return 'sword_2h';
    if (name.includes('sword')) return 'sword_1h';
    if (name.includes('axe')) return 'axe';
    if (name.includes('spear')) return 'spear';
    
    return 'sword_1h'; // default
  }
  
  // Helper: estimar FOR necessária
  private static estimateForceRequired(weapon: WeaponPhase1): number {
    // Baseado no dano e tempo
    const complexity = weapon.damage * weapon.attackTime;
    
    if (complexity < 30) return 0;
    if (complexity < 50) return 20;
    if (complexity < 80) return 40;
    return 60;
  }
}
```

### Conversor de Personagens
```typescript
class CharacterMigration {
  // Migrar save antigo
  static migrateSave(oldSave: SavePhase1): SavePhase3 {
    return {
      version: '3.0',
      timestamp: Date.now(),
      
      entities: oldSave.entities.map(entity => ({
        ...entity,
        stats: this.migrateStats(entity.stats),
        weapon: WeaponMigration.upgradeToPhase3(
          WeaponMigration.upgradeToPhase15(entity.weapon)
        ),
      })),
      
      // ... resto dos campos
    };
  }
  
  // Stats antigos → ruego.md
  private static migrateStats(old: StatsPhase1): StatsRuego {
    return {
      velocidade: old.agility,
      habilidade: old.perception,
      agilidade: old.agility,
      forca: old.strength,
      resistencia: Math.round(old.hp / 2),
      percepcao: old.perception,
      
      hp: old.hp,
      maxHp: old.hp,
      stamina: old.stamina,
      maxStamina: old.stamina,
    };
  }
}
```

---

## ⚔️ CÁLCULOS DE COMBATE EVOLUTIVOS

### Sistema Dual (Fase 1.5 → Fase 3)

```typescript
class CombatSystemDual {
  private useRuegoSystem: boolean = false; // Flag global
  
  // Calcular tempo de ação
  calculateActionTime(
    entity: Entity,
    weapon: WeaponPhase15 | WeaponRuego,
    action: ActionType
  ): number {
    
    if (this.useRuegoSystem && 'actionTimesMs' in weapon) {
      return this.calculateRuego(entity, weapon, action);
    } else {
      return this.calculateSimple(entity, weapon as WeaponPhase15, action);
    }
  }
  
  // Sistema simples (Fase 1)
  private calculateSimple(
    entity: Entity,
    weapon: WeaponPhase15,
    action: ActionType
  ): number {
    
    const baseTime = weapon.actions?.[action]?.time || weapon.attackTime;
    
    // Modificador de agilidade simples
    const agilityMod = 1 - (entity.stats.agility / 200);
    
    return baseTime * agilityMod;
  }
  
  // Sistema ruego.md (Fase 3)
  private calculateRuego(
    entity: Entity,
    weapon: WeaponRuego,
    action: ActionType
  ): number {
    
    // 1. Pegar tempo base da arma
    const baseTimeMs = weapon.actionTimesMs[action];
    
    // 2. Calcular IC
    const ic = this.calculateIC(entity.stats, weapon.weaponType);
    
    // 3. Calcular TE
    let te = baseTimeMs * ic;
    
    // 4. Qualidade da arma
    if (weapon.quality) {
      const utilization = Math.min(1, entity.stats.habilidade / weapon.quality.skillRequired);
      const effectiveMult = 1 - (1 - weapon.quality.timeMultiplier) * utilization;
      te *= effectiveMult;
    }
    
    // 5. Penalidade de força
    if (entity.stats.forca < weapon.forceRequired) {
      const diff = weapon.forceRequired - entity.stats.forca;
      te *= (1 + diff * 0.02);
    }
    
    // 6. Armadura
    if (entity.armor && action !== 'dodge') {
      te += entity.armor.timePenaltyMs;
    }
    
    return Math.round(te);
  }
  
  // Calcular IC (ruego.md)
  private calculateIC(stats: StatsRuego, weaponType: WeaponType): number {
    const weights = this.getWeaponWeights(weaponType);
    
    const ic = (100
      - stats.velocidade * weights.velocity
      - stats.habilidade * weights.skill
      - stats.agilidade * weights.agility
      - stats.forca * weights.force
    ) / 100;
    
    return Math.max(0.20, ic);
  }
  
  // Pesos por tipo de arma (ruego.md)
  private getWeaponWeights(type: WeaponType) {
    const weights = {
      unarmed: { velocity: 0.20, skill: 0.15, agility: 0.15, force: 0.00 },
      dagger: { velocity: 0.20, skill: 0.20, agility: 0.10, force: 0.00 },
      sword_1h: { velocity: 0.15, skill: 0.20, agility: 0.10, force: 0.05 },
      sword_2h: { velocity: 0.10, skill: 0.15, agility: 0.05, force: 0.20 },
      axe: { velocity: 0.05, skill: 0.10, agility: 0.05, force: 0.30 },
      // ... etc
    };
    
    return weights[type];
  }
}
```

---

## 🎮 INTERFACE DE TOGGLE

### UI para Alternar Sistemas
```typescript
// Debug panel ou settings
interface GameSettings {
  combatSystem: 'simple' | 'ruego';
  showDebugInfo: boolean;
}

function SettingsPanel() {
  const settings = useGameStore(state => state.settings);
  
  return (
    <div className="settings-panel">
      <h3>Sistema de Combate</h3>
      
      <label>
        <input 
          type="radio" 
          value="simple"
          checked={settings.combatSystem === 'simple'}
          onChange={() => updateSetting('combatSystem', 'simple')}
        />
        Simples (Fase 1)
        <span className="hint">d20 + stats, turnos abstratos</span>
      </label>
      
      <label>
        <input 
          type="radio" 
          value="ruego"
          checked={settings.combatSystem === 'ruego'}
          onChange={() => updateSetting('combatSystem', 'ruego')}
        />
        Avançado (Ruego.md)
        <span className="hint">IC, tempos em MS, modificadores complexos</span>
      </label>
      
      {settings.combatSystem === 'ruego' && (
        <div className="warning">
          ⚠️ Sistema avançado requer stats ruego.md.
          Personagens antigos serão convertidos automaticamente.
        </div>
      )}
    </div>
  );
}
```

---

## 📋 CHECKLIST DE MIGRAÇÃO

### Antes de Migrar para Fase 3:

**Preparação:**
- [ ] Todos personagens têm stats Fase 1.5
- [ ] Todas armas têm múltiplas ações
- [ ] Sistema de eventos está determinístico
- [ ] Save/load funciona perfeitamente
- [ ] Testes de combate passam

**Durante Migração:**
- [ ] Implementar conversores automáticos
- [ ] Adicionar flag de toggle
- [ ] Testar sistema dual (ambos funcionando)
- [ ] Migrar saves existentes
- [ ] Atualizar UI com stats ruego.md

**Após Migração:**
- [ ] Sistema simples ainda funciona (legacy)
- [ ] Sistema ruego.md funciona corretamente
- [ ] Performance não degradou
- [ ] Balanceamento está razoável
- [ ] Documentação atualizada

---

## 🧪 EXEMPLOS DE TESTE

### Teste de Compatibilidade
```typescript
describe('Combat System Migration', () => {
  it('should calculate same relative results in both systems', () => {
    // Setup
    const entity1 = createEntity({ strength: 70, agility: 60 });
    const entity2 = createEntity({ strength: 50, agility: 80 });
    const weapon = createWeapon('iron_sword');
    
    // Sistema simples
    combatSystem.useRuegoSystem = false;
    const timeSimple1 = combatSystem.calculateActionTime(entity1, weapon, 'strike');
    const timeSimple2 = combatSystem.calculateActionTime(entity2, weapon, 'strike');
    
    // Sistema ruego.md
    combatSystem.useRuegoSystem = true;
    const timeRuego1 = combatSystem.calculateActionTime(entity1, weapon, 'strike');
    const timeRuego2 = combatSystem.calculateActionTime(entity2, weapon, 'strike');
    
    // Ordem relativa deve ser a mesma
    const simpleResult = timeSimple1 < timeSimple2;
    const ruegoResult = timeRuego1 < timeRuego2;
    
    expect(simpleResult).toBe(ruegoResult);
  });
  
  it('should migrate save files without data loss', () => {
    const oldSave = loadSave('test_save_v1.json');
    const newSave = CharacterMigration.migrateSave(oldSave);
    
    expect(newSave.entities.length).toBe(oldSave.entities.length);
    expect(newSave.entities[0].stats.hp).toBe(oldSave.entities[0].stats.hp);
  });
});
```

---

## 📈 ROTEIRO DE IMPLEMENTAÇÃO

### Semana 1: Preparação (Fase 1.5)
- Dia 1-2: Adicionar campos opcionais nas interfaces
- Dia 3-4: Criar conversores automáticos
- Dia 5: Testar conversão de saves antigos

### Semana 2: Implementação (Fase 3)
- Dia 1-2: Implementar cálculo IC
- Dia 3: Implementar TE e modificadores
- Dia 4: Sistema de armaduras e qualidade
- Dia 5: Testes e balanceamento

### Semana 3: Integração
- Dia 1-2: UI para mostrar stats ruego.md
- Dia 3: Toggle entre sistemas
- Dia 4-5: Polish e otimização

### Semana 4: Validação
- Dia 1-2: Testes extensivos
- Dia 3: Ajustes de balanceamento
- Dia 4: Documentação
- Dia 5: Release!

---

## 🎯 DICAS IMPORTANTES

### 1. Mantenha Compatibilidade
```typescript
// ✅ BOM: Adicionar campo opcional
interface Stats {
  strength: number;
  velocidade?: number; // Novo campo
}

// ❌ RUIM: Remover campo
interface Stats {
  // strength: number; <- NUNCA REMOVER!
  velocidade: number;
}
```

### 2. Use Versionamento
```typescript
interface SaveFile {
  version: string; // '1.0', '1.5', '3.0'
  data: any;
}

function loadSave(file: string): GameState {
  const save = JSON.parse(file);
  
  // Migrar se necessário
  if (save.version === '1.0') {
    save = migrateTo15(save);
  }
  if (save.version === '1.5') {
    save = migrateTo30(save);
  }
  
  return save.data;
}
```

### 3. Logs de Debug
```typescript
if (DEBUG_MODE) {
  console.log('Combat Calculation:', {
    system: this.useRuegoSystem ? 'ruego' : 'simple',
    entity: entity.name,
    ic: ic,
    te: te,
    finalTime: finalTime,
  });
}
```

### 4. Testes A/B
```typescript
// Testar balanceamento
function compareSystemsBalance() {
  const scenarios = loadTestScenarios();
  
  for (const scenario of scenarios) {
    const resultSimple = runCombat(scenario, 'simple');
    const resultRuego = runCombat(scenario, 'ruego');
    
    console.log('Scenario:', scenario.name);
    console.log('Winner (Simple):', resultSimple.winner);
    console.log('Winner (Ruego):', resultRuego.winner);
    console.log('---');
  }
}
```

---

## ✅ RESULTADO FINAL

Após completar a migração, você terá:

✅ Sistema simples funcional (legacy)
✅ Sistema ruego.md completo
✅ Toggle entre sistemas
✅ Conversão automática de saves
✅ Compatibilidade total
✅ Zero perda de dados
✅ Performance mantida

**E o melhor:** Usuários podem escolher qual sistema usar! 🎮
