import { CurriculumType, Subject, MYPCriterion, CriterionStrand, YearGroup, ALL_SUBJECTS } from '../types';

export interface CurriculumConfig {
  id: CurriculumType;
  name: string;
  description: string;
  yearGroups: YearGroup[];
  subjects: Subject[];
}

export const CURRICULA: Record<CurriculumType, CurriculumConfig> = {
  IBMYP: {
    id: 'IBMYP',
    name: 'IB Middle Years Programme (IBMYP)',
    description: 'Sciences assessment framework with Criteria A, B, C, D (Levels 0-8 for MYP 1-3; Mark-based for MYP 4-5)',
    yearGroups: ['MYP 2 Science', 'MYP 4 Bio', 'MYP 5 Bio', 'MYP 1', 'MYP 3'],
    subjects: ALL_SUBJECTS,
  },
  IGCSE: {
    id: 'IGCSE',
    name: 'Cambridge IGCSE Sciences',
    description: 'Rigorous 3-section formative structure (15 MCQs + 5 Structured + 5 Data-Based Questions)',
    yearGroups: ['FM4', 'FM5', 'FM1', 'FM2', 'FM3'],
    subjects: ALL_SUBJECTS,
  },
  IBDP: {
    id: 'IBDP',
    name: 'IB Diploma Programme (IBDP)',
    description: 'Advanced assessment objectives (AO1, AO2, AO3) with structured, experimental & evaluative papers',
    yearGroups: ['IBDP1', 'IBDP2'],
    subjects: ALL_SUBJECTS,
  },
};

export const MYP_CRITERIA_INFO: Record<MYPCriterion, { title: string; focus: string; strands: CriterionStrand[] }> = {
  'Criterion A': {
    title: 'Knowing and understanding',
    focus: 'Scientific knowledge recall, explanation, problem solving in familiar and unfamiliar contexts, and analysis of information to make scientifically supported judgments.',
    strands: [
      {
        id: 'A(i)',
        title: 'Outline & explain scientific knowledge',
        description: 'State, outline, or explain scientific knowledge and concepts accurately using appropriate terminology.',
      },
      {
        id: 'A(ii)',
        title: 'Apply scientific knowledge and understanding',
        description: 'Apply scientific knowledge and understanding to solve problems in both familiar and unfamiliar situations.',
      },
      {
        id: 'A(iii)',
        title: 'Analyse and evaluate information',
        description: 'Analyse and evaluate information to make scientifically supported judgments and conclusions.',
      },
    ],
  },
  'Criterion B': {
    title: 'Inquiring and designing',
    focus: 'Authentic scientific inquiry, research questions, testable hypotheses with scientific reasoning, manipulation of variables, and safe, logical, complete investigation design.',
    strands: [
      {
        id: 'B(i)',
        title: 'Formulate a testable question / problem',
        description: 'State, outline, or formulate a focused scientific research question or problem to be tested.',
      },
      {
        id: 'B(ii)',
        title: 'Formulate and explain a hypothesis',
        description: 'Formulate a testable hypothesis and explain it using sound scientific reasoning.',
      },
      {
        id: 'B(iii)',
        title: 'Manipulate variables and describe data collection',
        description: 'Identify and outline how to manipulate the independent variable, measure dependent variable, and control relevant variables with sufficient repeats.',
      },
      {
        id: 'B(iv)',
        title: 'Design a safe, logical and complete method',
        description: 'Design a detailed, logical, safe, and complete experimental method including materials and risk assessments.',
      },
    ],
  },
  'Criterion C': {
    title: 'Processing and evaluating',
    focus: 'Authentic data transformation, tables, graphs, calculations, trend analysis, anomaly detection, hypothesis evaluation, method evaluation, and justified improvements.',
    strands: [
      {
        id: 'C(i)',
        title: 'Present collected and transformed data',
        description: 'Present raw and processed data in correctly formatted, titled tables and appropriately scaled graphs with units.',
      },
      {
        id: 'C(ii)',
        title: 'Interpret data and explain results',
        description: 'Accurately interpret data, identify patterns, trends and anomalies, and explain results using scientific reasoning.',
      },
      {
        id: 'C(iii)',
        title: 'Evaluate the validity of a hypothesis',
        description: 'Evaluate the validity of a hypothesis based on the analysis of the experimental data.',
      },
      {
        id: 'C(iv)',
        title: 'Evaluate the validity of the method',
        description: 'Evaluate the reliability, precision, and validity of the experimental method and identify limitations.',
      },
      {
        id: 'C(v)',
        title: 'Explain improvements and extensions',
        description: 'Explain realistic improvements to the investigation and suggest logical scientific extensions.',
      },
    ],
  },
  'Criterion D': {
    title: 'Reflecting on the impacts of science',
    focus: 'Application of science to address specific global/local issues, discussing implications (moral, ethical, social, economic, environmental), scientific communication, and documentation.',
    strands: [
      {
        id: 'D(i)',
        title: 'Summarise / explain scientific applications',
        description: 'Summarise or explain the ways in which science is applied and used to address a specific problem or issue.',
      },
      {
        id: 'D(ii)',
        title: 'Discuss and evaluate implications of science',
        description: 'Describe, discuss, or evaluate the implications of using science and its application to solve a problem (social, economic, ethical, environmental).',
      },
      {
        id: 'D(iii)',
        title: 'Apply scientific language effectively',
        description: 'Consistently apply appropriate scientific language and terminology to communicate understanding clearly.',
      },
      {
        id: 'D(iv)',
        title: 'Document the work of others and sources',
        description: 'Document the work of others and sources of information used using recognized referencing conventions.',
      },
    ],
  },
};

export const MYP_YEAR_DESCRIPTORS: Record<string, Record<string, { band: string; descriptor: string; expectations: string }[]>> = {
  'MYP 1': {
    'Criterion A': [
      { band: '1-2', descriptor: 'States scientific knowledge with limited accuracy; applies knowledge to solve simple familiar problems.', expectations: 'Recall basic facts; minimal scientific vocabulary.' },
      { band: '3-4', descriptor: 'Outlines scientific knowledge; applies scientific knowledge to solve familiar problems with occasional guidance.', expectations: 'Outlines concepts; applies to standard textbook scenarios.' },
      { band: '5-6', descriptor: 'Describes scientific knowledge; applies scientific knowledge to solve familiar and unfamiliar problems.', expectations: 'Clear description; applies concepts to new simple contexts.' },
      { band: '7-8', descriptor: 'Explains scientific knowledge; applies scientific knowledge to solve complex problems; analyses information to make judgments.', expectations: 'Detailed scientific reasoning; fully supported judgments.' },
    ],
    'Criterion C': [
      { band: '1-2', descriptor: 'Collects and presents data in simple lists or basic tables; states whether data supports prediction.', expectations: 'Basic table without complete units; simple binary claim.' },
      { band: '3-4', descriptor: 'Correctly organizes data in tables and simple graphs; outlines patterns in data; states validity of prediction.', expectations: 'Correct axis labels; identifies simple increase/decrease trends.' },
      { band: '5-6', descriptor: 'Presents data accurately in tables and graphs; describes trends and relationships using scientific reasoning; suggests simple improvements.', expectations: 'Accurate scale and units; calculates simple means; identifies 1-2 practical errors.' },
      { band: '7-8', descriptor: 'Correctly transforms and presents data in clear tables and graphs; explains results using scientific knowledge; evaluates method and explains realistic improvements.', expectations: 'Thorough data analysis; discusses anomalies; specific justified method improvements.' },
    ],
  },
  'MYP 3': {
    'Criterion A': [
      { band: '1-2', descriptor: 'Outlines scientific knowledge; applies knowledge to suggest solutions to familiar problems.', expectations: 'Basic recall with partial clarity; identifies simple concepts.' },
      { band: '3-4', descriptor: 'Describes scientific knowledge; applies scientific knowledge to solve familiar problems.', expectations: 'Structured descriptions; applies to familiar practical scenarios.' },
      { band: '5-6', descriptor: 'Explains scientific knowledge; applies understanding to solve unfamiliar problems; interprets information.', expectations: 'Explains mechanisms; handles unfamiliar scenarios with logical deduction.' },
      { band: '7-8', descriptor: 'Explains scientific knowledge with depth and precision; solves complex unfamiliar problems; critically analyses information to make scientifically sound judgments.', expectations: 'Rigorous multi-step explanations; insightful synthesis.' },
    ],
    'Criterion C': [
      { band: '1-2', descriptor: 'Presents data in basic tables; states a simple conclusion; identifies a basic flaw.', expectations: 'Data organized with partial headings; broad conclusion.' },
      { band: '3-4', descriptor: 'Correctly organizes and transforms data; outlines trends; states whether hypothesis is supported; outlines method limitations.', expectations: 'Calculates mean/rate; plot line/bar graph correctly; identifies standard equipment limitations.' },
      { band: '5-6', descriptor: 'Accurately transforms data into tables and graphs; describes trends and explains patterns using scientific reasoning; evaluates hypothesis; suggests realistic improvements.', expectations: 'Consistent significant figures; thorough trend explanations with scientific terminology; evaluates method validity.' },
      { band: '7-8', descriptor: 'Transforms and presents data impeccably; explains nuanced patterns and anomalies; thoroughly evaluates hypothesis validity based on evidence; comprehensively evaluates method validity and explains realistic improvements and extensions.', expectations: 'Exemplary data presentation; rigorous evaluation of systematic/random errors; insightful experimental extensions.' },
    ],
  },
  'MYP 5': {
    'Criterion A': [
      { band: '1-2', descriptor: 'States scientific knowledge; applies knowledge to solve simple familiar problems.', expectations: 'Basic terminology; limited depth.' },
      { band: '3-4', descriptor: 'Outlines scientific knowledge; applies scientific knowledge to solve familiar problems; interprets information to make simple judgments.', expectations: 'Sound outline; applies concepts systematically to standard problems.' },
      { band: '5-6', descriptor: 'Describes scientific knowledge; applies scientific knowledge to solve complex familiar and unfamiliar problems; analyses information to make scientifically supported judgments.', expectations: 'Detailed mechanisms; solves multi-step unfamiliar quantitative and qualitative problems.' },
      { band: '7-8', descriptor: 'Explains scientific knowledge thoroughly with sophisticated terminology; applies knowledge to solve complex unfamiliar problems; critically evaluates information to make scientifically supported judgments.', expectations: 'Mastery of scientific concepts; rigorous critique of evidence and models.' },
    ],
    'Criterion C': [
      { band: '1-2', descriptor: 'Presents data with errors; states a basic conclusion with little reference to data.', expectations: 'Minimal transformation; superficial statements.' },
      { band: '3-4', descriptor: 'Correctly organizes and presents data; outlines relationships; states hypothesis validity; outlines procedural limitations.', expectations: 'Tables with uncertainty/units; plots lines of best fit; identifies standard procedural limitations.' },
      { band: '5-6', descriptor: 'Accurately transforms data into complex tables/graphs; explains trends using scientific reasoning; thoroughly evaluates hypothesis validity; evaluates method validity and explains realistic improvements.', expectations: 'Calculates rates, gradients, percentages; detailed anomalous data analysis; robust critique of apparatus and variables.' },
      { band: '7-8', descriptor: 'Presents transformed data impeccably in appropriate formats; critically interprets complex patterns and anomalies with scientific theory; comprehensively evaluates hypothesis validity based on data consistency; critically evaluates method validity (precision, reliability, accuracy) and explains realistic improvements and scientifically sound extensions.', expectations: 'Examiner-grade data analysis; quantitative error analysis; sophisticated evaluation of validity and novel experimental extensions.' },
    ],
  },
};

export const COMMAND_TERMS = [
  { term: 'State', definition: 'Give a specific name, value or other brief answer without explanation or calculation.', cognitiveDemand: 'Recall' },
  { term: 'Define', definition: 'Give the precise meaning of a word, phrase, concept or physical quantity.', cognitiveDemand: 'Recall' },
  { term: 'Identify', definition: 'Provide an answer from a number of possibilities. Recognize and state briefly a distinguishing factor.', cognitiveDemand: 'Recall' },
  { term: 'Describe', definition: 'Give a detailed account or picture of a situation, event, pattern or process.', cognitiveDemand: 'Understanding' },
  { term: 'Outline', definition: 'Give a brief summary of the essential features or general principles.', cognitiveDemand: 'Understanding' },
  { term: 'Explain', definition: 'Give a detailed account including reasons or causes. Make clear the relationship between factors.', cognitiveDemand: 'Application' },
  { term: 'Calculate', definition: 'Perform mathematical steps to arrive at a numerical answer from data, showing working and units.', cognitiveDemand: 'Application' },
  { term: 'Compare', definition: 'Give an account of the similarities and differences between two (or more) items or situations.', cognitiveDemand: 'Analysis' },
  { term: 'Analyse', definition: 'Break down in order to bring out the essential elements or structure, identifying parts and relationships.', cognitiveDemand: 'Analysis' },
  { term: 'Evaluate', definition: 'Make an appraisal by weighing up the strengths and limitations, evidence and counter-arguments.', cognitiveDemand: 'Evaluation' },
  { term: 'Justify', definition: 'Give valid reasons or evidence to support an answer, conclusion or statement.', cognitiveDemand: 'Evaluation' },
  { term: 'Design', definition: 'Produce a plan, simulation or model that addresses a specific scientific inquiry.', cognitiveDemand: 'Design' },
  { term: 'Suggest', definition: 'Propose a solution, hypothesis or other possible answer based on scientific principles.', cognitiveDemand: 'Evaluation' },
];

export const MYP_KEY_CONCEPTS = [
  'Relationships',
  'Systems',
  'Change',
  'Form',
  'Function',
  'Development',
  'Connections',
  'Global interactions',
  'Perspective',
  'Time, place and space',
  'Communication',
  'Communities',
  'Culture',
  'Creativity',
  'Logic',
];

export const MYP_RELATED_CONCEPTS_SCIENCES = [
  'Balance',
  'Consequences',
  'Energy',
  'Environment',
  'Evidence',
  'Form',
  'Function',
  'Interaction',
  'Models',
  'Movement',
  'Patterns',
  'Transformation',
];

export const MYP_GLOBAL_CONTEXTS = [
  'Scientific and technical innovation',
  'Globalization and sustainability',
  'Identities and relationships',
  'Orientation in space and time',
  'Personal and cultural expression',
  'Fairness and development',
];

