import React, { useState } from 'react';
import { FormativeAssessment, Submission, UserProfile, Question } from '../types';
import { ScienceGraphViewer } from './ScienceGraphViewer';
import { GeminiService } from '../services/geminiService';
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Send,
  AlertTriangle,
  FileText,
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  Layers,
  Award,
  Loader2,
} from 'lucide-react';

interface TeacherMarkingViewProps {
  assessment: FormativeAssessment;
  submission: Submission;
  activeTeacher: UserProfile;
  onSaveDraft: (updatedSubmission: Submission) => Promise<void> | void;
  onPublishFeedback: (updatedSubmission: Submission) => Promise<void> | void;
  onBack: () => void;
}

export const TeacherMarkingView: React.FC<TeacherMarkingViewProps> = ({
  assessment,
  submission,
  activeTeacher,
  onSaveDraft,
  onPublishFeedback,
  onBack,
}) => {
  const existingDraft = submission.teacherMarkingDraft;
  const existingPublished = submission.teacherFeedback;

  // Initialize marks and comments from draft or published feedback
  const initialQuestionFeedback: Record<string, { marksAwarded?: number; comment: string }> = {};
  assessment.questions.forEach((q) => {
    const draft = existingDraft?.questionFeedback?.[q.id];
    const pub = existingPublished?.questionFeedback?.[q.id];
    initialQuestionFeedback[q.id] = {
      marksAwarded: draft?.marksAwarded ?? pub?.marksAwarded ?? undefined,
      comment: draft?.comment ?? pub?.comment ?? '',
    };
  });

  const [questionFeedback, setQuestionFeedback] = useState<
    Record<string, { marksAwarded?: number; comment: string }>
  >(initialQuestionFeedback);

  const [overallComment, setOverallComment] = useState<string>(
    existingDraft?.overallComment ?? existingPublished?.overallComment ?? ''
  );
  const [strengthsText, setStrengthsText] = useState<string>(
    existingDraft?.strengths?.join('\n') ?? existingPublished?.strengths?.join('\n') ?? ''
  );
  const [priorityTarget, setPriorityTarget] = useState<string>(
    existingDraft?.priorityImprovementTarget ?? existingPublished?.priorityImprovementTarget ?? ''
  );

  const [isAiMarking, setIsAiMarking] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  const bp = assessment.blueprint;
  const totalMaxMarks = assessment.questions.reduce((sum, q) => sum + (q.maxMarks || 2), 0);

  // Auto-evaluate with AI examiner on teacher command
  const handleRunAiExaminer = async () => {
    setIsAiMarking(true);
    setErrorMessage('');
    try {
      const marking = await GeminiService.markSubmission(
        assessment,
        submission.responses || {},
        submission.studentName || 'Student'
      );

      const aiQuestionFeedback: Record<string, { marksAwarded?: number; comment: string }> = {};
      assessment.questions.forEach((q) => {
        const result = marking.markingResults?.[q.id];
        aiQuestionFeedback[q.id] = {
          marksAwarded: result?.marksAwarded ?? 0,
          comment: result?.feedback || result?.rubricLevelJustification || '',
        };
      });

      setQuestionFeedback(aiQuestionFeedback);
      if (marking.diagnosis?.demonstratedStrengths?.length) {
        setStrengthsText(marking.diagnosis.demonstratedStrengths.join('\n'));
      }
      if (marking.diagnosis?.priorityImprovementTarget) {
        setPriorityTarget(marking.diagnosis.priorityImprovementTarget);
      }
      if (marking.diagnosis?.learningGaps?.length) {
        const summaryGaps = marking.diagnosis.learningGaps
          .map((g) => `• ${g.gap}: ${g.actionableNextStep}`)
          .join('\n');
        setOverallComment(
          `AI Examiner Evaluation:\nOverall MYP Achievement Level: ${marking.mypLevel}/8\n\nKey Recommendations:\n${summaryGaps}`
        );
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e: any) {
      console.error('AI marking assistant error:', e);
      setErrorMessage('AI marking assistant could not evaluate responses. You can still mark manually.');
    } finally {
      setIsAiMarking(false);
    }
  };

  // Calculate current running total
  const currentTotal = assessment.questions.reduce((sum, q) => {
    const m = questionFeedback[q.id]?.marksAwarded;
    return sum + (typeof m === 'number' && !isNaN(m) ? m : 0);
  }, 0);

  const handleMarkChange = (qId: string, value: string, maxMarks: number) => {
    let numVal: number | undefined = undefined;
    if (value.trim() !== '') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        numVal = Math.min(Math.max(0, parsed), maxMarks);
      }
    }
    setQuestionFeedback((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        marksAwarded: numVal,
      },
    }));
  };

  const handleCommentChange = (qId: string, comment: string) => {
    setQuestionFeedback((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        comment,
      },
    }));
  };

  // Save Draft (remains in Pending Teacher Review)
  const handleSaveDraftClick = async () => {
    setSaveStatus('saving');
    setErrorMessage('');
    try {
      const updatedDraft = {
        questionFeedback,
        overallComment,
        strengths: strengthsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        priorityImprovementTarget: priorityTarget.trim() || undefined,
        markedById: activeTeacher.id,
        markedByName: activeTeacher.name,
        updatedAt: new Date().toISOString(),
      };

      const updatedSub: Submission = {
        ...submission,
        status: submission.status === 'Marked' ? 'Marked' : 'Pending Teacher Review',
        teacherMarkingDraft: updatedDraft,
      };

      await onSaveDraft(updatedSub);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save marking draft.');
    }
  };

  // Publish to Student
  const handlePublishClick = async () => {
    setErrorMessage('');

    // Validation: Ensure every question has a valid mark awarded
    const missingMarkQuestions: number[] = [];
    const invalidMarkQuestions: number[] = [];

    assessment.questions.forEach((q) => {
      const m = questionFeedback[q.id]?.marksAwarded;
      if (m === undefined || isNaN(m)) {
        missingMarkQuestions.push(q.questionNumber);
      } else if (m < 0 || m > q.maxMarks) {
        invalidMarkQuestions.push(q.questionNumber);
      }
    });

    if (missingMarkQuestions.length > 0) {
      setErrorMessage(
        `Please award marks for all questions before publishing (Missing Q: ${missingMarkQuestions.join(', ')}).`
      );
      return;
    }

    if (invalidMarkQuestions.length > 0) {
      setErrorMessage(
        `Marks for questions must be between 0 and maximum marks (Invalid Q: ${invalidMarkQuestions.join(', ')}).`
      );
      return;
    }

    setSaveStatus('saving');
    try {
      const parsedStrengths = strengthsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const finalQuestionFeedback: Record<string, { marksAwarded: number; comment: string }> = {};
      assessment.questions.forEach((q) => {
        finalQuestionFeedback[q.id] = {
          marksAwarded: questionFeedback[q.id]?.marksAwarded ?? 0,
          comment: questionFeedback[q.id]?.comment ?? '',
        };
      });

      const teacherFeedback = {
        questionFeedback: finalQuestionFeedback,
        overallComment: overallComment.trim() || 'Well completed assessment. Review individual questions for feedback.',
        strengths: parsedStrengths.length > 0 ? parsedStrengths : undefined,
        priorityImprovementTarget: priorityTarget.trim() || undefined,
        markedById: activeTeacher.id,
        markedByName: activeTeacher.name,
        publishedAt: new Date().toISOString(),
      };

      const updatedSub: Submission = {
        ...submission,
        status: 'Marked',
        totalMarksAwarded: currentTotal,
        totalMaxMarks: totalMaxMarks,
        teacherFeedback,
        teacherMarkingDraft: undefined, // Clear draft once published
      };

      await onPublishFeedback(updatedSub);
      setPublishSuccess(true);
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to publish marking.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Submissions
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Teacher Marking Suite
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                {submission.status === 'Marked' ? 'Published' : 'Pending Review'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">{bp.title}</h1>
          </div>
        </div>

        {/* Live Score Counter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-center">
            <div className="text-[10px] uppercase font-bold text-slate-300">Total Score</div>
            <div className="text-lg font-extrabold text-white">
              {currentTotal} <span className="text-slate-400 text-xs font-normal">/ {totalMaxMarks}</span>
            </div>
          </div>

          <button
            onClick={handleRunAiExaminer}
            disabled={isAiMarking || saveStatus === 'saving'}
            className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            title="Automatically formulate suggested marks and feedback based on mark schemes"
          >
            {isAiMarking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>AI Marking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Auto-Mark Draft (AI)</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveDraftClick}
            disabled={saveStatus === 'saving' || isAiMarking}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-300 transition-colors"
          >
            <Save className="w-4 h-4 text-slate-600" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handlePublishClick}
            disabled={saveStatus === 'saving' || isAiMarking}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
          >
            <Send className="w-4 h-4" />
            Publish to Student
          </button>
        </div>
      </div>

      {/* Student Details Meta Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-800">
        <div>
          <span className="text-slate-500 font-medium">Student Name:</span>
          <div className="font-bold text-slate-900 text-sm flex items-center gap-1 mt-0.5">
            <User className="w-4 h-4 text-blue-600" /> {submission.studentName}
          </div>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Class / Section:</span>
          <div className="font-bold text-slate-900 text-sm mt-0.5">{submission.classSection || bp.classSection}</div>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Subject & Curriculum:</span>
          <div className="font-bold text-slate-900 text-sm mt-0.5">
            {bp.subject} • {bp.curriculum} ({bp.yearGroup})
          </div>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Submitted At:</span>
          <div className="font-bold text-slate-900 text-sm mt-0.5">
            {new Date(submission.submittedAt).toLocaleDateString()}{' '}
            {new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Error / Success Toast Alerts */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs font-medium p-3.5 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {publishSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Marking published successfully!</strong> Student report is now live with your feedback and score of{' '}
              <strong>
                {currentTotal}/{totalMaxMarks}
              </strong>
              .
            </span>
          </div>
          <button
            onClick={onBack}
            className="text-xs font-bold bg-emerald-700 text-white px-3 py-1 rounded-lg hover:bg-emerald-800"
          >
            Return to Submissions
          </button>
        </div>
      )}

      {/* Question-by-Question Marking Cards */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Student Responses & Teacher Evaluation ({assessment.questions.length} Questions)
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Enter marks and optional targeted comments for each response
          </span>
        </div>

        {assessment.questions.map((q, idx) => {
          const resp = submission.responses?.[q.id];
          const studentAnswerText =
            resp?.textAnswer ||
            (resp?.selectedOptionId ? `Selected Option: ${resp.selectedOptionId}` : '') ||
            (resp?.numericalValue !== undefined ? `Calculated: ${resp.numericalValue}` : '') ||
            'No response submitted.';

          const qFeedback = questionFeedback[q.id] || { marksAwarded: undefined, comment: '' };
          const marksVal = qFeedback.marksAwarded !== undefined ? qFeedback.marksAwarded : '';

          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 transition-all hover:border-slate-300"
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    Q{q.questionNumber}
                  </span>
                  {q.subQuestionLabel && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {q.subQuestionLabel}
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {q.commandTerm}
                  </span>
                  <span className="text-xs font-medium text-slate-500">Max: {q.maxMarks} marks</span>
                </div>

                {/* Mark Input Box */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                  <label className="text-xs font-bold text-slate-700">Award Mark:</label>
                  <input
                    type="number"
                    min={0}
                    max={q.maxMarks}
                    step={0.5}
                    value={marksVal}
                    onChange={(e) => handleMarkChange(q.id, e.target.value, q.maxMarks)}
                    placeholder="0"
                    className="w-16 border-2 border-blue-300 focus:border-blue-600 rounded-md px-2 py-1 text-center font-bold text-sm text-slate-900 bg-white focus:outline-none"
                  />
                  <span className="text-xs font-bold text-slate-600">/ {q.maxMarks}</span>
                </div>
              </div>

              {/* Context / Stimulus if present */}
              {q.context && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">Stimulus / Context:</span>
                  {q.context}
                </div>
              )}

              {/* Dataset Table & Visual Graph Chart if present */}
              {(q.dataset || q.tableData) && (
                <ScienceGraphViewer
                  dataset={q.dataset}
                  tableData={q.tableData}
                  stimulusImageUrl={q.imageUrl}
                  isDaylight={true}
                />
              )}

              {/* Question Prompt */}
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1">
                  Question Prompt:
                </span>
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.prompt}</p>
              </div>

              {/* Student's Actual Answer */}
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-blue-700" />
                    Student's Submitted Answer:
                  </span>
                  <span className="text-[11px] text-blue-700 font-medium">
                    {resp?.timestamp ? new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100 text-sm text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
                  {studentAnswerText}
                </div>
              </div>

              {/* Reference Mark Scheme (For Teacher's Eyes Only) */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-700" />
                    Reference Answer & Mark Scheme (Teacher Reference):
                  </span>
                  <span className="text-[10px] uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Marking Scheme
                  </span>
                </div>

                {q.expectedAnswer && (
                  <p className="text-slate-800 text-xs italic bg-white/80 p-2.5 rounded border border-amber-100">
                    <strong>Model Answer:</strong> {q.expectedAnswer}
                  </p>
                )}

                {q.markScheme?.points && q.markScheme.points.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {q.markScheme.points.map((mp, pIdx) => (
                      <li key={pIdx}>
                        <strong>[{mp.marks} mark]</strong> {mp.point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Teacher's Individual Question Feedback */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teacher Feedback for Question {q.questionNumber} (Optional):
                </label>
                <textarea
                  rows={2}
                  value={qFeedback.comment}
                  onChange={(e) => handleCommentChange(q.id, e.target.value)}
                  placeholder="Provide specific feedback, pointers, or commendations for this answer..."
                  className="w-full border border-slate-300 focus:border-blue-500 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Assessment Feedback & Next Steps */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Overall Teacher Diagnostic Feedback & Guidance
        </h3>

        {/* Overall Comment */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Overall Summary Comment <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
            placeholder="Summarize the student's overall performance, grasp of scientific concepts, and main learning highlights..."
            className="w-full border border-slate-300 focus:border-indigo-500 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Key Strengths */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Key Strengths (One per line)
            </label>
            <textarea
              rows={3}
              value={strengthsText}
              onChange={(e) => setStrengthsText(e.target.value)}
              placeholder="e.g. Precise calculation of percentage change&#10;Clear understanding of osmosis mechanism"
              className="w-full border border-slate-300 focus:border-emerald-500 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Priority Improvement Target */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Priority Improvement Target
            </label>
            <textarea
              rows={3}
              value={priorityTarget}
              onChange={(e) => setPriorityTarget(e.target.value)}
              placeholder="e.g. Practise defining controlled variables vs independent variables in practical evaluations."
              className="w-full border border-slate-300 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons in Bottom Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Marking as: <strong>{activeTeacher.name}</strong> • Total Score:{' '}
            <strong className="text-slate-900 font-bold">
              {currentTotal} / {totalMaxMarks} marks
            </strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraftClick}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-300 transition-colors"
            >
              <Save className="w-4 h-4 text-slate-600" />
              {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={handlePublishClick}
              disabled={saveStatus === 'saving'}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all hover:scale-102"
            >
              <Send className="w-4 h-4" />
              Publish to Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
