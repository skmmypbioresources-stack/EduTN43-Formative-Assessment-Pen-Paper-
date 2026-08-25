import React, { useState } from 'react';
import { CURRICULA, MYP_CRITERIA_INFO } from '../data/curricula';
import { ShieldCheck, BookOpen, Layers, CheckCircle2, RefreshCw, Cpu, CheckSquare } from 'lucide-react';

interface AdminDashboardProps {
  onResetSystemData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onResetSystemData }) => {
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('IBMYP');

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Curriculum Administration Console
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Science Assessment Frameworks & Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure IBMYP Criterion descriptors, IGCSE syllabus standards, and strict cognitive bounds.
          </p>
        </div>

        <button
          onClick={onResetSystemData}
          className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All System Seed Data
        </button>
      </div>

      {/* Curriculum Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {['IBMYP', 'IGCSE', 'IBDP'].map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCurriculum(c)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedCurriculum === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {c} Standards
          </button>
        ))}
      </div>

      {/* IBMYP Details */}
      {selectedCurriculum === 'IBMYP' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(MYP_CRITERIA_INFO).map(([critKey, critVal]) => (
              <div key={critKey} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-sm text-slate-900">{critKey}: {critVal.title}</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Max: 8 Levels
                  </span>
                </div>
                <div className="space-y-2">
                  {critVal.strands.map((s) => (
                    <div key={s.id} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-900">{s.id}: {s.title}</strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">{s.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IGCSE Details */}
      {selectedCurriculum === 'IGCSE' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900">IGCSE 0610/0970 Syllabus & Structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg bg-slate-50 text-xs">
              <strong className="text-slate-900">Section A: Multiple Choice</strong>
              <p className="text-slate-600 mt-1">15 questions focusing on precise recall and plausible distractors.</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50 text-xs">
              <strong className="text-slate-900">Section B: Short & Structured</strong>
              <p className="text-slate-600 mt-1">5 multi-part questions using Cambridge command terms.</p>
            </div>
            <div className="p-3 border rounded-lg bg-slate-50 text-xs">
              <strong className="text-slate-900">Section C: Data & Practical</strong>
              <p className="text-slate-600 mt-1">5 data-based questions with rigorous table/graph consistency.</p>
            </div>
          </div>
        </div>
      )}

      {/* IBDP Details */}
      {selectedCurriculum === 'IBDP' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900">IBDP Biology Assessment Objectives (AO1, AO2, AO3)</h3>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 border rounded-lg">
              <strong className="text-slate-900">AO1: Knowledge and Understanding</strong>
              <p className="text-slate-600 mt-0.5">Demonstrate knowledge and understanding of facts, concepts, and terminology.</p>
            </div>
            <div className="p-3 bg-slate-50 border rounded-lg">
              <strong className="text-slate-900">AO2: Application and Analysis</strong>
              <p className="text-slate-600 mt-0.5">Apply facts, concepts, and terminology; analyze methods and datasets.</p>
            </div>
            <div className="p-3 bg-slate-50 border rounded-lg">
              <strong className="text-slate-900">AO3: Synthesis and Evaluation</strong>
              <p className="text-slate-600 mt-0.5">Evaluate hypotheses, experimental research, and scientific limitations.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
