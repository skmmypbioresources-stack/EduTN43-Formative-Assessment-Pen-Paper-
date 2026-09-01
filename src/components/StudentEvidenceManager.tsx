import React, { useState, useMemo, useEffect } from 'react';
import { StudentRecord, Submission, FormativeAssessment, DEFAULT_ACADEMIC_YEAR } from '../types';
import { StorageService } from '../services/storageService';
import { StudentEvidencePortfolioView } from './StudentEvidencePortfolioView';
import {
  Users,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
  Sparkles,
  FolderOpen,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  BookOpen,
} from 'lucide-react';

interface StudentEvidenceManagerProps {
  onBackToDashboard?: () => void;
}

export const StudentEvidenceManager: React.FC<StudentEvidenceManagerProps> = ({
  onBackToDashboard,
}) => {
  // Live state
  const [students, setStudents] = useState<StudentRecord[]>(() => StorageService.getStudents());
  const [submissions, setSubmissions] = useState<Record<string, Submission>>(() => StorageService.getSubmissions());
  const [assessments, setAssessments] = useState<FormativeAssessment[]>(() => StorageService.getAssessments());

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  
  // Copy link indicator per student id
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  // Modals & Drawers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showDomainModal, setShowDomainModal] = useState<boolean>(false);
  const [customDomainInput, setCustomDomainInput] = useState<string>(() => StorageService.getCustomBaseDomain());
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [previewingToken, setPreviewingToken] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single Add / Edit Form State
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    classSection: 'MYP 4 Bio',
    section: 'Biology',
    subject: 'Biology',
    email: '',
    academicYear: DEFAULT_ACADEMIC_YEAR,
  });

  // Bulk Import State
  const [csvText, setCsvText] = useState<string>('');
  const [importParsedRows, setImportParsedRows] = useState<Partial<StudentRecord>[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Real-time Firestore sync
  useEffect(() => {
    const unsubStudents = StorageService.subscribeToStudents((list) => setStudents(list));
    const unsubSubmissions = StorageService.subscribeToSubmissions((subs) => setSubmissions(subs));
    const unsubAssessments = StorageService.subscribeToAssessments((ass) => setAssessments(ass));
    const unsubDomain = StorageService.subscribeToDomainConfig((dom) => {
      setCustomDomainInput(dom);
    });

    return () => {
      unsubStudents();
      unsubSubmissions();
      unsubAssessments();
      unsubDomain();
    };
  }, []);

  // Check if active domain is an internal preview
  const isInternalOrigin = useMemo(() => {
    const currentBase = StorageService.getCustomBaseDomain();
    return StorageService.isAiStudioOrigin(currentBase);
  }, [customDomainInput]);

  // Class list for dropdown
  const classList = useMemo(() => {
    return ['FM4', 'FM5', 'MYP 2 Science', 'MYP 4 Bio', 'MYP 5 Bio'];
  }, []);

  // Map of studentId / name -> submissions count
  const studentSubmissionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const subs = Object.values(submissions) as Submission[];

    students.forEach((st) => {
      const stName = st.name.trim().toLowerCase();
      const stId = st.studentId.trim().toLowerCase();
      
      const count = subs.filter((sub) => {
        if (sub.studentId && (sub.studentId.toLowerCase() === stId || sub.studentId.toLowerCase() === st.id.toLowerCase())) {
          return true;
        }
        if (sub.studentName && sub.studentName.trim().toLowerCase() === stName) {
          return true;
        }
        return false;
      }).length;

      counts[st.id] = count;
    });

    return counts;
  }, [students, submissions]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const normClass = StorageService.normalizeClassSection(s.classSection);
      if (selectedClass !== 'All' && normClass !== selectedClass) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = s.name.toLowerCase();
        const id = s.studentId.toLowerCase();
        const email = s.email?.toLowerCase() || '';
        const sec = s.section?.toLowerCase() || '';
        if (!name.includes(q) && !id.includes(q) && !email.includes(q) && !sec.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedClass, searchTerm]);

  // Copy Link action
  const handleCopyLink = (student: StudentRecord) => {
    const currentBase = StorageService.getCustomBaseDomain();
    // If still pointing to an internal AI Studio dev preview, alert the user to configure Vercel URL
    if (StorageService.isAiStudioOrigin(currentBase)) {
      setNotificationMsg({
        type: 'error',
        text: 'Please configure your Vercel URL first so the copied link opens in Toddle without a 403 error.',
      });
      setShowDomainModal(true);
      return;
    }

    const url = StorageService.getStudentEvidenceUrl(student.evidenceToken);
    navigator.clipboard.writeText(url);
    setCopiedStudentId(student.id);
    setTimeout(() => {
      setCopiedStudentId(null);
    }, 2500);
  };

  // 1-Click Sync from existing submissions
  const handleSyncFromSubmissions = async () => {
    const createdCount = await StorageService.syncStudentsFromSubmissions();
    if (createdCount > 0) {
      setNotificationMsg({
        type: 'success',
        text: `Successfully created ${createdCount} student record(s) & permanent evidence links from existing submissions!`,
      });
    } else {
      setNotificationMsg({
        type: 'success',
        text: 'All existing submission students already have registered evidence records.',
      });
    }
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      name: student.name,
      classSection: student.classSection || 'MYP 5',
      section: student.section || 'Biology',
      subject: (student.subject as string) || 'Biology',
      email: student.email || '',
      academicYear: student.academicYear || DEFAULT_ACADEMIC_YEAR,
    });
    setShowAddModal(true);
  };

  // Save Single Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.studentId.trim()) {
      setNotificationMsg({ type: 'error', text: 'Please provide both Student Name and Student ID.' });
      return;
    }

    if (editingStudent) {
      const updated: StudentRecord = {
        ...editingStudent,
        studentId: formData.studentId.trim(),
        name: formData.name.trim(),
        classSection: formData.classSection.trim(),
        section: formData.section.trim(),
        subject: formData.subject,
        email: formData.email.trim(),
        academicYear: formData.academicYear || DEFAULT_ACADEMIC_YEAR,
        updatedAt: new Date().toISOString(),
      };
      await StorageService.saveStudent(updated);
      setNotificationMsg({ type: 'success', text: `Updated details for ${updated.name}.` });
    } else {
      const newRecord: StudentRecord = {
        id: formData.studentId.trim(),
        studentId: formData.studentId.trim(),
        name: formData.name.trim(),
        classSection: formData.classSection.trim(),
        section: formData.section.trim(),
        subject: formData.subject,
        curriculum: 'IBMYP',
        email: formData.email.trim(),
        academicYear: formData.academicYear || DEFAULT_ACADEMIC_YEAR,
        evidenceToken: StorageService.generateEvidenceToken(),
        createdAt: new Date().toISOString(),
      };
      await StorageService.saveStudent(newRecord);
      setNotificationMsg({ type: 'success', text: `Added ${newRecord.name} with permanent evidence link.` });
    }

    setShowAddModal(false);
    setEditingStudent(null);
    setFormData({
      studentId: '',
      name: '',
      classSection: 'MYP 5',
      section: 'Biology',
      subject: 'Biology',
      email: '',
      academicYear: DEFAULT_ACADEMIC_YEAR,
    });
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Delete Student
  const handleDeleteStudent = (student: StudentRecord) => {
    setStudentToDelete(student);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const target = studentToDelete;
    setStudentToDelete(null);
    await StorageService.deleteStudent(target.id);
    setStudents(StorageService.getStudents());
    setNotificationMsg({ type: 'success', text: `Deleted ${target.name} (${target.studentId}).` });
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Parse CSV text
  const handleParseCsv = (text: string) => {
    setCsvText(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setImportParsedRows([]);
      return;
    }

    const rows: Partial<StudentRecord>[] = [];
    const isHeader = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('id') || lines[0].toLowerCase().includes('student');
    const startIdx = isHeader ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      // Split by comma or tab (handles TSV copy/paste from Excel)
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length < 2) continue;

      const rawId = parts[0]?.trim() || '';
      const rawName = parts[1]?.trim() || '';
      const rawClass = parts[2]?.trim() || 'MYP 5';
      const rawSection = parts[3]?.trim() || 'Biology';
      const rawEmail = parts[4]?.trim() || '';

      if (rawName) {
        rows.push({
          studentId: rawId || `STU-${Math.floor(Math.random() * 10000)}`,
          name: rawName,
          classSection: rawClass,
          section: rawSection,
          subject: rawSection || 'Biology',
          curriculum: 'IBMYP',
          email: rawEmail,
        });
      }
    }

    setImportParsedRows(rows);
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (importParsedRows.length === 0) return;
    setIsImporting(true);
    try {
      const result = await StorageService.saveStudents(importParsedRows);
      setNotificationMsg({
        type: 'success',
        text: `Successfully imported ${result.importedCount} new student(s) and updated ${result.updatedCount} existing record(s)!`,
      });
      setShowImportModal(false);
      setCsvText('');
      setImportParsedRows([]);
    } catch (e) {
      setNotificationMsg({ type: 'error', text: 'An error occurred during student import.' });
    } finally {
      setIsImporting(false);
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  // Export CSV for Toddle
  const handleExportToddleCsv = () => {
    if (students.length === 0) {
      alert('No students to export.');
      return;
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Class & Section',
      'Subject',
      'Curriculum',
      'Academic Year',
      'Email',
      'Permanent Formative Evidence Link',
      'Evidence Token',
      'Submissions Count',
    ];

    const rows = students.map((s) => {
      const url = StorageService.getStudentEvidenceUrl(s.evidenceToken);
      const count = studentSubmissionCounts[s.id] || 0;
      return [
        `"${s.studentId.replace(/"/g, '""')}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${(s.classSection || 'MYP 5').replace(/"/g, '""')}"`,
        `"${(s.section || s.subject || 'Biology').replace(/"/g, '""')}"`,
        `"${(s.curriculum || 'IBMYP').replace(/"/g, '""')}"`,
        `"${(s.academicYear || DEFAULT_ACADEMIC_YEAR).replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${url}"`,
        `"${s.evidenceToken}"`,
        count,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Toddle_Formative_Evidence_Links_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotificationMsg({
      type: 'success',
      text: 'Exported Toddle-formatted CSV with all individual student evidence links.',
    });
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // If previewing a student's portfolio in a drawer/modal
  if (previewingToken) {
    return (
      <div className="min-h-screen bg-slate-50">
        <StudentEvidencePortfolioView
          token={previewingToken}
          onBackToPortal={() => setPreviewingToken(null)}
          isEmbeddedPreview
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-md animate-fade-in ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-950 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Link2 className="w-3.5 h-3.5" />
            <span>Toddle & LMS Integration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Student Formative Evidence Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Every student receives <strong>one permanent, unique link</strong>. Copy and paste this link into the student's evidence folder in Toddle. It automatically updates with all past and future formative responses, markings, feedback, and corrected papers.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingStudent(null);
              setFormData({
                studentId: `STU-${String(students.length + 1).padStart(3, '0')}`,
                name: '',
                classSection: 'MYP 5',
                section: 'Biology',
                subject: 'Biology',
                email: '',
                academicYear: DEFAULT_ACADEMIC_YEAR,
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import (CSV/Excel)</span>
          </button>

          <button
            onClick={handleExportToddleCsv}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
            title="Export all evidence links into CSV for Toddle"
          >
            <Download className="w-4 h-4" />
            <span>Export for Toddle</span>
          </button>
        </div>
      </div>

      {/* Toddle Step-by-Step Guide Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            1
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Copy Permanent Link</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Click <strong>"Copy Link"</strong> next to any student. The link is permanent for the academic year.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            2
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Add to Toddle Portfolio</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              In Toddle, open the student's Evidence/Portfolio area and paste the link as their Formative folder URL.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            3
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Automatic Live Updates</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Whenever the student completes a formative assessment, all answers, markings, and feedback update live!
            </p>
          </div>
        </div>
      </div>

      {/* Vercel Domain Alert Banner if in AI Studio / Dev Environment */}
      {isInternalOrigin && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-blue-500/10 border-2 border-amber-400/40 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-xs">
              ⚠️
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                Action Required: Enter Your Vercel URL for Toddle Links
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                You are currently inside the Google AI Studio editor preview. Links with <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono text-[11px]">ais-dev-*.run.app</code> are protected by Google authorization and will show a <span className="font-semibold text-rose-600">403 Forbidden</span> error in external browsers or Toddle.
                Please enter your live <strong>Vercel App URL</strong> so all "Copy Link" buttons generate working public Toddle links!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCustomDomainInput(StorageService.getCustomBaseDomain());
              setShowDomainModal(true);
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex-shrink-0 flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            <span>Enter Vercel URL Now</span>
          </button>
        </div>
      )}

      {/* Public Evidence Domain Configuration Bar */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl px-5 py-3.5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isInternalOrigin ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
          <span className="text-xs font-bold text-slate-400">Active Public Link Host:</span>
          <code className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-md ${isInternalOrigin ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' : 'bg-slate-800 text-blue-300'}`}>
            {StorageService.getCustomBaseDomain() || (typeof window !== 'undefined' ? window.location.origin : 'Current Host')}
          </code>
          {isInternalOrigin && (
            <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-medium border border-amber-500/30">
              Dev Sandbox
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setCustomDomainInput(StorageService.getCustomBaseDomain());
            setShowDomainModal(true);
          }}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{isInternalOrigin ? 'Set Vercel Domain' : 'Configure Public Domain'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          >
            <option value="All">All Classes ({students.length} students)</option>
            {classList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Sync existing submissions button */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleSyncFromSubmissions}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            title="Auto-scan submissions and create student records if any are missing"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync from Submissions</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No student records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add individual students or import a class roster from CSV/Excel to generate permanent Toddle evidence links.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Add First Student
              </button>
              <button
                onClick={handleSyncFromSubmissions}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Sync Existing Submissions
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Student ID & Name</th>
                  <th className="py-3 px-4">Class / Section</th>
                  <th className="py-3 px-4">Evidence Stored</th>
                  <th className="py-3 px-4">Permanent Evidence Link (Toddle)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((st) => {
                  const url = StorageService.getStudentEvidenceUrl(st.evidenceToken);
                  const isCopied = copiedStudentId === st.id;
                  const count = studentSubmissionCounts[st.id] || 0;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{st.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {st.studentId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs">
                          {st.classSection} {st.section ? `• ${st.section}` : ''}
                        </span>
                      </td>

                      {/* Evidence Count */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${count > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="font-bold text-slate-800">{count}</span>
                          <span className="text-slate-500">formative{count === 1 ? '' : 's'}</span>
                        </div>
                      </td>

                      {/* Evidence Link */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 max-w-sm">
                          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-600 truncate select-all">
                            {url}
                          </div>
                          <button
                            onClick={() => handleCopyLink(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0 ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title="Copy link to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Open Evidence Portfolio in New Tab (Test External Link)"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setPreviewingToken(st.evidenceToken)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview Student Evidence Portfolio"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Student Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Student ID / Roll No *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 001, STU-101"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student A, Arun Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Class / Year Group</label>
                  <input
                    type="text"
                    placeholder="e.g. MYP 5, Grade 9A"
                    value={formData.classSection}
                    onChange={(e) => setFormData({ ...formData, classSection: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Subject / Section</label>
                  <input
                    type="text"
                    placeholder="e.g. Biology, Physics"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Student Email (Optional)</label>
                <input
                  type="email"
                  placeholder="student@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                A permanent, unique evidence URL will be automatically generated for this student and will remain consistent across all assessments.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  {editingStudent ? 'Save Changes' : 'Generate Student Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Bulk Import Class Roster</h3>
                  <p className="text-xs text-slate-500">Paste your class roster from Excel, Google Sheets, or CSV</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvText('');
                  setImportParsedRows([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Supported Format:</div>
                <p className="text-slate-600">
                  Columns: <code>Student ID, Student Name, Class/Grade, Subject, Email</code>
                </p>
                <p className="text-[11px] text-slate-500">
                  Example: <code>001, Student A, MYP 5, Biology, studenta@school.edu</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Paste Student List / CSV:</label>
                <textarea
                  rows={6}
                  placeholder={`001, Student A, MYP 5, Biology\n002, Student B, MYP 5, Biology\n003, Student C, MYP 5, Biology`}
                  value={csvText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Parsed Rows Preview */}
              {importParsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>Parsed {importParsedRows.length} Student(s) Preview:</span>
                    <span className="text-emerald-600 text-[11px] font-semibold">Ready to generate links ✓</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">Name</th>
                          <th className="p-2">Class</th>
                          <th className="p-2">Subject</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importParsedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{r.studentId}</td>
                            <td className="p-2 font-bold text-slate-800">{r.name}</td>
                            <td className="p-2">{r.classSection}</td>
                            <td className="p-2">{r.section || r.subject}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setCsvText('');
                  setImportParsedRows([]);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importParsedRows.length === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                {isImporting ? 'Generating Links...' : `Import & Generate ${importParsedRows.length} Links`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC BASE DOMAIN CONFIGURATION MODAL */}
      {showDomainModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Set Production Vercel App Domain</h3>
                  <p className="text-xs text-slate-500">Configure the public domain used for Toddle Evidence links</p>
                </div>
              </div>
              <button
                onClick={() => setShowDomainModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await StorageService.setCustomBaseDomain(customDomainInput);
                setShowDomainModal(false);
                setNotificationMsg({
                  type: 'success',
                  text: customDomainInput.trim()
                    ? `Public evidence domain saved: ${StorageService.getCustomBaseDomain()}`
                    : 'Evidence links reset to active host.',
                });
                setTimeout(() => setNotificationMsg(null), 3500);
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  Your Vercel Production URL or Custom Domain:
                </label>
                <input
                  type="text"
                  placeholder="https://your-formative-app.vercel.app"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs font-medium"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enter your deployed Vercel domain (e.g. <code>https://my-school-formatives.vercel.app</code>). All "Copy Link" buttons will automatically use this URL so students and Toddle can open links directly without any login requirement.
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 block text-[11px]">Link Preview Example:</span>
                <code className="text-xs text-blue-600 font-mono font-semibold block break-all">
                  {(customDomainInput.trim() || 'https://your-app.vercel.app').replace(/\/+$/, '')}/?evidence=eMYP4_8496_jdd
                </code>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    setCustomDomainInput('');
                    await StorageService.setCustomBaseDomain('');
                    setShowDomainModal(false);
                    setNotificationMsg({
                      type: 'success',
                      text: 'Domain reset to default host.',
                    });
                    setTimeout(() => setNotificationMsg(null), 3000);
                  }}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  Reset to Default
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDomainModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                  >
                    Save Vercel Domain
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CONFIRM DELETE MODAL */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Student Record?</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{studentToDelete.name}</span> (ID: <span className="font-mono text-slate-700">{studentToDelete.studentId}</span>)?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
