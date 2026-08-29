import { FormativeAssessment, Submission, UserProfile, LiveStudentSession, StudentRecord, SECURITY_PASSWORDS, DEFAULT_ACADEMIC_YEAR } from '../types';
import { db, collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from './firebase';
import { QUESTION_BANK, BankQuestionItem } from '../data/questionBank';
import { INITIAL_STUDENT_ROSTER } from '../data/studentsSeed';

const STORAGE_KEYS = {
  ASSESSMENTS: 'curric_formative_assessments_v2',
  SUBMISSIONS: 'curric_formative_submissions_v2',
  LIVE_SESSIONS: 'curric_formative_live_sessions_v2',
  STUDENTS: 'curric_formative_students_v2',
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
  classSections: ['MYP 2', 'Grade 9A', 'Grade 9B', 'Grade 10-Bio', 'FM3-Sci', 'DP1-Bio'],
  subjects: ['Biology', 'Chemistry', 'Physics', 'Environmental Systems', 'Integrated Sciences'],
};

export const DEFAULT_STUDENT: UserProfile = {
  id: 'student-portal-user',
  name: 'Student',
  email: 'student@school.edu',
  role: 'student',
  classSections: ['MYP 2', 'Grade 9A'],
};

export class StorageService {
  private static assessmentsCache: FormativeAssessment[] = [];
  private static submissionsCache: Record<string, Submission> = {};
  private static liveSessionsCache: Record<string, LiveStudentSession> = {};
  private static studentsCache: StudentRecord[] = [];
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
      const localLiveSessions = localStorage.getItem(STORAGE_KEYS.LIVE_SESSIONS);
      if (localLiveSessions) {
        this.liveSessionsCache = JSON.parse(localLiveSessions);
      }
      const localStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (localStudents) {
        this.studentsCache = JSON.parse(localStudents);
      }

      // Merge seed roster if any students are missing
      const existingMap = new Map<string, StudentRecord>();
      this.studentsCache.forEach((s) => {
        if (s.studentId) existingMap.set(s.studentId.trim(), s);
        if (s.id) existingMap.set(s.id.trim(), s);
      });

      let addedAny = false;
      INITIAL_STUDENT_ROSTER.forEach((raw) => {
        if (!existingMap.has(raw.studentId) && !existingMap.has(raw.id)) {
          const newRec: StudentRecord = {
            ...raw,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.studentsCache.push(newRec);
          existingMap.set(newRec.studentId, newRec);
          existingMap.set(newRec.id, newRec);
          addedAny = true;
        }
      });

      if (addedAny) {
        this.studentsCache.sort((a, b) => a.name.localeCompare(b.name));
        try {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(this.studentsCache));
        } catch {}
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

  // Real-time Live Student Sessions (Keystroke streaming & focus state)
  static subscribeToLiveSessions(callback: (sessions: Record<string, LiveStudentSession>) => void): () => void {
    this.init();
    try {
      const colRef = collection(db, 'live_sessions');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const dict: Record<string, LiveStudentSession> = {};
          snapshot.forEach((d) => {
            const sess = d.data() as LiveStudentSession;
            dict[sess.id] = sess;
          });
          this.liveSessionsCache = dict;
          try {
            localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(dict));
          } catch {}
          callback(dict);
        },
        (error) => {
          console.warn('Firestore live_sessions snapshot error, using local state:', error);
          callback(this.getLiveSessions());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore live sessions subscription fallback:', e);
      callback(this.getLiveSessions());
      return () => {};
    }
  }

  static getLiveSessions(): Record<string, LiveStudentSession> {
    this.init();
    if (Object.keys(this.liveSessionsCache).length > 0) {
      return this.liveSessionsCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIVE_SESSIONS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static async saveLiveSession(session: LiveStudentSession): Promise<void> {
    this.init();
    const sessions = { ...this.getLiveSessions() };
    const updated: LiveStudentSession = {
      ...session,
      lastActiveAt: new Date().toISOString(),
    };
    sessions[session.id] = updated;
    this.liveSessionsCache = sessions;

    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(sessions));
      // Dispatch storage event for instant local multi-tab sync
      window.dispatchEvent(new CustomEvent('live-session-update', { detail: updated }));
    } catch {}

    // Persist to Firestore live_sessions
    try {
      const docRef = doc(db, 'live_sessions', session.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(updated)), { merge: true });
    } catch (err) {
      console.warn('Failed to save live session to Firestore:', err);
    }
  }

  static async deleteLiveSession(sessionId: string): Promise<void> {
    this.init();
    const sessions = { ...this.getLiveSessions() };
    delete sessions[sessionId];
    this.liveSessionsCache = sessions;

    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(sessions));
    } catch {}

    try {
      const docRef = doc(db, 'live_sessions', sessionId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Failed to delete live session from Firestore:', err);
    }
  }

  static async sendTeacherAlert(sessionId: string, alertMessage: string): Promise<void> {
    this.init();
    const sessions = { ...this.getLiveSessions() };
    if (sessions[sessionId]) {
      sessions[sessionId].activeTeacherAlert = alertMessage;
      this.liveSessionsCache = sessions;
      try {
        localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(sessions));
      } catch {}
      try {
        const docRef = doc(db, 'live_sessions', sessionId);
        await setDoc(docRef, { activeTeacherAlert: alertMessage }, { merge: true });
      } catch (err) {
        console.warn('Failed to send teacher alert to Firestore:', err);
      }
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

  // ==========================================
  // STUDENT DIRECTORY & EVIDENCE TOKENS
  // ==========================================

  /**
   * Returns the configured public base domain for student evidence links.
   * Priority:
   * 1. Teacher-configured custom public domain from localStorage
   * 2. VITE_PUBLIC_APP_URL environment variable
   * 3. Current active window.location.origin
   */
  static getCustomBaseDomain(): string {
    try {
      const stored = localStorage.getItem('curric_public_base_domain');
      if (stored && stored.trim()) {
        let clean = stored.trim();
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
          clean = `https://${clean}`;
        }
        return clean.replace(/\/+$/, '');
      }
    } catch {}

    const metaEnv = (import.meta as any)?.env;
    if (metaEnv?.VITE_PUBLIC_APP_URL) {
      return (metaEnv.VITE_PUBLIC_APP_URL as string).replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }

    return '';
  }

  /**
   * Sets or clears the teacher-configured custom public domain.
   */
  static setCustomBaseDomain(domain: string) {
    try {
      if (domain && domain.trim()) {
        let clean = domain.trim();
        if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
          clean = `https://${clean}`;
        }
        localStorage.setItem('curric_public_base_domain', clean.replace(/\/+$/, ''));
      } else {
        localStorage.removeItem('curric_public_base_domain');
      }
    } catch {}
  }

  /**
   * Generates a cryptographically strong, unpredictable, URL-safe alphanumeric token (12 characters).
   * Example: a8Kx72PqLm91
   */
  static generateEvidenceToken(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let token = '';
    const array = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      for (let i = 0; i < 12; i++) {
        token += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 12; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return token;
  }

  /**
   * Returns the absolute formative evidence URL for a given token.
   * Produces a permanent public link using the configured domain and canonical /evidence/:token route.
   */
  static getStudentEvidenceUrl(token: string): string {
    const base = this.getCustomBaseDomain();
    const cleanToken = encodeURIComponent(token.trim());
    if (base) {
      return `${base}/evidence/${cleanToken}`;
    }
    return `/evidence/${cleanToken}`;
  }

  /**
   * Real-time Firestore subscription to student directory.
   */
  static subscribeToStudents(callback: (students: StudentRecord[]) => void): () => void {
    this.init();
    try {
      const colRef = collection(db, 'students');
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const items: StudentRecord[] = [];
          snapshot.forEach((d) => {
            items.push(d.data() as StudentRecord);
          });
          // Sort alphabetically by name
          items.sort((a, b) => a.name.localeCompare(b.name));
          this.studentsCache = items;
          try {
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(items));
          } catch {}
          callback(items);
        },
        (error) => {
          console.warn('Firestore students snapshot error, using local state:', error);
          callback(this.getStudents());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore students subscription fallback:', e);
      callback(this.getStudents());
      return () => {};
    }
  }

  /**
   * Returns all cached or persisted students.
   */
  static getStudents(): StudentRecord[] {
    this.init();
    if (this.studentsCache.length > 0) {
      return this.studentsCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        this.studentsCache = JSON.parse(data);
        return this.studentsCache;
      }
    } catch {}
    return [];
  }

  /**
   * Resolves a student record by their secure evidence token.
   */
  static getStudentByToken(token: string): StudentRecord | undefined {
    const cleanToken = token.trim();
    if (!cleanToken) return undefined;
    const foundInCache = this.getStudents().find((s) => s.evidenceToken === cleanToken);
    if (foundInCache) return foundInCache;
    const foundInRoster = INITIAL_STUDENT_ROSTER.find((s) => s.evidenceToken === cleanToken);
    if (foundInRoster) {
      return {
        ...foundInRoster,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return undefined;
  }

  /**
   * Resolves a student record by studentId or internal id.
   */
  static getStudentById(id: string): StudentRecord | undefined {
    const clean = id.trim().toLowerCase();
    if (!clean) return undefined;
    const foundInCache = this.getStudents().find(
      (s) => s.id.toLowerCase() === clean || s.studentId.toLowerCase() === clean
    );
    if (foundInCache) return foundInCache;
    const foundInRoster = INITIAL_STUDENT_ROSTER.find(
      (s) => s.id.toLowerCase() === clean || s.studentId.toLowerCase() === clean
    );
    if (foundInRoster) {
      return {
        ...foundInRoster,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return undefined;
  }

  /**
   * Resolves a student record by name (supporting exact match and subset/variant matching e.g. 'Jas Daryani' -> 'Jas Dhiraj Daryani').
   */
  static getStudentByName(name: string): StudentRecord | undefined {
    const clean = name.trim().toLowerCase();
    if (!clean) return undefined;
    const allStudents = [...this.getStudents()];
    INITIAL_STUDENT_ROSTER.forEach((r) => {
      if (!allStudents.some((s) => s.id === r.id || s.studentId === r.studentId)) {
        allStudents.push({
          ...r,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
    
    // 1. Exact match
    const exact = allStudents.find((s) => s.name.trim().toLowerCase() === clean);
    if (exact) return exact;

    // 2. Multi-word subset match
    const inputWords = clean.split(/\s+/).filter((w) => w.length >= 2);
    if (inputWords.length >= 2) {
      const match = allStudents.find((s) => {
        const sWords = s.name.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
        return inputWords.every((w) => sWords.includes(w)) || sWords.every((w) => inputWords.includes(w));
      });
      if (match) return match;
    }

    return undefined;
  }

  /**
   * Saves or updates a single student record with Firestore & localStorage persistence.
   */
  static async saveStudent(student: StudentRecord): Promise<void> {
    this.init();
    const students = [...this.getStudents()];
    const index = students.findIndex(
      (s) => s.id === student.id || (student.studentId && s.studentId === student.studentId)
    );

    const updated: StudentRecord = {
      ...student,
      evidenceToken: student.evidenceToken || this.generateEvidenceToken(),
      updatedAt: new Date().toISOString(),
      createdAt: student.createdAt || new Date().toISOString(),
    };

    if (index >= 0) {
      students[index] = updated;
    } else {
      students.push(updated);
    }

    students.sort((a, b) => a.name.localeCompare(b.name));
    this.studentsCache = students;

    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {}

    // Persist to Firestore
    try {
      const docRef = doc(db, 'students', updated.id);
      await setDoc(docRef, JSON.parse(JSON.stringify(updated)), { merge: true });
    } catch (err) {
      console.warn('Failed to save student to Firestore:', err);
    }
  }

  /**
   * Bulk imports or updates student records (e.g. from CSV / Excel) without creating duplicates.
   */
  static async saveStudents(newStudents: Partial<StudentRecord>[]): Promise<{ importedCount: number; updatedCount: number }> {
    this.init();
    const existing = [...this.getStudents()];
    const existingMap = new Map<string, StudentRecord>();
    
    existing.forEach((s) => {
      if (s.studentId) existingMap.set(s.studentId.toLowerCase().trim(), s);
      if (s.id) existingMap.set(s.id.toLowerCase().trim(), s);
      if (s.name) existingMap.set(s.name.toLowerCase().trim(), s);
    });

    let importedCount = 0;
    let updatedCount = 0;

    for (const raw of newStudents) {
      if (!raw.name?.trim()) continue;
      
      const sId = raw.studentId?.trim() || `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const keyId = sId.toLowerCase();
      const keyName = raw.name.toLowerCase().trim();

      const match = existingMap.get(keyId) || existingMap.get(keyName);

      if (match) {
        // Update existing record while preserving permanent token
        const updated: StudentRecord = {
          ...match,
          name: raw.name.trim(),
          classSection: raw.classSection?.trim() || match.classSection,
          section: raw.section?.trim() || match.section,
          subject: raw.subject || match.subject,
          curriculum: raw.curriculum || match.curriculum,
          academicYear: raw.academicYear || match.academicYear || DEFAULT_ACADEMIC_YEAR,
          email: raw.email?.trim() || match.email,
          updatedAt: new Date().toISOString(),
        };
        const idx = existing.findIndex((s) => s.id === match.id);
        if (idx >= 0) existing[idx] = updated;
        existingMap.set(keyId, updated);
        existingMap.set(keyName, updated);
        
        try {
          const docRef = doc(db, 'students', updated.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(updated)), { merge: true });
        } catch {}
        updatedCount++;
      } else {
        // Create brand-new student record with permanent unique token
        const newRecord: StudentRecord = {
          id: sId,
          studentId: sId,
          name: raw.name.trim(),
          classSection: raw.classSection?.trim() || 'MYP 5',
          section: raw.section?.trim() || 'Biology',
          subject: raw.subject || 'Biology',
          curriculum: raw.curriculum || 'IBMYP',
          academicYear: raw.academicYear || DEFAULT_ACADEMIC_YEAR,
          email: raw.email?.trim() || '',
          evidenceToken: raw.evidenceToken || this.generateEvidenceToken(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        existing.push(newRecord);
        existingMap.set(keyId, newRecord);
        existingMap.set(keyName, newRecord);
        
        try {
          const docRef = doc(db, 'students', newRecord.id);
          await setDoc(docRef, JSON.parse(JSON.stringify(newRecord)), { merge: true });
        } catch {}
        importedCount++;
      }
    }

    existing.sort((a, b) => a.name.localeCompare(b.name));
    this.studentsCache = existing;

    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(existing));
    } catch {}

    return { importedCount, updatedCount };
  }

  /**
   * Deletes a student record.
   */
  static async deleteStudent(id: string): Promise<void> {
    this.init();
    const students = this.getStudents().filter((s) => s.id !== id && s.studentId !== id);
    this.studentsCache = students;

    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {}

    try {
      const docRef = doc(db, 'students', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Failed to delete student from Firestore:', err);
    }
  }

  /**
   * Automatically scans existing submissions and creates corresponding student records and tokens
   * for any students that don't yet exist in the student directory.
   */
  static async syncStudentsFromSubmissions(): Promise<number> {
    const submissions = Object.values(this.getSubmissions());
    const existing = this.getStudents();
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase().trim()));
    const existingIds = new Set(existing.map((s) => s.studentId.toLowerCase().trim()));

    const candidatesToCreate: Partial<StudentRecord>[] = [];

    submissions.forEach((sub) => {
      const name = sub.studentName?.trim();
      if (!name || name.toLowerCase() === 'student' || name.toLowerCase() === 'live student') return;

      const sId = sub.studentId?.trim() || `STU-${name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;
      if (!existingNames.has(name.toLowerCase()) && !existingIds.has(sId.toLowerCase())) {
        existingNames.add(name.toLowerCase());
        existingIds.add(sId.toLowerCase());
        candidatesToCreate.push({
          id: sId,
          studentId: sId,
          name: name,
          classSection: sub.classSection || 'MYP 5',
          section: (sub.subject as string) || 'Biology',
          subject: sub.subject || 'Biology',
          curriculum: sub.curriculum || 'IBMYP',
          academicYear: sub.academicYear || DEFAULT_ACADEMIC_YEAR,
        });
      }
    });

    if (candidatesToCreate.length > 0) {
      const res = await this.saveStudents(candidatesToCreate);
      return res.importedCount;
    }

    return 0;
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

  // Theme Preference (Daylight vs Dark)
  static getTheme(): 'light' | 'dark' {
    try {
      const saved = localStorage.getItem('formativeiq_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  }

  static setTheme(theme: 'light' | 'dark') {
    try {
      localStorage.setItem('formativeiq_theme', theme);
    } catch {}
  }
}
