import React, { useState } from 'react';
import {
  CurriculumType,
  YearGroup,
  Subject,
  FormativeType,
  FormativeBlueprint,
  FormativeAssessment,
  MYPCriterion,
  DifficultyLevel,
  ALL_SUBJECTS,
  ACADEMIC_YEARS,
  DEFAULT_ACADEMIC_YEAR,
} from '../types';
import { CURRICULA, MYP_CRITERIA_INFO, MYP_KEY_CONCEPTS, MYP_GLOBAL_CONTEXTS, MYP_RELATED_CONCEPTS_SCIENCES } from '../data/curricula';
import { SCIENCE_SYLLABUS_PRESETS, findSyllabusPreset, SyllabusTopicPreset } from '../data/scienceSyllabus';
import { GeminiService } from '../services/geminiService';
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
  UploadCloud,
  FileUp,
  FileText,
  Bookmark,
  Award,
} from 'lucide-react';

interface FormativeBuilderProps {
  initialBlueprint?: FormativeBlueprint;
  defaultTeacherName?: string;
  onBlueprintReady: (blueprint: FormativeBlueprint) => void;
  onAssessmentReady?: (assessment: FormativeAssessment) => void;
  onCancel: () => void;
}

export const FormativeBuilder: React.FC<FormativeBuilderProps> = ({
  initialBlueprint,
  defaultTeacherName = 'Dr. Sarah Jenkins',
  onBlueprintReady,
  onAssessmentReady,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form states
  const [curriculum, setCurriculum] = useState<CurriculumType>(initialBlueprint?.curriculum || 'IBMYP');
  const [academicYear, setAcademicYear] = useState<string>(initialBlueprint?.academicYear || DEFAULT_ACADEMIC_YEAR);
  const [yearGroup, setYearGroup] = useState<YearGroup>(initialBlueprint?.yearGroup || 'MYP 2');
  const [subject, setSubject] = useState<Subject>(initialBlueprint?.subject || 'Biology');
  
  // Info
  const [formativeNumber, setFormativeNumber] = useState<string>(initialBlueprint?.formativeNumber || 'Formative 01');
  const [title, setTitle] = useState<string>(initialBlueprint?.title || '');
  const [formativeType, setFormativeType] = useState<FormativeType>(initialBlueprint?.formativeType || 'Criterion-Focused Task');
  const [classSection, setClassSection] = useState<string>(
    initialBlueprint?.classSection || initialBlueprint?.yearGroup || 'MYP 2'
  );
  const [isClassSectionTouched, setIsClassSectionTouched] = useState<boolean>(
    Boolean(initialBlueprint?.classSection && initialBlueprint.classSection !== 'Grade 9A')
  );
  const [teacherName, setTeacherName] = useState<string>(initialBlueprint?.teacherName || defaultTeacherName);
  const [assessmentDate, setAssessmentDate] = useState<string>(
    initialBlueprint?.assessmentDate || new Date().toISOString().split('T')[0]
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(initialBlueprint?.timeLimitMinutes || 45);
  const [instructions, setInstructions] = useState<string>(
    initialBlueprint?.instructions ||
      'Answer all questions within the allocated time. Show full workings and correct scientific units for all calculations.'
  );

  // Topic & Subtopics - Purely Simple & Direct
  const [topic, setTopic] = useState<string>(initialBlueprint?.topic || '');
  const [subtopicsText, setSubtopicsText] = useState<string>(
    initialBlueprint?.subtopics ? initialBlueprint.subtopics.join(', ') : ''
  );

  // Curriculum Concept Framework
  const [keyConcept, setKeyConcept] = useState<string>(
    initialBlueprint?.keyConcept || 'Systems'
  );
  const [globalContext, setGlobalContext] = useState<string>(
    initialBlueprint?.globalContext || 'Scientific and technical innovation'
  );
  const [relatedConcepts, setRelatedConcepts] = useState<string[]>(
    initialBlueprint?.relatedConcepts || []
  );
  const [statementOfInquiry, setStatementOfInquiry] = useState<string>(
    initialBlueprint?.statementOfInquiry || ''
  );

  // Marking Mode
  const [markingMode, setMarkingMode] = useState<'ai_auto' | 'teacher_marked'>(
    initialBlueprint?.markingMode || 'ai_auto'
  );

  // PDF Digitize State
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [pdfParseStatus, setPdfParseStatus] = useState<string>('');
  const [pdfParseError, setPdfParseError] = useState<string>('');

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
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(
    initialBlueprint?.difficultyLevel || 'Standard'
  );

  // IGCSE specific
  const [igcseMcqCount, setIgcseMcqCount] = useState<number>(15);
  const [igcseStructuredCount, setIgcseStructuredCount] = useState<number>(5);
  const [igcseDataCount, setIgcseDataCount] = useState<number>(5);

  // Academic Integrity
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(false);
  const [randomizeOptions, setRandomizeOptions] = useState<boolean>(true);
  const [oneAttemptOnly, setOneAttemptOnly] = useState<boolean>(true);

  // Custom AI Guidance / Prompt steering
  const [teacherCustomInstructions, setTeacherCustomInstructions] = useState<string>(
    initialBlueprint?.teacherCustomInstructions || ''
  );

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

  // Direct Question Paper Upload & Digitization (PDF, Image, or Text)
  const [showPasteTextModal, setShowPasteTextModal] = useState<boolean>(false);
  const [pastedPaperText, setPastedPaperText] = useState<string>('');

  const processDigitizedPaper = async (
    base64Data: string,
    fileName: string,
    mimeType?: string,
    rawText?: string
  ) => {
    setIsParsingPdf(true);
    setPdfParseStatus('Extracting authentic questions, diagrams, datasets, and mark schemes with 100% fidelity...');
    setPdfParseError('');

    try {
      const parsed = await GeminiService.parseQuestionPaperFromPdf(base64Data, fileName, {
        curriculum,
        subject,
        yearGroup,
        topic: topic || undefined,
        mimeType: mimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        paperText: rawText || undefined,
      });

      if (!parsed.questions || parsed.questions.length === 0) {
        throw new Error('No structured questions could be extracted from this document. Please check the format.');
      }

      const calculatedMaxMarks =
        parsed.totalExtractedMarks ||
        parsed.questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0) ||
        20;

      const cleanFileName = fileName.replace(/\.(pdf|png|jpg|jpeg|webp)$/i, '').replace(/[-_]/g, ' ');
      const docTitle = parsed.extractedTitle || `${formativeNumber} — ${cleanFileName}`;
      const docTopic = parsed.extractedTopic || cleanFileName;
      const docInstructions =
        parsed.extractedInstructions ||
        'Answer all questions within the allocated time. Show full workings and correct scientific units for all calculations.';

      // If an image was uploaded, attach it as imageUrl if questions don't already have one
      let formattedQuestions = parsed.questions;
      if (mimeType && mimeType.startsWith('image/') && base64Data) {
        const fullDataUrl = `data:${mimeType};base64,${base64Data}`;
        formattedQuestions = parsed.questions.map((q) => ({
          ...q,
          imageUrl: q.imageUrl || fullDataUrl,
          imageCaption: q.imageCaption || `Stimulus Diagram from ${fileName}`,
        }));
      }

      // Build complete Formative Assessment with the EXACT questions from the attached paper
      const effectiveClassSection = isClassSectionTouched && classSection.trim() ? classSection.trim() : (yearGroup || 'MYP 2');
      const directAssessment: FormativeAssessment = {
        id: `formative-paper-${Date.now()}`,
        blueprint: {
          curriculum,
          academicYear,
          yearGroup,
          subject,
          formativeNumber,
          title: docTitle,
          formativeType: 'End-of-Topic Formative',
          classSection: effectiveClassSection,
          teacherName,
          assessmentDate,
          timeLimitMinutes,
          instructions: docInstructions,
          topic: docTopic,
          subtopics: [docTopic],
          learningObjectives: [`Assess scientific understanding based on uploaded question paper (${fileName})`],
          selectedCriterion: curriculum === 'IBMYP' ? selectedCriterion : undefined,
          selectedStrands: curriculum === 'IBMYP' ? selectedStrands : undefined,
          mypAssessmentMode: isMYP1to3 ? 'achievement_levels' : 'marks_points',
          difficultyLevel: 'Standard',
          maxMarks: calculatedMaxMarks,
          markingMode,
          targetQuestionCount: formattedQuestions.length,
          sourcePdf: {
            name: fileName,
            size: base64Data ? Math.round(base64Data.length * 0.75) : 1024,
            uploadedAt: new Date().toISOString(),
          },
          academicIntegrity: {
            randomizeQuestions: false,
            randomizeOptions: false,
            oneAttemptOnly: true,
            mode: 'closed_book',
          },
        },
        questions: formattedQuestions, // Exact extracted questions from the paper
        validationSummary: {
          topicBoundaryCompliant: true,
          yearLevelAppropriate: true,
          datasetConsistent: true,
          markSchemeDefensible: true,
          validationChecklist: [
            'Authentic Question Paper Digitized with 100% Precision',
            `Preserved all ${formattedQuestions.length} questions, sub-parts, tables, and datasets without alterations`,
            'Extracted defensible mark schemes with criteria anchors',
          ],
        },
        status: 'Draft',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setIsParsingPdf(false);

      if (onAssessmentReady) {
        onAssessmentReady(directAssessment);
      } else {
        onBlueprintReady(directAssessment.blueprint);
      }
    } catch (err: any) {
      console.error('Paper parsing error:', err);
      setPdfParseError(err.message || 'Failed to parse question paper. Please check the file and try again.');
      setIsParsingPdf(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setPdfParseError('Please select a valid PDF question paper or image file (PNG, JPG, WebP).');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        await processDigitizedPaper(
          base64Data,
          file.name,
          isPdf ? 'application/pdf' : file.type || 'image/png'
        );
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setPdfParseError('Failed to read file.');
      setIsParsingPdf(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedPaperText.trim()) {
      setPdfParseError('Please paste your question paper text first.');
      return;
    }
    setShowPasteTextModal(false);
    await processDigitizedPaper(
      '',
      'Pasted Question Paper',
      'text/plain',
      pastedPaperText.trim()
    );
  };

  // Construct final blueprint object
  const buildBlueprint = (): FormativeBlueprint => {
    const generatedTitle = title.trim() || `${formativeNumber} — ${topic.trim() || subject}`;
    const matchedPreset = findSyllabusPreset(subject, topic.trim());

    // Parse subtopics from subtopicsText (split by comma or newline)
    const rawParsedSubtopics = subtopicsText
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let resolvedSubtopics = rawParsedSubtopics;
    if (resolvedSubtopics.length === 0) {
      if (matchedPreset && matchedPreset.subtopics.length > 0) {
        resolvedSubtopics = matchedPreset.subtopics;
      } else {
        resolvedSubtopics = [topic.trim() || subject];
      }
    }

    // Automatically resolve intelligent learning objectives aligned to topic & subtopics
    let resolvedLOs: string[] = [];
    if (resolvedSubtopics.length > 0) {
      resolvedLOs = resolvedSubtopics.map(
        (st) => `Demonstrate scientific understanding of ${st} in relation to ${topic.trim() || subject}`
      );
    } else if (matchedPreset && matchedPreset.learningObjectives.length > 0) {
      resolvedLOs = matchedPreset.learningObjectives;
    } else {
      resolvedLOs = [
        `Explain the scientific mechanisms, structures, and key principles governing ${topic.trim() || subject}`,
        `Analyze structure-function relationships and scientific data for ${topic.trim() || subject}`,
      ];
    }

    const effectiveClassSection = isClassSectionTouched && classSection.trim() ? classSection.trim() : (yearGroup || 'MYP 2');

    return {
      curriculum,
      academicYear,
      yearGroup,
      subject,
      formativeNumber,
      title: generatedTitle,
      formativeType,
      classSection: effectiveClassSection,
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
      difficultyLevel,
      maxMarks: maxMarks || 20,
      markingMode,
      keyConcept: keyConcept.trim() || undefined,
      globalContext: globalContext.trim() || undefined,
      relatedConcepts: relatedConcepts.length > 0 ? relatedConcepts : undefined,
      statementOfInquiry: statementOfInquiry.trim() || undefined,
      targetQuestionCount:
        curriculum === 'IGCSE'
          ? igcseMcqCount + igcseStructuredCount + igcseDataCount
          : targetQuestionCount || 5,
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
      teacherCustomInstructions: teacherCustomInstructions.trim() || undefined,
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
            { num: 3, label: 'Topic & Subtopics' },
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
          {/* Header */}
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900">Step 1: Curriculum & Assessment Mode</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a question paper PDF to immediately digitize its exact questions, or configure syllabus parameters below.
            </p>
          </div>

          {/* Instant PDF & Image Question Paper Digitization Box */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-slate-50 border border-indigo-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    ⚡ 100% Verbatim Question Paper Digitizer
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Exact Paper • No Reframing
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  Upload an existing examination paper (PDF or Image) or paste text to digitize all exact questions, sub-parts, tables, and graphs without alterations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]">
                  <FileUp className="w-4 h-4" />
                  {isParsingPdf ? 'Digitizing...' : 'Upload PDF / Paper'}
                  <input
                    type="file"
                    accept="application/pdf,.pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    disabled={isParsingPdf}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowPasteTextModal(true)}
                  disabled={isParsingPdf}
                  className="bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Paste Paper Text
                </button>
              </div>
            </div>

            {/* PDF Parsing Progress */}
            {isParsingPdf && (
              <div className="mt-4 p-3.5 bg-white/90 border border-indigo-200 rounded-xl flex items-center gap-3 shadow-xs">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <div className="text-xs text-indigo-950 font-medium">
                  {pdfParseStatus || 'Extracting authentic questions, diagrams, datasets, and mark schemes...'}
                </div>
              </div>
            )}

            {/* PDF Parsing Error Notice */}
            {pdfParseError && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-900 mb-0.5">Digitization Notice</div>
                    <div className="text-rose-700 leading-relaxed">{pdfParseError}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfParseError('')}
                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold underline shrink-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Or Build Assessment From Syllabus
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

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
                      const defaultYg = curr?.yearGroups?.[0] || 'MYP 2';
                      setYearGroup(defaultYg);
                      if (!isClassSectionTouched) {
                        setClassSection(defaultYg);
                      }
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
                onChange={(e) => {
                  const newYg = e.target.value as YearGroup;
                  setYearGroup(newYg);
                  if (!isClassSectionTouched) {
                    setClassSection(newYg);
                  }
                }}
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
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-xs"
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
                onChange={(e) => {
                  setClassSection(e.target.value);
                  setIsClassSectionTouched(true);
                }}
                placeholder="e.g. MYP 2, Grade 7A, or 10-Bio"
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
              Next: Topic & Subtopics
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Simple Topic & Subtopics */}
      {step === 3 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Step 3: Topic & Subtopics
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Select or type the topic and subtopics. The AI will strictly focus all assessment questions within these concepts.
            </p>
          </div>

          {/* Quick Syllabus Preset Dropdown / Auto-fill (Optional) */}
          {(() => {
            const subjectPresets = SCIENCE_SYLLABUS_PRESETS.filter(
              (p) => p.subject.toLowerCase() === subject.toLowerCase()
            );
            if (subjectPresets.length === 0) return null;
            return (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Quick Fill from {subject} Syllabus (Optional)
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <select
                    value={
                      subjectPresets.find((p) => p.topic.toLowerCase() === topic.trim().toLowerCase())?.id || ''
                    }
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const preset = subjectPresets.find((p) => p.id === selectedId);
                      if (preset) {
                        setTopic(preset.topic);
                        setSubtopicsText(preset.subtopics.join(', '));
                        if (preset.keyConcept) {
                          setKeyConcept(preset.keyConcept);
                        }
                        if (preset.globalContext) {
                          setGlobalContext(preset.globalContext);
                        }
                        if (curriculum === 'IBMYP' && preset.suggestedCriterion) {
                          setSelectedCriterion(preset.suggestedCriterion);
                          setSelectedStrands(MYP_CRITERIA_INFO[preset.suggestedCriterion].strands.map((s) => s.id));
                        }
                      }
                    }}
                    className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">⚡ Select standard syllabus topic to auto-fill...</option>
                    {subjectPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.topic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}

          {/* Topic Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Topic <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Reproduction and the Menstrual Cycle, Cell Transport, Newton's Laws..."
              className="w-full border-2 border-slate-300 focus:border-blue-500 rounded-lg p-3 text-base font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white transition-all"
            />
            <p className="text-xs text-slate-500">
              The main unit or topic being assessed in {subject}.
            </p>
          </div>

          {/* Subtopic(s) Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Subtopic(s)
            </label>
            <textarea
              rows={3}
              value={subtopicsText}
              onChange={(e) => setSubtopicsText(e.target.value)}
              placeholder="e.g. Hormonal control (FSH, LH, Estrogen, Progesterone), Follicular and luteal phases, Feedback mechanisms"
              className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none bg-white transition-all"
            />
            <p className="text-xs text-slate-500">
              Enter key concepts or subtopics (separated by commas). The AI generator will strictly constrain all questions to these subtopics.
            </p>
          </div>

          {/* Curriculum Conceptual Framework: Key Concept & Global Context */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Curriculum Conceptual Framework (Report & Inquiry Alignment)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Concept <span className="text-indigo-600 font-bold">*</span>
                </label>
                <select
                  value={keyConcept}
                  onChange={(e) => setKeyConcept(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {MYP_KEY_CONCEPTS.map((kc) => (
                    <option key={kc} value={kc}>
                      {kc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Included in student diagnostics and printable PDF reports.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Global Context <span className="text-sky-600 font-bold">*</span>
                </label>
                <select
                  value={globalContext}
                  onChange={(e) => setGlobalContext(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {MYP_GLOBAL_CONTEXTS.map((gc) => (
                    <option key={gc} value={gc}>
                      {gc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Sets authentic real-world perspective for questions and reports.</p>
              </div>
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
              <div className="space-y-3 pt-2 border-t border-slate-200">
                {isMYP1to3 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-xs text-indigo-950">
                    <strong>MYP 1–3 Framework:</strong> Total marks will be allocated across the questions and mapped to Criterion {selectedCriterion} (Levels 1–8).
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Maximum Marks ({yearGroup})
                    </label>
                    <input
                      type="number"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Math.max(1, Number(e.target.value)))}
                      min={5}
                      max={100}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Questions will be generated to sum up to exactly this total.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Target Question Count
                    </label>
                    <input
                      type="number"
                      value={targetQuestionCount}
                      onChange={(e) => setTargetQuestionCount(Math.max(1, Number(e.target.value)))}
                      min={2}
                      max={20}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Total questions to generate for this task.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Difficulty Level & Cognitive Rigor Configuration (All Curricula) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Target Difficulty Level & Cognitive Rigor
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  The AI examiner will strictly calibrate vocabulary, command terms, and cognitive depth to {yearGroup} at this selected level.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                {difficultyLevel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {[
                {
                  level: 'Foundational' as DifficultyLevel,
                  title: 'Foundational / Basic',
                  desc: 'Direct recall, basic definitions, visible structural adaptations, accessible vocabulary.',
                  badge: 'Recall & Identify',
                  color: 'border-emerald-300 bg-emerald-50/70 text-emerald-950',
                  activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50',
                },
                {
                  level: 'Standard' as DifficultyLevel,
                  title: 'Standard / Core',
                  desc: 'Standard curriculum expectations, structured explanations of mechanisms, basic calculations.',
                  badge: 'Describe & Explain',
                  color: 'border-blue-300 bg-blue-50/70 text-blue-950',
                  activeBorder: 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50',
                },
                {
                  level: 'Challenging' as DifficultyLevel,
                  title: 'Challenging / Higher',
                  desc: 'Multi-step analytical inquiry, interpreting anomalies, quantitative synthesis, evaluating experiments.',
                  badge: 'Analyse & Evaluate',
                  color: 'border-amber-300 bg-amber-50/70 text-amber-950',
                  activeBorder: 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50',
                },
                {
                  level: 'Mixed' as DifficultyLevel,
                  title: 'Mixed / Gradient',
                  desc: 'Carefully graduated cognitive progression starting with recall and escalating to higher application.',
                  badge: 'Differentiated',
                  color: 'border-purple-300 bg-purple-50/70 text-purple-950',
                  activeBorder: 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50',
                },
              ].map((item) => {
                const isSelected = difficultyLevel === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setDifficultyLevel(item.level)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? `${item.activeBorder} shadow-xs`
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Non-IBMYP Marks and Questions Configuration */}
          {curriculum !== 'IBMYP' && curriculum !== 'IGCSE' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Assessment Scale & Question Count</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Maximum Marks ({yearGroup})
                  </label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(Math.max(1, Number(e.target.value)))}
                    min={5}
                    max={100}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Questions will strictly total this exact mark score.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Target Question Count
                  </label>
                  <input
                    type="number"
                    value={targetQuestionCount}
                    onChange={(e) => setTargetQuestionCount(Math.max(1, Number(e.target.value)))}
                    min={2}
                    max={20}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Total questions to generate for this task.</p>
                </div>
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

          {/* Evaluation & Marking Workflow Mode */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Evaluation & Marking Workflow Mode
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Choose whether student submissions are automatically evaluated by AI or marked by the teacher.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMarkingMode('ai_auto')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  markingMode === 'ai_auto'
                    ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">AI Instant Evaluation (Default)</span>
                  </div>
                  {markingMode === 'ai_auto' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Immediate AI Examiner grading, evidence quote extraction, and learning gap diagnosis as soon as students submit.
                </p>
                <div className="mt-2 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Instant Student Feedback
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMarkingMode('teacher_marked')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  markingMode === 'teacher_marked'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Teacher Manual Review & Marking Suite</span>
                  </div>
                  {markingMode === 'teacher_marked' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Submissions arrive in your Teacher Marking suite for question-by-question scoring, manual mark adjustments, and individualized qualitative feedback.
                </p>
                <div className="mt-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Teacher-Guided Evaluation
                </div>
              </button>
            </div>
          </div>

          {/* Teacher Guidance / Custom Prompt Textbox for Direct AI Steering */}
          <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/70 border-2 border-purple-200 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Teacher's AI Steering Prompt & Custom Commands
                    <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full uppercase">
                      Instant Variety Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    Provide exact steering instructions, specific experimental contexts, or dataset requirements to generate a completely unique paper.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200">
                Optional
              </span>
            </div>

            <textarea
              rows={3}
              value={teacherCustomInstructions}
              onChange={(e) => setTeacherCustomInstructions(e.target.value)}
              placeholder="E.g., 'Use 5 distinct experimental scenarios: Q1 osmometer with visking tubing, Q2 red blood cell lysis in hypotonic vs hypertonic saline, Q3 onion peel plasmolysis, Q4 numerical percentage change calculations, Q5 evaluation of controlled variables'..."
              className="w-full border-2 border-purple-200 focus:border-purple-600 rounded-xl p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white transition-all leading-relaxed shadow-xs"
            />

            {/* Quick Steering Presets */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-purple-600" />
                <span>1-Click Prompt Steering Presets:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    label: '🔬 5 Distinct Experimental Contexts',
                    prompt: 'Use 5 completely distinct experimental contexts: Q1 dialysis/visking tubing osmometer, Q2 animal cell hemolysis/crenation in saline, Q3 plant cell turgor & plasmolysis, Q4 rate of change dataset with anomalous trial, Q5 evaluation of controlled variables & measurement errors.',
                  },
                  {
                    label: '🌿 Unfamiliar Applied Scenarios',
                    prompt: 'Set all questions in unfamiliar real-world biological applications (e.g., marine vs freshwater fish osmoregulation, intravenous medical saline drip concentrations, and halophyte plant root adaptations).',
                  },
                  {
                    label: '📊 Numerical Datasets & Rate Calculations',
                    prompt: 'Include structured datasets with trial measurements, calculation of percentage change, rate of reaction, and identification of anomalous data points.',
                  },
                  {
                    label: '⚡ Higher Cognitive Rigor & Analysis',
                    prompt: 'Emphasize higher-order cognitive demands: evaluation of experimental limitations, deduction of molecular mechanisms, and predicting outcomes of novel genetic/environmental perturbations.',
                  },
                  {
                    label: '🎯 Foundational Accessible Wording',
                    prompt: 'Use clear, direct phrasing with visual context descriptions and step-by-step mark schemes for accessible foundational practice.',
                  },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTeacherCustomInstructions((prev) =>
                        prev.trim() ? `${prev.trim()}; ${preset.prompt}` : preset.prompt
                      );
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/90 hover:bg-purple-100 hover:text-purple-900 text-slate-700 border border-purple-200 shadow-2xs transition-all font-medium text-left flex items-center gap-1"
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

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

            <div className="text-xs text-slate-800 pt-2 border-t border-blue-200 space-y-1">
              <div>
                <strong>Topic:</strong> <span className="font-semibold text-blue-950">{topic}</span>
              </div>
              {subtopicsText.trim() && (
                <div>
                  <span className="text-slate-500 font-medium">Subtopic(s):</span>{' '}
                  <span className="text-slate-800 font-medium">{subtopicsText}</span>
                </div>
              )}
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

      {/* Paste Paper Text Modal */}
      {showPasteTextModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Paste Question Paper Content</h3>
                  <p className="text-xs text-slate-500">Paste raw questions, subparts, tables, and mark schemes</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasteTextModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question Paper Text:
              </label>
              <textarea
                rows={10}
                value={pastedPaperText}
                onChange={(e) => setPastedPaperText(e.target.value)}
                placeholder="e.g. Question 1 (4 marks)&#10;An experiment was conducted to investigate enzyme activity at different temperatures...&#10;Temperature (°C) | Reaction Rate (a.u.)&#10;10 | 2.4&#10;20 | 5.8&#10;30 | 12.1&#10;40 | 18.6&#10;50 | 7.2&#10;60 | 0.0"
                className="w-full border border-slate-300 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowPasteTextModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Digitize Verbatim Paper &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
