export type CurriculumType = 'IBMYP' | 'IGCSE' | 'IBDP';

export type MYPYear = 'MYP 2 Science' | 'MYP 4 Bio' | 'MYP 5 Bio' | 'MYP 1' | 'MYP 2' | 'MYP 3' | 'MYP 4' | 'MYP 5';
export type IGCSEClass = 'FM1' | 'FM2' | 'FM3' | 'FM4' | 'FM5';
export type IBDPClass = 'IBDP1' | 'IBDP2';
export type YearGroup = MYPYear | IGCSEClass | IBDPClass | string;

export type Subject = 'Biology' | 'Chemistry' | 'Physics' | 'Environmental Systems' | 'Integrated Sciences';

export const ALL_SUBJECTS: Subject[] = [
  'Biology',
  'Chemistry',
  'Physics',
  'Environmental Systems',
  'Integrated Sciences',
];

export const ACADEMIC_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'];
export const DEFAULT_ACADEMIC_YEAR = '2025-2026';
export const SECURITY_PASSWORDS = {
  TEACHER_PORTAL_ACCESS: 'TEACHER2025',
  DELETE_OR_RECONSTRUCT_TASK: 'DELETETASK',
  RESET_ACADEMIC_YEAR: 'RESETACADEMICYEAR',
};

export type MYPCriterion = 'Criterion A' | 'Criterion B' | 'Criterion C' | 'Criterion D';

export interface CriterionStrand {
  id: string; // e.g. "A(i)", "C(ii)"
  title: string;
  description: string;
  yearExpectation?: Record<string, string>;
}

export type FormativeType = 
  | 'Diagnostic Assessment'
  | 'Checkpoint Formative'
  | 'End-of-Topic Formative'
  | 'Practical / Data Analysis'
  | 'Criterion-Focused Task'
  | 'Targeted Reassessment';

export type FormativeStatus = 
  | 'Draft'
  | 'Reviewed'
  | 'Published'
  | 'In Progress'
  | 'Submitted'
  | 'Marked'
  | 'Reflected'
  | 'Reviewed by Teacher';

export type CognitiveDemand = 'Recall' | 'Understanding' | 'Application' | 'Analysis' | 'Evaluation' | 'Design';

export type DifficultyLevel = 'Foundational' | 'Standard' | 'Challenging' | 'Mixed';

export type QuestionType = 
  | 'mcq'
  | 'short_answer'
  | 'extended_response'
  | 'numerical'
  | 'data_based'
  | 'graph_interpretation'
  | 'experimental_design'
  | 'table_completion';

export interface MCQOption {
  id: string; // "A", "B", "C", "D"
  text: string;
  isCorrect: boolean;
  misconceptionExplanation?: string;
}

export interface DataSeries {
  key: string;
  name: string;
  color?: string;
}

export interface DataPoint {
  x: number | string;
  y?: number; // legacy single-series or primary value
  label?: string;
  trial1?: number;
  trial2?: number;
  trial3?: number;
  mean?: number;
  // Multi-series values: e.g. { "withInhibitor": 1.0, "withoutInhibitor": 1.0 } or arbitrary key-value mappings
  seriesValues?: Record<string, number>;
  [key: string]: any;
}

export interface TableSpec {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
  footnote?: string;
  highlightedRows?: number[];
  columnAlignments?: ('left' | 'center' | 'right')[];
}

export interface DatasetSpec {
  title: string;
  chartType?: 'bar' | 'line' | 'scatter' | 'area';
  description?: string;
  xLabel: string;
  xUnit?: string;
  yLabel: string;
  yUnit?: string;
  series?: DataSeries[]; // Multi-series definitions (e.g. "With inhibitor" vs "Without inhibitor")
  dataPoints: DataPoint[];
  tableData?: TableSpec; // Direct structured scientific table (e.g. Solution | Initial Mass | Final Mass)
  calculatedStats?: {
    trendDescription?: string;
    anomalies?: string[];
    rateOfChange?: string;
  };
}

export interface MarkingPoint {
  id: string;
  point: string;
  marks: number;
  isAwarded?: boolean;
  evidenceFound?: string;
  missingReason?: string;
}

export interface Question {
  id: string;
  questionNumber: number;
  subQuestionLabel?: string; // e.g. "4(a)", "1(b)"
  type: QuestionType;
  commandTerm: string;
  prompt: string;
  context?: string;
  dataset?: DatasetSpec;
  tableData?: TableSpec;
  graphType?: 'line' | 'bar' | 'scatter';
  options?: MCQOption[];
  imageUrl?: string;
  imageCaption?: string;
  imageAlt?: string;
  stimulusImageUrl?: string;
  isVerbatimOriginal?: boolean; // Flag to indicate 100% exact copy of source paper without alterations
  maxMarks: number;
  marksMissing?: boolean; // Flagged when uploaded PDF does not specify marks
  cognitiveDemand: CognitiveDemand;
  difficultyLevel?: DifficultyLevel;
  learningObjective: string;
  criterion?: MYPCriterion;
  strands?: string[];
  expectedAnswer: string;
  markScheme: {
    points: MarkingPoint[];
    generalGuidance?: string;
    acceptableAlternatives?: string[];
    unacceptableResponses?: string[];
  };
  mypLevelDescriptors?: {
    level: string; // "1-2", "3-4", "5-6", "7-8"
    descriptor: string;
    indicators: string[];
  }[];
  isTeacherAuthored?: boolean;
  validationCheck?: {
    passed: boolean;
    issues?: string[];
  };
}

export interface FormativeBlueprint {
  curriculum: CurriculumType;
  academicYear?: string;
  yearGroup: YearGroup;
  subject: Subject;
  formativeNumber: string;
  title: string;
  formativeType: FormativeType;
  classSection: string;
  teacherName: string;
  assessmentDate: string;
  timeLimitMinutes?: number;
  instructions: string;
  topic: string;
  subtopics: string[];
  learningObjectives: string[];
  // Marking Mode: AI Auto-Mark vs Teacher Marks & Publishes
  markingMode?: 'ai_auto' | 'teacher_marked';
  // IBMYP specific
  selectedCriterion?: MYPCriterion;
  selectedStrands?: string[];
  mypAssessmentMode?: 'achievement_levels' | 'marks_points'; // MYP 1-3 vs 4-5
  keyConcept?: string; // e.g. 'Systems', 'Relationships', 'Change'
  relatedConcepts?: string[]; // e.g. ['Form', 'Function', 'Consequences', 'Energy', 'Environment']
  globalContext?: string; // e.g. 'Scientific and technical innovation', 'Globalization and sustainability'
  statementOfInquiry?: string;
  // Marking config
  difficultyLevel?: DifficultyLevel;
  maxMarks?: number;
  targetQuestionCount: number;
  // Uploaded PDF Source Record
  sourcePdf?: {
    name: string;
    size: number;
    dataUrl?: string;
    uploadedAt: string;
  };
  // IGCSE specific distribution
  igcseStructure?: {
    mcqCount: number;
    structuredCount: number;
    dataBasedCount: number;
  };
  academicIntegrity: {
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    oneAttemptOnly: boolean;
    mode: 'closed_book' | 'open_resource';
    disableCopyPaste?: boolean;
    lockdownTabSwitch?: boolean;
    maxTabSwitchViolations?: number;
  };
  teacherCustomInstructions?: string;
}

export interface StudentResponse {
  questionId: string;
  textAnswer?: string;
  selectedOptionId?: string; // for MCQ
  numericalValue?: number;
  tableData?: Record<string, string | number>;
  flagged?: boolean;
  flagReason?: 'I do not understand the question' | 'I think the question is unclear' | 'I think there is an error' | 'I have a technical problem' | 'Other';
  flagNotes?: string;
  timestamp: string;
}

export interface QuestionMarkingResult {
  questionId: string;
  marksAwarded: number;
  maxMarks: number;
  markingPoints: MarkingPoint[];
  modelResponse: string;
  whatWasCorrect: string[];
  whatWasMissing: string[];
  scientificErrorsIdentified: string[];
  whyMarksWereLost: string;
  howToImprove: string;
  teacherManualOverride?: {
    originalMarks: number;
    overriddenMarks: number;
    teacherNotes: string;
    timestamp: string;
  };
  // For MYP 1-3 Achievement Level
  achievementLevelAwarded?: number; // 0 - 8
  achievementBand?: '0' | '1-2' | '3-4' | '5-6' | '7-8';
  descriptorAlignment?: string;
  evidenceDemonstrated?: string;
  requirementsNotMet?: string;
  whyStudentReachedLevel?: string;
  preventingNextLevel?: string;
  nextLevelRequirements?: string;
}

export interface StudentReflection {
  whatDidIWell: string;
  whatDidIFindDifficult: string;
  whatConceptOrSkillToImprove: string;
  whatWillIDoDifferentlyNextTime: string;
  specificLearningTarget: string;
  submittedAt?: string;
  completedAt?: string;
}

export interface LearningGapDiagnosis {
  strengths: string[];
  learningGaps: {
    gap: string;
    evidence: string;
    criterionOrObjective: string;
    nextStep: string;
  }[];
  misconceptions: {
    misconception: string;
    demonstratedInQuestion: number;
    scientificTruth: string;
    correctionStrategy: string;
  }[];
  priorityImprovementTarget: string;
}

export interface Submission {
  id: string;
  formativeId: string;
  formativeVersion: number;
  studentId: string;
  studentName: string;
  classSection: string;
  academicYear?: string;
  curriculum?: CurriculumType;
  subject?: Subject;
  teacherName?: string;
  startedAt: string;
  submittedAt: string;
  status: 'In Progress' | 'Submitted' | 'Marked' | 'Reflected' | 'Pending Teacher Review' | 'Reviewed by Teacher';
  responses: Record<string, StudentResponse>;
  markingResults?: Record<string, QuestionMarkingResult>;
  totalMarksAwarded?: number;
  totalMaxMarks?: number;
  mypOverallAchievementLevel?: number; // 0-8 for MYP 1-3
  diagnosis?: LearningGapDiagnosis;
  // Teacher Marking Draft (In-progress review)
  teacherMarkingDraft?: {
    questionFeedback: Record<string, { marksAwarded?: number; comment: string }>;
    overallComment: string;
    strengths?: string[];
    priorityImprovementTarget?: string;
    markedById?: string;
    markedByName?: string;
    updatedAt: string;
  };
  // Teacher Published Feedback (Final teacher review)
  teacherFeedback?: {
    questionFeedback: Record<string, { marksAwarded: number; comment: string }>;
    overallComment: string;
    strengths?: string[];
    priorityImprovementTarget?: string;
    markedById: string;
    markedByName: string;
    publishedAt: string;
  };
  reflection?: StudentReflection;
  teacherNotes?: string;
  targetedReassessmentCreated?: boolean;
  integrityAudit?: {
    tabSwitchCount: number;
    copyPasteAttempts: number;
    isLockdownViolated: boolean;
    fullscreenExitCount?: number;
    logs: {
      timestamp: string;
      event: string;
      details: string;
    }[];
  };
}

export interface FormativeAssessment {
  id: string;
  version: number;
  blueprint: FormativeBlueprint;
  questions: Question[];
  status: FormativeStatus;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  teacherId?: string;
  validationSummary?: {
    topicBoundaryCompliant: boolean;
    yearLevelAppropriate: boolean;
    datasetConsistent: boolean;
    markSchemeDefensible: boolean;
    validationChecklist?: string[];
  };
  validationReport?: {
    passed: boolean;
    checks: { check: string; status: 'pass' | 'warning' | 'fail'; message: string }[];
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  classSections?: string[];
  subjects?: Subject[];
}

export interface StudentRecord {
  id: string; // Internal unique ID or matches studentId
  studentId: string; // e.g. "001", "STU-101"
  name: string; // e.g. "Student A"
  classSection: string; // e.g. "MYP 5", "Grade 9A"
  section?: string; // e.g. "Biology", "Science A"
  subject?: Subject | string; // e.g. "Biology"
  curriculum?: CurriculumType; // e.g. "IBMYP"
  academicYear?: string; // e.g. "2025-2026"
  email?: string;
  evidenceToken: string; // Unique unpredictable permanent token e.g. "Ab7Kx92LmQ48"
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface LiveStudentSession {
  id: string; // formatted as `${formativeId}_${studentId}`
  formativeId: string;
  formativeTitle: string;
  classSection: string;
  studentId: string;
  studentName: string;
  startedAt: string;
  lastActiveAt: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestionsCount: number;
  currentQuestionId: string;
  currentTypedDraft: string; // real-time keystroke buffer of the currently active question
  responses: Record<string, StudentResponse>;
  status: 'active' | 'idle' | 'tab_switched' | 'focus_lost' | 'submitted';
  timeRemainingSeconds?: number;
  activeTeacherAlert?: string; // Real-time proctor alert sent from teacher to student screen
  integrityAudit: {
    tabSwitchCount: number;
    copyPasteAttempts: number;
    isLockdownViolated: boolean;
    fullscreenExitCount?: number;
    awayDurationSeconds?: number;
    isCurrentlyAway?: boolean;
    awayStartedAt?: string;
    logs: {
      timestamp: string;
      event: string;
      details: string;
    }[];
  };
}
