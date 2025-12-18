# Sistema de Combate RPG — Guia Completo v3

---

## 1. RESUMO DO SISTEMA

```
TE = (Tempo_Arma × IC) + Penalidade_Armadura
Tempo_Final = TE × Mult_Qualidade × Mult_Situacional × Mult_Magia
```

| Camada | O que é | Quando calcular |
|--------|---------|-----------------|
| IC | Eficiência do personagem com a arma | Criação / level up |
| TE | Tempo com equipamento | Ao equipar |
| Tempo Final | Tempo real da ação | Em combate |

---

## 2. ATRIBUTOS

| Atributo | Sigla | Função |
|----------|-------|--------|
| Velocidade | VEL | Rapidez do movimento |
| Habilidade | HAB | Técnica e precisão |
| Agilidade | AGI | Coordenação e equilíbrio |
| Força | FOR | Potência física |
| Resistência | RES | Stamina e HP |
| Percepção | PER | Leitura de combate |

---

## 3. ÍNDICE DE COMBATE (IC)

O IC varia conforme o **tipo de arma**. Armas pesadas dependem mais de FOR, armas técnicas dependem mais de HAB.

```
IC = (100 − VEL×PesoVel − HAB×PesoHab − AGI×PesoAgi − FOR×PesoFor) ÷ 100
```

### Pesos por Tipo de Arma

| Tipo | VEL | HAB | AGI | FOR | Soma |
|------|-----|-----|-----|-----|------|
| Desarmado | 0.20 | 0.15 | 0.15 | 0.00 | 0.50 |
| Facas | 0.20 | 0.20 | 0.10 | 0.00 | 0.50 |
| Espadas 1 Mão | 0.15 | 0.20 | 0.10 | 0.05 | 0.50 |
| Rapieira | 0.15 | 0.30 | 0.05 | 0.00 | 0.50 |
| Espadas 2 Mãos | 0.10 | 0.15 | 0.05 | 0.20 | 0.50 |
| Machados | 0.05 | 0.10 | 0.05 | 0.30 | 0.50 |
| Impacto | 0.05 | 0.10 | 0.05 | 0.30 | 0.50 |
| Hastes | 0.15 | 0.25 | 0.05 | 0.05 | 0.50 |
| Flexíveis | 0.10 | 0.30 | 0.10 | 0.00 | 0.50 |

### Pesos para Ações Defensivas

| Ação | VEL | HAB | AGI | FOR |
|------|-----|-----|-----|-----|
| Aparar | 0.10 | 0.25 | 0.10 | 0.05 |
| Esquiva | 0.10 | 0.05 | 0.35 | 0.00 |

---

## 4. TABELA DE ARMAS

### Desarmado

| Ação | Soco | Chute |
|------|------|-------|
| Jab | 150 | 200 |
| Direto | 250 | 350 |
| Aparar | 100 | — |
| **Dano** | 5 | 10 |
| **FOR Req** | 0 | 0 |
| **Alcance** | 0 | 1 |

### Facas

| Ação | Faca | Adaga | Adaga Longa |
|------|------|-------|-------------|
| Jab | 100 | 120 | 140 |
| Direto | 180 | 200 | 220 |
| Corte | 150 | 180 | 200 |
| Estocada | 200 | 220 | 250 |
| Aparar | 70 | 80 | 90 |
| **Dano** | 8 | 10 | 12 |
| **FOR Req** | 0 | 10 | 15 |
| **Alcance** | 0 | 0 | 1 |

### Espadas 1 Mão

| Ação | Gladius | Espada Curta | Sabre | Espada Longa | Rapieira |
|------|---------|--------------|-------|--------------|----------|
| Jab | 160 | 180 | 200 | 220 | 180 |
| Direto | 260 | 280 | 320 | 350 | 300 |
| Corte | 240 | 250 | 280 | 320 | — |
| Estocada | 280 | 300 | 350 | 380 | 280 |
| Aparar | 110 | 120 | 130 | 150 | 140 |
| **Dano** | 18 | 18 | 20 | 22 | 15 |
| **FOR Req** | 25 | 30 | 35 | 40 | 25 |
| **Alcance** | 1 | 1 | 2 | 2 | 2 |

### Espadas 2 Mãos

| Ação | Espada Bastarda | Montante | Katana |
|------|-----------------|----------|--------|
| Jab | 260 | 300 | 240 |
| Direto | 400 | 450 | 380 |
| Corte | 380 | 420 | 350 |
| Estocada | 420 | 480 | 400 |
| Aparar | 180 | 200 | 170 |
| **Dano** | 28 | 35 | 26 |
| **FOR Req** | 50 | 60 | 45 |
| **Alcance** | 2 | 3 | 2 |

### Machados

| Ação | Machadinha | Machado de Guerra | Machado Grande |
|------|------------|-------------------|----------------|
| Jab | 220 | 280 | 320 |
| Direto | 340 | 400 | 480 |
| Corte | 320 | 380 | 450 |
| Estocada | — | — | — |
| Aparar | 150 | 180 | 220 |
| **Dano** | 20 | 28 | 38 |
| **FOR Req** | 35 | 50 | 65 |
| **Alcance** | 1 | 2 | 2 |

### Impacto

| Ação | Porrete | Maça | Martelo de Guerra | Mangual |
|------|---------|------|-------------------|---------|
| Jab | 200 | 250 | 300 | 280 |
| Direto | 320 | 380 | 450 | 420 |
| Corte | — | — | — | — |
| Estocada | — | — | — | — |
| Aparar | 140 | 160 | 200 | — |
| **Dano** | 12 | 25 | 35 | 30 |
| **FOR Req** | 20 | 45 | 60 | 50 |
| **Alcance** | 1 | 1 | 2 | 2 |

### Hastes

| Ação | Bastão | Lança Curta | Lança | Lança Longa | Alabarda |
|------|--------|-------------|-------|-------------|----------|
| Jab | 180 | 180 | 200 | 240 | 300 |
| Direto | 300 | 280 | 300 | 350 | 450 |
| Corte | — | — | — | — | 400 |
| Estocada | 250 | 250 | 280 | 320 | 380 |
| Aparar | 120 | 130 | 140 | 160 | 200 |
| **Dano** | 10 | 18 | 22 | 25 | 32 |
| **FOR Req** | 20 | 25 | 35 | 45 | 55 |
| **Alcance** | 2 | 2 | 3 | 4 | 3 |

### Flexíveis

| Ação | Chicote | Corrente |
|------|---------|----------|
| Jab | 250 | 280 |
| Direto | 400 | 420 |
| Corte | 350 | — |
| Estocada | — | — |
| Aparar | — | — |
| **Dano** | 8 | 15 |
| **FOR Req** | 20 | 35 |
| **Alcance** | 3 | 2 |

### Tempo de Esquiva (universal)

| Ação | Tempo |
|------|-------|
| Esquiva | 180 |

---

## 5. ARMADURAS

| Armadura | Penalidade | Mult Fadiga | Proteção |
|----------|------------|-------------|----------|
| Nenhuma | +0 ms | ×1.0 | 0 |
| Couro | +10 ms | ×1.0 | 5 |
| Couro Reforçado | +20 ms | ×1.1 | 10 |
| Cota de Malha | +40 ms | ×1.3 | 20 |
| Brigandine | +50 ms | ×1.5 | 25 |
| Placas Parciais | +70 ms | ×1.7 | 35 |
| Placas Completas | +100 ms | ×2.0 | 45 |

*Penalidade de armadura não se aplica à Esquiva.*

---

## 6. QUALIDADE DA ARMA

| Qualidade | Mult Tempo | Mult Dano | HAB Req |
|-----------|------------|-----------|---------|
| Tosca | ×1.10 | ×0.9 | 0 |
| Comum | ×1.00 | ×1.0 | 0 |
| Boa | ×0.95 | ×1.1 | 40 |
| Excelente | ×0.90 | ×1.2 | 60 |
| Obra-prima | ×0.85 | ×1.3 | 80 |
| Lendária | ×0.80 | ×1.5 | 95 |

### Aproveitamento

Arma boa só rende se tiver habilidade:

```
Aproveitamento = min(1, HAB ÷ HAB_Req)
Mult_Real = 1 − (1 − Mult_Qualidade) × Aproveitamento
```

| Qualidade | HAB 30 | HAB 50 | HAB 70 | HAB 90 |
|-----------|--------|--------|--------|--------|
| Boa | ×0.96 | ×0.95 | ×0.95 | ×0.95 |
| Excelente | ×0.95 | ×0.92 | ×0.90 | ×0.90 |
| Obra-prima | ×0.94 | ×0.91 | ×0.87 | ×0.85 |
| Lendária | ×0.94 | ×0.89 | ×0.83 | ×0.80 |

---

## 7. PENALIDADE DE FORÇA

Se FOR < FOR_Req da arma:

```
Mult_Penalidade = 1 + (FOR_Req − FOR) × 0.02
```

| Diferença | Penalidade |
|-----------|------------|
| 5 abaixo | ×1.10 |
| 10 abaixo | ×1.20 |
| 15 abaixo | ×1.30 |
| 20 abaixo | ×1.40 |

---

## 8. MODIFICADORES SITUACIONAIS

Somar todos e aplicar: `×(1 + Total ÷ 100)`

| Fator | Condição | Mod |
|-------|----------|-----|
| **Guarda** | Alta | +10% |
| | Média | 0% |
| | Baixa | −10% |
| **Fadiga** | 0-25% | 0% |
| | 26-50% | +10% |
| | 51-75% | +30% |
| | 76-100% | +60% |
| **Posição** | Vantagem | −10% |
| | Neutra | 0% |
| | Desvantagem | +20% |
| **Ferimento** | Braço | +15% |
| | Perna | +10% |
| **Terreno** | Instável | +10% |

---

## 9. MAGIA

Duas formas de usar magia em combate:

### Opção A: Multiplicador Final

Buff/debuff temporário aplicado ao tempo final.

| Intensidade | Buff (mais rápido) | Debuff (mais lento) | Duração |
|-------------|--------------------|--------------------|---------|
| Fraca | ×0.90 | ×1.10 | 5 turnos |
| Moderada | ×0.80 | ×1.25 | 3 turnos |
| Forte | ×0.70 | ×1.40 | 2 turnos |
| Extrema | ×0.60 | ×1.60 | 1 turno |

**Exemplo:** Marcus (TE 216 ms) com buff forte:
```
Tempo = 216 × 0.70 = 151 ms
```

### Opção B: Aumento de Atributo

Magia aumenta atributo temporariamente, recalcular IC.

| Intensidade | Bônus Atributo | Duração |
|-------------|----------------|---------|
| Fraca | +10 | 5 turnos |
| Moderada | +20 | 3 turnos |
| Forte | +30 | 2 turnos |
| Extrema | +50 | 1 turno |

*Atributos podem passar de 100 com magia.*

**Exemplo:** Marcus (VEL 68) com buff forte em VEL:
```
VEL temporário = 68 + 30 = 98
Recalcular IC com VEL 98
```

### Quando Usar Cada

| Situação | Usar |
|----------|------|
| Buff rápido em combate | Multiplicador Final |
| Criatura sobrenatural | Atributo > 100 |
| Poção/encantamento duradouro | Aumento de Atributo |
| Maldição/debuff | Multiplicador Final |

---

## 10. SERES SOBRENATURAIS

Criaturas mágicas podem ter atributos acima de 100.

| Criatura | VEL | HAB | AGI | FOR |
|----------|-----|-----|-----|-----|
| Humano comum | 50 | 50 | 50 | 50 |
| Humano elite | 80 | 80 | 80 | 80 |
| Vampiro | 120 | 90 | 110 | 100 |
| Lobisomem | 100 | 60 | 90 | 130 |
| Elfo | 90 | 100 | 110 | 60 |
| Ogro | 40 | 30 | 30 | 150 |
| Demônio menor | 110 | 80 | 100 | 110 |

### Limite de IC

Com atributos muito altos, limitar IC mínimo em **0.20**:

```
IC = max(0.20, cálculo normal)
```

---

## 11. PASSO A PASSO — CRIAR PERSONAGEM

### Passo 1: Definir Atributos

| Atributo | Valor |
|----------|-------|
| VEL | ___ |
| HAB | ___ |
| AGI | ___ |
| FOR | ___ |
| RES | ___ |
| PER | ___ |

### Passo 2: Escolher Arma

Anotar:
- Nome da arma
- Tipo (para saber os pesos)
- Tempos de cada ação
- FOR Req
- Dano base

### Passo 3: Calcular IC da Arma

Usar pesos do tipo da arma:

```
IC = (100 − VEL×PesoVel − HAB×PesoHab − AGI×PesoAgi − FOR×PesoFor) ÷ 100
```

### Passo 4: Calcular IC Defensivo

**Aparar:** VEL 0.10, HAB 0.25, AGI 0.10, FOR 0.05
**Esquiva:** VEL 0.10, HAB 0.05, AGI 0.35, FOR 0.00

### Passo 5: Verificar Força

Se FOR < FOR_Req:
```
Mult_FOR = 1 + (FOR_Req − FOR) × 0.02
```
Senão: Mult_FOR = 1.00

### Passo 6: Qualidade da Arma

Se arma não é Comum:
```
Aproveitamento = min(1, HAB ÷ HAB_Req)
Mult_Qual = 1 − (1 − Mult_Base) × Aproveitamento
```
Senão: Mult_Qual = 1.00

### Passo 7: Escolher Armadura

Anotar penalidade (ms) e proteção.

### Passo 8: Calcular TE de Cada Ação

```
TE = (Tempo_Arma × IC × Mult_FOR × Mult_Qual) + Pen_Armadura
```

*Esquiva não usa Mult_FOR, Mult_Qual nem Pen_Armadura.*

### Passo 9: Derivados

```
HP = RES × 2
Mult_Dano = FOR ÷ 50
Dano = Dano_Arma × Mult_Qual_Dano × Mult_Dano
```

---

## 12. EXEMPLO — MARCUS

### Atributos

| VEL | HAB | AGI | FOR | RES | PER |
|-----|-----|-----|-----|-----|-----|
| 68 | 75 | 62 | 70 | 65 | 72 |

### Equipamento

- **Arma:** Espada Longa Excelente
- **Armadura:** Cota de Malha (+40 ms)

### Dados da Arma

| Campo | Valor |
|-------|-------|
| Tipo | Espadas 1 Mão |
| Jab | 220 ms |
| Direto | 350 ms |
| Corte | 320 ms |
| Estocada | 380 ms |
| Aparar | 150 ms |
| Dano | 22 |
| FOR Req | 40 |

### Passo 3: IC (Espadas 1 Mão)

Pesos: VEL 0.15, HAB 0.20, AGI 0.10, FOR 0.05

```
IC = (100 − 68×0.15 − 75×0.20 − 62×0.10 − 70×0.05) ÷ 100
IC = (100 − 10.2 − 15 − 6.2 − 3.5) ÷ 100
IC = 65.1 ÷ 100 = 0.651
```

### Passo 4: IC Defensivo

**Aparar:** VEL 0.10, HAB 0.25, AGI 0.10, FOR 0.05
```
IC = (100 − 6.8 − 18.75 − 6.2 − 3.5) ÷ 100 = 0.648
```

**Esquiva:** VEL 0.10, HAB 0.05, AGI 0.35, FOR 0.00
```
IC = (100 − 6.8 − 3.75 − 21.7) ÷ 100 = 0.678
```

### Passo 5: Força

FOR 70 ≥ FOR_Req 40 → Mult_FOR = 1.00

### Passo 6: Qualidade

Excelente: ×0.90 tempo, ×1.2 dano, req HAB 60

```
Aproveitamento = min(1, 75 ÷ 60) = 1.00
Mult_Qual = 0.90
```

### Passo 8: Tempos Equipados

| Ação | Base | ×IC | ×Qual | +Arm | **TE** |
|------|------|-----|-------|------|--------|
| Jab | 220 | 143 | 129 | 169 | **169 ms** |
| Direto | 350 | 228 | 205 | 245 | **245 ms** |
| Corte | 320 | 208 | 187 | 227 | **227 ms** |
| Estocada | 380 | 247 | 222 | 262 | **262 ms** |
| Aparar | 150 | 97 | 87 | 127 | **127 ms** |
| Esquiva | 180 | 122 | — | — | **122 ms** |

### Passo 9: Derivados

```
HP = 65 × 2 = 130
Mult_Dano = 70 ÷ 50 = 1.40
Dano = 22 × 1.2 × 1.40 = 37
```

---

## 13. FICHA PRONTA — MARCUS

### Informações

| Campo | Valor |
|-------|-------|
| Nome | Marcus |
| HP | 130 |
| Arma | Espada Longa Excelente |
| Armadura | Cota de Malha (Prot 20) |

### Atributos

| VEL | HAB | AGI | FOR | RES | PER |
|-----|-----|-----|-----|-----|-----|
| 68 | 75 | 62 | 70 | 65 | 72 |

### IC

| Arma | Aparar | Esquiva |
|------|--------|---------|
| 0.651 | 0.648 | 0.678 |

### Tempos (ms)

| Jab | Direto | Corte | Estocada | Aparar | Esquiva |
|-----|--------|-------|----------|--------|---------|
| 169 | 245 | 227 | 262 | 127 | 122 |

### Dano

| Tipo | Valor |
|------|-------|
| Normal | 37 |
| Jab | 19 |
| Pesado | 56 |

### Status (em jogo)

| HP | Fadiga | Guarda |
|----|--------|--------|
| ___/130 | ___% | A / M / B |

---

## 14. CÁLCULO EM COMBATE

```
Tempo Final = TE × Mult_Situacional × Mult_Magia
```

Onde:
```
Mult_Situacional = 1 + (Soma dos Mods) ÷ 100
```

### Exemplo

**Marcus** (Corte 227 ms)
- Guarda baixa: −10%
- Fadiga 35%: +10%
- Sem magia

```
Mod = −10 + 10 = 0%
Tempo = 227 × 1.00 = 227 ms
```

**Inimigo** (Jab 180 ms)
- Guarda alta: +10%
- Fadiga 55%: +30%
- Sem magia

```
Mod = +10 + 30 = 40%
Tempo = 180 × 1.40 = 252 ms
```

**Marcus acerta primeiro (227 < 252).**

---

## 15. REFERÊNCIA RÁPIDA

### Modificadores

| Guarda | Fadiga | Posição |
|--------|--------|---------|
| Alta +10% | 0-25%: 0% | Vantagem −10% |
| Média 0% | 26-50%: +10% | Neutra 0% |
| Baixa −10% | 51-75%: +30% | Desvantagem +20% |
| | 76-100%: +60% | |

### Magia (Multiplicador)

| Intensidade | Buff | Debuff |
|-------------|------|--------|
| Fraca | ×0.90 | ×1.10 |
| Moderada | ×0.80 | ×1.25 |
| Forte | ×0.70 | ×1.40 |
| Extrema | ×0.60 | ×1.60 |

### Fluxo de Turno

1. Declarar ações simultaneamente
2. Somar modificadores
3. Calcular: TE × Mult_Sit × Mult_Magia
4. Menor tempo acerta primeiro
5. Dano = Dano − Proteção
6. Atualizar HP e fadiga
