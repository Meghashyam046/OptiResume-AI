import React from "react";
import { AnalysisResult } from "../types";
import { CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, Sparkles, TrendingUp, RefreshCw } from "lucide-react";

interface AnalysisDisplayProps {
  analysis: AnalysisResult;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const {
    matchScore,
    missingKeywords = [],
    suggestedKeywords = [],
    matchedKeywords = [],
    weakSections = [],
    recommendations = [],
    overallSummary = "",
  } = analysis;

  // Dynamically calculate matching color scales
  const getScoreColor = (score: number) => {
    if (score < 50) return { text: "text-rose-600", border: "border-rose-200", bg: "bg-rose-50", stroke: "#e11d48" };
    if (score < 75) return { text: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50", stroke: "#d97706" };
    return { text: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50", stroke: "#2563eb" };
  };

  const scoreMeta = getScoreColor(matchScore);

  // Math for SVG Circle
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchScore / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* ATS Gauge & High Level Summary Header Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Ring */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-display">
            ATS Match Index
          </span>
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="text-slate-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke={scoreMeta.stroke}
                fill="transparent"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
            <div className="absolute text-center">
              <span className={`text-3xl font-extrabold tracking-tight font-display ${scoreMeta.text}`}>
                {matchScore}%
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Matching Limit</p>
            </div>
          </div>
          <div className={`mt-4 px-3.5 py-1.5 rounded-full text-xs font-bold font-display ${scoreMeta.bg} ${scoreMeta.text} border ${scoreMeta.border}`}>
            {matchScore < 50 ? "Weak Relevance" : matchScore < 75 ? "Partial Match" : "Highly Optimized"}
          </div>
        </div>

        {/* Executive Feedback summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider font-display flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Recruiter Evaluation Summary
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {overallSummary || "Perform an ATS evaluation step by pasting a targeted job description and scanning. The parser will immediately provide a recruiter overview on your alignment scale."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 mt-4 text-center">
            <div>
              <span className="block text-lg font-bold text-slate-800 font-display">{matchedKeywords.length}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Matches</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-slate-800 font-display">{missingKeywords.length}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Missing</span>
            </div>
            <div>
              <span className="block text-lg font-bold text-slate-800 font-display">{weakSections.length}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Weak Areas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Keywords segment (Matched vs Missing vs Suggested) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">ATS Keyword Alignment</h3>
          <p className="text-xs text-slate-500">Matched search terms score high indexes. Add recommended missing keywords naturally to double relevance.</p>
        </div>

        <div className="space-y-4">
          {/* Matched Badges */}
          {matchedKeywords.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Matched Keywords ({matchedKeywords.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {matchedKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missing Badges */}
          {missingKeywords.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                Missing Critical Keywords ({missingKeywords.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-rose-50 text-rose-700 rounded-lg border border-rose-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Skills */}
          {suggestedKeywords.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5" />
                Suggested Core Keywords ({suggestedKeywords.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weak Resume Sections Audits */}
      {weakSections.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Weak Sections & Layout Audits</h3>
            <p className="text-xs text-slate-500">Below items failed parsing optimization checks. Correct them using the guided actions below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weakSections.map((ws, i) => (
              <div key={i} className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-100 text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-display uppercase">{ws.section}</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Findings</div>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">{ws.findings}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/40">
                  <div className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
                    <Plus className="w-3 h-3 text-blue-500" /> Improvement Target
                  </div>
                  <p className="text-xs text-blue-900 font-sans italic mt-0.5">"{ws.correction}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Recruiter Suggestions */}
      {recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Targeted Recruiter Recommendations</h3>
            <p className="text-xs text-slate-500">Apply these strategic suggestions to boost conversion rate and stand out in the pool.</p>
          </div>

          <ul className="space-y-3">
            {recommendations.map((recommendation, i) => (
              <li key={i} className="flex gap-3 text-xs text-slate-600 font-sans items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-[10px]">
                  {i + 1}
                </span>
                <span className="leading-relaxed mt-0.5">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Simple inline helper
function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
