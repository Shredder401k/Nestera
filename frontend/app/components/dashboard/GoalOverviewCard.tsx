"use client";

import React from "react";
import {
  Shield,
  Calendar,
  TrendingUp,
  Edit3,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import CircularProgress from "./CircularProgress";

interface Milestone {
  label: string;
  date: string;
  reached: boolean;
}

interface GoalOverviewCardProps {
  title?: string;
  status?: "On Track" | "At Risk" | "Completed" | "Paused";
  description?: string;
  percentage?: number;
  savedAmount?: number;
  targetAmount?: number;
  monthlyContribution?: number;
  deadline?: string;
  milestones?: Milestone[];
  onEditGoal?: () => void;
  onAddFunds?: () => void;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; border: string; dot: string; text: string }
> = {
  "On Track": {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    text: "text-emerald-400",
  },
  "At Risk": {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    text: "text-amber-400",
  },
  Completed: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    text: "text-cyan-400",
  },
  Paused: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    dot: "bg-slate-400",
    text: "text-slate-400",
  },
};

const DEFAULT_MILESTONES: Milestone[] = [
  { label: "25% reached", date: "Jan 2025", reached: true },
  { label: "50% reached", date: "Mar 2025", reached: true },
  { label: "75% reached", date: "Jun 2025", reached: false },
  { label: "Goal complete", date: "Sep 2025", reached: false },
];

const GoalOverviewCard: React.FC<GoalOverviewCardProps> = ({
  title = "Emergency Fund",
  status = "On Track",
  description = "Building a 6-month emergency safety net to cover unexpected expenses and provide financial security.",
  percentage = 52,
  savedAmount = 5200,
  targetAmount = 10000,
  monthlyContribution = 400,
  deadline = "Sep 30, 2025",
  milestones = DEFAULT_MILESTONES,
  onEditGoal,
  onAddFunds,
}) => {
  const remaining = targetAmount - savedAmount;
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES["On Track"];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[rgba(6,26,26,0.85)] to-[rgba(4,14,16,0.65)] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm p-6 md:p-8">
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/80 via-cyan-400/40 to-transparent rounded-t-3xl" />

      {/* ── Header row ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-[rgba(0,212,192,0.15)] to-[rgba(0,212,192,0.05)] border border-[rgba(0,212,192,0.2)] flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_24px_rgba(0,212,192,0.1)]">
            <Shield size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight m-0">
              {title}
            </h2>
            <p className="text-[#5e8c96] text-sm mt-1 max-w-md leading-relaxed m-0">
              {description}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${statusStyle.bg} ${statusStyle.border}`}
        >
          <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
          <span
            className={`text-xs font-bold uppercase tracking-widest ${statusStyle.text}`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* Circular progress */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <CircularProgress
            percentage={percentage}
            size={160}
            strokeWidth={13}
            strokeColor="#00d4c0"
            backgroundColor="rgba(0, 212, 192, 0.08)"
          />
          <span className="text-[#5e8c96] text-xs font-medium tracking-wide uppercase">
            Progress
          </span>
        </div>

        {/* Metrics grid */}
        <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricTile
            label="Saved"
            value={`$${savedAmount.toLocaleString()}`}
            accent="text-cyan-400"
          />
          <MetricTile
            label="Target"
            value={`$${targetAmount.toLocaleString()}`}
            accent="text-white"
          />
          <MetricTile
            label="Remaining"
            value={`$${remaining.toLocaleString()}`}
            accent="text-amber-400"
          />
          <MetricTile
            label="Monthly"
            value={`$${monthlyContribution.toLocaleString()}`}
            accent="text-emerald-400"
            icon={<TrendingUp size={13} className="text-emerald-400" />}
          />

          {/* Deadline — spans full width on small, 2 cols on sm+ */}
          <div className="col-span-2 sm:col-span-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <Calendar size={15} className="text-cyan-500/80 shrink-0" />
            <span className="text-[#5e8c96] text-sm">Target deadline:</span>
            <span className="text-white text-sm font-semibold ml-1">
              {deadline}
            </span>
          </div>
        </div>
      </div>

      {/* ── Milestone timeline ── */}
      <div className="mt-8">
        <p className="text-xs font-bold text-[#5e8c96] uppercase tracking-widest mb-4">
          Progress Milestones
        </p>
        <div className="relative flex items-start gap-0">
          {milestones.map((m, i) => {
            const isLast = i === milestones.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {!isLast && (
                  <div
                    className={`absolute top-[11px] left-1/2 w-full h-[2px] ${
                      m.reached ? "bg-cyan-500/60" : "bg-white/8"
                    }`}
                  />
                )}
                {/* Node */}
                <div
                  className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    m.reached
                      ? "border-cyan-500 bg-cyan-500/20"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  {m.reached && (
                    <CheckCircle2 size={14} className="text-cyan-400" />
                  )}
                </div>
                {/* Labels */}
                <span
                  className={`mt-2 text-[11px] font-semibold text-center leading-tight ${
                    m.reached ? "text-cyan-400" : "text-[#5e8c96]"
                  }`}
                >
                  {m.label}
                </span>
                <span className="text-[10px] text-[#3e6070] mt-0.5">
                  {m.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={onEditGoal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all active:scale-95 cursor-pointer"
        >
          <Edit3 size={16} />
          Edit Goal
        </button>
        <button
          onClick={onAddFunds}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#061a1a] font-bold text-sm transition-all shadow-[0_8px_20px_rgba(0,212,192,0.2)] hover:shadow-[0_12px_28px_rgba(0,212,192,0.35)] active:scale-95 cursor-pointer"
        >
          <PlusCircle size={16} />
          Add Funds
        </button>
      </div>
    </div>
  );
};

/* ── Small helper ── */
const MetricTile: React.FC<{
  label: string;
  value: string;
  accent: string;
  icon?: React.ReactNode;
}> = ({ label, value, accent, icon }) => (
  <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
    <span className="text-[11px] font-semibold text-[#5e8c96] uppercase tracking-wider">
      {label}
    </span>
    <div className="flex items-center gap-1.5">
      {icon}
      <span className={`text-lg font-bold ${accent}`}>{value}</span>
    </div>
  </div>
);

export default GoalOverviewCard;
