import React, { useState } from 'react';
import { StudentReflection } from '../types';
import { BookOpen, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';

interface StudentReflectionModalProps {
  initialReflection?: StudentReflection;
  onSaveReflection: (reflection: StudentReflection) => void;
  onClose: () => void;
}

export const StudentReflectionModal: React.FC<StudentReflectionModalProps> = ({
  initialReflection,
  onSaveReflection,
  onClose,
}) => {
  const [q1, setQ1] = useState<string>(
    initialReflection?.whatDidIWell ||
      'I successfully identified the net direction of water movement down the water potential gradient and correctly plotted the values on the graph.'
  );
  const [q2, setQ2] = useState<string>(
    initialReflection?.whatDidIFindDifficult ||
      'I struggled with justifying why the experimental design lacked validity and confused validity with precision.'
  );
  const [q3, setQ3] = useState<string>(
    initialReflection?.whatConceptOrSkillToImprove ||
      'I need to improve my understanding of controlled variables in Criterion B/C and always include proper units.'
  );
  const [q4, setQ4] = useState<string>(
    initialReflection?.whatWillIDoDifferentlyNextTime ||
      'Next time, I will read the command term carefully and write full cause-and-effect explanations instead of one-line answers.'
  );
  const [q5, setQ5] = useState<string>(
    initialReflection?.specificLearningTarget ||
      'Master the distinction between validity and reliability and use water potential terminology consistently.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reflection: StudentReflection = {
      whatDidIWell: q1,
      whatDidIFindDifficult: q2,
      whatConceptOrSkillToImprove: q3,
      whatWillIDoDifferentlyNextTime: q4,
      specificLearningTarget: q5,
      completedAt: new Date().toISOString(),
    };
    onSaveReflection(reflection);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Learning Reflection</h2>
              <p className="text-xs text-slate-500">Reflect on your assessment feedback to lock in your next targets.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. What did I do well?
            </label>
            <textarea
              rows={2}
              value={q1}
              onChange={(e) => setQ1(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. What did I find difficult?
            </label>
            <textarea
              rows={2}
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              3. What specific scientific concept or skill do I need to improve?
            </label>
            <textarea
              rows={2}
              value={q3}
              onChange={(e) => setQ3(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              4. What will I do differently next time?
            </label>
            <textarea
              rows={2}
              value={q4}
              onChange={(e) => setQ4(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-900 mb-1">
              5. My Specific Learning Target for the Next Assessment:
            </label>
            <input
              type="text"
              value={q5}
              onChange={(e) => setQ5(e.target.value)}
              className="w-full border-2 border-purple-300 bg-purple-50/50 rounded-lg p-2 text-xs text-purple-950 font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Reflection Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
