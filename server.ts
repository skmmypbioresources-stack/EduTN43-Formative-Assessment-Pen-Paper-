import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { setGlobalDispatcher, Agent } from 'undici';

dotenv.config();

// Configure undici dispatcher with extended headers & body timeouts (5 minutes)
// to prevent HeadersTimeoutError during LLM reasoning and generation
setGlobalDispatcher(
  new Agent({
    headersTimeout: 300_000,
    bodyTimeout: 300_000,
    connectTimeout: 60_000,
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

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Formative Assessment Engine' });
});

// Endpoint: Generate Formative Assessment with strict topic boundaries & validation
app.post('/api/ai/generate-formative', async (req: Request, res: Response) => {
  try {
    const { blueprint } = req.body;
    if (!blueprint) {
      return res.status(400).json({ error: 'Blueprint is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a world-class, curriculum-aware Senior Science Assessment Specialist and Chief Examiner for IBMYP Sciences (Criteria A, B, C, D), Cambridge IGCSE, and IBDP.

STRICT PEDAGOGICAL & SCIENTIFIC MANDATES:
1. SCIENTIFIC CONTEXT INTEGRITY (ABSOLUTE NON-NEGOTIABLE):
   - You MUST formulate authentic, subject-appropriate, scientifically accurate scenarios.
   - For BIOLOGY (e.g. Reproduction, Menstrual Cycle, Endocrine Control):
     * All questions, contexts, and datasets MUST center on authentic biological mechanisms: Pituitary hormones (FSH, LH), Ovarian hormones (Estrogen/Estradiol, Progesterone), Follicular phase, Ovulation on ~Day 14, Luteal phase, Corpus luteum degeneration, Endometrial thickness/shedding (Menstruation), Negative feedback (Progesterone/Estrogen inhibiting FSH/LH) and Positive feedback (Estrogen surge stimulating LH peak), Hormonal contraception (synthetic progesterone/estrogen preventing LH surge), or IVF protocols.
     * NEVER generate generic chemical reaction rate tables (e.g. "Concentration in arbitrary units vs Measured response rate") for biological/reproductive physiology! If data is required, present realistic physiological data (e.g., Blood plasma hormone concentration in mIU/mL or pg/mL vs Day of cycle 1-28, or Endometrial thickness in mm vs Day).
   - For CHEMISTRY (e.g. Rates, Stoichiometry, Energetics):
     * Datasets must specify genuine chemical reactions, reactants, realistic units (mol dm⁻³, cm³, g, s, kJ mol⁻¹).
   - For PHYSICS (e.g. Kinematics, Circuits, Waves):
     * Datasets must specify realistic physical quantities, SI units (m/s, N, V, A, Ω, Hz).

2. NO META-PROMPTING OR BOILERPLATE:
   - NEVER generate robotic sentences such as "Explain how scientific principles of 'Demonstrate scientific understanding of...' explain observed phenomena".
   - Instead, write direct, professional exam questions like: "Explain the hormonal feedback mechanism by which high concentrations of progesterone during the luteal phase inhibit the development of new ovarian follicles."

3. CURRICULUM SPECIFIC ALIGNMENT:
   - Curriculum: ${blueprint.curriculum} (${blueprint.yearGroup})
   - Subject: ${blueprint.subject}
   - Topic: ${blueprint.topic}
   - Subtopics: ${JSON.stringify(blueprint.subtopics)}
   - Learning Objectives: ${JSON.stringify(blueprint.learningObjectives)}
   ${blueprint.selectedCriterion ? `- IBMYP Criterion: ${blueprint.selectedCriterion} with Strands: ${JSON.stringify(blueprint.selectedStrands)}` : ''}
   ${blueprint.mypAssessmentMode ? `- MYP Assessment Mode: ${blueprint.mypAssessmentMode} (MYP 1-3 uses Achievement Level 0-8 descriptors; MYP 4-5 uses Mark points).` : ''}

4. QUESTION STRUCTURE & MARK SCHEMES:
   - Each question must start with an exact official Command Term ('State', 'Describe', 'Explain', 'Calculate', 'Analyse', 'Evaluate', 'Suggest', 'Design').
   - Provide a complete, rigorous mark scheme where every single mark is tied to a distinct, observable scientific point (e.g. [1] identifies FSH stimulates follicle development; [1] explains developing follicle secretes estrogen; [1] explains estrogen repairs and thickens endometrium).
   - If data tables or graph points are provided, ensure the numbers are mathematically and scientifically consistent with expected biological/chemical/physical values.`;

    const prompt = `Generate a complete formative assessment matching the blueprint.
Topic: "${blueprint.topic}"
Subtopics: ${blueprint.subtopics.join(', ')}
Learning Objectives:
${blueprint.learningObjectives.map((lo: string) => `- ${lo}`).join('\n')}

Generate exactly ${blueprint.targetQuestionCount || 5} questions with structured marking points totaling ${blueprint.maxMarks || 20} marks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/generate-formative:', error);
    res.status(500).json({ error: error.message || 'Failed to generate assessment' });
  }
});

// Endpoint: Strict Examiner AI Marking Engine & Learning-Gap Diagnosis
app.post('/api/ai/mark-submission', async (req: Request, res: Response) => {
  try {
    const { assessment, responses, studentName } = req.body;
    if (!assessment || !responses) {
      return res.status(400).json({ error: 'Assessment and responses are required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a STRICT, EXPERIENCED SENIOR EXAMINER for ${assessment.blueprint.curriculum} Sciences (${assessment.blueprint.yearGroup}).
ABSOLUTE MARKING DIRECTIVES:
1. Be STRICT and CONSERVATIVE. Never award marks because an answer "sounds plausible" or has general good intent.
2. Award marks ONLY for explicit, unambiguous demonstrated evidence matching the mark scheme or MYP descriptor.
3. If an answer uses vague phrases (e.g. "sugar sucks water" instead of "water potential gradient") or misses units, DEDUCT/WITHHOLD the mark.
4. For each question, output:
   - marksAwarded & maxMarks
   - list of markingPoints with exact boolean isAwarded, evidenceFound (quote student), or missingReason
   - whatWasCorrect (specific demonstrated knowledge)
   - whatWasMissing (exact missing scientific requirement)
   - scientificErrorsIdentified (e.g. misconceptions, conflating reliability with validity, incorrect units)
   - whyMarksWereLost (honest, transparent feedback)
   - howToImprove (actionable next step)
5. Generate an overall Learning Gap Diagnosis:
   - Strengths (demonstrated mastery)
   - Learning Gaps (skills/concepts not demonstrated with evidence)
   - Misconceptions (identified incorrect scientific models with scientific truth and correction strategy)
   - Priority Improvement Target (the single most important next target).`;

    const prompt = `Mark the following student submission strictly:
Student Name: ${studentName || 'Student'}
Curriculum: ${assessment.blueprint.curriculum} (${assessment.blueprint.yearGroup})
Topic: ${assessment.blueprint.topic}
Learning Objectives: ${JSON.stringify(assessment.blueprint.learningObjectives)}

Assessment Questions and Mark Schemes:
${JSON.stringify(assessment.questions, null, 2)}

Student Responses:
${JSON.stringify(responses, null, 2)}

Evaluate each response rigorously against its mark scheme. Do not be generous.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/mark-submission:', error);
    res.status(500).json({ error: error.message || 'Failed to mark submission' });
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

    const systemInstruction = `You are creating a TARGETED REASSESSMENT formative.
Purpose: Focus strictly on the student's identified learning gaps and misconceptions using a FRESH, NEW authentic scientific context.
Do NOT repeat the original questions. Reassess the same core learning objective through a different practical or conceptual angle.
Curriculum: ${originalBlueprint.curriculum} (${originalBlueprint.yearGroup})
Topic: ${originalBlueprint.topic}
Diagnosed Gaps: ${JSON.stringify(learningGaps)}
Diagnosed Misconceptions: ${JSON.stringify(misconceptions)}

Generate a focused 3-question formative assessment with complete mark schemes.`;

    const prompt = `Generate a 3-question targeted intervention assessment for ${studentName || 'the student'} targeting these weaknesses:
${learningGaps.map((g: any) => `- Gap: ${g.gap || g} | Next Step: ${g.nextStep || ''}`).join('\n')}

Topic: ${originalBlueprint.topic}
Subtopics: ${originalBlueprint.subtopics.join(', ')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai/targeted-reassessment:', error);
    res.status(500).json({ error: error.message || 'Failed to create targeted reassessment' });
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
