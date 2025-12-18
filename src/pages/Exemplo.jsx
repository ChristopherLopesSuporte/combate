import React from 'react';
import { EXEMPLO_MARCUS } from '../data/combatData';

const ExemploPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Ficha: Marcus</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-gray-400">Arma:</span>
            <span className="text-white ml-2">{EXEMPLO_MARCUS.arma}</span>
          </div>
          <div>
            <span className="text-gray-400">Armadura:</span>
            <span className="text-white ml-2">{EXEMPLO_MARCUS.armadura} (Prot 20)</span>
          </div>
          <div>
            <span className="text-gray-400">HP:</span>
            <span className="text-green-400 ml-2 font-bold">{EXEMPLO_MARCUS.hp}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Atributos</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(EXEMPLO_MARCUS.atributos).map(([key, val]) => (
            <div key={key} className="bg-gray-900 p-2 rounded text-center">
              <div className="text-gray-400 text-xs uppercase">{key}</div>
              <div className="text-white font-bold text-lg">{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Índices de Combate</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 p-3 rounded text-center">
            <div className="text-gray-400 text-sm">IC Arma</div>
            <div className="text-cyan-400 font-bold text-xl">{EXEMPLO_MARCUS.ic.arma}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded text-center">
            <div className="text-gray-400 text-sm">IC Aparar</div>
            <div className="text-cyan-400 font-bold text-xl">{EXEMPLO_MARCUS.ic.aparar}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded text-center">
            <div className="text-gray-400 text-sm">IC Esquiva</div>
            <div className="text-cyan-400 font-bold text-xl">{EXEMPLO_MARCUS.ic.esquiva}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Tempos Equipados (TE)</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(EXEMPLO_MARCUS.tempos).map(([key, val]) => (
            <div key={key} className="bg-gray-900 p-2 rounded text-center">
              <div className="text-gray-400 text-xs capitalize">{key}</div>
              <div className="text-white font-bold">{val} ms</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Dano</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 p-3 rounded text-center">
            <div className="text-gray-400 text-sm">Normal</div>
            <div className="text-red-400 font-bold text-xl">{EXEMPLO_MARCUS.dano.normal}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded text-center">
            <div className="text-gray-400 text-sm">Jab (50%)</div>
            <div className="text-red-400 font-bold text-xl">{EXEMPLO_MARCUS.dano.jab}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded text-center">
            <div className="text-gray-400 text-sm">Pesado (150%)</div>
            <div className="text-red-400 font-bold text-xl">{EXEMPLO_MARCUS.dano.pesado}</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Exemplo de Cálculo em Combate</h3>
        <div className="bg-gray-900 p-3 rounded space-y-2">
          <p className="text-white"><strong>Marcus</strong> (Corte 227 ms)</p>
          <p className="text-gray-400">- Guarda baixa: −10%</p>
          <p className="text-gray-400">- Fadiga 35%: +10%</p>
          <p className="text-green-400">Mod = −10 + 10 = 0% → Tempo = 227 × 1.00 = <strong>227 ms</strong></p>
        </div>
        <div className="bg-gray-900 p-3 rounded space-y-2 mt-3">
          <p className="text-white"><strong>Inimigo</strong> (Jab 180 ms)</p>
          <p className="text-gray-400">- Guarda alta: +10%</p>
          <p className="text-gray-400">- Fadiga 55%: +30%</p>
          <p className="text-red-400">Mod = +10 + 30 = 40% → Tempo = 180 × 1.40 = <strong>252 ms</strong></p>
        </div>
        <div className="bg-yellow-900 p-3 rounded mt-3">
          <p className="text-yellow-400 font-bold">Marcus acerta primeiro (227 &lt; 252)!</p>
        </div>
      </div>
    </div>
  );
};

export default ExemploPage;
