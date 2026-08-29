import { FormativeAssessment, Submission, FormativeBlueprint } from '../types';
import { findSyllabusPreset } from '../data/scienceSyllabus';

export class ReportGenerator {
  /**
   * Intelligently resolves Key Concept and Global Context for the assessment report
   */
  static resolveKeyConceptAndGlobalContext(bp: FormativeBlueprint): {
    keyConcept: string;
    globalContext: string;
    relatedConcepts?: string[];
    statementOfInquiry?: string;
  } {
    const preset = findSyllabusPreset(bp.subject, bp.topic || '');
    
    // 1. Key Concept resolution
    let keyConcept = bp.keyConcept?.trim() || preset?.keyConcept || '';
    if (!keyConcept) {
      const topicLower = (bp.topic + ' ' + (bp.subtopics || []).join(' ')).toLowerCase();
      if (
        topicLower.includes('reaction') ||
        topicLower.includes('rate') ||
        topicLower.includes('kinetics') ||
        topicLower.includes('energy') ||
        topicLower.includes('climate') ||
        topicLower.includes('evolution') ||
        topicLower.includes('transform') ||
        topicLower.includes('decay') ||
        topicLower.includes('osmosis') ||
        topicLower.includes('diffusion') ||
        topicLower.includes('photosynthesis')
      ) {
        keyConcept = 'Change';
      } else if (
        topicLower.includes('reproduct') ||
        topicLower.includes('hormon') ||
        topicLower.includes('menstru') ||
        topicLower.includes('genet') ||
        topicLower.includes('inherit') ||
        topicLower.includes('enzym') ||
        topicLower.includes('lock') ||
        topicLower.includes('cataly') ||
        topicLower.includes('stoichiometr') ||
        topicLower.includes('mole') ||
        topicLower.includes('interact')
      ) {
        keyConcept = 'Relationships';
      } else {
        keyConcept = 'Systems';
      }
    }

    // 2. Global Context resolution
    let globalContext = bp.globalContext?.trim() || preset?.globalContext || '';
    if (!globalContext) {
      const topicLower = (bp.topic + ' ' + (bp.subtopics || []).join(' ')).toLowerCase();
      if (
        topicLower.includes('environment') ||
        topicLower.includes('ecosystem') ||
        topicLower.includes('sustainab') ||
        topicLower.includes('climate') ||
        topicLower.includes('pollut') ||
        topicLower.includes('conservation') ||
        topicLower.includes('ecology')
      ) {
        globalContext = 'Globalization and sustainability';
      } else if (
        topicLower.includes('health') ||
        topicLower.includes('reproduct') ||
        topicLower.includes('hormon') ||
        topicLower.includes('disease') ||
        topicLower.includes('human') ||
        topicLower.includes('nutrition') ||
        topicLower.includes('diet') ||
        topicLower.includes('medicine')
      ) {
        globalContext = 'Identities and relationships';
      } else if (topicLower.includes('fairness') || topicLower.includes('ethics') || topicLower.includes('access')) {
        globalContext = 'Fairness and development';
      } else if (topicLower.includes('space') || topicLower.includes('universe') || topicLower.includes('history') || topicLower.includes('geology')) {
        globalContext = 'Orientation in space and time';
      } else {
        globalContext = 'Scientific and technical innovation';
      }
    }

    return {
      keyConcept,
      globalContext,
      relatedConcepts: bp.relatedConcepts,
      statementOfInquiry: bp.statementOfInquiry,
    };
  }

  /**
   * Generates standard file name: Student Name + Section + Subject + Formative Number + Formative Type
   * Example: Arun_9A_Biology_Formative_03_Criterion-C.pdf
   */
  static getFormattedReportFilename(assessment: FormativeAssessment, submission: Submission): string {
    const studentClean = submission.studentName.replace(/[^a-zA-Z0-9]/g, '_');
    const sectionClean = (submission.classSection || assessment.blueprint.classSection || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
    const subjectClean = assessment.blueprint.subject.replace(/[^a-zA-Z0-9]/g, '_');
    const numClean = assessment.blueprint.formativeNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const typeClean = (assessment.blueprint.selectedCriterion ? assessment.blueprint.selectedCriterion.replace(/\s+/g, '-') : assessment.blueprint.formativeType.replace(/[^a-zA-Z0-9]/g, '_'));

    return `${studentClean}_${sectionClean}_${subjectClean}_${numClean}_${typeClean}.pdf`;
  }

  /**
   * Generates an official, printable HTML report formatted for printing/saving as PDF
   */
  static generatePrintableReport(assessment: FormativeAssessment, submission: Submission) {
    const filename = this.getFormattedReportFilename(assessment, submission);
    const win = window.open('', '_blank');
    if (!win) return;

    const bp = assessment.blueprint;
    const { keyConcept, globalContext, relatedConcepts, statementOfInquiry } = this.resolveKeyConceptAndGlobalContext(bp);
    const marksTotal = submission.totalMarksAwarded ?? 0;
    const maxTotal = submission.totalMaxMarks ?? bp.maxMarks ?? 20;
    const percentage = Math.round((marksTotal / maxTotal) * 100);

    const questionsHtml = assessment.questions.map((q) => {
      const resp = submission.responses[q.id];
      const res = submission.markingResults?.[q.id];
      const tf = submission.teacherFeedback?.questionFeedback?.[q.id];

      const awardedMark = tf?.marksAwarded ?? res?.marksAwarded ?? 0;

      const pointsHtml = (res?.markingPoints || []).map((p: any) => `
        <li style="margin-bottom: 6px; color: ${p.isAwarded ? '#166534' : '#991b1b'}; font-size: 13px;">
          <strong>[${p.isAwarded ? 'AWARDED ✓' : 'NOT AWARDED ✗'} - ${p.marks} mark(s)]:</strong> ${p.point}
          ${p.evidenceFound ? `<div style="margin-left: 14px; font-style: italic; color: #1e293b;">Evidence: "${p.evidenceFound}"</div>` : ''}
          ${p.missingReason ? `<div style="margin-left: 14px; color: #b91c1c;">Missing: ${p.missingReason}</div>` : ''}
        </li>
      `).join('');

      return `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; background-color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 15px; color: #0f172a;">Question ${q.questionNumber}${q.subQuestionLabel ? ` (${q.subQuestionLabel})` : ''} (${q.commandTerm} — ${q.type.replace('_', ' ')})</div>
            <div style="font-size: 14px; font-weight: bold; color: ${awardedMark === q.maxMarks ? '#166534' : '#b45309'};">
              Score: ${awardedMark} / ${q.maxMarks} Marks
            </div>
          </div>
          
          <div style="font-size: 14px; color: #334155; margin-bottom: 12px;"><strong>Prompt:</strong> ${q.prompt}</div>
          
          <div style="background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 10px 14px; margin-bottom: 12px; font-size: 13px;">
            <strong>Student Answer:</strong>
            <p style="margin: 4px 0 0 0; color: #0f172a; white-space: pre-wrap;">${resp?.textAnswer || (resp?.selectedOptionId ? `Selected Option: ${resp.selectedOptionId}` : 'No response entered.')}</p>
          </div>

          <div style="background-color: #fdf2f8; border-left: 3px solid #db2777; padding: 10px 14px; margin-bottom: 12px; font-size: 13px;">
            <strong>Model Expected Response:</strong>
            <p style="margin: 4px 0 0 0; color: #831843;">${q.expectedAnswer}</p>
          </div>

          ${tf?.comment ? `
            <div style="background-color: #ecfdf5; border-left: 3px solid #10b981; padding: 10px 14px; margin-bottom: 12px; font-size: 13px;">
              <strong>Teacher Question Feedback:</strong>
              <p style="margin: 4px 0 0 0; color: #065f46;">${tf.comment}</p>
            </div>
          ` : ''}

          ${pointsHtml ? `
            <div style="margin-top: 10px;">
              <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 4px;">Examiner Marking Breakdown:</div>
              <ul style="margin: 0; padding-left: 18px;">${pointsHtml}</ul>
            </div>
          ` : ''}

          ${res?.whyMarksWereLost ? `
            <div style="margin-top: 8px; font-size: 12px; color: #475569;">
              <strong>Examiner Notes:</strong> ${res.whyMarksWereLost}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    const teacherSectionHtml = submission.teacherFeedback ? `
      <div style="border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px; margin-bottom: 24px; background-color: #f0fdf4; page-break-inside: avoid;">
        <h3 style="margin-top: 0; color: #166534; font-size: 16px; border-bottom: 1px solid #bbf7d0; padding-bottom: 6px;">Teacher Assessment Feedback & Evaluation</h3>
        <div style="margin-bottom: 10px; font-size: 13px; color: #14532d;">
          <strong>Evaluated by:</strong> ${submission.teacherFeedback.markedByName} • 
          <span>${new Date(submission.teacherFeedback.publishedAt).toLocaleDateString()}</span>
        </div>
        <div style="margin-bottom: 12px; font-size: 14px; color: #065f46; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #86efac;">
          <strong>Overall Feedback:</strong>
          <p style="margin: 4px 0 0 0;">${submission.teacherFeedback.overallComment}</p>
        </div>
        ${submission.teacherFeedback.strengths && submission.teacherFeedback.strengths.length > 0 ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #166534; font-size: 13px;">Key Strengths:</strong>
            <ul style="margin: 4px 0; padding-left: 20px; font-size: 13px; color: #14532d;">
              ${submission.teacherFeedback.strengths.map((s: string) => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${submission.teacherFeedback.priorityImprovementTarget ? `
          <div style="background-color: #ffffff; border: 1px solid #fde047; border-radius: 6px; padding: 10px; font-size: 13px; color: #854d0e;">
            <strong>Priority Target:</strong> ${submission.teacherFeedback.priorityImprovementTarget}
          </div>
        ` : ''}
      </div>
    ` : '';

    const diagnosisHtml = submission.diagnosis ? `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px; background-color: #f0fdf4; page-break-inside: avoid;">
        <h3 style="margin-top: 0; color: #166534; font-size: 16px; border-bottom: 1px solid #bbf7d0; padding-bottom: 6px;">AI Learning-Gap Diagnosis & Strengths</h3>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #166534; font-size: 13px;">Demonstrated Strengths:</strong>
          <ul style="margin: 4px 0; padding-left: 20px; font-size: 13px; color: #14532d;">
            ${submission.diagnosis.strengths.map((s: string) => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 12px;">
          <strong style="color: #991b1b; font-size: 13px;">Diagnosed Learning Gaps:</strong>
          <ul style="margin: 4px 0; padding-left: 20px; font-size: 13px; color: #7f1d1d;">
            ${submission.diagnosis.learningGaps.map((g: any) => `
              <li><strong>${g.gap}:</strong> ${g.evidence} <br/><span style="color: #475569; font-style: italic;">Next step: ${g.nextStep}</span></li>
            `).join('')}
          </ul>
        </div>

        ${submission.diagnosis.misconceptions.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <strong style="color: #c2410c; font-size: 13px;">Identified Scientific Misconceptions:</strong>
            <ul style="margin: 4px 0; padding-left: 20px; font-size: 13px; color: #9a3412;">
              ${submission.diagnosis.misconceptions.map((m: any) => `
                <li><strong>"${m.misconception}":</strong> Scientific reality: ${m.scientificTruth}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="background-color: #ffffff; border: 1px solid #86efac; border-radius: 6px; padding: 10px; font-size: 13px; color: #065f46;">
          <strong>Priority Improvement Target:</strong> ${submission.diagnosis.priorityImprovementTarget}
        </div>
      </div>
    ` : '';

    const reflectionHtml = submission.reflection ? `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px; background-color: #faf5ff; page-break-inside: avoid;">
        <h3 style="margin-top: 0; color: #6b21a8; font-size: 16px; border-bottom: 1px solid #e9d5ff; padding-bottom: 6px;">Student Reflection Record</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 13px;">
          <div>
            <strong>1. What did I do well?</strong>
            <p style="margin: 4px 0; color: #3b0764;">${submission.reflection.whatDidIWell}</p>
          </div>
          <div>
            <strong>2. What did I find difficult?</strong>
            <p style="margin: 4px 0; color: #3b0764;">${submission.reflection.whatDidIFindDifficult}</p>
          </div>
          <div>
            <strong>3. Scientific concept / skill to improve:</strong>
            <p style="margin: 4px 0; color: #3b0764;">${submission.reflection.whatConceptOrSkillToImprove}</p>
          </div>
          <div>
            <strong>4. What will I do differently next time?</strong>
            <p style="margin: 4px 0; color: #3b0764;">${submission.reflection.whatWillIDoDifferentlyNextTime}</p>
          </div>
        </div>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #f3e8ff; font-size: 13px;">
          <strong>5. Specific Learning Target:</strong>
          <p style="margin: 4px 0; color: #581c87; font-weight: bold;">${submission.reflection.specificLearningTarget}</p>
        </div>
      </div>
    ` : '';

    const fullDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            line-height: 1.5;
            padding: 40px;
            max-width: 850px;
            margin: 0 auto;
            background: #ffffff;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 24px; padding: 12px; background: #f1f5f9; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <div><strong>Report File:</strong> ${filename}</div>
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>

        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <h1 style="margin: 0; font-size: 24px; color: #0f172a;">Official Formative Assessment & Diagnostic Report</h1>
            <div style="font-size: 14px; font-weight: bold; color: #64748b;">${bp.curriculum} — ${bp.yearGroup}</div>
          </div>
          <div style="font-size: 16px; color: #334155; margin-top: 4px;">${bp.title}</div>
        </div>

        <!-- ASSESSMENT METADATA & CONCEPT FRAMEWORK -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 14px;">
            <div>
              <div><strong>Student:</strong> ${submission.studentName}</div>
              <div><strong>Class / Section:</strong> ${submission.classSection || bp.classSection}</div>
              <div><strong>Subject & Topic:</strong> ${bp.subject} — ${bp.topic}</div>
              <div><strong>Learning Objectives:</strong> ${(bp.learningObjectives || [bp.topic]).join('; ')}</div>
              ${bp.selectedCriterion ? `<div><strong>Criterion & Strands:</strong> ${bp.selectedCriterion} (${bp.selectedStrands?.join(', ')})</div>` : ''}
            </div>
            <div style="text-align: right; border-left: 1px solid #e2e8f0; padding-left: 16px;">
              <div><strong>Teacher:</strong> ${bp.teacherName}</div>
              <div><strong>Assessment Date:</strong> ${bp.assessmentDate}</div>
              <div style="margin-top: 8px; font-size: 20px; font-weight: bold; color: ${percentage >= 70 ? '#166534' : percentage >= 50 ? '#b45309' : '#991b1b'};">
                ${marksTotal} / ${maxTotal} (${percentage}%)
              </div>
              ${submission.mypOverallAchievementLevel ? `<div style="font-size: 14px; font-weight: bold; color: #4338ca;">MYP Achievement Level: ${submission.mypOverallAchievementLevel} / 8</div>` : ''}
            </div>
          </div>

          <!-- KEY CONCEPT & GLOBAL CONTEXT PILLARS -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; background: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div>
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #4338ca; margin-bottom: 2px;">
                Key Concept
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #1e1b4b; display: inline-flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #6366f1;"></span>
                ${keyConcept}
              </div>
            </div>

            <div>
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0369a1; margin-bottom: 2px;">
                Global Context
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #082f49; display: inline-flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #0284c7;"></span>
                ${globalContext}
              </div>
            </div>

            ${relatedConcepts && relatedConcepts.length > 0 ? `
              <div>
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #047857; margin-bottom: 2px;">
                  Related Concepts
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #064e3b;">
                  ${relatedConcepts.join(', ')}
                </div>
              </div>
            ` : ''}
          </div>

          ${statementOfInquiry ? `
            <div style="margin-top: 10px; font-size: 12px; color: #475569; font-style: italic; border-left: 2px solid #6366f1; padding-left: 8px;">
              <strong>Statement of Inquiry:</strong> "${statementOfInquiry}"
            </div>
          ` : ''}
        </div>

        ${teacherSectionHtml}
        ${diagnosisHtml}
        ${reflectionHtml}

        <h2 style="font-size: 18px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 16px;">
          Detailed Question-by-Question Evidence & Examiner Feedback
        </h2>

        ${questionsHtml}

        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          Curriculum-Aware Formative Assessment & Learning-Diagnosis Platform • Generated: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    win.document.open();
    win.document.write(fullDoc);
    win.document.close();
  }
}
