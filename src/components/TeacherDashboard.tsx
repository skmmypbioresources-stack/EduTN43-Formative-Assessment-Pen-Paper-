import React, { useState } from 'react';
import { FormativeAssessment, Submission, UserProfile, Subject, ALL_SUBJECTS, SECURITY_PASSWORDS, DEFAULT_ACADEMIC_YEAR } from '../types';
import {
  PlusCircle,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  FileText,
  Trash2,
  Edit,
  Eye,
  Send,
  Download,
  Lock,
  GraduationCap,
  Layers,
  Filter,
  Radio,
  Link2,
} from 'lucide-react';
import { ReportGenerator } from '../services/reportGenerator';
import { StorageService } from '../services/storageService';

interface TeacherDashboardProps {
  activeTeacher: UserProfile;
  assessments: FormativeAssessment[];
  submissions: Submission[];
  onCreateNew: () => void;
  onEditDraft: (assessment: FormativeAssessment) => void;
  onPublishAssessment?: (assessment: FormativeAssessment) => void;
  onViewMarking: (assessment: FormativeAssessment, submission: Submission) => void;
  onViewAnalytics: () => void;
  onViewStudentWorks: () => void;
  onViewEvidenceLinks?: () => void;
  onViewLiveMonitor?: () => void;
  onDeleteAssessment: (id: string, passwordInput: string) => Promise<{ success: boolean; error?: string }>;
  onLockTeacherMode?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  activeTeacher,
  assessments,
  submissions,
  onCreateNew,
  onEditDraft,
  onPublishAssessment,
  onViewMarking,
  onViewAnalytics,
  onViewStudentWorks,
  onViewEvidenceLinks,
  onViewLiveMonitor,
  onDeleteAssessment,
  onLockTeacherMode,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // Delete / Reconstruct Password Modal State
  const [targetAssessmentForDelete, setTargetAssessmentForDelete] = useState<FormativeAssessment | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Extract unique classes
  const classSections = [
    'FM4',
    'FM5',
    'MYP 2 Science',
    'MYP 4 Bio',
    'MYP 5 Bio',
  ];

  const filteredAssessments = assessments.filter((a) => {
    const normClass = StorageService.normalizeClassSection(a.blueprint.classSection);
    if (selectedSection !== 'All' && normClass !== selectedSection) return false;
    if (selectedSubject !== 'All' && a.blueprint.subject !== selectedSubject) return false;
    return true;
  });

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssessmentForDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    const res = await onDeleteAssessment(targetAssessmentForDelete.id, deletePassword.trim());
    if (res.success) {
      setTargetAssessmentForDelete(null);
      setDeletePassword('');
    } else {
      setDeleteError(res.error || 'Incorrect security password. Must enter DELETETASK.');
    }
    setIsDeleting(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Sciences Faculty Dashboard
            </span>
            <span className="text-xs text-slate-300">Active Teacher: {activeTeacher.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Science Formative Assessment Hub
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Author curriculum-aligned formative assessments, automatically publish to students, review live submissions, and diagnose student learning gaps in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onLockTeacherMode && (
            <button
              onClick={onLockTeacherMode}
              className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-rose-900/70 hover:text-rose-200 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Lock Teacher Dashboard and switch to Student Portal"
            >
              <Lock className="w-4 h-4 text-rose-400" />
              Lock Dashboard
            </button>
          )}

          {onViewLiveMonitor && (
            <button
              onClick={onViewLiveMonitor}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-colors relative"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span>Live Writing Proctor</span>
            </button>
          )}

          <button
            onClick={onViewStudentWorks}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-colors relative"
          >
            <GraduationCap className="w-4 h-4" />
            <span>All Student Works ({submissions.length})</span>
            {submissions.filter((s) => s.status === 'Pending Teacher Review').length > 0 && (
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                {submissions.filter((s) => s.status === 'Pending Teacher Review').length} to mark
              </span>
            )}
          </button>

          {onViewEvidenceLinks && (
            <button
              onClick={onViewEvidenceLinks}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
              title="Manage permanent student formative evidence links for Toddle"
            >
              <Link2 className="w-4 h-4 text-emerald-400" />
              <span>Evidence Links (Toddle)</span>
            </button>
          )}

          <button
            onClick={onViewAnalytics}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Class Analytics
          </button>

          <button
            onClick={onCreateNew}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Formative
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Formatives</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{assessments.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Published & Drafts</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Student Submissions</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{submissions.length}</div>
          <div className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Stored in Firestore
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Curriculum Engines</div>
          <div className="text-base font-bold text-slate-900 mt-1 truncate">IBMYP • IGCSE • IBDP</div>
          <div className="text-xs text-slate-500 mt-0.5">Automated Rubrics</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Security Protection</div>
          <div className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <Lock className="w-4 h-4" /> DELETETASK Enabled
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Password Safeguarded</div>
        </div>
      </div>

      {/* Formative Assessments List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Formative Tasks & Assessments</h2>
            <p className="text-xs text-slate-500">
              Tasks created here are automatically available for students to select and complete.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Subject:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 bg-slate-50 font-medium"
              >
                <option value="All">All Subjects</option>
                {ALL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Class:</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 bg-slate-50 font-medium"
              >
                <option value="All">All Classes</option>
                {classSections.map((cs) => (
                  <option key={cs} value={cs}>
                    {cs}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredAssessments.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Formative Assessments Created</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Get started by creating your first curriculum-aligned formative assessment. You can type any topic and learning objectives directly.
            </p>
            <button
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Create Formative Assessment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.map((ass) => {
              const bp = ass.blueprint;
              const subCount = submissions.filter((s) => s.formativeId === ass.id).length;
              const isDraft = ass.status === 'Draft';

              return (
                <div
                  key={ass.id}
                  className="border border-slate-200 hover:border-slate-300 rounded-xl p-5 bg-white shadow-xs transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {bp.curriculum} • {bp.yearGroup}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ass.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">{bp.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {bp.subject} • Topic: <strong className="text-slate-800">{bp.topic}</strong>
                      </p>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span>Teacher:</span> <strong>{bp.teacherName || activeTeacher.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Class:</span> <strong>{bp.classSection}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Questions:</span> <strong>{ass.questions.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Marks:</span> <strong>{bp.maxMarks || 20} Marks</strong>
                      </div>
                      {bp.selectedCriterion && (
                        <div className="flex justify-between text-indigo-700">
                          <span>Criterion:</span> <strong>{bp.selectedCriterion}</strong>
                        </div>
                      )}
                      <div className="flex justify-between text-blue-700 font-semibold">
                        <span>Student Submissions:</span> <strong>{subCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditDraft(ass)}
                        className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View / Edit
                      </button>

                      {isDraft && onPublishAssessment && (
                        <button
                          type="button"
                          onClick={() => onPublishAssessment(ass)}
                          className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                          title={`Publish this task to make it active for ${bp.classSection} students`}
                        >
                          <Send className="w-3 h-3" /> Publish
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setTargetAssessmentForDelete(ass);
                          setDeletePassword('');
                          setDeleteError('');
                        }}
                        title="Delete or Reconstruct Assessment (Password Protected)"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">{bp.classSection}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Password-Protected Delete / Reconstruct Modal */}
      {targetAssessmentForDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Lock className="w-5 h-5" /> Security Password Protected Action
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Delete or Reconstruct Formative
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                You are modifying or deleting <strong>{targetAssessmentForDelete.blueprint.title}</strong>. To confirm, please enter the security password <strong>DELETETASK</strong>.
              </p>
            </div>

            <form onSubmit={handleDeleteConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Type Security Password (DELETETASK)
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter DELETETASK"
                  className="w-full border-2 border-rose-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/20"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTargetAssessmentForDelete(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
