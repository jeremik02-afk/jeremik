import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const TheoryView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Conceptos Fundamentales</h2>
        <p className="text-slate-600 text-lg">
          Resumen de la Unidad 4: Tipos de funciones, representaciones y características.
        </p>
      </header>

      {/* Section 1: Representations */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
          1. Formas de Representación
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 mb-2">Tabla de Valores</h4>
            <p className="text-sm text-slate-600">
              Datos recogidos de experimentos. Permite interpolaciones y extrapolaciones.
              <br/><span className="italic text-xs text-slate-400">Ej: Caída de pelota (tiempo vs espacio).</span>
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 mb-2">Expresión Algebraica</h4>
            <p className="text-sm text-slate-600">
              Fórmula matemática que relaciona variables.
              <br/><span className="italic text-xs text-slate-400">Ej: Volumen cilindro y = 9πx</span>
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-800 mb-2">Gráfica</h4>
            <p className="text-sm text-slate-600">
              Visualización directa del fenómeno (electrocardiograma, sismograma).
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Function Types */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-blue-700 mb-4">2. Clasificación de Funciones</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Funciones Algebraicas</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Polinómicas:</span> Definidas por polinomios.
                  <div className="ml-2 mt-1 text-sm bg-blue-50 p-2 rounded text-blue-800">
                    <p><strong>Lineal (Afín):</strong> <code>f(x) = mx + n</code>. Es una recta.</p>
                    <p><strong>Cuadrática:</strong> <code>f(x) = ax² + bx + c</code>. Es una parábola.</p>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Racionales:</span> Cociente de polinomios. Gráfica típica: hipérbola.
                  <br/><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">f(x) = P(x) / Q(x)</code>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Funciones Trascendentes</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Exponencial:</span> La variable está en el exponente.
                  <br/><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">f(x) = a^x</code> (crecimiento/decrecimiento rápido).
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: Definitions */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xl font-bold text-blue-700 mb-4">3. Definiciones Clave</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="border-l-4 border-blue-500 pl-4">
            <h5 className="font-bold text-slate-900">Dominio</h5>
            <p className="text-slate-600">Conjunto de valores que puede tomar la variable independiente (x).</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h5 className="font-bold text-slate-900">Imagen (Rango)</h5>
            <p className="text-slate-600">Conjunto de valores que toma la variable dependiente (y).</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <h5 className="font-bold text-slate-900">Interpolación</h5>
            <p className="text-slate-600">Estimar un valor dentro del intervalo de datos conocidos.</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <h5 className="font-bold text-slate-900">Extrapolación</h5>
            <p className="text-slate-600">Estimar un valor fuera del intervalo de datos conocidos.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TheoryView;