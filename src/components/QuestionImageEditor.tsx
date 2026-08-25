import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link,
  Trash2,
  Sparkles,
  CheckCircle2,
  Eye,
  X,
  FileImage,
} from 'lucide-react';

// Authentic Science Diagram SVG Presets encoded as clean SVG data URIs
export const SCIENCE_DIAGRAM_PRESETS = [
  {
    id: 'menstrual-hormones',
    title: 'Hormonal Fluctuation in 28-Day Menstrual Cycle',
    subject: 'Biology',
    alt: 'Graph showing plasma LH surge, FSH, Estrogen, and Progesterone over 28 days',
    caption: 'Figure 1: Changes in ovarian and pituitary hormone concentrations (LH, FSH, Estrogen, Progesterone) across the 28-day human menstrual cycle.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="100%" height="100%" style="background:#ffffff; font-family:sans-serif;">
        <rect width="600" height="320" fill="#ffffff" rx="8"/>
        <text x="300" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">Hormone Concentrations in 28-Day Menstrual Cycle</text>
        
        <!-- Phases shading -->
        <rect x="60" y="40" width="240" height="230" fill="#eff6ff" opacity="0.6"/>
        <text x="180" y="55" text-anchor="middle" font-size="11" font-weight="600" fill="#3b82f6">Follicular Phase (Days 1–13)</text>
        <line x1="300" y1="40" x2="300" y2="270" stroke="#ef4444" stroke-dasharray="4,4" stroke-width="1.5"/>
        <text x="300" y="38" text-anchor="middle" font-size="10" font-weight="bold" fill="#dc2626">Day 14 Ovulation</text>
        <rect x="300" y="40" width="240" height="230" fill="#fef2f2" opacity="0.6"/>
        <text x="420" y="55" text-anchor="middle" font-size="11" font-weight="600" fill="#ef4444">Luteal Phase (Days 15–28)</text>
        
        <!-- Axes -->
        <line x1="60" y1="270" x2="540" y2="270" stroke="#334155" stroke-width="2"/>
        <line x1="60" y1="50" x2="60" y2="270" stroke="#334155" stroke-width="2"/>
        <text x="300" y="305" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b">Time (Days of Menstrual Cycle)</text>
        <text x="20" y="160" text-anchor="middle" font-size="11" font-weight="600" fill="#1e293b" transform="rotate(-90 20 160)">Relative Concentration (a.u.)</text>
        
        <!-- X Axis labels -->
        <text x="60" y="285" font-size="10" fill="#64748b" text-anchor="middle">Day 1</text>
        <text x="180" y="285" font-size="10" fill="#64748b" text-anchor="middle">Day 7</text>
        <text x="300" y="285" font-size="10" fill="#64748b" text-anchor="middle">Day 14</text>
        <text x="420" y="285" font-size="10" fill="#64748b" text-anchor="middle">Day 21</text>
        <text x="540" y="285" font-size="10" fill="#64748b" text-anchor="middle">Day 28</text>
        
        <!-- Curves -->
        <!-- LH surge: red curve -->
        <path d="M 60,250 Q 200,245 280,210 Q 300,70 310,210 Q 380,250 540,255" fill="none" stroke="#dc2626" stroke-width="3"/>
        <text x="312" y="80" font-size="10" font-weight="bold" fill="#dc2626">LH Surge</text>
        
        <!-- Estrogen: blue curve -->
        <path d="M 60,240 Q 220,220 280,120 Q 300,160 380,150 Q 460,160 540,245" fill="none" stroke="#2563eb" stroke-width="2.5"/>
        <text x="250" y="115" font-size="10" font-weight="bold" fill="#2563eb">Estrogen</text>
        
        <!-- Progesterone: purple curve -->
        <path d="M 60,260 L 300,255 Q 400,100 440,110 Q 480,130 540,255" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
        <text x="430" y="100" font-size="10" font-weight="bold" fill="#7c3aed">Progesterone</text>
        
        <!-- FSH: green curve -->
        <path d="M 60,220 Q 120,200 280,220 Q 300,150 320,230 Q 440,250 540,250" fill="none" stroke="#16a34a" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="130" y="195" font-size="10" font-weight="bold" fill="#16a34a">FSH</text>
      </svg>
    `)}`,
  },
  {
    id: 'osmosis-dialysis',
    title: 'Dialysis Tubing / Osmosis Investigation',
    subject: 'Biology',
    alt: 'Diagram showing Visking dialysis tubing containing 20% sucrose immersed in pure water with capillary tube',
    caption: 'Figure 2: Model osmometer apparatus using semi-permeable dialysis tubing submerged in distilled water to measure osmotic volume change.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320" width="100%" height="100%" style="background:#ffffff; font-family:sans-serif;">
        <rect width="500" height="320" fill="#ffffff" rx="8"/>
        <text x="250" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">Osmosis Investigation Apparatus (Visking Tubing)</text>
        
        <!-- Beaker -->
        <path d="M 120,80 L 120,260 Q 120,280 140,280 L 360,280 Q 380,280 380,260 L 380,80" fill="#f0fdf4" stroke="#334155" stroke-width="3"/>
        <text x="390" y="180" font-size="11" fill="#15803d" font-weight="bold">Distilled Water (100% H2O)</text>
        <line x1="385" y1="175" x2="330" y2="180" stroke="#15803d" stroke-width="1.5"/>
        
        <!-- Dialysis bag -->
        <rect x="190" y="150" width="120" height="110" rx="20" fill="#bfdbfe" stroke="#1e40af" stroke-width="2.5" stroke-dasharray="4,2"/>
        <text x="250" y="200" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e3a8a">20% Sucrose Solution</text>
        <text x="250" y="215" text-anchor="middle" font-size="9" fill="#1e3a8a">(Semi-permeable Membrane)</text>
        
        <!-- Capillary Tube -->
        <rect x="245" y="40" width="10" height="115" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
        <rect x="246" y="70" width="8" height="85" fill="#3b82f6"/>
        <text x="265" y="75" font-size="10" font-weight="bold" fill="#2563eb">Liquid Meniscus (+h)</text>
        <line x1="260" y1="72" x2="246" y2="72" stroke="#2563eb" stroke-width="1.5"/>
        
        <!-- Rubber Bung -->
        <polygon points="230,150 270,150 265,135 235,135" fill="#475569"/>
        
        <!-- Water molecule arrows -->
        <path d="M 160,200 L 182,200" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>
        <path d="M 340,200 L 318,200" stroke="#2563eb" stroke-width="2"/>
        <text x="250" y="305" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">Net osmotic influx of water molecules across concentration gradient</text>
      </svg>
    `)}`,
  },
  {
    id: 'titration-apparatus',
    title: 'Acid-Base Titration Setup (Burette & Flask)',
    subject: 'Chemistry',
    alt: 'Titration setup showing burette clamped to retort stand above conical flask with white tile',
    caption: 'Figure 3: Standard quantitative acid-base volumetric titration apparatus setup with burette, stopcock, and conical flask over white tile.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320" width="100%" height="100%" style="background:#ffffff; font-family:sans-serif;">
        <rect width="500" height="320" fill="#ffffff" rx="8"/>
        <text x="250" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">Acid-Base Titration Apparatus</text>
        
        <!-- Retort stand base and rod -->
        <rect x="80" y="270" width="140" height="15" fill="#334155" rx="2"/>
        <line x1="120" y1="40" x2="120" y2="270" stroke="#475569" stroke-width="6"/>
        <line x1="120" y1="120" x2="220" y2="120" stroke="#64748b" stroke-width="4"/>
        
        <!-- Burette -->
        <rect x="215" y="40" width="14" height="170" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
        <line x1="215" y1="80" x2="222" y2="80" stroke="#64748b" stroke-width="1"/>
        <line x1="215" y1="100" x2="222" y2="100" stroke="#64748b" stroke-width="1"/>
        <line x1="215" y1="120" x2="222" y2="120" stroke="#64748b" stroke-width="1"/>
        <line x1="215" y1="140" x2="222" y2="140" stroke="#64748b" stroke-width="1"/>
        <!-- Solution in burette -->
        <rect x="216" y="70" width="12" height="130" fill="#dbeafe"/>
        <!-- Stopcock -->
        <rect x="212" y="200" width="20" height="8" fill="#1e293b" rx="2"/>
        <polygon points="220,208 224,208 223,222 221,222" fill="#334155"/>
        
        <text x="245" y="80" font-size="11" font-weight="bold" fill="#1e40af">Burette (0.10 mol/dm3 NaOH)</text>
        
        <!-- Conical Flask -->
        <polygon points="215,230 229,230 255,270 189,270" fill="#fdf2f8" stroke="#334155" stroke-width="2"/>
        <text x="270" y="255" font-size="11" font-weight="bold" fill="#9d174d">25.0 cm3 HCl + Indicator</text>
        
        <!-- White Tile -->
        <rect x="170" y="270" width="105" height="6" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1"/>
        <text x="290" y="280" font-size="10" fill="#64748b">White Ceramic Tile</text>
      </svg>
    `)}`,
  },
  {
    id: 'dynamics-trolley',
    title: 'Dynamics Runway with Light Gates (Newton\'s 2nd Law)',
    subject: 'Physics',
    alt: 'Dynamics cart on inclined friction-compensated track passing through photogates',
    caption: 'Figure 4: Experimental dynamics track with dual photogates, interrupted card, and hanging mass pulley to test F = ma.',
    dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 300" width="100%" height="100%" style="background:#ffffff; font-family:sans-serif;">
        <rect width="540" height="300" fill="#ffffff" rx="8"/>
        <text x="270" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">Dynamics Runway & Photogate System (F = ma)</text>
        
        <!-- Inclined Runway -->
        <polygon points="40,160 440,160 440,170 40,170" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
        
        <!-- Trolley -->
        <rect x="90" y="130" width="70" height="25" fill="#3b82f6" rx="3" stroke="#1d4ed8" stroke-width="2"/>
        <circle cx="105" cy="158" r="6" fill="#1e293b"/>
        <circle cx="145" cy="158" r="6" fill="#1e293b"/>
        
        <!-- Interrupter Card on trolley -->
        <rect x="115" y="110" width="20" height="20" fill="#0f172a"/>
        <text x="125" y="105" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">Card (d = 0.05m)</text>
        
        <!-- Photogate 1 -->
        <rect x="190" y="95" width="10" height="65" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
        <text x="195" y="85" text-anchor="middle" font-size="9" font-weight="bold" fill="#2563eb">Photogate A (t1)</text>
        
        <!-- Photogate 2 -->
        <rect x="330" y="95" width="10" height="65" fill="#e2e8f0" stroke="#0f172a" stroke-width="1.5"/>
        <text x="335" y="85" text-anchor="middle" font-size="9" font-weight="bold" fill="#2563eb">Photogate B (t2)</text>
        
        <!-- Pulley -->
        <circle cx="440" cy="160" r="10" fill="#64748b" stroke="#334155" stroke-width="2"/>
        <!-- String -->
        <line x1="160" y1="140" x2="440" y2="150" stroke="#0f172a" stroke-width="1.5"/>
        <line x1="450" y1="160" x2="450" y2="230" stroke="#0f172a" stroke-width="1.5"/>
        
        <!-- Hanging Mass -->
        <rect x="442" y="230" width="16" height="24" fill="#dc2626" rx="2"/>
        <text x="470" y="245" font-size="10" font-weight="bold" fill="#dc2626">Hanging Mass (m = 0.20 kg)</text>
        
        <text x="270" y="285" text-anchor="middle" font-size="11" font-weight="600" fill="#334155">Datalogger calculates initial velocity u, final velocity v, and acceleration a</text>
      </svg>
    `)}`,
  },
];

interface QuestionImageEditorProps {
  initialUrl?: string;
  initialCaption?: string;
  initialAlt?: string;
  onSave: (imageData: { imageUrl?: string; imageCaption?: string; imageAlt?: string }) => void;
  onCancel: () => void;
}

export const QuestionImageEditor: React.FC<QuestionImageEditorProps> = ({
  initialUrl = '',
  initialCaption = '',
  initialAlt = '',
  onSave,
  onCancel,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'url' | 'presets'>('presets');
  const [imageUrl, setImageUrl] = useState<string>(initialUrl);
  const [imageCaption, setImageCaption] = useState<string>(initialCaption);
  const [imageAlt, setImageAlt] = useState<string>(initialAlt);
  const [uploadError, setUploadError] = useState<string>('');

  // Handle local file selection and convert to Base64 data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageUrl(result);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof SCIENCE_DIAGRAM_PRESETS[0]) => {
    setImageUrl(preset.dataUri);
    setImageCaption(preset.caption);
    setImageAlt(preset.alt);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageCaption('');
    setImageAlt('');
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Insert Question Image / Diagram</h3>
              <p className="text-xs text-slate-400">
                Attach apparatus diagrams, biological graphs, or lab setups to this question
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Source Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs font-bold">
            <button
              onClick={() => setActiveMode('presets')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeMode === 'presets'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Science Presets Library
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeMode === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Local File
            </button>
            <button
              onClick={() => setActiveMode('url')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeMode === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              Paste Image URL
            </button>
          </div>

          {/* Mode 1: Presets */}
          {activeMode === 'presets' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Click any authentic scientific diagram to instantly embed it with standard caption and labels:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SCIENCE_DIAGRAM_PRESETS.map((preset) => {
                  const isSelected = imageUrl === preset.dataUri;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">{preset.title}</span>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-blue-400 font-semibold">
                            {preset.subject}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{preset.caption}</p>
                      </div>

                      <div className="h-24 w-full bg-white rounded-lg p-1 overflow-hidden flex items-center justify-center border border-slate-700">
                        <img src={preset.dataUri} alt={preset.alt} className="max-h-full max-w-full object-contain" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Upload File */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-slate-950/40">
                <input
                  type="file"
                  id="image-file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="image-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 text-xs"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-slate-200 text-sm">
                    Click to browse or drop an image file
                  </span>
                  <span className="text-slate-400 text-xs">
                    PNG, JPG, SVG, WebP up to 5MB (stored securely in assessment document)
                  </span>
                </label>
              </div>

              {uploadError && (
                <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-lg">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Image URL */}
          {activeMode === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Image Web URL</label>
              <input
                type="url"
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={(e) => setImageUrl(e.target.value.trim())}
                placeholder="https://example.com/diagrams/photosynthesis.png"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Paste any direct image link from your school's LMS, Wikimedia Commons, or public image source.
              </p>
            </div>
          )}

          {/* Image Preview & Metadata */}
          {imageUrl && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Attached Image Preview
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/40 px-2 py-1 rounded border border-rose-800/30"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Image
                </button>
              </div>

              <div className="max-h-48 w-full bg-white rounded-lg p-2 flex items-center justify-center overflow-hidden border border-slate-700">
                <img src={imageUrl} alt={imageAlt || 'Preview'} className="max-h-44 max-w-full object-contain" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Figure Caption (shown below image)
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="e.g. Figure 1: Hormonal changes during 28-day cycle"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Alt Text (Accessibility & Screen Readers)
                  </label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="e.g. Graph of LH, FSH, estrogen and progesterone curves"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-700 text-xs font-semibold rounded-lg text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                imageUrl: imageUrl || undefined,
                imageCaption: imageCaption || undefined,
                imageAlt: imageAlt || undefined,
              });
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md"
          >
            Save & Attach Diagram
          </button>
        </div>
      </div>
    </div>
  );
};
