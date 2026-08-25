import React, { useState } from 'react';
import {
  CurriculumType,
  YearGroup,
  Subject,
  FormativeType,
  FormativeBlueprint,
  MYPCriterion,
  ALL_SUBJECTS,
  ACADEMIC_YEARS,
  DEFAULT_ACADEMIC_YEAR,
} from '../types';
import { CURRICULA, MYP_CRITERIA_INFO } from '../data/curricula';
import { SCIENCE_SYLLABUS_PRESETS, findSyllabusPreset, SyllabusTopicPreset } from '../data/scienceSyllabus';
import {
  Sparkles,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Target,
  FileSpreadsheet,
  Plus,
  Trash2,
  Lightbulb,
} from 'lucide-react';

interface FormativeBuilderProps {
  initialBlueprint?: FormativeBlueprint;
  defaultTeacherName?: string;
  onBlueprintReady: (blueprint: FormativeBlueprint) => void;
  onCancel: () => void;
}

export const FormativeBuilder: React.FC<FormativeBuilderProps> = ({
  initialBlueprint,
  defaultTeacherName = 'Dr. Sarah Jenkins',
  onBlueprintReady,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form states
  const [curriculum, setCurriculum] = useState<CurriculumType>(initialBlueprint?.curriculum || 'IBMYP');
  const [academicYear, setAcademicYear] = useState<string>(initialBlueprint?.academicYear || DEFAULT_ACADEMIC_YEAR);
  const [yearGroup, setYearGroup] = useState<YearGroup>(initialBlueprint?.yearGroup || 'MYP 5');
  const [subject, setSubject] = useState<Subject>(initialBlueprint?.subject || 'Biology');
  
  // Info
  const [formativeNumber, setFormativeNumber] = useState<string>(initialBlueprint?.formativeNumber || 'Formative 01');
  const [title, setTitle] = useState<string>(initialBlueprint?.title || '');
  const [formativeType, setFormativeType] = useState<FormativeType>(initialBlueprint?.formativeType || 'Criterion-Focused Task');
  const [classSection, setClassSection] = useState<string>(initialBlueprint?.classSection || 'Grade 9A');
  const [teacherName, setTeacherName] = useState<string>(initialBlueprint?.teacherName || defaultTeacherName);
  const [assessmentDate, setAssessmentDate] = useState<string>(
    initialBlueprint?.assessmentDate || new Date().toISOString().split('T')[0]
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(initialBlueprint?.timeLimitMinutes || 45);
  const [instructions, setInstructions] = useState<string>(
    initialBlueprint?.instructions ||
      'Answer all questions within the allocated time. Show full workings and correct scientific units for all calculations.'
  );

  // Topic, Subtopics, Learning Objectives - FREE FORM INPUT (No dummy topics!)
  const [topic, setTopic] = useState<string>(initialBlueprint?.topic || '');
  const [subtopics, setSubtopics] = useState<string[]>(
    initialBlueprint?.subtopics || []
  );
  const [subtopicInput, setSubtopicInput] = useState<string>('');
  
  const [learningObjectives, setLearningObjectives] = useState<string[]>(
    initialBlueprint?.learningObjectives || []
  );
  const [customLOInput, setCustomLOInput] = useState<string>('');

  // IBMYP specific
  const [selectedCriterion, setSelectedCriterion] = useState<MYPCriterion>(
    initialBlueprint?.selectedCriterion || 'Criterion A'
  );
  const [selectedStrands, setSelectedStrands] = useState<string[]>(
    initialBlueprint?.selectedStrands || ['A(i)', 'A(ii)', 'A(iii)']
  );
  const [maxMarks, setMaxMarks] = useState<number>(initialBlueprint?.maxMarks || 20);
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(
    initialBlueprint?.targetQuestionCount || 5
  );

  // IGCSE specific
  const [igcseMcqCount, setIgcseMcqCount] = useState<number>(15);
  const [igcseStructuredCount, setIgcseStructuredCount] = useState<number>(5);
  const [igcseDataCount, setIgcseDataCount] = useState<number>(5);

  // Academic Integrity
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(false);
  const [randomizeOptions, setRandomizeOptions] = useState<boolean>(true);
  const [oneAttemptOnly, setOneAttemptOnly] = useState<boolean>(true);

  // MYP Mode check
  const isMYP1to3 = yearGroup === 'MYP 1' || yearGroup === 'MYP 2' || yearGroup === 'MYP 3';

  // Toggle strand
  const toggleStrand = (strandId: string) => {
    if (selectedStrands.includes(strandId)) {
      setSelectedStrands(selectedStrands.filter((s) => s !== strandId));
    } else {
      setSelectedStrands([...selectedStrands, strandId]);
    }
  };

  const handleAddSubtopic = () => {
    const trimmed = subtopicInput.trim();
    if (trimmed && !subtopics.includes(trimmed)) {
      setSubtopics([...subtopics, trimmed]);
      setSubtopicInput('');
    }
  };

  const handleAddLO = () => {
    const trimmed = customLOInput.trim();
    if (trimmed && !learningObjectives.includes(trimmed)) {
      setLearningObjectives([...learningObjectives, trimmed]);
      setCustomLOInput('');
    }
  };

  // Construct final blueprint object
  const buildBlueprint = (): FormativeBlueprint => {
    const generatedTitle = title.trim() || `${formativeNumber} — ${topic.trim() || subject}`;
    const matchedPreset = findSyllabusPreset(subject, topic.trim());

    let resolvedSubtopics = subtopics;
    if (resolvedSubtopics.length === 0) {
      if (matchedPreset && matchedPreset.subtopics.length > 0) {
        resolvedSubtopics = matchedPreset.subtopics;
      } else {
        resolvedSubtopics = [topic.trim()];
      }
    }

    // Resolve intelligent learning objectives strictly aligned to teacher's subtopics & topic
    let resolvedLOs = learningObjectives;
    if (resolvedLOs.length === 0) {
      if (subtopics.length > 0) {
        // Teacher specified custom subtopics (e.g. "Root hair cells and RBC only")
        resolvedLOs = subtopics.map(
          (st) => `Demonstrate scientific understanding of ${st} in relation to ${topic.trim()}`
        );
      } else if (matchedPreset && matchedPreset.learningObjectives.length > 0) {
        resolvedLOs = matchedPreset.learningObjectives;
      } else {
        resolvedLOs = [
          `Explain the scientific mechanisms, structures, and key principles governing ${topic.trim() || subject}`,
          `Analyze structure-function relationships and scientific data for ${topic.trim() || subject}`,
        ];
      }
    }

    return {
      curriculum,
      academicYear,
      yearGroup,
      subject,
      formativeNumber,
      title: generatedTitle,
      formativeType,
      classSection,
      teacherName,
      assessmentDate,
      timeLimitMinutes,
      instructions,
      topic: topic.trim(),
      subtopics: resolvedSubtopics,
      learningObjectives: resolvedLOs,
      selectedCriterion: curriculum === 'IBMYP' ? selectedCriterion : undefined,
      selectedStrands: curriculum === 'IBMYP' ? selectedStrands : undefined,
      mypAssessmentMode: isMYP1to3 ? 'achievement_levels' : 'marks_points',
      maxMarks: isMYP1to3 ? 8 : maxMarks,
      targetQuestionCount:
        curriculum === 'IGCSE'
          ? igcseMcqCount + igcseStructuredCount + igcseDataCount
          : targetQuestionCount,
      igcseStructure:
        curriculum === 'IGCSE'
          ? {
              mcqCount: igcseMcqCount,
              structuredCount: igcseStructuredCount,
              dataBasedCount: igcseDataCount,
            }
          : undefined,
      academicIntegrity: {
        randomizeQuestions,
        randomizeOptions,
        oneAttemptOnly,
        mode: 'closed_book',
      },
    };
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Wizard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Create Formative Assessment
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Configure curriculum-aligned assessment parameters, type custom topic & learning objectives, and publish to students.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md font-medium"
          >
            Cancel
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {[
            { num: 1, label: 'Curriculum & Subject' },
            { num: 2, label: 'Assessment Details' },
            { num: 3, label: 'Custom Topic & Objectives' },
            { num: 4, label: 'Criteria & Generation' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-3 rounded-lg border text-left transition-all ${
                step === s.num
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : step > s.num
                  ? 'border-emerald-300 bg-emerald-50/40 text-emerald-800'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s.num
                      ? 'bg-blue-600 text-white'
                      : step > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-600'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="text-xs font-semibold text-slate-800">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Curriculum, Academic Year, Subject */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Step 1: Curriculum & Subject Context</h2>

          {/* Curriculum selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Curriculum Family
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.keys(CURRICULA) as CurriculumType[]).map((currKey) => {
                const curr = CURRICULA[currKey];
                const isSelected = curriculum === currKey;
                return (
                  <div
                    key={currKey}
                    onClick={() => {
                      setCurriculum(currKey);
                      setYearGroup(curr.yearGroups[0]);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{currKey}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{curr.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Year, Year Group & Subject Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Year Group / Class
              </label>
              <select
                value={yearGroup}
                onChange={(e) => setYearGroup(e.target.value as YearGroup)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CURRICULA[curriculum].yearGroups.map((yg) => (
                  <option key={yg} value={yg}>
                    {yg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Subject (Select from list)
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/40 border-blue-200"
              >
                {ALL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2"
            >
              Continue to Assessment Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Assessment Details */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Step 2: Formative Assessment Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Formative Number / Code
              </label>
              <input
                type="text"
                value={formativeNumber}
                onChange={(e) => setFormativeNumber(e.target.value)}
                placeholder="e.g. Formative 01"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Formative Type
              </label>
              <select
                value={formativeType}
                onChange={(e) => setFormativeType(e.target.value as FormativeType)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Criterion-Focused Task">Criterion-Focused Task</option>
                <option value="Checkpoint Formative">Checkpoint Formative</option>
                <option value="Diagnostic Assessment">Diagnostic Assessment</option>
                <option value="End-of-Topic Formative">End-of-Topic Formative</option>
                <option value="Practical / Data Analysis">Practical / Data Analysis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Teacher Name (Assigned By)
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1">Students will select this teacher name to find this task.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Target Class / Section
              </label>
              <input
                type="text"
                value={classSection}
                onChange={(e) => setClassSection(e.target.value)}
                placeholder="e.g. Grade 9A or 10-Bio"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Assessment Title (Optional - auto-generated if left blank)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Formative 01 — Cell Transport & Diffusion"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assessment Date
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                min={5}
                max={180}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Student Instructions
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => setStep(1)}
              className="border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2"
            >
              Next: Topic & Objectives
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Type Custom Topic & Objectives (NO DUMMY TOPIC DROPDOWN) */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Step 3: Define Custom Topic & Learning Objectives
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Type in your authentic teaching topic, subtopics, and learning objectives. The AI will strictly respect your custom boundaries.
            </p>
          </div>

          {/* Syllabus Presets Quick-Select */}
          {(() => {
            const subjectPresets = SCIENCE_SYLLABUS_PRESETS.filter(
              (p) => p.subject.toLowerCase() === subject.toLowerCase()
            );
            if (subjectPresets.length === 0) return null;
            return (
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Quick Syllabus Presets for {subject}
                </div>
                <p className="text-xs text-slate-600">
                  Click any standard syllabus topic to automatically load authentic curriculum subtopics and learning objectives:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {subjectPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setTopic(preset.topic);
                        setSubtopics(preset.subtopics);
                        setLearningObjectives(preset.learningObjectives);
                        if (curriculum === 'IBMYP' && preset.suggestedCriterion) {
                          setSelectedCriterion(preset.suggestedCriterion);
                          setSelectedStrands(MYP_CRITERIA_INFO[preset.suggestedCriterion].strands.map((s) => s.id));
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all text-left ${
                        topic === preset.topic
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {preset.topic}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Free-text Topic input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Main Topic (Type topic name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Reproduction and the Menstrual Cycle, Membrane Transport & Osmosis, Newton's Laws..."
              className="w-full border-2 border-blue-300 rounded-lg p-3 text-base font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-blue-50/20"
            />
            <p className="text-xs text-slate-500 mt-1">
              Type or select the exact topic you are teaching for {subject}.
            </p>
          </div>

          {/* Subtopics Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Subtopics / Key Concepts
            </label>
            
            {subtopics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {subtopics.map((st, idx) => (
                  <span
                    key={idx}
                    className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                  >
                    {st}
                    <button
                      type="button"
                      onClick={() => setSubtopics(subtopics.filter((_, i) => i !== idx))}
                      className="hover:text-rose-600 text-blue-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a subtopic (e.g. Light dependent reactions, Calvin cycle) and press Add"
                value={subtopicInput}
                onChange={(e) => setSubtopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtopic();
                  }
                }}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtopic}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subtopic
              </button>
            </div>
          </div>

          {/* Explicit Learning Objectives */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Explicit Learning Objectives (Optional - guides exact question generation)
            </label>

            {learningObjectives.length > 0 && (
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {learningObjectives.map((lo, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 flex items-start justify-between gap-2"
                  >
                    <span>
                      <strong className="text-blue-700">LO {idx + 1}:</strong> {lo}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLearningObjectives(learningObjectives.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a learning objective (e.g. Explain how light intensity affects rate of photosynthesis)"
                value={customLOInput}
                onChange={(e) => setCustomLOInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLO();
                  }
                }}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddLO}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Objective
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => setStep(2)}
              className="border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              disabled={!topic.trim()}
              onClick={() => setStep(4)}
              className={`text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 ${
                !topic.trim()
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Criteria & Final Blueprint
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Criteria, Strands & Assessment Blueprint Review */}
      {step === 4 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Step 4: Assessment Structure & Blueprint Review
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Confirm framework criteria, marks, question count, and generate your formative assessment.
            </p>
          </div>

          {/* IBMYP Criterion Configuration */}
          {curriculum === 'IBMYP' && (
            <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-900">IBMYP Sciences Criterion & Strands</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Criterion A', 'Criterion B', 'Criterion C', 'Criterion D'] as MYPCriterion[]).map((crit) => {
                  const isSelected = selectedCriterion === crit;
                  return (
                    <button
                      key={crit}
                      type="button"
                      onClick={() => {
                        setSelectedCriterion(crit);
                        setSelectedStrands(MYP_CRITERIA_INFO[crit].strands.map((s) => s.id));
                      }}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>{crit}</div>
                      <div className="text-[10px] font-normal opacity-90 truncate">
                        {MYP_CRITERIA_INFO[crit].title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Strands */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Selected Strands ({selectedCriterion})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MYP_CRITERIA_INFO[selectedCriterion].strands.map((strand) => {
                    const isChecked = selectedStrands.includes(strand.id);
                    return (
                      <div
                        key={strand.id}
                        onClick={() => toggleStrand(strand.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2 ${
                          isChecked ? 'border-blue-500 bg-blue-50 text-slate-900' : 'border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <input type="checkbox" checked={isChecked} onChange={() => {}} className="mt-0.5" />
                        <div>
                          <strong className="text-slate-900">{strand.id}:</strong> {strand.title}
                          <p className="text-[11px] text-slate-500 mt-1">{strand.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MYP Mode & Marks/Questions config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                {isMYP1to3 ? (
                  <div className="col-span-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-950">
                    <strong>MYP 1–3 Achievement Level Engine:</strong> Assessed against 0–8 achievement descriptors.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Maximum Marks ({yearGroup})
                      </label>
                      <input
                        type="number"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(Number(e.target.value))}
                        min={5}
                        max={50}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Target Question Count
                      </label>
                      <input
                        type="number"
                        value={targetQuestionCount}
                        onChange={(e) => setTargetQuestionCount(Number(e.target.value))}
                        min={3}
                        max={15}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* IGCSE 3-Section Formative Structure */}
          {curriculum === 'IGCSE' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Standard IGCSE 3-Section Structure</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-xl font-bold text-blue-600">15 MCQs</div>
                  <div className="text-xs text-slate-600 mt-1">Section A</div>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-xl font-bold text-indigo-600">5 Structured</div>
                  <div className="text-xs text-slate-600 mt-1">Section B</div>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <div className="text-xl font-bold text-emerald-600">5 Data-Based</div>
                  <div className="text-xs text-slate-600 mt-1">Section C</div>
                </div>
              </div>
            </div>
          )}

          {/* Blueprint Summary Card */}
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Formative Blueprint Summary
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {academicYear}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700">
              <div>
                <span className="text-slate-500">Curriculum:</span> <strong>{curriculum} ({yearGroup})</strong>
              </div>
              <div>
                <span className="text-slate-500">Subject:</span> <strong>{subject}</strong>
              </div>
              <div>
                <span className="text-slate-500">Teacher:</span> <strong>{teacherName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Class:</span> <strong>{classSection}</strong>
              </div>
            </div>

            <div className="text-xs text-slate-800 pt-2 border-t border-blue-200">
              <strong>Topic:</strong> <span className="font-semibold text-blue-950">{topic}</span>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              onClick={() => setStep(3)}
              className="border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => onBlueprintReady(buildBlueprint())}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Generate & Prepare Formative
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
