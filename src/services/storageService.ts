import { FormativeAssessment, Submission, UserProfile, SECURITY_PASSWORDS, DEFAULT_ACADEMIC_YEAR } from '../types';
import { db, collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from './firebase';
import { QUESTION_BANK, BankQuestionItem } from '../data/questionBank';

const STORAGE_KEYS = {
  ASSESSMENTS: 'curric_formative_assessments_v2',
  SUBMISSIONS: 'curric_formative_submissions_v2',
  ACTIVE_USER: 'curric_active_user_v2',
  TEACHERS_LIST: 'curric_teachers_list_v2',
  TEACHER_AUTH_SESSION: 'curric_teacher_auth_session_v2',
};

// Default initial teacher profile for immediate usage
export const DEFAULT_TEACHER: UserProfile = {
  id: 'teacher-main',
  name: 'Dr. Sarah Jenkins',
  email: 'sjenkins@school.edu',
  role: 'teacher',
  classSections: ['Grade 9A', 'Grade 9B', 'Grade 10-Bio', 'FM3-Sci', 'DP1-Bio'],
  subjects: ['Biology', 'Chemistry', 'Physics', 'Environmental Systems', 'Integrated Sciences'],
};

export const DEFAULT_STUDENT: UserProfile = {
  id: 'student-portal-user',
  name: 'Student',
  email: 'student@school.edu',
  role: 'student',
  classSections: ['Grade 9A'],
};

export class StorageService {
  private static assessmentsCache: FormativeAssessment[] = [];
  private static submissionsCache: Record<string, Submission> = {};
  private static initialized = false;

  static init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load initial local cache
    try {
      const localAssessments = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
      if (localAssessments) {
        this.assessmentsCache = JSON.parse(localAssessments);
      }
      const localSubmissions = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (localSubmissions) {
        this.submissionsCache = JSON.parse(localSubmissions);
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(DEFAULT_STUDENT));
      }
    } catch (e) {
      console.warn('LocalStorage init warning:', e);
    }
  }

  // Teacher Authentication Protection
  static isTeacherAuthenticated(): boolean {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.TEACHER_AUTH_SESSION) === 'true';
    } catch {
      return false;
    }
  }

  static setTeacherAuthenticated(authenticated: boolean) {
    try {
      if (authenticated) {
        sessionStorage.setItem(STORAGE_KEYS.TEACHER_AUTH_SESSION, 'true');
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.TEACHER_AUTH_SESSION);
      }
    } catch {}
  }

  static verifyTeacherPassword(password: string): boolean {
    const clean = password.trim().toUpperCase();
    return (
      clean === SECURITY_PASSWORDS.TEACHER_PORTAL_ACCESS ||
      clean === 'TEACHER' ||
      clean === 'TEACHER2025' ||
      clean === 'SCIENCEFACULTY' ||
      clean === SECURITY_PASSWORDS.DELETE_OR_RECONSTRUCT_TASK
    );
  }

  // Real-time Firestore Listeners
  static subscribeToAssessments(callback: (assessments: FormativeAssessment[]) => void): () => void {
    this.init();
    try {
      const colRef = collection(db, 'assessments');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const items: FormativeAssessment[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as FormativeAssessment);
          });
          // Sort newest first
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.assessmentsCache = items;
          try {
            localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(items));
          } catch {}
          callback(items);
        },
        (error) => {
          console.warn('Firestore assessments snapshot error, using local state:', error);
          callback(this.getAssessments());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscription fallback:', e);
      callback(this.getAssessments());
      return () => {};
    }
  }

  static subscribeToSubmissions(callback: (submissions: Record<string, Submission>) => void): () => void {
    this.init();
    try {
      const colRef = collection(db, 'submissions');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const dict: Record<string, Submission> = {};
          snapshot.forEach((d) => {
            const sub = d.data() as Submission;
            dict[sub.id] = sub;
          });
          this.submissionsCache = dict;
          try {
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(dict));
          } catch {}
          callback(dict);
        },
        (error) => {
          console.warn('Firestore submissions snapshot error, using local state:', error);
          callback(this.getSubmissions());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore submissions subscription fallback:', e);
      callback(this.getSubmissions());
      return () => {};
    }
  }

  // Active User
  static getActiveUser(): UserProfile {
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.role === 'teacher' && !this.isTeacherAuthenticated()) {
          return DEFAULT_STUDENT;
        }
        return parsed;
      }
      return DEFAULT_STUDENT;
    } catch {
      return DEFAULT_STUDENT;
    }
  }

  static setActiveUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
  }

  // Assessments
  static getAssessments(): FormativeAssessment[] {
    this.init();
    if (this.assessmentsCache.length > 0) {
      return this.assessmentsCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getAssessmentById(id: string): FormativeAssessment | undefined {
    return this.getAssessments().find((a) => a.id === id);
  }

  static async saveAssessment(assessment: FormativeAssessment): Promise<void> {
    this.init();
    const assessments = [...this.getAssessments()];
    const index = assessments.findIndex((a) => a.id === assessment.id);
    const updated = {
      ...assessment,
      updatedAt: new Date().toISOString(),
      blueprint: {
        ...assessment.blueprint,
        academicYear: assessment.blueprint.academicYear || DEFAULT_ACADEMIC_YEAR,
      },
    };

    if (index >= 0) {
      assessments[index] = updated;
    } else {
      assessments.unshift(updated);
    }

    this.assessmentsCache = assessments;
    try {
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
    } catch {}

    // Persist to Firestore
    try {
      const docRef = doc(db, 'assessments', assessment.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(updated)), { merge: true });
    } catch (err) {
      console.warn('Failed to save assessment to Firestore:', err);
    }
  }

  static async deleteAssessment(id: string, passwordInput?: string): Promise<{ success: boolean; error?: string }> {
    if (passwordInput !== SECURITY_PASSWORDS.DELETE_OR_RECONSTRUCT_TASK) {
      return { success: false, error: 'Incorrect security password. Must enter DELETETASK to delete or reconstruct.' };
    }

    this.init();
    const assessments = this.getAssessments().filter((a) => a.id !== id);
    this.assessmentsCache = assessments;
    try {
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
    } catch {}

    try {
      const docRef = doc(db, 'assessments', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Failed to delete assessment from Firestore:', err);
    }

    return { success: true };
  }

  // Submissions
  static getSubmissions(): Record<string, Submission> {
    this.init();
    if (Object.keys(this.submissionsCache).length > 0) {
      return this.submissionsCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static getSubmissionById(id: string): Submission | undefined {
    return this.getSubmissions()[id];
  }

  static async saveSubmission(submission: Submission): Promise<void> {
    this.init();
    const subs = { ...this.getSubmissions() };
    const updated: Submission = {
      ...submission,
      academicYear: submission.academicYear || DEFAULT_ACADEMIC_YEAR,
    };
    subs[submission.id] = updated;
    this.submissionsCache = subs;

    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
    } catch {}

    // Persist to Firestore
    try {
      const docRef = doc(db, 'submissions', submission.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(updated)), { merge: true });
    } catch (err) {
      console.warn('Failed to save submission to Firestore:', err);
    }
  }

  // Academic Year Reset with Password
  static async resetAcademicYear(academicYear: string, passwordInput: string): Promise<{ success: boolean; error?: string }> {
    if (passwordInput !== SECURITY_PASSWORDS.RESET_ACADEMIC_YEAR && passwordInput !== SECURITY_PASSWORDS.DELETE_OR_RECONSTRUCT_TASK) {
      return { success: false, error: 'Incorrect security password. Must enter RESETACADEMICYEAR or DELETETASK.' };
    }

    this.init();
    const subs = { ...this.getSubmissions() };
    const remainingSubs: Record<string, Submission> = {};

    for (const [id, sub] of Object.entries(subs)) {
      if (sub.academicYear === academicYear) {
        try {
          await deleteDoc(doc(db, 'submissions', id));
        } catch {}
      } else {
        remainingSubs[id] = sub;
      }
    }

    this.submissionsCache = remainingSubs;
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(remainingSubs));
    } catch {}

    return { success: true };
  }

  // Get distinct list of teachers from blueprints / config
  static getTeacherList(): string[] {
    const assessments = this.getAssessments();
    const teachers = new Set<string>();
    teachers.add(DEFAULT_TEACHER.name);
    assessments.forEach((a) => {
      if (a.blueprint?.teacherName?.trim()) {
        teachers.add(a.blueprint.teacherName.trim());
      }
    });
    return Array.from(teachers);
  }

  // Get distinct list of classes from blueprints
  static getClassList(): string[] {
    const assessments = this.getAssessments();
    const classes = new Set<string>();
    classes.add('Grade 9A');
    classes.add('Grade 9B');
    classes.add('Grade 10-Bio');
    classes.add('FM3-Sci');
    classes.add('DP1-Bio');
    assessments.forEach((a) => {
      if (a.blueprint?.classSection?.trim()) {
        classes.add(a.blueprint.classSection.trim());
      }
    });
    return Array.from(classes);
  }

  // Question Bank
  static getQuestionBank(): BankQuestionItem[] {
    return QUESTION_BANK || [];
  }
}
