import React from 'react';
import { MODIFICADORES } from '../data/combatData';

const ModificadoresPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Fórmula</h3>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400">
          {MODIFICADORES.formula}
        </div>
        <p className="text-gray-400 text-sm mt-2">Somar todos os modificadores e aplicar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-bold text-cyan-400 mb-2">Guarda</h4>
          <table className="w-full">
            <tbody>
              {MODIFICADORES.guarda.map((g, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="p-2 text-white">{g.nome}</td>
                  <td className="p-2 text-right text-yellow-400">{g.mod > 0 ? '+' : ''}{g.mod}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-bold text-cyan-400 mb-2">Fadiga</h4>
          <table className="w-full">
            <tbody>
              {MODIFICADORES.fadiga.map((f, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="p-2 text-white">{f.faixa}</td>
                  <td className="p-2 text-right text-yellow-400">{f.mod > 0 ? '+' : ''}{f.mod}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-bold text-cyan-400 mb-2">Posição</h4>
          <table className="w-full">
            <tbody>
              {MODIFICADORES.posicao.map((p, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="p-2 text-white">{p.nome}</td>
                  <td className="p-2 text-right text-yellow-400">{p.mod > 0 ? '+' : ''}{p.mod}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-lg font-bold text-cyan-400 mb-2">Ferimento</h4>
          <table className="w-full">
            <tbody>
              {MODIFICADORES.ferimento.map((f, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="p-2 text-white">{f.local}</td>
                  <td className="p-2 text-right text-red-400">+{f.mod}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="text-lg font-bold text-cyan-400 mb-2">Terreno</h4>
        <table className="w-full">
          <tbody>
            {MODIFICADORES.terreno.map((t, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white">{t.nome}</td>
                <td className="p-2 text-right text-red-400">+{t.mod}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModificadoresPage;
