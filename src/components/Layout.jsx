import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  // Se estiver na pagina do jogo, renderiza apenas o children (fullscreen)
  const isGamePage = location.pathname === '/jogo';

  if (isGamePage) {
    return <>{children}</>;
  }

  const links = [
    { path: '/', nome: 'Resumo' },
    { path: '/atributos', nome: 'Atributos' },
    { path: '/ic', nome: 'Indice de Combate' },
    { path: '/armas', nome: 'Armas' },
    { path: '/armaduras', nome: 'Armaduras' },
    { path: '/qualidade', nome: 'Qualidade' },
    { path: '/modificadores', nome: 'Modificadores' },
    { path: '/magia', nome: 'Magia' },
    { path: '/sobrenaturais', nome: 'Sobrenaturais' },
    { path: '/calculadora', nome: 'Calculadora' },
    { path: '/exemplo', nome: 'Exemplo: Marcus' },
    { path: '/jogo', nome: 'Jogo 3D' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg border-b border-yellow-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">Sistema de Combate RPG</h1>
          <p className="text-gray-400 text-sm">Guia Completo v3 - Tempo Continuo em Milissegundos</p>
        </div>
      </header>

      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto py-2 gap-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded whitespace-nowrap text-sm font-medium transition-colors
                  ${location.pathname === link.path
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {link.nome}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-500 text-sm">
          Sistema de Combate RPG v3.0 - Baseado em Tempo Continuo (ms) com Indice de Combate (IC)
        </div>
      </footer>
    </div>
  );
};

export default Layout;
