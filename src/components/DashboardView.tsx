/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Program, Participant, Expense } from '../types';
import {
  CalendarDays,
  Users,
  Wallet,
  TrendingUp,
  PieChart as PieIcon,
  CircleDollarSign,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
  Landmark,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  programs: Program[];
  participants: Participant[];
  expenses: Expense[];
  onNavigate: (route: string) => void;
  onSelectProgram: (id: number) => void;
  onSelectParticipant: (id: number) => void;
}

export default function DashboardView({
  programs,
  participants,
  expenses,
  onNavigate,
  onSelectProgram,
  onSelectParticipant
}: DashboardViewProps) {
  // 1. Calculations
  const totalProgramsCount = programs.length;
  const totalParticipantsCount = participants.length;

  // Total allocated program budget
  const totalAllocatedBudget = programs.reduce((sum, p) => sum + p.budget, 0);

  // Total accumulated expenses
  const totalAccumulatedExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Budget utilization percent
  const budgetUtilizationPercent = totalAllocatedBudget > 0
    ? Math.min(100, Math.round((totalAccumulatedExpenses / totalAllocatedBudget) * 100))
    : 0;

  // Let's compute statuses distribution
  const statusCounts = {
    planned: programs.filter((p) => p.status === 'planned').length,
    ongoing: programs.filter((p) => p.status === 'ongoing').length,
    completed: programs.filter((p) => p.status === 'completed').length
  };

  // Expenses categories breakdown
  const categoryExpenses = {
    Food: expenses.filter((e) => e.category === 'Food').reduce((sum, e) => sum + e.amount, 0),
    Supplies: expenses.filter((e) => e.category === 'Supplies').reduce((sum, e) => sum + e.amount, 0),
    Transport: expenses.filter((e) => e.category === 'Transport').reduce((sum, e) => sum + e.amount, 0),
    Honorarium: expenses.filter((e) => e.category === 'Honorarium').reduce((sum, e) => sum + e.amount, 0),
    Other: expenses.filter((e) => e.category === 'Other').reduce((sum, e) => sum + e.amount, 0)
  };

  // Monthly trends (seed matches mostly March, April, May, June 2026)
  const monthlyCounts = {
    'March': programs.filter((p) => p.date.includes('-03-')).length,
    'April': programs.filter((p) => p.date.includes('-04-')).length,
    'May': programs.filter((p) => p.date.includes('-05-')).length,
    'June': programs.filter((p) => p.date.includes('-06-')).length
  };

  // Sort and select newest 5 programs
  const recentPrograms = [...programs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Sort and select newest 5 expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Format pesos
  const formatPesos = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title & Banner with SK logo placement details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-800 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-700/30 rounded-full blur-2xl -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-700/50 py-1 px-3.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/20">
              Barangay San Francisco • Naga City
            </span>
          </div>
          <h2 className="text-xl md:text-3xl font-black tracking-tight font-sans">
            Mabuhay, Sangguniang Kabataan Officers!
          </h2>
          <p className="text-emerald-100 text-xs md:text-sm max-w-xl font-medium">
            Welcome to the PMMS dashboard, specifically tailored for monitored program alignments, exact youth registrations, budget monitoring audits, and automated LGU evaluations.
          </p>
        </div>

        {/* Quick Quick action buttons inside header banner */}
        <div className="relative z-10 flex flex-wrap gap-2 md:items-center">
          <button
            onClick={() => onNavigate('programs-new')}
            className="px-4 py-2 bg-white text-emerald-900 font-bold hover:bg-emerald-50 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
            <span>Create Program</span>
          </button>
          <button
            onClick={() => onNavigate('participant-new')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs border border-white/10 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Participant</span>
          </button>
          <button
            onClick={() => onNavigate('expenses-new')}
            className="px-4 py-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-white font-bold rounded-xl text-xs border border-white/10 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Programs */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 font-bold text-[10px] uppercase block tracking-wider">Total Programs</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalProgramsCount}</span>
            <span className="text-[10px] text-orange-600 font-semibold block mt-1">Calendar align active</span>
          </div>
        </div>

        {/* Card 2: Participants */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 font-bold text-[10px] uppercase block tracking-wider">Total Youth Residents</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{totalParticipantsCount}</span>
            <span className="text-[10px] text-indigo-600 font-semibold block mt-1">Naga City Hub certified</span>
          </div>
        </div>

        {/* Card 3: Total Budget */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 font-bold text-[10px] uppercase block tracking-wider">SK Allocated Funds</span>
            <span className="text-lg font-black text-slate-800 tracking-tight shrink-0">{formatPesos(totalAllocatedBudget)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Total budget allocated</span>
          </div>
        </div>

        {/* Card 4: Budget Utilization */}
        <div className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase block tracking-wider">Budget Util. %</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">{budgetUtilizationPercent}%</span>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-1.5 rounded-full"
                style={{ width: `${budgetUtilizationPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid Component */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly programs and Status Breakout */}
        <div className="lg:col-span-8 bg-white border border-slate-100/80 p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block">Monthly Program Trends</h3>
                <p className="text-[11px] text-slate-400 font-medium">Count of initiatives launched per calendar month</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                FY 2026 Active
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-60 mt-4 flex items-end justify-between gap-4 px-2 select-none">
              {Object.entries(monthlyCounts).map(([month, count]) => {
                const maxVal = Math.max(...Object.values(monthlyCounts), 1);
                const heightPercent = Math.max(8, Math.round((count / maxVal) * 100));
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-2 relative flex flex-col justify-end h-44 hover:bg-slate-50/80 transition-all">
                      {/* Bar fill */}
                      <div
                        className="bg-emerald-600 group-hover:bg-emerald-500 rounded-xl transition-all relative flex items-center justify-center text-[10px] font-extrabold text-white"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {count > 0 && <span className="absolute top-1.5">{count}</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500 font-medium">Bikol Naga Region administrative indicators</span>
            </div>
            <button
              onClick={() => onNavigate('programs')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 py-1"
            >
              <span>Explore Programs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Status breakout pie ring */}
        <div className="lg:col-span-4 bg-white border border-slate-100/80 p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block mb-2">Program Milestones</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-6">Proportion of planned, active and concluded tasks</p>

            {/* Simulated Ring Visualization */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center my-4">
              {/* Outer circle */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                {/* Completed - Emerald Segment */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (statusCounts.completed / (totalProgramsCount || 1)))}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-800">{statusCounts.completed}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Completed</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between text-xs font-semibold p-2 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Completed Done</span>
                </div>
                <span className="text-slate-800 font-bold">{statusCounts.completed} initiatives</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold p-2 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="text-slate-600">Ongoing Active</span>
                </div>
                <span className="text-slate-800 font-bold">{statusCounts.ongoing} active</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold p-2 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">Planned Queue</span>
                </div>
                <span className="text-slate-800 font-bold">{statusCounts.planned} planned</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Expense Visualizer and Budget vs Actual progress bar list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown bar chart widget */}
        <div className="bg-white border border-slate-100/80 p-6 rounded-3xl shadow-3xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block">Financial Expenditures Breakdown</h3>
              <p className="text-[11px] text-slate-400 font-medium">Categorized disbursements audited for Brgy. San Francisco</p>
            </div>
            <span className="text-[11px] text-slate-600 font-bold bg-slate-100 px-2 py-1 rounded-xl">
              {formatPesos(totalAccumulatedExpenses)}
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(categoryExpenses).map(([category, amount]) => {
              const total = Math.max(totalAccumulatedExpenses, 1);
              const percent = Math.round((amount / total) * 100);
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{category} Expense</span>
                    <span className="text-slate-500">{formatPesos(amount)} <span className="text-slate-400 font-bold text-[10px]">({percent}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget vs Actual programs */}
        <div className="bg-white border border-slate-100/80 p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block mb-2">Budget Line Alignment</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-4">Program ceiling vs real logged expenses (top programs)</p>

            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              {programs.slice(0, 4).map((p) => {
                const programExpenses = expenses
                  .filter((e) => e.program_id === p.id)
                  .reduce((sum, e) => sum + e.amount, 0);
                const percent = p.budget > 0 ? Math.min(100, Math.round((programExpenses / p.budget) * 100)) : 0;
                return (
                  <div key={p.id} className="p-3 border border-slate-50 hover:bg-slate-50/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="truncate max-w-[200px]">{p.name}</span>
                      <span className={`${percent > 90 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {percent}% Used
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span>Spent: {formatPesos(programExpenses)}</span>
                      <span>Budget: {formatPesos(p.budget)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percent > 90 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lists of Recent Programs and Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Programs List */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block">Newest Registered Programs</h3>
                <p className="text-[11px] text-slate-400 font-medium">Top additions and scheduled mobilizations</p>
              </div>
              <button
                onClick={() => onNavigate('programs')}
                className="text-[11px] text-emerald-600 font-bold hover:underline"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {recentPrograms.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProgram(p.id)}
                  className="py-3 hover:bg-slate-50/50 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-300" />
                        <span className="truncate max-w-[120px]">{p.location}</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : p.status === 'ongoing'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Expenses List */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-3xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider block">Recent Expenses Incurred</h3>
                <p className="text-[11px] text-slate-400 font-medium">Real-time receipts and disbursements ledger</p>
              </div>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-[11px] text-emerald-600 font-bold hover:underline"
              >
                View ledger
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {recentExpenses.map((e) => (
                <div
                  key={e.id}
                  className="py-3 px-2 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{e.description}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {e.category}
                      </span>
                      <span>•</span>
                      <span>{new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700 whitespace-nowrap">
                    {formatPesos(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
