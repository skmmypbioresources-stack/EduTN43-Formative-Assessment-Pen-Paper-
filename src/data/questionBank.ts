import { Question, CurriculumType, Subject, YearGroup } from '../types';

export interface BankQuestionItem extends Question {
  curriculum: CurriculumType;
  yearGroup: YearGroup;
  subject: Subject;
  topic: string;
  subtopic: string;
  createdAt: string;
  author: string;
  usageCount: number;
}

export const QUESTION_BANK: BankQuestionItem[] = [
  {
    id: 'bank-q1',
    curriculum: 'IBMYP',
    yearGroup: 'MYP 5',
    subject: 'Biology',
    topic: 'Transport in Cells',
    subtopic: 'Osmosis & Water Potential',
    questionNumber: 1,
    type: 'extended_response',
    commandTerm: 'Explain',
    prompt: 'Explain the physiological response of red blood cells (erythrocytes) when placed in a 0.1% sodium chloride (hypotonic) solution compared to plant root hair cells in the same solution.',
    maxMarks: 4,
    cognitiveDemand: 'Analysis',
    learningObjective: 'Predict and explain the effects of placing plant and animal cells in hypertonic, hypotonic, and isotonic solutions',
    criterion: 'Criterion A',
    strands: ['A(i)', 'A(ii)'],
    expectedAnswer: 'In hypotonic solution, water enters both cells down the water potential gradient by osmosis. In red blood cells (lacking a rigid cellulose cell wall), excessive hydrostatic pressure causes the delicate plasma membrane to rupture (haemolysis/lysis). In plant cells, the rigid cellulose cell wall withstands internal turgor pressure, preventing lysis and rendering the cell fully turgid.',
    markScheme: {
      points: [
        { id: 'bp-1-1', point: 'Water moves into both cells down water potential gradient by osmosis', marks: 1 },
        { id: 'bp-1-2', point: 'RBCs lack cell wall and lyse / burst due to internal osmotic pressure', marks: 1 },
        { id: 'bp-1-3', point: 'Plant cells have rigid cellulose cell wall preventing lysis', marks: 1 },
        { id: 'bp-1-4', point: 'Plant cells become turgid with high wall pressure', marks: 1 },
      ],
    },
    author: 'Dr. Sarah Jenkins',
    createdAt: '2026-08-15T10:00:00Z',
    usageCount: 8,
  },
  {
    id: 'bank-q2',
    curriculum: 'IBMYP',
    yearGroup: 'MYP 5',
    subject: 'Biology',
    topic: 'Transport in Cells',
    subtopic: 'Diffusion & Concentration Gradients',
    questionNumber: 2,
    type: 'experimental_design',
    commandTerm: 'Design',
    prompt: 'Design a safe, logical and complete laboratory investigation to test how surface area-to-volume ratio affects the rate of diffusion in phenolphthalein-agar blocks immersed in 0.1 mol dm⁻³ sulfuric acid.',
    maxMarks: 6,
    cognitiveDemand: 'Design',
    learningObjective: 'Explain how concentration gradients, temperature, and surface area affect the rate of diffusion',
    criterion: 'Criterion B',
    strands: ['B(i)', 'B(ii)', 'B(iii)', 'B(iv)'],
    expectedAnswer: 'Independent variable: SA:V ratio (agar cubes of 0.5 cm, 1.0 cm, 2.0 cm sides). Dependent variable: Distance diffused by acid in 10 minutes (or time for complete decolourization). Controlled variables: acid concentration (0.1 M), temperature (22°C), volume of acid (50 cm³). Materials: scalpel, ruler, agar, acid, beaker, stopwatch. Safety: safety goggles and gloves for acid. Method: cut blocks, immerse simultaneously, remove at 10 min, measure depth of clear margin with digital caliper, repeat 3 times.',
    markScheme: {
      points: [
        { id: 'bp-2-1', point: 'Clearly identifies independent variable with 3+ dimensions (0.5, 1.0, 2.0 cm)', marks: 1 },
        { id: 'bp-2-2', point: 'Identifies measurable dependent variable with units (depth in mm or time in s)', marks: 1 },
        { id: 'bp-2-3', point: 'Identifies 3 controlled variables (temp, acid conc, volume)', marks: 1 },
        { id: 'bp-2-4', point: 'Provides step-by-step logical numbered procedure', marks: 1 },
        { id: 'bp-2-5', point: 'Includes repeats for reliability (minimum 3 repeats per block size)', marks: 1 },
        { id: 'bp-2-6', point: 'Specifies safety precautions for acid handling and scalpel usage', marks: 1 },
      ],
    },
    author: 'Dr. Sarah Jenkins',
    createdAt: '2026-08-16T14:20:00Z',
    usageCount: 5,
  },
  {
    id: 'bank-q3',
    curriculum: 'IBMYP',
    yearGroup: 'MYP 3',
    subject: 'Biology',
    topic: 'Transport in Cells',
    subtopic: 'Osmosis & Water Potential',
    questionNumber: 3,
    type: 'extended_response',
    commandTerm: 'Explain',
    prompt: 'Explain what will happen to fresh potato strips placed in concentrated saltwater compared to potato strips placed in pure tap water.',
    maxMarks: 4,
    cognitiveDemand: 'Understanding',
    learningObjective: 'Predict and explain the effects of placing plant and animal cells in hypertonic, hypotonic, and isotonic solutions',
    criterion: 'Criterion A',
    strands: ['A(i)', 'A(ii)'],
    expectedAnswer: 'In concentrated saltwater, water moves out of the potato cells by osmosis because the saltwater has lower water potential. The cells become limp/flaccid and the strip becomes soft and bendy. In pure water, water enters the cells by osmosis, making the cells firm and turgid.',
    markScheme: {
      points: [
        { id: 'bp-3-1', point: 'Identifies osmosis as water movement process', marks: 1 },
        { id: 'bp-3-2', point: 'Water moves OUT in saltwater making strip limp/soft', marks: 1 },
        { id: 'bp-3-3', point: 'Water moves IN in pure water making strip firm/turgid', marks: 1 },
        { id: 'bp-3-4', point: 'States partially permeable membrane controls water movement', marks: 1 },
      ],
    },
    author: 'Marcus Vance',
    createdAt: '2026-08-12T09:15:00Z',
    usageCount: 12,
  },
  {
    id: 'bank-q4',
    curriculum: 'IGCSE',
    yearGroup: 'FM3',
    subject: 'Chemistry',
    topic: 'Rates of Chemical Reaction',
    subtopic: 'Collision Theory & Reaction Rates',
    questionNumber: 1,
    type: 'mcq',
    commandTerm: 'Identify',
    prompt: 'Why does increasing the concentration of hydrochloric acid increase the rate of reaction with calcium carbonate marble chips?',
    options: [
      { id: 'A', text: 'It increases the activation energy of the reacting particles.', isCorrect: false },
      { id: 'B', text: 'There are more reactant particles per unit volume, increasing collision frequency.', isCorrect: true },
      { id: 'C', text: 'It increases the average kinetic energy of the acid particles.', isCorrect: false },
      { id: 'D', text: 'It changes the molecular mass of the marble chips.', isCorrect: false },
    ],
    maxMarks: 1,
    cognitiveDemand: 'Recall',
    learningObjective: 'Describe the effect of concentration, pressure, and surface area on the frequency of successful particle collisions',
    expectedAnswer: 'B',
    markScheme: {
      points: [{ id: 'bp-4-1', point: 'Correct option selected: B', marks: 1 }],
    },
    author: 'Dr. Sarah Jenkins',
    createdAt: '2026-08-18T11:00:00Z',
    usageCount: 15,
  },
];
