import React from 'react';
import { IC_FORMULA, PESOS_IC, IC_LIMITE } from '../data/combatData';

const IndiceCombate = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Fórmula do IC</h3>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400 mb-3">
          {IC_FORMULA}
        </div>
        <p className="text-gray-400 text-sm">O IC varia conforme o tipo de arma. Armas pesadas dependem mais de FOR, armas técnicas dependem mais de HAB.</p>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Pesos por Tipo de Arma</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left p-2 text-gray-300">Tipo</th>
                <th className="text-center p-2 text-gray-300">VEL</th>
                <th className="text-center p-2 text-gray-300">HAB</th>
                <th className="text-center p-2 text-gray-300">AGI</th>
                <th className="text-center p-2 text-gray-300">FOR</th>
                <th className="text-center p-2 text-gray-300">Soma</th>
              </tr>
            </thead>
            <tbody>
              {PESOS_IC.armas.map((p, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="p-2 text-white font-semibold">{p.tipo}</td>
                  <td className="p-2 text-center text-cyan-400">{p.vel.toFixed(2)}</td>
                  <td className="p-2 text-center text-cyan-400">{p.hab.toFixed(2)}</td>
                  <td className="p-2 text-center text-cyan-400">{p.agi.toFixed(2)}</td>
                  <td className="p-2 text-center text-cyan-400">{p.for.toFixed(2)}</td>
                  <td className="p-2 text-center text-yellow-400">{p.soma.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Pesos para Ações Defensivas</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Ação</th>
              <th className="text-center p-2 text-gray-300">VEL</th>
              <th className="text-center p-2 text-gray-300">HAB</th>
              <th className="text-center p-2 text-gray-300">AGI</th>
              <th className="text-center p-2 text-gray-300">FOR</th>
            </tr>
          </thead>
          <tbody>
            {PESOS_IC.defensivas.map((p, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white font-semibold">{p.acao}</td>
                <td className="p-2 text-center text-cyan-400">{p.vel.toFixed(2)}</td>
                <td className="p-2 text-center text-cyan-400">{p.hab.toFixed(2)}</td>
                <td className="p-2 text-center text-cyan-400">{p.agi.toFixed(2)}</td>
                <td className="p-2 text-center text-cyan-400">{p.for.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Limite de IC (Sobrenaturais)</h3>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400">
          {IC_LIMITE}
        </div>
        <p className="text-gray-400 text-sm mt-2">Com atributos muito altos, limitar IC mínimo em 0.20.</p>
      </div>
    </div>
  );
};

export default IndiceCombate;
