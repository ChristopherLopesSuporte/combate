import React from 'react';
import { ATRIBUTOS } from '../data/combatData';

const AtributosPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Atributos Base</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Sigla</th>
              <th className="text-left p-2 text-gray-300">Atributo</th>
              <th className="text-left p-2 text-gray-300">Função</th>
            </tr>
          </thead>
          <tbody>
            {ATRIBUTOS.map((a, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-cyan-400 font-bold">{a.sigla}</td>
                <td className="p-2 text-white font-semibold">{a.nome}</td>
                <td className="p-2 text-gray-300">{a.funcao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Derivados</h3>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400">
          <div>HP = RES × 2</div>
          <div>Mult_Dano = FOR ÷ 50</div>
          <div>Dano = Dano_Arma × Mult_Qual_Dano × Mult_Dano</div>
        </div>
      </div>
    </div>
  );
};

export default AtributosPage;
