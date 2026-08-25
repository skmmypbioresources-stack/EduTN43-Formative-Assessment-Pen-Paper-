import React, { useState } from 'react';
import {
  FormativeAssessment,
  Submission,
  UserProfile,
  Subject,
  ALL_SUBJECTS,
  CurriculumType,
  ACADEMIC_YEARS,
  DEFAULT_ACADEMIC_YEAR,
} from '../types';
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
  User,
  GraduationCap,
  Sparkles,
  Search,
  Calendar,
} from 'lucide-react';

interface StudentDashboardProps {
  activeStudent: UserProfile;
  assessments: FormativeAssessment[];
  submissions: Submission[];
  onStartAssessmentWithProfile: (
    assessment: FormativeAssessment,
    studentDetails: { name: string; classSection: string; curriculum: CurriculumType; academicYear: string }
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
  // Discovery Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pre-flight Launch Modal State
  const [targetAssessmentForStart, setTargetAssessmentForStart] = useState<FormativeAssessment | null>(null);
  const [studentFullName, setStudentFullName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('Grade 9A');
  const [studentCurriculum, setStudentCurriculum] = useState<CurriculumType>('IBMYP');
  const [studentAcademicYear, setStudentAcademicYear] = useState<string>(DEFAULT_ACADEMIC_YEAR);

  // Extract unique teachers and classes from published assessments
  const publishedAssessments = assessments.filter((a) => a.status === 'Published');
  
  const teacherOptions = Array.from(
    new Set(publishedAssessments.map((a) => a.blueprint.teacherName).filter(Boolean))
  );
  const classOptions = Array.from(
    new Set(publishedAssessments.map((a) => a.blueprint.classSection).filter(Boolean))
  );

  // Filter assessments based on student selection
  const filteredAssessments = publishedAssessments.filter((ass) => {
    const bp = ass.blueprint;
    if (selectedSubject !== 'All' && bp.subject !== selectedSubject) return false;
    if (selectedTeacher !== 'All' && bp.teacherName !== selectedTeacher) return false;
    if (selectedClass !== 'All' && bp.classSection !== selectedClass) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = bp.title?.toLowerCase().includes(q);
      const matchTopic = bp.topic?.toLowerCase().includes(q);
      const matchTeacher = bp.teacherName?.toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchTeacher) return false;
    }
    return true;
  });

  const handleOpenStartModal = (assessment: FormativeAssessment) => {
    setTargetAssessmentForStart(assessment);
    setStudentFullName(activeStudent.name !== 'Student' ? activeStudent.name : '');
    setStudentClass(assessment.blueprint.classSection || 'Grade 9A');
    setStudentCurriculum(assessment.blueprint.curriculum || 'IBMYP');
    setStudentAcademicYear(assessment.blueprint.academicYear || DEFAULT_ACADEMIC_YEAR);
  };

  const handleConfirmStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssessmentForStart || !studentFullName.trim()) return;

    onStartAssessmentWithProfile(targetAssessmentForStart, {
      name: studentFullName.trim(),
      classSection: studentClass.trim(),
      curriculum: studentCurriculum,
      academicYear: studentAcademicYear,
    });

    setTargetAssessmentForStart(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Student Portal Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs px-3 py-0.5 rounded-full font-semibold">
              Student Science Portal
            </span>
            <span className="text-xs text-slate-300">Live Database Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Assigned Science Formatives
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Select your Subject, Teacher, and Class to discover your tasks. Complete tasks to receive examiner-grade marks and personalized gap diagnosis.
          </p>
        </div>

        <button
          onClick={onViewProgress}
          className="px-5 py-2.5 bg-white text-blue-950 text-xs font-bold rounded-xl shadow-md flex items-center gap-2 hover:bg-slate-100 transition-colors"
        >
          <TrendingUp className="w-4 h-4 text-blue-700" />
          My Progress & Feedback History
        </button>
      </div>

      {/* Task Discovery & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Select Your Subject, Teacher & Class</span>
          </div>
          <span className="text-xs text-slate-500">
            Showing {filteredAssessments.length} of {publishedAssessments.length} Published Tasks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Subject Dropdown */}
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

          {/* Teacher Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Teachers</option>
              {teacherOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Class / Grade Section */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Class / Section</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Classes</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Search Topic / Title</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full border border-slate-300 rounded-lg p-2 pl-7 text-xs text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Published Tasks Grid */}
      <div className="space-y-4">
        {filteredAssessments.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Formative Tasks Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {publishedAssessments.length === 0
                ? 'No formative assessments have been published by teachers yet. When your teacher creates and publishes a task, it will appear here in real-time.'
                : 'No published tasks match your current subject, teacher, or class filters. Try switching filters to "All".'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssessments.map((ass) => {
              const bp = ass.blueprint;
              // Check if current user has submission for this task
              const sub = submissions.find(
                (s) => s.formativeId === ass.id && (s.studentId === activeStudent.id || s.studentName === activeStudent.name)
              );
              const isCompleted = !!sub;

              return (
                <div
                  key={ass.id}
                  className={`border rounded-xl p-5 transition-all flex flex-col justify-between space-y-4 ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {bp.subject}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {bp.curriculum} • {bp.yearGroup}
                        </span>
                      </div>

                      {isCompleted ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Evaluated
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Available
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug">{bp.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Topic: <strong className="text-slate-800">{bp.topic}</strong>
                      </p>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg space-y-1">
                      <div className="flex justify-between">
                        <span>Teacher:</span> <strong>{bp.teacherName || 'Sciences Faculty'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Class:</span> <strong>{bp.classSection}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Questions:</span> <strong>{ass.questions.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Limit:</span> <strong>{bp.timeLimitMinutes || 45} mins</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Marks:</span> <strong>{bp.maxMarks || 20} Marks</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewResults(ass, sub)}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Feedback ({sub.totalMarksAwarded}/{sub.totalMaxMarks})
                        </button>
                        {!sub.reflection && (
                          <button
                            onClick={() => onOpenReflection(ass, sub)}
                            className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Add Reflection
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenStartModal(ass)}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-transform hover:scale-102"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Assessment
                      </button>
                    )}

                    <span className="text-[11px] text-slate-400 font-medium">
                      {bp.academicYear || DEFAULT_ACADEMIC_YEAR}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Flight Student Start Modal */}
      {targetAssessmentForStart && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" /> Student Pre-Flight Registration
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Begin: {targetAssessmentForStart.blueprint.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Please enter your details to verify your submission identity before starting.
              </p>
            </div>

            <form onSubmit={handleConfirmStart} className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={studentFullName}
                  onChange={(e) => setStudentFullName(e.target.value)}
                  placeholder="e.g. Maya Chen, Liam Davis..."
                  className="w-full border-2 border-blue-200 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none bg-blue-50/20"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Begin Task Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
