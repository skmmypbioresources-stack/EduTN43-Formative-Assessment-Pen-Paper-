import React, { useState } from 'react';
import { FormativeAssessment, Submission, UserProfile, ACADEMIC_YEARS, DEFAULT_ACADEMIC_YEAR, SECURITY_PASSWORDS, ALL_SUBJECTS } from '../types';
import { ReportGenerator } from '../services/reportGenerator';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Lock,
  Eye,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface StudentWorksViewProps {
  assessments: FormativeAssessment[];
  submissions: Submission[];
  onViewMarking: (assessment: FormativeAssessment, submission: Submission) => void;
  onResetAcademicYear: (year: string, passwordInput: string) => Promise<{ success: boolean; error?: string }>;
}

export const StudentWorksView: React.FC<StudentWorksViewProps> = ({
  assessments,
  submissions,
  onViewMarking,
  onResetAcademicYear,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(DEFAULT_ACADEMIC_YEAR);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedFormative, setSelectedFormative] = useState<string>('All');
  const [searchName, setSearchName] = useState<string>('');

  // Academic Year Reset Modal
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetYearTarget, setResetYearTarget] = useState<string>(DEFAULT_ACADEMIC_YEAR);
  const [resetPassword, setResetPassword] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Extract unique classes and formatives
  const classList = Array.from(new Set(submissions.map((s) => s.classSection).filter(Boolean)));
  
  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedYear !== 'All' && sub.academicYear !== selectedYear) return false;
    if (selectedClass !== 'All' && sub.classSection !== selectedClass) return false;
    if (selectedFormative !== 'All' && sub.formativeId !== selectedFormative) return false;
    
    if (selectedSubject !== 'All') {
      const ass = assessments.find((a) => a.id === sub.formativeId);
      if (ass && ass.blueprint.subject !== selectedSubject) return false;
    }

    if (searchName.trim()) {
      const q = searchName.toLowerCase();
      const matchName = sub.studentName?.toLowerCase().includes(q);
      const matchClass = sub.classSection?.toLowerCase().includes(q);
      if (!matchName && !matchClass) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalSubmissions = filteredSubmissions.length;
  const evaluatedCount = filteredSubmissions.filter((s) => s.status === 'Submitted' || s.status === 'Marked' || s.status === 'Reflected').length;
  const reflectedCount = filteredSubmissions.filter((s) => !!s.reflection).length;
  
  const avgScorePct = totalSubmissions > 0
    ? Math.round(
        filteredSubmissions.reduce((acc, s) => {
          const max = s.totalMaxMarks || 20;
          const score = s.totalMarksAwarded || 0;
          return acc + (score / max) * 100;
        }, 0) / totalSubmissions
      )
    : 0;

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
      const gap = s.diagnosis?.learningGaps[0]?.gap || 'None';

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
    } catch (err: any) {
      setResetError('An error occurred during reset.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-0.5 rounded-full font-semibold">
              Live Database Repository
            </span>
            <span className="text-xs text-slate-300">Scalable 10,000+ Student Submissions Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            All Student Works & Submissions
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Search, filter, review, and evaluate thousands of student science assessment submissions across academic years with full AI examiner diagnostic logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Marks (CSV)
          </button>

          <button
            onClick={() => {
              setResetYearTarget(selectedYear !== 'All' ? selectedYear : DEFAULT_ACADEMIC_YEAR);
              setShowResetModal(true);
            }}
            className="px-4 py-2.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/60 text-rose-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            Reset Academic Year Data
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Total Submissions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalSubmissions}</div>
          <div className="text-xs text-slate-500 mt-0.5">Year: {selectedYear}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Evaluated by AI</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{evaluatedCount}</div>
          <div className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Calibrated
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Average Cohort Score</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{avgScorePct}%</div>
          <div className="text-xs text-slate-500 mt-0.5">Across filtered tasks</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Reflections Logged</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{reflectedCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {totalSubmissions > 0 ? Math.round((reflectedCount / totalSubmissions) * 100) : 0}% completion
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Student Works Repository</span>
          </div>
          <span className="text-xs text-slate-500">
            Showing {filteredSubmissions.length} of {submissions.length} Total Submissions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {/* Academic Year */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Academic Years</option>
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Subjects</option>
              {ALL_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Class / Section */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Class / Section</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Classes</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Formative Task */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Formative Task</label>
            <select
              value={selectedFormative}
              onChange={(e) => setSelectedFormative(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Tasks</option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.blueprint.formativeNumber}: {a.blueprint.topic || a.blueprint.title}
                </option>
              ))}
            </select>
          </div>

          {/* Search by Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Search Student</label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Student name..."
                className="w-full border border-slate-300 rounded-lg p-2 pl-7 text-xs text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Student Submissions ({filteredSubmissions.length})
          </h2>
          <span className="text-xs text-slate-500">Live Database Connected</span>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Student Submissions Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No submissions match the current filters. When students discover and complete their assigned formatives, their evaluated work appears here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Year / Class</th>
                  <th className="p-3">Subject & Formative</th>
                  <th className="p-3">Marks</th>
                  <th className="p-3">Score %</th>
                  <th className="p-3">Diagnosed Learning Gap</th>
                  <th className="p-3">Reflection</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const ass = assessments.find((a) => a.id === sub.formativeId);
                  const marksAwarded = sub.totalMarksAwarded ?? 0;
                  const maxMarks = sub.totalMaxMarks ?? ass?.blueprint.maxMarks ?? 20;
                  const pct = Math.round((marksAwarded / maxMarks) * 100);
                  const topGap = sub.diagnosis?.learningGaps[0]?.gap;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                          {sub.studentName?.charAt(0) || 'S'}
                        </div>
                        <span>{sub.studentName}</span>
                      </td>

                      <td className="p-3 text-slate-700">
                        <span className="font-semibold text-slate-900">{sub.classSection}</span>
                        <div className="text-[10px] text-slate-500">{sub.academicYear || DEFAULT_ACADEMIC_YEAR}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">
                          {ass?.blueprint.title || ass?.blueprint.topic || 'Formative Task'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {ass?.blueprint.subject || sub.subject || 'Sciences'} • {ass?.blueprint.curriculum || sub.curriculum}
                        </div>
                      </td>

                      <td className="p-3 font-bold text-slate-900">
                        {marksAwarded} / {maxMarks}
                        {sub.mypOverallAchievementLevel !== undefined && (
                          <div className="text-[10px] text-indigo-600 font-semibold">
                            Level {sub.mypOverallAchievementLevel}/8
                          </div>
                        )}
                      </td>

                      <td className="p-3">
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

                      <td className="p-3 text-slate-700 max-w-xs truncate" title={topGap || 'None diagnosed'}>
                        {topGap ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
                            {topGap}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No gaps diagnosed</span>
                        )}
                      </td>

                      <td className="p-3">
                        {sub.reflection ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reflected
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>

                      <td className="p-3 text-right space-x-2 whitespace-nowrap">
                        {ass && (
                          <>
                            <button
                              onClick={() => onViewMarking(ass, sub)}
                              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                            >
                              Evaluation Details
                            </button>
                            <button
                              onClick={() => ReportGenerator.generatePrintableReport(ass, sub)}
                              className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
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
        )}
      </div>

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
