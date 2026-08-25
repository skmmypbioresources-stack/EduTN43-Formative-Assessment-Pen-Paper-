import { Subject, CurriculumType } from '../types';

export interface SyllabusTopicPreset {
  id: string;
  subject: Subject;
  topic: string;
  subtopics: string[];
  learningObjectives: string[];
  suggestedCriterion: 'Criterion A' | 'Criterion B' | 'Criterion C' | 'Criterion D';
  authenticContextSample: string;
}

export const SCIENCE_SYLLABUS_PRESETS: SyllabusTopicPreset[] = [
  // BIOLOGY: Cell Structure, Organelles & Specialized Cells
  {
    id: 'bio-cell-structure-specialized',
    subject: 'Biology',
    topic: 'Cell Structure, Organelles and Specialized Cells',
    subtopics: [
      'Basic Cell Structures (Nucleus, Cytoplasm, Cell Membrane, Mitochondria, Ribosomes)',
      'Plant Cell Features (Cell Wall, Large Central Vacuole, Chloroplasts)',
      'Specialized Plant Cells: Root Hair Cells (Elongated shape for SA:V, absorption, no chloroplasts)',
      'Specialized Animal Cells: Red Blood Cells / Erythrocytes (Biconcave disc, lack of nucleus, hemoglobin, capillary passage)',
      'Structure-Function Relationships in Specialized Cells',
    ],
    learningObjectives: [
      'Identify and describe the functions of basic cellular organelles in plant and animal cells',
      'Explain how the structural adaptations of root hair cells increase surface area for the uptake of water and mineral ions',
      'Explain how the structural adaptations of red blood cells (biconcave disc shape, absence of nucleus, hemoglobin) optimize oxygen transport',
      'Compare the presence and absence of specific organelles between specialized cells and generalized cells',
    ],
    suggestedCriterion: 'Criterion A',
    authenticContextSample:
      'Microscopic examination of specialized plant (root hair cell) and mammalian blood (erythrocyte) specimens under light and electron microscopy comparing structural adaptations to specialized physiological functions.',
  },
  // BIOLOGY: Reproduction & Menstrual Cycle
  {
    id: 'bio-reproduction-menstrual',
    subject: 'Biology',
    topic: 'Reproduction and the Menstrual Cycle',
    subtopics: [
      'Hormonal Control of the Menstrual Cycle (FSH, LH, Estrogen, Progesterone)',
      'Follicular and Luteal Phases of the Ovarian Cycle',
      'Negative and Positive Feedback Mechanisms in Human Reproduction',
      'Endometrial Changes and Uterine Preparation',
      'Fertility Treatments and Hormonal Contraception',
    ],
    learningObjectives: [
      'Explain the roles and interactions of pituitary hormones (FSH, LH) and ovarian hormones (estrogen, progesterone) during a 28-day cycle',
      'Analyze graphical data of hormone concentrations across the menstrual cycle to deduce the timing of ovulation and menstruation',
      'Explain how negative feedback maintains homeostasis and how a positive feedback surge of estrogen triggers ovulation',
      'Evaluate the physiological mechanism and ethical/social implications of hormonal contraceptives and in-vitro fertilization (IVF)',
    ],
    suggestedCriterion: 'Criterion A',
    authenticContextSample:
      'A clinical investigation measures daily serum concentrations of luteinizing hormone (LH), follicle-stimulating hormone (FSH), 17β-estradiol (estrogen), and progesterone in an adult female across a standardized 28-day menstrual cycle.',
  },
  // BIOLOGY: Cell Transport & Osmosis
  {
    id: 'bio-cell-transport',
    subject: 'Biology',
    topic: 'Membrane Transport and Osmosis',
    subtopics: [
      'Diffusion and Factors Affecting Net Rate of Movement',
      'Osmosis and Water Potential Across Selectively Permeable Membranes',
      'Active Transport and Membrane Carrier Proteins',
      'Surface Area to Volume Ratio and Cell Size Limitations',
    ],
    learningObjectives: [
      'Explain the passive movement of water molecules down water potential gradients using dialysis (visking) tubing and plant tissue models',
      'Calculate percentage change in mass and determine the isotonic point of plant tissues from graphical data',
      'Evaluate experimental variables in potato cylinder osmometry to minimize systematic and random measurement errors',
    ],
    suggestedCriterion: 'Criterion C',
    authenticContextSample:
      'Uniform potato tissue cores (Solanum tuberosum) are immersed in sucrose solutions ranging from 0.0 mol dm⁻³ to 1.0 mol dm⁻³ to determine tissue osmolarity and water potential.',
  },
  // BIOLOGY: Enzymes & Biological Catalysis
  {
    id: 'bio-enzymes',
    subject: 'Biology',
    topic: 'Enzymes and Metabolic Reactions',
    subtopics: [
      'Lock-and-Key and Induced-Fit Catalytic Mechanisms',
      'Effects of Temperature, pH, and Substrate Concentration on Enzyme Kinetics',
      'Competitive and Non-Competitive Enzyme Inhibition',
      'Denaturation and Disruption of Tertiary Protein Structure',
    ],
    learningObjectives: [
      'Explain how temperature and pH affect enzyme activity by altering active site conformation and kinetic collision frequency',
      'Analyze initial rate data for catalase or amylase to calculate reaction velocity and determine optimum conditions',
      'Design a controlled investigation testing the effect of heavy metal inhibitors on enzyme activity with valid control of confounding variables',
    ],
    suggestedCriterion: 'Criterion B',
    authenticContextSample:
      'Yeast catalase activity is investigated by collecting oxygen gas evolved over 60 seconds at controlled temperatures from 10°C to 70°C in a water bath.',
  },
  // BIOLOGY: Photosynthesis & Respiration
  {
    id: 'bio-bioenergetics',
    subject: 'Biology',
    topic: 'Photosynthesis and Cellular Respiration',
    subtopics: [
      'Light-Dependent and Light-Independent Reactions',
      'Limiting Factors of Photosynthesis (Light, CO₂, Temperature)',
      'Aerobic Cellular Respiration and ATP Production',
      'Anaerobic Fermentation in Yeast and Muscle Tissue',
    ],
    learningObjectives: [
      'Explain how light intensity, carbon dioxide concentration, and temperature act as limiting factors on the rate of photosynthesis',
      'Interpret respirometer data to calculate respiratory quotients (RQ) and oxygen consumption rates in germinating seeds',
    ],
    suggestedCriterion: 'Criterion C',
    authenticContextSample:
      'Elodea (pondweed) shoots are placed in sodium hydrogencarbonate solution at varied distances from an LED light source to measure O₂ bubble evolution per minute.',
  },
  // BIOLOGY: Genetics & Inheritance
  {
    id: 'bio-genetics',
    subject: 'Biology',
    topic: 'Inheritance, Meiosis and Biotechnology',
    subtopics: [
      'Meiosis, Crossing Over and Production of Haploid Gametes',
      'Monohybrid Inheritance, Codominance and Sex-Linkage',
      'Pedigree Charts and Phenotypic Ratios',
      'Polymerase Chain Reaction (PCR) and Gel Electrophoresis',
    ],
    learningObjectives: [
      'Construct and analyze Punnett squares to predict genotype and phenotype frequencies in monohybrid and sex-linked crosses',
      'Evaluate genetic screening technologies and the ethical implications of CRISPR gene editing in human embryos',
    ],
    suggestedCriterion: 'Criterion D',
    authenticContextSample:
      'Pedigree data for a family lineage expressing X-linked color blindness is analyzed across three generations to deduce maternal carrier genotypes.',
  },

  // CHEMISTRY: Rates of Reaction
  {
    id: 'chem-rates',
    subject: 'Chemistry',
    topic: 'Rates of Chemical Reaction and Collision Theory',
    subtopics: [
      'Collision Theory and Activation Energy (Maxwell-Boltzmann Distribution)',
      'Factors Affecting Reaction Rate (Concentration, Temperature, Surface Area, Catalysts)',
      'Experimental Methods for Tracking Reaction Rates (Gas Syringe, Disappearing Cross, Mass Loss)',
    ],
    learningObjectives: [
      'Explain how increasing temperature and concentration increases reaction rate using kinetic collision theory and activation energy',
      'Calculate instantaneous rates of reaction by drawing tangents to curve graphs of volume vs time',
      'Evaluate experimental limitations in the sodium thiosulfate and hydrochloric acid disappearing cross reaction',
    ],
    suggestedCriterion: 'Criterion C',
    authenticContextSample:
      'Hydrochloric acid reacts with calcium carbonate chips in a conical flask on an electronic balance to track CO₂ mass loss over 300 seconds at 0.5, 1.0, and 2.0 mol dm⁻³.',
  },
  // CHEMISTRY: Stoichiometry & Quantitative Chemistry
  {
    id: 'chem-stoichiometry',
    subject: 'Chemistry',
    topic: 'Stoichiometry, Moles and Titrations',
    subtopics: [
      'Molar Mass, Empirical and Molecular Formulas',
      'Reacting Masses, Limiting Reagents, and Percentage Yield',
      'Acid-Base Volumetric Titrations and Concentration Calculations',
      'Ideal Gas Law and Molar Gas Volume at STP',
    ],
    learningObjectives: [
      'Perform stoichiometric calculations to determine limiting reagents and percentage yields from experimental mass data',
      'Determine the concentration of an unknown acid from concordant titration volumes within ±0.10 cm³',
    ],
    suggestedCriterion: 'Criterion A',
    authenticContextSample:
      'Standardized 0.100 mol dm⁻³ sodium hydroxide is titrated against 25.00 cm³ aliquots of ethanoic acid (vinegar) using phenolphthalein indicator.',
  },

  // PHYSICS: Forces, Kinematics and Newton's Laws
  {
    id: 'phys-forces',
    subject: 'Physics',
    topic: 'Kinematics, Dynamics and Newton’s Laws of Motion',
    subtopics: [
      'Velocity-Time Graphs, Acceleration, and Displacement Calculations',
      'Newton’s Three Laws of Motion and Free-Body Force Diagrams',
      'Terminal Velocity, Drag Forces and Friction',
      'Conservation of Linear Momentum and Kinetic Energy in Collisions',
    ],
    learningObjectives: [
      'Calculate acceleration and displacement from velocity-time graphs using gradients and area under the curve',
      'Apply Newton’s second law (F = ma) to evaluate motion in systems with unbalanced forces and friction',
      'Design a light-gate inquiry to verify the relationship between accelerating force and mass on a dynamics trolley',
    ],
    suggestedCriterion: 'Criterion B',
    authenticContextSample:
      'A dynamics trolley of known mass is accelerated across a horizontal track by hanging slotted masses over a frictionless pulley with dual photogate timers.',
  },
  // PHYSICS: Electricity and Circuits
  {
    id: 'phys-electricity',
    subject: 'Physics',
    topic: 'Current Electricity, Ohm’s Law and Circuit Analysis',
    subtopics: [
      'Current, Potential Difference, and Resistance Relationships (Ohm’s Law)',
      'Series and Parallel Circuit Rules (Kirchhoff’s Laws)',
      'Current-Voltage (I-V) Characteristics of Ohmic Resistors, Filament Lamps, and Diodes',
      'Electrical Power, Energy Dissipation, and Internal Resistance',
    ],
    learningObjectives: [
      'Determine the resistance and verify Ohm’s law from current and potential difference measurements across varied components',
      'Calculate total equivalent resistance, branch currents, and potential drops in combination circuits',
    ],
    suggestedCriterion: 'Criterion C',
    authenticContextSample:
      'A circuit with a variable DC power supply, digital ammeter, and digital voltmeter is used to record I-V data points for a 6V filament lamp up to operating potential.',
  },
];

export function findSyllabusPreset(subject: Subject, topicKeyword: string): SyllabusTopicPreset | undefined {
  const clean = topicKeyword.toLowerCase().trim();
  if (!clean) return undefined;

  const subjectPresets = SCIENCE_SYLLABUS_PRESETS.filter(
    (p) => p.subject.toLowerCase() === subject.toLowerCase()
  );

  // 1. Exact or near-exact topic match
  const exactMatch = subjectPresets.find(
    (p) => p.topic.toLowerCase() === clean || clean.includes(p.topic.toLowerCase())
  );
  if (exactMatch) return exactMatch;

  // 2. Specific topic keyword disambiguation for Biology
  if (subject.toLowerCase() === 'biology') {
    if (
      clean.includes('organelle') ||
      clean.includes('root hair') ||
      clean.includes('rbc') ||
      clean.includes('red blood') ||
      clean.includes('specialized cell') ||
      (clean.includes('structure') && clean.includes('cell'))
    ) {
      return subjectPresets.find((p) => p.id === 'bio-cell-structure-specialized');
    }
    if (clean.includes('osmo') || clean.includes('dialysis') || clean.includes('visking') || clean.includes('water potential')) {
      return subjectPresets.find((p) => p.id === 'bio-cell-transport');
    }
  }

  // 3. Fallback to subtopic keyword matching
  return subjectPresets.find((p) =>
    p.subtopics.some((s) => s.toLowerCase().includes(clean) || clean.includes(s.toLowerCase()))
  );
}
