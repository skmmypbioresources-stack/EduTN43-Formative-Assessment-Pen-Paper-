import React, { useState } from 'react';
import { FormativeAssessment, Submission, UserProfile } from '../types';
import {
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ScienceGraphViewer } from './ScienceGraphViewer';

interface StudentSubmissionSuccessViewProps {
  assessment: FormativeAssessment;
  submission: Submission;
  activeUser: UserProfile;
  onReturnToDashboard: () => void;
  onViewProgress: () => void;
}

export const StudentSubmissionSuccessView: React.FC<StudentSubmissionSuccessViewProps> = ({
  assessment,
  submission,
  activeUser,
  onReturnToDashboard,
  onViewProgress,
}) => {
  const [showWorkSummary, setShowWorkSummary] = useState<boolean>(false);

  const bp = assessment.blueprint;
  const audit = submission.integrityAudit;
  const answeredCount = Object.keys(submission.responses || {}).filter(
    (qId) => (submission.responses[qId]?.studentAnswerText || '').trim().length > 0
  ).length;
  const totalQuestions = assessment.questions.length;

  const formattedDate = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString();

  const formattedTime = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : new Date().toLocaleTimeString();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Main Success Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden text-center">
        {/* Top celebratory accent bar */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 h-3 w-full" />

        <div className="p-8 sm:p-12 space-y-6">
          {/* Animated checkmark icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-11 h-11 text-emerald-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs font-bold">
              ✓
            </div>
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Work Submitted Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Assessment Received & Logged
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your written scientific responses and graph analyses have been securely submitted to your teacher's grading inbox for evaluation.
            </p>
          </div>

          {/* Submission Details Grid */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Task Title
              </span>
              <div className="font-bold text-slate-900 truncate" title={bp.title}>
                {bp.title}
              </div>
              <div className="text-[11px] text-slate-500">
                {bp.subject} • {bp.curriculum}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" /> Student Profile
              </span>
              <div className="font-bold text-slate-900 truncate">
                {submission.studentName || activeUser.name}
              </div>
              <div className="text-[11px] text-slate-500">
                Class: {submission.classSection || bp.classSection || 'MYP 2'}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Time Submitted
              </span>
              <div className="font-bold text-slate-900">{formattedTime}</div>
              <div className="text-[11px] text-slate-500">{formattedDate}</div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" /> Questions Done
              </span>
              <div className="font-bold text-slate-900">
                {answeredCount} of {totalQuestions} answered
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                Status: Pending Teacher Review
              </div>
            </div>
          </div>

          {/* Academic Integrity Badge */}
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 text-left text-xs ${
              audit?.tabSwitchCount === 0 && !audit?.isLockdownViolated
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            {audit?.tabSwitchCount === 0 && !audit?.isLockdownViolated ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-bold">
                {audit?.tabSwitchCount === 0 && !audit?.isLockdownViolated
                  ? 'Session Integrity Verified'
                  : 'Session Integrity Logged'}
              </span>
              <p className="text-[11px] opacity-85 mt-0.5">
                {audit?.tabSwitchCount === 0 && !audit?.isLockdownViolated
                  ? 'Zero tab switches recorded. Test completed under active assessment runner monitoring.'
                  : `${audit?.tabSwitchCount || 0} tab focus changes recorded in submission audit.`}
              </p>
            </div>
          </div>

          {/* Teacher Review Informational Banner */}
          <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-5 text-left text-xs text-blue-950 space-y-2">
            <div className="font-bold text-sm text-blue-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" /> What Happens Next?
            </div>
            <ul className="space-y-1.5 text-blue-800 list-disc list-inside leading-relaxed">
              <li>
                <strong>Teacher Evaluation:</strong> Your teacher ({bp.teacherName || 'Faculty'}) will review your submission against the authentic curriculum mark scheme.
              </li>
              <li>
                <strong>Score & Feedback Publication:</strong> Once marked, your official score, MYP achievement level, and personalized next-step feedback will be unlocked.
              </li>
              <li>
                <strong>Continuous Growth:</strong> You will be able to review your performance and complete self-reflections under the <em>My Progress & Feedback</em> tab.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onReturnToDashboard}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Return to Assigned Formatives
            </button>

            <button
              onClick={onViewProgress}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-indigo-600" /> View My Progress & History
            </button>
          </div>

          {/* Toggle view of submitted answers */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowWorkSummary(!showWorkSummary)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{showWorkSummary ? 'Hide Submitted Responses' : 'Review My Submitted Responses'}</span>
              {showWorkSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Submitted Responses Preview */}
        {showWorkSummary && (
          <div className="bg-slate-50 p-6 sm:p-8 border-t border-slate-200 text-left space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Submitted Answers Summary (Read-Only)
            </h3>

            <div className="space-y-4">
              {assessment.questions.map((q, idx) => {
                const resp = submission.responses?.[q.id];
                const studentAns = resp?.studentAnswerText || 'No response recorded';

                return (
                  <div
                    key={q.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        Question {q.questionNumber}: {q.commandTerm ? `[${q.commandTerm.toUpperCase()}] ` : ''}
                        {q.subtopic || `Part ${idx + 1}`}
                      </span>
                      <span className="text-slate-500 font-semibold">
                        Max: {q.maxMarks} Mark{q.maxMarks !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {q.questionPrompt}
                    </p>

                    {q.dataset && (
                      <div className="my-2">
                        <ScienceGraphViewer dataset={q.dataset} height={180} />
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Your Submitted Response:
                      </span>
                      <div className="text-slate-800 whitespace-pre-wrap font-sans">
                        {studentAns}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
