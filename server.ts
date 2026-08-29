import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { setGlobalDispatcher, Agent } from 'undici';

dotenv.config();

// Configure undici dispatcher to disable request header/body timeouts (0 = disabled)
// to completely prevent HeadersTimeoutError during LLM generation and network latency
setGlobalDispatcher(
  new Agent({
    headersTimeout: 0,
    bodyTimeout: 0,
    connectTimeout: 60_000,
    keepAliveTimeout: 60_000,
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini SDK
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Robust helper with exponential backoff and automatic model fallback
 * for high-demand / capacity spikes (e.g. 503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED) or model deprecation (404).
 */
async function callGeminiWithModelFallback<T>(
  operationBuilder: (modelName: string) => Promise<T>,
  preferredModels: string[] = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.7-flash'],
  retriesPerModel = 2
): Promise<T> {
  let lastError: any;
  for (const model of preferredModels) {
    for (let attempt = 1; attempt <= retriesPerModel; attempt++) {
      try {
        return await operationBuilder(model);
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isQuotaExceeded =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('exceeded your current quota');
        const isCapacityOrTransientError =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('overloaded');
        const isPermanentModelError =
          errMsg.includes('404') ||
          errMsg.includes('NOT_FOUND') ||
          errMsg.includes('no longer available') ||
          errMsg.includes('is not found');

        console.warn(`[Gemini API] Model ${model} Attempt ${attempt}/${retriesPerModel} failed:`, errMsg);

        if (isPermanentModelError || isQuotaExceeded) {
          // Immediately switch to next model in queue on quota exhaustion or missing model
          console.warn(`[Gemini API] Model ${model} quota/availability issue. Instantly falling back to next available model...`);
          break;
        }

        if (attempt < retriesPerModel) {
          const delay = 400 * Math.pow(2, attempt - 1) + Math.random() * 200;
          await new Promise((res) => setTimeout(res, delay));
        } else if (isCapacityOrTransientError) {
          console.warn(`[Gemini API] Capacity spike on ${model}. Falling back to next available model in queue...`);
          break;
        }
      }
    }
  }
  throw lastError;
}

/**
 * Extracts a clean, human-readable error string instead of raw JSON
 */
function formatErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred.';
  let msg = error.message || String(error);
  try {
    if (typeof msg === 'string' && msg.includes('{') && msg.includes('}')) {
      const jsonStart = msg.indexOf('{');
      const jsonEnd = msg.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = msg.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
        if (parsed?.message) {
          return parsed.message;
        }
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return msg;
}

/**
 * MASTER SYSTEM PROMPT BUILDER
 * STRICT MYP eAssessment / IGCSE EXAM QUESTION GENERATOR
 */
function buildMasterSystemPrompt(params: {
  curriculum: string;
  yearGroup: string;
  subject: string;
  topic: string;
  subtopics: string[];
  learningObjectives: string[];
  difficultyLevel?: string;
  selectedCriterion?: string;
  selectedStrands?: string[];
  mypAssessmentMode?: string;
  targetQuestionCount?: number;
  maxMarks?: number;
}): string {
  const curriculumStr = (params.curriculum || '').toUpperCase();
  const isMYP = curriculumStr.includes('MYP') || (curriculumStr.includes('IB') && !curriculumStr.includes('DP'));
  const isIGCSE = curriculumStr.includes('IGCSE') || curriculumStr.includes('CAMBRIDGE') || curriculumStr.includes('EDEXCEL') || curriculumStr.includes('GCSE');

  return `
# MASTER SYSTEM PROMPT

## STRICT MYP eAssessment / IGCSE EXAM QUESTION GENERATOR

You are an expert international-school Science and Biology assessment designer and Chief Examiner.

Your primary task is to generate **high-quality, curriculum-authentic assessment questions**.

The application has two distinct assessment modes:
1. **MYP**
2. **IGCSE**

These two modes MUST use fundamentally different question-design philosophies.
You MUST NEVER mix MYP and IGCSE assessment styles.

---

# PART 1 — NON-NEGOTIABLE MODE SELECTION
Selected curriculum: \`curriculum = ${isMYP ? 'MYP' : isIGCSE ? 'IGCSE' : params.curriculum}\`
Year Group / Grade: ${params.yearGroup}
Subject: ${params.subject}

${isMYP ? `
### ACTIVE MODE: MYP (IB Middle Years Programme Sciences)
- Generate questions in the style of a rigorous **MYP Sciences eAssessment**, appropriate to ${params.yearGroup}.
- Do NOT generate conventional IGCSE-style examination questions.
- Follow the MYP Sciences criteria framework: Criterion A, B, C, D.
` : `
### ACTIVE MODE: IGCSE (International GCSE Examination)
- Generate questions in the style of a rigorous **IGCSE Biology/Science board examination** (e.g. Cambridge IGCSE, Edexcel IGCSE), using authentic exam command terms, structured questions, data interpretation, calculations, experimental skills, and extended responses.
- Do NOT generate MYP criterion-style questions. Do NOT use Criterion A/B/C/D labels or MYP strand codes.
`}

---

# PART 2 — MYP ASSESSMENT ENGINE (When curriculum = MYP)

## Criterion A — Knowing and Understanding
Assess the student's ability to:
* demonstrate scientific knowledge
* explain biological concepts
* apply knowledge to unfamiliar situations
* interpret biological processes
* use scientific terminology accurately
* explain relationships between biological structures, processes and functions
Questions should NOT simply ask students to recall definitions.
Prefer: explain, describe and explain, apply, predict, compare, interpret, identify and justify, use knowledge to explain an unfamiliar situation.
(Example style: "A student notices that a plant placed near a window grows towards the light. Explain how plant hormones contribute to this response." Avoid weak recall such as "What is phototropism?")

## Criterion B — Inquiring and Designing
Assess scientific inquiry and experimental design:
* formulate a research question & testable hypothesis
* identify independent, dependent, and controlled variables
* design an investigation, select appropriate equipment, describe a valid procedure
* explain how reliability can be improved and validity maintained
* identify appropriate data to collect, justify methodological choices, consider safety/ethical issues
Must require genuine scientific thinking (e.g., "A student wants to investigate how temperature affects the activity of amylase. Identify the independent variable and describe how it should be measured.").

## Criterion C — Processing and Evaluating
This criterion MUST involve DATA whenever appropriate:
* organize and process numerical data, calculate values, identify patterns and trends
* interpret graphs and tables, draw scientifically justified conclusions
* evaluate a hypothesis, evaluate the validity of a conclusion, identify anomalies, evaluate reliability, identify limitations, suggest realistic improvements
IMPORTANT:
- Do NOT create fake "data questions" where data are unnecessary. Data MUST be meaningful and connected.
- For numerical questions: provide sufficient data, ensure calculations are mathematically correct, use realistic units.
- For graph questions: specify variables and units, require interpretation rather than merely plotting where suitable.

## Criterion D — REFLECTING ON THE IMPACTS OF SCIENCE
Assess the student's ability to:
* explain applications of science, discuss consequences of scientific developments
* evaluate ethical, environmental, social, and economic implications
* discuss benefits and limitations, evaluate perspectives, make evidence-based judgments
Avoid generic opinion questions (use: "Evaluate one potential benefit and one potential environmental concern associated with genetically modified crops").

---

# PART 3 — MYP QUESTION DESIGN
MYP questions MUST demonstrate:
1. Conceptual understanding (mechanisms and relationships, not isolated facts).
2. Application in unfamiliar contexts.
3. Inquiry (investigate, design, analyze, evaluate).
4. Data literacy (tables, graphs, experimental scenarios).
5. Command terms matching cognitive demand: define, describe, outline, explain, summarize, calculate, determine, identify, interpret, analyze, compare, distinguish, discuss, evaluate, justify, predict, suggest.

---

# PART 4 — MYP COGNITIVE DEMAND
A strong assessment should contain an authentic cognitive mixture:
- Developing-level: identify, describe, state, calculate
- Applying-level: explain, apply, interpret, predict, compare
- Extending-level: analyze, evaluate, justify, design, synthesize evidence, evaluate limitations

---

# PART 5 — MYP CONTEXT DESIGN
Whenever appropriate, create a stimulus before the questions (experimental data, a graph, a table, a biological scenario, an image/microscopy context, or observation records). Connect questions directly to the stimulus.

---

# PART 6 — MYP MARK ALLOCATION
Marks MUST correspond to the actual intellectual work required ([1], [2], [3], [4], [5], [6], [8]).
Every mark must be justified by an expected creditworthy element.

---

# PART 7 — MYP QUESTION AUTHENTICITY CHECK
Reject trivial recall, vocabulary quizzes, or questions disconnected from context.

---

# PART 8 — IGCSE ASSESSMENT ENGINE (When curriculum = IGCSE)
Switch completely to an IGCSE Biology examination model (Cambridge IGCSE / Edexcel IGCSE).

---

# PART 9 — IGCSE QUESTION TYPES
IGCSE questions should include:
- Knowledge and understanding: state, name, identify, define, describe
- Application: explain, suggest, predict, use information, interpret
- Data analysis: calculate, determine, plot, describe trends, compare results, interpret graphs, evaluate conclusions
- Experimental skills: identify variables, describe methods, explain controls, suggest improvements, identify sources of error, evaluate reliability
- Extended response: structured connection of biological ideas.

---

# PART 10 — IGCSE QUESTION STRUCTURE
Prefer authentic examination structures:
- Structured questions: (a) [1], (b) [2], (c) [3], (d) [2]
- Data-response questions with progressive demand
- Practical / experimental questions: variables, apparatus, method, controls, repeats, reliability, limitations.

---

# PART 11 — IGCSE MARK SCHEMES
Every question MUST be checked against a mark scheme where mark allocations match discrete creditworthy points. Do NOT inflate marks.

---

# PART 12 — IGCSE DATA QUESTIONS
- Use realistic biological values and standard units.
- Formulas:
  * Rate = change in measured quantity / time
  * Percentage change = ((new value - original value) / original value) * 100
- Mathematically check all numerical calculations before output.

---

# PART 13 — DO NOT MIX THE TWO SYSTEMS
- NEVER in MYP: trivial recall lists without embedded context.
- NEVER in IGCSE: Criterion A, B, C, D labels or MYP strand codes.

---

# PART 14 — QUESTION DIFFICULTY
Difficulty must be created through thinking required (unfamiliar contexts, multi-step reasoning, data interpretation, concept application), NOT confusing language.

---

# PART 15 — STRICT TOPIC AND SUBTOPIC CONTROL
- Subject: ${params.subject}
- Topic: "${params.topic}"
- Subtopics (STRICTLY CONSTRAIN ALL QUESTIONS TO THESE): ${JSON.stringify(params.subtopics)}
- Learning Objectives: ${JSON.stringify(params.learningObjectives)}
Questions MUST remain strictly within the selected topic and subtopics. Never introduce unrequested topics.

---

# PART 16 — QUESTION VARIETY
Combine appropriate formats: short response, structured response, application, data interpretation, calculation, experimental design, graph analysis, evaluation.

---

# PART 17 — STIMULUS-FIRST DESIGN
Reasoning sequence: TOPIC -> CURRICULUM -> ASSESSMENT OBJECTIVE -> CONTEXT -> STIMULUS -> QUESTION -> MARK ALLOCATION -> MARK SCHEME -> VALIDATION.

---

# PART 18 — MARK SCHEME GENERATION
Scientifically correct mark scheme points matching the mark allocation exactly.

---

# PART 19 — QUALITY CONTROL
Run internal curriculum validation, science validation, assessment validation, difficulty validation, and repetition validation.

---

# PART 19.5 — STRICT DATASET AND PROMPT IDENTIFIER CONSISTENCY
Whenever a question prompt, context, or scenario refers to specific entities, treatments, solutions, or specimens (for example: "Cell X, Cell Y, Cell Z", "Test Tube A, B, C", "Sample 1, 2, 3", "Plant P, Q, R", "Species A vs Species B"):
- The dataset table and datapoint 'x' labels MUST use the exact same identifiers ("Cell X", "Cell Y", "Cell Z" — NOT generic "Trial 1", "Trial 2").
- The expected answer and mark scheme MUST refer to the exact same identifiers.
- Never allow a mismatch between entity labels in the question text and entity labels in the dataset or table.

---

# PART 20 — OUTPUT SPECIFICATIONS
- Generate EXACTLY ${params.targetQuestionCount || 5} questions (numbered 1 to ${params.targetQuestionCount || 5}).
- The SUM of all question \`maxMarks\` MUST EXACTLY EQUAL ${params.maxMarks || 20} marks.
- For each question, the sum of marks in \`markScheme.points\` MUST EXACTLY EQUAL that question's \`maxMarks\`.
- Difficulty Level: ${params.difficultyLevel || 'Standard'}.
- Year Group: ${params.yearGroup}.
`;
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Formative Assessment Engine' });
});

// Endpoint: Generate Formative Assessment with strict topic boundaries & validation
app.post('/api/ai/generate-formative', async (req: Request, res: Response) => {
  try {
    const { blueprint, teacherInstructions, previousQuestions } = req.body;
    if (!blueprint) {
      return res.status(400).json({ error: 'Blueprint is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = buildMasterSystemPrompt({
      curriculum: blueprint.curriculum,
      yearGroup: blueprint.yearGroup,
      subject: blueprint.subject,
      topic: blueprint.topic,
      subtopics: blueprint.subtopics || [],
      learningObjectives: blueprint.learningObjectives || [],
      difficultyLevel: blueprint.difficultyLevel || 'Standard',
      selectedCriterion: blueprint.selectedCriterion,
      selectedStrands: blueprint.selectedStrands,
      mypAssessmentMode: blueprint.mypAssessmentMode,
      targetQuestionCount: blueprint.targetQuestionCount || 5,
      maxMarks: blueprint.maxMarks || 20,
    });

    const isMYP = (blueprint.curriculum || '').toUpperCase().includes('MYP') || ((blueprint.curriculum || '').toUpperCase().includes('IB') && !(blueprint.curriculum || '').toUpperCase().includes('DP'));

    const generationTimestamp = new Date().toISOString();
    const entropySeed = Math.floor(Math.random() * 1000000);

    let prompt = `Generate a complete, strictly curriculum-authentic formative assessment matching the blueprint.
[Generation Session ID: ${entropySeed} | Timestamp: ${generationTimestamp}]
Curriculum Mode: ${isMYP ? 'MYP (Middle Years Programme)' : 'IGCSE (International GCSE Examination)'}
Year Group / Level: ${blueprint.yearGroup}
Subject: ${blueprint.subject}
Difficulty Level: ${blueprint.difficultyLevel || 'Standard'}
Topic: "${blueprint.topic}"
Subtopics to Assess (STRICTLY CONFINED TO THESE): ${(blueprint.subtopics || []).join(', ')}
Learning Objectives:
${(blueprint.learningObjectives || []).map((lo: string) => `- ${lo}`).join('\n')}

### VARIETY & DIVERSITY MANDATE:
- Synthesize an original, non-repetitive set of questions with distinct experimental setups, biological contexts, and question types.
- Ensure every question tests a different facet of the subtopics (e.g. molecular mechanism vs. experimental design vs. numerical calculation vs. graph interpretation).
- Do NOT generate repetitive or cookie-cutter questions.`;

    if (teacherInstructions && typeof teacherInstructions === 'string' && teacherInstructions.trim()) {
      prompt += `\n\n### TEACHER'S DIRECT COMMAND & INSTRUCTIONS (HIGHEST PRIORITY):
"${teacherInstructions.trim()}"
CRITICAL: You MUST strictly fulfill these teacher instructions across the entire set of questions generated.`;
    }

    if (Array.isArray(previousQuestions) && previousQuestions.length > 0) {
      prompt += `\n\n### AVOID DUPLICATING PREVIOUS QUESTIONS:
This is a full regeneration request. Generate a completely fresh set of scenarios and questions distinct from previous questions:
${previousQuestions.slice(0, 10).map((p: string, i: number) => `- Previous Q${i + 1}: "${p}"`).join('\n')}`;
    }

    prompt += `\n\nCRITICAL MANDATES:
1. Generate EXACTLY ${blueprint.targetQuestionCount || 5} questions numbered 1 to ${blueprint.targetQuestionCount || 5}.
2. The total marks across all questions MUST SUM UP TO EXACTLY ${blueprint.maxMarks || 20} MARKS.
3. Difficulty Level: ${blueprint.difficultyLevel || 'Standard'}.
4. Mode Authenticity: ${isMYP ? 'Organize questions around MYP criteria and inquiry/stimulus. Do NOT use IGCSE exam style.' : 'Organize questions in authentic IGCSE exam paper structure with structured subparts and data/practical skills. Do NOT use Criterion A/B/C/D labels.'}
5. Ensure every question is strictly aligned to ${blueprint.yearGroup} and tests ONLY the requested subtopics.`;

    const response = await callGeminiWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.85,
          topP: 0.95,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assessmentTitle: { type: Type.STRING },
              validationSummary: {
                type: Type.OBJECT,
                properties: {
                  topicBoundaryCompliant: { type: Type.BOOLEAN },
                  yearLevelAppropriate: { type: Type.BOOLEAN },
                  datasetConsistent: { type: Type.BOOLEAN },
                  notes: { type: Type.STRING },
                },
                required: ['topicBoundaryCompliant', 'yearLevelAppropriate', 'datasetConsistent'],
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: { type: Type.INTEGER },
                    type: {
                      type: Type.STRING,
                      description: 'mcq, short_answer, extended_response, numerical, data_based, graph_interpretation, experimental_design',
                    },
                    commandTerm: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    context: { type: Type.STRING },
                    maxMarks: { type: Type.INTEGER },
                    cognitiveDemand: { type: Type.STRING, description: 'Recall, Understanding, Application, Analysis, Evaluation, Design' },
                    learningObjective: { type: Type.STRING },
                    criterion: { type: Type.STRING },
                    strands: { type: Type.ARRAY, items: { type: Type.STRING } },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                          misconceptionExplanation: { type: Type.STRING },
                        },
                        required: ['id', 'text', 'isCorrect'],
                      },
                    },
                    dataset: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        xLabel: { type: Type.STRING },
                        xUnit: { type: Type.STRING },
                        yLabel: { type: Type.STRING },
                        yUnit: { type: Type.STRING },
                        dataPoints: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              x: { type: Type.STRING },
                              y: { type: Type.NUMBER },
                              trial1: { type: Type.NUMBER },
                              trial2: { type: Type.NUMBER },
                              trial3: { type: Type.NUMBER },
                              mean: { type: Type.NUMBER },
                            },
                            required: ['x', 'y'],
                          },
                        },
                      },
                    },
                    expectedAnswer: { type: Type.STRING },
                    markScheme: {
                      type: Type.OBJECT,
                      properties: {
                        points: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              point: { type: Type.STRING },
                              marks: { type: Type.INTEGER },
                            },
                            required: ['id', 'point', 'marks'],
                          },
                        },
                        generalGuidance: { type: Type.STRING },
                      },
                      required: ['points'],
                    },
                  },
                  required: ['questionNumber', 'type', 'commandTerm', 'prompt', 'maxMarks', 'cognitiveDemand', 'learningObjective', 'expectedAnswer', 'markScheme'],
                },
              },
            },
            required: ['assessmentTitle', 'validationSummary', 'questions'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/generate-formative:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// Endpoint: Regenerate a Single Question with curriculum, year group, and difficulty alignment
app.post('/api/ai/regenerate-question', async (req: Request, res: Response) => {
  try {
    const { blueprint, existingQuestion, teacherGuidance } = req.body;
    if (!blueprint || !existingQuestion) {
      return res.status(400).json({ error: 'Blueprint and existingQuestion are required' });
    }

    const ai = getGeminiClient();

    const isMYP = (blueprint.curriculum || '').toUpperCase().includes('MYP') || ((blueprint.curriculum || '').toUpperCase().includes('IB') && !(blueprint.curriculum || '').toUpperCase().includes('DP'));

    const systemInstruction = buildMasterSystemPrompt({
      curriculum: blueprint.curriculum,
      yearGroup: blueprint.yearGroup,
      subject: blueprint.subject,
      topic: blueprint.topic,
      subtopics: blueprint.subtopics || [],
      learningObjectives: [existingQuestion.learningObjective || blueprint.topic],
      difficultyLevel: blueprint.difficultyLevel || existingQuestion.difficultyLevel || 'Standard',
      selectedCriterion: existingQuestion.criterion || blueprint.selectedCriterion,
      selectedStrands: existingQuestion.strands || blueprint.selectedStrands,
      targetQuestionCount: 1,
      maxMarks: existingQuestion.maxMarks || 3,
    });

    const prompt = `Generate 1 fresh, replacement assessment question for:
Curriculum: ${isMYP ? 'MYP Sciences eAssessment' : 'IGCSE Examination'} (${blueprint.yearGroup})
Subject: ${blueprint.subject}
Topic: ${blueprint.topic}
Target Subtopic / Concept: ${existingQuestion.learningObjective || blueprint.subtopics?.[0] || blueprint.topic}
Target Max Marks: ${existingQuestion.maxMarks || 3}
Target Question Type: ${existingQuestion.type || 'extended_response'}
Difficulty Level: ${blueprint.difficultyLevel || 'Standard'}
${isMYP && (existingQuestion.criterion || blueprint.selectedCriterion) ? `Target Criterion: ${existingQuestion.criterion || blueprint.selectedCriterion}` : ''}
${teacherGuidance ? `Teacher Specific Guidance: "${teacherGuidance}"` : ''}
Previous question to REPLACE (do not duplicate): "${existingQuestion.prompt}"

CRITICAL MANDATES:
1. The question must strictly belong to ${isMYP ? 'MYP Sciences' : 'IGCSE'} philosophy. ${!isMYP ? 'Do NOT include MYP criterion labels.' : ''}
2. The question's maxMarks MUST EXACTLY EQUAL ${existingQuestion.maxMarks || 3} marks.
3. The sum of marks in markScheme.points MUST EXACTLY EQUAL ${existingQuestion.maxMarks || 3}.
4. Provide structured, scientifically accurate mark scheme points.`;

    const response = await callGeminiWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.85,
          topP: 0.95,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  commandTerm: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  context: { type: Type.STRING },
                  maxMarks: { type: Type.INTEGER },
                  cognitiveDemand: { type: Type.STRING },
                  learningObjective: { type: Type.STRING },
                  criterion: { type: Type.STRING },
                  strands: { type: Type.ARRAY, items: { type: Type.STRING } },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN },
                        misconceptionExplanation: { type: Type.STRING },
                      },
                      required: ['id', 'text', 'isCorrect'],
                    },
                  },
                  dataset: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      xLabel: { type: Type.STRING },
                      xUnit: { type: Type.STRING },
                      yLabel: { type: Type.STRING },
                      yUnit: { type: Type.STRING },
                      dataPoints: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            x: { type: Type.STRING },
                            y: { type: Type.NUMBER },
                            trial1: { type: Type.NUMBER },
                            trial2: { type: Type.NUMBER },
                            trial3: { type: Type.NUMBER },
                            mean: { type: Type.NUMBER },
                          },
                          required: ['x', 'y'],
                        },
                      },
                    },
                  },
                  expectedAnswer: { type: Type.STRING },
                  markScheme: {
                    type: Type.OBJECT,
                    properties: {
                      points: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            point: { type: Type.STRING },
                            marks: { type: Type.INTEGER },
                          },
                          required: ['id', 'point', 'marks'],
                        },
                      },
                      generalGuidance: { type: Type.STRING },
                    },
                    required: ['points'],
                  },
                },
                required: ['type', 'commandTerm', 'prompt', 'maxMarks', 'cognitiveDemand', 'expectedAnswer', 'markScheme'],
              },
            },
            required: ['question'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/regenerate-question:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// Endpoint: Robust Examiner AI Marking Engine & Learning-Gap Diagnosis
app.post('/api/ai/mark-submission', async (req: Request, res: Response) => {
  try {
    const { assessment, responses, studentName } = req.body;
    if (!assessment || !responses) {
      return res.status(400).json({ error: 'Assessment and responses are required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an EXPERT, FAIR, AND RIGOROUS SENIOR EXAMINER for ${assessment.blueprint.curriculum} Sciences (${assessment.blueprint.yearGroup}).

CORE MARKING PRINCIPLES — CONCEPTUAL & SEMANTIC EQUIVALENCE:
1. EVALUATE MEANING AND UNDERSTANDING, NOT RIGID KEYWORD MATCHING:
   - Award the mark whenever the student's answer is scientifically correct, conceptually equivalent to the mark-scheme point, expressed in the student's own words, expressed using valid synonyms, or is an informal but scientifically sound paraphrase of the expected concept.
   - Do NOT require students to reproduce expected textbook responses verbatim.
   - Do NOT withhold a mark merely because a student used alternative phrasing (e.g. if a student writes "water enters because outside has higher water concentration" or "water moves into the cell from where there is more free water", recognize the conceptual understanding of osmosis even if they didn't write "higher water potential").
2. WHEN TO WITHHOLD A MARK:
   - Only withhold marks for genuine scientific errors, factual inaccuracies, complete omission of the required concept, answers that are too vague to demonstrate specific scientific knowledge, or direct contradictions of scientific principles.
3. AUTHENTIC EVIDENCE FOUND:
   - For every marking point that is awarded (isAwarded: true), 'evidenceFound' MUST extract an actual short quote or close paraphrase from the student's specific answer.
   - If no evidence exists in the student's response for a point, leave 'evidenceFound' empty or omit it. Never output generic boilerplate statements.
4. PRECISE & SPECIFIC MISSING REASON:
   - When a marking point is not awarded (isAwarded: false), 'missingReason' MUST specifically explain what was missing in relation to that exact mark point (e.g., "Did not specify that the membrane is selectively permeable" or "Omitted the required calculation units (cm³)").
   - Never output repetitive generic statements like "Did not meet examiner standard".
5. OUTPUT DETAILED AND CONSTRUCTIVE FEEDBACK:
   - 'whatWasCorrect': specific points and concepts the student answered correctly.
   - 'whatWasMissing': specific ideas or details that were omitted.
   - 'scientificErrorsIdentified': genuine misconceptions identified in the response (if any).
   - 'whyMarksWereLost': transparent and encouraging explanation of marking decisions.
   - 'howToImprove': actionable next steps to reach full marks.
6. OVERALL LEARNING GAP DIAGNOSIS:
   - Strengths: specific areas of demonstrated mastery.
   - Learning Gaps: concepts needing reinforcement with clear evidence and next steps.
   - Misconceptions: incorrect mental models with the scientific truth and correction strategies.
   - Priority Improvement Target: the single most impactful focus area for future study.`;

    const prompt = `Mark the following student submission fairly and rigorously based on conceptual understanding:
Student Name: ${studentName || 'Student'}
Curriculum: ${assessment.blueprint.curriculum} (${assessment.blueprint.yearGroup})
Topic: ${assessment.blueprint.topic}
Learning Objectives: ${JSON.stringify(assessment.blueprint.learningObjectives)}

Assessment Questions and Mark Schemes:
${JSON.stringify(assessment.questions, null, 2)}

Student Responses:
${JSON.stringify(responses, null, 2)}

Evaluate each response thoroughly for genuine scientific understanding and conceptual equivalence. Award credit for correct science expressed in the student's own words.`;

    const response = await callGeminiWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalMarksAwarded: { type: Type.INTEGER },
              totalMaxMarks: { type: Type.INTEGER },
              mypOverallAchievementLevel: { type: Type.INTEGER, description: 'For MYP 1-3, achievement level 0-8' },
              questionResults: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionId: { type: Type.STRING },
                    marksAwarded: { type: Type.INTEGER },
                    maxMarks: { type: Type.INTEGER },
                    markingPoints: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          point: { type: Type.STRING },
                          marks: { type: Type.INTEGER },
                          isAwarded: { type: Type.BOOLEAN },
                          evidenceFound: { type: Type.STRING },
                          missingReason: { type: Type.STRING },
                        },
                        required: ['id', 'point', 'marks', 'isAwarded'],
                      },
                    },
                    modelResponse: { type: Type.STRING },
                    whatWasCorrect: { type: Type.ARRAY, items: { type: Type.STRING } },
                    whatWasMissing: { type: Type.ARRAY, items: { type: Type.STRING } },
                    scientificErrorsIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
                    whyMarksWereLost: { type: Type.STRING },
                    howToImprove: { type: Type.STRING },
                  },
                  required: ['questionId', 'marksAwarded', 'maxMarks', 'markingPoints', 'whatWasCorrect', 'whatWasMissing', 'whyMarksWereLost', 'howToImprove'],
                },
              },
              diagnosis: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  learningGaps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        gap: { type: Type.STRING },
                        evidence: { type: Type.STRING },
                        criterionOrObjective: { type: Type.STRING },
                        nextStep: { type: Type.STRING },
                      },
                      required: ['gap', 'evidence', 'criterionOrObjective', 'nextStep'],
                    },
                  },
                  misconceptions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        misconception: { type: Type.STRING },
                        demonstratedInQuestion: { type: Type.INTEGER },
                        scientificTruth: { type: Type.STRING },
                        correctionStrategy: { type: Type.STRING },
                      },
                      required: ['misconception', 'demonstratedInQuestion', 'scientificTruth', 'correctionStrategy'],
                    },
                  },
                  priorityImprovementTarget: { type: Type.STRING },
                },
                required: ['strengths', 'learningGaps', 'misconceptions', 'priorityImprovementTarget'],
              },
            },
            required: ['totalMarksAwarded', 'totalMaxMarks', 'questionResults', 'diagnosis'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/mark-submission:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// Endpoint: Parse Uploaded Question Paper (PDF, Image, or Text) into Structured Formative Assessment
app.post('/api/ai/parse-question-paper', async (req: Request, res: Response) => {
  try {
    const { pdfBase64, imageBase64, fileBase64, mimeType: rawMimeType, paperText, filename, curriculum, yearGroup, subject, topic } = req.body;
    
    const base64Data = fileBase64 || imageBase64 || pdfBase64;
    if (!base64Data && !paperText) {
      return res.status(400).json({ error: 'Question paper data (PDF base64, image base64, or paper text) is required' });
    }

    const ai = getGeminiClient();

    // Determine MIME type
    let mimeType = rawMimeType || 'application/pdf';
    if (!rawMimeType && base64Data) {
      if (base64Data.startsWith('data:image/png;base64,')) mimeType = 'image/png';
      else if (base64Data.startsWith('data:image/jpeg;base64,') || base64Data.startsWith('data:image/jpg;base64,')) mimeType = 'image/jpeg';
      else if (base64Data.startsWith('data:image/webp;base64,')) mimeType = 'image/webp';
    }

    // Clean base64 string
    const cleanBase64 = base64Data
      ? base64Data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '')
      : null;

    const systemInstruction = `You are a MASTER EXAMINATION DIGITIZER AND SENIOR CHIEF SCIENCE EXAMINER for ${curriculum || 'International'} Sciences (${yearGroup || 'Secondary'}).
Your mission is to transcribe and digitize the provided question paper with 100% VERBATIM ACCURACY AND EXACT NUMERICAL FIDELITY.

CRITICAL DIGITIZATION MANDATES:
1. VERBATIM QUESTION REPRODUCTION (ZERO REFRAMING, ZERO REPHRASING):
   - You MUST extract EVERY question exactly as written on the paper word-for-word.
   - DO NOT reframe, summarize, simplify, or reword any question prompt, context, or subpart.
   - Maintain the original question numbers (e.g. 1, 2, 3, 4, 5...) and subquestion labels (e.g. 4(a), 4(b), 4(c)(i)).
   - Extract ALL pages and ALL questions from first to last without omitting any part.

2. MULTI-SERIES DATASETS & GRAPHS (PRECISE READINGS):
   - When a question contains a graph or chart (such as grouped bar charts with "With inhibitor" vs "Without inhibitor", or multi-line curves):
   - Transcribe EVERY category/x-value and its exact numerical values for each treatment series:
     * dataset.title: Exact title of graph (e.g. 'Sodium Uptake by Root Cells')
     * dataset.chartType: 'bar' | 'line' | 'scatter'
     * dataset.xLabel: X-axis title and variable (e.g. 'External Sodium Concentration')
     * dataset.xUnit: Unit of X (e.g. 'mmol/L')
     * dataset.yLabel: Y-axis title (e.g. 'Sodium Uptake')
     * dataset.yUnit: Unit of Y (e.g. 'arbitrary units')
     * dataset.series: Array of series definitions, e.g. [
         { "key": "withInhibitor", "name": "With inhibitor", "color": "#64748b" },
         { "key": "withoutInhibitor", "name": "Without inhibitor", "color": "#16a34a" }
       ]
     * dataset.dataPoints: Array of exact data points with each series value, e.g.:
       [
         { "x": "0", "withInhibitor": 1.0, "withoutInhibitor": 1.0, "y": 1.0 },
         { "x": "1", "withInhibitor": 3.0, "withoutInhibitor": 6.0, "y": 6.0 },
         { "x": "5", "withInhibitor": 4.0, "withoutInhibitor": 14.0, "y": 14.0 },
         { "x": "10", "withInhibitor": 4.0, "withoutInhibitor": 19.0, "y": 19.0 }
       ]

3. STRUCTURED SCIENTIFIC TABLES (EXACT HEADERS & ROWS):
   - When a table is present (such as Solution, Initial Mass (g), Final Mass (g)):
   - Extract into 'tableData':
     * tableData.title: Title of table
     * tableData.headers: Array of column headers, e.g. ["Solution", "Initial Mass (g)", "Final Mass (g)"]
     * tableData.rows: 2D array of rows, e.g. [
         ["Pure water", "5.0", "6.0"],
         ["Dilute salt solution", "5.0", "5.1"],
         ["Concentrated solution", "5.0", "4.2"]
       ]
     * tableData.caption: Optional footnote or note.

4. ACCURATE MARKS ALLOCATION:
   - Extract the exact mark allocation stated on the paper (e.g. '[1]', '[2]', '[3]', '[4]').
   - If marks are not explicitly printed, assign realistic marks and set marksMissing: true.

5. ROBUST SCIENTIFIC MARK SCHEMES:
   - For every question, synthesize discrete marking points in 'markScheme.points' with 'marks: 1' each, identifying exact scientific keywords, calculations, error bars, and acceptable answers.`;

    const prompt = `Digitize the provided Science question paper with 100% fidelity.
Curriculum Context: ${curriculum || 'IBMYP'} (${yearGroup || 'Grade 7 / MYP 2'})
Subject: ${subject || 'Integrated Sciences'}
Topic / Context: ${topic || 'Cell Biology & Transport'}
Filename: ${filename || 'QuestionPaper'}

${paperText ? `Pasted Paper Text:\n${paperText}\n` : ''}
Extract every single question verbatim with all graphs (multi-series values), tables, MCQ options, exact marks, and complete mark schemes.`;

    const contents: any[] = [];
    if (cleanBase64) {
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }
    contents.push({ text: prompt });

    const response = await callGeminiWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedTitle: { type: Type.STRING },
              extractedTopic: { type: Type.STRING },
              extractedInstructions: { type: Type.STRING },
              totalExtractedMarks: { type: Type.INTEGER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: { type: Type.INTEGER },
                    subQuestionLabel: { type: Type.STRING, description: 'e.g. 1(a), 2(b)(i), 4(a)' },
                    type: { type: Type.STRING, description: 'mcq, short_answer, extended_response, numerical, data_based, graph_interpretation, experimental_design, table_completion' },
                    commandTerm: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    context: { type: Type.STRING },
                    imageCaption: { type: Type.STRING },
                    imageAlt: { type: Type.STRING },
                    maxMarks: { type: Type.INTEGER },
                    marksMissing: { type: Type.BOOLEAN },
                    cognitiveDemand: { type: Type.STRING },
                    learningObjective: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                        },
                        required: ['id', 'text'],
                      },
                    },
                    dataset: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        chartType: { type: Type.STRING, description: 'bar, line, scatter' },
                        description: { type: Type.STRING },
                        xLabel: { type: Type.STRING },
                        xUnit: { type: Type.STRING },
                        yLabel: { type: Type.STRING },
                        yUnit: { type: Type.STRING },
                        series: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              key: { type: Type.STRING },
                              name: { type: Type.STRING },
                              color: { type: Type.STRING },
                            },
                            required: ['key', 'name'],
                          },
                        },
                        dataPoints: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              x: { type: Type.STRING },
                              y: { type: Type.NUMBER },
                              withInhibitor: { type: Type.NUMBER },
                              withoutInhibitor: { type: Type.NUMBER },
                              trial1: { type: Type.NUMBER },
                              trial2: { type: Type.NUMBER },
                              trial3: { type: Type.NUMBER },
                            },
                            required: ['x'],
                          },
                        },
                      },
                      required: ['title', 'xLabel', 'yLabel', 'dataPoints'],
                    },
                    tableData: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                        rows: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                        caption: { type: Type.STRING },
                      },
                      required: ['headers', 'rows'],
                    },
                    expectedAnswer: { type: Type.STRING },
                    markScheme: {
                      type: Type.OBJECT,
                      properties: {
                        points: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              point: { type: Type.STRING },
                              marks: { type: Type.INTEGER },
                            },
                            required: ['id', 'point', 'marks'],
                          },
                        },
                        acceptableAlternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
                        generalGuidance: { type: Type.STRING },
                      },
                      required: ['points'],
                    },
                  },
                  required: ['questionNumber', 'type', 'commandTerm', 'prompt', 'maxMarks', 'expectedAnswer', 'markScheme'],
                },
              },
            },
            required: ['questions'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/parse-question-paper:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// Endpoint: Generate Targeted Reassessment based on student learning gaps
app.post('/api/ai/targeted-reassessment', async (req: Request, res: Response) => {
  try {
    const { originalBlueprint, learningGaps, misconceptions, studentName } = req.body;
    if (!originalBlueprint || !learningGaps) {
      return res.status(400).json({ error: 'Original blueprint and learning gaps are required' });
    }

    const ai = getGeminiClient();

    const isMYP = (originalBlueprint.curriculum || '').toUpperCase().includes('MYP') || ((originalBlueprint.curriculum || '').toUpperCase().includes('IB') && !(originalBlueprint.curriculum || '').toUpperCase().includes('DP'));

    const systemInstruction = buildMasterSystemPrompt({
      curriculum: originalBlueprint.curriculum,
      yearGroup: originalBlueprint.yearGroup,
      subject: originalBlueprint.subject,
      topic: originalBlueprint.topic,
      subtopics: originalBlueprint.subtopics || [],
      learningObjectives: originalBlueprint.learningObjectives || [],
      difficultyLevel: originalBlueprint.difficultyLevel || 'Standard',
      selectedCriterion: originalBlueprint.selectedCriterion,
      selectedStrands: originalBlueprint.selectedStrands,
      targetQuestionCount: 3,
      maxMarks: 10,
    });

    const prompt = `Generate a 3-question TARGETED REASSESSMENT formative for ${studentName || 'the student'} focusing strictly on diagnosed weaknesses:
Curriculum: ${isMYP ? 'MYP Sciences' : 'IGCSE Examination'} (${originalBlueprint.yearGroup})
Topic: ${originalBlueprint.topic}
Subtopics: ${(originalBlueprint.subtopics || []).join(', ')}

Diagnosed Gaps & Misconceptions to Target:
${learningGaps.map((g: any) => `- Gap: ${g.gap || g} | Next Step: ${g.nextStep || ''}`).join('\n')}
${(misconceptions || []).map((m: any) => `- Misconception: ${m.misconception || m} (Truth: ${m.scientificTruth || ''})`).join('\n')}

MANDATE:
1. Reassess the core concepts through a fresh practical scenario or biological context.
2. Maintain strict ${isMYP ? 'MYP Sciences' : 'IGCSE'} philosophy and formatting without mixing systems.
3. Total questions: 3. Total marks: 10.`;

    const response = await callGeminiWithModelFallback((model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reassessmentTitle: { type: Type.STRING },
              targetedGapsAddressed: { type: Type.ARRAY, items: { type: Type.STRING } },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: { type: Type.INTEGER },
                    type: { type: Type.STRING },
                    commandTerm: { type: Type.STRING },
                    prompt: { type: Type.STRING },
                    context: { type: Type.STRING },
                    maxMarks: { type: Type.INTEGER },
                    cognitiveDemand: { type: Type.STRING },
                    learningObjective: { type: Type.STRING },
                    expectedAnswer: { type: Type.STRING },
                    markScheme: {
                      type: Type.OBJECT,
                      properties: {
                        points: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              point: { type: Type.STRING },
                              marks: { type: Type.INTEGER },
                            },
                            required: ['id', 'point', 'marks'],
                          },
                        },
                      },
                      required: ['points'],
                    },
                  },
                  required: ['questionNumber', 'type', 'commandTerm', 'prompt', 'maxMarks', 'expectedAnswer', 'markScheme'],
                },
              },
            },
            required: ['reassessmentTitle', 'targetedGapsAddressed', 'questions'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/targeted-reassessment:', error);
    res.status(500).json({ error: formatErrorMessage(error) });
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Curriculum Formative Assessment Server listening on port ${PORT}`);
  });
}

startServer();
