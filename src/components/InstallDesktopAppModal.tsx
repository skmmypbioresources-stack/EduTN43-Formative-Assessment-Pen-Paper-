import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Laptop,
  Download,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Apple,
} from 'lucide-react';

interface InstallDesktopAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallDesktopAppModal: React.FC<InstallDesktopAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'windows' | 'mac' | 'chromebook'>('windows');

  useEffect(() => {
    // Detect if running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detect user platform for default tab
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('cros')) {
      setActivePlatformTab('chromebook');
    } else if (userAgent.includes('mac')) {
      setActivePlatformTab('mac');
    } else {
      setActivePlatformTab('windows');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instruction
      alert('To install FormativeIQ on your computer, click the Install App button in your browser URL bar or browser menu.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-b border-slate-700/80 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Download & Install Desktop App
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  PWA Ready
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Install EduTN43 Formative IQ on Windows, Mac, or Chromebook for secure lockdown assessment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Install Banner */}
          <div className="bg-slate-800/80 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-sm font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {isInstalled ? 'App is Installed & Running!' : '1-Click Direct Installation'}
              </div>
              <p className="text-xs text-slate-300">
                {isInstalled
                  ? 'You are running the standalone desktop version of FormativeIQ with full lockdown security.'
                  : 'Install FormativeIQ to your desktop, taskbar, or Chromebook launcher for dedicated offline and lockdown use.'}
              </p>
            </div>

            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            )}

            {isInstalled && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4" /> Installed
              </div>
            )}
          </div>

          {/* OS Platform Selector Tabs */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step-by-Step Installation Guides by Device:
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActivePlatformTab('windows')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activePlatformTab === 'windows'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Windows PC
              </button>

              <button
                onClick={() => setActivePlatformTab('mac')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activePlatformTab === 'mac'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" /> Mac (macOS)
              </button>

              <button
                onClick={() => setActivePlatformTab('chromebook')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  activePlatformTab === 'chromebook'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" /> Chromebook
              </button>
            </div>

            {/* Tab: Windows */}
            {activePlatformTab === 'windows' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" /> Windows 10 & 11 (Google Chrome or Microsoft Edge)
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    Look at the right side of the browser URL / Address bar at the top of your screen.
                  </li>
                  <li>
                    Click the <strong className="text-white">"Install app"</strong> icon (or computer with down-arrow).
                  </li>
                  <li>
                    Click <strong className="text-blue-400">"Install"</strong> in the prompt.
                  </li>
                  <li>
                    FormativeIQ will open in a dedicated desktop window and place an icon on your <strong>Desktop</strong> and <strong>Start Menu</strong>.
                  </li>
                </ol>
              </div>
            )}

            {/* Tab: Mac */}
            {activePlatformTab === 'mac' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Apple className="w-4 h-4 text-slate-200" /> macOS (Apple Silicon & Intel)
                </div>
                <div className="space-y-2 text-slate-300 leading-relaxed">
                  <p><strong className="text-blue-300">Option A (Chrome / Edge):</strong> Click the install icon in the URL address bar &rarr; click <em>Install FormativeIQ</em>.</p>
                  <p><strong className="text-blue-300">Option B (Safari on macOS Sonoma+):</strong> Click <em>File</em> in the top menu &rarr; <em>Add to Dock...</em> &rarr; click <em>Add</em>.</p>
                  <p className="text-slate-400">The app will appear in your <strong>Applications</strong> folder and <strong>Dock</strong> as a standalone Mac application.</p>
                </div>
              </div>
            )}

            {/* Tab: Chromebook */}
            {activePlatformTab === 'chromebook' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" /> Google Chromebook / ChromeOS (Classroom Devices)
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    Click the <strong className="text-white">Install</strong> icon in the Chrome Omnibox / address bar.
                  </li>
                  <li>
                    Select <strong className="text-emerald-400">Install FormativeIQ</strong>.
                  </li>
                  <li>
                    Right-click the icon on your Chromebook Shelf / Launcher and select <strong className="text-white">"Pin to Shelf"</strong> for quick 1-click exam access.
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Security & Lockdown Advantage */}
          <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-blue-200">Why install as a Desktop App?</div>
              <p className="text-slate-300 leading-relaxed">
                The installed desktop app provides an optimized assessment container with instant fullscreen examination mode, clipboard copy/paste defense, and tab-switch monitoring for academic integrity.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
