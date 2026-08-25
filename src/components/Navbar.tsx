import React from 'react';
import { UserProfile } from '../types';
import { BookOpen, FileSpreadsheet, Lock, Unlock, GraduationCap, User, LogOut, Download, Laptop } from 'lucide-react';

interface NavbarProps {
  activeUser: UserProfile;
  isTeacherAuthenticated: boolean;
  onRequestTeacherAccess: () => void;
  onLockTeacherMode: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenInstallModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeUser,
  isTeacherAuthenticated,
  onRequestTeacherAccess,
  onLockTeacherMode,
  activeTab,
  onTabChange,
  onOpenInstallModal,
}) => {
  const isTeacher = activeUser.role === 'teacher' && isTeacherAuthenticated;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onTabChange('dashboard')}
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight">FormativeIQ</span>
                <span className="bg-blue-500/20 text-blue-300 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-blue-500/30">
                  Sciences Faculty Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                {isTeacher
                  ? 'Curriculum Authoring & Live Student Diagnosis'
                  : 'Student Interactive Assessment Portal'}
              </p>
            </div>
          </div>

          {/* Navigation Items (based on Authenticated Role) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isTeacher ? (
              <>
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  My Formatives
                </button>
                <button
                  onClick={() => onTabChange('builder')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'builder'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-400 hover:bg-blue-600/20'
                  }`}
                >
                  + Create Formative
                </button>
                <button
                  onClick={() => onTabChange('student_works')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'student_works'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-300 hover:bg-indigo-600/20'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  All Student Works
                </button>
                <button
                  onClick={() => onTabChange('analytics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  Class Analytics
                </button>
                <button
                  onClick={() => onTabChange('question_bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'question_bank'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  Question Bank
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onTabChange('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  Assigned Formatives
                </button>
                <button
                  onClick={() => onTabChange('student_progress')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'student_progress'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  My Progress & Feedback
                </button>
              </>
            )}
          </nav>

          {/* Access Control Controls */}
          <div className="flex items-center gap-2">
            {/* Install Desktop App Trigger */}
            {onOpenInstallModal && (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Install FormativeIQ Desktop App on Windows, Mac, or Chromebook"
              >
                <Laptop className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Desktop App</span>
              </button>
            )}

            {isTeacher ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1 rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300 font-medium truncate max-w-[130px]">
                    {activeUser.name}
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                    Faculty
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onLockTeacherMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 border border-slate-700 text-slate-300 transition-colors shadow-xs"
                  title="Lock Teacher Dashboard and return to Student Portal"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lock Dashboard</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-3 py-1 rounded-lg text-xs font-medium">
                  <User className="w-3.5 h-3.5" />
                  <span>Student Portal</span>
                </div>

                <button
                  type="button"
                  onClick={onRequestTeacherAccess}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm hover:scale-102"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Faculty & Teacher Access</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
