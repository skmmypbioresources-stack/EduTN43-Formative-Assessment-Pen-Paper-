import React from 'react';
import { FormativeAssessment, Submission, UserProfile } from '../types';
import { ReportGenerator } from '../services/reportGenerator';
import {
  TrendingUp,
  Award,
  Target,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface StudentProgressViewProps {
  studentUser: UserProfile;
  assessments: FormativeAssessment[];
  submissions: Submission[];
  onViewMarking: (assessment: FormativeAssessment, submission: Submission) => void;
}

export const StudentProgressView: React.FC<StudentProgressViewProps> = ({
  studentUser,
  assessments,
  submissions,
  onViewMarking,
}) => {
  const studentSubs = submissions.filter((s) => s.studentId === studentUser.id);

  // Prepare longitudinal progress chart data
  const progressData = studentSubs.map((s, idx) => {
    const ass = assessments.find((a) => a.id === s.formativeId);
    const totalAwarded = s.totalMarksAwarded ?? 0;
    const totalMax = s.totalMaxMarks ?? ass?.blueprint.maxMarks ?? 20;
    const percentage = Math.round((totalAwarded / totalMax) * 100);

    return {
      name: ass ? ass.blueprint.formativeNumber : `F${idx + 1}`,
      percentage,
      marks: totalAwarded,
      maxMarks: totalMax,
      mypLevel: s.mypOverallAchievementLevel || 0,
      topic: ass?.blueprint.topic || 'Assessment',
    };
  });

  // Calculate cumulative average
  const totalAwardedAll = studentSubs.reduce((sum, s) => sum + (s.totalMarksAwarded || 0), 0);
  const totalMaxAll = studentSubs.reduce((sum, s) => {
    const ass = assessments.find((a) => a.id === s.formativeId);
    return sum + (s.totalMaxMarks || ass?.blueprint.maxMarks || 20);
  }, 0);
  const overallAvg = totalMaxAll > 0 ? Math.round((totalAwardedAll / totalMaxAll) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Student Learning Journey
            </span>
            <span className="text-xs text-slate-500">{studentUser.classSections?.join(', ')}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{studentUser.name}'s Science Progress</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous formative diagnostic tracking & learning gap history.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
          <div>
            <div className="text-[11px] font-bold uppercase text-slate-500">Completed Formatives</div>
            <div className="text-2xl font-bold text-slate-900">{studentSubs.length}</div>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <div className="text-[11px] font-bold uppercase text-slate-500">Cumulative Average</div>
            <div className="text-2xl font-bold text-blue-600">{overallAvg}%</div>
          </div>
        </div>
      </div>

      {/* Longitudinal Growth Curve */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Performance Growth Over Time
          </h2>
          <span className="text-xs text-slate-500 font-medium">Formative Trend</span>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `${value}% (${props.payload.marks}/${props.payload.maxMarks} marks)`,
                  props.payload.topic,
                ]}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 5, fill: '#2563eb' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Formatives & Diagnosis List */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Completed Formative History & Feedback</h2>

        <div className="space-y-3">
          {studentSubs.map((sub) => {
            const ass = assessments.find((a) => a.id === sub.formativeId);
            if (!ass) return null;

            const totalAwarded = sub.totalMarksAwarded ?? 0;
            const totalMax = sub.totalMaxMarks ?? ass.blueprint.maxMarks ?? 20;
            const pct = Math.round((totalAwarded / totalMax) * 100);

            return (
              <div
                key={sub.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {ass.blueprint.formativeNumber}: {ass.blueprint.title}
                    </span>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {ass.blueprint.curriculum} • {ass.blueprint.subject}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Topic: <strong className="text-slate-700">{ass.blueprint.topic}</strong> • Submitted:{' '}
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </div>

                  {sub.diagnosis?.priorityImprovementTarget && (
                    <div className="text-xs text-blue-700 bg-blue-50/60 p-2 rounded-md mt-2">
                      <strong>Focus Target:</strong> {sub.diagnosis.priorityImprovementTarget}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {totalAwarded} / {totalMax} Marks
                    </div>
                    <div
                      className={`text-xs font-bold ${
                        pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'
                      }`}
                    >
                      {pct}% Score
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => onViewMarking(ass, sub)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      View Marking & Gaps
                    </button>
                    <button
                      onClick={() => ReportGenerator.generatePrintableReport(ass, sub)}
                      className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Report (.PDF)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
