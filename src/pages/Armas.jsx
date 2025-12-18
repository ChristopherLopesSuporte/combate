import React, { useState } from 'react';
import { ARMAS, TEMPO_ESQUIVA } from '../data/combatData';

const ArmasPage = () => {
  const [categoriaSel, setCategoriaSel] = useState('espadas1mao');

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Selecionar Categoria</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(ARMAS).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaSel(cat)}
              className={`px-3 py-1 rounded ${categoriaSel === cat ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {ARMAS[cat].nome}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">{ARMAS[categoriaSel].nome}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left p-2 text-gray-300">Arma</th>
                <th className="text-center p-2 text-gray-300">Jab</th>
                <th className="text-center p-2 text-gray-300">Direto</th>
                <th className="text-center p-2 text-gray-300">Corte</th>
                <th className="text-center p-2 text-gray-300">Estocada</th>
                <th className="text-center p-2 text-gray-300">Aparar</th>
                <th className="text-center p-2 text-gray-300">Dano</th>
                <th className="text-center p-2 text-gray-300">FOR Req</th>
                <th className="text-center p-2 text-gray-300">Alcance</th>
              </tr>
            </thead>
            <tbody>
              {ARMAS[categoriaSel].itens.map((arma, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="p-2 text-white font-semibold">{arma.nome}</td>
                  <td className="p-2 text-center text-cyan-400">{arma.jab}</td>
                  <td className="p-2 text-center text-cyan-400">{arma.direto}</td>
                  <td className="p-2 text-center text-cyan-400">{arma.corte ?? '—'}</td>
                  <td className="p-2 text-center text-cyan-400">{arma.estocada ?? '—'}</td>
                  <td className="p-2 text-center text-green-400">{arma.aparar ?? '—'}</td>
                  <td className="p-2 text-center text-red-400 font-bold">{arma.dano}</td>
                  <td className="p-2 text-center text-yellow-400">{arma.forReq}</td>
                  <td className="p-2 text-center text-gray-400">{arma.alcance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Tempo de Esquiva (Universal)</h3>
        <p className="text-white">Esquiva: <span className="text-cyan-400 font-bold">{TEMPO_ESQUIVA} ms</span></p>
        <p className="text-gray-400 text-sm mt-2">Penalidade de armadura não se aplica à Esquiva.</p>
      </div>
    </div>
  );
};

export default ArmasPage;
