import React, { useState, useEffect, useMemo } from 'react';
import {
  FormativeAssessment,
  LiveStudentSession,
  UserProfile,
} from '../types';
import { StorageService } from '../services/storageService';
import {
  Radio,
  Eye,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Send,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Maximize2,
  Minimize2,
  X,
  MessageSquare,
  Activity,
  User,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap,
} from 'lucide-react';

interface RealTimeWritingMonitorProps {
  assessments: FormativeAssessment[];
  activeTeacher: UserProfile;
  onOpenAssessmentRunner?: (assessment: FormativeAssessment, studentUser?: UserProfile) => void;
  isDaylight?: boolean;
}

export const RealTimeWritingMonitor: React.FC<RealTimeWritingMonitorProps> = ({
  assessments,
  activeTeacher,
  onOpenAssessmentRunner,
  isDaylight = false,
}) => {
  const [liveSessions, setLiveSessions] = useState<Record<string, LiveStudentSession>>({});
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('all');
  const [selectedClassSection, setSelectedClassSection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDetailSessionId, setSelectedDetailSessionId] = useState<string | null>(null);
  
  // Custom alert message modal state
  const [alertModalSession, setAlertModalSession] = useState<LiveStudentSession | null>(null);
  const [customAlertText, setCustomAlertText] = useState<string>('');
  const [isSendingAlert, setIsSendingAlert] = useState<boolean>(false);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);

  // Subscribe to real-time live sessions
  useEffect(() => {
    const unsub = StorageService.subscribeToLiveSessions((sessions) => {
      setLiveSessions(sessions);
    });

    const handleLocalEvent = (e: any) => {
      if (e.detail) {
        setLiveSessions((prev) => ({ ...prev, [e.detail.id]: e.detail }));
      }
    };
    window.addEventListener('live-session-update', handleLocalEvent);

    return () => {
      unsub();
      window.removeEventListener('live-session-update', handleLocalEvent);
    };
  }, []);

  // Filter sessions
  const sessionList = useMemo(() => {
    return (Object.values(liveSessions) as LiveStudentSession[]).filter((s) => {
      if (selectedAssessmentId !== 'all' && s.formativeId !== selectedAssessmentId) {
        return false;
      }
      if (selectedClassSection !== 'all' && s.classSection !== selectedClassSection) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.studentName.toLowerCase().includes(q) ||
          s.formativeTitle.toLowerCase().includes(q) ||
          s.classSection.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [liveSessions, selectedAssessmentId, selectedClassSection, searchQuery]);

  // Real-time aggregates
  const activeCount = sessionList.filter((s) => s.status === 'active').length;
  const awayCount = sessionList.filter(
    (s) => s.status === 'tab_switched' || s.status === 'focus_lost' || s.integrityAudit?.isCurrentlyAway
  ).length;
  const violationCount = sessionList.filter((s) => (s.integrityAudit?.tabSwitchCount || 0) > 0).length;
  const submittedCount = sessionList.filter((s) => s.status === 'submitted').length;

  const handleSendAlert = async (session: LiveStudentSession, message: string) => {
    if (!message.trim()) return;
    setIsSendingAlert(true);
    await StorageService.sendTeacherAlert(session.id, message);
    setIsSendingAlert(false);
    setAlertModalSession(null);
    setCustomAlertText('');
    setAlertSuccessToast(`Proctor notice sent to ${session.studentName}!`);
    setTimeout(() => setAlertSuccessToast(null), 3500);
  };

  const handleClearSession = async (sessionId: string) => {
    await StorageService.deleteLiveSession(sessionId);
    if (selectedDetailSessionId === sessionId) {
      setSelectedDetailSessionId(null);
    }
  };

  // Seed sample session if completely empty
  const handleSeedDemoSession = async () => {
    const targetAssessment = assessments[0];
    if (!targetAssessment) return;

    const demoSession: LiveStudentSession = {
      id: `${targetAssessment.id}_demo_student_alex`,
      formativeId: targetAssessment.id,
      formativeTitle: targetAssessment.blueprint.title || 'Science Formative Task',
      classSection: targetAssessment.blueprint.classSection || 'MYP 2',
      studentId: 'demo-student-alex',
      studentName: 'Alex Mercer',
      startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      lastActiveAt: new Date().toISOString(),
      currentQuestionIndex: 1,
      totalQuestions: targetAssessment.questions.length,
      answeredQuestionsCount: 1,
      currentQuestionId: targetAssessment.questions[1]?.id || '',
      currentTypedDraft:
        'In this experiment, the independent variable is the concentration of substrate (0.1M to 1.0M) while the temperature is maintained constant at 37°C using a thermostatically controlled water bath. As substrate concentration increases from 0.1M to 0.6M, the initial reaction rate increases proportionally due to greater enzyme-substrate collision frequency...',
      responses: {},
      status: 'active',
      timeRemainingSeconds: 28 * 60,
      integrityAudit: {
        tabSwitchCount: 1,
        copyPasteAttempts: 0,
        isLockdownViolated: true,
        fullscreenExitCount: 0,
        awayDurationSeconds: 14,
        isCurrentlyAway: false,
        logs: [
          {
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toLocaleTimeString(),
            event: 'Assessment Started',
            details: 'Entered fullscreen lockdown session.',
          },
          {
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString(),
            event: 'Tab Switch #1',
            details: 'Student switched to another browser tab or minimized window.',
          },
          {
            timestamp: new Date(Date.now() - 4.8 * 60 * 1000).toLocaleTimeString(),
            event: 'Returned to Assessment',
            details: 'Student returned after 14 seconds away.',
          },
        ],
      },
    };

    const demoSession2: LiveStudentSession = {
      id: `${targetAssessment.id}_demo_student_priya`,
      formativeId: targetAssessment.id,
      formativeTitle: targetAssessment.blueprint.title || 'Science Formative Task',
      classSection: targetAssessment.blueprint.classSection || 'MYP 2',
      studentId: 'demo-student-priya',
      studentName: 'Priya Sharma',
      startedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      lastActiveAt: new Date().toISOString(),
      currentQuestionIndex: 2,
      totalQuestions: targetAssessment.questions.length,
      answeredQuestionsCount: 2,
      currentQuestionId: targetAssessment.questions[2]?.id || '',
      currentTypedDraft:
        'The anomalous data point at Trial 3 (rate = 4.2 mL/min) was likely caused by a delay in attaching the gas syringe stopper, allowing oxygen gas to escape before volumetric measurements began...',
      responses: {},
      status: 'tab_switched',
      timeRemainingSeconds: 22 * 60,
      integrityAudit: {
        tabSwitchCount: 2,
        copyPasteAttempts: 1,
        isLockdownViolated: true,
        fullscreenExitCount: 1,
        awayDurationSeconds: 46,
        isCurrentlyAway: true,
        awayStartedAt: new Date(Date.now() - 30 * 1000).toISOString(),
        logs: [
          {
            timestamp: new Date(Date.now() - 16 * 60 * 1000).toLocaleTimeString(),
            event: 'Assessment Started',
            details: 'Entered lockdown session.',
          },
          {
            timestamp: new Date(Date.now() - 11 * 60 * 1000).toLocaleTimeString(),
            event: 'Tab Switch #1',
            details: 'Student switched to another browser tab.',
          },
          {
            timestamp: new Date(Date.now() - 7 * 60 * 1000).toLocaleTimeString(),
            event: 'Paste Attempted',
            details: 'Clipboard paste blocked by security sandbox.',
          },
          {
            timestamp: new Date(Date.now() - 30 * 1000).toLocaleTimeString(),
            event: 'Tab Switch #2 (Current)',
            details: 'Student navigated away from assessment window (Active away duration: 30s+).',
          },
        ],
      },
    };

    await StorageService.saveLiveSession(demoSession);
    await StorageService.saveLiveSession(demoSession2);
  };

  const selectedDetailSession = selectedDetailSessionId ? liveSessions[selectedDetailSessionId] : null;

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-Time Pulse Indicator */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors shadow-xs ${
        isDaylight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75" />
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center relative shadow-md">
                <Radio className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
                  Live Proctoring & Real-Time Writing Monitor
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className={`text-xs ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                Observe student typed drafts character-by-character and detect browser tab departures, focus loss, and paste violations in real-time.
              </p>
            </div>
          </div>

          {/* Quick Actions & Demo Seed */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSeedDemoSession}
              className={`text-xs px-3 py-2 rounded-xl font-bold border transition-colors flex items-center gap-1.5 shadow-xs ${
                isDaylight
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border-blue-800'
              }`}
              title="Populate simulated student streams to test proctoring view"
            >
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              <span>Simulate Active Students</span>
            </button>

            {assessments.length > 0 && onOpenAssessmentRunner && (
              <button
                onClick={() => onOpenAssessmentRunner(assessments[0], {
                  id: 'student-test-runner',
                  name: 'Student (Live Test)',
                  email: 'test@student.edu',
                  role: 'student',
                  classSections: [assessments[0].blueprint.classSection || 'MYP 2'],
                })}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                title="Launch a test student assessment window to see live typing updates"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test as Student</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className={`p-3 rounded-xl border ${
            isDaylight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className={`text-[11px] font-semibold ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
              Writing Now (Active)
            </div>
            <div className="text-xl font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {activeCount}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            awayCount > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300'
              : isDaylight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="text-[11px] font-semibold">Currently Away / Tab Switched</div>
            <div className={`text-xl font-bold flex items-center gap-1.5 ${
              awayCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
            }`}>
              {awayCount > 0 && <AlertTriangle className="w-4 h-4 text-rose-500" />}
              {awayCount}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDaylight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className={`text-[11px] font-semibold ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
              Integrity Infractions
            </div>
            <div className="text-xl font-bold text-amber-600">
              {violationCount}
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${
            isDaylight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className={`text-[11px] font-semibold ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
              Completed Submissions
            </div>
            <div className="text-xl font-bold text-blue-600">
              {submittedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isDaylight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search by student name or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isDaylight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                  : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
              }`}
            />
          </div>

          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDaylight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Formative Tasks</option>
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.blueprint.title} ({a.blueprint.classSection})
              </option>
            ))}
          </select>

          <select
            value={selectedClassSection}
            onChange={(e) => setSelectedClassSection(e.target.value)}
            className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDaylight
                ? 'bg-white border-slate-300 text-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <option value="all">All Class Sections</option>
            <option value="MYP 2">MYP 2</option>
            <option value="Grade 9A">Grade 9A</option>
            <option value="Grade 9B">Grade 9B</option>
            <option value="Grade 10-Bio">Grade 10-Bio</option>
            <option value="FM3-Sci">FM3-Sci</option>
            <option value="DP1-Bio">DP1-Bio</option>
          </select>
        </div>

        <div className={`text-xs font-semibold ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
          Showing {sessionList.length} live stream{sessionList.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Success Toast */}
      {alertSuccessToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{alertSuccessToast}</span>
        </div>
      )}

      {/* Main Student Live Writing Grid */}
      {sessionList.length === 0 ? (
        <div className={`text-center py-12 px-4 rounded-2xl border transition-colors ${
          isDaylight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <Radio className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-50 animate-pulse" />
          <h3 className={`text-base font-bold mb-1 ${isDaylight ? 'text-slate-800' : 'text-slate-200'}`}>
            No Live Student Sessions Found
          </h3>
          <p className="text-xs max-w-md mx-auto mb-4">
            When students begin an assessment in lockdown mode, their keystrokes, active question progress, and tab-focus integrity will stream here automatically.
          </p>
          <button
            onClick={handleSeedDemoSession}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md transition-colors"
          >
            <Zap className="w-4 h-4" /> Launch Interactive Demo Streams
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sessionList.map((session) => {
            const isAway = session.status === 'tab_switched' || session.status === 'focus_lost' || session.integrityAudit?.isCurrentlyAway;
            const isSubmitted = session.status === 'submitted';
            const violationTotal = (session.integrityAudit?.tabSwitchCount || 0) + (session.integrityAudit?.copyPasteAttempts || 0);

            return (
              <div
                key={session.id}
                className={`rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                  isAway
                    ? 'border-rose-500/80 bg-rose-50/20 dark:bg-rose-950/20 ring-1 ring-rose-500/30'
                    : isSubmitted
                    ? isDaylight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/60 border-slate-800 opacity-80'
                    : isDaylight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top: Student Info & Status Badges */}
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        isAway
                          ? 'bg-rose-600 text-white'
                          : isSubmitted
                          ? 'bg-slate-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {session.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold ${isDaylight ? 'text-slate-900' : 'text-white'}`}>
                            {session.studentName}
                          </h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isDaylight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {session.classSection}
                          </span>
                        </div>
                        <div className={`text-xs font-medium truncate max-w-[240px] sm:max-w-xs ${
                          isDaylight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {session.formativeTitle}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isAway ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/40 text-xs font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>TAB SWITCHED (AWAY)</span>
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/30 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Submitted</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Writing Live</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress and Timer Strip */}
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isDaylight ? 'text-slate-700' : 'text-slate-300'}`}>
                        Active on Q{session.currentQuestionIndex + 1} of {session.totalQuestions}
                      </span>
                      <span className={`text-[11px] ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                        ({session.answeredQuestionsCount} answered)
                      </span>
                    </div>

                    {session.timeRemainingSeconds !== undefined && (
                      <div className={`flex items-center gap-1 font-mono text-[11px] ${
                        isDaylight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{Math.floor(session.timeRemainingSeconds / 60)}m left</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Center: Live Typed Keystroke Preview */}
                <div className="p-4 sm:p-5 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${
                      isDaylight ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      Live Draft Stream (Question {session.currentQuestionIndex + 1}):
                    </span>
                    <span className={`text-[11px] ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {session.currentTypedDraft?.length || 0} chars
                    </span>
                  </div>

                  {/* Live typing viewer box */}
                  <div className={`p-3.5 rounded-xl border min-h-[95px] max-h-[140px] overflow-y-auto font-mono text-xs leading-relaxed relative ${
                    isAway
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      : isDaylight
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200'
                  }`}>
                    {session.currentTypedDraft ? (
                      <>
                        <span>{session.currentTypedDraft}</span>
                        {!isSubmitted && (
                          <span className="inline-block w-1.5 h-3.5 bg-blue-500 ml-0.5 animate-pulse align-middle" />
                        )}
                      </>
                    ) : (
                      <span className="italic text-slate-400">
                        Student is currently viewing question prompt, has not typed yet...
                      </span>
                    )}
                  </div>

                  {/* Integrity Audit Summary Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className={`p-2 rounded-lg border text-center ${
                      (session.integrityAudit?.tabSwitchCount || 0) > 0
                        ? 'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300 font-bold'
                        : isDaylight ? 'bg-slate-100/60 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <div className="text-[10px] uppercase font-semibold">Tab Switches</div>
                      <div className="text-sm font-bold">{session.integrityAudit?.tabSwitchCount || 0}</div>
                    </div>

                    <div className={`p-2 rounded-lg border text-center ${
                      (session.integrityAudit?.awayDurationSeconds || 0) > 0
                        ? 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300 font-bold'
                        : isDaylight ? 'bg-slate-100/60 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <div className="text-[10px] uppercase font-semibold">Time Away</div>
                      <div className="text-sm font-bold">{session.integrityAudit?.awayDurationSeconds || 0}s</div>
                    </div>

                    <div className={`p-2 rounded-lg border text-center ${
                      (session.integrityAudit?.copyPasteAttempts || 0) > 0
                        ? 'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300 font-bold'
                        : isDaylight ? 'bg-slate-100/60 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      <div className="text-[10px] uppercase font-semibold">Paste Blocks</div>
                      <div className="text-sm font-bold">{session.integrityAudit?.copyPasteAttempts || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Teacher Action Controls */}
                <div className={`p-3 sm:px-5 border-t flex items-center justify-between gap-2 ${
                  isDaylight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <button
                    onClick={() => setSelectedDetailSessionId(session.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                      isDaylight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Audit Logs ({session.integrityAudit?.logs?.length || 0})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAlertModalSession(session)}
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Send direct proctor alert banner to student screen"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send Alert</span>
                    </button>

                    <button
                      onClick={() => handleClearSession(session.id)}
                      className={`text-xs p-1.5 rounded-lg border transition-colors ${
                        isDaylight
                          ? 'text-slate-400 hover:text-rose-600 border-slate-200 hover:bg-rose-50'
                          : 'text-slate-500 hover:text-rose-400 border-slate-800 hover:bg-slate-800'
                      }`}
                      title="Dismiss / End monitoring session"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Fullscreen Audit Log & Expanded Stream Modal */}
      {selectedDetailSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`max-w-2xl w-full rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
            isDaylight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDaylight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-bold">
                    Proctor Audit & Live Stream: {selectedDetailSession.studentName}
                  </h3>
                  <div className={`text-xs ${isDaylight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedDetailSession.formativeTitle} • {selectedDetailSession.classSection}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailSessionId(null)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDaylight ? 'border-slate-200 hover:bg-slate-200 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Live Writing View */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-blue-500">
                  <Activity className="w-4 h-4" /> Current Active Draft:
                </h4>
                <div className={`p-4 rounded-xl border font-mono text-xs leading-relaxed ${
                  isDaylight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-200'
                }`}>
                  {selectedDetailSession.currentTypedDraft || '(No active draft content entered yet)'}
                </div>
              </div>

              {/* Timestamped Integrity Audit Trail */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-500">
                  <Clock className="w-4 h-4" /> Real-Time Integrity Audit Trail:
                </h4>
                <div className={`rounded-xl border divide-y ${
                  isDaylight ? 'bg-slate-50 border-slate-200 divide-slate-200' : 'bg-slate-950 border-slate-800 divide-slate-800'
                }`}>
                  {selectedDetailSession.integrityAudit?.logs && selectedDetailSession.integrityAudit.logs.length > 0 ? (
                    selectedDetailSession.integrityAudit.logs.map((log, idx) => (
                      <div key={idx} className="p-3 text-xs flex items-start gap-3">
                        <span className={`font-mono text-[11px] font-semibold shrink-0 ${
                          isDaylight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {log.timestamp}
                        </span>
                        <div>
                          <div className={`font-bold ${
                            log.event.includes('Tab Switch') || log.event.includes('Focus Lost')
                              ? 'text-rose-600'
                              : log.event.includes('Paste') || log.event.includes('Copy')
                              ? 'text-amber-600'
                              : log.event.includes('Returned')
                              ? 'text-emerald-600'
                              : isDaylight ? 'text-slate-800' : 'text-slate-200'
                          }`}>
                            {log.event}
                          </div>
                          <div className={`text-[11px] ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                            {log.details}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No security violations or tab switches recorded for this session.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between ${
              isDaylight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
            }`}>
              <button
                onClick={() => {
                  setSelectedDetailSessionId(null);
                  setAlertModalSession(selectedDetailSession);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Send Proctor Alert to Student
              </button>

              <button
                onClick={() => setSelectedDetailSessionId(null)}
                className={`text-xs px-4 py-2 rounded-xl border font-bold ${
                  isDaylight ? 'border-slate-300 text-slate-700 bg-white' : 'border-slate-700 text-slate-300 bg-slate-800'
                }`}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Proctor Notice Modal */}
      {alertModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className={`max-w-md w-full rounded-2xl border shadow-2xl overflow-hidden ${
            isDaylight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDaylight ? 'border-slate-200 bg-amber-50' : 'border-slate-800 bg-amber-950/40'
            }`}>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold">
                  Send Direct Notice to {alertModalSession.studentName}
                </h3>
              </div>
              <button
                onClick={() => setAlertModalSession(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className={`text-xs ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
                This notification will appear prominently on top of the student's assessment screen in real-time.
              </p>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Presets:
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    '⚠️ Notice: Tab switching is monitored. Please remain on your assessment window.',
                    '⚠️ Focus reminder: Please do not multitask during the examination.',
                    '⏱️ Reminder: 10 minutes remaining in this formative task.',
                    '✅ Please ensure you provide evidence and scientific units in your response.',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomAlertText(preset)}
                      className={`text-left text-xs p-2 rounded-lg border transition-colors ${
                        customAlertText === preset
                          ? 'border-amber-500 bg-amber-500/20 font-bold'
                          : isDaylight
                          ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                          : 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Custom Alert Text:
                </label>
                <textarea
                  rows={3}
                  value={customAlertText}
                  onChange={(e) => setCustomAlertText(e.target.value)}
                  placeholder="Enter message to display on student screen..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDaylight
                      ? 'bg-slate-50 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className={`p-4 border-t flex items-center justify-end gap-2 ${
              isDaylight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950'
            }`}>
              <button
                onClick={() => setAlertModalSession(null)}
                className={`text-xs px-3.5 py-2 rounded-xl border font-semibold ${
                  isDaylight ? 'border-slate-300 text-slate-700' : 'border-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                disabled={!customAlertText.trim() || isSendingAlert}
                onClick={() => handleSendAlert(alertModalSession, customAlertText)}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingAlert ? 'Sending...' : 'Transmit Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
