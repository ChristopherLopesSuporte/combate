import React from 'react';
import { SOBRENATURAIS, IC_LIMITE } from '../data/combatData';

const SobrenaturaisPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Seres Sobrenaturais</h3>
        <p className="text-gray-300 mb-3">Criaturas mágicas podem ter atributos acima de 100.</p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Criatura</th>
              <th className="text-center p-2 text-gray-300">VEL</th>
              <th className="text-center p-2 text-gray-300">HAB</th>
              <th className="text-center p-2 text-gray-300">AGI</th>
              <th className="text-center p-2 text-gray-300">FOR</th>
            </tr>
          </thead>
          <tbody>
            {SOBRENATURAIS.map((s, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white font-semibold">{s.criatura}</td>
                <td className={`p-2 text-center ${s.vel > 100 ? 'text-purple-400 font-bold' : 'text-cyan-400'}`}>{s.vel}</td>
                <td className={`p-2 text-center ${s.hab > 100 ? 'text-purple-400 font-bold' : 'text-cyan-400'}`}>{s.hab}</td>
                <td className={`p-2 text-center ${s.agi > 100 ? 'text-purple-400 font-bold' : 'text-cyan-400'}`}>{s.agi}</td>
                <td className={`p-2 text-center ${s.for > 100 ? 'text-purple-400 font-bold' : 'text-cyan-400'}`}>{s.for}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Limite de IC</h3>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400">
          {IC_LIMITE}
        </div>
        <p className="text-gray-400 text-sm mt-2">Com atributos muito altos, limitar IC mínimo em 0.20.</p>
      </div>
    </div>
  );
};

export default SobrenaturaisPage;
