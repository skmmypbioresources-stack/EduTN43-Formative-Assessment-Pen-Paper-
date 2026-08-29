import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FormativeAssessment,
  StudentResponse,
  Submission,
  UserProfile,
  LiveStudentSession,
} from '../types';
import {
  Clock,
  Save,
  Send,
  Flag,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  Maximize,
  Minimize,
  Eye,
  AlertTriangle,
  ZoomIn,
  Image as ImageIcon,
  Lock,
  Sun,
  Moon,
  Radio,
  MessageSquare,
  X,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { ImageLightboxModal } from './ImageLightboxModal';
import { ScienceGraphViewer } from './ScienceGraphViewer';

interface StudentAssessmentRunnerProps {
  assessment: FormativeAssessment;
  studentUser: UserProfile;
  existingSubmission?: Submission;
  onSubmitAssessment: (
    responses: Record<string, StudentResponse>,
    integrityAudit?: {
      tabSwitchCount: number;
      copyPasteAttempts: number;
      isLockdownViolated: boolean;
      fullscreenExitCount: number;
      logs: { timestamp: string; event: string; details: string }[];
    }
  ) => void;
  onExit: () => void;
}

export const StudentAssessmentRunner: React.FC<StudentAssessmentRunnerProps> = ({
  assessment,
  studentUser,
  existingSubmission,
  onSubmitAssessment,
  onExit,
}) => {
  const bp = assessment.blueprint;
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, StudentResponse>>(
    existingSubmission?.responses || {}
  );
  const [activeFlagModalQId, setActiveFlagModalQId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<any>('I do not understand the question');
  const [flagNotes, setFlagNotes] = useState<string>('');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);

  // Time remaining
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    (bp.timeLimitMinutes || 45) * 60
  );

  // --- LOCKDOWN & ACADEMIC INTEGRITY STATE ---
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(
    existingSubmission?.integrityAudit?.tabSwitchCount || 0
  );
  const [copyPasteAttempts, setCopyPasteAttempts] = useState<number>(
    existingSubmission?.integrityAudit?.copyPasteAttempts || 0
  );
  const [fullscreenExitCount, setFullscreenExitCount] = useState<number>(
    existingSubmission?.integrityAudit?.fullscreenExitCount || 0
  );
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showLockdownWarning, setShowLockdownWarning] = useState<boolean>(false);
  const [lockdownWarningMessage, setLockdownWarningMessage] = useState<string>('');
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [integrityLogs, setIntegrityLogs] = useState<{ timestamp: string; event: string; details: string }[]>(
    existingSubmission?.integrityAudit?.logs || []
  );

  // Real-time Teacher Proctor Direct Alert to Student
  const [activeTeacherAlertMessage, setActiveTeacherAlertMessage] = useState<string | null>(null);
  const awayStartTimestampRef = useRef<number | null>(null);
  const totalAwaySecondsRef = useRef<number>(0);
  const syncDebounceTimerRef = useRef<any>(null);

  // Generate deterministic session ID
  const studentSafeId = (studentUser.id || studentUser.name || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  const sessionId = `${assessment.id}_${studentSafeId}`;

  // Helper to log security infractions
  const recordIntegrityEvent = useCallback((event: string, details: string) => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      event,
      details,
    };
    setIntegrityLogs((prev) => [...prev, newLog]);
  }, []);

  // Real-time Keystroke & State Streamer to Teacher Proctor Dashboard
  const pushLiveSession = useCallback(
    (customOverrides: Partial<LiveStudentSession> = {}) => {
      const currentQuestion = assessment.questions[currentQIndex];
      const answered = (Object.values(responses) as StudentResponse[]).filter(
        (r) => (r.textAnswer && r.textAnswer.trim().length > 0) || r.selectedOptionId !== undefined
      ).length;

      const activeResp = responses[currentQuestion?.id];
      const activeDraft = activeResp?.textAnswer || (activeResp?.selectedOptionId ? `[Selected Option ${activeResp.selectedOptionId}]` : '');

      const sessionPayload: LiveStudentSession = {
        id: sessionId,
        formativeId: assessment.id,
        formativeTitle: assessment.blueprint.title || 'Science Formative Task',
        classSection: assessment.blueprint.classSection || 'MYP 2',
        studentId: studentUser.id || studentSafeId,
        studentName: studentUser.name || 'Student',
        startedAt: existingSubmission?.startedAt || new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        currentQuestionIndex: currentQIndex,
        totalQuestions: assessment.questions.length,
        answeredQuestionsCount: answered,
        currentQuestionId: currentQuestion?.id || '',
        currentTypedDraft: activeDraft,
        responses: responses,
        status: customOverrides.status || (document.hidden ? 'tab_switched' : 'active'),
        timeRemainingSeconds: secondsRemaining,
        integrityAudit: {
          tabSwitchCount,
          copyPasteAttempts,
          isLockdownViolated: tabSwitchCount > 0 || copyPasteAttempts > 0,
          fullscreenExitCount,
          awayDurationSeconds: totalAwaySecondsRef.current,
          isCurrentlyAway: !!awayStartTimestampRef.current,
          logs: integrityLogs,
          ...customOverrides.integrityAudit,
        },
        ...customOverrides,
      };

      StorageService.saveLiveSession(sessionPayload);
    },
    [
      assessment,
      currentQIndex,
      responses,
      secondsRemaining,
      sessionId,
      studentSafeId,
      studentUser,
      tabSwitchCount,
      copyPasteAttempts,
      fullscreenExitCount,
      integrityLogs,
      existingSubmission,
    ]
  );

  // Debounced real-time streaming for rapid keystrokes (200ms)
  const streamDebounced = useCallback(
    (overrides?: Partial<LiveStudentSession>) => {
      if (syncDebounceTimerRef.current) clearTimeout(syncDebounceTimerRef.current);
      syncDebounceTimerRef.current = setTimeout(() => {
        pushLiveSession(overrides);
      }, 200);
    },
    [pushLiveSession]
  );

  // Subscribe to live session updates to receive immediate Teacher Proctor Alerts
  useEffect(() => {
    const unsub = StorageService.subscribeToLiveSessions((sessions) => {
      const mySession = sessions[sessionId];
      if (mySession && mySession.activeTeacherAlert && mySession.activeTeacherAlert !== activeTeacherAlertMessage) {
        setActiveTeacherAlertMessage(mySession.activeTeacherAlert);
      }
    });

    // Initial session registration
    pushLiveSession({ status: 'active' });

    return () => {
      unsub();
      if (syncDebounceTimerRef.current) clearTimeout(syncDebounceTimerRef.current);
    };
  }, [sessionId]);

  // Sync whenever question changes or responses update
  useEffect(() => {
    streamDebounced();
  }, [currentQIndex, responses, streamDebounced]);

  // Lightbox modal for question diagram
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>(undefined);
  const [lightboxAlt, setLightboxAlt] = useState<string | undefined>(undefined);

  // Theme Mode (Daylight vs Dark)
  const [runnerTheme, setRunnerTheme] = useState<'light' | 'dark'>(() => StorageService.getTheme());
  
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setRunnerTheme(e.detail.theme);
      } else {
        setRunnerTheme(StorageService.getTheme());
      }
    };
    window.addEventListener('storage-theme-change', handleThemeChange);
    return () => window.removeEventListener('storage-theme-change', handleThemeChange);
  }, []);

  const toggleRunnerTheme = () => {
    const next = runnerTheme === 'dark' ? 'light' : 'dark';
    setRunnerTheme(next);
    StorageService.setTheme(next);
  };
  const isDaylight = runnerTheme === 'light';

  // Toast timer ref
  const toastTimeoutRef = useRef<any>(null);

  const showSecurityAlert = (message: string) => {
    setSecurityToast(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setSecurityToast(null);
    }, 4000);
  };

  // Request fullscreen mode
  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {
        // Some browser security policies require direct user click
      });
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- 1. DISABLE COPY, PASTE, CUT, CONTEXT MENU & SHORTCUTS ---
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyPasteAttempts((prev) => prev + 1);
      recordIntegrityEvent('Copy Attempted', 'Student attempted to copy assessment content to clipboard.');
      showSecurityAlert('🔒 Action Blocked: Copying text is strictly disabled during assessment mode.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyPasteAttempts((prev) => prev + 1);
      recordIntegrityEvent('Paste Attempted', 'Student attempted to paste external clipboard content into answer area.');
      showSecurityAlert('🔒 Action Blocked: Pasting external content is disabled to maintain academic integrity.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      showSecurityAlert('🔒 Action Blocked: Cutting content is disabled.');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showSecurityAlert('🔒 Right-click context menu is disabled during lockdown assessment.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl/Cmd + C, V, X, U, Shift+I, F12, PrintScreen
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (
        (isCmdOrCtrl && ['c', 'v', 'x', 'u', 'a'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (isCmdOrCtrl && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'PrintScreen'
      ) {
        if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
          e.preventDefault();
          setCopyPasteAttempts((prev) => prev + 1);
          recordIntegrityEvent('Paste Shortcut (Ctrl+V)', 'Student triggered paste shortcut.');
          showSecurityAlert('🔒 Shortcut Blocked: Paste is disabled.');
        } else if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setCopyPasteAttempts((prev) => prev + 1);
          recordIntegrityEvent('Copy Shortcut (Ctrl+C)', 'Student triggered copy shortcut.');
          showSecurityAlert('🔒 Shortcut Blocked: Copy is disabled.');
        } else if (e.key === 'F12' || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'i')) {
          e.preventDefault();
          recordIntegrityEvent('DevTools Attempt', 'Student tried to open browser developer tools.');
          showSecurityAlert('🔒 Developer inspection tools are blocked.');
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [recordIntegrityEvent]);

  // --- 2. LOCKDOWN APP: TAB SWITCHING & FULLSCREEN DETECTION ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Student switched tab or minimized window
        awayStartTimestampRef.current = Date.now();
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          const msg = `Student navigated away to another browser tab or minimized window.`;
          recordIntegrityEvent(`Tab Switch #${newCount}`, msg);
          setLockdownWarningMessage(
            `Tab switch detected! Leaving the assessment window is strictly prohibited. This infraction (Violation #${newCount}) has been recorded in your integrity audit report.`
          );
          setShowLockdownWarning(true);

          pushLiveSession({
            status: 'tab_switched',
            integrityAudit: {
              tabSwitchCount: newCount,
              copyPasteAttempts,
              isLockdownViolated: true,
              fullscreenExitCount,
              awayDurationSeconds: totalAwaySecondsRef.current,
              isCurrentlyAway: true,
              awayStartedAt: new Date().toISOString(),
              logs: [
                ...integrityLogs,
                { timestamp: new Date().toLocaleTimeString(), event: `Tab Switch #${newCount}`, details: msg },
              ],
            },
          });

          return newCount;
        });
      } else {
        // Student returned to tab
        if (awayStartTimestampRef.current) {
          const elapsedSecs = Math.max(1, Math.round((Date.now() - awayStartTimestampRef.current) / 1000));
          totalAwaySecondsRef.current += elapsedSecs;
          awayStartTimestampRef.current = null;

          recordIntegrityEvent(
            'Returned to Assessment',
            `Student returned after being away from window for ${elapsedSecs} seconds.`
          );

          pushLiveSession({
            status: 'active',
            integrityAudit: {
              tabSwitchCount,
              copyPasteAttempts,
              isLockdownViolated: tabSwitchCount > 0 || copyPasteAttempts > 0,
              fullscreenExitCount,
              awayDurationSeconds: totalAwaySecondsRef.current,
              isCurrentlyAway: false,
              logs: [
                ...integrityLogs,
                {
                  timestamp: new Date().toLocaleTimeString(),
                  event: 'Returned to Assessment',
                  details: `Student returned after ${elapsedSecs} seconds away.`,
                },
              ],
            },
          });
        }
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        awayStartTimestampRef.current = Date.now();
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          const msg = `Student focused on another application or multi-tasked outside the assessment.`;
          recordIntegrityEvent(`Window Focus Lost #${newCount}`, msg);
          setLockdownWarningMessage(
            `Application focus departure detected! You navigated away from the assessment window (Violation #${newCount}).`
          );
          setShowLockdownWarning(true);

          pushLiveSession({
            status: 'focus_lost',
            integrityAudit: {
              tabSwitchCount: newCount,
              copyPasteAttempts,
              isLockdownViolated: true,
              fullscreenExitCount,
              awayDurationSeconds: totalAwaySecondsRef.current,
              isCurrentlyAway: true,
              awayStartedAt: new Date().toISOString(),
              logs: [
                ...integrityLogs,
                { timestamp: new Date().toLocaleTimeString(), event: `Focus Lost #${newCount}`, details: msg },
              ],
            },
          });

          return newCount;
        });
      }
    };

    const handleWindowFocus = () => {
      if (awayStartTimestampRef.current) {
        const elapsedSecs = Math.max(1, Math.round((Date.now() - awayStartTimestampRef.current) / 1000));
        totalAwaySecondsRef.current += elapsedSecs;
        awayStartTimestampRef.current = null;

        recordIntegrityEvent(
          'Refocused Window',
          `Window focus returned after ${elapsedSecs} seconds away.`
        );

        pushLiveSession({
          status: 'active',
          integrityAudit: {
            tabSwitchCount,
            copyPasteAttempts,
            isLockdownViolated: tabSwitchCount > 0 || copyPasteAttempts > 0,
            fullscreenExitCount,
            awayDurationSeconds: totalAwaySecondsRef.current,
            isCurrentlyAway: false,
            logs: [
              ...integrityLogs,
              {
                timestamp: new Date().toLocaleTimeString(),
                event: 'Refocused Window',
                details: `Student refocused after ${elapsedSecs}s.`,
              },
            ],
          },
        });
      }
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen) {
        setFullscreenExitCount((prev) => {
          const newCount = prev + 1;
          recordIntegrityEvent(
            `Exited Fullscreen #${newCount}`,
            `Student exited fullscreen lockdown mode.`
          );
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Initial fullscreen attempt
    enterFullscreen();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [recordIntegrityEvent, enterFullscreen, pushLiveSession, tabSwitchCount, copyPasteAttempts, fullscreenExitCount, integrityLogs]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = assessment.questions[currentQIndex];
  const currentResp = responses[currentQ?.id] || {
    questionId: currentQ?.id,
    textAnswer: '',
    timestamp: new Date().toISOString(),
  };

  const updateResponse = (updates: Partial<StudentResponse>) => {
    const updated: StudentResponse = {
      ...currentResp,
      ...updates,
      timestamp: new Date().toISOString(),
    };
    setResponses((prev) => ({ ...prev, [currentQ.id]: updated }));
    setLastSavedTime('Just now');
  };

  // Flag current question
  const handleFlagQuestion = () => {
    if (!activeFlagModalQId) return;
    updateResponse({
      flagged: true,
      flagReason,
      flagNotes,
    });
    setActiveFlagModalQId(null);
    setFlagNotes('');
  };

  const answeredCount = (Object.values(responses) as StudentResponse[]).filter(
    (r) => (r.textAnswer && r.textAnswer.trim().length > 0) || r.selectedOptionId !== undefined
  ).length;

  const handleFinalSubmit = () => {
    setShowSubmitConfirm(false);
    // Exit fullscreen cleanly on submit
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    const integrityReport = {
      tabSwitchCount,
      copyPasteAttempts,
      isLockdownViolated: tabSwitchCount > 0 || copyPasteAttempts > 0,
      fullscreenExitCount,
      logs: integrityLogs,
    };

    // Update live session to submitted status
    pushLiveSession({
      status: 'submitted',
      integrityAudit: {
        ...integrityReport,
        awayDurationSeconds: totalAwaySecondsRef.current,
        isCurrentlyAway: false,
      },
    });

    onSubmitAssessment(responses, integrityReport);
  };

  return (
    <div className={`min-h-screen flex flex-col select-none transition-colors ${
      isDaylight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Examination Bar with Lockdown Status */}
      <header className={`px-4 py-3 sticky top-0 z-40 shadow-sm border-b transition-colors ${
        isDaylight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white shadow-md'
      }`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {bp.curriculum}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-sm font-bold truncate max-w-xs sm:max-w-md ${isDaylight ? 'text-slate-900' : 'text-white'}`}>{bp.title}</h1>
                <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isDaylight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                }`}>
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Lockdown Active
                </span>
              </div>
              <div className={`text-xs ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                Student: <span className={`font-medium ${isDaylight ? 'text-slate-800' : 'text-slate-200'}`}>{studentUser.name}</span> ({bp.classSection})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tab switch counter indicator if any */}
            {tabSwitchCount > 0 && (
              <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs px-2.5 py-1 rounded-lg font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{tabSwitchCount} Tab Switch{tabSwitchCount > 1 ? 'es' : ''}</span>
              </div>
            )}

            {/* Daylight / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleRunnerTheme}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                isDaylight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isDaylight ? 'Switch to Midnight Dark Mode' : 'Switch to Daylight Light Mode'}
            >
              {isDaylight ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Daylight</span>
                </>
              )}
            </button>

            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs sm:text-sm font-bold ${
              isDaylight
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-800 border-slate-700 text-amber-400'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Fullscreen toggle / trigger */}
            <button
              onClick={enterFullscreen}
              title="Ensure Fullscreen Lockdown Mode"
              className={`hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border ${
                isDaylight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>

            {/* Autosave Status */}
            <div className={`hidden md:flex items-center gap-1 text-xs ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
              <Save className="w-3.5 h-3.5 text-emerald-500" />
              <span>Autosaved</span>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit</span> Assessment
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Teacher Proctor Direct Alert / Message */}
      {activeTeacherAlertMessage && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 shadow-lg border-b border-amber-600 flex items-center justify-between animate-pulse">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Radio className="w-4 h-4 text-rose-900 animate-ping" />
              <span>Direct Teacher Proctor Notice:</span>
              <span className="font-medium text-slate-900">{activeTeacherAlertMessage}</span>
            </div>
            <button
              onClick={() => setActiveTeacherAlertMessage(null)}
              className="px-2.5 py-1 bg-slate-950 text-white rounded text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Security Toast Warning */}
      {securityToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-rose-400 animate-bounce">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{securityToast}</span>
        </div>
      )}

      {/* Main Question Arena */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left: Question Navigation Drawer */}
        <aside className={`md:col-span-1 border rounded-xl p-4 h-fit space-y-4 shadow-xs transition-colors ${
          isDaylight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className={`flex items-center justify-between text-xs font-bold uppercase tracking-wider ${
            isDaylight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <span>Questions</span>
            <span className="text-blue-600 font-bold">{answeredCount}/{assessment.questions.length}</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {assessment.questions.map((q, idx) => {
              const resp = responses[q.id];
              const isAnswered =
                (resp?.textAnswer && resp.textAnswer.trim().length > 0) || resp?.selectedOptionId !== undefined;
              const isCurrent = currentQIndex === idx;
              const isFlagged = resp?.flagged;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center relative transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-xs'
                      : isAnswered
                      ? isDaylight
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : isDaylight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-1 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Academic Integrity & Lockdown Badges */}
          <div className={`pt-3 border-t text-[11px] space-y-2 ${
            isDaylight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Copy/Paste Disabled</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Tab Switching Monitored</span>
            </div>
          </div>

          {/* Instructions summary */}
          <div className={`pt-3 border-t text-xs space-y-1 ${
            isDaylight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}>
            <div>
              <strong className={isDaylight ? 'text-slate-800' : 'text-slate-300'}>Topic:</strong> {bp.topic}
            </div>
            <div>
              <strong className={isDaylight ? 'text-slate-800' : 'text-slate-300'}>Marks:</strong> {currentQ.maxMarks} Marks
            </div>
            {bp.selectedCriterion && (
              <div>
                <strong className={isDaylight ? 'text-slate-800' : 'text-slate-300'}>Criterion:</strong> {bp.selectedCriterion}
              </div>
            )}
          </div>
        </aside>

        {/* Right: Active Question Arena */}
        <section className={`md:col-span-3 border rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-xs transition-colors ${
          isDaylight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className="space-y-4">
            {/* Header with Command Term Badge */}
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDaylight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-600">
                  Question {currentQ.questionNumber} of {assessment.questions.length}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                  isDaylight
                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  Command Term: {currentQ.commandTerm}
                </span>
                <span className={`text-xs font-medium ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                  ({currentQ.maxMarks} Marks)
                </span>
              </div>

              <button
                onClick={() => setActiveFlagModalQId(currentQ.id)}
                className={`text-xs px-2.5 py-1 rounded flex items-center gap-1 border transition-colors ${
                  currentResp.flagged
                    ? 'bg-amber-500/20 text-amber-700 border-amber-500/40 font-semibold'
                    : isDaylight
                    ? 'text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Flag className="w-3 h-3" />
                {currentResp.flagged ? 'Flagged' : 'Flag Question'}
              </button>
            </div>

            {/* Context/Scenario if present */}
            {currentQ.context && (
              <div className={`border-l-4 border-blue-600 p-3.5 rounded-r text-xs leading-relaxed ${
                isDaylight ? 'bg-blue-50/70 text-slate-800' : 'bg-slate-950 text-slate-300'
              }`}>
                <strong className={isDaylight ? 'text-blue-900' : 'text-blue-300'}>Practical Scenario:</strong> {currentQ.context}
              </div>
            )}

            {/* --- QUESTION IMAGE / DIAGRAM RENDERER --- */}
            {currentQ.imageUrl && (
              <div className={`border rounded-xl p-4 space-y-2 ${
                isDaylight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDaylight ? 'text-slate-800' : 'text-slate-300'
                  }`}>
                    <ImageIcon className="w-4 h-4 text-blue-600" /> Reference Scientific Diagram
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxImageUrl(currentQ.imageUrl!);
                      setLightboxCaption(currentQ.imageCaption);
                      setLightboxAlt(currentQ.imageAlt || `Question ${currentQ.questionNumber} Diagram`);
                    }}
                    className={`text-xs flex items-center gap-1 border px-2.5 py-1 rounded-lg transition-colors font-medium ${
                      isDaylight
                        ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                        : 'text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border-blue-800/60'
                    }`}
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> Click to Zoom / Inspect
                  </button>
                </div>

                <div
                  onClick={() => {
                    setLightboxImageUrl(currentQ.imageUrl!);
                    setLightboxCaption(currentQ.imageCaption);
                    setLightboxAlt(currentQ.imageAlt || `Question ${currentQ.questionNumber} Diagram`);
                  }}
                  className="max-h-72 w-full bg-white rounded-lg p-3 flex items-center justify-center cursor-zoom-in overflow-hidden hover:ring-2 hover:ring-blue-500 border border-slate-200 transition-all"
                >
                  <img
                    src={currentQ.imageUrl}
                    alt={currentQ.imageAlt || `Question ${currentQ.questionNumber} Diagram`}
                    className="max-h-64 max-w-full object-contain"
                  />
                </div>

                {currentQ.imageCaption && (
                  <p className={`text-xs italic text-center pt-1 ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {currentQ.imageCaption}
                  </p>
                )}
              </div>
            )}

            {/* Prompt */}
            <div className={`text-base font-semibold leading-relaxed ${
              isDaylight ? 'text-slate-900' : 'text-slate-100'
            }`}>
              {currentQ.prompt}
            </div>

            {/* Dataset table or Graph visualization if applicable */}
            {(currentQ.dataset || currentQ.tableData) && (
              <ScienceGraphViewer
                dataset={currentQ.dataset}
                tableData={currentQ.tableData}
                stimulusImageUrl={currentQ.imageUrl}
                isDaylight={isDaylight}
              />
            )}

            {/* MCQ Input Type */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-2 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = currentResp.selectedOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => updateResponse({ selectedOptionId: opt.id })}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? isDaylight
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-400/50'
                            : 'border-blue-500 bg-blue-600/20 text-white font-semibold'
                          : isDaylight
                          ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : isDaylight
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="text-sm">{opt.text}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Numerical / Short / Extended / Data-Based Text Input */}
            {currentQ.type !== 'mcq' && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-bold ${
                    isDaylight ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    Your Scientific Response ({currentQ.commandTerm} requirement):
                  </label>
                  <span className={`text-[10px] font-medium ${
                    isDaylight ? 'text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200' : 'text-amber-400/80'
                  }`}>
                    🔒 Direct typing required (Clipboard paste disabled)
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder={`Write your complete, evidence-based answer here. Ensure all units, working, and scientific explanations are included...`}
                  value={currentResp.textAnswer || ''}
                  onChange={(e) => updateResponse({ textAnswer: e.target.value })}
                  className={`w-full rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed select-text border transition-colors ${
                    isDaylight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      : 'bg-slate-950 border-slate-700 text-slate-100'
                  }`}
                />
                <div className={`text-right text-[11px] ${
                  isDaylight ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  {(currentResp.textAnswer || '').length} characters entered
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className={`flex items-center justify-between pt-4 border-t ${
            isDaylight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(currentQIndex - 1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                currentQIndex === 0
                  ? isDaylight
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-slate-800 text-slate-600 cursor-not-allowed'
                  : isDaylight
                  ? 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 shadow-xs'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRunnerTheme}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 sm:hidden ${
                  isDaylight
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isDaylight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span>{isDaylight ? 'Dark' : 'Daylight'}</span>
              </button>

              {currentQIndex < assessment.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(currentQIndex + 1)}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  Finish & Submit <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* --- LOCKDOWN FULLSCREEN WARNING OVERLAY MODAL --- */}
      {showLockdownWarning && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-600/20 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                ⚠️ Lockdown Security Alert: Tab Switch Detected!
              </h2>
              <div className="bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs p-3 rounded-xl font-semibold leading-relaxed">
                {lockdownWarningMessage}
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2 text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Examination Rules:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>You must remain in this window in full-screen mode until completion.</li>
                <li>Switching browser tabs or opening external apps is logged.</li>
                <li>Your teacher will receive the complete academic integrity report with exact timestamps.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLockdownWarning(false);
                  enterFullscreen();
                }}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Maximize className="w-4 h-4" />
                Acknowledge & Return to Fullscreen Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {activeFlagModalQId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" /> Flag Question {currentQ.questionNumber}
            </h3>
            <p className="text-xs text-slate-400">
              Notify your teacher about a problem or ambiguity with this question.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Flagging</label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
              >
                <option value="I do not understand the question">I do not understand the question</option>
                <option value="I think the question is unclear">I think the question is unclear</option>
                <option value="I think there is an error">I think there is an error</option>
                <option value="I have a technical problem">I have a technical problem</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Additional Notes (Optional)</label>
              <textarea
                rows={2}
                value={flagNotes}
                onChange={(e) => setFlagNotes(e.target.value)}
                placeholder="Describe what was confusing..."
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white select-text"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveFlagModalQId(null)}
                className="px-3 py-1.5 border border-slate-700 text-xs font-semibold rounded text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagQuestion}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded"
              >
                Save Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Submit Formative Assessment?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You have answered <strong>{answeredCount}</strong> of <strong>{assessment.questions.length}</strong> questions.
              Once submitted, the AI Examiner will perform strict curriculum-aligned marking and diagnose your learning gaps.
            </p>

            {tabSwitchCount > 0 && (
              <div className="bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs p-2.5 rounded-lg text-left">
                <strong>Academic Integrity Note:</strong> {tabSwitchCount} tab-switch event(s) and {copyPasteAttempts} clipboard attempt(s) will be submitted to your teacher's grading ledger.
              </div>
            )}

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2 border border-slate-700 text-xs font-bold rounded-lg text-slate-300 hover:bg-slate-800"
              >
                Return to Assessment
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md"
              >
                Confirm & Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Lightbox Zoom Modal for Diagrams */}
      {lightboxImageUrl && (
        <ImageLightboxModal
          isOpen={!!lightboxImageUrl}
          imageUrl={lightboxImageUrl}
          imageCaption={lightboxCaption}
          imageAlt={lightboxAlt}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}
    </div>
  );
};
