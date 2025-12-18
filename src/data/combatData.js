// ==================== SISTEMA DE COMBATE RPG v3.0 ====================
// Dados compartilhados do sistema

export const FORMULAS = {
  resumo: {
    te: 'TE = (Tempo_Arma × IC) + Penalidade_Armadura',
    tempoFinal: 'Tempo_Final = TE × Mult_Qualidade × Mult_Situacional × Mult_Magia',
  },
  camadas: [
    { nome: 'IC', desc: 'Eficiência do personagem com a arma', quando: 'Criação / level up' },
    { nome: 'TE', desc: 'Tempo com equipamento', quando: 'Ao equipar' },
    { nome: 'Tempo Final', desc: 'Tempo real da ação', quando: 'Em combate' },
  ],
};

export const ATRIBUTOS = [
  { sigla: 'VEL', nome: 'Velocidade', funcao: 'Rapidez do movimento' },
  { sigla: 'HAB', nome: 'Habilidade', funcao: 'Técnica e precisão' },
  { sigla: 'AGI', nome: 'Agilidade', funcao: 'Coordenação e equilíbrio' },
  { sigla: 'FOR', nome: 'Força', funcao: 'Potência física' },
  { sigla: 'RES', nome: 'Resistência', funcao: 'Stamina e HP' },
  { sigla: 'PER', nome: 'Percepção', funcao: 'Leitura de combate' },
];

export const IC_FORMULA = 'IC = (100 − VEL×PesoVel − HAB×PesoHab − AGI×PesoAgi − FOR×PesoFor) ÷ 100';

export const PESOS_IC = {
  armas: [
    { tipo: 'Desarmado', vel: 0.20, hab: 0.15, agi: 0.15, for: 0.00, soma: 0.50 },
    { tipo: 'Facas', vel: 0.20, hab: 0.20, agi: 0.10, for: 0.00, soma: 0.50 },
    { tipo: 'Espadas 1 Mão', vel: 0.15, hab: 0.20, agi: 0.10, for: 0.05, soma: 0.50 },
    { tipo: 'Rapieira', vel: 0.15, hab: 0.30, agi: 0.05, for: 0.00, soma: 0.50 },
    { tipo: 'Espadas 2 Mãos', vel: 0.10, hab: 0.15, agi: 0.05, for: 0.20, soma: 0.50 },
    { tipo: 'Machados', vel: 0.05, hab: 0.10, agi: 0.05, for: 0.30, soma: 0.50 },
    { tipo: 'Impacto', vel: 0.05, hab: 0.10, agi: 0.05, for: 0.30, soma: 0.50 },
    { tipo: 'Hastes', vel: 0.15, hab: 0.25, agi: 0.05, for: 0.05, soma: 0.50 },
    { tipo: 'Flexíveis', vel: 0.10, hab: 0.30, agi: 0.10, for: 0.00, soma: 0.50 },
  ],
  defensivas: [
    { acao: 'Aparar', vel: 0.10, hab: 0.25, agi: 0.10, for: 0.05 },
    { acao: 'Esquiva', vel: 0.10, hab: 0.05, agi: 0.35, for: 0.00 },
  ],
};

export const ARMAS = {
  desarmado: {
    nome: 'Desarmado',
    tipo: 'Desarmado',
    itens: [
      { nome: 'Soco', jab: 150, direto: 250, corte: null, estocada: null, aparar: 100, dano: 5, forReq: 0, alcance: 0 },
      { nome: 'Chute', jab: 200, direto: 350, corte: null, estocada: null, aparar: null, dano: 10, forReq: 0, alcance: 1 },
    ],
  },
  facas: {
    nome: 'Facas',
    tipo: 'Facas',
    itens: [
      { nome: 'Faca', jab: 100, direto: 180, corte: 150, estocada: 200, aparar: 70, dano: 8, forReq: 0, alcance: 0 },
      { nome: 'Adaga', jab: 120, direto: 200, corte: 180, estocada: 220, aparar: 80, dano: 10, forReq: 10, alcance: 0 },
      { nome: 'Adaga Longa', jab: 140, direto: 220, corte: 200, estocada: 250, aparar: 90, dano: 12, forReq: 15, alcance: 1 },
    ],
  },
  espadas1mao: {
    nome: 'Espadas 1 Mão',
    tipo: 'Espadas 1 Mão',
    itens: [
      { nome: 'Gladius', jab: 160, direto: 260, corte: 240, estocada: 280, aparar: 110, dano: 18, forReq: 25, alcance: 1 },
      { nome: 'Espada Curta', jab: 180, direto: 280, corte: 250, estocada: 300, aparar: 120, dano: 18, forReq: 30, alcance: 1 },
      { nome: 'Sabre', jab: 200, direto: 320, corte: 280, estocada: 350, aparar: 130, dano: 20, forReq: 35, alcance: 2 },
      { nome: 'Espada Longa', jab: 220, direto: 350, corte: 320, estocada: 380, aparar: 150, dano: 22, forReq: 40, alcance: 2 },
      { nome: 'Rapieira', jab: 180, direto: 300, corte: null, estocada: 280, aparar: 140, dano: 15, forReq: 25, alcance: 2 },
    ],
  },
  espadas2maos: {
    nome: 'Espadas 2 Mãos',
    tipo: 'Espadas 2 Mãos',
    itens: [
      { nome: 'Espada Bastarda', jab: 260, direto: 400, corte: 380, estocada: 420, aparar: 180, dano: 28, forReq: 50, alcance: 2 },
      { nome: 'Montante', jab: 300, direto: 450, corte: 420, estocada: 480, aparar: 200, dano: 35, forReq: 60, alcance: 3 },
      { nome: 'Katana', jab: 240, direto: 380, corte: 350, estocada: 400, aparar: 170, dano: 26, forReq: 45, alcance: 2 },
    ],
  },
  machados: {
    nome: 'Machados',
    tipo: 'Machados',
    itens: [
      { nome: 'Machadinha', jab: 220, direto: 340, corte: 320, estocada: null, aparar: 150, dano: 20, forReq: 35, alcance: 1 },
      { nome: 'Machado de Guerra', jab: 280, direto: 400, corte: 380, estocada: null, aparar: 180, dano: 28, forReq: 50, alcance: 2 },
      { nome: 'Machado Grande', jab: 320, direto: 480, corte: 450, estocada: null, aparar: 220, dano: 38, forReq: 65, alcance: 2 },
    ],
  },
  impacto: {
    nome: 'Impacto',
    tipo: 'Impacto',
    itens: [
      { nome: 'Porrete', jab: 200, direto: 320, corte: null, estocada: null, aparar: 140, dano: 12, forReq: 20, alcance: 1 },
      { nome: 'Maça', jab: 250, direto: 380, corte: null, estocada: null, aparar: 160, dano: 25, forReq: 45, alcance: 1 },
      { nome: 'Martelo de Guerra', jab: 300, direto: 450, corte: null, estocada: null, aparar: 200, dano: 35, forReq: 60, alcance: 2 },
      { nome: 'Mangual', jab: 280, direto: 420, corte: null, estocada: null, aparar: null, dano: 30, forReq: 50, alcance: 2 },
    ],
  },
  hastes: {
    nome: 'Hastes',
    tipo: 'Hastes',
    itens: [
      { nome: 'Bastão', jab: 180, direto: 300, corte: null, estocada: 250, aparar: 120, dano: 10, forReq: 20, alcance: 2 },
      { nome: 'Lança Curta', jab: 180, direto: 280, corte: null, estocada: 250, aparar: 130, dano: 18, forReq: 25, alcance: 2 },
      { nome: 'Lança', jab: 200, direto: 300, corte: null, estocada: 280, aparar: 140, dano: 22, forReq: 35, alcance: 3 },
      { nome: 'Lança Longa', jab: 240, direto: 350, corte: null, estocada: 320, aparar: 160, dano: 25, forReq: 45, alcance: 4 },
      { nome: 'Alabarda', jab: 300, direto: 450, corte: 400, estocada: 380, aparar: 200, dano: 32, forReq: 55, alcance: 3 },
    ],
  },
  flexiveis: {
    nome: 'Flexíveis',
    tipo: 'Flexíveis',
    itens: [
      { nome: 'Chicote', jab: 250, direto: 400, corte: 350, estocada: null, aparar: null, dano: 8, forReq: 20, alcance: 3 },
      { nome: 'Corrente', jab: 280, direto: 420, corte: null, estocada: null, aparar: null, dano: 15, forReq: 35, alcance: 2 },
    ],
  },
};

export const TEMPO_ESQUIVA = 180;

export const ARMADURAS = [
  { nome: 'Nenhuma', penalidade: 0, multFadiga: 1.0, protecao: 0 },
  { nome: 'Couro', penalidade: 10, multFadiga: 1.0, protecao: 5 },
  { nome: 'Couro Reforçado', penalidade: 20, multFadiga: 1.1, protecao: 10 },
  { nome: 'Cota de Malha', penalidade: 40, multFadiga: 1.3, protecao: 20 },
  { nome: 'Brigandine', penalidade: 50, multFadiga: 1.5, protecao: 25 },
  { nome: 'Placas Parciais', penalidade: 70, multFadiga: 1.7, protecao: 35 },
  { nome: 'Placas Completas', penalidade: 100, multFadiga: 2.0, protecao: 45 },
];

export const QUALIDADE_ARMA = [
  { nome: 'Tosca', multTempo: 1.10, multDano: 0.9, habReq: 0 },
  { nome: 'Comum', multTempo: 1.00, multDano: 1.0, habReq: 0 },
  { nome: 'Boa', multTempo: 0.95, multDano: 1.1, habReq: 40 },
  { nome: 'Excelente', multTempo: 0.90, multDano: 1.2, habReq: 60 },
  { nome: 'Obra-prima', multTempo: 0.85, multDano: 1.3, habReq: 80 },
  { nome: 'Lendária', multTempo: 0.80, multDano: 1.5, habReq: 95 },
];

export const APROVEITAMENTO_FORMULA = 'Aproveitamento = min(1, HAB ÷ HAB_Req)\nMult_Real = 1 − (1 − Mult_Qualidade) × Aproveitamento';

export const APROVEITAMENTO_TABELA = [
  { qualidade: 'Boa', hab30: 0.96, hab50: 0.95, hab70: 0.95, hab90: 0.95 },
  { qualidade: 'Excelente', hab30: 0.95, hab50: 0.92, hab70: 0.90, hab90: 0.90 },
  { qualidade: 'Obra-prima', hab30: 0.94, hab50: 0.91, hab70: 0.87, hab90: 0.85 },
  { qualidade: 'Lendária', hab30: 0.94, hab50: 0.89, hab70: 0.83, hab90: 0.80 },
];

export const PENALIDADE_FORCA = {
  formula: 'Mult_Penalidade = 1 + (FOR_Req − FOR) × 0.02',
  tabela: [
    { diferenca: 5, penalidade: 1.10 },
    { diferenca: 10, penalidade: 1.20 },
    { diferenca: 15, penalidade: 1.30 },
    { diferenca: 20, penalidade: 1.40 },
  ],
};

export const MODIFICADORES = {
  formula: 'Mult_Situacional = 1 + (Soma dos Mods) ÷ 100',
  guarda: [
    { nome: 'Alta', mod: 10 },
    { nome: 'Média', mod: 0 },
    { nome: 'Baixa', mod: -10 },
  ],
  fadiga: [
    { faixa: '0-25%', mod: 0 },
    { faixa: '26-50%', mod: 10 },
    { faixa: '51-75%', mod: 30 },
    { faixa: '76-100%', mod: 60 },
  ],
  posicao: [
    { nome: 'Vantagem', mod: -10 },
    { nome: 'Neutra', mod: 0 },
    { nome: 'Desvantagem', mod: 20 },
  ],
  ferimento: [
    { local: 'Braço', mod: 15 },
    { local: 'Perna', mod: 10 },
  ],
  terreno: [
    { nome: 'Instável', mod: 10 },
  ],
};

export const MAGIA = {
  multiplicador: {
    desc: 'Buff/debuff temporário aplicado ao tempo final',
    intensidades: [
      { nome: 'Fraca', buff: 0.90, debuff: 1.10, duracao: '5 turnos' },
      { nome: 'Moderada', buff: 0.80, debuff: 1.25, duracao: '3 turnos' },
      { nome: 'Forte', buff: 0.70, debuff: 1.40, duracao: '2 turnos' },
      { nome: 'Extrema', buff: 0.60, debuff: 1.60, duracao: '1 turno' },
    ],
  },
  atributo: {
    desc: 'Magia aumenta atributo temporariamente, recalcular IC',
    intensidades: [
      { nome: 'Fraca', bonus: 10, duracao: '5 turnos' },
      { nome: 'Moderada', bonus: 20, duracao: '3 turnos' },
      { nome: 'Forte', bonus: 30, duracao: '2 turnos' },
      { nome: 'Extrema', bonus: 50, duracao: '1 turno' },
    ],
    nota: 'Atributos podem passar de 100 com magia.',
  },
  quandoUsar: [
    { situacao: 'Buff rápido em combate', usar: 'Multiplicador Final' },
    { situacao: 'Criatura sobrenatural', usar: 'Atributo > 100' },
    { situacao: 'Poção/encantamento duradouro', usar: 'Aumento de Atributo' },
    { situacao: 'Maldição/debuff', usar: 'Multiplicador Final' },
  ],
};

export const SOBRENATURAIS = [
  { criatura: 'Humano comum', vel: 50, hab: 50, agi: 50, for: 50 },
  { criatura: 'Humano elite', vel: 80, hab: 80, agi: 80, for: 80 },
  { criatura: 'Vampiro', vel: 120, hab: 90, agi: 110, for: 100 },
  { criatura: 'Lobisomem', vel: 100, hab: 60, agi: 90, for: 130 },
  { criatura: 'Elfo', vel: 90, hab: 100, agi: 110, for: 60 },
  { criatura: 'Ogro', vel: 40, hab: 30, agi: 30, for: 150 },
  { criatura: 'Demônio menor', vel: 110, hab: 80, agi: 100, for: 110 },
];

export const IC_LIMITE = 'IC = max(0.20, cálculo normal)';

export const FLUXO_TURNO = [
  'Declarar ações simultaneamente',
  'Somar modificadores',
  'Calcular: TE × Mult_Sit × Mult_Magia',
  'Menor tempo acerta primeiro',
  'Dano = Dano − Proteção',
  'Atualizar HP e fadiga',
];

export const EXEMPLO_MARCUS = {
  atributos: { vel: 68, hab: 75, agi: 62, for: 70, res: 65, per: 72 },
  arma: 'Espada Longa Excelente',
  armadura: 'Cota de Malha',
  ic: {
    arma: 0.651,
    aparar: 0.648,
    esquiva: 0.678,
  },
  tempos: {
    jab: 169,
    direto: 245,
    corte: 227,
    estocada: 262,
    aparar: 127,
    esquiva: 122,
  },
  dano: {
    normal: 37,
    jab: 19,
    pesado: 56,
  },
  hp: 130,
};

// Funções de cálculo
export const calcularIC = (vel, hab, agi, for_, tipo) => {
  const pesos = PESOS_IC.armas.find(p => p.tipo === tipo);
  if (!pesos) return 1;
  const valor = (100 - vel * pesos.vel - hab * pesos.hab - agi * pesos.agi - for_ * pesos.for) / 100;
  return Math.max(0.20, valor);
};

export const calcularICDefensivo = (vel, hab, agi, for_, acao) => {
  const pesos = PESOS_IC.defensivas.find(p => p.acao === acao);
  if (!pesos) return 1;
  const valor = (100 - vel * pesos.vel - hab * pesos.hab - agi * pesos.agi - for_ * pesos.for) / 100;
  return Math.max(0.20, valor);
};
