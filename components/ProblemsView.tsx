import React, { useState, useMemo, useEffect } from 'react';
import { DataPoint } from '../types';
import { LineChart, Line, Area, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ReferenceDot, Label } from 'recharts';
import { Car, Snowflake, Activity, Plus, FileDown, Trash2, ChevronRight, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Types for the Dynamic Problem System ---

type ProblemType = 'linear_comparison' | 'exponential_growth' | 'exponential_decay' | 'linear_simple';

interface ProblemModel {
  id: string;
  title: string;
  type: ProblemType;
  description: string;
  isCustom: boolean;
  // Parameters for functions
  params: {
    base?: number;      // For exponential
    initial?: number;   // For exponential k
    slope?: number;     // For linear m
    intercept?: number; // For linear b
    // For comparison (Company A vs B)
    slope2?: number;
    intercept2?: number;
  };
  labels: {
    x: string;
    y: string;
    series1: string;
    series2?: string;
  };
  // Simulation settings
  range: {
    min: number;
    max: number;
    step: number;
    defaultVal: number;
  };
}

// --- Initial Default Problems ---

const DEFAULT_PROBLEMS: ProblemModel[] = [
  {
    id: 'car_rental',
    title: 'Alquiler de Vehículos',
    type: 'linear_comparison',
    description: 'Comparación de costos entre dos compañías según la distancia.',
    isCustom: false,
    params: { slope: 0.5, intercept: 45, slope2: 0.2, intercept2: 60 },
    labels: { x: 'Distancia (km)', y: 'Costo ($)', series1: 'Compañía A', series2: 'Compañía B' },
    range: { min: 0, max: 100, step: 1, defaultVal: 30 }
  },
  {
    id: 'snowball',
    title: 'Bola de Nieve',
    type: 'exponential_growth',
    description: 'Crecimiento de peso de una bola de nieve al rodar (5% por seg).',
    isCustom: false,
    params: { initial: 10, base: 1.05 },
    labels: { x: 'Tiempo (s)', y: 'Peso (kg)', series1: 'Peso' },
    range: { min: 0, max: 30, step: 1, defaultVal: 5 }
  },
  {
    id: 'anesthesia',
    title: 'Concentración Anestesia',
    type: 'exponential_decay',
    description: 'Eliminación de fármaco en sangre (5% por minuto).',
    isCustom: false,
    params: { initial: 100, base: 0.95 },
    labels: { x: 'Tiempo (min)', y: 'Concentración (%)', series1: 'Nivel' },
    range: { min: 0, max: 60, step: 1, defaultVal: 10 }
  }
];

const LOCAL_STORAGE_KEY = 'math_simulator_custom_problems';

const ProblemsView: React.FC = () => {
  // Initialize state by combining defaults with any saved custom problems
  const [problems, setProblems] = useState<ProblemModel[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const customProblems = JSON.parse(saved) as ProblemModel[];
        return [...DEFAULT_PROBLEMS, ...customProblems];
      }
    } catch (error) {
      console.error("Error loading problems from localStorage:", error);
    }
    return DEFAULT_PROBLEMS;
  });

  const [activeId, setActiveId] = useState<string>('car_rental');
  const [inputValue, setInputValue] = useState<number>(30); // Shared state for the slider, updated on problem change
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newProblem, setNewProblem] = useState<Partial<ProblemModel>>({
    type: 'linear_simple',
    range: { min: 0, max: 50, step: 1, defaultVal: 10 },
    labels: { x: 'X', y: 'Y', series1: 'Función' }
  });

  // Save custom problems to localStorage whenever the problems list changes
  useEffect(() => {
    const customProblems = problems.filter(p => p.isCustom);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customProblems));
  }, [problems]);

  // Get current problem
  const activeProblem = useMemo(() => problems.find(p => p.id === activeId) || problems[0], [problems, activeId]);

  // Update input value when switching problems
  useMemo(() => {
    setInputValue(activeProblem.range.defaultVal);
  }, [activeProblem]);

  // --- Data Generation ---
  const data = useMemo(() => {
    const points: DataPoint[] = [];
    const { min, max, step } = activeProblem.range;
    const { type, params } = activeProblem;

    // Extend range slightly for visualization if needed, or keep strict
    for (let x = min; x <= max; x += step) {
      // Avoid floating point infinite loops
      const cleanX = Math.round(x * 100) / 100;
      let val1 = 0;
      let val2 = undefined;

      if (type === 'linear_comparison') {
        val1 = (params.intercept || 0) + (params.slope || 0) * cleanX;
        val2 = (params.intercept2 || 0) + (params.slope2 || 0) * cleanX;
      } else if (type === 'linear_simple') {
        val1 = (params.intercept || 0) + (params.slope || 0) * cleanX;
      } else if (type === 'exponential_growth' || type === 'exponential_decay') {
        val1 = (params.initial || 1) * Math.pow((params.base || 1), cleanX);
      }

      points.push({ x: cleanX, y: val1, y2: val2 });
    }
    return points;
  }, [activeProblem]);

  // --- Calculations for Current State ---
  const currentCalc = useMemo(() => {
    const x = inputValue;
    const { type, params } = activeProblem;
    let val1 = 0;
    let val2 = 0;

    if (type === 'linear_comparison') {
        val1 = (params.intercept || 0) + (params.slope || 0) * x;
        val2 = (params.intercept2 || 0) + (params.slope2 || 0) * x;
    } else if (type === 'linear_simple') {
        val1 = (params.intercept || 0) + (params.slope || 0) * x;
    } else if (type === 'exponential_growth' || type === 'exponential_decay') {
        val1 = (params.initial || 1) * Math.pow((params.base || 1), x);
    }
    return { val1, val2 };
  }, [activeProblem, inputValue]);


  // --- Handlers ---

  const handleAddProblem = () => {
    const id = `custom_${Date.now()}`;
    const p: ProblemModel = {
      id,
      title: newProblem.title || 'Nuevo Problema',
      description: newProblem.description || 'Descripción del problema',
      type: newProblem.type as ProblemType,
      isCustom: true,
      params: {
        slope: Number(newProblem.params?.slope || 1),
        intercept: Number(newProblem.params?.intercept || 0),
        base: Number(newProblem.params?.base || 1.1),
        initial: Number(newProblem.params?.initial || 10),
        slope2: Number(newProblem.params?.slope2 || 1),
        intercept2: Number(newProblem.params?.intercept2 || 0)
      },
      labels: {
        x: newProblem.labels?.x || 'X',
        y: newProblem.labels?.y || 'Y',
        series1: newProblem.labels?.series1 || 'Serie 1',
        series2: newProblem.labels?.series2 || 'Serie 2'
      },
      range: {
        min: 0,
        max: Number(newProblem.range?.max || 50),
        step: 1,
        defaultVal: 0
      }
    };
    setProblems([...problems, p]);
    setActiveId(id);
    setShowModal(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDocs = problems.filter(p => p.id !== id);
    setProblems(newDocs);
    if (activeId === id) setActiveId(newDocs[0].id);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Reporte de Problemas de Funciones", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 30);

    let yPos = 40;

    problems.forEach((prob, index) => {
      // Title
      doc.setFontSize(16);
      doc.setTextColor(0, 80, 200);
      doc.text(`${index + 1}. ${prob.title}`, 14, yPos);
      yPos += 8;

      // Description
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(prob.description, 14, yPos);
      yPos += 10;

      // Parameters
      doc.setFontSize(10);
      let formula = "";
      if (prob.type === 'linear_comparison') {
         formula = `f(x) = ${prob.params.slope}x + ${prob.params.intercept} vs g(x) = ${prob.params.slope2}x + ${prob.params.intercept2}`;
      } else if (prob.type === 'linear_simple') {
         formula = `f(x) = ${prob.params.slope}x + ${prob.params.intercept}`;
      } else {
         formula = `f(x) = ${prob.params.initial} * (${prob.params.base})^x`;
      }
      doc.text(`Modelo Matemático: ${formula}`, 14, yPos);
      yPos += 10;

      // Generate Table Data (Sample of 5-6 points)
      const tableData = [];
      const step = Math.ceil((prob.range.max - prob.range.min) / 5);
      for(let x = prob.range.min; x <= prob.range.max; x += step) {
         let v1, v2;
         const cleanX = x;
         if (prob.type === 'linear_comparison') {
             v1 = (prob.params.intercept || 0) + (prob.params.slope || 0) * cleanX;
             v2 = (prob.params.intercept2 || 0) + (prob.params.slope2 || 0) * cleanX;
             tableData.push([cleanX.toFixed(1), v1.toFixed(2), v2.toFixed(2)]);
         } else if (prob.type === 'linear_simple') {
             v1 = (prob.params.intercept || 0) + (prob.params.slope || 0) * cleanX;
             tableData.push([cleanX.toFixed(1), v1.toFixed(2)]);
         } else {
             v1 = (prob.params.initial || 1) * Math.pow((prob.params.base || 1), cleanX);
             tableData.push([cleanX.toFixed(1), v1.toFixed(2)]);
         }
      }

      const headers = prob.type === 'linear_comparison' 
        ? [prob.labels.x, prob.labels.series1, prob.labels.series2 || 'Serie 2']
        : [prob.labels.x, prob.labels.series1];

      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [66, 133, 244] }
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;
      
      // Page break if needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save('reporte_problemas.pdf');
  };

  return (
    <div className="h-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
      
      {/* Sidebar List */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
           <h3 className="font-bold text-slate-700">Lista de Problemas</h3>
           <p className="text-xs text-slate-500">Selecciona o crea uno nuevo</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {problems.map(p => (
            <div 
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${activeId === p.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {p.id === 'car_rental' && <Car size={18} />}
                {p.id === 'snowball' && <Snowflake size={18} />}
                {p.id === 'anesthesia' && <Activity size={18} />}
                {p.isCustom && <div className="w-4 h-4 rounded-full bg-slate-300 flex-shrink-0" />}
                <span className="text-sm font-medium truncate">{p.title}</span>
              </div>
              {p.isCustom && (
                <button onClick={(e) => handleDelete(p.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 rounded transition-opacity">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 space-y-2">
          <button 
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2 px-4 rounded-lg hover:bg-slate-900 transition-colors text-sm"
          >
            <Plus size={16} /> Crear Problema
          </button>
          <button 
            onClick={generatePDF}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            <FileDown size={16} /> Descargar PDF
          </button>
        </div>
      </div>

      {/* Main Analysis View */}
      <div className="flex-1 flex flex-col h-full space-y-6 overflow-y-auto">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h2 className="text-2xl font-bold text-slate-800">{activeProblem.title}</h2>
               <p className="text-slate-600 mt-1">{activeProblem.description}</p>
             </div>
             <div className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase tracking-wider font-bold">
               {activeProblem.type.replace('_', ' ')}
             </div>
           </div>

           {/* Input Control */}
           <div className="bg-slate-50 p-4 rounded-lg">
             <label className="block text-sm font-medium text-slate-700 mb-2">
               {activeProblem.labels.x}: <span className="text-blue-600 font-bold">{inputValue}</span>
             </label>
             <input 
               type="range" 
               min={activeProblem.range.min} 
               max={activeProblem.range.max} 
               step={activeProblem.range.step} 
               value={inputValue}
               onChange={(e) => setInputValue(Number(e.target.value))}
               className="w-full accent-blue-600"
             />
             <div className="flex justify-between text-xs text-slate-400 mt-1">
               <span>{activeProblem.range.min}</span>
               <span>{activeProblem.range.max}</span>
             </div>
           </div>

           {/* Quick Stats */}
           <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="p-3 border rounded-lg bg-white">
                <div className="text-xs text-slate-500">{activeProblem.labels.series1}</div>
                <div className="text-xl font-bold text-slate-800">{currentCalc.val1.toFixed(2)}</div>
             </div>
             {activeProblem.type === 'linear_comparison' && (
               <div className="p-3 border rounded-lg bg-white">
                 <div className="text-xs text-slate-500">{activeProblem.labels.series2}</div>
                 <div className="text-xl font-bold text-slate-800">{currentCalc.val2.toFixed(2)}</div>
               </div>
             )}
           </div>
        </div>

        {/* Graph */}
        <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="x" 
                label={{ value: activeProblem.labels.x, position: 'insideBottomRight', offset: -5 }} 
                stroke="#64748b"
              />
              <YAxis 
                label={{ value: activeProblem.labels.y, angle: -90, position: 'insideLeft' }} 
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend verticalAlign="top" height={36}/>

              {/* Conditional Rendering for Anesthesia "Graphic" (Area) vs standard Line */}
              {activeId === 'anesthesia' ? (
                <Area 
                  type="monotone" 
                  dataKey="y" 
                  name={activeProblem.labels.series1} 
                  stroke="#e11d48" 
                  fill="#fecdd3"
                  strokeWidth={3} 
                />
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  name={activeProblem.labels.series1} 
                  stroke="#2563eb" 
                  strokeWidth={3} 
                  dot={false} 
                />
              )}
              
              {activeProblem.type === 'linear_comparison' && (
                 <Line 
                  type="monotone" 
                  dataKey="y2" 
                  name={activeProblem.labels.series2} 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={false} 
                />
              )}

              {/* Dynamic Interaction Points */}
              <ReferenceLine x={inputValue} stroke="#94a3b8" strokeDasharray="3 3" />
              <ReferenceDot x={inputValue} y={currentCalc.val1} r={5} fill={activeId === 'anesthesia' ? "#e11d48" : "#2563eb"} stroke="#fff" strokeWidth={2}>
                 <Label value={`${currentCalc.val1.toFixed(1)}`} position="top" fill={activeId === 'anesthesia' ? "#e11d48" : "#2563eb"} fontWeight="bold" />
              </ReferenceDot>

              {activeProblem.type === 'linear_comparison' && (
                <ReferenceDot x={inputValue} y={currentCalc.val2} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2}>
                  <Label value={`${currentCalc.val2.toFixed(1)}`} position="bottom" fill="#ef4444" fontWeight="bold" />
                </ReferenceDot>
              )}

              {/* Special Case: Anesthesia Explanation */}
              {activeId === 'anesthesia' && (
                 <ReferenceDot x={13.5} y={50} r={4} fill="#e11d48" stroke="none">
                   <Label value="50%" position="right" offset={10} fontSize={10} />
                 </ReferenceDot>
              )}
            </ComposedChart>
          </ResponsiveContainer>
          
          {activeId === 'anesthesia' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-slate-700 space-y-3">
               <div>
                  <h4 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
                    <Activity size={16} /> Entendiendo el Decaimiento Exponencial
                  </h4>
                  <p className="mb-2">
                    En farmacología, la eliminación de una droga del torrente sanguíneo a menudo sigue un patrón de 
                    decaimiento exponencial. Esto significa que en lugar de perder una cantidad fija (ej. 5mg) cada minuto, 
                    se pierde un <strong>porcentaje fijo</strong> (5%) de la cantidad restante.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-slate-600">
                    <li>Al principio, la concentración baja rápidamente porque el 5% de una cantidad grande es mucho.</li>
                    <li>Con el tiempo, la curva se aplana, acercándose a cero pero teóricamente sin tocarlo (asíntota).</li>
                  </ul>
               </div>

               <div className="bg-white p-3 rounded border border-blue-100">
                  <h5 className="font-semibold text-blue-800 mb-1">Modelo Matemático</h5>
                  <p className="font-mono bg-slate-100 p-1 rounded inline-block text-slate-800 mb-2">
                    C(t) = C₀ · (base)ᵗ
                  </p>
                  <p>Donde:</p>
                  <ul className="list-disc list-inside ml-2 text-xs text-slate-600 mb-2">
                    <li><strong>C(t):</strong> Concentración en el tiempo t.</li>
                    <li><strong>C₀:</strong> Concentración inicial (100%).</li>
                    <li><strong>base:</strong> (1 - tasa de decaimiento). Si disminuye 5%, la base es 1 - 0.05 = 0.95.</li>
                  </ul>
                  
                  <h5 className="font-semibold text-blue-800 mb-1">Ejemplo de Cálculo (t = 10 min)</h5>
                  <p className="font-mono text-xs">
                    C(10) = 100 · (0.95)¹⁰ <br/>
                    C(10) ≈ 100 · 0.5987 <br/>
                    C(10) ≈ 59.87%
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Añadir Nuevo Problema</h3>
              <button onClick={() => setShowModal(false)}><X className="text-slate-500 hover:text-red-500" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input type="text" className="w-full border rounded p-2" placeholder="Ej: Crecimiento bacteriano"
                   onChange={(e) => setNewProblem({...newProblem, title: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Función</label>
                <select className="w-full border rounded p-2" 
                   onChange={(e) => setNewProblem({...newProblem, type: e.target.value as ProblemType})}>
                  <option value="linear_simple">Lineal Simple (y = mx + n)</option>
                  <option value="linear_comparison">Comparación Lineal (2 funciones)</option>
                  <option value="exponential_growth">Crecimiento Exponencial</option>
                  <option value="exponential_decay">Decaimiento Exponencial</option>
                </select>
              </div>

              {/* Dynamic Parameters Inputs */}
              <div className="bg-slate-50 p-3 rounded border">
                 <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Parámetros Matemáticos</h4>
                 <div className="grid grid-cols-2 gap-3">
                   {(newProblem.type?.includes('linear')) && (
                     <>
                      <div>
                        <label className="text-xs">Pendiente (m)</label>
                        <input type="number" className="w-full border rounded p-1" placeholder="1"
                          onChange={(e) => setNewProblem({...newProblem, params: {...newProblem.params, slope: parseFloat(e.target.value)}})} />
                      </div>
                      <div>
                        <label className="text-xs">Ordenada (n)</label>
                        <input type="number" className="w-full border rounded p-1" placeholder="0"
                          onChange={(e) => setNewProblem({...newProblem, params: {...newProblem.params, intercept: parseFloat(e.target.value)}})} />
                      </div>
                     </>
                   )}
                   {(newProblem.type === 'linear_comparison') && (
                     <>
                      <div>
                        <label className="text-xs">Pendiente 2 (m2)</label>
                        <input type="number" className="w-full border rounded p-1" placeholder="0.5"
                          onChange={(e) => setNewProblem({...newProblem, params: {...newProblem.params, slope2: parseFloat(e.target.value)}})} />
                      </div>
                      <div>
                        <label className="text-xs">Ordenada 2 (n2)</label>
                        <input type="number" className="w-full border rounded p-1" placeholder="10"
                          onChange={(e) => setNewProblem({...newProblem, params: {...newProblem.params, intercept2: parseFloat(e.target.value)}})} />
                      </div>
                     </>
                   )}
                   {(newProblem.type?.includes('exponential')) && (
                     <>
                      <div>
                        <label className="text-xs">Valor Inicial (k)</label>
                        <input type="number" className="w-full border rounded p-1" placeholder="10"
                          onChange={(e) => setNewProblem({...newProblem, params: {...newProblem.params, initial: parseFloat(e.target.value)}})} />
                      </div>
                      <div>
                        <label className="text-xs">Base (a)</label>
                        <input type="number" className="w-full border rounded p-1" placeholder="1.1" step="0.01"
                          onChange={(e) => setNewProblem({...newProblem, params: {...newProblem.params, base: parseFloat(e.target.value)}})} />
                      </div>
                     </>
                   )}
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium mb-1">Rango de Simulación (Eje X)</label>
                 <div className="flex gap-2">
                   <input type="number" className="w-1/2 border rounded p-2" placeholder="Max X (ej: 50)"
                     onChange={(e) => setNewProblem({...newProblem, range: {...newProblem.range!, max: parseFloat(e.target.value)}})} />
                 </div>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded">Cancelar</button>
              <button onClick={handleAddProblem} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Problema</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemsView;