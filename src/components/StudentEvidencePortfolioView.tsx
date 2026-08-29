import React, { useState, useMemo, useEffect } from 'react';
import {
  StudentRecord,
  FormativeAssessment,
  Submission,
  Question,
  StudentResponse,
  QuestionMarkingResult,
  DEFAULT_ACADEMIC_YEAR,
} from '../types';
import { StorageService } from '../services/storageService';
import { ReportGenerator } from '../services/reportGenerator';
import { ScienceGraphViewer } from './ScienceGraphViewer';
import {
  Folder,
  FolderOpen,
  GraduationCap,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  FileText,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  Target,
  ArrowLeft,
  Calendar,
  Layers,
  HelpCircle,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

interface StudentEvidencePortfolioViewProps {
  token: string;
  onBackToPortal?: () => void;
  isEmbeddedPreview?: boolean;
}

export const StudentEvidencePortfolioView: React.FC<StudentEvidencePortfolioViewProps> = ({
  token,
  onBackToPortal,
  isEmbeddedPreview = false,
}) => {
  // Live state
  const [students, setStudents] = useState<StudentRecord[]>(() => StorageService.getStudents());
  const [assessments, setAssessments] = useState<FormativeAssessment[]>(() => StorageService.getAssessments());
  const [submissions, setSubmissions] = useState<Record<string, Submission>>(() => StorageService.getSubmissions());

  // Search & Filter within portfolio
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Marked' | 'Submitted' | 'Pending'>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  
  // Expanded formative folders
  const [expandedFormatives, setExpandedFormatives] = useState<Record<string, boolean>>({});
  // Active detail tab per formative: 'overview' | 'response' | 'marking' | 'feedback' | 'corrected' | 'reflection'
  const [activeTabPerFormative, setActiveTabPerFormative] = useState<Record<string, string>>({});

  // Real-time Firestore sync
  const [hasReceivedFirstSnapshot, setHasReceivedFirstSnapshot] = useState(false);

  useEffect(() => {
    let receivedCount = 0;
    const markReceived = () => {
      receivedCount++;
      if (receivedCount >= 1) {
        setHasReceivedFirstSnapshot(true);
      }
    };

    const unsubStudents = StorageService.subscribeToStudents((list) => {
      setStudents(list);
      markReceived();
    });
    const unsubAssessments = StorageService.subscribeToAssessments((items) => {
      setAssessments(items);
      markReceived();
    });
    const unsubSubmissions = StorageService.subscribeToSubmissions((subs) => {
      setSubmissions(subs);
      markReceived();
    });

    const timer = setTimeout(() => {
      setHasReceivedFirstSnapshot(true);
    }, 1200);

    return () => {
      clearTimeout(timer);
      unsubStudents();
      unsubAssessments();
      unsubSubmissions();
    };
  }, []);

  // 1. Resolve Student from Token (supports token, roll number, id, or name)
  const student = useMemo(() => {
    if (!token) return undefined;
    const cleanToken = token.trim();
    const found = StorageService.getStudentByToken(cleanToken) || students.find((s) => s.evidenceToken === cleanToken);
    if (found) return found;

    // Fallback 1: Match by studentId or internal id
    const byId = students.find(
      (s) => s.id.toLowerCase() === cleanToken.toLowerCase() || (s.studentId && s.studentId.toLowerCase() === cleanToken.toLowerCase())
    );
    if (byId) return byId;

    // Fallback 2: Match by name
    return StorageService.getStudentByName(cleanToken) || students.find((s) => s.name.toLowerCase().includes(cleanToken.toLowerCase()));
  }, [token, students]);

  // 2. Identify all submissions strictly belonging to this student
  const studentSubmissions = useMemo(() => {
    if (!student) return [];
    const allSubs = Object.values(submissions) as Submission[];
    const stId = (student.studentId || student.id || '').trim().toLowerCase();
    const stName = (student.name || '').trim().toLowerCase();
    const stWords = stName.split(/\s+/).filter((w) => w.length >= 2);
    
    return allSubs.filter((sub) => {
      // 1. Direct ID match
      if (sub.studentId) {
        const subId = sub.studentId.trim().toLowerCase();
        if (subId === stId || subId === student.id.toLowerCase()) return true;
      }
      // 2. Exact or substring name match
      if (sub.studentName && stName) {
        const subName = sub.studentName.trim().toLowerCase();
        if (subName === stName) return true;

        // Sub-word matching (e.g. "JAS DARYANI" matches "JAS DHIRAJ DARYANI")
        const subWords = subName.split(/\s+/).filter((w) => w.length >= 2);
        if (subWords.length >= 2 && stWords.length >= 2) {
          const allSubInSt = subWords.every((w) => stWords.includes(w));
          const allStInSub = stWords.every((w) => subWords.includes(w));
          if (allSubInSt || allStInSub) return true;
        }
      }
      return false;
    });
  }, [student, submissions]);

  // Map of formativeId -> submission
  const submissionsByFormativeId = useMemo(() => {
    const map = new Map<string, Submission>();
    studentSubmissions.forEach((sub) => {
      map.set(sub.formativeId, sub);
    });
    return map;
  }, [studentSubmissions]);

  // 3. Relevant Formative Assessments (all formatives where student has a submission, or published formatives matching class)
  const formativeItems = useMemo(() => {
    if (!student) return [];

    const items: {
      assessment: FormativeAssessment;
      submission?: Submission;
      formativeNumberNum: number;
    }[] = [];

    const addedFormativeIds = new Set<string>();

    // First, add all formatives where student has a submission
    studentSubmissions.forEach((sub) => {
      const ass = assessments.find((a) => a.id === sub.formativeId);
      if (ass && !addedFormativeIds.has(ass.id)) {
        addedFormativeIds.add(ass.id);
        const matchNum = ass.blueprint.formativeNumber?.match(/\d+/);
        const num = matchNum ? parseInt(matchNum[0], 10) : 999;
        items.push({
          assessment: ass,
          submission: sub,
          formativeNumberNum: num,
        });
      }
    });

    // Also include published formatives assigned to this student's class
    assessments.forEach((ass) => {
      if (
        ass.status === 'Published' &&
        !addedFormativeIds.has(ass.id) &&
        (ass.blueprint.classSection === student.classSection ||
          ass.blueprint.yearGroup === student.classSection ||
          !ass.blueprint.classSection)
      ) {
        addedFormativeIds.add(ass.id);
        const matchNum = ass.blueprint.formativeNumber?.match(/\d+/);
        const num = matchNum ? parseInt(matchNum[0], 10) : 999;
        items.push({
          assessment: ass,
          submission: submissionsByFormativeId.get(ass.id),
          formativeNumberNum: num,
        });
      }
    });

    // Sort chronologically / by formative number
    items.sort((a, b) => {
      if (a.formativeNumberNum !== b.formativeNumberNum) {
        return a.formativeNumberNum - b.formativeNumberNum;
      }
      return new Date(b.assessment.createdAt).getTime() - new Date(a.assessment.createdAt).getTime();
    });

    return items;
  }, [student, assessments, studentSubmissions, submissionsByFormativeId]);

  // Set default expanded for latest items on initial load
  useEffect(() => {
    if (formativeItems.length > 0 && Object.keys(expandedFormatives).length === 0) {
      const initial: Record<string, boolean> = {};
      formativeItems.forEach((item, idx) => {
        initial[item.assessment.id] = idx === 0; // Expand first one
      });
      setExpandedFormatives(initial);
    }
  }, [formativeItems]);

  // Filtered formatives based on user search/filters
  const filteredFormativeItems = useMemo(() => {
    return formativeItems.filter(({ assessment, submission }) => {
      // Status filter
      if (statusFilter === 'Marked') {
        const isMarked = submission && (submission.status === 'Marked' || submission.teacherFeedback || (submission.totalMarksAwarded !== undefined && submission.totalMarksAwarded > 0));
        if (!isMarked) return false;
      } else if (statusFilter === 'Submitted') {
        if (!submission) return false;
      } else if (statusFilter === 'Pending') {
        if (submission) return false;
      }

      // Subject filter
      if (subjectFilter !== 'All' && assessment.blueprint.subject !== subjectFilter) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const title = assessment.blueprint.title?.toLowerCase() || '';
        const topic = assessment.blueprint.topic?.toLowerCase() || '';
        const fNum = assessment.blueprint.formativeNumber?.toLowerCase() || '';
        const type = assessment.blueprint.formativeType?.toLowerCase() || '';
        const crit = assessment.blueprint.selectedCriterion?.toLowerCase() || '';
        if (!title.includes(q) && !topic.includes(q) && !fNum.includes(q) && !type.includes(q) && !crit.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [formativeItems, statusFilter, subjectFilter, searchTerm]);

  // Portfolio metrics summary
  const summaryMetrics = useMemo(() => {
    const totalCount = formativeItems.length;
    const completedCount = studentSubmissions.length;
    const markedSubs = studentSubmissions.filter(
      (s) => s.status === 'Marked' || s.teacherFeedback || (s.totalMarksAwarded !== undefined && s.totalMarksAwarded > 0)
    );
    const markedCount = markedSubs.length;

    let totalEarned = 0;
    let totalPossible = 0;
    let mypLevels: number[] = [];

    markedSubs.forEach((s) => {
      const ass = assessments.find((a) => a.id === s.formativeId);
      const earned = s.totalMarksAwarded || 0;
      const max = s.totalMaxMarks || ass?.blueprint.maxMarks || 20;
      totalEarned += earned;
      totalPossible += max;
      if (s.mypOverallAchievementLevel) {
        mypLevels.push(s.mypOverallAchievementLevel);
      }
    });

    const averagePercentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
    const averageMypLevel = mypLevels.length > 0 ? (mypLevels.reduce((a, b) => a + b, 0) / mypLevels.length).toFixed(1) : null;

    return {
      totalCount,
      completedCount,
      markedCount,
      averagePercentage,
      averageMypLevel,
    };
  }, [formativeItems, studentSubmissions, assessments]);

  // Toggle accordion card
  const toggleExpand = (id: string) => {
    setExpandedFormatives((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    formativeItems.forEach((item) => {
      all[item.assessment.id] = true;
    });
    setExpandedFormatives(all);
  };

  const collapseAll = () => {
    setExpandedFormatives({});
  };

  // Distinct subjects in student's portfolio
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    formativeItems.forEach((i) => {
      if (i.assessment.blueprint.subject) set.add(i.assessment.blueprint.subject);
    });
    return Array.from(set);
  }, [formativeItems]);

  // If still connecting/loading initial Firestore data
  if (!student && !hasReceivedFirstSnapshot) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Loading Student Formative Portfolio</h3>
          <p className="text-xs text-slate-500">Connecting to school evidence records...</p>
        </div>
      </div>
    );
  }

  // If token is invalid or student not found
  if (!student) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student Evidence Link Not Found</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            The formative evidence link you entered does not match an active student portfolio. Please verify the URL or contact your science teacher.
          </p>
          <div className="pt-2">
            {onBackToPortal ? (
              <button
                onClick={onBackToPortal}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
              >
                Return to Assessment Hub
              </button>
            ) : (
              <a
                href="/"
                className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
              >
                Go to Formative Home
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Header Title
  const headerClassSubject = `${student.classSection || 'MYP 5'} ${student.section || student.subject || 'Biology'}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans antialiased">
      {/* Top Banner Navigation Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToPortal && (
              <button
                onClick={onBackToPortal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xs">
                <FolderOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block leading-none">
                  Student Formative Evidence
                </span>
                <span className="text-sm font-extrabold text-white leading-tight">
                  {student.name} • {student.studentId || 'ID'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Permanent Evidence Portfolio</span>
            </span>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Print portfolio"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Portfolio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Evidence Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* Student Evidence Portfolio Header Banner */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{headerClassSubject} — Formative Evidence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Student: {student.name}
              </h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Student ID:</span>
                  <strong className="text-white">{student.studentId}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Class & Section:</span>
                  <strong className="text-white">{student.classSection} {student.section ? `(${student.section})` : ''}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Curriculum:</span>
                  <strong className="text-white">{student.curriculum || 'IBMYP Sciences'}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Academic Year:</span>
                  <strong className="text-white">{student.academicYear || DEFAULT_ACADEMIC_YEAR}</strong>
                </span>
              </div>
            </div>

            {/* Toddle / Permanent URL Badge */}
            <div className="bg-slate-800/80 backdrop-blur-xs border border-slate-700/80 rounded-2xl p-4 text-xs space-y-1.5 md:max-w-xs shadow-inner">
              <div className="text-slate-400 font-medium flex items-center justify-between">
                <span>Toddle Evidence Link</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                This permanent link continuously synchronizes all formative assessment submissions, teacher marking, feedback, and corrected papers throughout the year.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-white">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[11px] text-slate-400 font-medium">Total Formatives</div>
              <div className="text-xl font-bold text-white mt-0.5">{summaryMetrics.totalCount}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Submitted</span>
              </div>
              <div className="text-xl font-bold text-white mt-0.5">{summaryMetrics.completedCount}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>Marked & Evaluated</span>
              </div>
              <div className="text-xl font-bold text-white mt-0.5">{summaryMetrics.markedCount}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-[11px] text-indigo-300 font-medium">Average Marks / Level</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {summaryMetrics.averagePercentage > 0 ? `${summaryMetrics.averagePercentage}%` : '—'}
                {summaryMetrics.averageMypLevel ? ` (L${summaryMetrics.averageMypLevel})` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search formative topic or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
            >
              <option value="All">All Statuses ({formativeItems.length})</option>
              <option value="Marked">Marked by Teacher</option>
              <option value="Submitted">Submitted Work</option>
              <option value="Pending">Pending Completion</option>
            </select>

            {/* Subject Filter if multiple */}
            {subjectsList.length > 1 && (
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="All">All Subjects</option>
                {subjectsList.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto text-xs">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Formative Evidence Cards List */}
        <div className="space-y-4">
          {filteredFormativeItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <Folder className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No formative evidence matches your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing the search or status filter to see all formative tasks in this student's folder.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setSubjectFilter('All');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredFormativeItems.map(({ assessment, submission }, index) => {
              const isExpanded = !!expandedFormatives[assessment.id];
              const bp = assessment.blueprint;
              const isSubmitted = !!submission;
              const isMarked = isSubmitted && (submission.status === 'Marked' || !!submission.teacherFeedback || (submission.totalMarksAwarded !== undefined && submission.totalMarksAwarded > 0));
              const currentDetailTab = activeTabPerFormative[assessment.id] || 'response';

              const marksAwarded = submission?.totalMarksAwarded ?? 0;
              const maxMarks = submission?.totalMaxMarks ?? bp.maxMarks ?? 20;
              const scorePct = Math.round((marksAwarded / maxMarks) * 100);
              const mypLevel = submission?.mypOverallAchievementLevel;

              return (
                <div
                  key={assessment.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                    isExpanded ? 'border-indigo-300 ring-2 ring-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header Accordion Trigger */}
                  <div
                    onClick={() => toggleExpand(assessment.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-2xl flex-shrink-0 mt-0.5 ${
                        isMarked
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : isSubmitted
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {isMarked ? (
                          <Award className="w-6 h-6" />
                        ) : isSubmitted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Clock className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {bp.formativeNumber || `Formative ${index + 1}`}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {bp.selectedCriterion || bp.formativeType}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {bp.subject} • {bp.topic}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {bp.title}
                        </h3>

                        {/* Status Checkmarks */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            isSubmitted ? 'text-emerald-700' : 'text-slate-400'
                          }`}>
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isSubmitted ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span>Submitted: {isSubmitted ? '✓' : 'Pending'}</span>
                          </span>

                          <span className="text-slate-300">•</span>

                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            isMarked ? 'text-blue-700' : 'text-slate-400'
                          }`}>
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isMarked ? 'text-blue-600' : 'text-slate-300'}`} />
                            <span>Marked: {isMarked ? '✓' : 'In Review'}</span>
                          </span>

                          {isSubmitted && submission.submittedAt && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500">
                                Date: {new Date(submission.submittedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score / Action Indicators */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {isMarked ? (
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900 leading-tight">
                            {marksAwarded} / {maxMarks} <span className="text-xs font-semibold text-slate-500">Marks</span>
                          </div>
                          <div className="text-xs font-bold text-emerald-600">
                            {scorePct}% {mypLevel ? `• Level ${mypLevel}/8` : ''}
                          </div>
                        </div>
                      ) : isSubmitted ? (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-xl">
                          Awaiting Teacher Feedback
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-xl">
                          Assigned
                        </span>
                      )}

                      <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Evidence Detail View */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-6 space-y-6">
                      
                      {/* Evidence Tabs */}
                      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                        <button
                          onClick={() => setActiveTabPerFormative((p) => ({ ...p, [assessment.id]: 'response' }))}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                            currentDetailTab === 'response'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View My Response</span>
                        </button>

                        <button
                          onClick={() => setActiveTabPerFormative((p) => ({ ...p, [assessment.id]: 'marking' }))}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                            currentDetailTab === 'marking'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>View Marking & Scores</span>
                        </button>

                        <button
                          onClick={() => setActiveTabPerFormative((p) => ({ ...p, [assessment.id]: 'feedback' }))}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                            currentDetailTab === 'feedback'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>View Teacher Feedback</span>
                        </button>

                        <button
                          onClick={() => setActiveTabPerFormative((p) => ({ ...p, [assessment.id]: 'corrected' }))}
                          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                            currentDetailTab === 'corrected'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>View Corrected Paper & PDF</span>
                        </button>

                        {submission?.reflection && (
                          <button
                            onClick={() => setActiveTabPerFormative((p) => ({ ...p, [assessment.id]: 'reflection' }))}
                            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                              currentDetailTab === 'reflection'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>My Reflection</span>
                          </button>
                        )}
                      </div>

                      {/* TAB 1: STUDENT'S ORIGINAL RESPONSE */}
                      {currentDetailTab === 'response' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>Student's Authentic Submitted Responses</span>
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              Total Questions: {assessment.questions.length}
                            </span>
                          </div>

                          {!isSubmitted ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-xs">
                              No response has been submitted yet for this formative assessment.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {assessment.questions.map((q, qIdx) => {
                                const resp = submission.responses[q.id];
                                return (
                                  <div
                                    key={q.id}
                                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs"
                                  >
                                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                                      <div className="space-y-0.5">
                                        <span className="text-xs font-bold text-slate-500 uppercase">
                                          Question {q.questionNumber}{q.subQuestionLabel ? ` (${q.subQuestionLabel})` : ''}
                                        </span>
                                        <div className="text-xs text-blue-600 font-semibold">
                                          Command Term: <span className="uppercase">{q.commandTerm}</span> • {q.type.replace('_', ' ')}
                                        </div>
                                      </div>
                                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                                        Max Marks: {q.maxMarks}
                                      </span>
                                    </div>

                                    {/* Prompt */}
                                    <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                                      {q.prompt}
                                    </div>

                                    {/* Stimulus Graph / Table if question contains dataset */}
                                    {q.dataset && (
                                      <div className="my-3">
                                        <ScienceGraphViewer
                                          dataset={q.dataset}
                                          graphType={q.graphType || 'line'}
                                          readOnly
                                        />
                                      </div>
                                    )}

                                    {/* Student's Answer Box */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                      <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                                        <span>Student's Answer:</span>
                                        {resp?.timestamp && (
                                          <span className="text-[11px] font-normal text-slate-400">
                                            Logged: {new Date(resp.timestamp).toLocaleTimeString()}
                                          </span>
                                        )}
                                      </div>

                                      {q.type === 'mcq' ? (
                                        <div className="space-y-2 pt-1">
                                          {q.options?.map((opt) => {
                                            const isSelected = resp?.selectedOptionId === opt.id;
                                            return (
                                              <div
                                                key={opt.id}
                                                className={`p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                                                  isSelected
                                                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                                    : 'bg-white border-slate-200 text-slate-600 opacity-80'
                                                }`}
                                              >
                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                  {opt.id}
                                                </span>
                                                <span>{opt.text}</span>
                                                {isSelected && (
                                                  <span className="ml-auto text-xs font-bold text-blue-600">Selected ✓</span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-slate-900 whitespace-pre-wrap leading-relaxed font-sans bg-white p-3 rounded-lg border border-slate-200">
                                          {resp?.textAnswer?.trim() || (
                                            <span className="text-slate-400 italic">No answer entered.</span>
                                          )}
                                        </div>
                                      )}

                                      {resp?.flagged && (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                          <span><strong>Student Flag:</strong> {resp.flagReason || 'Question was flagged during assessment'} {resp.flagNotes ? `— "${resp.flagNotes}"` : ''}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 2: MARKING & CRITERION RESULTS */}
                      {currentDetailTab === 'marking' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <Award className="w-4 h-4 text-blue-600" />
                              <span>Examiner Marking & Criterion Achievement</span>
                            </h4>
                            {isMarked && (
                              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                Total: {marksAwarded} / {maxMarks} Marks ({scorePct}%)
                              </div>
                            )}
                          </div>

                          {!isMarked ? (
                            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                              This formative submission is currently undergoing teacher review and marking.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {assessment.questions.map((q) => {
                                const res = submission.markingResults?.[q.id];
                                const tf = submission.teacherFeedback?.questionFeedback?.[q.id];
                                const awarded = tf?.marksAwarded ?? res?.marksAwarded ?? 0;

                                return (
                                  <div
                                    key={q.id}
                                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs"
                                  >
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <span className="text-xs font-bold text-slate-800">
                                        Question {q.questionNumber}{q.subQuestionLabel ? ` (${q.subQuestionLabel})` : ''} — {q.commandTerm}
                                      </span>
                                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                        awarded === q.maxMarks
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : awarded > 0
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        Awarded: {awarded} / {q.maxMarks} Marks
                                      </span>
                                    </div>

                                    {/* Marking Points Breakdown */}
                                    {res?.markingPoints && res.markingPoints.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <div className="text-xs font-bold text-slate-700">Mark Scheme Points:</div>
                                        <div className="space-y-1">
                                          {res.markingPoints.map((pt, pIdx) => (
                                            <div
                                              key={pIdx}
                                              className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                                                pt.isAwarded
                                                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                                  : 'bg-rose-50/60 border-rose-200 text-rose-950'
                                              }`}
                                            >
                                              <span className={`font-bold mt-0.5 px-1.5 py-0.5 rounded text-[10px] ${
                                                pt.isAwarded ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                              }`}>
                                                {pt.isAwarded ? `+${pt.marks}` : '0'}
                                              </span>
                                              <div className="flex-1 space-y-0.5">
                                                <div className="font-medium">{pt.point}</div>
                                                {pt.evidenceFound && (
                                                  <div className="text-[11px] text-emerald-800 italic">
                                                    Evidence found: "{pt.evidenceFound}"
                                                  </div>
                                                )}
                                                {pt.missingReason && (
                                                  <div className="text-[11px] text-rose-800">
                                                    Missing: {pt.missingReason}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Examiner Explanation for Marks Lost */}
                                    {res?.whyMarksWereLost && (
                                      <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg text-xs text-amber-900 space-y-1">
                                        <div className="font-bold">Examiner Observation / Why Marks Were Lost:</div>
                                        <div>{res.whyMarksWereLost}</div>
                                      </div>
                                    )}

                                    {/* Actionable Improvement */}
                                    {res?.howToImprove && (
                                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg text-xs text-blue-900 space-y-1">
                                        <div className="font-bold">How to Improve Response:</div>
                                        <div>{res.howToImprove}</div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 3: TEACHER FEEDBACK & EVALUATION */}
                      {currentDetailTab === 'feedback' && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            <span>Teacher Feedback & Learning Diagnosis</span>
                          </h4>

                          {submission?.teacherFeedback ? (
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-5">
                              <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                                <div>
                                  <div className="text-xs font-bold text-emerald-800">
                                    Assessed & Published by: {submission.teacherFeedback.markedByName}
                                  </div>
                                  <div className="text-[11px] text-emerald-700">
                                    Date: {new Date(submission.teacherFeedback.publishedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                  Verified Teacher Evaluation ✓
                                </span>
                              </div>

                              {/* Overall Comment */}
                              <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1">
                                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                  Overall Assessment Feedback:
                                </div>
                                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                  {submission.teacherFeedback.overallComment}
                                </p>
                              </div>

                              {/* Strengths */}
                              {submission.teacherFeedback.strengths && submission.teacherFeedback.strengths.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="text-xs font-bold text-emerald-900">Key Strengths Demonstrated:</div>
                                  <ul className="list-disc pl-5 text-xs text-emerald-900 space-y-1">
                                    {submission.teacherFeedback.strengths.map((s, idx) => (
                                      <li key={idx}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Priority Improvement Target */}
                              {submission.teacherFeedback.priorityImprovementTarget && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
                                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    <span>Priority Improvement Target:</span>
                                  </div>
                                  <p className="text-xs text-blue-950 font-medium">
                                    {submission.teacherFeedback.priorityImprovementTarget}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                              Personalized teacher feedback will appear here as soon as the teacher completes marking.
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 4: CORRECTED PAPER & PDF REPORT */}
                      {currentDetailTab === 'corrected' && (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                <span>Corrected Paper & Official Model Responses</span>
                              </h4>
                              <p className="text-xs text-slate-500">
                                Compare your answers with official model responses and mark scheme criteria.
                              </p>
                            </div>

                            {isSubmitted && (
                              <button
                                onClick={() => ReportGenerator.generatePrintableReport(assessment, submission)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download PDF Report</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-4">
                            {assessment.questions.map((q) => {
                              const resp = submission?.responses[q.id];
                              return (
                                <div
                                  key={q.id}
                                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs"
                                >
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-800">
                                      Question {q.questionNumber}{q.subQuestionLabel ? ` (${q.subQuestionLabel})` : ''}
                                    </span>
                                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                      {q.maxMarks} Marks
                                    </span>
                                  </div>

                                  <div className="text-xs font-semibold text-slate-800">{q.prompt}</div>

                                  {/* Side by side comparison */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                                      <div className="text-[11px] font-bold text-slate-600">Your Answer:</div>
                                      <div className="text-xs text-slate-800 whitespace-pre-wrap">
                                        {resp?.textAnswer || resp?.selectedOptionId || 'No response entered.'}
                                      </div>
                                    </div>

                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                                      <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Official Model Expected Answer:</span>
                                      </div>
                                      <div className="text-xs text-emerald-950 font-medium whitespace-pre-wrap">
                                        {q.expectedAnswer}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Mark Scheme Guidance */}
                                  {q.markScheme?.generalGuidance && (
                                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                      <strong>Marking Guidance:</strong> {q.markScheme.generalGuidance}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* TAB 5: STUDENT SELF-REFLECTION */}
                      {currentDetailTab === 'reflection' && submission?.reflection && (
                        <div className="bg-white border border-purple-200 rounded-2xl p-6 space-y-4 shadow-xs">
                          <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            <span>Student Metacognitive Reflection</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-1">
                              <div className="font-bold text-purple-900">What I did well:</div>
                              <p className="text-slate-800">{submission.reflection.whatDidIWell || '—'}</p>
                            </div>
                            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-1">
                              <div className="font-bold text-purple-900">What I found challenging:</div>
                              <p className="text-slate-800">{submission.reflection.whatDidIFindDifficult || '—'}</p>
                            </div>
                            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-1">
                              <div className="font-bold text-purple-900">Concepts to improve:</div>
                              <p className="text-slate-800">{submission.reflection.whatConceptOrSkillToImprove || '—'}</p>
                            </div>
                            <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 space-y-1">
                              <div className="font-bold text-purple-900">Specific learning target:</div>
                              <p className="text-slate-800">{submission.reflection.specificLearningTarget || '—'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 pt-8 pb-4 space-y-1">
          <p>Formative IQ • Permanent Formative Assessment Evidence Repository</p>
          <p className="text-[11px]">Synced with Toddle Student Portfolio • Academic Year {student.academicYear || DEFAULT_ACADEMIC_YEAR}</p>
        </div>
      </div>
    </div>
  );
};
