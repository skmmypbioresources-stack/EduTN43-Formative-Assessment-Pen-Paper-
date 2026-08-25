import React, { useState } from 'react';
import { BankQuestionItem } from '../data/questionBank';
import { StorageService } from '../services/storageService';
import { BookOpen, Search, Filter, PlusCircle, CheckCircle2, Layers } from 'lucide-react';

interface QuestionBankModalProps {
  onSelectQuestion?: (question: BankQuestionItem) => void;
  onClose?: () => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({ onSelectQuestion, onClose }) => {
  const [bankItems] = useState<BankQuestionItem[]>(StorageService.getQuestionBank());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('All');
  const [selectedCommandTerm, setSelectedCommandTerm] = useState<string>('All');

  const filteredItems = bankItems.filter((item) => {
    const matchesSearch =
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.learningObjective.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCurr = selectedCurriculum === 'All' || item.curriculum === selectedCurriculum;
    const matchesCmd = selectedCommandTerm === 'All' || item.commandTerm === selectedCommandTerm;
    return matchesSearch && matchesCurr && matchesCmd;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Curriculum Question Repository & Bank
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Peer-reviewed, curriculum-verified science formative questions with defensible mark schemes.
          </p>
        </div>

        {onClose && (
          <button onClick={onClose} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
            Close
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search topic, learning objective..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <select
            value={selectedCurriculum}
            onChange={(e) => setSelectedCurriculum(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="All">All Curricula</option>
            <option value="IBMYP">IBMYP</option>
            <option value="IGCSE">IGCSE</option>
            <option value="IBDP">IBDP</option>
          </select>
        </div>

        <div>
          <select
            value={selectedCommandTerm}
            onChange={(e) => setSelectedCommandTerm(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="All">All Command Terms</option>
            <option value="Explain">Explain</option>
            <option value="Evaluate">Evaluate</option>
            <option value="Describe">Describe</option>
            <option value="Design">Design</option>
            <option value="Calculate">Calculate</option>
          </select>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                  {item.curriculum} • {item.yearGroup}
                </span>
                <span className="text-xs font-bold text-slate-900">{item.topic}</span>
                <span className="text-[11px] text-slate-500">({item.subject})</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-slate-100 px-2.5 py-0.5 rounded text-slate-700">
                  {item.maxMarks} Marks
                </span>
                {onSelectQuestion && (
                  <button
                    onClick={() => onSelectQuestion(item)}
                    className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Use in Formative
                  </button>
                )}
              </div>
            </div>

            {item.context && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                <strong>Context:</strong> {item.context}
              </div>
            )}

            <div className="text-sm font-medium text-slate-900 leading-relaxed">{item.prompt}</div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
              <div className="font-bold text-slate-700">Mark Scheme Points:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                {item.markScheme.points.map((p, i) => (
                  <li key={i}>
                    <strong className="text-blue-700">[{p.marks} mark]:</strong> {p.point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-4">
              <span>Author: {item.author}</span>
              <span>Times Used: {item.timesUsed}</span>
              <span>Quality Rating: ★ {item.qualityRating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
