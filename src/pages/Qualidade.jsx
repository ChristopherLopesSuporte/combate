import React from 'react';
import { QUALIDADE_ARMA, APROVEITAMENTO_FORMULA, APROVEITAMENTO_TABELA, PENALIDADE_FORCA } from '../data/combatData';

const QualidadePage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Qualidade da Arma</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Qualidade</th>
              <th className="text-center p-2 text-gray-300">Mult Tempo</th>
              <th className="text-center p-2 text-gray-300">Mult Dano</th>
              <th className="text-center p-2 text-gray-300">HAB Req</th>
            </tr>
          </thead>
          <tbody>
            {QUALIDADE_ARMA.map((q, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white font-semibold">{q.nome}</td>
                <td className="p-2 text-center text-cyan-400">×{q.multTempo.toFixed(2)}</td>
                <td className="p-2 text-center text-red-400">×{q.multDano.toFixed(1)}</td>
                <td className="p-2 text-center text-yellow-400">{q.habReq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Aproveitamento</h3>
        <p className="text-gray-300 mb-3">Arma boa só rende se tiver habilidade:</p>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400 whitespace-pre-line mb-4">
          {APROVEITAMENTO_FORMULA}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Qualidade</th>
              <th className="text-center p-2 text-gray-300">HAB 30</th>
              <th className="text-center p-2 text-gray-300">HAB 50</th>
              <th className="text-center p-2 text-gray-300">HAB 70</th>
              <th className="text-center p-2 text-gray-300">HAB 90</th>
            </tr>
          </thead>
          <tbody>
            {APROVEITAMENTO_TABELA.map((a, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white font-semibold">{a.qualidade}</td>
                <td className="p-2 text-center text-cyan-400">×{a.hab30.toFixed(2)}</td>
                <td className="p-2 text-center text-cyan-400">×{a.hab50.toFixed(2)}</td>
                <td className="p-2 text-center text-cyan-400">×{a.hab70.toFixed(2)}</td>
                <td className="p-2 text-center text-cyan-400">×{a.hab90.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-yellow-400 mb-3">Penalidade de Força</h3>
        <p className="text-gray-300 mb-2">Se FOR &lt; FOR_Req da arma:</p>
        <div className="bg-gray-900 p-3 rounded font-mono text-green-400 mb-4">
          {PENALIDADE_FORCA.formula}
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2 text-gray-300">Diferença</th>
              <th className="text-center p-2 text-gray-300">Penalidade</th>
            </tr>
          </thead>
          <tbody>
            {PENALIDADE_FORCA.tabela.map((p, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white">{p.diferenca} abaixo</td>
                <td className="p-2 text-center text-red-400">×{p.penalidade.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QualidadePage;
