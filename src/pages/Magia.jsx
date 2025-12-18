import React from 'react';
import { MAGIA } from '../data/combatData';

const MagiaPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Opção A: Multiplicador Final</h3>
        <p className="text-gray-300 mb-3">{MAGIA.multiplicador.desc}</p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Intensidade</th>
              <th className="text-center p-2 text-gray-300">Buff</th>
              <th className="text-center p-2 text-gray-300">Debuff</th>
              <th className="text-center p-2 text-gray-300">Duração</th>
            </tr>
          </thead>
          <tbody>
            {MAGIA.multiplicador.intensidades.map((m, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white font-semibold">{m.nome}</td>
                <td className="p-2 text-center text-green-400">×{m.buff.toFixed(2)}</td>
                <td className="p-2 text-center text-red-400">×{m.debuff.toFixed(2)}</td>
                <td className="p-2 text-center text-gray-400">{m.duracao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Opção B: Aumento de Atributo</h3>
        <p className="text-gray-300 mb-3">{MAGIA.atributo.desc}</p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Intensidade</th>
              <th className="text-center p-2 text-gray-300">Bônus</th>
              <th className="text-center p-2 text-gray-300">Duração</th>
            </tr>
          </thead>
          <tbody>
            {MAGIA.atributo.intensidades.map((m, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white font-semibold">{m.nome}</td>
                <td className="p-2 text-center text-cyan-400">+{m.bonus}</td>
                <td className="p-2 text-center text-gray-400">{m.duracao}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-yellow-400 text-sm mt-3">{MAGIA.atributo.nota}</p>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Quando Usar Cada</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Situação</th>
              <th className="text-left p-2 text-gray-300">Usar</th>
            </tr>
          </thead>
          <tbody>
            {MAGIA.quandoUsar.map((m, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white">{m.situacao}</td>
                <td className="p-2 text-cyan-400">{m.usar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MagiaPage;
