import React, { useState } from 'react';
import {
  FormativeAssessment,
  Question,
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
} from 'lucide-react';
import { QuestionImageEditor } from './QuestionImageEditor';
import { ImageLightboxModal } from './ImageLightboxModal';

interface AssessmentReviewProps {
  assessment: FormativeAssessment;
  onUpdateAssessment: (updated: FormativeAssessment) => void;
  onSaveDraft: (assessment: FormativeAssessment) => void;
  onPreviewStudentMode: () => void;
  onBack: () => void;
}

export const AssessmentReview: React.FC<AssessmentReviewProps> = ({
  assessment,
  onUpdateAssessment,
  onSaveDraft,
  onPreviewStudentMode,
  onBack,
}) => {
  const [currentAssessment, setCurrentAssessment] = useState<FormativeAssessment>(assessment);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [editedExpectedAnswer, setEditedExpectedAnswer] = useState<string>('');
  const [editedMarks, setEditedMarks] = useState<number>(2);

  // Question Image Editor State
  const [imageEditorQuestion, setImageEditorQuestion] = useState<Question | null>(null);
  const [customQuestionImageData, setCustomQuestionImageData] = useState<{
    imageUrl?: string;
    imageCaption?: string;
    imageAlt?: string;
  } | null>(null);
  const [showCustomImageEditor, setShowCustomImageEditor] = useState<boolean>(false);

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

  // Regenerate single question loading state
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const bp = currentAssessment.blueprint;

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

  // Handle single question regeneration
  const handleRegenerateSingle = async (q: Question) => {
    setRegeneratingId(q.id);
    try {
      setTimeout(() => {
        const regenerated: Question = {
          ...q,
          prompt: `[Regenerated] In an authentic laboratory investigation on ${bp.topic}, ${q.commandTerm.toLowerCase()} how variables are systematically controlled and evaluate the resulting data patterns.`,
          expectedAnswer: `Detailed regenerated scientific response matching ${q.learningObjective}.`,
        };
        const updated = currentAssessment.questions.map((item) => (item.id === q.id ? regenerated : item));
        const newAss = { ...currentAssessment, questions: updated };
        setCurrentAssessment(newAss);
        onUpdateAssessment(newAss);
        onSaveDraft(newAss);
        setRegeneratingId(null);
      }, 700);
    } catch (e) {
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
      learningObjective: bp.learningObjectives[0] || bp.topic,
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

  // Calculate total marks
  const totalCalculatedMarks = currentAssessment.questions.reduce((sum, q) => sum + q.maxMarks, 0);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
              {currentAssessment.status.toUpperCase()} DRAFT
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Curriculum: <strong>{bp.curriculum}</strong> | Section: <strong>{bp.classSection}</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{bp.title}</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Topic: <span className="font-semibold text-slate-800">{bp.topic}</span> &bull; {bp.estimatedDurationMinutes} mins &bull; {currentAssessment.questions.length} Questions &bull; {totalCalculatedMarks} Total Marks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            &larr; Blueprint Setup
          </button>

          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Custom Question
          </button>

          <button
            onClick={onPreviewStudentMode}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Play className="w-4 h-4" /> Launch Student Runner
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
                    onClick={() => handleRegenerateSingle(q)}
                    disabled={regeneratingId === q.id}
                    title="Regenerate this question with AI"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Sparkles className={`w-4 h-4 ${regeneratingId === q.id ? 'animate-spin text-blue-600' : ''}`} />
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

                  {/* Dataset Table if data_based */}
                  {q.dataset && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 text-xs">
                      <div className="font-bold text-slate-800 mb-1">{q.dataset.title}</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead>
                            <tr className="border-b bg-slate-100">
                              <th className="p-1.5 font-bold">
                                {q.dataset.xLabel} ({q.dataset.xUnit})
                              </th>
                              <th className="p-1.5 font-bold">
                                {q.dataset.yLabel} ({q.dataset.yUnit})
                              </th>
                              {q.dataset.dataPoints[0]?.trial1 !== undefined && (
                                <>
                                  <th className="p-1.5 font-normal">Trial 1</th>
                                  <th className="p-1.5 font-normal">Trial 2</th>
                                  <th className="p-1.5 font-normal">Trial 3</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {q.dataset.dataPoints.map((dp, idx) => (
                              <tr key={idx} className="border-b border-slate-200">
                                <td className="p-1.5 font-medium">{dp.x}</td>
                                <td className="p-1.5 font-bold text-blue-700">{dp.y}</td>
                                {dp.trial1 !== undefined && (
                                  <>
                                    <td className="p-1.5 text-slate-600">{dp.trial1}</td>
                                    <td className="p-1.5 text-slate-600">{dp.trial2}</td>
                                    <td className="p-1.5 text-slate-600">{dp.trial3}</td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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
    </div>
  );
};
