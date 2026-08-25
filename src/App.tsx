import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  FormativeAssessment,
  Submission,
  FormativeBlueprint,
  StudentResponse,
  CurriculumType,
  DEFAULT_ACADEMIC_YEAR,
} from './types';
import { StorageService, DEFAULT_TEACHER, DEFAULT_STUDENT } from './services/storageService';
import { GeminiService } from './services/geminiService';
import { Navbar } from './components/Navbar';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentWorksView } from './components/StudentWorksView';
import { FormativeBuilder } from './components/FormativeBuilder';
import { AssessmentReview } from './components/AssessmentReview';
import { StudentAssessmentRunner } from './components/StudentAssessmentRunner';
import { MarkingAndFeedbackView } from './components/MarkingAndFeedbackView';
import { ClassAnalyticsView } from './components/ClassAnalyticsView';
import { StudentProgressView } from './components/StudentProgressView';
import { QuestionBankModal } from './components/QuestionBankModal';
import { TargetedReassessmentModal } from './components/TargetedReassessmentModal';
import { StudentReflectionModal } from './components/StudentReflectionModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { InstallDesktopAppModal } from './components/InstallDesktopAppModal';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  // Authentication & Role
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(
    StorageService.isTeacherAuthenticated()
  );
  const [activeUser, setActiveUser] = useState<UserProfile>(() => {
    const stored = StorageService.getActiveUser();
    if (stored.role === 'teacher' && !StorageService.isTeacherAuthenticated()) {
      return DEFAULT_STUDENT;
    }
    return stored;
  });

  const [isTeacherAuthModalOpen, setIsTeacherAuthModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Live Firestore Datasets
  const [assessments, setAssessments] = useState<FormativeAssessment[]>(StorageService.getAssessments());
  const [submissions, setSubmissions] = useState<Record<string, Submission>>(StorageService.getSubmissions());

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubAssessments = StorageService.subscribeToAssessments((items) => {
      setAssessments(items);
    });
    const unsubSubmissions = StorageService.subscribeToSubmissions((subs) => {
      setSubmissions(subs);
    });

    return () => {
      unsubAssessments();
      unsubSubmissions();
    };
  }, []);

  // Navigation / View State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeAssessment, setActiveAssessment] = useState<FormativeAssessment | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);

  // Student Identity for active assessment run
  const [activeStudentRunnerProfile, setActiveStudentRunnerProfile] = useState<{
    name: string;
    classSection: string;
    curriculum: CurriculumType;
    academicYear: string;
  } | null>(null);

  // Loading state during Gemini Generation or Marking
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  // Modals
  const [reassessmentTargetSub, setReassessmentTargetSub] = useState<Submission | null>(null);
  const [reflectionTargetSub, setReflectionTargetSub] = useState<{
    assessment: FormativeAssessment;
    submission: Submission;
  } | null>(null);

  // Teacher Access Unlock
  const handleTeacherUnlockSuccess = (teacherProfile: UserProfile) => {
    setIsTeacherAuthenticated(true);
    setActiveUser(teacherProfile);
    setIsTeacherAuthModalOpen(false);
    setCurrentTab('dashboard');
  };

  // Lock Teacher Mode (reverts to Student Portal)
  const handleLockTeacherMode = () => {
    StorageService.setTeacherAuthenticated(false);
    StorageService.setActiveUser(DEFAULT_STUDENT);
    setIsTeacherAuthenticated(false);
    setActiveUser(DEFAULT_STUDENT);
    setCurrentTab('dashboard');
  };

  // Tab change with security check for teacher-only views
  const handleTabChange = (targetTab: string) => {
    const teacherOnlyTabs = ['builder', 'student_works', 'analytics', 'question_bank'];
    if (teacherOnlyTabs.includes(targetTab) && (!isTeacherAuthenticated || activeUser.role !== 'teacher')) {
      setIsTeacherAuthModalOpen(true);
      return;
    }
    setCurrentTab(targetTab);
  };

  // 1. Teacher starts blueprint -> triggers AI Generation
  const handleBlueprintReady = async (blueprint: FormativeBlueprint) => {
    setIsGenerating(true);
    setGenerationStatus(`Consulting ${blueprint.curriculum} Sciences syllabus and formulating authentic questions and mark schemes for ${blueprint.topic}...`);

    try {
      const result = await GeminiService.generateFormative(blueprint);

      const newAssessment: FormativeAssessment = {
        id: `formative-${Date.now()}`,
        blueprint,
        questions: result.questions,
        validationSummary: {
          topicBoundaryCompliant: result.validationPassed,
          yearLevelAppropriate: true,
          datasetConsistent: true,
          markSchemeDefensible: true,
          validationChecklist: [
            'Strict Topic & Subtopic Boundary Verified',
            'Year-Level Cognitive Demand Checked',
            'Authentic Dataset Consistency Confirmed',
            'Defensible Mark Scheme with Evidence Anchors Built',
          ],
        },
        status: 'Draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await StorageService.saveAssessment(newAssessment);
      setAssessments(StorageService.getAssessments());
      setActiveAssessment(newAssessment);
      setIsGenerating(false);
      setCurrentTab('review');
    } catch (e: any) {
      console.error('Generation error:', e);
      setIsGenerating(false);
      alert('Failed to generate assessment. Please check your topic and try again.');
    }
  };

  // 2. Publish assessment -> immediately accessible to students in Firestore
  const handlePublishAssessment = async (assessment: FormativeAssessment) => {
    const published: FormativeAssessment = {
      ...assessment,
      status: 'Published',
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await StorageService.saveAssessment(published);
    setAssessments(StorageService.getAssessments());
    setActiveAssessment(published);
    setCurrentTab('dashboard');
  };

  // 3. Save draft assessment
  const handleSaveDraftAssessment = async (assessment: FormativeAssessment) => {
    await StorageService.saveAssessment(assessment);
    setAssessments(StorageService.getAssessments());
    setActiveAssessment(assessment);
  };

  // 4. Delete assessment with password verification
  const handleDeleteAssessment = async (id: string, passwordInput: string) => {
    const result = await StorageService.deleteAssessment(id, passwordInput);
    if (result.success) {
      setAssessments(StorageService.getAssessments());
    }
    return result;
  };

  // 5. Reset Academic Year with password verification
  const handleResetAcademicYear = async (academicYear: string, passwordInput: string) => {
    const result = await StorageService.resetAcademicYear(academicYear, passwordInput);
    if (result.success) {
      setSubmissions(StorageService.getSubmissions());
    }
    return result;
  };

  // 6. Student begins task with pre-flight identity
  const handleStartAssessmentWithProfile = (
    assessment: FormativeAssessment,
    studentDetails: { name: string; classSection: string; curriculum: CurriculumType; academicYear: string }
  ) => {
    setActiveAssessment(assessment);
    setActiveStudentRunnerProfile(studentDetails);
    // Find existing submission for this student and assessment if any
    const existing = (Object.values(submissions) as Submission[]).find(
      (s) => s.formativeId === assessment.id && s.studentName === studentDetails.name
    );
    setActiveSubmission(existing || null);
    setCurrentTab('runner');
  };

  // 7. Student submits assessment -> triggers strict AI Examiner Marking & saves to Firestore
  const handleStudentSubmit = async (
    responses: Record<string, StudentResponse>,
    integrityAudit?: {
      tabSwitchCount: number;
      copyPasteAttempts: number;
      isLockdownViolated: boolean;
      fullscreenExitCount?: number;
      logs: { timestamp: string; event: string; details: string }[];
    }
  ) => {
    if (!activeAssessment) return;

    const studentName = activeStudentRunnerProfile?.name || activeUser.name || 'Student';
    const studentClass = activeStudentRunnerProfile?.classSection || activeAssessment.blueprint.classSection || 'Grade 9A';
    const curriculum = activeStudentRunnerProfile?.curriculum || activeAssessment.blueprint.curriculum;
    const academicYear = activeStudentRunnerProfile?.academicYear || activeAssessment.blueprint.academicYear || DEFAULT_ACADEMIC_YEAR;

    setIsGenerating(true);
    setGenerationStatus('Strict AI Examiner is evaluating student evidence, mark schemes, and diagnosing learning gaps...');

    try {
      const marking = await GeminiService.markSubmission(
        activeAssessment,
        responses,
        studentName
      );

      const newSubmission: Submission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        formativeId: activeAssessment.id,
        formativeVersion: activeAssessment.version,
        studentId: `student-${Date.now()}`,
        studentName,
        classSection: studentClass,
        academicYear,
        curriculum,
        subject: activeAssessment.blueprint.subject,
        teacherName: activeAssessment.blueprint.teacherName,
        startedAt: new Date().toISOString(),
        status: 'Submitted',
        responses,
        totalMarksAwarded: marking.totalMarks,
        totalMaxMarks: marking.maxMarks,
        mypOverallAchievementLevel: marking.mypLevel,
        markingResults: marking.markingResults,
        diagnosis: marking.diagnosis,
        submittedAt: new Date().toISOString(),
        integrityAudit: integrityAudit || {
          tabSwitchCount: 0,
          copyPasteAttempts: 0,
          isLockdownViolated: false,
          fullscreenExitCount: 0,
          logs: [],
        },
      };

      await StorageService.saveSubmission(newSubmission);
      setSubmissions(StorageService.getSubmissions());
      setActiveSubmission(newSubmission);
      setIsGenerating(false);
      setCurrentTab('marking');
    } catch (e: any) {
      console.error('Marking error:', e);
      setIsGenerating(false);
      alert('Failed to process AI examiner marking. Please try submitting again.');
    }
  };

  // 8. Update submission (teacher manual override or student self-reflection)
  const handleUpdateSubmission = async (sub: Submission) => {
    await StorageService.saveSubmission(sub);
    setSubmissions(StorageService.getSubmissions());
    setActiveSubmission(sub);
  };

  // 9. Targeted reassessment generated
  const handleReassessmentCreated = async (newAssessment: FormativeAssessment) => {
    await StorageService.saveAssessment(newAssessment);
    setAssessments(StorageService.getAssessments());
    setActiveAssessment(newAssessment);
    setReassessmentTargetSub(null);
    setCurrentTab('dashboard');
  };

  const submissionsList = Object.values(submissions) as Submission[];
  const isTeacher = activeUser.role === 'teacher' && isTeacherAuthenticated;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Navigation */}
      {currentTab !== 'runner' && (
        <Navbar
          activeUser={activeUser}
          isTeacherAuthenticated={isTeacherAuthenticated}
          onRequestTeacherAccess={() => setIsTeacherAuthModalOpen(true)}
          onLockTeacherMode={handleLockTeacherMode}
          activeTab={currentTab}
          onTabChange={handleTabChange}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
      )}

      {/* Loading Overlay for AI Generation / Marking */}
      {isGenerating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="relative w-14 h-14 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Examiner in Action</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">{generationStatus}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* TEACHER DASHBOARD (Password Protected) */}
        {currentTab === 'dashboard' && isTeacher && (
          <TeacherDashboard
            activeTeacher={activeUser}
            assessments={assessments}
            submissions={submissionsList}
            onCreateNew={() => setCurrentTab('builder')}
            onEditDraft={(ass) => {
              setActiveAssessment(ass);
              setCurrentTab('review');
            }}
            onViewMarking={(ass, sub) => {
              setActiveAssessment(ass);
              setActiveSubmission(sub);
              setCurrentTab('marking');
            }}
            onViewAnalytics={() => setCurrentTab('analytics')}
            onViewStudentWorks={() => setCurrentTab('student_works')}
            onDeleteAssessment={handleDeleteAssessment}
            onLockTeacherMode={handleLockTeacherMode}
          />
        )}

        {/* ALL STUDENT WORKS (TEACHER VIEW - Password Protected) */}
        {currentTab === 'student_works' && isTeacher && (
          <StudentWorksView
            assessments={assessments}
            submissions={submissionsList}
            onViewMarking={(ass, sub) => {
              setActiveAssessment(ass);
              setActiveSubmission(sub);
              setCurrentTab('marking');
            }}
            onResetAcademicYear={handleResetAcademicYear}
          />
        )}

        {/* STUDENT DASHBOARD (Default public/student view) */}
        {currentTab === 'dashboard' && !isTeacher && (
          <StudentDashboard
            activeStudent={activeUser}
            assessments={assessments}
            submissions={submissionsList}
            onStartAssessmentWithProfile={handleStartAssessmentWithProfile}
            onViewResults={(ass, sub) => {
              setActiveAssessment(ass);
              setActiveSubmission(sub);
              setCurrentTab('marking');
            }}
            onOpenReflection={(ass, sub) => {
              setReflectionTargetSub({ assessment: ass, submission: sub });
            }}
            onViewProgress={() => setCurrentTab('student_progress')}
          />
        )}

        {/* FORMATIVE BUILDER (Teacher Only) */}
        {currentTab === 'builder' && isTeacher && (
          <FormativeBuilder
            defaultTeacherName={activeUser.name}
            onBlueprintReady={handleBlueprintReady}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {/* ASSESSMENT REVIEW / EDIT (Teacher Only) */}
        {currentTab === 'review' && isTeacher && activeAssessment && (
          <AssessmentReview
            assessment={activeAssessment}
            onUpdateAssessment={(updated) => {
              setActiveAssessment(updated);
              handleSaveDraftAssessment(updated);
            }}
            onSaveDraft={handleSaveDraftAssessment}
            onPreviewStudentMode={() => {
              setActiveStudentRunnerProfile({
                name: 'Student Preview',
                classSection: activeAssessment.blueprint.classSection,
                curriculum: activeAssessment.blueprint.curriculum,
                academicYear: activeAssessment.blueprint.academicYear || DEFAULT_ACADEMIC_YEAR,
              });
              setCurrentTab('runner');
            }}
            onBack={() => setCurrentTab('dashboard')}
          />
        )}

        {/* STUDENT ASSESSMENT RUNNER */}
        {currentTab === 'runner' && activeAssessment && (
          <StudentAssessmentRunner
            assessment={activeAssessment}
            studentUser={{
              ...activeUser,
              name: activeStudentRunnerProfile?.name || activeUser.name,
            }}
            existingSubmission={
              activeSubmission && activeSubmission.formativeId === activeAssessment.id
                ? activeSubmission
                : undefined
            }
            onSubmitAssessment={handleStudentSubmit}
            onExit={() => setCurrentTab('dashboard')}
          />
        )}

        {/* STRICT EXAMINER MARKING & FEEDBACK VIEW */}
        {currentTab === 'marking' && activeAssessment && activeSubmission && (
          <MarkingAndFeedbackView
            assessment={activeAssessment}
            submission={activeSubmission}
            activeUser={activeUser}
            onUpdateSubmission={handleUpdateSubmission}
            onCreateTargetedReassessment={(sub) => setReassessmentTargetSub(sub)}
            onBack={() => setCurrentTab(isTeacher ? 'student_works' : 'dashboard')}
          />
        )}

        {/* CLASS ANALYTICS (Teacher Only) */}
        {currentTab === 'analytics' && isTeacher && (
          <ClassAnalyticsView
            assessments={assessments}
            submissions={submissionsList}
            onSelectSubmission={(sub) => {
              const ass = assessments.find((a) => a.id === sub.formativeId);
              if (ass) {
                setActiveAssessment(ass);
                setActiveSubmission(sub);
                setCurrentTab('marking');
              }
            }}
          />
        )}

        {/* STUDENT PROGRESS & TARGETS */}
        {currentTab === 'student_progress' && (
          <StudentProgressView
            studentUser={activeUser}
            assessments={assessments}
            submissions={submissionsList}
            onViewMarking={(ass, sub) => {
              setActiveAssessment(ass);
              setActiveSubmission(sub);
              setCurrentTab('marking');
            }}
          />
        )}

        {/* QUESTION BANK (Teacher Only) */}
        {currentTab === 'question_bank' && isTeacher && (
          <QuestionBankModal onClose={() => setCurrentTab('dashboard')} />
        )}
      </main>

      {/* TEACHER AUTHENTICATION PASSWORD MODAL */}
      <TeacherAuthModal
        isOpen={isTeacherAuthModalOpen}
        onClose={() => setIsTeacherAuthModalOpen(false)}
        onSuccess={handleTeacherUnlockSuccess}
      />

      {/* TARGETED REASSESSMENT MODAL */}
      {reassessmentTargetSub && activeAssessment && (
        <TargetedReassessmentModal
          assessment={activeAssessment}
          submission={reassessmentTargetSub}
          onReassessmentCreated={handleReassessmentCreated}
          onClose={() => setReassessmentTargetSub(null)}
        />
      )}

      {/* STUDENT REFLECTION MODAL */}
      {reflectionTargetSub && (
        <StudentReflectionModal
          initialReflection={reflectionTargetSub.submission.reflection}
          onSaveReflection={(ref) => {
            const updated = { ...reflectionTargetSub.submission, reflection: ref };
            handleUpdateSubmission(updated);
            setReflectionTargetSub(null);
          }}
          onClose={() => setReflectionTargetSub(null)}
        />
      )}

      {/* INSTALL DESKTOP APP MODAL (Chromebook, Windows, Mac) */}
      <InstallDesktopAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
export default App;
