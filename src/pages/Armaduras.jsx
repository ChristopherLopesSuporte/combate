import React from 'react';
import { ARMADURAS } from '../data/combatData';

const ArmadurasPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Tabela de Armaduras</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Armadura</th>
              <th className="text-center p-2 text-gray-300">Penalidade</th>
              <th className="text-center p-2 text-gray-300">Mult Fadiga</th>
              <th className="text-center p-2 text-gray-300">Proteção</th>
            </tr>
          </thead>
          <tbody>
            {ARMADURAS.map((a, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white font-semibold">{a.nome}</td>
                <td className="p-2 text-center text-cyan-400">+{a.penalidade} ms</td>
                <td className="p-2 text-center text-yellow-400">×{a.multFadiga.toFixed(1)}</td>
                <td className="p-2 text-center text-green-400 font-bold">{a.protecao}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-gray-400 text-sm mt-3">* Penalidade de armadura não se aplica à Esquiva.</p>
      </div>
    </div>
  );
};

export default ArmadurasPage;
