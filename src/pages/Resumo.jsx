import React from 'react';
import { FORMULAS, FLUXO_TURNO } from '../data/combatData';

const Resumo = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Fórmulas Principais</h3>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400 mb-3">
          <div>{FORMULAS.resumo.te}</div>
          <div>{FORMULAS.resumo.tempoFinal}</div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Camadas de Cálculo</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Camada</th>
              <th className="text-left p-2 text-gray-300">O que é</th>
              <th className="text-left p-2 text-gray-300">Quando calcular</th>
            </tr>
          </thead>
          <tbody>
            {FORMULAS.camadas.map((c, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-cyan-400 font-bold">{c.nome}</td>
                <td className="p-2 text-white">{c.desc}</td>
                <td className="p-2 text-gray-400">{c.quando}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Fluxo de Turno</h3>
        <ol className="list-decimal list-inside space-y-2">
          {FLUXO_TURNO.map((passo, i) => (
            <li key={i} className="text-white">{passo}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default Resumo;
