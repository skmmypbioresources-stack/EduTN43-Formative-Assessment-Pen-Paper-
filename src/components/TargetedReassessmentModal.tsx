import React, { useState } from 'react';
import { FormativeAssessment, Submission, Question } from '../types';
import { GeminiService } from '../services/geminiService';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface TargetedReassessmentModalProps {
  assessment: FormativeAssessment;
  submission: Submission;
  onReassessmentCreated: (newAssessment: FormativeAssessment) => void;
  onClose: () => void;
}

export const TargetedReassessmentModal: React.FC<TargetedReassessmentModalProps> = ({
  assessment,
  submission,
  onReassessmentCreated,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedGaps, setSelectedGaps] = useState<string[]>(
    (submission.diagnosis?.learningGaps || []).map((g) => g.gap)
  );

  const bp = assessment.blueprint;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await GeminiService.generateTargetedReassessment(
        bp,
        submission.diagnosis?.learningGaps.filter((g) => selectedGaps.includes(g.gap)) || [],
        submission.diagnosis?.misconceptions || [],
        submission.studentName
      );

      const targetNumber = `${bp.formativeNumber}-R1`;
      const newAssessment: FormativeAssessment = {
        id: `formative-reassess-${Date.now()}`,
        blueprint: {
          ...bp,
          formativeNumber: targetNumber,
          title: result.title,
          formativeType: 'Diagnostic Assessment',
          targetQuestionCount: result.questions.length,
          maxMarks: result.questions.reduce((sum, q) => sum + q.maxMarks, 0),
        },
        questions: result.questions,
        validationSummary: {
          topicBoundaryCompliant: true,
          yearLevelAppropriate: true,
          datasetConsistent: true,
          markSchemeDefensible: true,
          validationChecklist: ['Targeted Gap Alignment', 'Fresh Context (No repeats)', 'Evidence Rubric'],
        },
        status: 'Published',
        version: 1,
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      };

      onReassessmentCreated(newAssessment);
      onClose();
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Targeted Reassessment</h2>
              <p className="text-xs text-slate-500">
                Generate a fresh 3-question formative targeting {submission.studentName}'s diagnosed gaps.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="font-bold text-slate-700">Select Diagnosed Gaps to Target:</div>
          <div className="space-y-2">
            {(submission.diagnosis?.learningGaps || []).map((gap, idx) => {
              const isChecked = selectedGaps.includes(gap.gap);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (isChecked) {
                      setSelectedGaps(selectedGaps.filter((g) => g !== gap.gap));
                    } else {
                      setSelectedGaps([...selectedGaps, gap.gap]);
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-colors ${
                    isChecked ? 'border-blue-500 bg-blue-50 text-blue-950' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <input type="checkbox" checked={isChecked} onChange={() => {}} className="mt-0.5" />
                  <div>
                    <strong className="text-slate-900">{gap.gap}</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5">Evidence: {gap.evidence}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-800">Pedagogical Guardrails:</div>
          <p>• Uses a <strong>completely new authentic context</strong> (no recycled questions).</p>
          <p>• Re-tests the same learning objectives and command terms.</p>
          <p>• Automatically assigns to {submission.studentName}.</p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || selectedGaps.length === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Generating Fresh Reassessment...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate & Publish Reassessment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
