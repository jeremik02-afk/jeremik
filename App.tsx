import React, { useState } from 'react';
import { ViewMode } from './types';
import { BookOpen, Calculator, BrainCircuit, FunctionSquare } from 'lucide-react';
import TheoryView from './components/TheoryView';
import SimulatorView from './components/SimulatorView';
import ProblemsView from './components/ProblemsView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.THEORY);

  const renderContent = () => {
    switch (currentView) {
      case ViewMode.THEORY:
        return <TheoryView />;
      case ViewMode.SIMULATOR:
        return <SimulatorView />;
      case ViewMode.PROBLEMS:
        return <ProblemsView />;
      default:
        return <TheoryView />;
    }
  };

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex md:flex-col">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <FunctionSquare className="text-blue-400 w-8 h-8" />
          <div>
            <h1 className="font-bold text-lg leading-tight">Funciones</h1>
            <p className="text-xs text-slate-400">Unidad 4</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex md:flex-col gap-2 overflow-x-auto">
          <button
            onClick={() => setCurrentView(ViewMode.THEORY)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === ViewMode.THEORY 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BookOpen size={20} />
            <span className="font-medium">Teoría</span>
          </button>
          
          <button
            onClick={() => setCurrentView(ViewMode.SIMULATOR)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === ViewMode.SIMULATOR 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calculator size={20} />
            <span className="font-medium">Simulador</span>
          </button>
          
          <button
            onClick={() => setCurrentView(ViewMode.PROBLEMS)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === ViewMode.PROBLEMS 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BrainCircuit size={20} />
            <span className="font-medium">Problemas Reales</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
          Basado en Documento PDF<br/>Grupo GAKUHAN Panamá
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-50 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;