import React, { useState } from 'react';
import {
  FormativeAssessment,
  Question,
  DatasetSpec,
  TableSpec,
} from '../types';
import {
  Sparkles,
  Edit3,
  Trash2,
  Copy,
  Plus,
  Play,
  Share2,
  CheckCircle2,
  FileCheck,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Lock,
  Image as ImageIcon,
  ZoomIn,
  Send,
  Save,
  Check,
  ExternalLink,
  Home,
  RefreshCw,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { QuestionImageEditor } from './QuestionImageEditor';
import { ImageLightboxModal } from './ImageLightboxModal';
import { ScienceGraphViewer } from './ScienceGraphViewer';
import { DataAndGraphEditorModal } from './DataAndGraphEditorModal';
import { CURRICULA } from '../data/curricula';

interface AssessmentReviewProps {
  assessment: FormativeAssessment;
  onUpdateAssessment: (updated: FormativeAssessment) => void;
  onSaveDraft: (assessment: FormativeAssessment) => void;
  onPublish: (assessment: FormativeAssessment) => void;
  onPreviewStudentMode: () => void;
  onBack: () => void;
}

export const AssessmentReview: React.FC<AssessmentReviewProps> = ({
  assessment,
  onUpdateAssessment,
  onSaveDraft,
  onPublish,
  onPreviewStudentMode,
  onBack,
}) => {
  const [currentAssessment, setCurrentAssessment] = useState<FormativeAssessment>(assessment);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [editedExpectedAnswer, setEditedExpectedAnswer] = useState<string>('');
  const [editedMarks, setEditedMarks] = useState<number>(2);

  // Publish state & modal
  const [showPublishSuccessModal, setShowPublishSuccessModal] = useState<boolean>(false);
  const [savedDraftToast, setSavedDraftToast] = useState<boolean>(false);

  // Question Image Editor State
  const [imageEditorQuestion, setImageEditorQuestion] = useState<Question | null>(null);
  const [customQuestionImageData, setCustomQuestionImageData] = useState<{
    imageUrl?: string;
    imageCaption?: string;
    imageAlt?: string;
  } | null>(null);
  const [showCustomImageEditor, setShowCustomImageEditor] = useState<boolean>(false);

  // Data and Graph Editor State
  const [dataEditorQuestion, setDataEditorQuestion] = useState<Question | null>(null);

  // Lightbox Zoom State
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>(undefined);
  const [lightboxAlt, setLightboxAlt] = useState<string | undefined>(undefined);

  // New question modal state
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customCommandTerm, setCustomCommandTerm] = useState<string>('Explain');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customExpected, setCustomExpected] = useState<string>('');
  const [customMarks, setCustomMarks] = useState<number>(3);

  // Regenerate single question state
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regenerateModalQuestion, setRegenerateModalQuestion] = useState<Question | null>(null);
  const [regenerateTeacherGuidance, setRegenerateTeacherGuidance] = useState<string>('');
  const [regenerateSuccessToast, setRegenerateSuccessToast] = useState<string | null>(null);

  // Regenerate ENTIRE question paper state
  const [showRegenerateEntireModal, setShowRegenerateEntireModal] = useState<boolean>(false);
  const [regenerateEntireInstructions, setRegenerateEntireInstructions] = useState<string>('');
  const [isRegeneratingEntire, setIsRegeneratingEntire] = useState<boolean>(false);

  const bp = currentAssessment.blueprint;
  const effectiveClassSection =
    bp.classSection && bp.classSection !== 'Grade 9A' ? bp.classSection : bp.yearGroup || 'MYP 2';

  // Metadata / Grade / Section Edit state
  const [showEditMetadataModal, setShowEditMetadataModal] = useState<boolean>(false);
  const [metaYearGroup, setMetaYearGroup] = useState<string>(bp.yearGroup || 'MYP 2');
  const [metaClassSection, setMetaClassSection] = useState<string>(effectiveClassSection);
  const [metaTitle, setMetaTitle] = useState<string>(bp.title || '');
  const [metaAssessmentDate, setMetaAssessmentDate] = useState<string>(bp.assessmentDate || '');
  const [metaTimeLimit, setMetaTimeLimit] = useState<number>(bp.timeLimitMinutes || 45);

  const handleSaveMetadata = () => {
    const updatedBp = {
      ...bp,
      yearGroup: (metaYearGroup as any) || bp.yearGroup || 'MYP 2',
      classSection: metaClassSection.trim() || metaYearGroup || 'MYP 2',
      title: metaTitle.trim() || bp.title,
      assessmentDate: metaAssessmentDate || bp.assessmentDate,
      timeLimitMinutes: Number(metaTimeLimit) || bp.timeLimitMinutes || 45,
    };
    const updatedAssessment: FormativeAssessment = {
      ...currentAssessment,
      title: updatedBp.title,
      blueprint: updatedBp,
      updatedAt: new Date().toISOString(),
    };
    setCurrentAssessment(updatedAssessment);
    onUpdateAssessment(updatedAssessment);
    onSaveDraft(updatedAssessment);
    setShowEditMetadataModal(false);
    setRegenerateSuccessToast('Assessment details and Grade/Section updated successfully!');
    setTimeout(() => setRegenerateSuccessToast(null), 4000);
  };

  // Handle regenerating the entire question paper
  const handleRegenerateEntirePaper = async (customInstructions?: string) => {
    setIsRegeneratingEntire(true);
    try {
      const instructions = customInstructions !== undefined ? customInstructions : regenerateEntireInstructions;
      const prevQuestionPrompts = currentAssessment.questions.map((q) => q.prompt);

      const result = await GeminiService.generateFormative(
        bp,
        instructions,
        prevQuestionPrompts
      );

      if (!result.questions || result.questions.length === 0) {
        throw new Error('No questions returned from assessment generator');
      }

      const newAss: FormativeAssessment = {
        ...currentAssessment,
        title: result.title || currentAssessment.title,
        questions: result.questions,
        updatedAt: new Date().toISOString(),
      };

      setCurrentAssessment(newAss);
      onUpdateAssessment(newAss);
      onSaveDraft(newAss);

      setShowRegenerateEntireModal(false);
      setRegenerateEntireInstructions('');
      setRegenerateSuccessToast(
        `Entire question paper successfully regenerated with ${result.questions.length} fresh questions!`
      );
      setTimeout(() => setRegenerateSuccessToast(null), 4500);
    } catch (e: any) {
      console.error('Failed to regenerate entire question paper:', e);
      alert('Could not regenerate the entire question paper. Please check connection and try again.');
    } finally {
      setIsRegeneratingEntire(false);
    }
  };

  // Handle delete question
  const handleDeleteQuestion = (qId: string) => {
    const updated = currentAssessment.questions
      .filter((q) => q.id !== qId)
      .map((q, i) => ({ ...q, questionNumber: i + 1 }));
    const newAss = { ...currentAssessment, questions: updated, updatedAt: new Date().toISOString() };
    setCurrentAssessment(newAss);
    onUpdateAssessment(newAss);
    onSaveDraft(newAss);
  };

  // Handle duplicate question
  const handleDuplicateQuestion = (q: Question) => {
    const dup: Question = {
      ...q,
      id: `q-dup-${Date.now()}`,
      questionNumber: currentAssessment.questions.length + 1,
      prompt: `${q.prompt} (Copy)`,
    };
    const updated = [...currentAssessment.questions, dup];
    const newAss = { ...currentAssessment, questions: updated, updatedAt: new Date().toISOString() };
    setCurrentAssessment(newAss);
    onUpdateAssessment(newAss);
    onSaveDraft(newAss);
  };

  // Handle single question regeneration with Gemini AI
  const handleRegenerateSingle = async (q: Question, customGuidance?: string) => {
    setRegeneratingId(q.id);
    try {
      const regenerated = await GeminiService.regenerateSingleQuestion(bp, q, customGuidance);
      // Keep question number and ID consistent
      const finalizedQ: Question = {
        ...regenerated,
        id: q.id,
        questionNumber: q.questionNumber,
      };

      const updated = currentAssessment.questions.map((item) => (item.id === q.id ? finalizedQ : item));
      const newAss = { ...currentAssessment, questions: updated, updatedAt: new Date().toISOString() };
      setCurrentAssessment(newAss);
      onUpdateAssessment(newAss);
      onSaveDraft(newAss);

      setRegenerateModalQuestion(null);
      setRegenerateTeacherGuidance('');
      setRegenerateSuccessToast(`Question ${q.questionNumber} successfully regenerated with AI!`);
      setTimeout(() => setRegenerateSuccessToast(null), 3500);
    } catch (e: any) {
      console.error('Failed to regenerate single question:', e);
      alert('Could not regenerate question. Please try again.');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Handle saving image attached to an existing question
  const handleSaveQuestionImage = (imageData: {
    imageUrl?: string;
    imageCaption?: string;
    imageAlt?: string;
  }) => {
    if (!imageEditorQuestion) return;

    const updated = currentAssessment.questions.map((q) =>
      q.id === imageEditorQuestion.id
        ? {
            ...q,
            imageUrl: imageData.imageUrl,
            imageCaption: imageData.imageCaption,
            imageAlt: imageData.imageAlt,
          }
        : q
    );

    const newAss = { ...currentAssessment, questions: updated, updatedAt: new Date().toISOString() };
    setCurrentAssessment(newAss);
    onUpdateAssessment(newAss);
    onSaveDraft(newAss);
    setImageEditorQuestion(null);
  };

  // Handle add custom teacher question
  const handleAddCustomQuestion = () => {
    if (!customPrompt.trim()) return;

    const newQ: Question = {
      id: `q-teacher-${Date.now()}`,
      questionNumber: currentAssessment.questions.length + 1,
      type: 'extended_response',
      commandTerm: customCommandTerm,
      prompt: customPrompt,
      maxMarks: customMarks,
      cognitiveDemand: 'Application',
      learningObjective: bp.learningObjectives?.[0] || bp.topic || 'Curriculum Objective',
      criterion: bp.selectedCriterion,
      strands: bp.selectedStrands,
      expectedAnswer: customExpected,
      imageUrl: customQuestionImageData?.imageUrl,
      imageCaption: customQuestionImageData?.imageCaption,
      imageAlt: customQuestionImageData?.imageAlt,
      markScheme: {
        points: [
          { id: `tmp-1`, point: `Accurate scientific explanation matching: ${customExpected.slice(0, 40)}`, marks: customMarks },
        ],
      },
      isTeacherAuthored: true,
    };

    const updated = [...currentAssessment.questions, newQ];
    const newAss = { ...currentAssessment, questions: updated };
    setCurrentAssessment(newAss);
    onUpdateAssessment(newAss);
    onSaveDraft(newAss);
    setShowAddCustomModal(false);
    setCustomPrompt('');
    setCustomExpected('');
    setCustomQuestionImageData(null);
  };

  // Handle publishing assessment to make it live for students
  const handlePublish = () => {
    const published: FormativeAssessment = {
      ...currentAssessment,
      blueprint: {
        ...currentAssessment.blueprint,
        classSection: effectiveClassSection,
      },
      status: 'Published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentAssessment(published);
    onUpdateAssessment(published);
    onPublish(published);
    setShowPublishSuccessModal(true);
  };

  const handleSaveDraftClick = () => {
    onSaveDraft(currentAssessment);
    setSavedDraftToast(true);
    setTimeout(() => setSavedDraftToast(false), 3000);
  };

  // Calculate total marks
  const totalCalculatedMarks = currentAssessment.questions.reduce((sum, q) => sum + q.maxMarks, 0);
  const isPublished = currentAssessment.status === 'Published';

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Navigation Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-xs flex items-center gap-2 hover:translate-x-[-2px]"
          title="Return to Faculty Dashboard"
        >
          <Home className="w-4 h-4 text-blue-600" />
          <span>&larr; Back to Faculty Dashboard</span>
        </button>

        <div className="text-xs text-slate-500 font-medium">
          Draft Autosaved &bull; {currentAssessment.questions.length} Questions &bull; {totalCalculatedMarks} Total Marks
        </div>
      </div>

      {/* Regeneration Toast */}
      {regenerateSuccessToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{regenerateSuccessToast}</span>
          </div>
          <button
            onClick={() => setRegenerateSuccessToast(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide flex items-center gap-1 ${
                isPublished
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}
            >
              {isPublished ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" /> LIVE & PUBLISHED
                </>
              ) : (
                'DRAFT (NOT YET PUBLISHED)'
              )}
            </span>
            {(() => {
              const displaySection =
                bp.classSection && bp.classSection !== 'Grade 9A' ? bp.classSection : bp.yearGroup || 'MYP 2';
              return (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">
                    Curriculum: <strong className="text-slate-800">{bp.curriculum}</strong> | Grade / Year:{' '}
                    <strong className="text-blue-700 font-bold">{bp.yearGroup || 'MYP 2'}</strong> | Section:{' '}
                    <strong className="text-blue-700 font-bold">{displaySection}</strong> | Rigor:{' '}
                    <strong>{bp.difficultyLevel || 'Standard'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMetaYearGroup(bp.yearGroup || 'MYP 2');
                      setMetaClassSection(displaySection);
                      setMetaTitle(bp.title || '');
                      setMetaAssessmentDate(bp.assessmentDate || '');
                      setMetaTimeLimit(bp.timeLimitMinutes || 45);
                      setShowEditMetadataModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors ml-1 cursor-pointer"
                    title="Edit Grade, Class/Section, Title or Duration without altering questions"
                  >
                    <Edit3 className="w-3 h-3 text-blue-600" />
                    <span>Edit Grade / Details</span>
                  </button>
                </div>
              );
            })()}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{bp.title}</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Topic: <span className="font-semibold text-slate-800">{bp.topic}</span> &bull; {bp.estimatedDurationMinutes || bp.timeLimitMinutes || 45} mins &bull; {currentAssessment.questions.length} Questions &bull; {totalCalculatedMarks} Total Marks
          </p>
          {(bp.keyConcept || bp.globalContext) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {bp.keyConcept && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  Key Concept: {bp.keyConcept}
                </span>
              )}
              {bp.globalContext && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
                  Global Context: {bp.globalContext}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-slate-600" /> Dashboard
          </button>

          <button
            onClick={handleSaveDraftClick}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1"
            title="Save changes to draft without publishing"
          >
            <Save className="w-3.5 h-3.5" />
            {savedDraftToast ? 'Draft Saved!' : 'Save Draft'}
          </button>

          {/* REGENERATE ENTIRE PAPER BUTTON */}
          <button
            type="button"
            onClick={() => setShowRegenerateEntireModal(true)}
            disabled={isRegeneratingEntire}
            className="px-3.5 py-2 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
            title="Regenerate all questions in this paper with your custom instructions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isRegeneratingEntire ? 'animate-spin' : ''}`} />
            <span>{isRegeneratingEntire ? 'Regenerating Paper...' : 'Regenerate Entire Paper'}</span>
          </button>

          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>

          <button
            onClick={onPreviewStudentMode}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
            title="Preview how students will experience this assessment"
          >
            <Play className="w-3.5 h-3.5 text-slate-700" /> Student Preview
          </button>

          {/* PRIMARY PUBLISH TO CLASS BUTTON */}
          <button
            type="button"
            onClick={handlePublish}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all ring-2 ring-emerald-500/30"
          >
            <Send className="w-4 h-4" />
            <span>{isPublished ? 'Update Published Task' : `Publish to Class (${effectiveClassSection})`}</span>
          </button>
        </div>
      </div>

      {/* Security & Lockdown Protection Notice */}
      <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-white flex items-center gap-2">
              Academic Lockdown & Desktop Integrity Active
            </div>
            <p className="text-slate-400">
              Copy/paste is blocked, tab switching is logged in student audits, and assessment is fully installable on Chromebooks, Windows & Mac.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold bg-slate-800 px-3 py-1.5 rounded-lg text-slate-300 border border-slate-700 shrink-0">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Lockdown Ready</span>
        </div>
      </div>

      {/* Questions Stack */}
      <div className="space-y-4">
        {currentAssessment.questions.map((q) => {
          const isEditing = editingQuestionId === q.id;

          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 transition-all hover:border-slate-300"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    {q.questionNumber}
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {q.commandTerm} — {q.type.replace('_', ' ').toUpperCase()}
                  </span>
                  {q.strands && q.strands.length > 0 && (
                    <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      Strands: {q.strands.join(', ')}
                    </span>
                  )}
                  {q.imageUrl && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Diagram Attached
                    </span>
                  )}
                  {q.isTeacherAuthored && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      Teacher-Authored
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                    {q.maxMarks} Mark{q.maxMarks > 1 ? 's' : ''}
                  </span>

                  {/* Edit/Add Graph & Data Table Button */}
                  <button
                    onClick={() => setDataEditorQuestion(q)}
                    title={q.dataset || q.tableData ? 'Edit scientific graph and data table values' : 'Add experimental data table or graph'}
                    className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-semibold ${
                      q.dataset || q.tableData
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">
                      {q.dataset || q.tableData ? 'Edit Graph & Data' : 'Add Graph / Data'}
                    </span>
                  </button>

                  {/* Insert/Edit Diagram Button */}
                  <button
                    onClick={() => setImageEditorQuestion(q)}
                    title={q.imageUrl ? 'Change or remove diagram' : 'Insert question image / diagram'}
                    className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-semibold ${
                      q.imageUrl
                        ? 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{q.imageUrl ? 'Edit Diagram' : 'Attach Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegenerateModalQuestion(q);
                      setRegenerateTeacherGuidance('');
                    }}
                    disabled={regeneratingId === q.id}
                    title="Regenerate this question with AI"
                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded flex items-center gap-1 text-xs font-semibold"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${regeneratingId === q.id ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
                    <span className="hidden sm:inline">{regeneratingId === q.id ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateQuestion(q)}
                    title="Duplicate"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditingQuestionId(null);
                      } else {
                        setEditingQuestionId(q.id);
                        setEditedPrompt(q.prompt);
                        setEditedExpectedAnswer(q.expectedAnswer);
                        setEditedMarks(q.maxMarks);
                      }
                    }}
                    title="Edit"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    title="Delete"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editing Mode */}
              {isEditing ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Question Prompt</label>
                    <textarea
                      rows={3}
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      className="w-full border rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Expected Answer / Mark Scheme</label>
                    <textarea
                      rows={2}
                      value={editedExpectedAnswer}
                      onChange={(e) => setEditedExpectedAnswer(e.target.value)}
                      className="w-full border rounded p-2 text-xs"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Marks:</label>
                      <input
                        type="number"
                        value={editedMarks}
                        onChange={(e) => setEditedMarks(Number(e.target.value))}
                        className="w-16 border rounded p-1 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingQuestionId(null)}
                        className="text-xs px-3 py-1.5 border rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const updated = currentAssessment.questions.map((item) =>
                            item.id === q.id
                              ? {
                                  ...item,
                                  prompt: editedPrompt,
                                  expectedAnswer: editedExpectedAnswer,
                                  maxMarks: editedMarks,
                                }
                              : item
                          );
                          const newAss = { ...currentAssessment, questions: updated };
                          setCurrentAssessment(newAss);
                          onUpdateAssessment(newAss);
                          onSaveDraft(newAss);
                          setEditingQuestionId(null);
                        }}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded font-bold"
                      >
                        Save Question
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Context if available */}
                  {q.context && (
                    <div className="bg-slate-50 border-l-2 border-slate-400 p-2.5 text-xs text-slate-700 rounded-r">
                      <strong>Scenario / Context:</strong> {q.context}
                    </div>
                  )}

                  {/* Question Image / Diagram Preview */}
                  {q.imageUrl && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Attached Scientific Diagram
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLightboxImageUrl(q.imageUrl!);
                              setLightboxCaption(q.imageCaption);
                              setLightboxAlt(q.imageAlt || `Question ${q.questionNumber} Diagram`);
                            }}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageEditorQuestion(q)}
                            className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setLightboxImageUrl(q.imageUrl!);
                          setLightboxCaption(q.imageCaption);
                          setLightboxAlt(q.imageAlt || `Question ${q.questionNumber} Diagram`);
                        }}
                        className="max-h-56 w-full bg-white rounded border border-slate-200 p-2 flex items-center justify-center cursor-zoom-in overflow-hidden"
                      >
                        <img
                          src={q.imageUrl}
                          alt={q.imageAlt || `Question ${q.questionNumber} Diagram`}
                          className="max-h-48 max-w-full object-contain"
                        />
                      </div>

                      {q.imageCaption && (
                        <p className="text-[11px] text-slate-500 italic text-center">
                          {q.imageCaption}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Prompt */}
                  <div className="text-sm font-medium text-slate-900 leading-relaxed">{q.prompt}</div>

                  {/* Dataset Table & Visual Graph Chart */}
                  {(q.dataset || q.tableData) && (
                    <ScienceGraphViewer
                      dataset={q.dataset}
                      tableData={q.tableData}
                      stimulusImageUrl={q.imageUrl}
                      isDaylight={true}
                    />
                  )}

                  {/* MCQ Options if applicable */}
                  {q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            opt.isCorrect
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>
                            <strong>{opt.id}.</strong> {opt.text}
                          </span>
                          {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Marking Scheme Drawer */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="font-bold text-slate-700 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      Examiner Mark Scheme & Guidance:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                      {q.markScheme.points.map((mp, i) => (
                        <li key={i}>
                          <span className="font-semibold text-blue-700">[{mp.marks} Mark]:</span> {mp.point}
                        </li>
                      ))}
                    </ul>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <strong>Model Answer:</strong> {q.expectedAnswer}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Question Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Add My Own Teacher Question</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Command Term</label>
                <select
                  value={customCommandTerm}
                  onChange={(e) => setCustomCommandTerm(e.target.value)}
                  className="w-full border rounded p-2 text-xs"
                >
                  <option value="Explain">Explain</option>
                  <option value="Describe">Describe</option>
                  <option value="Calculate">Calculate</option>
                  <option value="Evaluate">Evaluate</option>
                  <option value="Design">Design</option>
                  <option value="Suggest">Suggest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Max Marks</label>
                <input
                  type="number"
                  value={customMarks}
                  onChange={(e) => setCustomMarks(Number(e.target.value))}
                  className="w-full border rounded p-2 text-xs"
                  min={1}
                  max={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Question Prompt</label>
              <textarea
                rows={3}
                placeholder="Type your authentic classroom question here..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full border rounded p-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Expected Answer / Mark Scheme</label>
              <textarea
                rows={2}
                placeholder="Expected model response and key marking points..."
                value={customExpected}
                onChange={(e) => setCustomExpected(e.target.value)}
                className="w-full border rounded p-2 text-xs"
              />
            </div>

            {/* Optional Image Insertion in Custom Question */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  {customQuestionImageData?.imageUrl ? 'Diagram Attached' : 'Attach Image / Scientific Diagram (Optional)'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomImageEditor(true)}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  {customQuestionImageData?.imageUrl ? 'Change Image' : '+ Insert Image'}
                </button>
              </div>

              {customQuestionImageData?.imageUrl && (
                <div className="flex items-center gap-3 bg-white p-2 rounded border border-slate-200">
                  <img
                    src={customQuestionImageData.imageUrl}
                    alt={customQuestionImageData.imageAlt || 'Diagram'}
                    className="w-14 h-14 object-contain rounded border"
                  />
                  <div className="text-xs overflow-hidden">
                    <div className="font-semibold text-slate-800 truncate">
                      {customQuestionImageData.imageCaption || 'Diagram ready'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomQuestionImageData(null)}
                      className="text-red-600 text-[11px] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => {
                  setShowAddCustomModal(false);
                  setCustomQuestionImageData(null);
                }}
                className="text-xs px-4 py-2 border rounded font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomQuestion}
                className="text-xs px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Image Editor Modal (for existing question) */}
      {imageEditorQuestion && (
        <QuestionImageEditor
          initialUrl={imageEditorQuestion.imageUrl}
          initialCaption={imageEditorQuestion.imageCaption}
          initialAlt={imageEditorQuestion.imageAlt}
          onSave={handleSaveQuestionImage}
          onCancel={() => setImageEditorQuestion(null)}
        />
      )}

      {/* Question Image Editor Modal (for new custom question) */}
      {showCustomImageEditor && (
        <QuestionImageEditor
          initialUrl={customQuestionImageData?.imageUrl}
          initialCaption={customQuestionImageData?.imageCaption}
          initialAlt={customQuestionImageData?.imageAlt}
          onSave={(data) => {
            setCustomQuestionImageData(data);
            setShowCustomImageEditor(false);
          }}
          onCancel={() => setShowCustomImageEditor(false)}
        />
      )}

      {/* Interactive Lightbox Zoom Modal for Diagrams */}
      {lightboxImageUrl && (
        <ImageLightboxModal
          isOpen={!!lightboxImageUrl}
          imageUrl={lightboxImageUrl}
          imageCaption={lightboxCaption}
          imageAlt={lightboxAlt}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              Ready to assign to {effectiveClassSection}?
              {isPublished && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Live for Students
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {isPublished
                ? `Students in ${effectiveClassSection} can currently see and complete this task on their dashboard.`
                : `Publishing makes this formative assessment instantly visible on all ${effectiveClassSection} student dashboards.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors flex items-center gap-1.5"
            title="Return to Faculty Dashboard"
          >
            <Home className="w-4 h-4 text-blue-400" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={handleSaveDraftClick}
            className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {savedDraftToast ? 'Draft Saved!' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={() => setShowRegenerateEntireModal(true)}
            disabled={isRegeneratingEntire}
            className="px-4 py-2.5 text-xs font-bold text-purple-200 hover:text-white bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            title="Regenerate all questions in this paper with your custom instructions"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${isRegeneratingEntire ? 'animate-spin' : ''}`} />
            <span>{isRegeneratingEntire ? 'Regenerating Paper...' : 'Regenerate Entire Paper'}</span>
          </button>

          <button
            type="button"
            onClick={onPreviewStudentMode}
            className="px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 text-emerald-400" />
            Student Preview
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 transition-all ring-2 ring-emerald-400/40"
          >
            <Send className="w-4 h-4" />
            <span>{isPublished ? 'Update Live Assessment' : `Publish to Class (${effectiveClassSection})`}</span>
          </button>
        </div>
      </div>

      {/* REGENERATE ENTIRE ASSESSMENT MODAL */}
      {showRegenerateEntireModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <RefreshCw className={`w-5 h-5 ${isRegeneratingEntire ? 'animate-spin text-purple-700' : ''}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Regenerate Entire Question Paper
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase">
                      AI Re-Roll
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Replace all {currentAssessment.questions.length} questions with a fresh, curriculum-authentic set.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isRegeneratingEntire}
                onClick={() => setShowRegenerateEntireModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Assessment Specs Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Curriculum</span>
                <span className="font-bold text-slate-800">{bp.curriculum}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Topic</span>
                <span className="font-bold text-blue-900 truncate block" title={bp.topic}>{bp.topic}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Year / Section</span>
                <span className="font-bold text-slate-800">{bp.yearGroup} ({bp.classSection})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Marks</span>
                <span className="font-bold text-emerald-700">{bp.maxMarks || 20} Marks ({bp.targetQuestionCount || 5} Qs)</span>
              </div>
            </div>

            {/* Teacher Guidance / Command Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Teacher's Command / Custom Instructions for New Paper:</span>
                <span className="text-[11px] font-normal text-slate-500">Optional</span>
              </label>

              <textarea
                rows={3}
                value={regenerateEntireInstructions}
                onChange={(e) => setRegenerateEntireInstructions(e.target.value)}
                disabled={isRegeneratingEntire}
                placeholder="E.g., 'Make questions more experimental with realistic datasets', 'Focus on plant cells vs animal cells under osmosis', 'Include structured subparts with calculations', 'Make difficulty more challenging for high-achievers'..."
                className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-hidden leading-relaxed text-slate-800 bg-white"
              />

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Quick Instruction Presets:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '🔬 Focus on experimental design & variables',
                    '📊 Include numerical datasets & rate calculations',
                    '🌿 Real-world unfamiliar biological contexts',
                    '⚡ Higher cognitive rigor & evaluation questions',
                    '✍️ Structured examination subparts with progressive marks',
                    '🎯 Simplified accessible wording for foundational practice',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isRegeneratingEntire}
                      onClick={() => {
                        setRegenerateEntireInstructions((prev) =>
                          prev.trim() ? `${prev.trim()}; ${preset}` : preset
                        );
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-800 text-slate-700 border border-slate-200 transition-colors font-medium text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Note & Action Buttons */}
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-[11px] text-purple-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                The Chief Examiner AI will synthesize <strong>{bp.targetQuestionCount || 5} brand-new questions</strong> summing to exactly <strong>{bp.maxMarks || 20} marks</strong>, avoiding previous duplicates and adhering strictly to your mode and custom commands.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isRegeneratingEntire}
                onClick={() => setShowRegenerateEntireModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRegeneratingEntire}
                onClick={() => handleRegenerateEntirePaper()}
                className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all ring-2 ring-purple-400/30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingEntire ? 'animate-spin' : ''}`} />
                <span>
                  {isRegeneratingEntire
                    ? 'Synthesizing Entire New Paper...'
                    : regenerateEntireInstructions.trim()
                    ? 'Regenerate Paper with Instructions'
                    : 'Regenerate Entire Paper (Instant AI)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI QUESTION REGENERATION MODAL */}
      {regenerateModalQuestion && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Regenerate Question #{regenerateModalQuestion.questionNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Topic: {bp.topic} &bull; {regenerateModalQuestion.maxMarks} Marks &bull; {bp.difficultyLevel || 'Standard'} Rigor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegenerateModalQuestion(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
              <div className="text-slate-500 font-semibold uppercase text-[10px]">Current Question to Replace:</div>
              <p className="text-slate-800 font-medium italic">"{regenerateModalQuestion.prompt}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Optional Teacher Guidance / Tweak Instructions:
              </label>
              <textarea
                rows={3}
                value={regenerateTeacherGuidance}
                onChange={(e) => setRegenerateTeacherGuidance(e.target.value)}
                placeholder="E.g., Make it more conceptual, focus on data analysis from an experiment, use simpler vocabulary for Year 9, or ask about cell membrane permeability..."
                className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Leave empty for an automatic AI replacement strictly aligned to your blueprint syllabus and year-level standards.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRegenerateModalQuestion(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={regeneratingId === regenerateModalQuestion.id}
                onClick={() => handleRegenerateSingle(regenerateModalQuestion, regenerateTeacherGuidance)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl flex items-center gap-2 shadow-md transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${regeneratingId === regenerateModalQuestion.id ? 'animate-spin' : ''}`} />
                <span>
                  {regeneratingId === regenerateModalQuestion.id
                    ? 'Consulting AI Examiner...'
                    : regenerateTeacherGuidance.trim()
                    ? 'Regenerate with Guidance'
                    : 'Instant AI Re-roll'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT METADATA & GRADE MODAL */}
      {showEditMetadataModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Assessment Details & Grade</h3>
                  <p className="text-xs text-slate-500">Update grade or class without changing any questions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditMetadataModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Grade / Year Group</label>
                <select
                  value={metaYearGroup}
                  onChange={(e) => {
                    const newYg = e.target.value;
                    setMetaYearGroup(newYg);
                    if (!metaClassSection || metaClassSection === 'Grade 9A' || metaClassSection === metaYearGroup) {
                      setMetaClassSection(newYg);
                    }
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {(CURRICULA[bp.curriculum]?.yearGroups || ['MYP 1', 'MYP 2', 'MYP 3', 'MYP 4', 'MYP 5']).map(
                    (yg) => (
                      <option key={yg} value={yg}>
                        {yg}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Class / Section</label>
                <input
                  type="text"
                  value={metaClassSection}
                  onChange={(e) => setMetaClassSection(e.target.value)}
                  placeholder="e.g. MYP 2, MYP 2A, 7-Sci"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Students will see this task assigned to this class section.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment Date</label>
                  <input
                    type="date"
                    value={metaAssessmentDate}
                    onChange={(e) => setMetaAssessmentDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={metaTimeLimit}
                    onChange={(e) => setMetaTimeLimit(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowEditMetadataModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMetadata}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH SUCCESS MODAL */}
      {showPublishSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Published & Live
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Assessment Published to Students!
                </h3>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Assessment Title:</span>
                <span className="font-bold text-slate-900">{bp.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Assigned Class Section:</span>
                <span className="font-bold text-blue-700">{effectiveClassSection}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Subject & Topic:</span>
                <span className="font-medium text-slate-800">{bp.subject} • {bp.topic}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Questions & Marks:</span>
                <span className="font-medium text-slate-800">{currentAssessment.questions.length} Questions ({totalCalculatedMarks} Marks)</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Student Access Active:</span> Students in <strong>{effectiveClassSection}</strong> can now view and start this formative task directly from their Student Dashboard under <strong>{bp.subject}</strong>.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishSuccessModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPublishSuccessModal(false);
                  onPreviewStudentMode();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Test as Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPublishSuccessModal(false);
                  onBack();
                }}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                Back to Dashboard &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data & Graph Editor Modal */}
      {dataEditorQuestion && (
        <DataAndGraphEditorModal
          initialDataset={dataEditorQuestion.dataset}
          initialTableData={dataEditorQuestion.tableData}
          onClose={() => setDataEditorQuestion(null)}
          onSave={(updatedDataset?: DatasetSpec, updatedTableData?: TableSpec) => {
            const updatedQuestions = currentAssessment.questions.map((item) =>
              item.id === dataEditorQuestion.id
                ? {
                    ...item,
                    dataset: updatedDataset,
                    tableData: updatedTableData,
                  }
                : item
            );
            const newAssessment = { ...currentAssessment, questions: updatedQuestions };
            setCurrentAssessment(newAssessment);
            onUpdateAssessment(newAssessment);
            onSaveDraft(newAssessment);
            setDataEditorQuestion(null);
            setRegenerateSuccessToast('Question graph and data table updated with 100% precision!');
            setTimeout(() => setRegenerateSuccessToast(null), 3500);
          }}
        />
      )}
    </div>
  );
};
