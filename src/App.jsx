import React, { useState } from 'react';

// ==================== SISTEMA DE COMBATE UNIFICADO DEFINITIVO v2.0 ====================
// Tempo Contínuo em Milissegundos com Tradições Marciais Globais

// ==================== ATRIBUTOS BASE (Escala 0-100) ====================
const ATRIBUTOS = {
  reflexo: {
    nome: 'Reflexo',
    desc: 'Velocidade de reação neuromuscular',
    formula: 'Reflexo 50 = 200ms (média humana). Modificador: (Reflexo - 50) × -2ms',
    exemplos: [
      { valor: 100, resultado: '100ms' },
      { valor: 50, resultado: '200ms' },
      { valor: 0, resultado: '300ms' },
    ],
  },
  velocidade: {
    nome: 'Velocidade',
    desc: 'Rapidez de execução de movimentos',
    formula: 'Mult_Vel = 1 - (Velocidade/100) × 0.3',
    exemplos: [
      { valor: 100, resultado: '×0.70' },
      { valor: 50, resultado: '×0.85' },
      { valor: 0, resultado: '×1.00' },
    ],
  },
  agilidade: {
    nome: 'Agilidade',
    desc: 'Coordenação, equilíbrio e precisão',
    formula: 'Precisão: +(Agi-50)/5%. Esquivas: +(Agi-50)/4%. Transições: -(Agi-50)/10ms',
    exemplos: [
      { valor: 100, resultado: '+10% precisão, +12.5% esquiva' },
      { valor: 50, resultado: '±0%' },
      { valor: 0, resultado: '-10% precisão, -12.5% esquiva' },
    ],
  },
  forca: {
    nome: 'Força',
    desc: 'Capacidade de gerar potência física',
    formula: 'Mult_Força = Força / 50',
    exemplos: [
      { valor: 100, resultado: '×2.0 dano' },
      { valor: 50, resultado: '×1.0 dano' },
      { valor: 25, resultado: '×0.5 dano' },
    ],
  },
  resistencia: {
    nome: 'Resistência',
    desc: 'Capacidade aeróbica e tolerância',
    formula: 'HP Base = Resistência × 2. Taxa exaustão: Mult = 1 - (Resistência/200)',
    exemplos: [
      { valor: 100, resultado: '200 HP, 0.5× exaustão' },
      { valor: 50, resultado: '100 HP, 0.75× exaustão' },
    ],
  },
  percepcao: {
    nome: 'Percepção',
    desc: 'Consciência tática e leitura de combate',
    formula: 'Detectar telegrafação, identificar pontos fracos',
    exemplos: [
      { valor: 80, resultado: 'Detecta padrões de movimento' },
      { valor: 60, resultado: 'Detecta telegrafos óbvios' },
    ],
  },
};

// ==================== HABILIDADE COM ARMA (0-100) ====================
const HABILIDADE_ARMA = {
  niveis: [
    { faixa: '0-20', nome: 'Novato', treino: '6 meses - 2 anos', tecnicas: 'Básicas' },
    { faixa: '21-40', nome: 'Praticante', treino: '2-5 anos', tecnicas: 'Básicas' },
    { faixa: '41-60', nome: 'Competente', treino: '5-10 anos', tecnicas: '40+: Intermediárias' },
    { faixa: '61-80', nome: 'Veterano', treino: '10-20 anos', tecnicas: '60+: Meisterhau, 70+: Half-swording' },
    { faixa: '81-100', nome: 'Mestre', treino: '20+ anos', tecnicas: '80+: Técnicas mestras' },
  ],
  multiplicador: 'Mult_Hab = 1 - (Habilidade/100) × 0.2',
};

// ==================== SISTEMA DE TEMPO (ms) ====================
const TEMPOS_BASE = {
  ataques: [
    { nome: 'Estocada Normal', tempo: 45, exaustao: -5 },
    { nome: 'Corte Horizontal Normal', tempo: 65, exaustao: -5 },
    { nome: 'Corte Descendente Normal', tempo: 75, exaustao: -6 },
  ],
  defesas: [
    { nome: 'Bloqueio com Arma', tempo: 30, exaustao: -4 },
    { nome: 'Bloqueio com Escudo', tempo: 25, exaustao: -6 },
    { nome: 'Parry', tempo: 28, exaustao: -8 },
    { nome: 'Esquiva Parcial', tempo: 25, exaustao: -6 },
    { nome: 'Esquiva Total', tempo: 35, exaustao: -10 },
  ],
  movimento: [
    { nome: 'Avanço (por metro)', tempo: 40, exaustao: -2 },
    { nome: 'Recuo (por metro)', tempo: 65, exaustao: -6 },
    { nome: 'Lateral (por metro)', tempo: 55, exaustao: -4 },
    { nome: 'Sprint (por metro)', tempo: 30, exaustao: -5 },
  ],
  formula: 'Tempo_Real = Tempo_Base × Mult_Vel × Mult_Hab × Mult_Fadiga × Mult_Armadura × Mult_Guarda',
};

// ==================== SISTEMA DE MARGEM ====================
const SISTEMA_MARGEM = {
  formula: 'Margem% = |Tempo_Ataque - Tempo_Defesa| / min(ambos) × 100',
  defesaMaisRapida: [
    { margem: '0-10%', efetividadeDefesa: '30%', danoQuePassa: '70%' },
    { margem: '10-20%', efetividadeDefesa: '50%', danoQuePassa: '50%' },
    { margem: '20-30%', efetividadeDefesa: '70%', danoQuePassa: '30%' },
    { margem: '30-40%', efetividadeDefesa: '85%', danoQuePassa: '15%' },
    { margem: '40%+', efetividadeDefesa: '100%', danoQuePassa: '0%' },
  ],
  ataqueMaisRapido: [
    { margem: '0-10%', danoAplicado: '70%', defesaEfetiva: '30%' },
    { margem: '10-20%', danoAplicado: '85%', defesaEfetiva: '15%' },
    { margem: '20-30%', danoAplicado: '95%', defesaEfetiva: '5%' },
    { margem: '30%+', danoAplicado: '100%', defesaEfetiva: '0%' },
  ],
};

// ==================== SISTEMA DE DANO ====================
const SISTEMA_DANO = {
  formula: 'Dano_Bruto = Dano_Base_Arma × Mult_Força × Mult_Intensidade × Mult_Guarda × Mult_Técnica',
  intensidades: [
    { nome: 'Leve', mult: 0.7 },
    { nome: 'Normal', mult: 1.0 },
    { nome: 'Forte', mult: 1.5 },
    { nome: 'Máximo', mult: 2.0 },
  ],
  tiposDano: [
    { tipo: 'Corte (C)', desc: 'Efetivo vs carne, inefetivo vs placas' },
    { tipo: 'Perfuração (P)', desc: 'Efetivo vs gaps, moderado vs malha' },
    { tipo: 'Contusão (Co)', desc: 'Efetivo vs TODAS armaduras (trauma)' },
  ],
};

// ==================== ARMADURAS E DR ====================
const ARMADURAS = [
  { nome: 'Gambeson', drCorte: 15, drPerf: 8, drCont: 25, mobilidade: 1.0 },
  { nome: 'Couro', drCorte: 25, drPerf: 15, drCont: 20, mobilidade: 1.0 },
  { nome: 'Malha + Gambeson', drCorte: 80, drPerf: 45, drCont: 40, mobilidade: 0.90 },
  { nome: 'Brigandine', drCorte: 90, drPerf: 50, drCont: 55, mobilidade: 0.93 },
  { nome: 'Placas 3/4', drCorte: 150, drPerf: 120, drCont: 95, mobilidade: 0.88 },
  { nome: 'Placas Full', drCorte: 200, drPerf: 180, drCont: 140, mobilidade: 0.80 },
  { nome: 'Gaps (Placas)', drCorte: 80, drPerf: 25, drCont: 40, mobilidade: null },
];

const CALLED_SHOTS = [
  { gap: 'Axila', penalidade: '-40%', dr: 25 },
  { gap: 'Visor', penalidade: '-50%', dr: 5 },
  { gap: 'Virilha', penalidade: '-30%', dr: 30 },
  { gap: 'Atrás Joelho', penalidade: '-35%', dr: 25 },
];

// ==================== GUARDAS - TRADIÇÕES MARCIAIS GLOBAIS ====================
const GUARDAS = {
  alema: {
    nome: 'Tradição Alemã (Liechtenauer)',
    guardas: [
      { nome: 'Vom Tag (Do Telhado)', posicao: 'Espada elevada sobre cabeça', protecao: 'Cabeça ×1.5, Pernas ×0.3 (EXPOSTAS)', ataque: 'Descendentes ×1.4', tempoDesc: '×0.8 (já armado)', exaustao: '-3/s', tecnicas: 'Zornhau, Scheitelhau, Zwerchhau' },
      { nome: 'Ochs (Boi)', posicao: 'Espada ao lado da cabeça, ponta aos olhos', protecao: 'Tronco Superior ×1.5, Pernas ×0.3', ataque: 'Estocada ×1.5 (ideal)', tempoEst: '×0.7 (muito rápido)', tecnicas: 'Winding, Duplieren, Mutieren', nota: 'GUARDA DE DUELO PREFERIDA' },
      { nome: 'Pflug (Arado)', posicao: 'Punho no quadril, ponta ao peito adversário', protecao: 'Balanceada ~×1.2', ataque: 'Versátil ×1.2', tempo: '×1.0', transicao: '40-50ms (MAIS RÁPIDA)', nota: 'GUARDA NEUTRA/RESET' },
      { nome: 'Alber (O Louco)', posicao: 'Espada BAIXA - ARMADILHA TÁTICA', protecao: 'Cabeça ×0.3, Pernas ×1.8', ataque: 'Contra-ataques ×1.6 (DEVASTADORES)', armadilha: '+30% previsibilidade do oponente', exaustao: '+2/s (RECUPERA)' },
      { nome: 'Langort (Ponta Longa)', posicao: 'Braços totalmente estendidos', protecao: 'Frontal ×1.6', ataque: 'Estocadas ×1.3, Alcance +30%', exaustao: '-4/s (cansativa)' },
    ],
    transicoes: [
      { de: 'Vom Tag', para: 'Ochs', tempo: 50 },
      { de: 'Vom Tag', para: 'Pflug', tempo: 45 },
      { de: 'Vom Tag', para: 'Alber', tempo: 55 },
      { de: 'Ochs', para: 'Vom Tag', tempo: 55 },
      { de: 'Ochs', para: 'Pflug', tempo: 40 },
      { de: 'Ochs', para: 'Alber', tempo: 65 },
      { de: 'Pflug', para: 'Vom Tag', tempo: 45 },
      { de: 'Pflug', para: 'Ochs', tempo: 45 },
      { de: 'Pflug', para: 'Alber', tempo: 35 },
      { de: 'Alber', para: 'Vom Tag', tempo: 30 },
      { de: 'Alber', para: 'Ochs', tempo: 60 },
      { de: 'Alber', para: 'Pflug', tempo: 35 },
    ],
  },
  italiana: {
    nome: 'Tradição Italiana (Fiore dei Liberi)',
    guardas: [
      { nome: 'Posta di Donna', posicao: 'Espada sobre ombro direito', ataque: 'Diagonais ×1.5', nota: 'Oculta direção do ataque' },
      { nome: 'Porta di Ferro', posicao: 'Espada muito baixa, super defensiva', protecao: 'Pernas ×1.8', exaustao: '+3/s (RECUPERA)', nota: 'Similar a Alber mas mais defensiva' },
      { nome: 'Dente di Cinghiaro', posicao: 'Baixa lateral, joelhos flexionados', ataque: 'Pernas/Virilha ×1.6', mobilidade: '×1.3', evasao: '+25%' },
    ],
  },
  japonesa: {
    nome: 'Tradição Japonesa (Kenjutsu)',
    guardas: [
      { nome: 'Seigan / Chūdan no Kamae', posicao: 'Espada estendida altura do peito', protecao: 'Linha Central ×1.6', ataque: 'Tsuki (estocada) ×1.5', transicao: '25-40ms (MAIS RÁPIDA de todas)', nota: 'POSTURA UNIVERSAL - 90% uso' },
      { nome: 'Jōdan no Kamae', posicao: 'Espada acima da cabeça', protecao: 'Cabeça ×0.4 (EXPOSTA)', ataque: 'Men ×1.8 (DEVASTADOR)', pressao: 'Psicológica: MÁXIMA', exaustao: '-5/s', nota: 'ALTO RISCO, ALTA RECOMPENSA' },
      { nome: 'Gedan no Kamae', posicao: 'Espada baixa, ponta ao joelho', protecao: 'Contra Jōdan ×1.8 (ESPECIALIDADE)', exaustao: '+1/s (recupera)' },
      { nome: 'Wakigamae', posicao: 'Espada ESCONDIDA atrás do corpo', engano: '×2.0 (oculta intenção)', percepcaoOponente: '-20%' },
    ],
    transicoes: [
      { de: 'Seigan', para: 'Jōdan', tempo: 25 },
      { de: 'Seigan', para: 'Gedan', tempo: 25 },
      { de: 'Jōdan', para: 'Seigan', tempo: 30 },
      { de: 'Jōdan', para: 'Gedan', tempo: 45 },
      { de: 'Gedan', para: 'Seigan', tempo: 28 },
      { de: 'Gedan', para: 'Jōdan', tempo: 50 },
    ],
  },
  espanhola: {
    nome: 'Tradição Espanhola (Verdadera Destreza)',
    guardas: [
      { nome: 'Ángulo Recto', posicao: 'Espada em linha com ombro, alcance máximo', ataque: 'Estocadas ×1.5 (PREFERIDAS)', nota: 'Sistema Geométrico baseado em matemática. Footwork circular (Compás) essencial' },
    ],
    timing: [
      { nome: 'Propio', desc: 'Iniciativa própria', risco: 'Médio' },
      { nome: 'Apropiado', desc: 'Durante preparação do oponente', bonus: '+40%' },
      { nome: 'Transferido', desc: 'Após parry', bonus: '+20%' },
    ],
  },
  filipina: {
    nome: 'Tradição Filipina (Kali/Escrima)',
    angulos: [
      { num: '1-2', desc: 'Diagonais às têmporas', freq: '45%' },
      { num: '3-4', desc: 'Horizontais às costelas', freq: '20%' },
      { num: '5', desc: 'Estocada ao abdômen', freq: '15%' },
      { num: '6-12', desc: 'Variações menos comuns', freq: '20%' },
    ],
    stances: [
      { nome: 'Panatag', desc: 'Neutro', mobilidade: '×1.3' },
      { nome: 'Pusa/Cat', desc: '90% peso atrás', evasao: '+30%' },
    ],
    gunting: [
      { alvo: 'Bíceps', efeito: '-50% velocidade de ataque' },
      { alvo: 'Antebraço', efeito: '-40% força' },
      { alvo: 'Nervos da mão', efeito: 'Stun 500ms' },
    ],
    filosofia: '"Defang the snake" - Destruir a arma/membro que ataca',
  },
  indiana: {
    nome: 'Tradição Indiana (Kalaripayattu)',
    vadivus: [
      { nome: 'Gaja', animal: 'Elefante', especialidade: 'Defesa', mult: 'Proteção ×1.8' },
      { nome: 'Simha', animal: 'Leão', especialidade: 'Poder', mult: 'Ataque ×1.6' },
      { nome: 'Ashwa', animal: 'Cavalo', especialidade: 'Versatilidade', mult: 'Tudo ×1.1' },
      { nome: 'Varaha', animal: 'Javali', especialidade: 'Carga', mult: 'Carga ×1.8' },
      { nome: 'Marjara', animal: 'Gato', especialidade: 'Agilidade', mult: 'Evasão +40%' },
      { nome: 'Sarpa', animal: 'Serpente', especialidade: 'Evasão', mult: 'Evasão +50%' },
      { nome: 'Matsya', animal: 'Peixe', especialidade: 'Fluido', mult: 'Transições ×0.7' },
      { nome: 'Kukkuda', animal: 'Galo', especialidade: 'Rapidez', mult: 'Velocidade ×1.5' },
    ],
  },
};

// ==================== ARMAS ====================
const ARMAS = {
  espadas: [
    { nome: 'Adaga', dano: 36, tipo: 'P', alcance: '0.3-0.5m', tempo: 25, forcaMin: 25 },
    { nome: 'Adaga Rondel', dano: 40, tipo: 'P', alcance: '0.3-0.5m', tempo: 25, forcaMin: 30 },
    { nome: 'Espada Curta', dano: 52, tipo: 'C/P', alcance: '0.6-0.9m', tempo: 40, forcaMin: 35 },
    { nome: 'Espada Longa', dano: 72, tipo: 'C/P', alcance: '1.0-1.4m', tempo: 55, forcaMin: 45 },
    { nome: 'Katana', dano: 68, tipo: 'C/P', alcance: '0.9-1.2m', tempo: 50, forcaMin: 40, nota: 'Corte +20%, Técnica Ikkotsu disponível' },
    { nome: 'Montante', dano: 96, tipo: 'C/P', alcance: '1.5-1.9m', tempo: 80, forcaMin: 65, nota: 'Área +30%, Anti-formação ideal' },
    { nome: 'Rapier', dano: 48, tipo: 'P', alcance: '1.0-1.3m', tempo: 35, forcaMin: 30 },
  ],
  hastes: [
    { nome: 'Lança', dano: 85, tipo: 'P', alcance: '2.0-2.8m', tempo: 60, forcaMin: 40 },
    { nome: 'Lança c/ Trava', dano: 85, tipo: 'P', alcance: '2.0-2.8m', tempo: 60, forcaMin: 40, nota: 'ESSENCIAL contra Javali, Urso, Cavalaria' },
    { nome: 'Alabarda', dano: 110, tipo: 'C/P/Co', alcance: '1.8-2.4m', tempo: 75, forcaMin: 55 },
    { nome: 'Pique', dano: 70, tipo: 'P', alcance: '3.5-5.0m', tempo: 85, forcaMin: 50 },
    { nome: 'Naginata', dano: 75, tipo: 'C/P', alcance: '2.0-2.6m', tempo: 65, forcaMin: 45 },
    { nome: 'Pollaxe', dano: 125, tipo: 'C/P/Co', alcance: '1.4-2.0m', tempo: 70, forcaMin: 55, nota: 'ANTI-ARMADURA SUPREMA, 4 modos de ataque' },
  ],
  impacto: [
    { nome: 'Maça', dano: 95, tipo: 'Co', alcance: '0.6-0.9m', tempo: 55, forcaMin: 45, nota: 'Efetivo contra TODAS armaduras' },
    { nome: 'Martelo de Guerra', dano: 120, tipo: 'Co/P', alcance: '0.7-1.0m', tempo: 65, forcaMin: 55 },
    { nome: 'Mangual', dano: 85, tipo: 'Co', alcance: '0.8-1.2m', tempo: 70, forcaMin: 50 },
  ],
  escudos: [
    { nome: 'Buckler', protecao: '60%', peso: '0.8kg', tempoBloq: 20 },
    { nome: 'Redondo', protecao: '75%', peso: '5.5kg', tempoBloq: 25 },
    { nome: 'Heater', protecao: '85%', peso: '7kg', tempoBloq: 30 },
    { nome: 'Kite', protecao: '90%', peso: '10kg', tempoBloq: 35 },
  ],
  zonasAlcance: [
    { zona: '0 Grappling', distancia: '0-0.5m', armasOtimas: 'Adagas, wrestling' },
    { zona: '1 Próximo', distancia: '0.5-1.5m', armasOtimas: 'Espadas curtas' },
    { zona: '2 Médio', distancia: '1.5-3m', armasOtimas: 'Espadas longas' },
    { zona: '3 Longo', distancia: '3-5m', armasOtimas: 'Lanças, piques' },
    { zona: '4 Aproximação', distancia: '5-10m', armasOtimas: 'Arremesso' },
    { zona: '5 Distante', distancia: '10m+', armasOtimas: 'Projéteis' },
  ],
};

// ==================== TÉCNICAS DE COMBATE ====================
const TECNICAS = {
  meisterhau: [
    { nome: 'Zornhau', tempo: 70, dano: '×1.3', habMin: 60, efeito: 'Rompe guardas laterais' },
    { nome: 'Krumphau', tempo: 65, dano: '×1.2', habMin: 65, efeito: 'Ataca mãos, derrota Ochs' },
    { nome: 'Zwerchhau', tempo: 68, dano: '×1.25', habMin: 60, efeito: 'Ignora guardas baixas' },
    { nome: 'Schielhau', tempo: 62, dano: '×1.2', habMin: 70, efeito: 'Feint integrado' },
    { nome: 'Scheitelhau', tempo: 75, dano: '×1.4', habMin: 70, efeito: 'Rompe defesas altas' },
  ],
  bind: [
    { nome: 'Winding', tempo: '80-120ms', efeito: 'Penetração +40%', habMin: 55 },
    { nome: 'Fühlen', tempo: '100ms vs 200ms', efeito: 'Detecta intenções', habMin: 70 },
    { nome: 'Duplieren', tempo: 'cada -15ms', efeito: 'Cadeia de ataques', habMin: 60 },
    { nome: 'Mutieren', tempo: 45, efeito: 'Muda estocada→corte', habMin: 65 },
  ],
  japonesas: [
    { nome: 'Ikkotsu', dano: '×2.5', habMin: 80, efeito: 'Um golpe decisivo' },
    { nome: 'Debana-waza', tempo: '-30%', dano: '+50%', habMin: 65, efeito: 'Durante wind-up inimigo' },
    { nome: 'Suriage-waza', bonus: '+30%', habMin: 60, efeito: 'Desvio + contra-ataque' },
  ],
  antiArmadura: [
    { nome: 'Half-swording', efeito: 'Alcance -40%, Precisão gaps +25%', habMin: 70 },
    { nome: 'Mordhau', efeito: 'Tipo Contusão, Dano ×1.5, bate com pomo', habMin: 65 },
    { nome: 'Ringen am Schwert', efeito: 'Wrestling com espada, desarmes', habMin: 75 },
  ],
  filipinas: [
    { nome: 'Gunting', efeito: 'Destruições de membro, efeitos específicos por alvo' },
    { nome: 'Sumbrada', efeito: 'Fluxo contínuo, -20% tempo entre ações' },
    { nome: 'Hubad-Lubad', efeito: 'Controle de braço, leva a locks/desarmes' },
  ],
};

// ==================== SISTEMA DE EXAUSTÃO ====================
const EXAUSTAO = {
  estados: [
    { faixa: '100-80', nome: 'Descansado', efeitos: 'Nenhum' },
    { faixa: '79-60', nome: 'Cansado', efeitos: 'Tempo +10%' },
    { faixa: '59-40', nome: 'Fatigado', efeitos: 'Tempo +20%, Precisão -10%' },
    { faixa: '39-20', nome: 'Exausto', efeitos: 'Tempo +35%, Precisão -20%, Dano -15%' },
    { faixa: '19-1', nome: 'Crítico', efeitos: 'Tempo +60%, Precisão -35%, Dano -30%' },
    { faixa: '0', nome: 'COLAPSO', efeitos: 'Inconsciente' },
  ],
  recuperacao: [
    { acao: 'Guarda defensiva', taxa: '+3/segundo' },
    { acao: 'Parado', taxa: '+2/segundo' },
    { acao: 'Sentado', taxa: '+25/minuto' },
    { acao: 'Deitado', taxa: '+40/minuto' },
  ],
};

// ==================== SISTEMA DE FERIMENTOS ====================
const FERIMENTOS = {
  estados: [
    { hpPercent: '100-75', nome: 'Saudável', efeitos: 'Nenhum' },
    { hpPercent: '74-50', nome: 'Ferido Leve', efeitos: 'Tempo +10%' },
    { hpPercent: '49-25', nome: 'Ferido Grave', efeitos: 'Tempo +25%, Precisão -15%' },
    { hpPercent: '24-1', nome: 'Crítico', efeitos: 'Tempo +50%, Precisão -30%' },
    { hpPercent: '0', nome: 'Morte/Inconsciente', efeitos: 'Teste Resistência' },
  ],
  sangramento: [
    { tipo: 'Leve', hpPorRound: -2, tratamento: '1 min (bandagem)' },
    { tipo: 'Moderado', hpPorRound: -5, tratamento: '5 min (primeiros socorros)' },
    { tipo: 'Severo', hpPorRound: -10, tratamento: '10 min (cirurgia)' },
    { tipo: 'Arterial', hpPorRound: -20, tratamento: 'Impossível sem médico' },
  ],
  locacoes: [
    { local: 'Cabeça', chance: '10%', multDano: '×3.0' },
    { local: 'Pescoço', chance: '5%', multDano: '×2.5' },
    { local: 'Tronco', chance: '20%', multDano: '×2.0' },
    { local: 'Braços', chance: '20%', multDano: '×1.0-1.5' },
    { local: 'Pernas', chance: '20%', multDano: '×1.0-1.5' },
    { local: 'Virilha', chance: '5%', multDano: '×2.5' },
  ],
};

// ==================== FORMAÇÕES DE COMBATE ====================
const FORMACOES = {
  muroDePiques: {
    nome: 'Muro de Piques',
    requisitos: '4+ combatentes com lanças/piques',
    mecanica: 'Cavalaria NÃO CARREGA contra formação mantida. SE formação MANTÉM: Cavalos param/desviam (95%). SE formação QUEBRA: Massacre.',
    bonus: '+10% intimidação por membro, +15% defesa por adjacente',
    vulnerabilidades: 'Flancos, arqueiros, imóvel',
  },
  schiltron: {
    nome: 'Schiltron (Círculo de Lanças)',
    requisitos: '8+ combatentes em círculo',
    mecanica: '360° de proteção. Impossível flanquear. Cavalaria para de qualquer direção.',
    vulnerabilidades: 'Completamente imóvel, arqueiros (sem teto)',
  },
  testudo: {
    nome: 'Testudo (Tartaruga Romana)',
    requisitos: '16+ com escudos grandes, alta disciplina',
    protecao: 'vs Projéteis: 95%, vs Corpo-a-corpo: 80%',
    vulnerabilidades: 'Muito lento, pode ser cercado',
  },
  shieldWall: {
    nome: 'Shield Wall (Muro de Escudos)',
    requisitos: '6+ com escudos médios/grandes',
    mecanica: 'Escudos sobrepostos. +20% defesa por adjacente. Momentum em avanço conjunto.',
  },
};

// ==================== MOVIMENTO E POSICIONAMENTO ====================
const MOVIMENTO = {
  velocidades: [
    { direcao: 'Avanço', tempoPorM: 40, exaustao: -2 },
    { direcao: 'Recuo', tempoPorM: 65, exaustao: -6 },
    { direcao: 'Lateral', tempoPorM: 55, exaustao: -4 },
    { direcao: 'Sprint', tempoPorM: 30, exaustao: -5 },
  ],
  degradacaoRecuo: [
    { recuos: '1º', multTempo: '×1.0' },
    { recuos: '2º', multTempo: '×1.15' },
    { recuos: '3º', multTempo: '×1.30' },
    { recuos: '4º', multTempo: '×1.50' },
    { recuos: '5º+', multTempo: '×1.75' },
  ],
  zonaControle: {
    entrar: 'Se alcance menor, inimigo ganha ataque de oportunidade (75% dano)',
    sair: 'Ataque de oportunidade, se acertar CANCELA recuo',
  },
};

// ==================== CRIATURAS - Dados completos de todas as criaturas ====================
const CRIATURAS = {
  centauro: {
    nome: 'Centauro', altura: 2.8, hp: 250, forca: 120, velocidade: 90, agilidade: 70, resistencia: 80, percepcao: 75, inteligencia: 70,
    descricao: 'Híbrido humano-cavalo. Corpo de cavalo com torso humano. Extremamente móvel, inteligente e tático.',
    armadura: {
      troncoHumano: { c: 40, p: 25, co: 30, nome: 'Couraça leve' },
      corpoCavalo: { c: 120, p: 90, co: 80, nome: 'Barda de placas' },
      pernasFrente: { c: 80, p: 50, co: 60, nome: 'Caneleiras frontais' },
      pernasTras: { c: 60, p: 40, co: 50, nome: 'Proteção parcial' },
      cabeca: { c: 60, p: 40, co: 45, nome: 'Elmo aberto' },
    },
    ataques: [
      { nome: 'Estocada de Lança', dano: 95, tempo: '55ms', alcance: '3.5m', tipo: 'perfuração', desc: 'Ataque principal usando momentum da carga' },
      { nome: 'Golpe Lateral de Lança', dano: 80, tempo: '65ms', alcance: '3m', tipo: 'corte', desc: 'Varredura horizontal ampla' },
      { nome: 'Coice Traseiro (1 perna)', dano: 70, tempo: '45ms', alcance: '2m', tipo: 'contusão', desc: 'Ataque rápido para trás' },
      { nome: 'Coice Traseiro (2 pernas)', dano: 130, tempo: '80ms', alcance: '2.5m', tipo: 'contusão', desc: 'Devastador mas muito telegrafado' },
      { nome: 'Coice Frontal', dano: 60, tempo: '50ms', alcance: '1.5m', tipo: 'contusão', desc: 'Empurra alvo 2-3m' },
      { nome: 'Empinar + Pisotear', dano: 150, tempo: '120ms', alcance: '2m', tipo: 'contusão', desc: 'Muito telegrafado (+30% percepção)' },
      { nome: 'Empinar + Estocada', dano: 180, tempo: '140ms', alcance: '3m', tipo: 'perfuração', desc: 'Combo devastador, abre guarda após' },
      { nome: 'Investida de Carga', dano: 200, tempo: '—', alcance: '10m+', tipo: 'contusão+perf', desc: 'Carga em linha reta com lança' },
      { nome: 'Atropelamento', dano: 120, tempo: '—', alcance: 'corpo', tipo: 'contusão', desc: 'Passar por cima do alvo caído' },
    ],
    comportamento: [
      'Mantém distância constantemente - nunca entra em alcance de espadas',
      'Nunca fica parado - sempre em movimento circular ou recuando',
      'Recua imediatamente após cada ataque (hit-and-run)',
      'Usa terreno aberto para maximizar mobilidade',
      'Foge se encurralado em vez de lutar cercado',
      'Ataca sem ser atacado - filosofia de não-engajamento',
      'Em grupo, coordenam ataques de múltiplas direções',
      'Inteligente o suficiente para identificar o líder inimigo',
    ],
    pontosFortes: [
      'Velocidade superior a qualquer humano (galope ~60 km/h)',
      'Alcance de lança + altura = quase impossível aproximar',
      'Armadura pesada na parte cavalo protege órgãos vitais',
      'Inteligência tática - usa estratégias de cavalaria',
      'Resistência para combate prolongado',
      'Pode atacar enquanto se move em velocidade máxima',
    ],
    pontosFracos: [
      'Pernas traseiras menos protegidas que frontais',
      'Tendões de Aquiles expostos e críticos',
      'Barriga do cavalo sem proteção adequada',
      'Torso humano menos protegido',
      'Extremamente vulnerável a boleadeiras',
      'Não pode lutar em espaços apertados',
      'Terreno difícil reduz mobilidade drasticamente',
    ],
    telegrafos: [
      { sinal: 'Abaixa traseira, peso nas patas da frente', ataque: 'Coice traseiro', antecedencia: '200ms' },
      { sinal: 'Empina nas patas traseiras', ataque: 'Pisotear ou Combo com Lança', antecedencia: '400ms' },
      { sinal: 'Gira o corpo lateralmente', ataque: 'Golpe lateral de lança', antecedencia: '150ms' },
      { sinal: 'Recua 3+ passos e abaixa lança', ataque: 'Preparando Investida', antecedencia: '500ms' },
      { sinal: 'Olha para trás sobre o ombro', ataque: 'Fuga ou reposicionamento', antecedencia: '300ms' },
    ],
    taticasDerrota: [
      { nome: 'Boleadeiras', desc: 'Arremesso nas pernas emaranha e derruba. Centauro caído = vulnerável. Mesma técnica dos povos das Pampas contra cavalaria espanhola.', efetividade: 95, requer: 'Arma especial, treino' },
      { nome: 'Formação de Piques', desc: 'Muro de lanças de 4-5m fincadas no chão. Cavalos não carregam contra pontas - psicologia equina.', efetividade: 90, requer: '4+ soldados com lanças longas' },
      { nome: 'Terreno Confinado', desc: 'Atrair para passagem estreita ou floresta densa. Nega mobilidade.', efetividade: 85, requer: 'Planejamento' },
      { nome: 'Emboscada Coordenada', desc: 'Frontal distrai, outros atacam pernas por trás.', efetividade: 80, requer: '3+ pessoas' },
      { nome: 'Cortar Tendões (Hamstringing)', desc: 'Alvejar tendões traseiros = colapso imediato. Tática romana.', efetividade: 95, requer: 'Aproximação por trás' },
      { nome: 'Armadilhas no Solo', desc: 'Fossos ocultos, estacas. Robert Bruce usou em Bannockburn.', efetividade: 75, requer: 'Preparação prévia' },
    ],
    conhecimentoSecreto: 'O centauro tem um ponto cego direto atrás da garupa (170-190°). Aproximar por esse ângulo = ele precisa girar completamente, criando janela de 400ms. Centauros treinados têm reflexo: sempre dão coice primeiro antes de girar quando sentem perigo atrás.',
  },

  minotauro: {
    nome: 'Minotauro', altura: 2.2, hp: 350, forca: 180, velocidade: 50, agilidade: 40, resistencia: 120, percepcao: 45, inteligencia: 35,
    descricao: 'Híbrido humano-touro. Força descomunal, resistência extrema, mas lento. Combate como enfrentar touro - sistema de desgaste progressivo.',
    armadura: {
      tronco: { c: 30, p: 15, co: 40, nome: 'Couro grosso + músculos' },
      cabeca: { c: 80, p: 50, co: 70, nome: 'Crânio reforçado + chifres' },
      ombros: { c: 50, p: 30, co: 45, nome: 'Morrillo (corcova muscular)' },
      bracos: { c: 20, p: 10, co: 25, nome: 'Pele grossa' },
      pernas: { c: 25, p: 15, co: 30, nome: 'Pele grossa' },
    },
    ataques: [
      { nome: 'Golpe de Machado Descendente', dano: 160, tempo: '90ms', alcance: '2m', tipo: 'corte', desc: 'Devastador, quebra guardas' },
      { nome: 'Golpe de Machado Horizontal', dano: 140, tempo: '80ms', alcance: '2.5m', tipo: 'corte', desc: 'Varredura ampla' },
      { nome: 'Cabeçada', dano: 100, tempo: '60ms', alcance: '1m', tipo: 'contusão', desc: 'Arremessa alvo 3-5m' },
      { nome: 'Chifrada Ascendente', dano: 120, tempo: '70ms', alcance: '1.5m', tipo: 'perfuração', desc: 'Pode empalar e levantar' },
      { nome: 'Investida de Touro', dano: 180, tempo: '—', alcance: '8m', tipo: 'contusão', desc: 'Carga em linha reta' },
      { nome: 'Agarrar + Esmagar', dano: 90, tempo: '100ms', alcance: '1m', tipo: 'contusão', desc: '90 dano/turno' },
    ],
    comportamento: [
      'Extremamente agressivo - ataca primeiro',
      'NUNCA recua - luta até morrer',
      'Fica MAIS perigoso quando ferido (+20% dano abaixo de 50% HP)',
      'Foca em um alvo até eliminá-lo',
      'Usa força bruta sem finesse',
      'Pode entrar em frenesi: +30% dano, +20% vel, -40% def',
    ],
    pontosFortes: [
      'Força absurda - quebra escudos',
      'Resistência extrema a ferimentos',
      'Crânio e chifres muito protegidos',
      'Alta tolerância à dor',
      'Mais perigoso quando ferido',
    ],
    pontosFracos: [
      'Lento e previsível',
      'Baixa inteligência - cai em armadilhas',
      'Ataques muito telegrafados',
      'Flancos e costas expostos',
      'Olhos sensíveis',
      'Ombros/pescoço = área de enfraquecimento',
    ],
    telegrafos: [
      { sinal: 'Levanta machado acima da cabeça', ataque: 'Golpe descendente', antecedencia: '350ms' },
      { sinal: 'Gira torso para trás', ataque: 'Golpe horizontal', antecedencia: '250ms' },
      { sinal: 'Abaixa cabeça, bufa, bate pé', ataque: 'Cabeçada ou Investida', antecedencia: '400ms' },
      { sinal: 'Abre braços largos', ataque: 'Agarrar', antecedencia: '300ms' },
      { sinal: 'Rosna e bate no chão', ataque: 'Entrando em frenesi', antecedencia: '500ms' },
    ],
    taticasDerrota: [
      { nome: 'Sistema de Tourada', desc: 'ESTÁGIO 1: Ferir morrillo para enfraquecer pescoço. ESTÁGIO 2: Acumular sangramento. ESTÁGIO 3: Golpe final com cabeça abaixada. Técnica de matadores.', efetividade: 90, requer: 'Paciência, múltiplos combatentes' },
      { nome: 'Esquiva Lateral na Investida', desc: 'Investida em linha reta. Esquivar no último momento, atacar flanco.', efetividade: 85, requer: 'Timing preciso' },
      { nome: 'Armadilhas de Fosso', desc: 'Minotauro caído em fosso = vulnerável.', efetividade: 90, requer: 'Preparação' },
      { nome: 'Lança com Trava', desc: 'Cruzeta impede que suba pela lança. Técnica de caça.', efetividade: 85, requer: 'Lança especial' },
      { nome: 'Combate em Labirinto', desc: 'Corredores estreitos = machado inefetivo.', efetividade: 80, requer: 'Terreno apropriado' },
    ],
    conhecimentoSecreto: 'O morrillo (corcova muscular nos ombros) é chave. Após ~100 dano nessa região, músculos falham: cabeçadas impossíveis, chifradas -50% dano, machado -30% força. Exatamente como picadores em touradas.',
  },

  ogro: {
    nome: 'Ogro', altura: 3, hp: 280, forca: 120, velocidade: 40, agilidade: 30, resistencia: 100, percepcao: 35, inteligencia: 25,
    descricao: 'Humanoide massivo de força bruta descomunal mas inteligência limitada. A disparidade de tamanho torna combate direto suicida, mas tratados HEMA sobre combate com oponentes maiores fornecem táticas: escalada, ataques às pernas, uso de terreno.',
    armadura: {
      corpo: { c: 20, p: 12, co: 25, nome: 'Pele naturalmente grossa' },
      cabeca: { c: 15, p: 10, co: 20, nome: 'Crânio grosso mas cérebro pequeno' },
      bracos: { c: 18, p: 10, co: 22, nome: 'Braços massivos' },
      pernas: { c: 18, p: 10, co: 22, nome: 'Grossas mas tendões expostos' },
      barriga: { c: 15, p: 8, co: 18, nome: 'Frequentemente exposta - PONTO FRACO' },
      olhos: { c: 0, p: 0, co: 5, nome: 'CRÍTICO - sem proteção' },
      virilha: { c: 12, p: 6, co: 15, nome: 'Área vulnerável' },
    },
    ataques: [
      { nome: 'Golpe de Clava/Porrete', dano: 130, tempo: '150ms', alcance: '3m', tipo: 'contusão', desc: 'Arma improvisada massiva. Pode achatar armadura.' },
      { nome: 'Agarrar', dano: 80, tempo: '200ms', alcance: '2m', tipo: 'contusão', desc: 'Tenta agarrar para esmagar ou arremessar.' },
      { nome: 'Pisotear', dano: 100, tempo: '120ms', alcance: '1m', tipo: 'contusão', desc: 'Contra alvos no chão. Peso devastador.' },
      { nome: 'Chute', dano: 90, tempo: '130ms', alcance: '2m', tipo: 'contusão', desc: 'Pode mandar vítima voando metros.' },
      { nome: 'Arremessar Objeto/Pessoa', dano: 70, tempo: '180ms', alcance: '10m+', tipo: 'contusão', desc: 'Arremessa pedras, móveis, ou pessoas.' },
      { nome: 'Esmagar (após agarrar)', dano: 150, tempo: '—', alcance: '0m', tipo: 'contusão', desc: 'Esmaga entre mãos ou contra superfície.' },
    ],
    comportamento: [
      'Inteligência limitada - pode ser enganado',
      'Confiança excessiva na força',
      'Ataques lentos e previsíveis',
      'Frequentemente subestima oponentes menores',
      'Pode ser enfurecido (perde mais precisão)',
      'Territorialista',
      'Pode fugir se seriamente ferido',
      'Vulnerável a armadilhas e truques',
    ],
    pontosFortes: [
      'Força devastadora - golpes podem matar instantaneamente',
      'Alcance superior (braços de 2m+)',
      'HP massivo - difícil derrubar com dano convencional',
      'Intimidação - tamanho causa testes de moral',
    ],
    pontosFracos: [
      'Lentidão - ataques telegrafados, janelas de 400-600ms',
      'Inteligência baixa - cai em distrações e armadilhas',
      'Olhos sem proteção - cegar reduz -50% capacidade',
      'Tendões das pernas - cortar = não fica em pé',
      'Virilha - altura conveniente para humanos',
      'Parte de trás dos joelhos - forçar dobrar = queda',
    ],
    telegrafos: [
      { sinal: 'Ergue clava/braço bem alto', ataque: 'Golpe Descendente', antecedencia: '500ms' },
      { sinal: 'Braços abertos, inclina corpo', ataque: 'Agarrar', antecedencia: '600ms' },
      { sinal: 'Levanta pé', ataque: 'Pisotear', antecedencia: '400ms' },
      { sinal: 'Perna recua', ataque: 'Chute', antecedencia: '450ms' },
      { sinal: 'Pega objeto/olha para você', ataque: 'Arremesso', antecedencia: '700ms' },
    ],
    taticasDerrota: [
      { nome: 'Hamstringing (Cortar Tendões)', desc: 'Técnica HEMA principal contra maiores. Atacar tendões faz ogro cair. No chão, perde vantagem de alcance/altura.', efetividade: 90, requer: 'Lâmina afiada, aproximação lateral/traseira' },
      { nome: 'Atacar os Olhos', desc: 'Olhos vulneráveis independente do tamanho. Um olho cego = -50% percepção e precisão.', efetividade: 85, requer: 'Arma de alcance ou arremesso, mira precisa' },
      { nome: 'Escalada', desc: 'Escalar o ogro (perna → costas → pescoço) fica fora do alcance dos braços. Atacar pontos vitais.', efetividade: 75, requer: 'Agilidade alta, ogro distraído' },
      { nome: 'Terreno/Armadilhas', desc: 'Ogros são burros. Fossos cobertos, cordas no chão, passagens estreitas onde não cabem.', efetividade: 85, requer: 'Preparação, conhecimento do terreno' },
      { nome: 'Grupo Coordenado', desc: 'Um distrai na frente, outros atacam pernas/costas. Ogro não defende todos os lados.', efetividade: 80, requer: 'Grupo (3+), coordenação' },
      { nome: 'Atacar Durante Recovery', desc: 'Após golpe massivo, ogro tem recovery longo. Janela de 300-500ms para contra-ataque.', efetividade: 70, requer: 'Timing, velocidade' },
    ],
    conhecimentoSecreto: 'O segredo contra oponentes muito maiores é NUNCA lutar no jogo deles. Não bloqueie - esquive. Não ataque o torso - ataque as PERNAS. Não enfrente - CIRCULE. Tratados HEMA são claros: disparidade de tamanho extrema requer colocar o oponente NO CHÃO primeiro. Tendões cortados = gigante caído = vitória.',
  },

  gigante: {
    nome: 'Gigante', altura: 6.5, hp: 600, forca: 200, velocidade: 35, agilidade: 20, resistencia: 180, percepcao: 40, inteligencia: 45,
    descricao: 'Humanoide colossal de proporções titânicas. A diferença de escala torna combate direto impossível - você não luta contra um gigante, você SOBREVIVE a um gigante enquanto busca pontos vulneráveis. Táticas HEMA para disparidade extrema são a única chance.',
    armadura: {
      corpo: { c: 30, p: 20, co: 40, nome: 'Pele grossa como couro' },
      cabeca: { c: 25, p: 15, co: 35, nome: 'Crânio massivo' },
      bracos: { c: 28, p: 18, co: 38, nome: 'Músculos enormes' },
      pernas: { c: 28, p: 18, co: 38, nome: 'Pilares de músculo - tendões vulneráveis' },
      olhos: { c: 0, p: 0, co: 5, nome: 'CRÍTICO - único ponto vulnerável à distância' },
      virilha: { c: 20, p: 12, co: 25, nome: 'Menos protegida' },
      tendaoAquiles: { c: 15, p: 10, co: 20, nome: 'CRÍTICO - cortar = gigante cai' },
    },
    ataques: [
      { nome: 'Pisar', dano: 200, tempo: '200ms', alcance: '3m', tipo: 'contusão', desc: 'Pé do tamanho de um carro. Esmagamento instantâneo.' },
      { nome: 'Golpe de Mão', dano: 180, tempo: '180ms', alcance: '5m', tipo: 'contusão', desc: 'Tapa pode mandar pessoa voando 10m+.' },
      { nome: 'Agarrar', dano: 100, tempo: '250ms', alcance: '5m', tipo: 'contusão', desc: 'Pode pegar pessoa como boneco. Esmagar ou arremessar.' },
      { nome: 'Chute', dano: 220, tempo: '220ms', alcance: '6m', tipo: 'contusão', desc: 'Como ser atingido por carroça em velocidade.' },
      { nome: 'Clava/Árvore', dano: 250, tempo: '300ms', alcance: '8m', tipo: 'contusão', desc: 'Usa árvores ou pedras como armas. Área massiva.' },
      { nome: 'Arremesso de Pedra', dano: 150, tempo: '350ms', alcance: '50m+', tipo: 'contusão', desc: 'Pedras do tamanho de melões como projéteis.' },
      { nome: 'Esmagar (após agarrar)', dano: 250, tempo: '—', alcance: '0m', tipo: 'contusão', desc: 'Aperta até ossos quebrarem.' },
    ],
    comportamento: [
      'Inteligência variável (alguns são espertos)',
      'Pode ignorar atacantes pequenos como incômodos',
      'Ataques MUITO lentos mas área de efeito enorme',
      'Vulnerável a ser distraído',
      'Frequentemente solitário',
      'Pode ser surpreendido (tamanho dificulta perceber pequenos)',
      'Dor pode causar reações violentas e descontroladas',
    ],
    pontosFortes: [
      'Escala impossível - combate convencional inútil',
      'Alcance absurdo (braços 3-4m + armas = 8m+)',
      'HP colossal - dano convencional insignificante',
      'Força cataclísmica - derruba paredes, árvores',
      'Área de efeito - cada ataque cobre área enorme',
    ],
    pontosFracos: [
      'Tendão de Aquiles - cortar = colapso (ponto fraco clássico)',
      'Olhos - único alvo realmente vulnerável à distância',
      'Lentidão extrema - ataques de 200-350ms, tempo para reagir',
      'Ouvidos - barulho alto pode desorientar',
      'Dificuldade com pequenos - difícil mirar em "ratos"',
      'Terreno preparado - fossos = gigante caído',
    ],
    telegrafos: [
      { sinal: 'Levanta pé, olha para baixo', ataque: 'Pisar', antecedencia: '600ms' },
      { sinal: 'Braço recua', ataque: 'Golpe de Mão', antecedencia: '500ms' },
      { sinal: 'Inclina, braços estendidos', ataque: 'Agarrar', antecedencia: '700ms' },
      { sinal: 'Perna recua', ataque: 'Chute', antecedencia: '600ms' },
      { sinal: 'Ergue objeto acima', ataque: 'Golpe com Clava', antecedencia: '800ms' },
      { sinal: 'Braço volta atrás, mira', ataque: 'Arremesso', antecedencia: '900ms' },
    ],
    taticasDerrota: [
      { nome: 'Tendão de Aquiles (Clássico)', desc: 'A tática de Davi contra Golias em escala maior. O tendão é vulnerável independente do tamanho. Cortar = gigante cai. No chão, perde toda vantagem.', efetividade: 95, requer: 'Aproximação por trás, arma afiada grande' },
      { nome: 'Flecha/Lança no Olho', desc: 'Como Davi matou Golias - projetil certeiro no único ponto vulnerável. Requer mira excepcional mas pode ser fatal.', efetividade: 90, requer: 'Arco/besta de qualidade, habilidade 80+' },
      { nome: 'Fossos e Armadilhas', desc: 'Fossos cobertos para a perna cair dentro. Gigante com perna presa = alvo fácil.', efetividade: 85, requer: 'Preparação extensiva, terreno cooperativo' },
      { nome: 'Escalada + Ataque Vital', desc: 'Escalar o gigante (perna → costas → pescoço) e atacar garganta, olhos ou orelhas de perto.', efetividade: 80, requer: 'Agilidade extrema, gigante distraído' },
      { nome: 'Entre as Pernas', desc: 'Zona relativamente segura. Gigante tem dificuldade em atacar diretamente abaixo. De lá, atacar tendões.', efetividade: 75, requer: 'Coragem, velocidade, consciência espacial' },
      { nome: 'Grupo Grande (10+)', desc: 'Com pessoas suficientes, mesmo gigante pode ser sobrecarregado. Alguns atacam pernas enquanto outros distraem.', efetividade: 85, requer: 'Grupo grande, coordenação, sacrifícios possíveis' },
    ],
    conhecimentoSecreto: 'O segredo contra gigantes é que eles são PRISIONEIROS de seu tamanho. Não conseguem se abaixar facilmente, não conseguem mirar em alvos pequenos com precisão, não conseguem proteger as próprias pernas. A zona ENTRE as pernas é quase um ponto cego. De lá, você pode cortar tendões com relativa segurança.',
  },
  lobo: {
    nome: 'Lobo', altura: 0.8, hp: 60, forca: 60, velocidade: 85, agilidade: 80, resistencia: 70, percepcao: 90, inteligencia: 40,
    descricao: 'Predador de matilha. Sozinho é manejável; em grupo é mortal.',
    armadura: { corpo: { c: 10, p: 5, co: 8, nome: 'Pelo grosso' }, pescoco: { c: 15, p: 8, co: 12, nome: 'Juba' } },
    ataques: [
      { nome: 'Mordida', dano: 45, tempo: '35ms', alcance: '0.5m', tipo: 'perfuração', desc: 'Pode prender membro' },
      { nome: 'Mordida + Puxar', dano: 55, tempo: '50ms', alcance: '0.5m', tipo: 'perfuração', desc: 'Derruba se prender perna' },
      { nome: 'Salto + Mordida', dano: 60, tempo: '60ms', alcance: '2m', tipo: 'perfuração', desc: 'Visa garganta' },
    ],
    comportamento: ['Nunca ataca sozinho', 'Cerca presa em grupo', 'Ataca pernas primeiro', 'Foge se perder 2+ da matilha'],
    pontosFortes: ['Velocidade', 'Matilha', 'Resistência para perseguição'],
    pontosFracos: ['Frágil sozinho', 'Foge se ameaçado', 'Vulnerável a lanças'],
    telegrafos: [{ sinal: 'Abaixa traseira', ataque: 'Salto', antecedencia: '200ms' }, { sinal: 'Rosna mostrando dentes', ataque: 'Mordida', antecedencia: '150ms' }],
    taticasDerrota: [
      { nome: 'Matar Alfa', desc: 'Matilha perde coordenação', efetividade: 80, requer: 'Identificar alfa' },
      { nome: 'Costas contra Parede', desc: 'Impede cerco', efetividade: 70, requer: 'Terreno' },
      { nome: 'Fogo', desc: 'Lobos temem fogo', efetividade: 90, requer: 'Tocha' },
    ],
    conhecimentoSecreto: 'O alfa sempre ataca por último, deixando subordinados testar defesas. Mate os primeiros atacantes rapidamente e o alfa pode recuar.',
  },

  javali: {
    nome: 'Javali', altura: 0.9, hp: 80, forca: 70, velocidade: 65, agilidade: 50, resistencia: 90, percepcao: 60, inteligencia: 25,
    descricao: 'Animal mais perigoso da Europa medieval. Não foge, não para, continua atacando mesmo mortalmente ferido.',
    armadura: { corpo: { c: 15, p: 8, co: 20, nome: 'Couro + gordura' }, ombros: { c: 25, p: 15, co: 30, nome: 'Escudo de cartilagem' } },
    ataques: [
      { nome: 'Investida', dano: 70, tempo: '—', alcance: '5m', tipo: 'contusão', desc: 'Derruba alvo' },
      { nome: 'Golpe de Presa', dano: 55, tempo: '40ms', alcance: '0.5m', tipo: 'corte', desc: 'Visa pernas' },
      { nome: 'Rasgar (caído)', dano: 80, tempo: '50ms', alcance: '0', tipo: 'corte', desc: 'Eviscera vítima no chão' },
    ],
    comportamento: ['NUNCA foge', 'Continua com ferimentos fatais', 'Foca em derrubar', 'Mais perigoso quando ferido'],
    pontosFortes: ['Não para', 'Resistente', 'Ombros blindados'],
    pontosFracos: ['Não muda direção bem', 'Lança com trava é fatal'],
    telegrafos: [{ sinal: 'Abaixa cabeça, bufa', ataque: 'Investida', antecedencia: '300ms' }],
    taticasDerrota: [
      { nome: 'Lança com Trava', desc: 'Cruzeta impede subir pela lança', efetividade: 95, requer: 'Lança especial' },
      { nome: 'Árvore', desc: 'Javali não escala', efetividade: 100, requer: 'Árvore próxima' },
    ],
    conhecimentoSecreto: 'Javalis mortalmente feridos têm ~10 segundos antes de colapsar. Nesses 10 segundos são MAIS perigosos. Após acerto fatal, RECUE.',
  },

  urso: {
    nome: 'Urso', altura: 2.5, hp: 300, forca: 150, velocidade: 55, agilidade: 45, resistencia: 100, percepcao: 80, inteligencia: 35,
    descricao: 'Predador massivo. Força, velocidade surpreendente e resistência. Abraço = morte.',
    armadura: { corpo: { c: 20, p: 10, co: 25, nome: 'Pelo + gordura + músculo' }, cabeca: { c: 30, p: 15, co: 35, nome: 'Crânio grosso' } },
    ataques: [
      { nome: 'Patada', dano: 90, tempo: '55ms', alcance: '2m', tipo: 'corte', desc: 'Garras decepam membros' },
      { nome: 'Mordida', dano: 100, tempo: '60ms', alcance: '1m', tipo: 'perfuração', desc: 'Esmaga ossos' },
      { nome: 'Abraço de Urso', dano: 150, tempo: '100ms', alcance: '1m', tipo: 'contusão', desc: '150/turno, quebra costelas' },
      { nome: 'Investida', dano: 120, tempo: '—', alcance: '8m', tipo: 'contusão', desc: 'Mais rápido que parece' },
    ],
    comportamento: ['Geralmente evita humanos', 'Territorialista', 'Mãe com filhotes = máxima agressão', 'Persegue se fugir'],
    pontosFortes: ['Força', 'Velocidade surpresa', 'Resistência'],
    pontosFracos: ['Focinho sensível', 'Olhos', 'Não gosta de fogo'],
    telegrafos: [{ sinal: 'Fica de pé nas traseiras', ataque: 'Vai atacar ou intimidar', antecedencia: '400ms' }],
    taticasDerrota: [
      { nome: 'Lança de Urso', desc: 'Lança longa com cruzeta larga', efetividade: 85, requer: 'Lança especial, coragem' },
      { nome: 'Golpe no Focinho', desc: 'Extremamente sensível', efetividade: 60, requer: 'Acerto preciso' },
    ],
    conhecimentoSecreto: 'Se urso levantar nas traseiras e você tiver lança longa, ele está oferecendo o peito. Estocada ao coração é possível.',
  },

  troll: {
    nome: 'Troll', altura: 3.0, hp: 400, forca: 180, velocidade: 40, agilidade: 35, resistencia: 200, percepcao: 35, inteligencia: 20,
    descricao: 'Humanóide regenerativo. Ferimentos curam em segundos. Fogo ou ácido essenciais.',
    armadura: { corpo: { c: 35, p: 20, co: 40, nome: 'Pele como couro de rinoceronte' } },
    ataques: [
      { nome: 'Garras', dano: 100, tempo: '70ms', alcance: '2m', tipo: 'corte', desc: 'Regeneram se cortadas' },
      { nome: 'Mordida', dano: 90, tempo: '80ms', alcance: '1m', tipo: 'perfuração', desc: 'Come vítimas vivas' },
    ],
    comportamento: ['Confiante pela regeneração', 'Foge de fogo', 'Territorialista', 'Come qualquer coisa orgânica'],
    pontosFortes: ['Regeneração (20 HP/turno)', 'Força', 'Resistência'],
    pontosFracos: ['Fogo impede regeneração', 'Ácido impede regeneração', 'Luz solar (algumas variantes)'],
    telegrafos: [{ sinal: 'Levanta ambos braços', ataque: 'Garras duplas', antecedencia: '300ms' }],
    taticasDerrota: [
      { nome: 'Fogo', desc: 'Impede regeneração por 1 minuto', efetividade: 95, requer: 'Armas de fogo, tochas' },
      { nome: 'Ácido', desc: 'Queima e impede regeneração', efetividade: 90, requer: 'Ácido alquímico' },
    ],
    conhecimentoSecreto: 'Regeneração consome energia. Pressão constante com fogo por 2+ minutos = "exaustão regenerativa", não cura por 10 minutos.',
  },

  ciclope: {
    nome: 'Ciclope', altura: 5.0, hp: 600, forca: 220, velocidade: 45, agilidade: 30, resistencia: 120, percepcao: 30, inteligencia: 40,
    descricao: 'Gigante de um olho só. Olho único = vantagem (foco) e fraqueza (ponto cego, sem profundidade).',
    armadura: { corpo: { c: 50, p: 25, co: 60, nome: 'Pele grossa' }, cabeca: { c: 40, p: 20, co: 45, nome: 'Crânio grosso (exceto olho)' } },
    ataques: [
      { nome: 'Clava Gigante', dano: 180, tempo: '100ms', alcance: '4m', tipo: 'contusão', desc: 'Área de impacto' },
      { nome: 'Arremesso de Pedra', dano: 150, tempo: '150ms', alcance: '30m', tipo: 'contusão', desc: 'Precisão limitada' },
      { nome: 'Pisotear', dano: 200, tempo: '120ms', alcance: '2m', tipo: 'contusão', desc: 'Morte provável' },
    ],
    comportamento: ['Menos agressivo que gigantes', 'Alguns são pastores', 'Visão de profundidade ruim'],
    pontosFortes: ['Força', 'HP alto', 'Alcance'],
    pontosFracos: ['Olho único = alvo óbvio', 'Sem visão de profundidade', 'Ponto cego lateral 60° cada lado'],
    telegrafos: [{ sinal: 'Levanta clava alto', ataque: 'Golpe descendente', antecedencia: '400ms' }],
    taticasDerrota: [
      { nome: 'Cegar o Olho', desc: 'Cegueira total', efetividade: 95, requer: 'Arremesso ou lança, mira excepcional' },
      { nome: 'Explorar Ponto Cego', desc: 'Ficar nos 60° laterais', efetividade: 75, requer: 'Mobilidade' },
    ],
    conhecimentoSecreto: 'Ponto cego de 60° para cada lado. Movimentação constante nesses ângulos frustra ciclopes - literalmente não podem te ver.',
  },

  hidra: {
    nome: 'Hidra', altura: 4.0, hp: 500, forca: 100, velocidade: 50, agilidade: 60, resistencia: 150, percepcao: 70, inteligencia: 15,
    descricao: 'Serpente de múltiplas cabeças. Cortar cabeça = nascem duas. Fogo no pescoço impede.',
    armadura: { corpo: { c: 40, p: 30, co: 35, nome: 'Escamas grossas' }, cabecas: { c: 25, p: 15, co: 20, nome: 'Escamas menores' }, pescoco: { c: 20, p: 10, co: 15, nome: 'Ponto fraco' } },
    ataques: [
      { nome: 'Mordida (por cabeça)', dano: 50, tempo: '40ms', alcance: '3m', tipo: 'perfuração', desc: 'Múltiplas simultâneas' },
      { nome: 'Veneno', dano: 30, tempo: '—', alcance: '—', tipo: 'veneno', desc: '30/turno por 5 turnos' },
      { nome: 'Constrição', dano: 80, tempo: '100ms', alcance: '5m', tipo: 'contusão', desc: 'Corpo esmaga' },
    ],
    comportamento: ['Cabeças atacam independentemente', 'Muito agressiva', 'Mais perigosa com mais cabeças'],
    pontosFortes: ['Múltiplos ataques', 'Regeneração de cabeças', 'Veneno'],
    pontosFracos: ['Fogo cauteriza', 'Corpo principal vulnerável'],
    telegrafos: [{ sinal: 'Cabeça recua para trás', ataque: 'Bote de mordida', antecedencia: '150ms' }],
    taticasDerrota: [
      { nome: 'Fogo após Corte', desc: 'Cortar E cauterizar imediatamente', efetividade: 95, requer: 'Arma + fogo' },
      { nome: 'Atacar Corpo', desc: 'Ignorar cabeças, atacar corpo principal', efetividade: 80, requer: 'Evitar mordidas' },
    ],
    conhecimentoSecreto: 'Existe um "coração de cabeça" central que controla as outras. Destruir e cauterizar = atordoa todas as outras por 10 segundos.',
  },

  grifo: {
    nome: 'Grifo', altura: 2.0, hp: 200, forca: 90, velocidade: 120, agilidade: 95, resistencia: 80, percepcao: 95, inteligencia: 45,
    descricao: 'Híbrido águia-leão. Predador aéreo supremo. Ataca do céu com velocidade devastadora.',
    armadura: { corpo: { c: 25, p: 15, co: 20, nome: 'Penas + pelo' }, asas: { c: 10, p: 5, co: 8, nome: 'Vulnerável' } },
    ataques: [
      { nome: 'Mergulho', dano: 150, tempo: '—', alcance: '50m+', tipo: 'perfuração', desc: 'Ataque do céu' },
      { nome: 'Garras (águia)', dano: 70, tempo: '45ms', alcance: '1.5m', tipo: 'perfuração', desc: 'Pode levantar' },
      { nome: 'Garras (leão)', dano: 60, tempo: '40ms', alcance: '1m', tipo: 'corte', desc: 'Rápidas' },
      { nome: 'Bico', dano: 80, tempo: '50ms', alcance: '1m', tipo: 'perfuração', desc: 'Rasga armadura leve' },
    ],
    comportamento: ['Ataca do ar sempre que possível', 'Prefere terreno aberto', 'Leva presas para ninho'],
    pontosFortes: ['Voo', 'Velocidade', 'Percepção', 'Ataque surpresa'],
    pontosFracos: ['Vulnerável no chão', 'Asas frágeis', 'Não luta bem em espaços fechados'],
    telegrafos: [{ sinal: 'Círculos no alto', ataque: 'Mergulho iminente', antecedencia: '2000ms' }],
    taticasDerrota: [
      { nome: 'Forçar ao Chão', desc: 'Redes, boleadeiras em asas', efetividade: 90, requer: 'Arremesso' },
      { nome: 'Cobertura', desc: 'Árvores/teto impede mergulho', efetividade: 85, requer: 'Terreno' },
      { nome: 'Danificar Asas', desc: 'Asa ferida = não voa', efetividade: 95, requer: 'Acerto em asa' },
    ],
    conhecimentoSecreto: 'Após mergulho falho, SEMPRE ganha altitude para tentar novamente. Esse momento de subida = mais lento e vulnerável.',
  },

  elefanteDeGuerra: {
    nome: 'Elefante de Guerra', altura: 3.5, hp: 800, forca: 300, velocidade: 45, agilidade: 25, resistencia: 180, percepcao: 50, inteligencia: 55,
    descricao: 'Usado desde a Índia antiga até as Guerras Púnicas. Arma psicológica devastadora e plataforma móvel de combate. O mahout (condutor) na nuca é o ponto fraco crítico - sem ele, o elefante torna-se incontrolável e pode pisotear as próprias forças.',
    armadura: {
      corpo: { c: 60, p: 30, co: 80, nome: 'Pele grossa (5cm)' },
      cabeca: { c: 80, p: 40, co: 100, nome: 'Crânio extremamente reforçado' },
      pernas: { c: 30, p: 15, co: 40, nome: 'Tendões expostos - PONTO FRACO' },
      tromba: { c: 10, p: 5, co: 10, nome: 'EXTREMAMENTE sensível' },
      flancos: { c: 40, p: 20, co: 50, nome: 'Frequentemente desprotegidos' },
      orelhas: { c: 15, p: 8, co: 15, nome: 'Finas e vulneráveis' },
    },
    ataques: [
      { nome: 'Pisotear', dano: 250, tempo: '150ms', alcance: '3m', tipo: 'contusão', desc: 'MORTE QUASE CERTA. Esmaga completamente qualquer armadura.' },
      { nome: 'Golpe de Tromba', dano: 120, tempo: '80ms', alcance: '4m', tipo: 'contusão', desc: 'Arremessa alvo 5-8m. Pode quebrar formações.' },
      { nome: 'Investida', dano: 300, tempo: '—', alcance: '15m', tipo: 'contusão', desc: 'Carga devastadora em linha reta. Ignora formações não preparadas.' },
      { nome: 'Chifrada (presas)', dano: 150, tempo: '100ms', alcance: '2m', tipo: 'perfuração', desc: 'Empala e levanta vítima. Pode atirar corpo.' },
      { nome: 'Agarrar com Tromba', dano: 80, tempo: '120ms', alcance: '4m', tipo: 'contusão', desc: 'Pode esmagar lentamente ou arremessar contra o chão.' },
      { nome: 'Ataque de Mahout', dano: 70, tempo: '50ms', alcance: '3m', tipo: 'variado', desc: 'Arqueiro/lanceiro no howdah ataca de posição elevada.' },
    ],
    comportamento: [
      'Segue comandos do mahout fielmente',
      'Entra em PÂNICO com fogo ou barulho intenso',
      'Pânico = PISOTEIA PRÓPRIOS ALIADOS',
      'Protege filhotes com ferocidade extrema',
      'Memória excepcional - lembra inimigos por anos',
      'Elefantes mal treinados são perigosos para ambos os lados',
      'Forma laços fortes com mahout específico',
    ],
    pontosFortes: [
      'Tamanho intimidador - cavalos entram em pânico',
      'Pele como armadura (5cm) - DR significativo',
      'Plataforma de combate (howdah) para 2-4 arqueiros',
      'Carga devastadora - ignora formações não preparadas',
      'Força brutal - derruba portões e muros fracos',
      'Continua lutando mesmo com ferimentos graves',
    ],
    pontosFracos: [
      'Mahout = prioridade máxima, sem ele perde controle',
      'Tromba extremamente sensível - dano causa pânico',
      'Articulações das pernas - hamstringing = colapso',
      'Vulnerável a pânico (fogo, barulho, porcos)',
      'Flancos frequentemente sem proteção',
      'Não consegue pular - fossos são intransponíveis',
    ],
    telegrafos: [
      { sinal: 'Levanta pata dianteira alta', ataque: 'Pisotear', antecedencia: '500ms' },
      { sinal: 'Balança tromba para trás', ataque: 'Golpe de tromba', antecedencia: '300ms' },
      { sinal: 'Abaixa cabeça, bufa alto, bate pata', ataque: 'Investida', antecedencia: '800ms' },
      { sinal: 'Orelhas abertas, trombeta', ataque: 'Carga agressiva', antecedencia: '600ms' },
      { sinal: 'Encolhe tromba, recua cabeça', ataque: 'Chifrada', antecedencia: '400ms' },
    ],
    taticasDerrota: [
      { nome: 'Matar o Mahout', desc: 'Sem condutor, elefante incontrolável. Mahouts carregam espigões para matar o próprio elefante se entrar em fúria - matar mahout primeiro impede esse procedimento.', efetividade: 95, requer: 'Arremesso preciso, flecha ou dardo' },
      { nome: 'Cortar Tendões (Hamstringing)', desc: 'Deslizar atrás e cortar tendões das patas traseiras. Colapso imediato. Tática de velites romanos.', efetividade: 90, requer: 'Aproximação por trás, lâmina afiada' },
      { nome: 'Corredores na Formação (Zama)', desc: 'Manípulos com corredores entre unidades. Velites escondem brechas. Elefantes canalizados ATRAVÉS da formação sem contato.', efetividade: 85, requer: 'Formação disciplinada, coordenação' },
      { nome: 'Guerra Psicológica', desc: 'Trombetas + tambores + gritos coordenados. Elefantes mal treinados entram em pânico e PISOTEIAM as próprias forças.', efetividade: 75, requer: 'Instrumentos, coordenação' },
      { nome: 'Atacar a Tromba', desc: 'Foices em hastes longas para cortar ou ferir a tromba. Causa pânico imediato e incontrolável. Usada por chineses.', efetividade: 80, requer: 'Arma de haste com gancho/foice' },
      { nome: 'Fogo e Porcos', desc: 'Elefantes temem guincho de porcos. Porcos untados com óleo e incendiados corriam guinchando causando terror absoluto.', efetividade: 70, requer: 'Fogo, porcos (método extremo)' },
      { nome: 'Sarissas Macedônicas', desc: 'Lanças de 4-6.5m repelem elefantes. Afrouxar fileiras para deixar passar, depois atacar com dardos.', efetividade: 80, requer: 'Piques longos, formação falange' },
    ],
    conhecimentoSecreto: 'Mahouts carregam espigão de metal e martelo para matar o próprio elefante perfurando o cérebro através do crânio fino ATRÁS DAS ORELHAS se entrar em fúria. MATAR O MAHOUT PRIMEIRO significa que não há ninguém para executar esse procedimento de emergência, e o elefante em pânico DEVASTARÁ as próprias forças que o trouxeram.',
  },
};

// TÁTICAS HISTÓRICAS
const TATICAS_HISTORICAS = {
  zama: {
    titulo: 'Batalha de Zama (202 a.C.) - Anti-Elefante',
    citacao: 'Cipião derrotou os elefantes de Aníbal com três táticas: corredores na formação, guerra psicológica e alvos específicos.',
    taticas: [
      { nome: 'Corredores na Formação', desc: 'Manípulos com amplos corredores entre unidades. Velites escondiam brechas. Elefantes canalizados através sem contato.', mecanica: 'Se formação mantiver disciplina, carga passa sem dano' },
      { nome: 'Guerra Psicológica', desc: 'Trombeteiros + tambores + gritos. Elefantes mal treinados entraram em pânico e pisotearam próprias forças.', mecanica: 'Barulho coordenado pode causar pânico (teste moral)' },
      { nome: 'Alvejar Condutores (Mahouts)', desc: 'Velites arremessavam dardos nos mahouts. Sem condutor, elefante incontrolável. Mahouts carregavam espigões para matar próprios elefantes.', mecanica: 'Matar condutor = criatura descontrolada' },
    ],
  },
  bannockburn: {
    titulo: 'Batalha de Bannockburn (1314) - Anti-Cavalaria',
    citacao: 'Robert Bruce escolheu terreno pantanoso e cavou fossas ocultas com espigões nas rotas de aproximação.',
    taticas: [
      { nome: 'Schiltron Escocês', desc: 'Formação circular/retangular de lanceiros. Lanças de 3.6m. Bruce inovou com versão que podia avançar.', mecanica: 'Schiltron mantido = cavalaria não pode carregar' },
      { nome: 'Preparação do Terreno', desc: 'Fossos ocultos com estacas, terreno pantanoso deliberado. Cavalaria afundava enquanto infantaria leve se movia.', mecanica: 'Criaturas pesadas: penalidade dobrada em terreno difícil' },
    ],
  },
  piqueSuico: {
    titulo: 'Pique Suíço (Gevierthaufen)',
    citacao: 'As primeiras 5 fileiras de pontas projetavam-se além da frente - 5 pontas ameaçavam cada inimigo simultaneamente.',
    dados: [
      { item: 'Comprimento', valor: '4.3-5.5m (14-18 pés)' },
      { item: 'Fileiras efetivas', valor: '4-5 fileiras' },
      { item: 'Formação Igel', valor: '360° (porco-espinho)' },
      { item: 'Contra carga', valor: 'Automático - cavalaria não carrega' },
    ],
    principio: 'Cavalos recusam-se instintivamente a se empalar. A carga era "jogo de galinha" - se infantaria mantiver formação, carga falha.',
  },
  tourada: {
    titulo: 'Tourada Espanhola - Sistema de Enfraquecimento',
    estagios: [
      { nome: 'Tercio de Varas (1)', desc: 'Picadores montados ferem o morrillo (músculo do pescoço). Enfraquece, causa sangramento, força cabeça baixa.' },
      { nome: 'Banderillas (2)', desc: 'Banderilheiros plantam dardos farpados (70cm) nos ombros. Enfraquece ainda mais, cabeça mais baixa.' },
      { nome: 'Muerte (3)', desc: 'Matador executa estocada única entre omoplatas, visando aorta. Só possível com cabeça abaixada.' },
    ],
    aplicacao: 'Sistema de condições acumuladas - dano em região específica reduz capacidade progressivamente. Ideal contra Minotauros.',
  },
  hamstringing: {
    titulo: 'Hamstringing - Tática Romana',
    citacao: 'Cartagineses cortavam tendões de inimigos em retirada, retornavam depois para eliminar os aleijados.',
    tendoes: [
      { nome: 'Aquiles', local: 'Atrás do tornozelo', efeito: 'Perna colapsa, sem propulsão' },
      { nome: 'Isquiotibiais', local: 'Posterior da coxa', efeito: 'Não dobra joelho, não corre' },
      { nome: 'Flexor (cavalos)', local: 'Frente da perna traseira', efeito: 'Anda mas não galopa' },
    ],
    mecanica: 'Tendão seccionado = membro inutilizado permanentemente. Criatura grande com tendão cortado = queda.',
  },
};

// GUARDA E MOVIMENTO
const GUARDA_MOVIMENTO = {
  guardas: [
    { nome: 'Vom Tag (Do Telhado)', tipo: 'Alta', desc: 'Espada sobre a cabeça/ombro. Ameaça cortes descendentes poderosos.', vantagem: '+20% dano em ataques descendentes', desvantagem: 'Expõe tronco, -10% defesa lateral', contra: 'Ataques rápidos ao tronco' },
    { nome: 'Pflug (Arado)', tipo: 'Média', desc: 'Ponta da espada apontando para garganta do oponente, lâmina inclinada.', vantagem: '+15% acerto em estocadas, ameaça constante', desvantagem: 'Menos opções de corte', contra: 'Golpes descendentes fortes' },
    { nome: 'Alber (Tolo)', tipo: 'Baixa', desc: 'Espada apontando para o chão, aparentemente vulnerável. Convida ataques.', vantagem: '+25% contra-ataque se inimigo atacar primeiro', desvantagem: '-15% iniciativa', contra: 'Oponentes pacientes que não atacam' },
    { nome: 'Ochs (Boi)', tipo: 'Alta-Lateral', desc: 'Espada ao lado da cabeça, ponta ameaçando rosto do oponente.', vantagem: '+20% defesa alta, transição rápida para estocada', desvantagem: 'Vulnerável a ataques baixos', contra: 'Cortes às pernas' },
    { nome: 'Nebenhut (Guarda Lateral)', tipo: 'Baixa-Lateral', desc: 'Espada ao lado do corpo, ponta para trás/baixo.', vantagem: '+15% em varreduras horizontais', desvantagem: '-10% defesa frontal', contra: 'Estocadas diretas' },
    { nome: 'Posta di Donna (Guarda da Mulher)', tipo: 'Alta-Traseira', desc: 'Espada sobre ombro traseiro, preparada para corte poderoso.', vantagem: '+25% dano no primeiro ataque', desvantagem: 'Telegrafado, -20% velocidade inicial', contra: 'Ataques rápidos antes do golpe' },
  ],
  movimento: [
    { nome: 'Passing Step (Passo Passante)', desc: 'Pé traseiro passa à frente, avança com força.', uso: 'Avançar com ataque, ganhar alcance', bonus: '+10% dano em avanço, +0.5m alcance' },
    { nome: 'Gathering Step (Passo Reunido)', desc: 'Pé traseiro junta ao dianteiro, depois dianteiro avança.', uso: 'Avanço controlado, manter equilíbrio', bonus: '+10% defesa durante movimento' },
    { nome: 'Volta Stabile (Giro Estável)', desc: 'Rotação no lugar, pé dianteiro como pivô.', uso: 'Mudar linha de ataque, evitar golpe linear', bonus: 'Evita ataques lineares, +15% contra-ataque lateral' },
    { nome: 'Mezza Volta (Meio Giro)', desc: 'Giro de 90°, reposiciona completamente.', uso: 'Sair da linha de ataque, flanquear', bonus: 'Sai da linha de ataque, posição de flanco' },
    { nome: 'Tutta Volta (Giro Completo)', desc: 'Rotação de 180°, inverte posição.', uso: 'Escapar de cerco, atacar quem está atrás', bonus: 'Troca frente/trás, surpreende atacantes traseiros' },
    { nome: 'Esquiva Lateral', desc: 'Passo lateral mantendo guarda.', uso: 'Evitar carga, sair de linha reta', bonus: 'Evita cargas lineares, +20% contra investidas' },
    { nome: 'Recuo Angular', desc: 'Passo para trás em diagonal.', uso: 'Abrir distância mantendo ângulo de ataque', bonus: '+0.5m distância, mantém opção ofensiva' },
  ],
  posicionamento: [
    { situacao: 'Flanco (90°)', bonus: '+25% acerto', desc: 'Oponente não consegue usar escudo' },
    { situacao: 'Retaguarda', bonus: '+50% acerto', desc: 'Oponente não vê ataque chegando' },
    { situacao: 'Terreno elevado', bonus: '+15% dano descendente', desc: 'Gravidade auxilia golpes' },
    { situacao: 'Terreno rebaixado', bonus: '-15% defesa', desc: 'Dificuldade de bloqueio' },
    { situacao: 'Costas na parede', bonus: '+20% defesa frontal, sem recuo', desc: 'Não pode ser flanqueado por trás' },
    { situacao: 'Espaço aberto', bonus: 'Mobilidade total', desc: 'Todas as opções de movimento disponíveis' },
  ],
  distancia: [
    { nome: 'Fora de Medida', distancia: '>2m', desc: 'Nenhum pode atingir sem avançar', tatica: 'Preparar, observar, planejar' },
    { nome: 'Misura Larga (Medida Larga)', distancia: '1.5-2m', desc: 'Um passo + ataque alcança', tatica: 'Zona de provocação, feints efetivos' },
    { nome: 'Misura Stretta (Medida Estreita)', distancia: '0.8-1.5m', desc: 'Ataque direto possível', tatica: 'Zona de combate ativo, reações rápidas' },
    { nome: 'Corpo a Corpo', distancia: '<0.8m', desc: 'Grappling, pommel strikes, desarmes', tatica: 'Armas longas ineficazes, luta corpo-a-corpo' },
  ],
  contraCriaturas: [
    { situacao: 'Vs Criatura Grande (2-4m)', tatica: 'Manter-se em Misura Stretta das PERNAS. Evitar linha central. Movimentação circular constante.' },
    { situacao: 'Vs Criatura Enorme (4-8m)', tatica: 'Ficar ENTRE as pernas (ponto cego). Não ficar na frente. Atacar tendões e subir.' },
    { situacao: 'Vs Criatura Colossal (8m+)', tatica: 'Impossível combater no alcance deles. Escalar ou atacar à distância. Trabalho em equipe essencial.' },
    { situacao: 'Vs Quadrúpede Rápido', tatica: 'Nunca correr em linha reta. Movimentação em zigue-zague. Forçar para terreno difícil.' },
    { situacao: 'Vs Voador', tatica: 'Buscar cobertura. Forçar ao chão (redes, boleadeiras). Atacar no momento de pouso/decolagem.' },
  ],
};

// ANATOMIA
const ANATOMIA = {
  tendoes: [
    { nome: 'Aquiles', local: 'Atrás do tornozelo', efeito: 'Perda completa de propulsão', recuperacao: 'Permanente sem magia' },
    { nome: 'Isquiotibiais', local: 'Posterior da coxa', efeito: 'Não dobra joelho, não corre', recuperacao: 'Permanente' },
    { nome: 'Quadríceps', local: 'Frente da coxa', efeito: 'Não estende perna', recuperacao: 'Permanente' },
  ],
  arterias: [
    { nome: 'Carótida/Jugular', local: 'Pescoço lateral', tempo: 'Segundos', protecao: 'Gorjal' },
    { nome: 'Aorta', local: 'Centro do peito', tempo: '~30 segundos', protecao: 'Placas' },
    { nome: 'Femoral', local: 'Virilha/coxa interna', tempo: '1-2 minutos', protecao: 'Gap' },
    { nome: 'Axilar', local: 'Axila', tempo: '2-3 minutos', protecao: 'Gap' },
    { nome: 'Poplítea', local: 'Atrás do joelho', tempo: '2-3 minutos', protecao: 'Gap' },
  ],
  gaps: [
    { gap: 'Axila', arteria: 'Axilar', penalidade: '-40%' },
    { gap: 'Coxa interna', arteria: 'Femoral', penalidade: '-40%' },
    { gap: 'Atrás do joelho', arteria: 'Poplítea', penalidade: '-35%' },
    { gap: 'Cotovelo interno', arteria: 'Braquial', penalidade: '-35%' },
    { gap: 'Pescoço', arteria: 'Carótida', penalidade: '-30%' },
  ],
};

// ARMAS ESPECIAIS
const ARMAS_ESPECIAIS = {
  lancaComTrava: {
    nome: 'Lança com Trava (Javali/Urso)',
    razao: 'Animais feridos sobem pelo eixo da lança para alcançar o caçador. Cruzeta impede isso.',
    citacao: 'Segure o eixo no meio, não perto da cabeça. Uma vez atingido, apoie a lança contra o javali. - Gaston Phoebus, Livre de Chasse',
    tipos: [
      { nome: 'Lança de Javali', desc: 'Lâmina larga em folha, "asas" atrás da lâmina, curta e pesada', dano: 90, alcance: '2m' },
      { nome: 'Lança de Urso (Rogatina)', desc: 'Lâmina muito larga, cruzeta sólida, eixo reforçado', dano: 100, alcance: '2.5m' },
    ],
    mecanica: 'Se acertar, criatura não avança pela lança. Tipo javali/minotauro fica presa até morrer ou lança quebrar.',
  },
  boleadeiras: {
    nome: 'Boleadeiras',
    desc: 'Desenvolvida pelos povos das Pampas. 2-3 cordas de couro com pedras nas pontas.',
    tipos: [
      { nome: 'Bola Perdida', cordas: 1, uso: 'Pássaros', efeito: 'Atordoamento' },
      { nome: 'Ñanducera', cordas: 2, uso: 'Animais médios', efeito: 'Emaranha pernas' },
      { nome: 'Boleadeiras', cordas: 3, uso: 'Cavalos, gado grande', efeito: 'Derruba e imobiliza' },
    ],
    mecanica: 'Teste de arremesso. Sucesso = pernas emaranhadas, queda automática para quadrúpedes. Centauros muito vulneráveis.',
    historico: 'Incas usaram contra cavalaria espanhola, forçando conquistadores a lutar desmontados.',
  },
};

// TERRENO
const TERRENO = {
  modificadores: [
    { terreno: 'Plano/Estrada', velocidade: '×1.0', efeito: 'Nenhum' },
    { terreno: 'Grama Alta', velocidade: '×0.9', efeito: 'Esconde armadilhas' },
    { terreno: 'Floresta Leve', velocidade: '×0.8', efeito: 'Cobertura parcial' },
    { terreno: 'Floresta Densa', velocidade: '×0.6', efeito: 'Nega formações grandes' },
    { terreno: 'Lama', velocidade: '×0.5', efeito: 'Criaturas pesadas ×0.3' },
    { terreno: 'Pedras/Escombros', velocidade: '×0.7', efeito: 'Risco de queda' },
  ],
  exemplosHistoricos: [
    { batalha: 'Termópilas (480 a.C.)', desc: 'Passagem estreita neutralizou superioridade numérica persa' },
    { batalha: 'Agincourt (1415)', desc: 'Lama + funil entre bosques. 400 ingleses vs 6.000 franceses' },
    { batalha: 'Morgarten (1315)', desc: '1.000 fazendeiros suíços vs 3.000+ austríacos em vale estreito' },
  ],
  penalidades: [
    { tamanho: 'Grande (2-3m)', espacoMin: '3m', penalidade: '-25% defesa, sem armas longas' },
    { tamanho: 'Enorme (3-5m)', espacoMin: '5m', penalidade: '-40% defesa, ataques limitados' },
    { tamanho: 'Gigantesco (5-10m)', espacoMin: '8m', penalidade: '-60% defesa, quase indefeso' },
  ],
};

// HEMA
const HEMA = {
  principios: [
    'Zogho Largo (jogo amplo): Manter alcance máximo',
    'Zogho Stretto (jogo estreito): Colapsar distância para grappling',
    'Contra maiores: NÃO lute no alcance deles, mova-se em ângulos',
    'Alvo extremidades primeiro para reduzir capacidade',
    'Movimentação explosiva para fechar/abrir distância',
  ],
  alvosVulneraveis: ['Olhos', 'Orelhas', 'Nariz', 'Garganta', 'Clavícula', 'Plexo solar', 'Virilha', 'Joelhos'],
  seteElementos: ['Força', 'Velocidade', 'Agarramentos', 'Quebras', 'Amarrações', 'Golpes', 'Ferimentos'],
  meisterhau: [
    { nome: 'Zornhau (Golpe da Ira)', tempo: '56ms', dano: '×2.0', req: 60, desc: 'Corte diagonal de Vom Tag' },
    { nome: 'Zwerchhau (Transversal)', tempo: '54ms', dano: '×1.6', req: 65, desc: 'Corte horizontal com passo' },
    { nome: 'Schielhau (Vesgo)', tempo: '51ms', dano: '×1.4', req: 70, desc: 'Corte com feint integrado' },
    { nome: 'Krumphau (Torto)', tempo: '58ms', dano: '×1.5', req: 75, desc: 'Ataque às mãos' },
    { nome: 'Scheitelhau (Coroa)', tempo: '60ms', dano: '×1.8', req: 80, desc: 'Corte vertical descendente' },
  ],
  antiArmadura: [
    { nome: 'Half-Swording', desc: 'Segurar lâmina para estocar gaps. +20% acerto em gaps.', req: 70 },
    { nome: 'Mordhau', desc: 'Inverter espada, golpear com pomo. Dano contundente ×1.8.', req: 65 },
    { nome: 'Ringen am Schwert', desc: 'Grappling com espada. Ignora armadura.', req: 75 },
  ],
};

// CONHECIMENTO
const CONHECIMENTO = {
  niveis: [
    { nivel: 0, nome: 'Desconhecido', mod: '-20% tudo', info: 'Nada' },
    { nivel: 1, nome: 'Ouviu Falar', mod: '-10% tudo', info: 'Aparência geral' },
    { nivel: 2, nome: 'Estudou', mod: '±0%', info: 'Ataques principais, comportamento básico' },
    { nivel: 3, nome: 'Observou', mod: '+10% defesa', info: 'Todos ataques, telegrafos óbvios' },
    { nivel: 4, nome: 'Combateu', mod: '+15% tudo', info: 'Pontos fracos, táticas efetivas' },
    { nivel: 5, nome: 'Especialista', mod: '+25% tudo', info: 'Conhecimento secreto' },
  ],
  deducao: [
    { atributo: 'Percepção 40+', info: 'Postura, agressividade' },
    { atributo: 'Percepção 60+', info: 'Telegrafos óbvios' },
    { atributo: 'Percepção 80+', info: 'Padrões de movimento' },
    { atributo: 'Inteligência 40+', info: 'Tipo de criatura, dieta' },
    { atributo: 'Inteligência 60+', info: 'Pontos fracos óbvios' },
    { atributo: 'Inteligência 80+', info: 'Deduzir comportamento por anatomia' },
  ],
  aprendizado: [
    { evento: 'Receber ataque específico', ganho: '+5% esquiva contra ele' },
    { evento: 'Esquivar com sucesso', ganho: '+10% vs próximo igual' },
    { evento: 'Acertar ponto fraco', ganho: '+15% dano futuro ali' },
    { evento: 'Ver aliado morrer', ganho: '+10% cuidado' },
    { evento: 'Observar 3+ turnos', ganho: '+10% geral' },
  ],
};
// ==================== COMPONENTE PRINCIPAL ====================

const SistemaCombateCompleto = () => {
  const [activeTab, setActiveTab] = useState('fundamentos');
  const [criaturaSel, setCriaturaSel] = useState('centauro');
  const [guardasTrad, setGuardasTrad] = useState('alema');

  const tabs = [
    { id: 'fundamentos', label: '📊 Fundamentos' },
    { id: 'tempo', label: '⏱️ Tempo/Margem' },
    { id: 'armaduras', label: '🛡️ Armaduras/DR' },
    { id: 'guardas', label: '🥋 Guardas' },
    { id: 'armas', label: '⚔️ Armas' },
    { id: 'tecnicas', label: '🗡️ Técnicas' },
    { id: 'criaturas', label: '👹 Criaturas' },
    { id: 'formacoesCombate', label: '🏛️ Formações' },
    { id: 'taticas', label: '📜 Táticas' },
    { id: 'conhecimento', label: '🧠 Conhecimento' },
    { id: 'formacoes', label: '🤺 Movimento' },
    { id: 'anatomia', label: '🩺 Anatomia' },
    { id: 'hema', label: '⚔️ HEMA' },
    { id: 'armasEsp', label: '🎯 Armas Esp.' },
    { id: 'terreno', label: '🏔️ Terreno' },
    { id: 'escalada', label: '🧗 Escalada' },
    { id: 'altura', label: '📏 Altura' },
    { id: 'criador', label: '🔧 Criador' },
  ];

  // Componentes UI
  const Card = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow p-3 mb-3 ${className}`}>
      {title && <h3 className="font-bold text-md mb-2 border-b pb-1">{title}</h3>}
      {children}
    </div>
  );

  const InfoBox = ({ type = 'info', children }) => {
    const colors = { info: 'bg-blue-50 border-blue-500', warning: 'bg-amber-50 border-amber-500', danger: 'bg-red-50 border-red-500', success: 'bg-green-50 border-green-500', purple: 'bg-purple-50 border-purple-500' };
    return <div className={`border-l-4 p-2 rounded mb-3 text-sm ${colors[type]}`}>{children}</div>;
  };

  const Table = ({ headers, rows }) => (
    <div className="overflow-x-auto text-xs">
      <table className="w-full">
        <thead className="bg-gray-700 text-white">
          <tr>{headers.map((h, i) => <th key={i} className="p-1 text-left">{h}</th>)}</tr>
        </thead>
        <tbody>{rows.map((row, i) => <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>{row.map((cell, j) => <td key={j} className="p-1 border-b">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

  const Quote = ({ text, source }) => (
    <div className="bg-gray-100 border-l-4 border-gray-400 p-2 my-2 italic text-sm">
      <p>"{text}"</p>
      {source && <p className="text-xs text-gray-600">— {source}</p>}
    </div>
  );

  // TAB: CRIATURAS
  const TabCriaturas = () => {
    const c = CRIATURAS[criaturaSel];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1 mb-2">
          {Object.keys(CRIATURAS).map(k => (
            <button key={k} onClick={() => setCriaturaSel(k)} className={`px-2 py-1 rounded text-xs ${criaturaSel === k ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}>
              {CRIATURAS[k].nome}
            </button>
          ))}
        </div>

        <Card>
          <div className="flex justify-between items-start">
            <div><h2 className="text-xl font-bold">{c.nome}</h2><p className="text-gray-600 text-xs">{c.descricao}</p></div>
            <span className="bg-red-100 px-2 py-1 rounded text-red-800 font-bold text-sm">{c.altura}m</span>
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {[{ k: 'HP', v: c.hp }, { k: 'FOR', v: c.forca }, { k: 'VEL', v: c.velocidade }, { k: 'AGI', v: c.agilidade }, { k: 'RES', v: c.resistencia }, { k: 'PER', v: c.percepcao }, { k: 'INT', v: c.inteligencia }].map((a, i) => (
              <div key={i} className="bg-gray-100 p-1 rounded text-center"><p className="text-xs">{a.k}</p><p className="font-bold text-sm">{a.v}</p></div>
            ))}
          </div>
        </Card>

        <Card title="⚔️ Ataques">
          <div className="space-y-1">
            {c.ataques.map((a, i) => (
              <div key={i} className="bg-red-50 p-2 rounded border-l-2 border-red-500">
                <div className="flex justify-between"><span className="font-semibold text-xs">{a.nome}</span><span className="text-red-600 font-bold text-xs">{a.dano}</span></div>
                <p className="text-xs text-gray-600">{a.desc}</p>
                <div className="flex gap-2 text-xs mt-1"><span>⏱️{a.tempo}</span><span>📏{a.alcance}</span></div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card title="✓ Fortes">
            <ul className="text-xs space-y-1">{c.pontosFortes.map((p, i) => <li key={i} className="flex gap-1"><span className="text-green-600">✓</span>{p}</li>)}</ul>
          </Card>
          <Card title="✗ Fracos">
            <ul className="text-xs space-y-1">{c.pontosFracos.map((p, i) => <li key={i} className="flex gap-1"><span className="text-red-600">✗</span>{p}</li>)}</ul>
          </Card>
        </div>

        <Card title="👁️ Telegrafos">
          <Table headers={['Sinal', 'Ataque', 'Tempo']} rows={c.telegrafos.map(t => [t.sinal, t.ataque, t.antecedencia])} />
        </Card>

        <Card title="🎯 Táticas de Derrota">
          <div className="space-y-1">
            {c.taticasDerrota.map((t, i) => (
              <div key={i} className="bg-green-50 p-2 rounded border-l-2 border-green-500">
                <div className="flex justify-between"><span className="font-semibold text-xs">{t.nome}</span><span className="bg-green-200 px-1 rounded text-xs">{t.efetividade}%</span></div>
                <p className="text-xs">{t.desc}</p>
                <p className="text-xs text-gray-500">Requer: {t.requer}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="🔒 Conhecimento Secreto (Nível 5)">
          <div className="bg-purple-100 p-2 rounded border border-purple-400"><p className="text-xs italic">{c.conhecimentoSecreto}</p></div>
        </Card>

        <Card title="🧠 Comportamento">
          <ul className="text-xs space-y-1">{c.comportamento.map((b, i) => <li key={i}>• {b}</li>)}</ul>
        </Card>

        <Card title="🛡️ Armadura (C/P/Co)">
          <div className="grid grid-cols-3 gap-1">
            {Object.entries(c.armadura).map(([k, v]) => (
              <div key={k} className="bg-gray-100 p-1 rounded text-center"><p className="text-xs font-semibold">{v.nome}</p><p className="font-mono text-xs">{v.c}/{v.p}/{v.co}</p></div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  // TAB: TÁTICAS HISTÓRICAS
  const TabTaticas = () => (
    <div className="space-y-3">
      <InfoBox type="info"><strong>Base Histórica:</strong> Todas táticas documentadas em batalhas reais.</InfoBox>
      
      {Object.values(TATICAS_HISTORICAS).map((t, i) => (
        <Card key={i} title={t.titulo}>
          {t.citacao && <Quote text={t.citacao} />}
          {t.taticas && t.taticas.map((tac, j) => (
            <div key={j} className="bg-blue-50 p-2 rounded mb-2">
              <h4 className="font-semibold text-sm">{tac.nome}</h4>
              <p className="text-xs">{tac.desc}</p>
              {tac.mecanica && <p className="text-xs text-green-700 mt-1"><strong>Mecânica:</strong> {tac.mecanica}</p>}
            </div>
          ))}
          {t.dados && <Table headers={['Item', 'Valor']} rows={t.dados.map(d => [d.item, d.valor])} />}
          {t.principio && <p className="text-xs mt-2 italic">{t.principio}</p>}
          {t.estagios && t.estagios.map((e, j) => (
            <div key={j} className="bg-red-50 p-2 rounded mb-1 border-l-2 border-red-400">
              <h4 className="font-semibold text-xs">{e.nome}</h4>
              <p className="text-xs">{e.desc}</p>
            </div>
          ))}
          {t.aplicacao && <p className="text-xs mt-2 text-purple-700"><strong>Aplicação:</strong> {t.aplicacao}</p>}
          {t.tendoes && <Table headers={['Tendão', 'Local', 'Efeito']} rows={t.tendoes.map(td => [td.nome, td.local, td.efeito])} />}
          {t.mecanica && <p className="text-xs mt-2 text-green-700"><strong>Mecânica:</strong> {t.mecanica}</p>}
        </Card>
      ))}
    </div>
  );

  // TAB: CONHECIMENTO
  const TabConhecimento = () => (
    <div className="space-y-3">
      <InfoBox type="info"><strong>Sistema de Conhecimento:</strong> Quanto mais sabe, maior a vantagem.</InfoBox>
      
      <Card title="Níveis de Conhecimento">
        <Table headers={['Nível', 'Nome', 'Modificador', 'Informação']} rows={CONHECIMENTO.niveis.map(n => [n.nivel, n.nome, n.mod, n.info])} />
      </Card>

      <Card title="Dedução por Atributos">
        <Table headers={['Atributo', 'Informação Deduzida']} rows={CONHECIMENTO.deducao.map(d => [d.atributo, d.info])} />
        <Quote text="As patas dianteiras são finas, as traseiras musculosas - é bípede parte do tempo. Pela forma, deve ser rápido. A barriga menos protegida..." source="Dedução de veterano (Int 70, Perc 65)" />
      </Card>

      <Card title="Aprendizado em Combate">
        <Table headers={['Evento', 'Conhecimento Ganho']} rows={CONHECIMENTO.aprendizado.map(a => [a.evento, a.ganho])} />
      </Card>

      <Card title="Enganos (Int 50+)">
        <InfoBox type="danger">Criaturas inteligentes podem fingir fraquezas!</InfoBox>
        <Table headers={['Engano', 'Detectar']} rows={[
          ['Fingir mancando', 'Perc vs Int'],
          ['Esconder arma', 'Perc 70+'],
          ['Parecer exausto', 'Int 60+'],
          ['Deixar flanco "aberto"', 'Int 70+'],
        ]} />
      </Card>
    </div>
  );

  // TAB: GUARDA E MOVIMENTO
  const TabFormacoes = () => (
    <div className="space-y-3">
      <InfoBox type="info"><strong>Combate Individual:</strong> Postura, guarda e movimento determinam suas opções em combate.</InfoBox>

      <Card title="Guardas (Posturas de Espada)">
        {GUARDA_MOVIMENTO.guardas.map((g, i) => (
          <div key={i} className="bg-blue-50 p-2 rounded mb-2 border-l-2 border-blue-500">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-xs">{g.nome}</h4>
              <span className="bg-blue-200 px-1 rounded text-xs">{g.tipo}</span>
            </div>
            <p className="text-xs text-gray-600">{g.desc}</p>
            <p className="text-xs text-green-700">✓ {g.vantagem}</p>
            <p className="text-xs text-red-600">✗ {g.desvantagem}</p>
            <p className="text-xs text-amber-700">Contra: {g.contra}</p>
          </div>
        ))}
      </Card>

      <Card title="Tipos de Movimento">
        {GUARDA_MOVIMENTO.movimento.map((m, i) => (
          <div key={i} className="bg-green-50 p-2 rounded mb-2 border-l-2 border-green-500">
            <h4 className="font-semibold text-xs">{m.nome}</h4>
            <p className="text-xs text-gray-600">{m.desc}</p>
            <p className="text-xs text-blue-700">Uso: {m.uso}</p>
            <p className="text-xs text-green-700">Bônus: {m.bonus}</p>
          </div>
        ))}
      </Card>

      <Card title="Distância de Combate (Misura)">
        <Table headers={['Zona', 'Distância', 'Descrição', 'Tática']} rows={GUARDA_MOVIMENTO.distancia.map(d => [d.nome, d.distancia, d.desc, d.tatica])} />
      </Card>

      <Card title="Bônus de Posicionamento">
        <Table headers={['Situação', 'Bônus', 'Descrição']} rows={GUARDA_MOVIMENTO.posicionamento.map(p => [p.situacao, p.bonus, p.desc])} />
      </Card>

      <Card title="Movimento vs Criaturas">
        {GUARDA_MOVIMENTO.contraCriaturas.map((c, i) => (
          <div key={i} className="bg-amber-50 p-2 rounded mb-2 border-l-2 border-amber-500">
            <h4 className="font-semibold text-xs">{c.situacao}</h4>
            <p className="text-xs">{c.tatica}</p>
          </div>
        ))}
      </Card>
    </div>
  );

  // TAB: ANATOMIA
  const TabAnatomia = () => (
    <div className="space-y-3">
      <InfoBox type="warning"><strong>Conhecimento Anatômico:</strong> Saber ONDE golpear é tão importante quanto COMO.</InfoBox>
      
      <Card title="Tendões - Corte = Imobilização">
        <Table headers={['Tendão', 'Local', 'Efeito', 'Recuperação']} rows={ANATOMIA.tendoes.map(t => [t.nome, t.local, t.efeito, t.recuperacao])} />
      </Card>

      <Card title="Artérias - Tempo de Sangramento">
        <Table headers={['Artéria', 'Local', 'Tempo', 'Proteção']} rows={ANATOMIA.arterias.map(a => [a.nome, a.local, a.tempo, a.protecao])} />
        <InfoBox type="danger"><strong>IMPORTANTE:</strong> Artérias são resistentes. Lâmina cega apenas empurra para o lado.</InfoBox>
      </Card>

      <Card title="Gaps de Armadura = Pontos Arteriais">
        <Table headers={['Gap', 'Artéria', 'Penalidade']} rows={ANATOMIA.gaps.map(g => [g.gap, g.arteria, g.penalidade])} />
      </Card>
    </div>
  );

  // TAB: HEMA
  const TabHEMA = () => (
    <div className="space-y-3">
      <Card title="Princípios de Combate (Fiore dei Liberi)">
        <ul className="text-xs space-y-1">{HEMA.principios.map((p, i) => <li key={i}>• {p}</li>)}</ul>
      </Card>

      <Card title="Alvos Vulneráveis">
        <div className="flex flex-wrap gap-1">{HEMA.alvosVulneraveis.map((a, i) => <span key={i} className="bg-red-100 px-2 py-1 rounded text-xs">{a}</span>)}</div>
      </Card>

      <Card title="Meisterhau (Golpes Mestres)">
        {HEMA.meisterhau.map((m, i) => (
          <div key={i} className="bg-amber-50 p-2 rounded mb-1 border-l-2 border-amber-500">
            <div className="flex justify-between"><span className="font-semibold text-xs">{m.nome}</span><span className="bg-amber-200 px-1 rounded text-xs">Hab {m.req}+</span></div>
            <p className="text-xs">{m.desc}</p>
            <p className="text-xs">⏱️{m.tempo} | 💥{m.dano}</p>
          </div>
        ))}
      </Card>

      <Card title="Técnicas Anti-Armadura">
        {HEMA.antiArmadura.map((a, i) => (
          <div key={i} className="bg-purple-50 p-2 rounded mb-1 border-l-2 border-purple-500">
            <div className="flex justify-between"><span className="font-semibold text-xs">{a.nome}</span><span className="bg-purple-200 px-1 rounded text-xs">Hab {a.req}+</span></div>
            <p className="text-xs">{a.desc}</p>
          </div>
        ))}
      </Card>
    </div>
  );

  // TAB: ARMAS ESPECIAIS
  const TabArmasEsp = () => (
    <div className="space-y-3">
      <Card title={ARMAS_ESPECIAIS.lancaComTrava.nome}>
        <p className="text-xs mb-2">{ARMAS_ESPECIAIS.lancaComTrava.razao}</p>
        <Quote text={ARMAS_ESPECIAIS.lancaComTrava.citacao} />
        {ARMAS_ESPECIAIS.lancaComTrava.tipos.map((t, i) => (
          <div key={i} className="bg-amber-50 p-2 rounded mb-1">
            <h4 className="font-semibold text-xs">{t.nome}</h4>
            <p className="text-xs">{t.desc}</p>
            <p className="text-xs">Dano: {t.dano} | Alcance: {t.alcance}</p>
          </div>
        ))}
        <p className="text-xs text-green-700 mt-2"><strong>Mecânica:</strong> {ARMAS_ESPECIAIS.lancaComTrava.mecanica}</p>
      </Card>

      <Card title={ARMAS_ESPECIAIS.boleadeiras.nome}>
        <p className="text-xs mb-2">{ARMAS_ESPECIAIS.boleadeiras.desc}</p>
        <Table headers={['Tipo', 'Cordas', 'Uso', 'Efeito']} rows={ARMAS_ESPECIAIS.boleadeiras.tipos.map(t => [t.nome, t.cordas, t.uso, t.efeito])} />
        <p className="text-xs text-green-700 mt-2"><strong>Mecânica:</strong> {ARMAS_ESPECIAIS.boleadeiras.mecanica}</p>
        <p className="text-xs text-purple-700"><strong>Histórico:</strong> {ARMAS_ESPECIAIS.boleadeiras.historico}</p>
      </Card>

      <Card title="Armas de Cerco">
        <Table headers={['Arma', 'Dano', 'Alcance', 'Recarga', 'Uso']} rows={[
          ['Besta Leve', '80', '80m', '8s', 'Combate individual'],
          ['Besta Pesada', '120', '120m', '15s', 'Anti-armadura'],
          ['Scorpion (2p)', '200', '200m', '45s', 'Anti-criatura grande'],
          ['Balista (4p)', '350', '300m', '60s', 'Anti-gigante'],
        ]} />
      </Card>
    </div>
  );

  // TAB: TERRENO
  const TabTerreno = () => (
    <div className="space-y-3">
      <InfoBox type="info"><strong>Terreno como Arma:</strong> Batalhas históricas mostram que terreno nega vantagens de tamanho.</InfoBox>

      <Card title="Exemplos Históricos">
        {TERRENO.exemplosHistoricos.map((e, i) => (
          <div key={i} className="bg-blue-50 p-2 rounded mb-1">
            <h4 className="font-semibold text-xs">{e.batalha}</h4>
            <p className="text-xs">{e.desc}</p>
          </div>
        ))}
      </Card>

      <Card title="Modificadores">
        <Table headers={['Terreno', 'Velocidade', 'Efeito']} rows={TERRENO.modificadores.map(m => [m.terreno, m.velocidade, m.efeito])} />
      </Card>

      <Card title="Penalidades em Espaços Confinados">
        <Table headers={['Tamanho', 'Espaço Mín', 'Penalidade']} rows={TERRENO.penalidades.map(p => [p.tamanho, p.espacoMin, p.penalidade])} />
      </Card>
    </div>
  );

  // TAB: ESCALADA
  const TabEscalada = () => (
    <div className="space-y-3">
      <InfoBox type="warning">Escalar criatura hostil é extremamente perigoso, mas pode ser única forma de atingir pontos vitais.</InfoBox>

      <Card title="Métodos Históricos (elefantes)">
        <ul className="text-xs space-y-1">
          <li>• <strong>Passo na Perna:</strong> Pisar pé → joelho → subir</li>
          <li>• <strong>Vantagem de Terreno:</strong> Usar elevação para montar</li>
          <li>• <strong>"Pezinho":</strong> Aliado impulsiona com mãos</li>
          <li>• <strong>Equipamento:</strong> Ganchos, cordas, grampos</li>
        </ul>
      </Card>

      <Card title="Fases da Escalada">
        <Table headers={['Fase', 'Descrição', 'Teste', 'Tempo']} rows={[
          ['1. Aproximação', 'Passar pela zona de ataque', 'Agi vs Perc', 'Variável'],
          ['2. Agarrar', 'Segurar em perna/armadura', 'For + Agi vs 50', '100-200ms'],
          ['3. Escalar', 'Subir pelo corpo', 'Agi -10%/m', '500ms/m'],
          ['4. Posicionar', 'Chegar ao ponto vital', 'Agi vs movimento', '200ms'],
          ['5. Atacar', 'Golpe no ponto vital', 'Normal + bônus', 'Normal'],
        ]} />
      </Card>

      <Card title="Modificadores">
        <Table headers={['Situação', 'Modificador']} rows={[
          ['Criatura parada', '+20% todas fases'],
          ['Criatura em movimento', '-20% todas fases'],
          ['Aliado distraindo', '+25% aproximação'],
          ['Gancho/corda', '+30% escalada'],
          ['"Pezinho"', '-50% tempo inicial'],
        ]} />
      </Card>

      <Card title="Reações por Inteligência">
        <Table headers={['Int', 'Reação']} rows={[
          ['Baixa (até 30)', 'Tenta sacudir. -20% escalador, mas previsível'],
          ['Média (31-60)', 'Tenta agarrar. Agi vs Força'],
          ['Alta (61+)', 'Pode se jogar no chão, rolar. PERIGOSO'],
        ]} />
      </Card>
    </div>
  );

  // TAB: ALTURA
  const TabAltura = () => {
    const [hAtk, setHAtk] = useState(1.8);
    const [hCri, setHCri] = useState(3.5);
    const [alcArma, setAlcArma] = useState(1.2);
    const alcTotal = hAtk + alcArma;
    const penCabeca = Math.max(0, Math.min(80, Math.round((hCri - alcTotal) * 30)));
    const penTronco = Math.max(0, Math.min(50, Math.round((hCri * 0.6 - alcTotal) * 20)));

    return (
      <div className="space-y-3">
        <InfoBox type="info">Criaturas altas têm cabeça protegida pela distância, mas pernas sempre vulneráveis.</InfoBox>

        <Card title="Calculadora de Alcance">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div><label className="block text-xs">Atacante: {hAtk}m</label><input type="range" min="1" max="2.5" step="0.1" value={hAtk} onChange={e => setHAtk(parseFloat(e.target.value))} className="w-full" /></div>
            <div><label className="block text-xs">Criatura: {hCri}m</label><input type="range" min="1" max="15" step="0.5" value={hCri} onChange={e => setHCri(parseFloat(e.target.value))} className="w-full" /></div>
            <div><label className="block text-xs">Arma: {alcArma}m</label><input type="range" min="0.3" max="6" step="0.1" value={alcArma} onChange={e => setAlcArma(parseFloat(e.target.value))} className="w-full" /></div>
          </div>
          <p className="text-xs mb-2">Alcance total: <strong>{alcTotal.toFixed(1)}m</strong></p>
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded text-center ${penCabeca > 0 ? 'bg-red-100' : 'bg-green-100'}`}><p className="text-xs">Cabeça</p><p className="font-bold text-sm">{penCabeca > 0 ? `-${penCabeca}%` : '✓'}</p></div>
            <div className={`p-2 rounded text-center ${penTronco > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}><p className="text-xs">Tronco</p><p className="font-bold text-sm">{penTronco > 0 ? `-${penTronco}%` : '✓'}</p></div>
            <div className="p-2 rounded text-center bg-green-100"><p className="text-xs">Pernas</p><p className="font-bold text-sm">✓ Sempre</p></div>
          </div>
        </Card>

        <Card title="Armas Recomendadas">
          <Table headers={['Altura', 'Arma', 'Alvo']} rows={[
            ['2-3m', 'Lança (2.5m)', 'Tronco, cabeça c/ salto'],
            ['3-5m', 'Alabarda', 'Barriga, coxas'],
            ['5-8m', 'Pique (4.5m+)', 'Pernas, tendões'],
            ['8m+', 'Balista / Escalada', 'Escalada para nuca'],
          ]} />
        </Card>
      </div>
    );
  };

  // TAB: CRIADOR
  const TabCriador = () => {
    const [criatura, setCriatura] = useState({ nome: '', altura: 2, hp: 100, forca: 50, velocidade: 50 });
    const [arma, setArma] = useState({ nome: '', tipo: 'corte', alcance: 1.0, peso: 1.0, tempo: 50 });
    
    const calcCategoria = () => criatura.altura <= 2 ? 'Médio' : criatura.altura <= 4 ? 'Grande' : criatura.altura <= 8 ? 'Enorme' : 'Colossal';
    const calcDano = () => Math.round(arma.peso * 40);
    
    return (
      <div className="space-y-3">
        <Card title="🦖 Criar Criatura">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><label>Nome</label><input type="text" value={criatura.nome} onChange={e => setCriatura({...criatura, nome: e.target.value})} className="w-full p-1 border rounded" /></div>
            <div><label>Altura: {criatura.altura}m</label><input type="range" min="0.5" max="15" step="0.5" value={criatura.altura} onChange={e => setCriatura({...criatura, altura: parseFloat(e.target.value)})} className="w-full" /></div>
            <div><label>HP: {criatura.hp}</label><input type="range" min="50" max="2000" step="50" value={criatura.hp} onChange={e => setCriatura({...criatura, hp: parseInt(e.target.value)})} className="w-full" /></div>
            <div><label>Força: {criatura.forca}</label><input type="range" min="10" max="500" value={criatura.forca} onChange={e => setCriatura({...criatura, forca: parseInt(e.target.value)})} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-blue-50 p-2 rounded text-center"><p className="text-xs">Categoria</p><p className="font-bold">{calcCategoria()}</p></div>
            <div className="bg-red-50 p-2 rounded text-center"><p className="text-xs">Mult Dano</p><p className="font-bold">×{(criatura.forca / 50).toFixed(1)}</p></div>
          </div>
        </Card>

        <Card title="⚔️ Criar Arma">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><label>Nome</label><input type="text" value={arma.nome} onChange={e => setArma({...arma, nome: e.target.value})} className="w-full p-1 border rounded" /></div>
            <div><label>Tipo</label><select value={arma.tipo} onChange={e => setArma({...arma, tipo: e.target.value})} className="w-full p-1 border rounded"><option value="corte">Corte</option><option value="perfuracao">Perfuração</option><option value="contusao">Contusão</option></select></div>
            <div><label>Alcance: {arma.alcance}m</label><input type="range" min="0.3" max="5" step="0.1" value={arma.alcance} onChange={e => setArma({...arma, alcance: parseFloat(e.target.value)})} className="w-full" /></div>
            <div><label>Peso: {arma.peso}kg</label><input type="range" min="0.3" max="10" step="0.1" value={arma.peso} onChange={e => setArma({...arma, peso: parseFloat(e.target.value)})} className="w-full" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-red-50 p-2 rounded text-center"><p className="text-xs">Dano</p><p className="font-bold">{calcDano()}</p></div>
            <div className="bg-green-50 p-2 rounded text-center"><p className="text-xs">Alcance</p><p className="font-bold">{arma.alcance}m</p></div>
            <div className="bg-amber-50 p-2 rounded text-center"><p className="text-xs">Tempo</p><p className="font-bold">{arma.tempo}ms</p></div>
          </div>
        </Card>
      </div>
    );
  };

  // TAB: FUNDAMENTOS (Atributos e Habilidade)
  const TabFundamentos = () => (
    <div className="space-y-3">
      <InfoBox type="info"><strong>Princípio Central:</strong> "Conhecimento é sobrevivência. Ignorância é morte." - Sem facilitação, dano determinístico, letalidade histórica real.</InfoBox>

      <Card title="📊 Atributos Base (Escala 0-100)">
        {Object.values(ATRIBUTOS).map((attr, i) => (
          <div key={i} className="bg-blue-50 p-2 rounded mb-2 border-l-2 border-blue-500">
            <h4 className="font-semibold text-sm">{attr.nome}</h4>
            <p className="text-xs text-gray-600">{attr.desc}</p>
            <p className="text-xs text-green-700 font-mono mt-1">{attr.formula}</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {attr.exemplos.map((ex, j) => (
                <span key={j} className="bg-white px-2 py-1 rounded text-xs">{ex.valor}: {ex.resultado}</span>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card title="🎯 Habilidade com Arma (0-100)">
        <Table headers={['Faixa', 'Nível', 'Treino', 'Técnicas']} rows={HABILIDADE_ARMA.niveis.map(n => [n.faixa, n.nome, n.treino, n.tecnicas])} />
        <p className="text-xs mt-2 font-mono text-green-700">{HABILIDADE_ARMA.multiplicador}</p>
      </Card>
    </div>
  );

  // TAB: TEMPO E MARGEM
  const TabTempo = () => (
    <div className="space-y-3">
      <InfoBox type="warning"><strong>NÃO HÁ TURNOS.</strong> Tempo medido em milissegundos (ms). Resultado depende da margem temporal entre ataque e defesa.</InfoBox>

      <Card title="⏱️ Tempos Base">
        <h4 className="font-semibold text-xs mb-1">Ataques</h4>
        <Table headers={['Ação', 'Tempo', 'Exaustão']} rows={TEMPOS_BASE.ataques.map(a => [a.nome, `${a.tempo}ms`, a.exaustao])} />
        <h4 className="font-semibold text-xs mb-1 mt-2">Defesas</h4>
        <Table headers={['Ação', 'Tempo', 'Exaustão']} rows={TEMPOS_BASE.defesas.map(d => [d.nome, `${d.tempo}ms`, d.exaustao])} />
        <h4 className="font-semibold text-xs mb-1 mt-2">Movimento</h4>
        <Table headers={['Ação', 'Tempo', 'Exaustão']} rows={TEMPOS_BASE.movimento.map(m => [m.nome, `${m.tempo}ms`, m.exaustao])} />
        <p className="text-xs mt-2 font-mono text-purple-700">{TEMPOS_BASE.formula}</p>
      </Card>

      <Card title="📐 Sistema de Margem">
        <p className="text-xs mb-2 font-mono text-blue-700">{SISTEMA_MARGEM.formula}</p>
        <h4 className="font-semibold text-xs mb-1">Defesa Mais Rápida que Ataque</h4>
        <Table headers={['Margem %', 'Efetividade Defesa', 'Dano que Passa']} rows={SISTEMA_MARGEM.defesaMaisRapida.map(m => [m.margem, m.efetividadeDefesa, m.danoQuePassa])} />
        <h4 className="font-semibold text-xs mb-1 mt-2">Ataque Mais Rápido que Defesa</h4>
        <Table headers={['Margem %', 'Dano Aplicado', 'Defesa Efetiva']} rows={SISTEMA_MARGEM.ataqueMaisRapido.map(m => [m.margem, m.danoAplicado, m.defesaEfetiva])} />
      </Card>

      <Card title="💥 Sistema de Dano">
        <p className="text-xs mb-2 font-mono text-red-700">{SISTEMA_DANO.formula}</p>
        <h4 className="font-semibold text-xs mb-1">Intensidades</h4>
        <div className="flex flex-wrap gap-2">
          {SISTEMA_DANO.intensidades.map((int, i) => (
            <span key={i} className="bg-red-100 px-2 py-1 rounded text-xs">{int.nome}: ×{int.mult}</span>
          ))}
        </div>
        <h4 className="font-semibold text-xs mb-1 mt-2">Tipos de Dano</h4>
        {SISTEMA_DANO.tiposDano.map((t, i) => (
          <div key={i} className="text-xs"><strong>{t.tipo}:</strong> {t.desc}</div>
        ))}
      </Card>

      <Card title="😰 Estados de Exaustão">
        <Table headers={['Exaustão', 'Estado', 'Efeitos']} rows={EXAUSTAO.estados.map(e => [e.faixa, e.nome, e.efeitos])} />
        <h4 className="font-semibold text-xs mb-1 mt-2">Recuperação</h4>
        <Table headers={['Ação', 'Taxa']} rows={EXAUSTAO.recuperacao.map(r => [r.acao, r.taxa])} />
      </Card>

      <Card title="🩸 Ferimentos e Sangramento">
        <Table headers={['HP%', 'Estado', 'Efeitos']} rows={FERIMENTOS.estados.map(f => [f.hpPercent, f.nome, f.efeitos])} />
        <h4 className="font-semibold text-xs mb-1 mt-2">Sangramento</h4>
        <Table headers={['Tipo', 'HP/Round', 'Tratamento']} rows={FERIMENTOS.sangramento.map(s => [s.tipo, s.hpPorRound, s.tratamento])} />
        <h4 className="font-semibold text-xs mb-1 mt-2">Locações</h4>
        <Table headers={['Local', 'Chance', 'Mult Dano']} rows={FERIMENTOS.locacoes.map(l => [l.local, l.chance, l.multDano])} />
      </Card>
    </div>
  );

  // TAB: ARMADURAS
  const TabArmaduras = () => (
    <div className="space-y-3">
      <InfoBox type="info"><strong>Sistema de DR (Damage Resistance):</strong> Dano_Final = max(0, Dano_Após_Margem - DR[Tipo][Locação])</InfoBox>

      <Card title="🛡️ Tabela de Armaduras">
        <Table headers={['Armadura', 'DR Corte', 'DR Perf', 'DR Cont', 'Mobilidade']}
          rows={ARMADURAS.map(a => [a.nome, a.drCorte, a.drPerf, a.drCont, a.mobilidade ? `×${a.mobilidade}` : '—'])} />
      </Card>

      <Card title="🎯 Called Shots para Gaps">
        <Table headers={['Gap', 'Penalidade', 'DR']} rows={CALLED_SHOTS.map(c => [c.gap, c.penalidade, c.dr])} />
        <InfoBox type="warning">Gaps são as únicas áreas vulneráveis em armadura de placas!</InfoBox>
      </Card>
    </div>
  );

  // TAB: GUARDAS (Tradições Marciais)
  const TabGuardas = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 mb-2">
        {Object.keys(GUARDAS).map(k => (
          <button key={k} onClick={() => setGuardasTrad(k)} className={`px-2 py-1 rounded text-xs ${guardasTrad === k ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}>
            {GUARDAS[k].nome.split(' ')[0]}
          </button>
        ))}
      </div>

      <Card title={GUARDAS[guardasTrad].nome}>
        {GUARDAS[guardasTrad].guardas && GUARDAS[guardasTrad].guardas.map((g, i) => (
          <div key={i} className="bg-amber-50 p-2 rounded mb-2 border-l-2 border-amber-500">
            <h4 className="font-semibold text-sm">{g.nome}</h4>
            <p className="text-xs text-gray-600">{g.posicao}</p>
            {g.protecao && <p className="text-xs text-blue-700">🛡️ {g.protecao}</p>}
            {g.ataque && <p className="text-xs text-red-700">⚔️ {g.ataque}</p>}
            {g.exaustao && <p className="text-xs text-orange-700">😰 {g.exaustao}</p>}
            {g.transicao && <p className="text-xs text-green-700">🔄 {g.transicao}</p>}
            {g.tecnicas && <p className="text-xs text-purple-700">🎯 {g.tecnicas}</p>}
            {g.nota && <p className="text-xs font-semibold text-gray-800 mt-1">📌 {g.nota}</p>}
          </div>
        ))}

        {GUARDAS[guardasTrad].transicoes && (
          <>
            <h4 className="font-semibold text-xs mt-3 mb-1">Tempos de Transição (ms)</h4>
            <Table headers={['De', 'Para', 'Tempo']} rows={GUARDAS[guardasTrad].transicoes.map(t => [t.de, t.para, `${t.tempo}ms`])} />
          </>
        )}

        {GUARDAS[guardasTrad].timing && (
          <>
            <h4 className="font-semibold text-xs mt-3 mb-1">Sistema de Timing</h4>
            {GUARDAS[guardasTrad].timing.map((t, i) => (
              <div key={i} className="text-xs"><strong>{t.nome}:</strong> {t.desc} {t.bonus && <span className="text-green-700">({t.bonus})</span>}</div>
            ))}
          </>
        )}

        {GUARDAS[guardasTrad].angulos && (
          <>
            <h4 className="font-semibold text-xs mt-3 mb-1">Sistema de 12 Ângulos</h4>
            <Table headers={['Ângulos', 'Descrição', 'Frequência']} rows={GUARDAS[guardasTrad].angulos.map(a => [a.num, a.desc, a.freq])} />
          </>
        )}

        {GUARDAS[guardasTrad].gunting && (
          <>
            <h4 className="font-semibold text-xs mt-3 mb-1">Gunting (Destruições)</h4>
            <Table headers={['Alvo', 'Efeito']} rows={GUARDAS[guardasTrad].gunting.map(g => [g.alvo, g.efeito])} />
            <p className="text-xs italic mt-1">{GUARDAS[guardasTrad].filosofia}</p>
          </>
        )}

        {GUARDAS[guardasTrad].vadivus && (
          <>
            <h4 className="font-semibold text-xs mt-3 mb-1">8 Posturas Vadivu (Animais)</h4>
            <Table headers={['Vadivu', 'Animal', 'Especialidade', 'Multiplicador']} rows={GUARDAS[guardasTrad].vadivus.map(v => [v.nome, v.animal, v.especialidade, v.mult])} />
          </>
        )}
      </Card>
    </div>
  );

  // TAB: ARMAS
  const TabArmas = () => (
    <div className="space-y-3">
      <Card title="🗡️ Espadas">
        <Table headers={['Arma', 'Dano', 'Tipo', 'Alcance', 'Tempo', 'Força Mín']}
          rows={ARMAS.espadas.map(a => [a.nome, a.dano, a.tipo, a.alcance, `${a.tempo}ms`, a.forcaMin])} />
      </Card>

      <Card title="🔱 Armas de Haste">
        <Table headers={['Arma', 'Dano', 'Tipo', 'Alcance', 'Tempo', 'Força Mín']}
          rows={ARMAS.hastes.map(a => [a.nome, a.dano, a.tipo, a.alcance, `${a.tempo}ms`, a.forcaMin])} />
        <InfoBox type="warning"><strong>Lança COM TRAVA:</strong> ESSENCIAL contra Javali, Urso, Cavalaria!</InfoBox>
      </Card>

      <Card title="🔨 Armas de Impacto">
        <Table headers={['Arma', 'Dano', 'Tipo', 'Alcance', 'Tempo', 'Força Mín']}
          rows={ARMAS.impacto.map(a => [a.nome, a.dano, a.tipo, a.alcance, `${a.tempo}ms`, a.forcaMin])} />
        <InfoBox type="success"><strong>Contundentes:</strong> Efetivos contra TODAS armaduras (trauma)!</InfoBox>
      </Card>

      <Card title="🛡️ Escudos">
        <Table headers={['Tipo', 'Proteção', 'Peso', 'Tempo Bloqueio']}
          rows={ARMAS.escudos.map(e => [e.nome, e.protecao, e.peso, `${e.tempoBloq}ms`])} />
      </Card>

      <Card title="📏 Zonas de Alcance">
        <Table headers={['Zona', 'Distância', 'Armas Ótimas']}
          rows={ARMAS.zonasAlcance.map(z => [z.zona, z.distancia, z.armasOtimas])} />
      </Card>
    </div>
  );

  // TAB: TÉCNICAS
  const TabTecnicas = () => (
    <div className="space-y-3">
      <Card title="⚔️ Meisterhau (Golpes Mestres Alemães)">
        {TECNICAS.meisterhau.map((t, i) => (
          <div key={i} className="bg-amber-50 p-2 rounded mb-1 border-l-2 border-amber-500">
            <div className="flex justify-between"><span className="font-semibold text-xs">{t.nome}</span><span className="bg-amber-200 px-1 rounded text-xs">Hab {t.habMin}+</span></div>
            <p className="text-xs">⏱️{t.tempo}ms | 💥{t.dano} | {t.efeito}</p>
          </div>
        ))}
      </Card>

      <Card title="🔗 Técnicas de Bind">
        {TECNICAS.bind.map((t, i) => (
          <div key={i} className="bg-blue-50 p-2 rounded mb-1 border-l-2 border-blue-500">
            <div className="flex justify-between"><span className="font-semibold text-xs">{t.nome}</span><span className="bg-blue-200 px-1 rounded text-xs">Hab {t.habMin}+</span></div>
            <p className="text-xs">⏱️{t.tempo} | {t.efeito}</p>
          </div>
        ))}
      </Card>

      <Card title="🎌 Técnicas Japonesas">
        {TECNICAS.japonesas.map((t, i) => (
          <div key={i} className="bg-red-50 p-2 rounded mb-1 border-l-2 border-red-500">
            <div className="flex justify-between"><span className="font-semibold text-xs">{t.nome}</span><span className="bg-red-200 px-1 rounded text-xs">Hab {t.habMin}+</span></div>
            <p className="text-xs">{t.dano && `💥${t.dano}`} {t.tempo && `⏱️${t.tempo}`} {t.bonus && `+${t.bonus}`} | {t.efeito}</p>
          </div>
        ))}
      </Card>

      <Card title="🛡️ Técnicas Anti-Armadura">
        {TECNICAS.antiArmadura.map((t, i) => (
          <div key={i} className="bg-purple-50 p-2 rounded mb-1 border-l-2 border-purple-500">
            <div className="flex justify-between"><span className="font-semibold text-xs">{t.nome}</span><span className="bg-purple-200 px-1 rounded text-xs">Hab {t.habMin}+</span></div>
            <p className="text-xs">{t.efeito}</p>
          </div>
        ))}
      </Card>

      <Card title="🇵🇭 Técnicas Filipinas">
        {TECNICAS.filipinas.map((t, i) => (
          <div key={i} className="bg-green-50 p-2 rounded mb-1 border-l-2 border-green-500">
            <span className="font-semibold text-xs">{t.nome}:</span>
            <span className="text-xs ml-1">{t.efeito}</span>
          </div>
        ))}
      </Card>
    </div>
  );

  // TAB: FORMAÇÕES DE COMBATE
  const TabFormacoesCombate = () => (
    <div className="space-y-3">
      <InfoBox type="info"><strong>Formações em Grupo:</strong> Coordenação e disciplina transformam recrutas em exército.</InfoBox>

      {Object.values(FORMACOES).map((f, i) => (
        <Card key={i} title={f.nome}>
          <p className="text-xs mb-1"><strong>Requisitos:</strong> {f.requisitos}</p>
          <p className="text-xs mb-1"><strong>Mecânica:</strong> {f.mecanica}</p>
          {f.bonus && <p className="text-xs text-green-700 mb-1"><strong>Bônus:</strong> {f.bonus}</p>}
          {f.protecao && <p className="text-xs text-blue-700 mb-1"><strong>Proteção:</strong> {f.protecao}</p>}
          {f.vulnerabilidades && <p className="text-xs text-red-700"><strong>Vulnerabilidades:</strong> {f.vulnerabilidades}</p>}
        </Card>
      ))}

      <Card title="🏃 Movimento e Posicionamento">
        <h4 className="font-semibold text-xs mb-1">Velocidades</h4>
        <Table headers={['Direção', 'Tempo/m', 'Exaustão']} rows={MOVIMENTO.velocidades.map(v => [v.direcao, `${v.tempoPorM}ms`, v.exaustao])} />

        <h4 className="font-semibold text-xs mb-1 mt-2">Degradação de Recuo (Anti-Kiting)</h4>
        <Table headers={['Recuos', 'Mult Tempo']} rows={MOVIMENTO.degradacaoRecuo.map(d => [d.recuos, d.multTempo])} />

        <h4 className="font-semibold text-xs mb-1 mt-2">Zona de Controle (ZdC)</h4>
        <p className="text-xs"><strong>Entrar:</strong> {MOVIMENTO.zonaControle.entrar}</p>
        <p className="text-xs"><strong>Sair:</strong> {MOVIMENTO.zonaControle.sair}</p>
      </Card>
    </div>
  );

  // RENDER
  const renderTab = () => {
    switch (activeTab) {
      case 'fundamentos': return <TabFundamentos />;
      case 'tempo': return <TabTempo />;
      case 'armaduras': return <TabArmaduras />;
      case 'guardas': return <TabGuardas />;
      case 'armas': return <TabArmas />;
      case 'tecnicas': return <TabTecnicas />;
      case 'criaturas': return <TabCriaturas />;
      case 'formacoesCombate': return <TabFormacoesCombate />;
      case 'taticas': return <TabTaticas />;
      case 'conhecimento': return <TabConhecimento />;
      case 'formacoes': return <TabFormacoes />;
      case 'anatomia': return <TabAnatomia />;
      case 'hema': return <TabHEMA />;
      case 'armasEsp': return <TabArmasEsp />;
      case 'terreno': return <TabTerreno />;
      case 'escalada': return <TabEscalada />;
      case 'altura': return <TabAltura />;
      case 'criador': return <TabCriador />;
      default: return <TabFundamentos />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-2 sticky top-0 z-10">
        <h1 className="text-sm font-bold text-center">⚔️ Sistema de Combate Unificado Definitivo v2.0 - Tempo Contínuo em Milissegundos</h1>
      </header>
      <nav className="bg-gray-700 p-1 overflow-x-auto sticky top-8 z-10">
        <div className="flex gap-1 min-w-max">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-2 py-1 rounded text-xs whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-800 font-semibold' : 'text-gray-300 hover:bg-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      <main className="p-2 max-w-4xl mx-auto">{renderTab()}</main>
      <footer className="text-center text-gray-500 text-xs p-2 bg-gray-200">
        Sistema de Combate Unificado v2.0 • Tradições Marciais Globais • Tempo em Milissegundos • Letalidade Histórica
      </footer>
    </div>
  );
};

export default SistemaCombateCompleto;