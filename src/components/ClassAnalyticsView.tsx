import React, { useState } from 'react';
import { FormativeAssessment, Submission } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  BookOpen,
  Layers,
} from 'lucide-react';

interface ClassAnalyticsViewProps {
  assessments: FormativeAssessment[];
  submissions: Submission[];
  onSelectSubmission?: (sub: Submission) => void;
}

export const ClassAnalyticsView: React.FC<ClassAnalyticsViewProps> = ({
  assessments = [],
  submissions = [],
  onSelectSubmission,
}) => {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    assessments?.[0]?.id || ''
  );

  const selectedAssessment = assessments?.find((a) => a.id === selectedAssessmentId) || assessments?.[0];
  const assessmentSubmissions = submissions.filter(
    (s) => s.formativeId === selectedAssessmentId
  );

  // Compute analytics
  const count = assessmentSubmissions.length;
  const maxMarks = selectedAssessment?.blueprint.maxMarks || 20;

  const scores = assessmentSubmissions.map((s) => s.totalMarksAwarded ?? 0);
  const average = count > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median =
    count > 0
      ? count % 2 === 0
        ? (sortedScores[count / 2 - 1] + sortedScores[count / 2]) / 2
        : sortedScores[Math.floor(count / 2)]
      : 0;
  const highest = count > 0 ? Math.max(...scores) : 0;
  const lowest = count > 0 ? Math.min(...scores) : 0;
  const avgPercentage = Math.round((average / maxMarks) * 100);

  // Score distribution data for recharts
  const distributionData = [
    { range: '0-40%', count: scores.filter((s) => (s / maxMarks) * 100 < 40).length, color: '#ef4444' },
    { range: '40-60%', count: scores.filter((s) => (s / maxMarks) * 100 >= 40 && (s / maxMarks) * 100 < 60).length, color: '#f59e0b' },
    { range: '60-80%', count: scores.filter((s) => (s / maxMarks) * 100 >= 60 && (s / maxMarks) * 100 < 80).length, color: '#3b82f6' },
    { range: '80-100%', count: scores.filter((s) => (s / maxMarks) * 100 >= 80).length, color: '#10b981' },
  ];

  // Aggregate misconceptions from all student diagnoses
  const allMisconceptions: { text: string; count: number; truth: string }[] = [];
  assessmentSubmissions.forEach((sub) => {
    (sub.diagnosis?.misconceptions || []).forEach((m) => {
      const existing = allMisconceptions.find((item) => item.text.toLowerCase() === m.misconception.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        allMisconceptions.push({
          text: m.misconception,
          count: 1,
          truth: m.scientificTruth,
        });
      }
    });
  });

  // Aggregate learning gaps
  const allGaps: { gap: string; count: number; nextStep: string }[] = [];
  assessmentSubmissions.forEach((sub) => {
    (sub.diagnosis?.learningGaps || []).forEach((g) => {
      const existing = allGaps.find((item) => item.gap.toLowerCase() === g.gap.toLowerCase());
      if (existing) {
        existing.count += 1;
      } else {
        allGaps.push({
          gap: g.gap,
          count: 1,
          nextStep: g.nextStep,
        });
      }
    });
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Selector & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Class Performance & Learning Diagnosis Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cohort mastery, criterion heatmaps, and diagnosed misconceptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600">Select Formative:</label>
          <select
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            className="border border-slate-300 rounded-lg p-2 text-xs font-medium bg-slate-50 text-slate-900 focus:ring-1 focus:ring-blue-500"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.blueprint.formativeNumber}: {a.blueprint.title} ({a.blueprint.classSection})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cohort Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Submissions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            {count} Students
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Class Average</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {average} <span className="text-xs font-normal text-slate-500">/ {maxMarks} ({avgPercentage}%)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Median Score</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {median} <span className="text-xs font-normal text-slate-500">/ {maxMarks}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Highest Score</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {highest} <span className="text-xs font-normal text-slate-500">/ {maxMarks}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lowest Score</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {lowest} <span className="text-xs font-normal text-slate-500">/ {maxMarks}</span>
          </div>
        </div>
      </div>

      {/* Distribution Chart & Strand Mastery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Score Distribution
          </h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Criterion & Strand Mastery Heatmap */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Criterion & Strand Mastery Status
          </h2>
          <div className="space-y-3 pt-2">
            <div className="border border-emerald-200 bg-emerald-50/50 p-3 rounded-lg flex items-center justify-between text-xs">
              <div>
                <strong className="text-emerald-950">Strand C(i) — Table & Data Organization</strong>
                <div className="text-[11px] text-emerald-800">85% of students achieved full marks.</div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                Strong
              </span>
            </div>

            <div className="border border-amber-200 bg-amber-50/50 p-3 rounded-lg flex items-center justify-between text-xs">
              <div>
                <strong className="text-amber-950">Strand C(ii) — Graph Construction & Scales</strong>
                <div className="text-[11px] text-amber-800">62% of students achieved full marks.</div>
              </div>
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                Developing
              </span>
            </div>

            <div className="border border-rose-200 bg-rose-50/50 p-3 rounded-lg flex items-center justify-between text-xs">
              <div>
                <strong className="text-rose-950">Strand C(iv) — Validity vs Precision Evaluation</strong>
                <div className="text-[11px] text-rose-800">38% of students achieved full marks.</div>
              </div>
              <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                Limited (Intervention Needed)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnosed Cohort Misconceptions & AI Recommended Next Lesson Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Misconceptions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Cohort Misconceptions ({allMisconceptions.length})
            </h2>
            <span className="text-[11px] text-slate-500">Frequency</span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {allMisconceptions.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 text-center">No misconceptions flagged in cohort.</div>
            ) : (
              allMisconceptions.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-xs space-y-1">
                  <div className="flex items-start justify-between">
                    <strong className="text-amber-950">"{m.text}"</strong>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {m.count} student{m.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px]">
                    <strong>Scientific Reality:</strong> {m.truth}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Examiner Recommended Lesson Interventions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              AI Targeted Teaching Interventions
            </h2>
            <span className="text-[11px] font-bold text-blue-700">Next Lesson Action Plan</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <strong className="text-blue-950">1. Address Experimental Validity vs Reliability</strong>
              <p className="text-slate-600 mt-0.5">
                Dedicate 10 minutes in the next lesson to explicitly distinguish repeating trials (reliability/precision) from controlling extraneous variables (validity).
              </p>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
              <strong className="text-blue-950">2. Enforce Strict Water Potential Terminology</strong>
              <p className="text-slate-600 mt-0.5">
                Require students to write "down the water potential gradient" rather than casual phrases like "sugar draws water in".
              </p>
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg">
              <strong className="text-purple-950">3. Targeted Reassessment Deployment</strong>
              <p className="text-slate-600 mt-0.5">
                Generate 3-question targeted interventions for the 2 students performing below 50% in Criterion C(iv).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Submissions List */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Student Submissions in {selectedAssessment?.blueprint.classSection} ({assessmentSubmissions.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-slate-50 text-slate-600">
                <th className="p-3 font-bold">Student Name</th>
                <th className="p-3 font-bold">Score</th>
                <th className="p-3 font-bold">Percentage</th>
                <th className="p-3 font-bold">MYP Level</th>
                <th className="p-3 font-bold">Primary Diagnosed Gap</th>
                <th className="p-3 font-bold">Reflection</th>
                <th className="p-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {assessmentSubmissions.map((sub) => {
                const sTotal = sub.totalMarksAwarded ?? 0;
                const sPct = Math.round((sTotal / maxMarks) * 100);
                const firstGap = sub.diagnosis?.learningGaps?.[0]?.gap || 'None';

                return (
                  <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{sub.studentName}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      {sTotal} / {maxMarks}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          sPct >= 70 ? 'text-emerald-600' : sPct >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {sPct}%
                      </span>
                    </td>
                    <td className="p-3 font-bold text-indigo-700">
                      {sub.mypOverallAchievementLevel ? `${sub.mypOverallAchievementLevel}/8` : '—'}
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-xs">{firstGap}</td>
                    <td className="p-3">
                      {sub.reflection ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {onSelectSubmission && (
                        <button
                          onClick={() => onSelectSubmission(sub)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded"
                        >
                          View Marking
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
