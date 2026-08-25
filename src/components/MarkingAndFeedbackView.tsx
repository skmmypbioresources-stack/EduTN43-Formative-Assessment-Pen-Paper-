import React, { useState } from 'react';
import {
  FormativeAssessment,
  Submission,
  UserProfile,
  StudentReflection,
  QuestionMarkingResult,
} from '../types';
import { ReportGenerator } from '../services/reportGenerator';
import { StudentReflectionModal } from './StudentReflectionModal';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Target,
  Sparkles,
  Edit2,
  MessageSquare,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Bookmark,
  CheckSquare,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
} from 'lucide-react';

interface MarkingAndFeedbackViewProps {
  assessment: FormativeAssessment;
  submission: Submission;
  activeUser: UserProfile;
  onUpdateSubmission: (submission: Submission) => void;
  onCreateTargetedReassessment?: (submission: Submission) => void;
  onBack: () => void;
}

export const MarkingAndFeedbackView: React.FC<MarkingAndFeedbackViewProps> = ({
  assessment,
  submission,
  activeUser,
  onUpdateSubmission,
  onCreateTargetedReassessment,
  onBack,
}) => {
  const [currentSubmission, setCurrentSubmission] = useState<Submission>(submission);
  const [showReflectionModal, setShowReflectionModal] = useState<boolean>(false);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>(
    assessment.questions.map((q) => q.id)
  );

  // Teacher feedback override state
  const [editingResultQId, setEditingResultQId] = useState<string | null>(null);
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [overrideNotes, setOverrideNotes] = useState<string>('');

  const bp = assessment.blueprint;
  const isTeacher = activeUser.role === 'teacher' || activeUser.role === 'admin';

  const toggleQuestion = (qId: string) => {
    if (expandedQuestionIds.includes(qId)) {
      setExpandedQuestionIds(expandedQuestionIds.filter((id) => id !== qId));
    } else {
      setExpandedQuestionIds([...expandedQuestionIds, qId]);
    }
  };

  const totalAwarded = currentSubmission.totalMarksAwarded ?? 0;
  const totalMax = currentSubmission.totalMaxMarks ?? bp.maxMarks ?? 20;
  const percentage = Math.round((totalAwarded / totalMax) * 100);

  // Handle reflection update
  const handleSaveReflection = (reflection: StudentReflection) => {
    const updated: Submission = {
      ...currentSubmission,
      reflection,
    };
    setCurrentSubmission(updated);
    onUpdateSubmission(updated);
    setShowReflectionModal(false);
  };

  // Handle teacher override
  const handleSaveOverride = (qId: string) => {
    const existing = currentSubmission.markingResults?.[qId];
    if (!existing) return;

    const updatedResult: QuestionMarkingResult = {
      ...existing,
      marksAwarded: overrideScore,
      teacherManualOverride: {
        originalMarks: existing.marksAwarded,
        overriddenMarks: overrideScore,
        teacherNotes: overrideNotes,
        timestamp: new Date().toISOString(),
      },
    };

    const newResults = {
      ...(currentSubmission.markingResults || {}),
      [qId]: updatedResult,
    };

    // recalculate total
    const newTotal = Object.values(newResults).reduce((sum: number, r: QuestionMarkingResult) => sum + r.marksAwarded, 0);

    const updated: Submission = {
      ...currentSubmission,
      totalMarksAwarded: newTotal,
      markingResults: newResults,
    };

    setCurrentSubmission(updated);
    onUpdateSubmission(updated);
    setEditingResultQId(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ReportGenerator.generatePrintableReport(assessment, currentSubmission)}
            className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download Official Report (.PDF)
          </button>
        </div>
      </div>

      {/* Primary Score & Diagnostic Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {bp.curriculum} • {bp.yearGroup} • {bp.subject}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{bp.title}</h1>
            <div className="text-xs text-slate-500 mt-1">
              Student: <strong className="text-slate-800">{currentSubmission.studentName}</strong> (
              {currentSubmission.classSection || bp.classSection}) • Submitted on{' '}
              {new Date(currentSubmission.submittedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Formative Score</div>
              <div className="text-2xl font-bold text-slate-900">
                {totalAwarded} <span className="text-sm font-medium text-slate-500">/ {totalMax} Marks</span>
              </div>
            </div>
            <div className="border-l border-slate-200 pl-4 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Percentage</div>
              <div
                className={`text-xl font-bold ${
                  percentage >= 70 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}
              >
                {percentage}%
              </div>
            </div>
            {currentSubmission.mypOverallAchievementLevel !== undefined && (
              <div className="border-l border-slate-200 pl-4 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">MYP Level</div>
                <div className="text-xl font-bold text-indigo-700">
                  {currentSubmission.mypOverallAchievementLevel} / 8
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Learning Gap Diagnosis & Intervention Targets */}
        {currentSubmission.diagnosis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Strengths */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Demonstrated Strengths
              </h3>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {currentSubmission.diagnosis.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Learning Gaps & Interventions */}
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5 mb-2">
                <Target className="w-4 h-4 text-rose-600" />
                Diagnosed Learning Gaps
              </h3>
              <div className="space-y-2 text-xs">
                {currentSubmission.diagnosis.learningGaps.map((gap, idx) => (
                  <div key={idx} className="bg-white/80 border border-rose-200 rounded-lg p-2 text-rose-950">
                    <div className="font-bold text-rose-900">{gap.gap}</div>
                    <div className="text-[11px] text-slate-700 mt-0.5">
                      <strong>Evidence:</strong> {gap.evidence}
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium mt-1">
                      <strong>Actionable Next Step:</strong> {gap.nextStep}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Identified Scientific Misconceptions */}
        {currentSubmission.diagnosis?.misconceptions && currentSubmission.diagnosis.misconceptions.length > 0 && (
          <div className="mt-4 bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Identified Scientific Misconceptions & Correction Strategies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentSubmission.diagnosis.misconceptions.map((misc, idx) => (
                <div key={idx} className="bg-white border border-amber-200 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="font-bold text-amber-900">
                    Misconception: <span className="text-red-700 font-normal italic">"{misc.misconception}"</span>
                  </div>
                  <div className="text-slate-800">
                    <strong className="text-emerald-800">Scientific Reality:</strong> {misc.scientificTruth}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    <strong>Pedagogical Correction:</strong> {misc.correctionStrategy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Targeted Reassessment & Reflection */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReflectionModal(true)}
              className="text-xs font-bold px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {currentSubmission.reflection ? 'Edit Student Reflection' : 'Complete Student Reflection'}
            </button>

            {currentSubmission.reflection && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reflection Logged
              </span>
            )}
          </div>

          {onCreateTargetedReassessment && (
            <button
              onClick={() => onCreateTargetedReassessment(currentSubmission)}
              className="text-xs font-bold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Targeted Reassessment for this Student
            </button>
          )}
        </div>
      </div>

      {/* Student Reflection Record if present */}
      {currentSubmission.reflection && (
        <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-purple-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Student Metacognitive Reflection Record
            </h3>
            <span className="text-[11px] text-purple-700">
              Completed {new Date(currentSubmission.reflection.completedAt || currentSubmission.reflection.submittedAt || Date.now()).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
              <strong className="text-purple-950">1. What went well:</strong>
              <p className="text-slate-700 mt-0.5">{currentSubmission.reflection.whatDidIWell}</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
              <strong className="text-purple-950">2. What was difficult:</strong>
              <p className="text-slate-700 mt-0.5">{currentSubmission.reflection.whatDidIFindDifficult}</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
              <strong className="text-purple-950">3. Concept/skill to improve:</strong>
              <p className="text-slate-700 mt-0.5">{currentSubmission.reflection.whatConceptOrSkillToImprove}</p>
            </div>
            <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
              <strong className="text-purple-950">4. What to do differently:</strong>
              <p className="text-slate-700 mt-0.5">{currentSubmission.reflection.whatWillIDoDifferentlyNextTime}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-purple-200 text-xs">
            <strong className="text-purple-900">5. Target for Next Assessment:</strong>
            <p className="text-purple-950 font-bold mt-0.5">
              {currentSubmission.reflection.specificLearningTarget}
            </p>
          </div>
        </div>
      )}

      {/* Academic Lockdown & Integrity Audit Report */}
      <div className={`rounded-xl p-5 border shadow-xs transition-all ${
        currentSubmission.integrityAudit && (currentSubmission.integrityAudit.tabSwitchCount > 0 || currentSubmission.integrityAudit.copyPasteAttempts > 0)
          ? 'bg-amber-50/60 border-amber-300'
          : 'bg-emerald-50/60 border-emerald-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 mb-3">
          <div className="flex items-center gap-2">
            {currentSubmission.integrityAudit && (currentSubmission.integrityAudit.tabSwitchCount > 0 || currentSubmission.integrityAudit.copyPasteAttempts > 0) ? (
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-800 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                Examination Academic Integrity & Lockdown Audit
              </h3>
              <p className="text-[11px] text-slate-600">
                Live lockdown telemetry recorded directly during student examination session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              currentSubmission.integrityAudit && (currentSubmission.integrityAudit.tabSwitchCount > 0 || currentSubmission.integrityAudit.copyPasteAttempts > 0)
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}>
              {currentSubmission.integrityAudit && (currentSubmission.integrityAudit.tabSwitchCount > 0 || currentSubmission.integrityAudit.copyPasteAttempts > 0)
                ? `⚠️ ${currentSubmission.integrityAudit.tabSwitchCount} Tab Departures Logged`
                : '🛡️ 100% Clean Lockdown Session'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white/90 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Tab / Window Departures</div>
            <div className="text-lg font-bold text-slate-900">
              {currentSubmission.integrityAudit?.tabSwitchCount || 0}{' '}
              <span className="text-xs font-normal text-slate-500">instances</span>
            </div>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Clipboard Copy / Paste Blocks</div>
            <div className="text-lg font-bold text-slate-900">
              {currentSubmission.integrityAudit?.copyPasteAttempts || 0}{' '}
              <span className="text-xs font-normal text-slate-500">attempts blocked</span>
            </div>
          </div>

          <div className="bg-white/90 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">Fullscreen Integrity</div>
            <div className="text-lg font-bold text-emerald-700">
              {currentSubmission.integrityAudit?.fullscreenExitCount ? `${currentSubmission.integrityAudit.fullscreenExitCount} exits` : 'Maintained'}
            </div>
          </div>
        </div>

        {/* Audit event timeline logs if infractions exist */}
        {currentSubmission.integrityAudit?.logs && currentSubmission.integrityAudit.logs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
            <div className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-600" /> Timestamped Incident Event Log:
            </div>
            <div className="bg-white rounded-lg p-2 border border-slate-200 max-h-32 overflow-y-auto space-y-1 font-mono text-[11px]">
              {currentSubmission.integrityAudit.logs.map((log, lIdx) => (
                <div key={lIdx} className="flex items-start gap-2 text-slate-700">
                  <span className="text-slate-400 shrink-0">[{log.timestamp}]</span>
                  <span className="font-bold text-rose-700 shrink-0">{log.event}:</span>
                  <span className="text-slate-600 truncate">{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Question-by-Question Marking & Evidence */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Question-by-Question Evidence & Examiner Decisions
        </h2>

        {assessment.questions.map((q) => {
          const resp = currentSubmission.responses[q.id];
          const result = currentSubmission.markingResults?.[q.id];
          const isExpanded = expandedQuestionIds.includes(q.id);
          const isEditing = editingResultQId === q.id;

          const marksAwarded = result ? result.marksAwarded : 0;
          const isFull = marksAwarded === q.maxMarks;

          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all"
            >
              {/* Question Banner */}
              <div
                onClick={() => toggleQuestion(q.id)}
                className="p-4 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between border-b border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    {q.questionNumber}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-slate-900">
                      {q.commandTerm} — {q.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      (LO: {q.learningObjective.slice(0, 45)}...)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      isFull
                        ? 'bg-emerald-100 text-emerald-800'
                        : marksAwarded > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {marksAwarded} / {q.maxMarks} Marks
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Question Content & Evidence Details */}
              {isExpanded && (
                <div className="p-5 space-y-4">
                  {/* Prompt */}
                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <strong className="text-slate-900">Prompt:</strong> {q.prompt}
                  </div>

                  {/* Student Response */}
                  <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-3.5 text-xs">
                    <div className="font-bold text-blue-900 mb-1 flex items-center justify-between">
                      <span>Student Response:</span>
                      {resp?.flagged && (
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                          Flagged by Student: {resp.flagReason}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900 font-mono whitespace-pre-wrap leading-relaxed">
                      {resp?.textAnswer || (resp?.selectedOptionId ? `Selected Option: ${resp.selectedOptionId}` : 'No answer submitted.')}
                    </p>
                  </div>

                  {/* Model Answer */}
                  <div className="border border-purple-200 bg-purple-50/40 rounded-lg p-3.5 text-xs">
                    <div className="font-bold text-purple-900 mb-1">Model Expected Response:</div>
                    <p className="text-purple-950 font-mono leading-relaxed">{q.expectedAnswer}</p>
                  </div>

                  {/* Exact Examiner Marking Points (Awarded vs Missing) */}
                  {result?.markingPoints && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                        Examiner Point-by-Point Marking Scheme
                      </div>
                      <div className="space-y-1.5">
                        {result.markingPoints.map((mp, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                              mp.isAwarded
                                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                                : 'border-rose-200 bg-rose-50/60 text-rose-950'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-semibold">
                                {mp.isAwarded ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                                <span>{mp.point}</span>
                              </div>
                              {mp.evidenceFound && (
                                <div className="text-[11px] text-emerald-900 pl-5 italic">
                                  <strong>Evidence Quote:</strong> "{mp.evidenceFound}"
                                </div>
                              )}
                              {mp.missingReason && (
                                <div className="text-[11px] text-rose-800 pl-5">
                                  <strong>Missing Requirement:</strong> {mp.missingReason}
                                </div>
                              )}
                            </div>

                            <span className="font-bold text-xs shrink-0">
                              {mp.isAwarded ? `+${mp.marks}` : '0'} / {mp.marks}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback summary */}
                  {result && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <strong className="text-rose-900">Why Marks Were Lost:</strong>
                        <p className="text-slate-700 mt-1">{result.whyMarksWereLost}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <strong className="text-emerald-900">How to Improve:</strong>
                        <p className="text-slate-700 mt-1">{result.howToImprove}</p>
                      </div>
                    </div>
                  )}

                  {/* Teacher Manual Override / Annotation */}
                  {isTeacher && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {isEditing ? (
                        <div className="w-full bg-slate-50 p-3 rounded-lg border border-blue-200 space-y-2">
                          <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-slate-700">Override Marks:</label>
                            <input
                              type="number"
                              value={overrideScore}
                              onChange={(e) => setOverrideScore(Number(e.target.value))}
                              min={0}
                              max={q.maxMarks}
                              className="w-16 border rounded p-1 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Teacher Feedback Note:</label>
                            <input
                              type="text"
                              value={overrideNotes}
                              onChange={(e) => setOverrideNotes(e.target.value)}
                              placeholder="Add teacher note or reason for adjustment..."
                              className="w-full border rounded p-1.5 text-xs"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingResultQId(null)}
                              className="text-xs px-2.5 py-1 border rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveOverride(q.id)}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded font-bold"
                            >
                              Save Override
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          {result?.teacherManualOverride ? (
                            <div className="text-xs text-purple-700 font-medium">
                              <strong>Teacher Override:</strong> {result.teacherManualOverride.teacherNotes} (Set to{' '}
                              {result.teacherManualOverride.overriddenMarks} marks)
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">AI Examiner Standard Score Applied</span>
                          )}

                          <button
                            onClick={() => {
                              setEditingResultQId(q.id);
                              setOverrideScore(result ? result.marksAwarded : 0);
                              setOverrideNotes(result?.teacherManualOverride?.teacherNotes || '');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Teacher Override Marks
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Student Reflection Modal */}
      {showReflectionModal && (
        <StudentReflectionModal
          initialReflection={currentSubmission.reflection}
          onSaveReflection={handleSaveReflection}
          onClose={() => setShowReflectionModal(false)}
        />
      )}
    </div>
  );
};
