import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Resumo from './pages/Resumo';
import AtributosPage from './pages/Atributos';
import IndiceCombate from './pages/IndiceCombate';
import ArmasPage from './pages/Armas';
import ArmadurasPage from './pages/Armaduras';
import QualidadePage from './pages/Qualidade';
import ModificadoresPage from './pages/Modificadores';
import MagiaPage from './pages/Magia';
import SobrenaturaisPage from './pages/Sobrenaturais';
import CalculadoraPage from './pages/Calculadora';
import ExemploPage from './pages/Exemplo';
import JogoPage from './pages/Jogo';

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Resumo />} />
          <Route path="/atributos" element={<AtributosPage />} />
          <Route path="/ic" element={<IndiceCombate />} />
          <Route path="/armas" element={<ArmasPage />} />
          <Route path="/armaduras" element={<ArmadurasPage />} />
          <Route path="/qualidade" element={<QualidadePage />} />
          <Route path="/modificadores" element={<ModificadoresPage />} />
          <Route path="/magia" element={<MagiaPage />} />
          <Route path="/sobrenaturais" element={<SobrenaturaisPage />} />
          <Route path="/calculadora" element={<CalculadoraPage />} />
          <Route path="/exemplo" element={<ExemploPage />} />
          <Route path="/jogo" element={<JogoPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
