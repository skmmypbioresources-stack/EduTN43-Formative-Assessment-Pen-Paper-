import React, { useState, useMemo } from 'react';
import {
  FormativeAssessment,
  Submission,
  UserProfile,
  ALL_SUBJECTS,
  CurriculumType,
  ACADEMIC_YEARS,
  DEFAULT_ACADEMIC_YEAR,
  StudentRecord,
} from '../types';
import { StorageService } from '../services/storageService';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
  MessageSquare,
  TrendingUp,
  Filter,
  GraduationCap,
  Sparkles,
  Search,
  FolderCheck,
  RotateCcw,
  Layers,
  ChevronRight,
  Atom,
  Dna,
  Zap,
  FlaskConical,
} from 'lucide-react';

interface StudentDashboardProps {
  activeStudent: UserProfile;
  assessments: FormativeAssessment[];
  submissions: Submission[];
  onStartAssessmentWithProfile: (
    assessment: FormativeAssessment,
    studentDetails: { name: string; classSection: string; curriculum: CurriculumType; academicYear: string },
    isRedo?: boolean
  ) => void;
  onViewResults: (assessment: FormativeAssessment, submission: Submission) => void;
  onOpenReflection: (assessment: FormativeAssessment, submission: Submission) => void;
  onViewProgress: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  activeStudent,
  assessments,
  submissions,
  onStartAssessmentWithProfile,
  onViewResults,
  onOpenReflection,
  onViewProgress,
}) => {
  // Navigation: Active Available Tasks vs Completed Tasks Folder
  const [activeFolderTab, setActiveFolderTab] = useState<'available' | 'completed'>('available');

  // Discovery Filters: Default to empty / prompt state so dashboard is clean and organized
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pre-flight Launch Modal State
  const [targetAssessmentForStart, setTargetAssessmentForStart] = useState<FormativeAssessment | null>(null);
  const [isRedoAttempt, setIsRedoAttempt] = useState<boolean>(false);
  const [studentFullName, setStudentFullName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('MYP 2');
  const [studentCurriculum, setStudentCurriculum] = useState<CurriculumType>('IBMYP');
  const [studentAcademicYear, setStudentAcademicYear] = useState<string>(DEFAULT_ACADEMIC_YEAR);

  // Extract published assessments
  const publishedAssessments = useMemo(() => {
    return assessments.filter((a) => a.status === 'Published');
  }, [assessments]);

  // Extract available classes dynamically
  const classOptions = useMemo(() => {
    const fromAssessments = publishedAssessments.map((a) => a.blueprint.classSection).filter(Boolean);
    const standard = ['Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'MYP 1', 'MYP 2', 'MYP 3', 'MYP 4', 'MYP 5', 'IGCSE Year 10', 'IGCSE Year 11', 'DP 1', 'DP 2'];
    const merged = Array.from(new Set([...fromAssessments, ...standard]));
    return merged.sort();
  }, [publishedAssessments]);

  // Helper to check if student has submitted an assessment
  const getStudentSubmission = (assessmentId: string): Submission | undefined => {
    return submissions.find(
      (s) =>
        s.formativeId === assessmentId &&
        (s.studentId === activeStudent.id ||
          s.studentName?.toLowerCase() === activeStudent.name?.toLowerCase() ||
          activeStudent.name === 'Student')
    );
  };

  // Split assessments into uncompleted (available) and completed
  const { availableAssessments, completedAssessmentsWithSubs } = useMemo(() => {
    const available: FormativeAssessment[] = [];
    const completed: { assessment: FormativeAssessment; submission: Submission }[] = [];

    publishedAssessments.forEach((ass) => {
      const sub = getStudentSubmission(ass.id);
      if (sub) {
        completed.push({ assessment: ass, submission: sub });
      } else {
        available.push(ass);
      }
    });

    return {
      availableAssessments: available,
      completedAssessmentsWithSubs: completed,
    };
  }, [publishedAssessments, submissions, activeStudent]);

  // Apply filters to Available tasks
  const filteredAvailableTasks = useMemo(() => {
    return availableAssessments.filter((ass) => {
      const bp = ass.blueprint;
      if (selectedSubject && selectedSubject !== 'All' && bp.subject !== selectedSubject) return false;
      if (selectedClass && selectedClass !== 'All' && bp.classSection !== selectedClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = bp.title?.toLowerCase().includes(q);
        const matchTopic = bp.topic?.toLowerCase().includes(q);
        const matchTeacher = bp.teacherName?.toLowerCase().includes(q);
        if (!matchTitle && !matchTopic && !matchTeacher) return false;
      }
      return true;
    });
  }, [availableAssessments, selectedSubject, selectedClass, searchQuery]);

  // Apply filters to Completed tasks
  const filteredCompletedTasks = useMemo(() => {
    return completedAssessmentsWithSubs.filter(({ assessment, submission }) => {
      const bp = assessment.blueprint;
      if (selectedSubject && selectedSubject !== 'All' && bp.subject !== selectedSubject) return false;
      if (selectedClass && selectedClass !== 'All' && (submission.classSection || bp.classSection) !== selectedClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = bp.title?.toLowerCase().includes(q);
        const matchTopic = bp.topic?.toLowerCase().includes(q);
        if (!matchTitle && !matchTopic) return false;
      }
      return true;
    });
  }, [completedAssessmentsWithSubs, selectedSubject, selectedClass, searchQuery]);

  // Launch pre-flight modal
  const handleOpenStartModal = (assessment: FormativeAssessment, isRedo: boolean = false) => {
    setTargetAssessmentForStart(assessment);
    setIsRedoAttempt(isRedo);
    setStudentFullName(activeStudent.name !== 'Student' ? activeStudent.name : '');
    setStudentClass(selectedClass && selectedClass !== 'All' ? selectedClass : assessment.blueprint.classSection || 'MYP 2');
    setStudentCurriculum(assessment.blueprint.curriculum || 'IBMYP');
    setStudentAcademicYear(assessment.blueprint.academicYear || DEFAULT_ACADEMIC_YEAR);
  };

  const handleConfirmStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssessmentForStart || !studentFullName.trim()) return;

    onStartAssessmentWithProfile(
      targetAssessmentForStart,
      {
        name: studentFullName.trim(),
        classSection: studentClass.trim(),
        curriculum: studentCurriculum,
        academicYear: studentAcademicYear,
      },
      isRedoAttempt
    );

    setTargetAssessmentForStart(null);
  };

  const isSelectionMade = Boolean(selectedSubject || selectedClass);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Filter Bar matching requested format */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Formative Tasks & Assessments
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Tasks created here are automatically available for students to select and complete.
            </p>
          </div>

          {/* Subject and Class Selector Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Subject:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
              >
                <option value="">Select Subject...</option>
                <option value="All">All Subjects</option>
                {ALL_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Class:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
              >
                <option value="">Select Class...</option>
                <option value="All">All Classes</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onViewProgress}
              className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 hover:bg-slate-800 transition-colors ml-auto sm:ml-0"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span>Progress History</span>
            </button>
          </div>
        </div>

        {/* Folder / Tab Selector & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFolderTab('available')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeFolderTab === 'available'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Available Formative Papers</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeFolderTab === 'available'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {filteredAvailableTasks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFolderTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeFolderTab === 'completed'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FolderCheck className="w-4 h-4 text-emerald-400" />
              <span>Completed Tasks Folder</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeFolderTab === 'completed'
                    ? 'bg-indigo-800 text-emerald-300'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {filteredCompletedTasks.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          {isSelectionMade && (
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic or title..."
                className="w-full border border-slate-300 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: UNSELECTED / PROMPT STATE */}
      {!isSelectionMade && activeFolderTab === 'available' && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 sm:p-14 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
            <Layers className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Select Your Subject & Class to Access Your Paper
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              To keep your workspace organized and focused, please select your Subject and Class from the top filters to view your assigned formative papers.
            </p>
          </div>

          {/* Quick Subject Launch Tiles */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Or pick your subject directly:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setSelectedSubject('Biology')}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all text-left group"
              >
                <Dna className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Biology</div>
                <div className="text-[10px] text-emerald-700">Cells, Genetics, Ecology</div>
              </button>

              <button
                onClick={() => setSelectedSubject('Chemistry')}
                className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition-all text-left group"
              >
                <FlaskConical className="w-5 h-5 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Chemistry</div>
                <div className="text-[10px] text-sky-700">Reactions, Kinetics, Acids</div>
              </button>

              <button
                onClick={() => setSelectedSubject('Physics')}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 hover:border-amber-300 transition-all text-left group"
              >
                <Zap className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Physics</div>
                <div className="text-[10px] text-amber-700">Forces, Circuits, Waves</div>
              </button>

              <button
                onClick={() => setSelectedSubject('General Science')}
                className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 transition-all text-left group"
              >
                <Atom className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">General Science</div>
                <div className="text-[10px] text-purple-700">Integrated Inquiry</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: AVAILABLE FORMATIVE PAPERS (Pending Tasks Only) */}
      {isSelectionMade && activeFolderTab === 'available' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>
                Assigned Formative Papers for {selectedSubject || 'All Subjects'} • {selectedClass || 'All Classes'}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {filteredAvailableTasks.length} Active Paper{filteredAvailableTasks.length === 1 ? '' : 's'} Pending
            </span>
          </div>

          {filteredAvailableTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No Pending Formative Papers
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {completedAssessmentsWithSubs.length > 0
                  ? 'All tasks for this selection have been completed. Check your Completed Tasks Folder to view feedback or redo any paper for practice.'
                  : 'No formative assessments have been published yet for this selection. Try changing the Subject or Class filter.'}
              </p>
              {completedAssessmentsWithSubs.length > 0 && (
                <button
                  onClick={() => setActiveFolderTab('completed')}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100"
                >
                  <FolderCheck className="w-4 h-4 text-indigo-600" />
                  Open Completed Tasks Folder ({completedAssessmentsWithSubs.length})
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailableTasks.map((ass) => {
                const bp = ass.blueprint;

                return (
                  <div
                    key={ass.id}
                    className="border border-slate-200 bg-white rounded-2xl p-5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {bp.subject}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {bp.curriculum} • {bp.classSection || bp.yearGroup}
                          </span>
                          {bp.selectedCriterion && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                              {bp.selectedCriterion}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Play className="w-3 h-3" /> Ready
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {bp.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          Topic: <strong className="text-slate-800">{bp.topic}</strong>
                        </p>
                      </div>

                      {/* Concept Badges */}
                      {(bp.keyConcept || bp.globalContext) && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                          {bp.keyConcept && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Key Concept: {bp.keyConcept}
                            </span>
                          )}
                          {bp.globalContext && (
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                              Context: {bp.globalContext}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl space-y-1">
                        <div className="flex justify-between">
                          <span>Teacher:</span>{' '}
                          <strong>{bp.teacherName || 'Sciences Faculty'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Questions:</span> <strong>{ass.questions.length} Questions</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Time Limit:</span>{' '}
                          <strong>{bp.timeLimitMinutes || 45} mins</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Marks:</span>{' '}
                          <strong>{bp.maxMarks || 20} Marks</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Academic Year: {bp.academicYear || DEFAULT_ACADEMIC_YEAR}
                      </span>

                      <button
                        onClick={() => handleOpenStartModal(ass, false)}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-transform hover:scale-102"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Assessment Paper
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: COMPLETED TASKS FOLDER (Archive with Feedback & Redo Option) */}
      {activeFolderTab === 'completed' && (
        <div className="space-y-4">
          <div className="bg-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <FolderCheck className="w-3.5 h-3.5" /> Completed Tasks Folder
                </span>
                <span className="text-xs text-slate-300">
                  {filteredCompletedTasks.length} Submitted Paper{filteredCompletedTasks.length === 1 ? '' : 's'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1.5">
                Completed Formatives & Revision Hub
              </h2>
              <p className="text-xs text-slate-300 max-w-xl mt-0.5">
                Your submitted assessments are organized here. You can review official teacher feedback or redo any paper for practice.
              </p>
            </div>

            <button
              onClick={() => setActiveFolderTab('available')}
              className="px-3.5 py-1.5 bg-white text-indigo-950 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Back to Available Papers</span>
            </button>
          </div>

          {filteredCompletedTasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <FolderCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Completed Tasks Folder is Empty
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You haven't submitted any formative papers yet. Once you complete a paper in the Available Tasks view, it will automatically move here.
              </p>
              <button
                onClick={() => setActiveFolderTab('available')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs"
              >
                <BookOpen className="w-4 h-4" /> Go to Available Papers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompletedTasks.map(({ assessment, submission }) => {
                const bp = assessment.blueprint;
                const isMarked =
                  submission.status === 'Marked' ||
                  submission.teacherFeedback !== undefined ||
                  (submission.markingResults !== undefined && submission.status !== 'Pending Teacher Review');
                const isPendingTeacher = !isMarked;

                const marksTotal = submission.totalMarksAwarded ?? 0;
                const maxTotal = submission.totalMaxMarks ?? bp.maxMarks ?? 20;
                const percentage = Math.round((marksTotal / maxTotal) * 100);

                return (
                  <div
                    key={assessment.id}
                    className={`border rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 ${
                      isMarked
                        ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                        : 'border-amber-200 bg-amber-50/20 shadow-xs'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {bp.subject}
                          </span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {submission.classSection || bp.classSection}
                          </span>
                        </div>

                        {isMarked ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Evaluated ({marksTotal}/{maxTotal})
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> In Grading Queue
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {bp.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          Topic: <strong className="text-slate-800">{bp.topic}</strong>
                        </p>
                      </div>

                      {/* Score & Key Concept Breakdown */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span>Submission Date:</span>
                          <strong>
                            {submission.submittedAt
                              ? new Date(submission.submittedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Submitted'}
                          </strong>
                        </div>

                        {isMarked && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span>Final Score:</span>
                            <span
                              className={`font-bold ${
                                percentage >= 70
                                  ? 'text-emerald-700'
                                  : percentage >= 50
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {marksTotal} / {maxTotal} ({percentage}%)
                              {submission.mypOverallAchievementLevel ? ` • MYP Level ${submission.mypOverallAchievementLevel}/8` : ''}
                            </span>
                          </div>
                        )}

                        {bp.keyConcept && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-500">Key Concept:</span>
                            <span className="font-semibold text-indigo-700">{bp.keyConcept}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar for Completed Task */}
                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isMarked ? (
                          <button
                            onClick={() => onViewResults(assessment, submission)}
                            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> View Report
                          </button>
                        ) : (
                          <button
                            onClick={() => onViewProgress()}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> View Status
                          </button>
                        )}

                        {!submission.reflection && isMarked && (
                          <button
                            onClick={() => onOpenReflection(assessment, submission)}
                            className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Add Reflection
                          </button>
                        )}
                      </div>

                      {/* REDO FORMATIVE ASSESSMENT BUTTON */}
                      <button
                        onClick={() => handleOpenStartModal(assessment, true)}
                        className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Take this formative paper again for practice"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Redo Assessment</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PRE-FLIGHT REGISTRATION / LAUNCH MODAL */}
      {targetAssessmentForStart && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>
                  {isRedoAttempt ? 'Redo Formative Practice' : 'Student Pre-Flight Verification'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {targetAssessmentForStart.blueprint.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRedoAttempt
                  ? 'You are re-taking this formative paper. Your previous submission record is safely preserved.'
                  : 'Please enter your details to verify your submission identity before starting.'}
              </p>
            </div>

            <form onSubmit={handleConfirmStart} className="space-y-4">
              {/* Student Name with Autocomplete */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name or Roll No <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Type or select from roster</span>
                </div>
                <input
                  type="text"
                  list="registered-students-list"
                  required
                  autoFocus
                  value={studentFullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStudentFullName(val);
                    // Check if matches a student in directory
                    const match = StorageService.getStudentByName(val) || StorageService.getStudentById(val);
                    if (match) {
                      if (match.classSection) setStudentClass(match.classSection);
                      if (match.curriculum) setStudentCurriculum(match.curriculum);
                    }
                  }}
                  placeholder="e.g. 8674 or CHARAN SAI M..."
                  className="w-full border-2 border-blue-200 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none bg-blue-50/20"
                />
                <datalist id="registered-students-list">
                  {StorageService.getStudents().map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.studentId} • {s.name} ({s.classSection})
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Class / Grade */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Class / Grade / Section <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="e.g. Grade 9A, FM3-Sci, DP1-Bio"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Curriculum */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Curriculum
                  </label>
                  <select
                    value={studentCurriculum}
                    onChange={(e) => setStudentCurriculum(e.target.value as CurriculumType)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="IBMYP">IBMYP</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="IBDP">IBDP</option>
                  </select>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={studentAcademicYear}
                    onChange={(e) => setStudentAcademicYear(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {ACADEMIC_YEARS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Time Allocated: {targetAssessmentForStart.blueprint.timeLimitMinutes || 45} Minutes
                </div>
                <p>
                  Questions: {targetAssessmentForStart.questions.length} • Max Marks:{' '}
                  {targetAssessmentForStart.blueprint.maxMarks || 20}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTargetAssessmentForStart(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!studentFullName.trim()}
                  className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 ${
                    isRedoAttempt
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isRedoAttempt ? <RotateCcw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isRedoAttempt ? 'Begin Redo Attempt' : 'Begin Task Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
