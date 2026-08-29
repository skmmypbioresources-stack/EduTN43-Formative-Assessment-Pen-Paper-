import React, { useState, useMemo } from 'react';
import {
  FormativeAssessment,
  Submission,
  ACADEMIC_YEARS,
  DEFAULT_ACADEMIC_YEAR,
  ALL_SUBJECTS,
} from '../types';
import { ReportGenerator } from '../services/reportGenerator';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  GraduationCap,
  BookOpen,
  Users,
  Folder,
  FolderOpen,
  User,
  ChevronRight,
  Atom,
  Dna,
  FlaskConical,
  Zap,
  Link2,
} from 'lucide-react';

interface StudentWorksViewProps {
  assessments: FormativeAssessment[];
  submissions: Submission[];
  onViewMarking: (assessment: FormativeAssessment, submission: Submission) => void;
  onTeacherMark?: (assessment: FormativeAssessment, submission: Submission) => void;
  onResetAcademicYear: (year: string, passwordInput: string) => Promise<{ success: boolean; error?: string }>;
  onOpenEvidenceManager?: () => void;
}

type GroupingViewMode = 'class' | 'student' | 'all';

interface StudentGroup {
  name: string;
  classSection: string;
  submissions: Submission[];
  avgPct: number;
}

export const StudentWorksView: React.FC<StudentWorksViewProps> = ({
  assessments,
  submissions,
  onViewMarking,
  onTeacherMark,
  onResetAcademicYear,
  onOpenEvidenceManager,
}) => {
  // Top Filter selections matching Formative Task layout
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(DEFAULT_ACADEMIC_YEAR);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');

  // Organizing View Mode: By Class Folder or By Student Portfolio or All Flat List
  const [viewMode, setViewMode] = useState<GroupingViewMode>('class');

  // Active selected class/student folder drill-down
  const [activeDrillClass, setActiveDrillClass] = useState<string | null>(null);
  const [activeDrillStudent, setActiveDrillStudent] = useState<string | null>(null);

  // Academic Year Reset Modal
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetYearTarget, setResetYearTarget] = useState<string>(DEFAULT_ACADEMIC_YEAR);
  const [resetPassword, setResetPassword] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Dynamic Class list
  const classList = useMemo(() => {
    const fromSubs = submissions.map((s) => s.classSection).filter(Boolean);
    const fromAss = assessments.map((a) => a.blueprint.classSection).filter(Boolean);
    const standard = [
      'Grade 9A',
      'Grade 9B',
      'Grade 10A',
      'Grade 10B',
      'MYP 1',
      'MYP 2',
      'MYP 3',
      'MYP 4',
      'MYP 5',
      'IGCSE Year 10',
      'IGCSE Year 11',
      'DP 1',
      'DP 2',
    ];
    const merged = Array.from(new Set([...fromSubs, ...fromAss, ...standard]));
    return merged.sort();
  }, [submissions, assessments]);

  // Dynamic Student names list
  const studentList = useMemo(() => {
    const names = Array.from(
      new Set(
        submissions
          .map((s) => s.studentName)
          .filter((n): n is string => Boolean(n && n.trim() && n !== 'Student'))
      )
    );
    return names.sort();
  }, [submissions]);

  // Filter submissions by current criteria
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (selectedYear !== 'All' && sub.academicYear && sub.academicYear !== selectedYear) return false;
      if (selectedClass && selectedClass !== 'All' && sub.classSection !== selectedClass) return false;

      if (selectedSubject && selectedSubject !== 'All') {
        const ass = assessments.find((a) => a.id === sub.formativeId);
        if (ass && ass.blueprint.subject !== selectedSubject) return false;
      }

      if (selectedStudentFilter && selectedStudentFilter !== 'All') {
        if (sub.studentName?.toLowerCase() !== selectedStudentFilter.toLowerCase()) return false;
      }

      if (searchName.trim()) {
        const q = searchName.toLowerCase();
        const matchName = sub.studentName?.toLowerCase().includes(q);
        const matchClass = sub.classSection?.toLowerCase().includes(q);
        const matchTopic = sub.topic?.toLowerCase().includes(q);
        const ass = assessments.find((a) => a.id === sub.formativeId);
        const matchTitle = ass?.blueprint.title?.toLowerCase().includes(q);
        if (!matchName && !matchClass && !matchTopic && !matchTitle) return false;
      }

      return true;
    });
  }, [
    submissions,
    assessments,
    selectedYear,
    selectedClass,
    selectedSubject,
    selectedStudentFilter,
    searchName,
  ]);

  // Groupings by Class
  const submissionsByClass: Record<string, Submission[]> = useMemo(() => {
    const groups: Record<string, Submission[]> = {};
    filteredSubmissions.forEach((sub) => {
      const cls = sub.classSection || 'General Class';
      if (!groups[cls]) groups[cls] = [];
      groups[cls].push(sub);
    });
    return groups;
  }, [filteredSubmissions]);

  // Groupings by Student
  const submissionsByStudent: Record<string, StudentGroup> = useMemo(() => {
    const groups: Record<string, StudentGroup> = {};

    filteredSubmissions.forEach((sub) => {
      const stdName = sub.studentName || 'Student';
      if (!groups[stdName]) {
        groups[stdName] = {
          name: stdName,
          classSection: sub.classSection || 'General Class',
          submissions: [],
          avgPct: 0,
        };
      }
      groups[stdName].submissions.push(sub);
    });

    // Compute averages
    Object.values(groups).forEach((g: StudentGroup) => {
      if (g.submissions.length > 0) {
        const sumPct = g.submissions.reduce((acc, s) => {
          const ass = assessments.find((a) => a.id === s.formativeId);
          const max = s.totalMaxMarks || ass?.blueprint.maxMarks || 20;
          const score = s.totalMarksAwarded || 0;
          return acc + (score / max) * 100;
        }, 0);
        g.avgPct = Math.round(sumPct / g.submissions.length);
      }
    });

    return groups;
  }, [filteredSubmissions, assessments]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert('No student works to export for current filter selection.');
      return;
    }

    const headers = [
      'Submission ID',
      'Academic Year',
      'Student Name',
      'Class / Section',
      'Subject',
      'Curriculum',
      'Formative Title',
      'Marks Awarded',
      'Max Marks',
      'Score %',
      'Primary Learning Gap',
      'Reflection Status',
      'Submitted At',
    ];

    const rows = filteredSubmissions.map((s) => {
      const ass = assessments.find((a) => a.id === s.formativeId);
      const marks = s.totalMarksAwarded ?? 0;
      const max = s.totalMaxMarks ?? ass?.blueprint.maxMarks ?? 20;
      const pct = Math.round((marks / max) * 100);
      const gap = s.diagnosis?.learningGaps?.[0]?.gap || 'None';

      return [
        `"${s.id}"`,
        `"${s.academicYear || DEFAULT_ACADEMIC_YEAR}"`,
        `"${s.studentName || 'Student'}"`,
        `"${s.classSection || 'N/A'}"`,
        `"${ass?.blueprint.subject || s.subject || 'Science'}"`,
        `"${ass?.blueprint.curriculum || s.curriculum || 'IBMYP'}"`,
        `"${ass?.blueprint.title || 'Formative'}"`,
        marks,
        max,
        `${pct}%`,
        `"${gap.replace(/"/g, '""')}"`,
        `"${s.reflection ? 'Reflected' : 'Pending'}"`,
        `"${s.submittedAt || s.startedAt || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Student_Works_${selectedYear}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform password-protected reset
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    setIsResetting(true);

    try {
      const result = await onResetAcademicYear(resetYearTarget, resetPassword.trim());
      if (result.success) {
        setResetSuccess(`Successfully archived and reset student works for Academic Year ${resetYearTarget}.`);
        setResetPassword('');
        setTimeout(() => {
          setShowResetModal(false);
          setResetSuccess('');
        }, 1800);
      } else {
        setResetError(result.error || 'Incorrect security password.');
      }
    } catch {
      setResetError('An error occurred during reset.');
    } finally {
      setIsResetting(false);
    }
  };

  const isSelectionMade = Boolean(selectedSubject || selectedClass || selectedStudentFilter || searchName.trim());

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header & Filter Selection Control matching Formative Tasks layout */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                Student Works Repository
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Academic Year {selectedYear}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
              All Student Works & Submissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select Subject, Class, or Student to organize and view student formative files and evaluations.
            </p>
          </div>

          {/* Top Bar Filter Selectors matching Formative Task Screen */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Subject:
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setActiveDrillClass(null);
                  setActiveDrillStudent(null);
                }}
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
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setActiveDrillClass(null);
                  setActiveDrillStudent(null);
                }}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
              >
                <option value="">Select Class...</option>
                <option value="All">All Classes</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Student:
              </label>
              <select
                value={selectedStudentFilter}
                onChange={(e) => {
                  setSelectedStudentFilter(e.target.value);
                  setActiveDrillClass(null);
                  setActiveDrillStudent(null);
                }}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs max-w-[150px]"
              >
                <option value="">All Students</option>
                {studentList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Year:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:border-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
              >
                <option value="All">All Years</option>
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {onOpenEvidenceManager && (
              <button
                onClick={onOpenEvidenceManager}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                title="Manage permanent individual student evidence links for Toddle"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Evidence Links</span>
              </button>
            )}
          </div>
        </div>

        {/* View Mode Organizers: By Class Folders vs By Student Portfolios vs Full List */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Organize By:
            </span>

            <button
              onClick={() => {
                setViewMode('class');
                setActiveDrillClass(null);
                setActiveDrillStudent(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'class'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>By Class Folders</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  viewMode === 'class' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {Object.keys(submissionsByClass).length}
              </span>
            </button>

            <button
              onClick={() => {
                setViewMode('student');
                setActiveDrillClass(null);
                setActiveDrillStudent(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'student'
                  ? 'bg-indigo-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5 text-indigo-300" />
              <span>By Student Files</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  viewMode === 'student' ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {Object.keys(submissionsByStudent).length}
              </span>
            </button>

            <button
              onClick={() => {
                setViewMode('all');
                setActiveDrillClass(null);
                setActiveDrillStudent(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>All Submissions Table</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  viewMode === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-800'
                }`}
              >
                {filteredSubmissions.length}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search student or topic..."
              className="w-full border border-slate-300 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* VIEW 1: UNSELECTED / PROMPT STATE (When no class or subject is selected) */}
      {!isSelectionMade && (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 sm:p-14 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <FolderOpen className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Select Class or Subject to Organize Student Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              To keep student files structured and accessible, please select a Subject or Class from the top filters, or click any quick folder below.
            </p>
          </div>

          {/* Quick Class / Subject Jumpers */}
          <div className="pt-2 max-w-3xl mx-auto space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Browse Submissions by Subject:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setSelectedSubject('Biology')}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all text-left group"
              >
                <Dna className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Biology Works</div>
                <div className="text-[10px] text-emerald-700">Cells, Genetics, Ecology</div>
              </button>

              <button
                onClick={() => setSelectedSubject('Chemistry')}
                className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition-all text-left group"
              >
                <FlaskConical className="w-5 h-5 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Chemistry Works</div>
                <div className="text-[10px] text-sky-700">Kinetics, Acids, Bonding</div>
              </button>

              <button
                onClick={() => setSelectedSubject('Physics')}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 hover:border-amber-300 transition-all text-left group"
              >
                <Zap className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Physics Works</div>
                <div className="text-[10px] text-amber-700">Forces, Circuits, Energy</div>
              </button>

              <button
                onClick={() => setSelectedSubject('General Science')}
                className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 hover:border-purple-300 transition-all text-left group"
              >
                <Atom className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">General Science</div>
                <div className="text-[10px] text-purple-700">Integrated Inquiries</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ORGANIZED BY CLASS FOLDERS */}
      {isSelectionMade && viewMode === 'class' && (
        <div className="space-y-5">
          {/* If drilled into a specific class folder */}
          {activeDrillClass ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveDrillClass(null)}
                    className="p-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> All Class Folders
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      Class Folder: {activeDrillClass}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Showing {submissionsByClass[activeDrillClass]?.length || 0} student assessment papers
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveDrillClass(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Close Folder
                </button>
              </div>

              {/* Render Submissions Table for this Class */}
              <SubmissionsTable
                submissions={submissionsByClass[activeDrillClass] || []}
                assessments={assessments}
                onViewMarking={onViewMarking}
                onTeacherMark={onTeacherMark}
              />
            </div>
          ) : (
            /* Class Folders Grid */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-blue-600" /> Class Directories & Sections (
                  {Object.keys(submissionsByClass).length} Folders)
                </h2>
                <span className="text-xs text-slate-500">Click any class folder to inspect student works</span>
              </div>

              {Object.keys(submissionsByClass).length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No Submissions Found</h3>
                  <p className="text-xs text-slate-500">
                    No student submissions match the selected Subject and Class filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(submissionsByClass).map(([className, subs]) => {
                    const evaluated = subs.filter(
                      (s: Submission) => s.status === 'Submitted' || s.status === 'Marked' || s.status === 'Reflected'
                    ).length;
                    const pendingReview = subs.filter((s: Submission) => s.status === 'Pending Teacher Review').length;
                    const classAvg =
                      subs.length > 0
                        ? Math.round(
                            subs.reduce((acc: number, s: Submission) => {
                              const ass = assessments.find((a) => a.id === s.formativeId);
                              const max = s.totalMaxMarks || ass?.blueprint.maxMarks || 20;
                              const score = s.totalMarksAwarded || 0;
                              return acc + (score / max) * 100;
                            }, 0) / subs.length
                          )
                        : 0;

                    return (
                      <div
                        key={className}
                        onClick={() => setActiveDrillClass(className)}
                        className="border border-slate-200 hover:border-blue-400 bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                              <Folder className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                              {subs.length} File{subs.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                              {className}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {selectedSubject && selectedSubject !== 'All' ? selectedSubject : 'All Science Subjects'}
                            </p>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600">
                            <div className="flex justify-between">
                              <span>Class Average:</span>
                              <strong className="text-slate-900 font-bold">{classAvg}%</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Graded & Diagnosed:</span>
                              <strong className="text-emerald-700 font-semibold">{evaluated}</strong>
                            </div>
                            {pendingReview > 0 && (
                              <div className="flex justify-between text-amber-700 font-bold">
                                <span>Pending Teacher Review:</span>
                                <span>{pendingReview}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                          <span>Open Class Folder</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ORGANIZED BY STUDENT FILES / PORTFOLIOS */}
      {isSelectionMade && viewMode === 'student' && (
        <div className="space-y-5">
          {/* If drilled into a specific student file */}
          {activeDrillStudent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveDrillStudent(null)}
                    className="p-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> All Student Portfolios
                  </button>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      Student Portfolio: {activeDrillStudent}
                    </h2>
                    <p className="text-xs text-slate-600">
                      Class: {submissionsByStudent[activeDrillStudent]?.classSection} •{' '}
                      {submissionsByStudent[activeDrillStudent]?.submissions.length} Completed Paper(s)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveDrillStudent(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Close Portfolio
                </button>
              </div>

              {/* Render Submissions Table for this Student */}
              <SubmissionsTable
                submissions={submissionsByStudent[activeDrillStudent]?.submissions || []}
                assessments={assessments}
                onViewMarking={onViewMarking}
                onTeacherMark={onTeacherMark}
              />
            </div>
          ) : (
            /* Student Portfolios Grid */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" /> Student Portfolios & Works (
                  {Object.keys(submissionsByStudent).length} Students)
                </h2>
                <span className="text-xs text-slate-500">Click any student file to inspect their work history</span>
              </div>

              {Object.keys(submissionsByStudent).length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
                  <User className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No Student Portfolios Found</h3>
                  <p className="text-xs text-slate-500">
                    No student submissions match the current filter selection.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(submissionsByStudent).map((studentData: StudentGroup) => {
                    return (
                      <div
                        key={studentData.name}
                        onClick={() => setActiveDrillStudent(studentData.name)}
                        className="border border-slate-200 hover:border-indigo-400 bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm group-hover:scale-105 transition-transform">
                              {studentData.name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">
                              {studentData.submissions.length} Paper{studentData.submissions.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {studentData.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {studentData.classSection}
                            </p>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-600">
                            <div className="flex justify-between">
                              <span>Average Mastery:</span>
                              <strong
                                className={`font-bold ${
                                  studentData.avgPct >= 70
                                    ? 'text-emerald-700'
                                    : studentData.avgPct >= 50
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }`}
                              >
                                {studentData.avgPct}%
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Latest Assessment:</span>
                              <span className="truncate max-w-[130px] font-medium text-slate-800">
                                {assessments.find((a) => a.id === studentData.submissions[0]?.formativeId)?.blueprint.title || 'Formative Paper'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                          <span>View Student File</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: ALL FLAT SUBMISSIONS TABLE */}
      {isSelectionMade && viewMode === 'all' && (
        <div className="space-y-4">
          <SubmissionsTable
            submissions={filteredSubmissions}
            assessments={assessments}
            onViewMarking={onViewMarking}
            onTeacherMark={onTeacherMark}
          />
        </div>
      )}

      {/* Password-Protected Academic Year Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Lock className="w-5 h-5" /> Security Password Protected: Reset Academic Year
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Resetting or archiving will permanently clear student submissions for the specified academic year. To authorize this operation, please enter the security password <strong>RESETACADEMICYEAR</strong> or <strong>DELETETASK</strong>.
            </p>

            <form onSubmit={handleConfirmReset} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Academic Year</label>
                <select
                  value={resetYearTarget}
                  onChange={(e) => setResetYearTarget(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 bg-slate-50"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      Academic Year {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Security Password (Type RESETACADEMICYEAR or DELETETASK)
                </label>
                <input
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter security password"
                  className="w-full border-2 border-rose-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/20"
                />
              </div>

              {resetError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-semibold">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold">
                  {resetSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetError('');
                    setResetSuccess('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !resetPassword}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isResetting ? 'Resetting Data...' : 'Authorize Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Sub-Component: Submissions Table */
interface SubmissionsTableProps {
  submissions: Submission[];
  assessments: FormativeAssessment[];
  onViewMarking: (assessment: FormativeAssessment, submission: Submission) => void;
  onTeacherMark?: (assessment: FormativeAssessment, submission: Submission) => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  submissions,
  assessments,
  onViewMarking,
  onTeacherMark,
}) => {
  if (submissions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Student Submissions in this Section</h3>
        <p className="text-xs text-slate-500">
          When students complete assessments for this class, their diagnostic records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          Student Submissions ({submissions.length})
        </h3>
        <span className="text-xs text-slate-500 font-medium">Live Evaluated Records</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="p-3.5">Student Name</th>
              <th className="p-3.5">Class / Section</th>
              <th className="p-3.5">Subject & Formative Task</th>
              <th className="p-3.5">Marks & Level</th>
              <th className="p-3.5">Score %</th>
              <th className="p-3.5">Diagnosed Learning Gap</th>
              <th className="p-3.5">Reflection</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {submissions.map((sub) => {
              const ass = assessments.find((a) => a.id === sub.formativeId);
              const marksAwarded = sub.totalMarksAwarded ?? 0;
              const maxMarks = sub.totalMaxMarks ?? ass?.blueprint.maxMarks ?? 20;
              const pct = Math.round((marksAwarded / maxMarks) * 100);
              const topGap = sub.diagnosis?.learningGaps?.[0]?.gap;

              return (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {sub.studentName?.charAt(0) || 'S'}
                    </div>
                    <span>{sub.studentName}</span>
                  </td>

                  <td className="p-3.5 text-slate-700">
                    <span className="font-semibold text-slate-900">{sub.classSection}</span>
                    <div className="text-[10px] text-slate-500">{sub.academicYear || DEFAULT_ACADEMIC_YEAR}</div>
                  </td>

                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900 truncate max-w-xs">
                      {ass?.blueprint.title || ass?.blueprint.topic || 'Formative Task'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ass?.blueprint.subject || sub.subject || 'Sciences'} • {ass?.blueprint.curriculum || sub.curriculum}
                    </div>
                  </td>

                  <td className="p-3.5 font-bold text-slate-900">
                    {marksAwarded} / {maxMarks}
                    {sub.mypOverallAchievementLevel !== undefined && (
                      <div className="text-[10px] text-indigo-600 font-semibold">
                        Level {sub.mypOverallAchievementLevel}/8
                      </div>
                    )}
                  </td>

                  <td className="p-3.5">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        pct >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : pct >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>

                  <td className="p-3.5 text-slate-700 max-w-xs truncate" title={topGap || 'None diagnosed'}>
                    {topGap ? (
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium text-[11px]">
                        {topGap}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No gaps diagnosed</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    {sub.reflection ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reflected
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">Pending</span>
                    )}
                  </td>

                  <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                    {ass && (
                      <>
                        {onTeacherMark &&
                          (ass.blueprint.markingMode === 'teacher_marked' ||
                            sub.status === 'Pending Teacher Review' ||
                            sub.teacherFeedback ||
                            sub.teacherMarkingDraft) && (
                            <button
                              onClick={() => onTeacherMark(ass, sub)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                sub.status === 'Pending Teacher Review'
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs animate-pulse'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {sub.status === 'Pending Teacher Review' ? 'Review & Mark' : 'Teacher Feedback'}
                            </button>
                          )}
                        <button
                          onClick={() => onViewMarking(ass, sub)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                        >
                          Evaluation Details
                        </button>
                        <button
                          onClick={() => ReportGenerator.generatePrintableReport(ass, sub)}
                          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-medium"
                        >
                          PDF
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
