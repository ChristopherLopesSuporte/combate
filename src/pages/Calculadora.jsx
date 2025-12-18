import React, { useState } from 'react';
import {
  ATRIBUTOS,
  PESOS_IC,
  ARMADURAS,
  QUALIDADE_ARMA,
  TEMPO_ESQUIVA,
  calcularIC,
  calcularICDefensivo
} from '../data/combatData';

const CalculadoraPage = () => {
  const [calc, setCalc] = useState({
    vel: 50, hab: 50, agi: 50, for: 50, res: 50, per: 50,
    tipoArma: 'Espadas 1 Mão',
    qualidade: 'Comum',
    armadura: 'Nenhuma',
  });

  // Calcular IC
  const icArma = calcularIC(calc.vel, calc.hab, calc.agi, calc.for, calc.tipoArma);
  const icAparar = calcularICDefensivo(calc.vel, calc.hab, calc.agi, calc.for, 'Aparar');
  const icEsquiva = calcularICDefensivo(calc.vel, calc.hab, calc.agi, calc.for, 'Esquiva');

  // Encontrar armadura selecionada
  const armadura = ARMADURAS.find(a => a.nome === calc.armadura) || ARMADURAS[0];

  // Encontrar qualidade selecionada
  const qualidade = QUALIDADE_ARMA.find(q => q.nome === calc.qualidade) || QUALIDADE_ARMA[1];

  // Calcular aproveitamento de qualidade
  const aproveitamento = qualidade.habReq > 0 ? Math.min(1, calc.hab / qualidade.habReq) : 1;
  const multQualReal = 1 - (1 - qualidade.multTempo) * aproveitamento;

  // HP e Dano
  const hp = calc.res * 2;
  const multDano = calc.for / 50;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Atributos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ATRIBUTOS.map(attr => (
            <div key={attr.sigla} className="flex flex-col">
              <label className="text-gray-300 text-sm mb-1">{attr.nome} ({attr.sigla})</label>
              <input
                type="number"
                min="0"
                max="150"
                value={calc[attr.sigla.toLowerCase()]}
                onChange={(e) => setCalc({...calc, [attr.sigla.toLowerCase()]: parseInt(e.target.value) || 0})}
                className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Equipamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-gray-300 text-sm mb-1">Tipo de Arma</label>
            <select
              value={calc.tipoArma}
              onChange={(e) => setCalc({...calc, tipoArma: e.target.value})}
              className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
            >
              {PESOS_IC.armas.map(p => (
                <option key={p.tipo} value={p.tipo}>{p.tipo}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-300 text-sm mb-1">Qualidade</label>
            <select
              value={calc.qualidade}
              onChange={(e) => setCalc({...calc, qualidade: e.target.value})}
              className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
            >
              {QUALIDADE_ARMA.map(q => (
                <option key={q.nome} value={q.nome}>{q.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-300 text-sm mb-1">Armadura</label>
            <select
              value={calc.armadura}
              onChange={(e) => setCalc({...calc, armadura: e.target.value})}
              className="bg-gray-700 text-white p-2 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
            >
              {ARMADURAS.map(a => (
                <option key={a.nome} value={a.nome}>{a.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Resultados</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 p-3 rounded">
            <h4 className="text-cyan-400 font-bold mb-2">Índices de Combate</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-300">IC Arma ({calc.tipoArma}):</span>
                <span className="text-white font-bold">{icArma.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">IC Aparar:</span>
                <span className="text-white font-bold">{icAparar.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">IC Esquiva:</span>
                <span className="text-white font-bold">{icEsquiva.toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-3 rounded">
            <h4 className="text-cyan-400 font-bold mb-2">Multiplicadores</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-300">Qualidade ({calc.qualidade}):</span>
                <span className="text-white font-bold">×{multQualReal.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Penalidade Armadura:</span>
                <span className="text-white font-bold">+{armadura.penalidade} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Mult Dano (FOR):</span>
                <span className="text-white font-bold">×{multDano.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-3 rounded">
            <h4 className="text-cyan-400 font-bold mb-2">Derivados</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-300">HP:</span>
                <span className="text-green-400 font-bold">{hp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Proteção:</span>
                <span className="text-green-400 font-bold">{armadura.protecao}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-3 rounded">
            <h4 className="text-cyan-400 font-bold mb-2">Tempo de Esquiva</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-300">Base:</span>
                <span className="text-white">{TEMPO_ESQUIVA} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">×IC:</span>
                <span className="text-white">{Math.round(TEMPO_ESQUIVA * icEsquiva)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">TE Final:</span>
                <span className="text-yellow-400 font-bold">{Math.round(TEMPO_ESQUIVA * icEsquiva)} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Fórmula TE</h3>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400 text-sm">
          TE = (Tempo_Arma × {icArma.toFixed(3)} × {multQualReal.toFixed(3)}) + {armadura.penalidade}
        </div>
        <p className="text-gray-400 text-sm mt-2">* Esquiva não usa Mult_Qualidade nem Penalidade de Armadura</p>
      </div>
    </div>
  );
};

export default CalculadoraPage;
