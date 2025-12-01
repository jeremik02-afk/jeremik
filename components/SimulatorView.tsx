import React, { useState, useEffect, useMemo } from 'react';
import { FunctionType, LinearParams, QuadraticParams, ExponentialParams, DataPoint } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Save, FileDown, Trash2, FolderOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SavedSimulation {
  id: number;
  name: string;
  type: FunctionType;
  params: LinearParams | QuadraticParams | ExponentialParams;
  timestamp: string;
}

const SimulatorView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FunctionType>(FunctionType.LINEAR);
  
  // State for parameters
  const [linear, setLinear] = useState<LinearParams>({ m: 2, n: 1 });
  const [quadratic, setQuadratic] = useState<QuadraticParams>({ a: 1, b: -6, c: 5 });
  const [exponential, setExponential] = useState<ExponentialParams>({ base: 1.5, k: 1 });
  const [range, setRange] = useState<number>(10); // x-axis range +/-

  // Persistence State
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);

  // Load saved simulations on mount
  useEffect(() => {
    const saved = localStorage.getItem('math_sim_configs');
    if (saved) {
      try {
        setSavedSimulations(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading simulations", e);
      }
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('math_sim_configs', JSON.stringify(savedSimulations));
  }, [savedSimulations]);

  // Generate Data based on active function
  const data = useMemo(() => {
    const points: DataPoint[] = [];
    const step = 0.5;
    const start = -Math.abs(range);
    const end = Math.abs(range);

    for (let x = start; x <= end; x += step) {
      let y = 0;
      // Precision fix for floating point loop
      const cleanX = Math.round(x * 10) / 10;

      switch (activeTab) {
        case FunctionType.LINEAR:
          y = linear.m * cleanX + linear.n;
          break;
        case FunctionType.QUADRATIC:
          y = quadratic.a * Math.pow(cleanX, 2) + quadratic.b * cleanX + quadratic.c;
          break;
        case FunctionType.EXPONENTIAL:
          // Avoid complex numbers for negative bases with fractional powers in simplified sim
          if (exponential.base > 0) {
            y = exponential.k * Math.pow(exponential.base, cleanX);
          } else {
             y = NaN;
          }
          break;
      }
      
      // Filter extreme values for graphing sanity
      if (Math.abs(y) < 200) {
        points.push({ x: cleanX, y });
      }
    }
    return points;
  }, [activeTab, linear, quadratic, exponential, range]);

  // Specific Calculations
  const getLinearAnalysis = () => {
    return (
      <ul className="text-sm space-y-1">
        <li>• <strong>Pendiente (m):</strong> {linear.m} ({linear.m > 0 ? 'Creciente' : linear.m < 0 ? 'Decreciente' : 'Constante'})</li>
        <li>• <strong>Ordenada (n):</strong> {linear.n} (Corte con eje Y en {linear.n})</li>
        <li>• <strong>Raíz (Corte X):</strong> {linear.m !== 0 ? (-linear.n / linear.m).toFixed(2) : 'N/A'}</li>
      </ul>
    );
  };

  const getQuadraticAnalysis = () => {
    const vx = -quadratic.b / (2 * quadratic.a);
    const vy = quadratic.a * Math.pow(vx, 2) + quadratic.b * vx + quadratic.c;
    const delta = Math.pow(quadratic.b, 2) - 4 * quadratic.a * quadratic.c;
    
    return (
      <ul className="text-sm space-y-1">
        <li>• <strong>Concavidad:</strong> {quadratic.a > 0 ? 'Convexa ∪' : 'Cóncava ∩'}</li>
        <li>• <strong>Vértice:</strong> ({vx.toFixed(2)}, {vy.toFixed(2)})</li>
        <li>• <strong>Discriminante (Δ):</strong> {delta.toFixed(2)}</li>
        <li>• <strong>Raíces:</strong> {delta < 0 ? 'No reales' : delta === 0 ? vx.toFixed(2) : 
            `${((-quadratic.b + Math.sqrt(delta))/(2*quadratic.a)).toFixed(2)} y ${((-quadratic.b - Math.sqrt(delta))/(2*quadratic.a)).toFixed(2)}`}
        </li>
      </ul>
    );
  };

  const handleSave = () => {
    const name = prompt("Nombre para esta simulación (ej: Caso de Estudio 1):");
    if (!name) return;

    let params;
    if (activeTab === FunctionType.LINEAR) params = linear;
    else if (activeTab === FunctionType.QUADRATIC) params = quadratic;
    else params = exponential;

    const newSim: SavedSimulation = {
      id: Date.now(),
      name,
      type: activeTab,
      params,
      timestamp: new Date().toLocaleDateString()
    };

    setSavedSimulations([...savedSimulations, newSim]);
  };

  const handleLoad = (sim: SavedSimulation) => {
    setActiveTab(sim.type);
    if (sim.type === FunctionType.LINEAR) setLinear(sim.params as LinearParams);
    else if (sim.type === FunctionType.QUADRATIC) setQuadratic(sim.params as QuadraticParams);
    else if (sim.type === FunctionType.EXPONENTIAL) setExponential(sim.params as ExponentialParams);
  };

  const handleDelete = (id: number) => {
    if(confirm("¿Borrar esta simulación guardada?")) {
      setSavedSimulations(savedSimulations.filter(s => s.id !== id));
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Reporte de Simulación Matemática", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);
    
    // Function Details
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    const typeTitle = activeTab === FunctionType.LINEAR ? "Función Lineal" : activeTab === FunctionType.QUADRATIC ? "Función Cuadrática" : "Función Exponencial";
    doc.text(typeTitle, 14, 40);

    let equation = "";
    let paramsText = "";
    
    if (activeTab === FunctionType.LINEAR) {
      equation = `f(x) = ${linear.m}x + ${linear.n}`;
      paramsText = `Pendiente: ${linear.m}, Ordenada: ${linear.n}`;
    } else if (activeTab === FunctionType.QUADRATIC) {
      equation = `f(x) = ${quadratic.a}x² + ${quadratic.b}x + ${quadratic.c}`;
      paramsText = `a: ${quadratic.a}, b: ${quadratic.b}, c: ${quadratic.c}`;
    } else {
      equation = `f(x) = ${exponential.k} · (${exponential.base})^x`;
      paramsText = `k: ${exponential.k}, Base: ${exponential.base}`;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Ecuación: ${equation}`, 14, 50);
    
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Parámetros: ${paramsText}`, 14, 58);

    // Table
    const tableData = data.filter((_, i) => i % 2 === 0).map(p => [p.x.toFixed(1), p.y.toFixed(2)]);
    
    autoTable(doc, {
      startY: 70,
      head: [['X', 'f(x)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
      margin: { top: 70 }
    });

    doc.save(`simulacion_${activeTab}.pdf`);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">Simulador de Funciones</h2>
        <div className="flex bg-slate-200 p-1 rounded-lg mt-2 md:mt-0">
          <button 
            onClick={() => setActiveTab(FunctionType.LINEAR)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === FunctionType.LINEAR ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >Lineal</button>
          <button 
             onClick={() => setActiveTab(FunctionType.QUADRATIC)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === FunctionType.QUADRATIC ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >Cuadrática</button>
          <button 
             onClick={() => setActiveTab(FunctionType.EXPONENTIAL)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === FunctionType.EXPONENTIAL ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
          >Exponencial</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
        {/* Controls Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1 flex flex-col">
          <div className="space-y-4 flex-1">
            <h3 className="font-bold text-lg text-slate-800 border-b pb-2">Parámetros</h3>
            
            {activeTab === FunctionType.LINEAR && (
              <>
                <div className="bg-blue-50 p-3 rounded text-center mb-4">
                  <code className="text-lg text-blue-800 font-bold">f(x) = {linear.m}x {linear.n >= 0 ? '+' : ''} {linear.n}</code>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Pendiente (m)</label>
                  <input type="range" min="-10" max="10" step="0.5" value={linear.m} 
                         onChange={(e) => setLinear({...linear, m: parseFloat(e.target.value)})} className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-400"><span>-10</span><span>{linear.m}</span><span>10</span></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Ordenada al origen (n)</label>
                  <input type="range" min="-10" max="10" step="1" value={linear.n} 
                         onChange={(e) => setLinear({...linear, n: parseFloat(e.target.value)})} className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-400"><span>-10</span><span>{linear.n}</span><span>10</span></div>
                </div>
              </>
            )}

            {activeTab === FunctionType.QUADRATIC && (
              <>
                <div className="bg-purple-50 p-3 rounded text-center mb-4">
                  <code className="text-lg text-purple-800 font-bold">f(x) = {quadratic.a}x² {quadratic.b >= 0 ? '+' : ''}{quadratic.b}x {quadratic.c >= 0 ? '+' : ''}{quadratic.c}</code>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Coeficiente Cuadrático (a)</label>
                  <input type="range" min="-5" max="5" step="0.1" value={quadratic.a} 
                         onChange={(e) => setQuadratic({...quadratic, a: parseFloat(e.target.value)})} className="w-full accent-purple-600" />
                  <div className="text-right text-xs font-bold text-purple-600">{quadratic.a}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Coeficiente Lineal (b)</label>
                  <input type="range" min="-10" max="10" step="0.5" value={quadratic.b} 
                         onChange={(e) => setQuadratic({...quadratic, b: parseFloat(e.target.value)})} className="w-full accent-purple-600" />
                  <div className="text-right text-xs font-bold text-purple-600">{quadratic.b}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Término Independiente (c)</label>
                  <input type="range" min="-10" max="10" step="0.5" value={quadratic.c} 
                         onChange={(e) => setQuadratic({...quadratic, c: parseFloat(e.target.value)})} className="w-full accent-purple-600" />
                  <div className="text-right text-xs font-bold text-purple-600">{quadratic.c}</div>
                </div>
              </>
            )}

            {activeTab === FunctionType.EXPONENTIAL && (
              <>
                <div className="bg-green-50 p-3 rounded text-center mb-4">
                  <code className="text-lg text-green-800 font-bold">f(x) = {exponential.k} · ({exponential.base})^x</code>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Base (a)</label>
                  <input type="range" min="0.1" max="5" step="0.1" value={exponential.base} 
                         onChange={(e) => setExponential({...exponential, base: parseFloat(e.target.value)})} className="w-full accent-green-600" />
                  <div className="text-right text-xs font-bold text-green-600">{exponential.base}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Coeficiente inicial (k)</label>
                  <input type="range" min="0.5" max="10" step="0.5" value={exponential.k} 
                         onChange={(e) => setExponential({...exponential, k: parseFloat(e.target.value)})} className="w-full accent-green-600" />
                  <div className="text-right text-xs font-bold text-green-600">{exponential.k}</div>
                </div>
              </>
            )}

            {/* Analysis Box */}
            <div className="pt-4 border-t">
               <h4 className="font-semibold text-slate-800 mb-2">Análisis Rápido</h4>
               <div className="bg-slate-50 p-3 rounded text-slate-700">
                 {activeTab === FunctionType.LINEAR && getLinearAnalysis()}
                 {activeTab === FunctionType.QUADRATIC && getQuadraticAnalysis()}
                 {activeTab === FunctionType.EXPONENTIAL && (
                   <ul className="text-sm">
                     <li>• <strong>Tipo:</strong> {exponential.base > 1 ? 'Creciente' : 'Decreciente'}</li>
                     <li>• <strong>Corte Eje Y:</strong> {exponential.k}</li>
                     <li>• <strong>Asíntota:</strong> y = 0</li>
                   </ul>
                 )}
               </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
               <button onClick={handleSave} className="flex items-center justify-center gap-2 bg-slate-800 text-white py-2 px-3 rounded text-sm hover:bg-slate-900 transition-colors">
                 <Save size={16} /> Guardar
               </button>
               <button onClick={generatePDF} className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm hover:bg-slate-50 transition-colors">
                 <FileDown size={16} /> PDF
               </button>
            </div>
          </div>

          {/* Saved List */}
          {savedSimulations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FolderOpen size={14} /> Mis Simulaciones
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {savedSimulations.map(sim => (
                  <div key={sim.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50 text-sm group">
                    <button onClick={() => handleLoad(sim)} className="text-left flex-1 truncate text-slate-700 hover:text-blue-600">
                      {sim.name} <span className="text-xs text-slate-400">({sim.type})</span>
                    </button>
                    <button onClick={() => handleDelete(sim.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Graph Area */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 lg:col-span-2 flex flex-col">
          <div className="flex justify-end mb-2">
             <label className="text-xs text-slate-500 mr-2 flex items-center">Zoom Eje X:</label>
             <input type="range" min="5" max="50" value={range} onChange={(e) => setRange(Number(e.target.value))} className="w-32" />
          </div>
          <div className="flex-1 min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  domain={['auto', 'auto']} 
                  tickCount={10}
                  allowDataOverflow={true}
                  stroke="#64748b"
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  allowDataOverflow={true}
                  stroke="#64748b"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#94a3b8" />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  stroke={activeTab === FunctionType.LINEAR ? '#2563eb' : activeTab === FunctionType.QUADRATIC ? '#9333ea' : '#16a34a'} 
                  strokeWidth={3} 
                  dot={false}
                  name="f(x)"
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-xs text-slate-400">
             Use el control deslizante superior para ajustar el zoom del eje X.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulatorView;