export type CurriculumType = 'IBMYP' | 'IGCSE' | 'IBDP';

export type MYPYear = 'MYP 1' | 'MYP 2' | 'MYP 3' | 'MYP 4' | 'MYP 5';
export type IGCSEClass = 'FM1' | 'FM2' | 'FM3' | 'FM4' | 'FM5';
export type IBDPClass = 'IBDP1' | 'IBDP2';
export type YearGroup = MYPYear | IGCSEClass | IBDPClass;

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

export interface DataPoint {
  x: number | string;
  y: number;
  label?: string;
  trial1?: number;
  trial2?: number;
  trial3?: number;
  mean?: number;
}

export interface DatasetSpec {
  title: string;
  description: string;
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  dataPoints: DataPoint[];
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
  type: QuestionType;
  commandTerm: string;
  prompt: string;
  context?: string;
  dataset?: DatasetSpec;
  graphType?: 'line' | 'bar' | 'scatter';
  options?: MCQOption[];
  imageUrl?: string;
  imageCaption?: string;
  imageAlt?: string;
  maxMarks: number;
  cognitiveDemand: CognitiveDemand;
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
  // IBMYP specific
  selectedCriterion?: MYPCriterion;
  selectedStrands?: string[];
  mypAssessmentMode?: 'achievement_levels' | 'marks_points'; // MYP 1-3 vs 4-5
  // Marking config
  maxMarks?: number;
  targetQuestionCount: number;
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
  status: 'In Progress' | 'Submitted' | 'Marked' | 'Reflected';
  responses: Record<string, StudentResponse>;
  markingResults?: Record<string, QuestionMarkingResult>;
  totalMarksAwarded?: number;
  totalMaxMarks?: number;
  mypOverallAchievementLevel?: number; // 0-8 for MYP 1-3
  diagnosis?: LearningGapDiagnosis;
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
