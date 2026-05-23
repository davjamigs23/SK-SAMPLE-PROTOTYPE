/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Program, Participant, Expense, ProgramParticipant, Registration, User, UserRole, Feedback } from '../types';
import {
  Calendar,
  MapPin,
  Clock,
  CircleDollarSign,
  AlertTriangle,
  UserCheck,
  ClipboardList,
  ChevronRight,
  Plus,
  ArrowLeft,
  Paperclip,
  CheckCircle,
  XCircle,
  Users,
  Star,
  MessageSquare,
  Bookmark,
  TrendingDown
} from 'lucide-react';

interface ProgramDetailsTabProps {
  program: Program;
  participants: Participant[];
  expenses: Expense[];
  programParticipants: ProgramParticipant[];
  registrations: Registration[];
  feedbacks: Feedback[];
  currentUser: User;
  onBack: () => void;
  onEditProgram: (id: number) => void;
  onDeleteProgram: (id: number) => void;
  onRegisterSelf: (programId: number) => void;
  onApproveRegistration: (registrationId: number, notes: string) => void;
  onRejectRegistration: (registrationId: number, notes: string) => void;
  onUpdateAttendance: (programId: number, participantId: number, status: ProgramParticipant['attendance_status']) => void;
  onLogProgramExpense: (programId: number, expense: Omit<Expense, 'id' | 'created_at'>) => void;
  onDeleteExpense: (id: number) => void;
  onSubmitFeedback: (programId: number, rating: number, comment: string) => void;
}

export default function ProgramDetailsTab({
  program,
  participants,
  expenses,
  programParticipants,
  registrations,
  feedbacks,
  currentUser,
  onBack,
  onEditProgram,
  onDeleteProgram,
  onRegisterSelf,
  onApproveRegistration,
  onRejectRegistration,
  onUpdateAttendance,
  onLogProgramExpense,
  onDeleteExpense,
  onSubmitFeedback
}: ProgramDetailsTabProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'expenses' | 'attendance' | 'feedback'>('overview');
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<'Food' | 'Supplies' | 'Transport' | 'Honorarium' | 'Other'>('Supplies');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedReg, setSelectedReg] = useState<number | null>(null);

  const formatPesos = (val: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Get participant list filtered for this specific program from the junction table
  const programMembers = programParticipants
    .filter((pp) => pp.program_id === program.id)
    .map((pp) => {
      const part = participants.find((p) => p.id === pp.participant_id);
      return {
        ...pp,
        participant: part
      };
    })
    .filter((pm) => pm.participant !== undefined);

  // Filter registrations for this program
  const programRegistrations = registrations.filter((r) => r.program_id === program.id);

  // Filter expenses for this program
  const programExpenses = expenses.filter((e) => e.program_id === program.id);

  // Total program expenditures
  const totalSpent = programExpenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetUtilization = program.budget > 0 ? Math.round((totalSpent / program.budget) * 100) : 0;

  // Filter feedbacks for this program
  const programFeedbacks = feedbacks.filter((f) => f.program_id === program.id);

  // Calculate Average Feedback rating
  const avgRating = programFeedbacks.length > 0
    ? (programFeedbacks.reduce((sum, f) => sum + f.rating, 0) / programFeedbacks.length).toFixed(1)
    : 'No feedback yet';

  // Check if current user is registered for this program
  const userParticipant = participants.find((p) => p.user_id === currentUser.id);
  const userProgramReg = userParticipant
    ? programParticipants.find((pp) => pp.program_id === program.id && pp.participant_id === userParticipant.id)
    : null;

  const handleSelfJoinClick = () => {
    onRegisterSelf(program.id);
  };

  const handleApprove = (regId: number) => {
    onApproveRegistration(regId, adminNote[regId] || 'Approved by SK Authority.');
    setAdminNote((prev) => ({ ...prev, [regId]: '' }));
    setSelectedReg(null);
  };

  const handleReject = (regId: number) => {
    onRejectRegistration(regId, adminNote[regId] || 'Seat limitations / profile credentials failed eligibility query.');
    setAdminNote((prev) => ({ ...prev, [regId]: '' }));
    setSelectedReg(null);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmount) return;
    onLogProgramExpense(program.id, {
      program_id: program.id,
      description: newExpenseDesc,
      amount: parseFloat(newExpenseAmount),
      date: newExpenseDate,
      category: newExpenseCategory,
      recorded_by: currentUser.id
    });
    setNewExpenseDesc('');
    setNewExpenseAmount('');
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment) return;
    onSubmitFeedback(program.id, feedbackRating, feedbackComment);
    setFeedbackComment('');
    setFeedbackRating(5);
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'skofficial';
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button and controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 cursor-pointer rounded-2xl text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to registry</span>
        </button>

        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => onEditProgram(program.id)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer font-bold rounded-2xl text-xs transition-all"
            >
              Edit parameters
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  if (confirm('Are you absolutely sure you want to delete this program? All program participants, expenses, registrations, and feedback will be irrecoverably cleared.')) {
                    onDeleteProgram(program.id);
                  }
                }}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer font-bold rounded-2xl text-xs transition-all"
              >
                Delete program
              </button>
            )}
          </div>
        )}
      </div>

      {/* Program Summary Header Banner */}
      <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-xs relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                program.status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : program.status === 'ongoing'
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {program.status}
              </span>
              <span className="text-[11px] text-slate-400 font-bold">PID-{program.id}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{program.name}</h1>
            <p className="text-slate-500 text-xs md:text-sm max-w-2xl">{program.description}</p>
          </div>

          {/* Quick Stats sidebar inside project box */}
          <div className="bg-slate-50/50 border border-slate-100/60 rounded-2xl p-4 flex flex-wrap gap-6 items-center shrink-0">
            <div className="text-center md:text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Allocated Budget</span>
              <span className="text-sm font-black text-slate-800">{formatPesos(program.budget)}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
            <div className="text-center md:text-left">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Approved Sittings</span>
              <span className="text-sm font-black text-slate-800">
                {programMembers.filter((m) => m.registration_status === 'approved').length} Joined
              </span>
            </div>
          </div>
        </div>

        {/* Location / Timings strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold leading-none mb-1">Target Date</span>
              <span className="font-bold text-slate-700">{new Date(program.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold leading-none mb-1">Scheduled Hours</span>
              <span className="font-bold text-slate-700">{program.time || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-bold leading-none mb-1">Assigned Venue</span>
              <span className="font-bold text-slate-700 truncate block max-w-[200px]">{program.location || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation options */}
      <div className="border-b border-slate-100 flex items-center gap-2 flex-wrap">
        {[
          { id: 'overview', label: 'Overview & Files', roles: ['admin', 'skofficial', 'regular', 'viewer'] },
          { id: 'participants', label: `Participant Approvals (${programMembers.length})`, roles: ['admin', 'skofficial', 'viewer'] },
          { id: 'expenses', label: 'Expenses Ledger', roles: ['admin', 'skofficial', 'viewer'] },
          { id: 'attendance', label: 'Attendance Roll', roles: ['admin', 'skofficial', 'regular', 'viewer'] },
          { id: 'feedback', label: `Reviews (${programFeedbacks.length})`, roles: ['admin', 'skofficial', 'regular', 'viewer'] }
        ]
          .filter((tab) => tab.roles.includes(currentUser.role))
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold border-b-2 hover:text-slate-950 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-900 bg-emerald-50/10'
                  : 'border-transparent text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {/* Tabs details panels */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description & Goals</h3>
              <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">{program.description || 'No descriptive copy added.'}</p>

              {/* Poster files attachment downloads */}
              <div className="pt-4 border-t border-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document Attachments List</h4>
                {program.file_urls && program.file_urls.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {program.file_urls.map((file, idx) => (
                      <a
                        key={idx}
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert(`Evaluating client download for certified file path: ${file}`); }}
                        className="p-3 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/10 rounded-xl flex items-center justify-between text-xs text-slate-600 font-semibold transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-emerald-600" />
                          <span>{file.split('/').pop()}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">Download Log</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                    No attachment poster uploaded for this session.
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Overview controls (including join button for residents) */}
            <div className="space-y-6">
              {currentUser.role === 'regular' && (
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl p-6 space-y-4 shadow-sm">
                  <Bookmark className="w-8 h-8 opacity-80" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Join Program Outreach</h3>
                    <p className="text-xs text-emerald-100 mt-1">
                      Register as a local participant from Barangay San Francisco to lock in attendance list status.
                    </p>
                  </div>

                  {!userProgramReg ? (
                    <button
                      onClick={handleSelfJoinClick}
                      className="w-full py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 cursor-pointer font-bold rounded-xl text-xs transition-all text-center shadow-md animate-pulse"
                    >
                      Self-Register Now
                    </button>
                  ) : (
                    <div className="pt-2">
                      <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>Registration Status:</span>
                          <span className="uppercase text-[10px] bg-white/20 py-0.5 px-2 rounded">
                            {userProgramReg.registration_status}
                          </span>
                        </div>
                        {userProgramReg.registration_status === 'pending' && (
                          <p className="text-[10px] text-emerald-100 mt-1">
                            Your application is pending SK Chairman's structural credential review. Keep checking!
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status overview and budget indicator blocks */}
              <div className="bg-white border border-slate-100 p-5 rounded-3xl space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Alignment</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Program Budget:</span>
                  <span className="text-slate-800 font-bold">{formatPesos(program.budget)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Expenses Audited:</span>
                  <span className="text-slate-800 font-bold">{formatPesos(totalSpent)}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Utilization Rate</span>
                    <span>{budgetUtilization}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${budgetUtilization > 100 ? 'bg-red-500' : 'bg-emerald-600'}`}
                      style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PARTICIPATION APPROVALS (Officials Only) */}
        {activeTab === 'participants' && (
          <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Active Participant Roll Worklogs</h3>
                <p className="text-xs text-slate-400">Review register files, assign entry approval credentials, or manage status parameters.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl">
                {programMembers.length} applications
              </span>
            </div>

            {/* Application records list */}
            {programMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                No resident applications has logged entries for this program yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                {programMembers.map((pm) => {
                  const auditReg = programRegistrations.find((r) => r.participant_id === pm.participant_id);
                  const isPending = pm.registration_status === 'pending';

                  return (
                    <div key={pm.participant_id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:bg-slate-5/20 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">
                            {pm.participant?.first_name} {pm.participant?.last_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">({pm.participant?.age} yrs old)</span>
                          <span className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded ${
                            pm.registration_status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : pm.registration_status === 'rejected'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {pm.registration_status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Zone address: {pm.participant?.address}</p>
                        {auditReg?.notes && (
                          <div className="text-[10px] bg-slate-50/80 p-1.5 rounded text-slate-500 border border-slate-100">
                            <span className="font-bold">Remarks:</span> "{auditReg.notes}"
                          </div>
                        )}
                      </div>

                      {/* Approval options widget inline */}
                      {canEdit && isPending && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          {selectedReg === auditReg?.id ? (
                            <div className="flex flex-col gap-2 p-2 bg-slate-50 rounded-xl w-64">
                              <input
                                type="text"
                                placeholder="Add administrative note..."
                                value={adminNote[auditReg?.id || 0] || ''}
                                onChange={(e) => setAdminNote(prev => ({ ...prev, [auditReg?.id || 0]: e.target.value }))}
                                className="p-1 px-2 border border-slate-100 bg-white rounded-lg text-xs"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => setSelectedReg(null)}
                                  className="px-2 py-1 text-[10px] font-bold text-slate-400"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReject(auditReg!.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleApprove(auditReg!.id)}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                                >
                                  Approve
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedReg(auditReg?.id || null)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white font-bold rounded-xl text-xs transition-all text-center"
                            >
                              Approve / Reject Action
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPENSES LEDGER */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary logs list */}
              <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Itemized Budget Disbursements</h3>
                  <span className="text-xs font-bold text-slate-400">Records audited: {programExpenses.length}</span>
                </div>

                {programExpenses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No expense items ledger compiled for this program.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 border border-slate-50 rounded-2xl overflow-hidden">
                    {programExpenses.map((e) => (
                      <div key={e.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{e.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-semibold">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase">
                              {e.category}
                            </span>
                            <span>•</span>
                            <span>{new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-800">{formatPesos(e.amount)}</span>
                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm('Irreversibly delete this expense log?')) {
                                  onDeleteExpense(e.id);
                                }
                              }}
                              className="p-1 hover:bg-red-50 rounded-lg text-rose-600 transition-colors"
                              title="Delete log"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Log new expense panel on-the-fly */}
              <div>
                {canEdit ? (
                  <form onSubmit={handleAddExpenseSubmit} className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Log Program Expense</span>
                    </h3>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Descriptor Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Refreshment meals for attendees"
                        value={newExpenseDesc}
                        onChange={(e) => setNewExpenseDesc(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₱)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Pesos"
                          value={newExpenseAmount}
                          onChange={(e) => setNewExpenseAmount(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                        <select
                          value={newExpenseCategory}
                          onChange={(e: any) => setNewExpenseCategory(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                        >
                          {['Food', 'Supplies', 'Transport', 'Honorarium', 'Other'].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Date of Purchase</label>
                      <input
                        type="date"
                        required
                        value={newExpenseDate}
                        onChange={(e) => setNewExpenseDate(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl animate-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white font-bold rounded-xl text-xs transition-all text-center"
                    >
                      Audit Log Expense
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-50 p-4 border rounded-2xl text-xs text-slate-400 text-center">
                    Guests are restricted from logging new expenses.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ATTENDANCE TRACKING (Roll Call) */}
        {activeTab === 'attendance' && (
          <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Attendance Roll Sheet</h3>
                <p className="text-xs text-slate-400">Mark or view target sittings. Approved program roster is listed here.</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                Manual Audit Roster
              </span>
            </div>

            {/* Attendance list table */}
            {programMembers.filter((m) => m.registration_status === 'approved').length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No approved participants are registered onto the program yet. Log registrations to enable call checks.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                      <th className="p-4">Full Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Present</th>
                      <th className="p-4">Absent</th>
                      <th className="p-4">Excused</th>
                      <th className="p-4">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                    {programMembers
                      .filter((pm) => pm.registration_status === 'approved')
                      .map((pm) => {
                        return (
                          <tr key={pm.participant_id} className="hover:bg-slate-50/20">
                            <td className="p-4">
                              <span className="font-bold text-slate-800">
                                {pm.participant?.first_name} {pm.participant?.last_name}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-slate-500 text-[11px]">{pm.participant?.contact || 'N/A'}</td>

                            {/* Present box */}
                            <td className="p-4">
                              <input
                                type="radio"
                                name={`attendance-${pm.participant_id}`}
                                disabled={!canEdit}
                                checked={pm.attendance_status === 'present'}
                                onChange={() => onUpdateAttendance(program.id, pm.participant_id, 'present')}
                                className="w-4 h-4 accent-emerald-600 disabled:opacity-50"
                              />
                            </td>

                            {/* Absent box */}
                            <td className="p-4">
                              <input
                                type="radio"
                                name={`attendance-${pm.participant_id}`}
                                disabled={!canEdit}
                                checked={pm.attendance_status === 'absent'}
                                onChange={() => onUpdateAttendance(program.id, pm.participant_id, 'absent')}
                                className="w-4 h-4 accent-rose-600 disabled:opacity-50"
                              />
                            </td>

                            {/* Excused box */}
                            <td className="p-4">
                              <input
                                type="radio"
                                name={`attendance-${pm.participant_id}`}
                                disabled={!canEdit}
                                checked={pm.attendance_status === 'excused'}
                                onChange={() => onUpdateAttendance(program.id, pm.participant_id, 'excused')}
                                className="w-4 h-4 accent-yellow-600 disabled:opacity-50"
                              />
                            </td>

                            <td className="p-4 uppercase text-[10px]">
                              <span className={`px-2 py-0.5 rounded font-black ${
                                pm.attendance_status === 'present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : pm.attendance_status === 'excused'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {pm.attendance_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: REVIEWS & OUTREACH FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Citizen Submissions</h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 py-1 px-2 rounded-xl font-bold">
                  Average Rating: {avgRating} ★
                </span>
              </div>

              {programFeedbacks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No citizen response logged for this program session yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {programFeedbacks.map((f) => {
                    const part = participants.find((p) => p.id === f.participant_id);
                    return (
                      <div key={f.id} className="py-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {part ? `${part.first_name} ${part.last_name}` : 'Anonymous Resident'}
                          </span>
                          <div className="flex text-amber-500 font-bold items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < f.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">"{f.comment}"</p>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          Posted on: {new Date(f.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submission form for residents */}
            <div>
              {currentUser.role === 'regular' && userProgramReg?.registration_status === 'approved' ? (
                <form onSubmit={handleFeedbackSubmit} className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Post Program Feedback</span>
                  </h3>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Interactive Rating (1 - 5 stars)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`p-1 hover:scale-110 cursor-pointer ${
                            star <= feedbackRating ? 'text-amber-400' : 'text-slate-200'
                          }`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Write Your Remark or Suggestion</label>
                    <textarea
                      required
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="e.g. This was highly informative, please bring more food next time!"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white font-bold rounded-xl text-xs transition-all text-center"
                  >
                    Publish Review
                  </button>
                </form>
              ) : currentUser.role === 'regular' ? (
                <div className="bg-slate-50 p-4 border rounded-2xl text-xs text-slate-400 text-center">
                  Only residents with <span className="font-bold text-emerald-700">Approved</span> registrations can post feedback.
                </div>
              ) : (
                <div className="bg-slate-50 p-4 border rounded-2xl text-xs text-slate-400 text-center">
                  Official accounts view feedback but cannot publish reviews.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
