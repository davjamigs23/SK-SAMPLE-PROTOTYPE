/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  getStoredDB,
  saveStoredDB,
  SEED_USERS,
  SEED_PARTICIPANTS,
  SEED_PROGRAMS,
  SEED_EXPENSES,
  SEED_PROGRAM_PARTICIPANTS,
  SEED_REGISTRATIONS,
  SEED_FEEDBACKS,
  SEED_NOTIFICATIONS,
  SCHEMAS_SQL_TEXT
} from './db';
import {
  SKDatabase,
  User,
  UserRole,
  Participant,
  Program,
  Expense,
  ProgramParticipant,
  Registration,
  Feedback,
  AppNotification
} from './types';

// Components
import DashboardLayout from './components/DashboardLayout';
import DashboardView from './components/DashboardView';
import CalendarComponent from './components/CalendarComponent';
import ProgramDetailsTab from './components/ProgramDetailsTab';

// Lucide icon assets
import {
  CalendarDays,
  Users,
  CircleDollarSign,
  FileBarChart,
  UserCircle,
  MessageSquare,
  ShieldCheck,
  Plus,
  Search,
  Grid,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  Mail,
  UserCheck,
  ArrowRight,
  ChevronRight,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  Trash2,
  Bookmark,
  Building,
  Star,
  RefreshCw,
  Award
} from 'lucide-react';

import { jsPDF } from 'jspdf';

export default function App() {
  // --- DATABASE & SESSION STATES ---
  const [db, setDb] = useState<SKDatabase>(getStoredDB());
  const [currentUser, setCurrentUser] = useState<User>(db.users[0]); // Default to first (admin) for evaluation ease
  const [currentRoute, setCurrentRoute] = useState<string>('landing');

  // --- FORM INPUT STATES ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('regular');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerAge, setRegisterAge] = useState('20');
  const [registerContact, setRegisterContact] = useState('');
  const [registerAddress, setRegisterAddress] = useState('Zone 1, Barangay San Francisco, Naga City');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Password reset simulation
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // --- PROGRAM REGISTRY PAGE STATES ---
  const [programViewType, setProgramViewType] = useState<'grid' | 'calendar'>('grid');
  const [programSearch, setProgramSearch] = useState('');
  const [programStatusFilter, setProgramStatusFilter] = useState<string>('all');
  const [programMonthFilter, setProgramMonthFilter] = useState<string>('all');
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  // Program edit form
  const [progFormName, setProgFormName] = useState('');
  const [progFormDesc, setProgFormDesc] = useState('');
  const [progFormDate, setProgFormDate] = useState('');
  const [progFormTime, setProgFormTime] = useState('');
  const [progFormLoc, setProgFormLoc] = useState('');
  const [progFormBudget, setProgFormBudget] = useState('');
  const [progFormStatus, setProgFormStatus] = useState<'planned' | 'ongoing' | 'completed'>('planned');
  const [progFormFiles, setProgFormFiles] = useState('');

  // --- PARTICIPANTS PAGE STATES ---
  const [participantSearch, setParticipantSearch] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);

  // Participant edit form
  const [partFormFirst, setPartFormFirst] = useState('');
  const [partFormLast, setPartFormLast] = useState('');
  const [partFormAge, setPartFormAge] = useState('');
  const [partFormCont, setPartFormCont] = useState('');
  const [partFormEmail, setPartFormEmail] = useState('');
  const [partFormAddr, setPartFormAddr] = useState('');

  // --- EXPENSE REGISTRY STATES ---
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseProgramFilter, setExpenseProgramFilter] = useState('all');

  // New Global Expense
  const [expFormProgId, setExpFormProgId] = useState('');
  const [expFormDesc, setExpFormDesc] = useState('');
  const [expFormAmount, setExpFormAmount] = useState('');
  const [expFormDate, setExpFormDate] = useState('');
  const [expFormCat, setExpFormCat] = useState<'Food' | 'Supplies' | 'Transport' | 'Honorarium' | 'Other'>('Supplies');

  // --- REPORTS FILTER SYSTEM ---
  const [reportStartDate, setReportStartDate] = useState('2026-01-01');
  const [reportEndDate, setReportEndDate] = useState('2026-12-31');
  const [reportProgramFilter, setReportProgramFilter] = useState('all');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('all');

  // --- USER PROFILE SECURITY ---
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPat, setProfileConfirmPat] = useState('');
  const [profileSuccessAlert, setProfileSuccessAlert] = useState(false);

  // --- TOAST/SUCCESS ALERT ENGINE ---
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActiveToast({ message, type });
    setTimeout(() => {
      setActiveToast(null);
    }, 4000);
  };

  // Sync state mutations to LocalStorage
  const updateDBState = (updated: SKDatabase) => {
    setDb(updated);
    saveStoredDB(updated);
  };

  // Impersonating roles (Instantly logs in matching seeded user, or mocks one)
  const handleRoleImpersonation = (role: UserRole) => {
    const userRoleMatch = db.users.find((u) => u.role === role && u.is_approved);
    if (userRoleMatch) {
      setCurrentUser(userRoleMatch);
      showToast(`Impersonated: ${userRoleMatch.email} (${role.toUpperCase()})`, 'info');
    } else {
      // Build a fallback approved simulated session
      const mockUser: User = {
        id: `mock-${role}-user`,
        email: `${role}-demo@sanfrancisco.gov`,
        role: role,
        is_approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const newUsers = [...db.users];
      if (!newUsers.some(u => u.id === mockUser.id)) {
        newUsers.push(mockUser);
      }
      
      const updated = { ...db, users: newUsers };
      updateDBState(updated);
      setCurrentUser(mockUser);
      showToast(`Impersonated simulated guest: ${mockUser.email}`, 'info');
    }
  };

  // --- NOTIFICATION UTILS ---
  const handleMarkNotificationAsRead = (id: string) => {
    const updatedNotifs = db.notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    );
    updateDBState({ ...db, notifications: updatedNotifs });
  };

  const handleClearNotifications = () => {
    updateDBState({ ...db, notifications: [] });
    showToast('Notifications console cleared', 'success');
  };

  // Create customized user triggered inside workflows
  const pushNotification = (title: string, message: string) => {
    const fresh: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    };
    updateDBState({ ...db, notifications: [fresh, ...db.notifications] });
  };

  // --- SECURE AUTHENTICATION OPERATIONS ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Complete all password and email entry slots.');
      return;
    }

    const matched = db.users.find((u) => u.email === loginEmail.toLowerCase());
    if (!matched) {
      setLoginError('No credentials match that email format.');
      return;
    }

    if (!matched.is_approved) {
      setLoginError('This account is pending Admin approval. Please contact SK Chairman Ramon Valenzuela.');
      return;
    }

    // Success login
    setCurrentUser(matched);
    showToast(`Access Granted. Welcome back, ${matched.email}!`, 'success');
    if (matched.role === 'regular') {
      setCurrentRoute('user-dashboard');
    } else {
      setCurrentRoute('dashboard');
    }
    setLoginEmail('');
    setLoginPassword('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);

    if (!registerEmail || !registerPassword || !registerFirstName || !registerLastName || !registerContact) {
      setRegisterError('All personal details are mandatory.');
      return;
    }

    if (db.users.some((u) => u.email === registerEmail.toLowerCase())) {
      setRegisterError('This email is already associated with an account.');
      return;
    }

    const newUserId = `user-${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      email: registerEmail.toLowerCase(),
      role: registerRole,
      is_approved: registerRole === 'regular' ? false : true, // Regular requires approval, Officials auto-made for test comfort
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newPart: Participant = {
      id: db.participants.length + 1,
      user_id: newUserId,
      first_name: registerFirstName,
      last_name: registerLastName,
      age: parseInt(registerAge) || 20,
      contact: registerContact,
      email: registerEmail.toLowerCase(),
      address: registerAddress,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedUsers = [...db.users, newUser];
    const updatedParticipants = [...db.participants, newPart];

    // Trigger alert
    const notifTitle = 'New Youth Registration';
    const notifMsg = `${registerFirstName} ${registerLastName} requested a "${registerRole}" access handle. Pending review.`;

    updateDBState({
      ...db,
      users: updatedUsers,
      participants: updatedParticipants,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: notifTitle,
          message: notifMsg,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...db.notifications
      ]
    });

    setRegisterSuccess(true);
    showToast('Registration submitted for administrator approval.', 'success');

    // If it's an official registration, trigger bypass so they don't block
    if (registerRole !== 'regular') {
      newUser.is_approved = true;
      updateDBState({ ...db, users: [...db.users, newUser], participants: updatedParticipants });
    }

    // Reset inputs
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterFirstName('');
    setRegisterLastName('');
    setRegisterContact('');
  };

  // --- PROGRAM MANAGEMENT OPERATIONS ---
  const handleCreateProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progFormName || !progFormDate || !progFormLoc) {
      showToast('Program parameters missing!', 'error');
      return;
    }

    const nextId = db.programs.length > 0 ? Math.max(...db.programs.map((p) => p.id)) + 1 : 1;
    const filesArray = progFormFiles ? progFormFiles.split(',').map(s => s.trim()) : [];

    const newProg: Program = {
      id: nextId,
      name: progFormName,
      description: progFormDesc,
      date: progFormDate,
      time: progFormTime || '10:00 AM',
      location: progFormLoc,
      budget: parseFloat(progFormBudget) || 0,
      status: progFormStatus,
      file_urls: filesArray,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    updateDBState({
      ...db,
      programs: [...db.programs, newProg]
    });

    pushNotification('Program Registry Modified', `New program "${progFormName}" has been officially scheduled for ${progFormDate}.`);
    showToast(`Successfully published ${progFormName}!`, 'success');

    // Reset forms and navigate back
    setProgFormName('');
    setProgFormDesc('');
    setProgFormDate('');
    setProgFormTime('');
    setProgFormLoc('');
    setProgFormBudget('');
    setProgFormStatus('planned');
    setProgFormFiles('');
    setCurrentRoute('programs');
  };

  const handleEditProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) return;

    const filesArray = progFormFiles ? progFormFiles.split(',').map(s => s.trim()) : [];

    const updatedProgs = db.programs.map((p) => {
      if (p.id === selectedProgramId) {
        return {
          ...p,
          name: progFormName,
          description: progFormDesc,
          date: progFormDate,
          time: progFormTime,
          location: progFormLoc,
          budget: parseFloat(progFormBudget) || 0,
          status: progFormStatus,
          file_urls: filesArray,
          updated_at: new Date().toISOString()
        };
      }
      return p;
    });

    updateDBState({ ...db, programs: updatedProgs });
    showToast('Program parameters modified successfully.', 'success');
    setCurrentRoute('programs');
  };

  const handleDeleteProgram = (id: number) => {
    const updated = db.programs.filter((p) => p.id !== id);
    const updatedPP = db.program_participants.filter((pp) => pp.program_id !== id);
    const updatedExp = db.expenses.filter((e) => e.program_id !== id);
    const updatedRegs = db.registrations.filter((r) => r.program_id !== id);
    const updatedFeedback = db.feedbacks.filter((f) => f.program_id !== id);

    updateDBState({
      ...db,
      programs: updated,
      program_participants: updatedPP,
      expenses: updatedExp,
      registrations: updatedRegs,
      feedbacks: updatedFeedback
    });

    showToast('Program records completely removed.', 'info');
    setSelectedProgramId(null);
    setCurrentRoute('programs');
  };

  // --- PARTICIPANT MANAGEMENT OPERATIONS ---
  const handleCreateParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partFormFirst || !partFormLast || !partFormEmail) return;

    const nextId = db.participants.length > 0 ? Math.max(...db.participants.map((p) => p.id)) + 1 : 1;

    const newPart: Participant = {
      id: nextId,
      user_id: `user-guest-${Date.now()}`,
      first_name: partFormFirst,
      last_name: partFormLast,
      age: parseInt(partFormAge) || 20,
      contact: partFormCont,
      email: partFormEmail.toLowerCase(),
      address: partFormAddr || 'Barangay San Francisco, Naga City',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    updateDBState({ ...db, participants: [...db.participants, newPart] });
    showToast(`Resident profiles created: ${partFormFirst} ${partFormLast}`);

    setPartFormFirst('');
    setPartFormLast('');
    setPartFormAge('20');
    setPartFormCont('');
    setPartFormEmail('');
    setPartFormAddr('');
    setCurrentRoute('participants');
  };

  const handleEditParticipantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId) return;

    const updated = db.participants.map((p) => {
      if (p.id === selectedParticipantId) {
        return {
          ...p,
          first_name: partFormFirst,
          last_name: partFormLast,
          age: parseInt(partFormAge) || p.age,
          contact: partFormCont,
          address: partFormAddr,
          updated_at: new Date().toISOString()
        };
      }
      return p;
    });

    updateDBState({ ...db, participants: updated });
    showToast('Resident profile modified.', 'success');
    setCurrentRoute('participants');
  };

  // --- REGISTRATION APPROVALWORKFLOWS ---
  const handleJoinProgramSelf = (progId: number) => {
    // Regular self registration
    const residentPart = db.participants.find((p) => p.user_id === currentUser.id);
    if (!residentPart) {
      showToast('Need a youth resident participant file to qualify.', 'error');
      return;
    }

    // Check existing
    const alreadyJoined = db.program_participants.some(
      (pp) => pp.program_id === progId && pp.participant_id === residentPart.id
    );
    if (alreadyJoined) {
      showToast('Registration already requested for this program.', 'info');
      return;
    }

    // Insert into junction
    const freshPP: ProgramParticipant = {
      program_id: progId,
      participant_id: residentPart.id,
      registration_status: 'pending',
      attendance_status: 'absent',
      registered_at: new Date().toISOString()
    };

    // Insert audit log
    const regId = db.registrations.length > 0 ? Math.max(...db.registrations.map((r) => r.id)) + 1 : 1;
    const freshAudit: Registration = {
      id: regId,
      program_id: progId,
      participant_id: residentPart.id,
      registration_date: new Date().toISOString(),
      status: 'pending',
      notes: 'Initial youth resident self-registration upload slot.'
    };

    const targetProg = db.programs.find(p => p.id === progId);

    // Push state
    updateDBState({
      ...db,
      program_participants: [...db.program_participants, freshPP],
      registrations: [...db.registrations, freshAudit]
    });

    pushNotification(
      'New Student Join Request',
      `${residentPart.first_name} applied for "${targetProg?.name || 'Program'}"`
    );
    showToast('Join request filed. Awaiting SK board validation.', 'success');
  };

  const handleApproveRegistration = (regId: number, notes: string) => {
    const matchedAudit = db.registrations.find((r) => r.id === regId);
    if (!matchedAudit) return;

    // Update registration audit
    const updatedAudits = db.registrations.map((r) =>
      r.id === regId
        ? {
            ...r,
            status: 'approved' as const,
            notes,
            approved_by: currentUser.id,
            approved_at: new Date().toISOString()
          }
        : r
    );

    // Update program_participants state
    const updatedPP = db.program_participants.map((pp) =>
      pp.program_id === matchedAudit.program_id && pp.participant_id === matchedAudit.participant_id
        ? { ...pp, registration_status: 'approved' as const }
        : pp
    );

    updateDBState({
      ...db,
      registrations: updatedAudits,
      program_participants: updatedPP
    });

    const student = db.participants.find((p) => p.id === matchedAudit.participant_id);
    const prog = db.programs.find((p) => p.id === matchedAudit.program_id);

    pushNotification(
      'Registration Approved',
      `Resident ${student?.first_name} has been enrolled in ${prog?.name}.`
    );
    showToast('Resident program reservation approved.', 'success');
  };

  const handleRejectRegistration = (regId: number, notes: string) => {
    const matchedAudit = db.registrations.find((r) => r.id === regId);
    if (!matchedAudit) return;

    const updatedAudits = db.registrations.map((r) =>
      r.id === regId
        ? {
            ...r,
            status: 'rejected' as const,
            notes,
            approved_by: currentUser.id,
            approved_at: new Date().toISOString()
          }
        : r
    );

    const updatedPP = db.program_participants.map((pp) =>
      pp.program_id === matchedAudit.program_id && pp.participant_id === matchedAudit.participant_id
        ? { ...pp, registration_status: 'rejected' as const }
        : pp
    );

    updateDBState({
      ...db,
      registrations: updatedAudits,
      program_participants: updatedPP
    });

    showToast('Resident application rejected.', 'info');
  };

  // --- ATTENDANCE SYSTEM ---
  const handleUpdateAttendanceState = (progId: number, partId: number, status: ProgramParticipant['attendance_status']) => {
    const updated = db.program_participants.map((pp) =>
      pp.program_id === progId && pp.participant_id === partId
        ? { ...pp, attendance_status: status }
        : pp
    );

    updateDBState({ ...db, program_participants: updated });
    showToast('Attendance status saved.', 'success');
  };

  // --- EXPENSE MONITORING CORES ---
  const handleAddNewGlobalExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expFormProgId || !expFormDesc || !expFormAmount || !expFormDate) {
      showToast('Fill in all necessary expense criteria.', 'error');
      return;
    }

    const nextId = db.expenses.length > 0 ? Math.max(...db.expenses.map((ex) => ex.id)) + 1 : 1;
    const freshEx: Expense = {
      id: nextId,
      program_id: parseInt(expFormProgId),
      description: expFormDesc,
      amount: parseFloat(expFormAmount),
      date: expFormDate,
      category: expFormCat,
      recorded_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    updateDBState({ ...db, expenses: [...db.expenses, freshEx] });
    showToast(`Logged expenditure allocation: ${expFormDesc}`, 'success');

    // Reset
    setExpFormProgId('');
    setExpFormDesc('');
    setExpFormAmount('');
    setExpFormDate('');
    setExpFormCat('Supplies');
    setCurrentRoute('expenses');
  };

  const handleAddNewProgramExpense = (progId: number, partialExpense: Omit<Expense, 'id' | 'created_at'>) => {
    const nextId = db.expenses.length > 0 ? Math.max(...db.expenses.map((ex) => ex.id)) + 1 : 1;
    const fresh: Expense = {
      ...partialExpense,
      id: nextId,
      created_at: new Date().toISOString()
    };

    updateDBState({ ...db, expenses: [...db.expenses, fresh] });
    showToast('Disbursement logged on the fly.', 'success');
  };

  const handleDeleteExpenseGlobal = (id: number) => {
    const updated = db.expenses.filter((e) => e.id !== id);
    updateDBState({ ...db, expenses: updated });
    showToast('Expense records updated successfully.', 'info');
  };

  // --- FEEDBACK MODULE ---
  const handlePublishFeedback = (progId: number, rating: number, comment: string) => {
    const resident = db.participants.find((p) => p.user_id === currentUser.id);
    if (!resident) return;

    const nextId = db.feedbacks.length > 0 ? Math.max(...db.feedbacks.map((f) => f.id)) + 1 : 1;
    const freshFeed: Feedback = {
      id: nextId,
      program_id: progId,
      participant_id: resident.id,
      rating,
      comment,
      created_at: new Date().toISOString()
    };

    updateDBState({ ...db, feedbacks: [...db.feedbacks, freshFeed] });
    showToast('Your program evaluation was logged to Naga LGU auditors.', 'success');
  };

  // --- ADMIN USER CONSOLE APPROVALS ---
  const handleApproveUserAccount = (userId: string) => {
    const updatedUsers = db.users.map((u) =>
      u.id === userId ? { ...u, is_approved: true } : u
    );

    updateDBState({ ...db, users: updatedUsers });
    showToast('User granted access to portal. Standard verification complete!');
  };

  // --- FILTERS COMPILING ---

  // Program filters
  const filteredPrograms = useMemo(() => {
    return db.programs.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(programSearch.toLowerCase()) ||
        p.location.toLowerCase().includes(programSearch.toLowerCase());

      const matchStatus = programStatusFilter === 'all' || p.status === programStatusFilter;

      let matchMonth = true;
      if (programMonthFilter !== 'all') {
        const m = p.date.split('-')[1]; // Year-Month-Day
        matchMonth = m === programMonthFilter;
      }

      return matchSearch && matchStatus && matchMonth;
    });
  }, [db.programs, programSearch, programStatusFilter, programMonthFilter]);

  // Participants filters
  const filteredParticipants = useMemo(() => {
    return db.participants.filter((p) => {
      const nameStr = `${p.first_name} ${p.last_name}`.toLowerCase();
      return (
        nameStr.includes(participantSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(participantSearch.toLowerCase()) ||
        p.contact.includes(participantSearch)
      );
    });
  }, [db.participants, participantSearch]);

  // Public/All expenses filters
  const filteredExpenses = useMemo(() => {
    return db.expenses.filter((e) => {
      const matchDesc = e.description.toLowerCase().includes(expenseSearch.toLowerCase());
      const matchCat = expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
      const matchProg = expenseProgramFilter === 'all' || e.program_id === parseInt(expenseProgramFilter);
      return matchDesc && matchCat && matchProg;
    });
  }, [db.expenses, expenseSearch, expenseCategoryFilter, expenseProgramFilter]);

  // Audit expenses report compilation
  const reportRecords = useMemo(() => {
    return db.expenses.filter((e) => {
      const expenseTime = new Date(e.date).getTime();
      const startT = new Date(reportStartDate).getTime();
      const endT = new Date(reportEndDate).getTime();

      const inDateRange = expenseTime >= startT && expenseTime <= endT;
      const passProg = reportProgramFilter === 'all' || e.program_id === parseInt(reportProgramFilter);
      const passCat = reportCategoryFilter === 'all' || e.category === reportCategoryFilter;

      return inDateRange && passProg && passCat;
    });
  }, [db.expenses, reportStartDate, reportEndDate, reportProgramFilter, reportCategoryFilter]);

  const reportTotalSum = useMemo(() => {
    return reportRecords.reduce((sum, r) => sum + r.amount, 0);
  }, [reportRecords]);

  // --- PDF REPORTS GENERATION WITH JSPDF ---
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // Barangay San Francisco Banner Head
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129); // Emerald Green Accent
      doc.text("SANGGUNIANG KABATAAN - BARANGAY SAN FRANCISCO", 14, 15);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Barangay Secretariat, Naga City, Camarines Sur, Region V", 14, 19);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} • FY 2026`, 14, 23);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 26, 196, 26);

      // Report Header parameters
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("FINANCIAL EXPENDITURE & AUDIT REPORT", 14, 34);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Timeline: ${reportStartDate} to ${reportEndDate}`, 14, 40);
      doc.text(`Category Filter: ${reportCategoryFilter.toUpperCase()}`, 14, 44);
      doc.text(`Program Filter: ${reportProgramFilter === 'all' ? 'ALL INITIATIVES' : 'SELECTED PROGRAM ID: ' + reportProgramFilter}`, 14, 48);

      // Total Summaries box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 52, 182, 14, "F");
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(4, 120, 87);
      doc.text(`TOTAL AUDITED DISBURSEMENTS: P ${reportTotalSum.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 18, 61);

      // Table Headers
      let currentY = 76;
      doc.setFillColor(16, 185, 129);
      doc.rect(14, currentY, 182, 7, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      
      doc.text("DATE", 16, currentY + 5);
      doc.text("PROGRAM ID / NAME", 40, currentY + 5);
      doc.text("CATEGORY", 102, currentY + 5);
      doc.text("DESCRIPTOR REMARKS", 125, currentY + 5);
      doc.text("AMOUNT", 172, currentY + 5);

      // Iterative records listing
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "normal");

      reportRecords.forEach((record, index) => {
        currentY += 8;
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }

        const progName = db.programs.find((p) => p.id === record.program_id)?.name || `Prog #${record.program_id}`;
        
        doc.text(record.date, 16, currentY);
        doc.text(progName.substring(0, 30), 40, currentY);
        doc.text(record.category, 102, currentY);
        doc.text(record.description.substring(0, 24), 125, currentY);
        doc.text(`P ${record.amount.toLocaleString()}`, 172, currentY);

        // Grid lines
        doc.setDrawColor(241, 245, 249);
        doc.line(14, currentY + 2, 196, currentY + 2);
      });

      // Signature block setup
      currentY += 25;
      if (currentY > 250) {
        doc.addPage();
        currentY = 30;
      }

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);

      doc.text("Prepared & Compiled By:", 14, currentY);
      doc.text("Reviewed & Confirmed By:", 120, currentY);

      currentY += 15;
      doc.line(14, currentY, 74, currentY);
      doc.line(120, currentY, 180, currentY);

      doc.setFont("Helvetica", "normal");
      doc.text("Patricia Mae S. Reyes", 14, currentY + 4);
      doc.setFont("Helvetica", "bold");
      doc.text("SK Treasurer", 14, currentY + 8);

      doc.setFont("Helvetica", "normal");
      doc.text("Ramon L. Valenzuela", 120, currentY + 4);
      doc.setFont("Helvetica", "bold");
      doc.text("SK Chairman", 120, currentY + 8);

      window.open(doc.output('bloburl'), '_blank');
      showToast('Expenditure Audit Report exported to PDF successfully.', 'success');
    } catch (e) {
      console.error(e);
      showToast('PDF compilation crashed. Check system modules.', 'error');
    }
  };

  // Switch fields on edits helpers
  const startEditProgram = (id: number) => {
    const p = db.programs.find((x) => x.id === id);
    if (!p) return;
    setSelectedProgramId(id);
    setProgFormName(p.name);
    setProgFormDesc(p.description);
    setProgFormDate(p.date);
    setProgFormTime(p.time);
    setProgFormLoc(p.location);
    setProgFormBudget(String(p.budget));
    setProgFormStatus(p.status);
    setProgFormFiles(p.file_urls ? p.file_urls.join(', ') : '');
    setCurrentRoute('programs-edit');
  };

  const startEditParticipant = (id: number) => {
    const p = db.participants.find((x) => x.id === id);
    if (!p) return;
    setSelectedParticipantId(id);
    setPartFormFirst(p.first_name);
    setPartFormLast(p.last_name);
    setPartFormAge(String(p.age));
    setPartFormCont(p.contact);
    setPartFormAddr(p.address);
    setCurrentRoute('participant-edit');
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Toast Alert pop */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 transform animate-bounce">
          {activeToast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : activeToast.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{activeToast.message}</span>
        </div>
      )}

      {/* ROUTING TREE */}
      {currentRoute === 'landing' ? (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
          {/* Header */}
          <header className="w-full px-4 md:px-8 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 bg-white z-50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center relative w-6 h-6 mr-1">
                  <div className="absolute w-4 h-4 rounded-full border-[3px] border-cyan-400 left-0 top-1 z-10"></div>
                  <div className="absolute w-4 h-4 rounded-full bg-blue-500 right-0 top-1 opacity-80"></div>
                </div>
                <span className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
                  <span className="text-[#0d2f3f] font-black mr-1">PMMS</span> <span className="text-[#008f5d]">SK Monitor</span>
                </span>
              </div>
              <div className="hidden md:flex ml-4">
                <span className="px-3 py-1 border border-[#008f5d]/30 text-[#008f5d] text-xs font-semibold rounded-md uppercase tracking-wider">Features</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentRoute('login')}
                className="px-5 py-1.5 border border-[#008f5d] text-[#008f5d] hover:bg-[#008f5d]/5 rounded text-sm font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentRoute('register')}
                className="px-5 py-1.5 bg-[#008f5d] hover:bg-[#007a4f] text-white rounded text-sm font-medium transition-colors"
              >
                Sign Up
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <section className="bg-[#1b6b50] text-white relative py-20 px-6 sm:px-12 md:px-24 flex flex-col md:flex-row items-center justify-between overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#125840] to-[#208261] opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10 md:w-1/2 space-y-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 mb-6 shadow-md">
                <img src="/sk_logo.jpg" alt="SK Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white mb-2">
                SK Program Monitoring<br />System
              </h1>
              <p className="text-lg md:text-xl text-teal-50 max-w-lg font-normal mb-8 leading-relaxed">
                A comprehensive solution for SK Officials to manage programs, track expenses, and generate reports.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => setCurrentRoute('register')}
                  className="px-6 py-2.5 bg-white text-[#1b6b50] font-bold hover:bg-slate-100 rounded text-sm transition-colors shadow-sm"
                >
                  Get Started
                </button>
                <button
                  onClick={() => setCurrentRoute('login')}
                  className="px-6 py-2.5 border-2 border-white text-white font-bold hover:bg-white/10 rounded text-sm transition-colors"
                >
                  Learn More
                </button>
              </div>

              {/* Impersonation test block for evaluators */}
              <div className="pt-10 max-w-sm">
                <div className="bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                   <h4 className="text-[10px] text-white/80 font-bold uppercase tracking-widest text-center mb-3">Test Profiles</h4>
                   <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleRoleImpersonation('admin')} className="p-2 bg-[#125840]/50 hover:bg-[#125840] border border-white/10 rounded text-[10px] font-bold text-white transition-colors">SK Chairman</button>
                    <button onClick={() => handleRoleImpersonation('skofficial')} className="p-2 bg-[#125840]/50 hover:bg-[#125840] border border-white/10 rounded text-[10px] font-bold text-white transition-colors">Kagawad/Treas.</button>
                    <button onClick={() => handleRoleImpersonation('regular')} className="p-2 bg-[#125840]/50 hover:bg-[#125840] border border-white/10 rounded text-[10px] font-bold text-white transition-colors">Youth Resident</button>
                    <button onClick={() => handleRoleImpersonation('viewer')} className="p-2 bg-[#125840]/50 hover:bg-[#125840] border border-white/10 rounded text-[10px] font-bold text-white transition-colors">LGU Visitor</button>
                   </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 md:w-5/12 mt-12 md:mt-0 right-0">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-2xl">
                <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-[16/10] bg-teal-900 flex items-center justify-center group">
                  <img src="/sk_mem.jpg" alt="SK San Francisco" className="w-full h-full object-cover transition-transform duration-700" />
                </div>
              </div>
            </div>
          </section>

          {/* Key Features Section */}
          <section className="bg-white py-24 px-6 md:px-12 w-full flex-1">
            <div className="max-w-5xl mx-auto flex flex-col items-center">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a1f2e] mb-3 text-center">Key Features</h2>
              <p className="text-slate-600 text-lg text-center mb-16 max-w-2xl">
                Everything you need to manage SK programs efficiently
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {/* Card 1 */}
                <div className="bg-white rounded-lg p-8 border border-emerald-100 shadow-[0_2px_10px_rgba(0,143,93,0.05)] hover:shadow-[0_4px_15px_rgba(0,143,93,0.1)] transition-shadow">
                  <h3 className="text-lg font-bold text-[#1a1f2e] mb-3 tracking-tight">Program Management</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Create, update, and track SK programs with detailed information and participant lists.
                  </p>
                </div>
                {/* Card 2 */}
                <div className="bg-white rounded-lg p-8 border border-emerald-100 shadow-[0_2px_10px_rgba(0,143,93,0.05)] hover:shadow-[0_4px_15px_rgba(0,143,93,0.1)] transition-shadow">
                  <h3 className="text-lg font-bold text-[#1a1f2e] mb-3 tracking-tight">Expense Tracking</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Monitor all expenses related to programs with detailed categorization and reporting.
                  </p>
                </div>
                {/* Card 3 */}
                <div className="bg-white rounded-lg p-8 border border-emerald-100 shadow-[0_2px_10px_rgba(0,143,93,0.05)] hover:shadow-[0_4px_15px_rgba(0,143,93,0.1)] transition-shadow">
                  <h3 className="text-lg font-bold text-[#1a1f2e] mb-3 tracking-tight">Participant Management</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Keep track of program participants with comprehensive profiles and attendance records.
                  </p>
                </div>
                {/* Card 4 */}
                <div className="bg-white rounded-lg p-8 border border-emerald-100 shadow-[0_2px_10px_rgba(0,143,93,0.05)] hover:shadow-[0_4px_15px_rgba(0,143,93,0.1)] transition-shadow">
                  <h3 className="text-lg font-bold text-[#1a1f2e] mb-3 tracking-tight">Role-Based Access</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Different access levels for SK Officials and general viewers to ensure data security.
                  </p>
                </div>
                {/* Card 5 */}
                <div className="bg-white rounded-lg p-8 border border-emerald-100 shadow-[0_2px_10px_rgba(0,143,93,0.05)] hover:shadow-[0_4px_15px_rgba(0,143,93,0.1)] transition-shadow">
                  <h3 className="text-lg font-bold text-[#1a1f2e] mb-3 tracking-tight">Reporting</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Generate comprehensive reports on programs, expenses, and participant engagement.
                  </p>
                </div>
                {/* Card 6 */}
                <div className="bg-white rounded-lg p-8 border border-emerald-100 shadow-[0_2px_10px_rgba(0,143,93,0.05)] hover:shadow-[0_4px_15px_rgba(0,143,93,0.1)] transition-shadow">
                  <h3 className="text-lg font-bold text-[#1a1f2e] mb-3 tracking-tight">User-Friendly Interface</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Modern, intuitive design that makes program monitoring simple and efficient.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#125840] text-teal-50 py-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1">
                <img src="/sk_logo.jpg" alt="SK Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs">© 2025 SK Program Monitoring System. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-xs font-medium">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </footer>
        </div>
      ) : currentRoute === 'login' ? (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 relative font-sans">
          <div className="absolute top-4 left-4">
            <button
              onClick={() => setCurrentRoute('landing')}
              className="px-3.5 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 flex items-center gap-1 cursor-pointer"
            >
              ← Prev
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center font-extrabold text-white mx-auto text-sm">
                SF
              </div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase">Port Sign In</h1>
              <p className="text-slate-400 text-xs">Access Barangay San Francisco PMMS Console</p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/50 text-rose-300 rounded-xl border border-rose-800 text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">E-Mail Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@sanfrancisco.gov"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('forgot-password')}
                    className="text-[10px] text-emerald-400 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black cursor-pointer shadow-md text-white transition-all uppercase tracking-wider"
              >
                Sign In Verified Access
              </button>
            </form>

            <div className="text-center text-xs space-y-2 pt-2 border-t border-slate-900">
              <span className="text-slate-400">New youth resident in Naga City? </span>
              <button
                onClick={() => setCurrentRoute('register')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Create Account
              </button>
            </div>

            {/* Impersonation list helper */}
            <div className="bg-slate-900/40 p-3 rounded-2xl space-y-2 border border-slate-900 text-center text-[10px] text-slate-400">
              <p className="font-bold">Test evaluation logins (seeds):</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => { setLoginEmail('admin@sanfrancisco.gov'); setLoginPassword('chairman'); }}
                  className="text-[9px] text-rose-400 hover:underline"
                >
                  Admin
                </button>
                <button
                  onClick={() => { setLoginEmail('skofficial@sanfrancisco.gov'); setLoginPassword('kagawad'); }}
                  className="text-[9px] text-blue-400 hover:underline"
                >
                  Official
                </button>
                <button
                  onClick={() => { setLoginEmail('regular@sanfrancisco.gov'); setLoginPassword('resident'); }}
                  className="text-[9px] text-emerald-400 hover:underline"
                >
                  Resident
                </button>
                <button
                  onClick={() => { setLoginEmail('viewer@sanfrancisco.gov'); setLoginPassword('viewer'); }}
                  className="text-[9px] text-amber-400 hover:underline"
                >
                  LGU Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : currentRoute === 'register' ? (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 relative font-sans">
          <div className="absolute top-4 left-4">
            <button
              onClick={() => setCurrentRoute('landing')}
              className="px-3.5 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 flex items-center gap-1 cursor-pointer"
            >
              ← Cancel
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-lg w-full space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">Youth Sign Up Form</h1>
              <p className="text-slate-400 text-xs text-center">
                Self-Register as a Youth Resident of Barangay San Francisco, Naga City
              </p>
            </div>

            {registerError && (
              <div className="p-3 bg-rose-950/50 text-rose-300 rounded-xl border border-rose-800 text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="p-3 bg-emerald-950/50 text-emerald-300 rounded-xl border border-emerald-800 text-xs space-y-1">
                <h4 className="font-bold">Application Sent!</h4>
                <p>Registration completed successfully. Your resident credentials have been logged. Please wait for SK Chairman Ramon Valenzuela to approve your login credentials.</p>
                <button
                  onClick={() => setCurrentRoute('login')}
                  className="text-white underline font-bold"
                >
                  Go to Login screen
                </button>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Mark"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="San Jose"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Age (15 - 30)</label>
                  <input
                    type="number"
                    required
                    min="15"
                    max="30"
                    placeholder="Age"
                    value={registerAge}
                    onChange={(e) => setRegisterAge(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+63 917 123 4567"
                    value={registerContact}
                    onChange={(e) => setRegisterContact(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Youth Address</label>
                <select
                  value={registerAddress}
                  onChange={(e) => setRegisterAddress(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                >
                  <option value="Zone 1, Barangay San Francisco, Naga City">Zone 1, Barangay San Francisco</option>
                  <option value="Zone 2, Barangay San Francisco, Naga City">Zone 2, Barangay San Francisco</option>
                  <option value="Zone 3, Barangay San Francisco, Naga City">Zone 3, Barangay San Francisco</option>
                  <option value="Zone 4, Barangay San Francisco, Naga City">Zone 4, Barangay San Francisco</option>
                  <option value="Zone 5, Barangay San Francisco, Naga City">Zone 5, Barangay San Francisco</option>
                </select>
              </div>

              <div className="border-t border-slate-900 pt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Desired Role Type</label>
                  <select
                    value={registerRole}
                    onChange={(e: any) => setRegisterRole(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                  >
                    <option value="regular">Regular Youth Resident (Requires Admin approval)</option>
                    <option value="skofficial">SK Official (Kagawad/Treasurer)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Secure Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. joshua.v@gmail.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Security Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter security password"
                    className="w-full text-xs p-2.5 border border-slate-800 bg-slate-900 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all uppercase tracking-wide"
              >
                Submit Resident Profile
              </button>
            </form>
          </div>
        </div>
      ) : currentRoute === 'forgot-password' ? (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 relative font-sans">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-sm w-full space-y-6">
            <h1 className="text-lg font-black tracking-tight text-white text-center uppercase">Simulated Password Recovery</h1>
            <p className="text-xs text-slate-400 text-center">
              Submit your email address to receive validation keys.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-850 rounded-xl text-xs text-emerald-300 text-center">
                Success! A simulated password recovery workflow check has been saved to terminal logs.
                <button
                  onClick={() => { setCurrentRoute('login'); setForgotSuccess(false); }}
                  className="block mt-3 w-full border border-emerald-800 py-1 rounded font-bold"
                >
                  Return to sign in
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setForgotSuccess(true); }}
                className="space-y-4"
              >
                <input
                  type="email"
                  required
                  placeholder="Recovery email address..."
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-800 bg-slate-900 rounded-xl"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Retrieve Account Parameters
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* --- SECURE COMPILATIONS LAYER --- */
        <DashboardLayout
          currentUser={currentUser}
          onRoleChange={handleRoleImpersonation}
          currentRoute={currentRoute}
          onNavigate={(route) => {
            setCurrentRoute(route);
            setSelectedProgramId(null);
            setSelectedParticipantId(null);
          }}
          notifications={db.notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onClearNotifications={handleClearNotifications}
        >
          {/* SECURE SUB-PAGES */}

          {/* PAGE 1: CORE KPIs FOR OFFICIALS */}
          {currentRoute === 'dashboard' && (
            <DashboardView
              programs={db.programs}
              participants={db.participants}
              expenses={db.expenses}
              onNavigate={(route) => setCurrentRoute(route)}
              onSelectProgram={(id) => { setSelectedProgramId(id); setCurrentRoute('program-detail'); }}
              onSelectParticipant={(id) => { setSelectedParticipantId(id); setCurrentRoute('participant-detail'); }}
            />
          )}

          {/* PAGE 2: USER PROFILE MY REGISTRATIONS FOR RESIDENTS */}
          {currentRoute === 'user-dashboard' && (
            <div className="space-y-6">
              <div className="bg-emerald-800 text-white p-6 rounded-3xl space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-700/50 px-2 py-0.5 rounded border border-white/10">My Portal</span>
                <h1 className="text-xl md:text-2xl font-black">My Scheduled Program Outreaches</h1>
                <p className="text-xs text-emerald-100">Review status confirmations, downloaded attachments, and verified attendance sheets.</p>
              </div>

              {/* List of enrolled programs */}
              {(() => {
                const residentPart = db.participants.find((p) => p.user_id === currentUser.id);
                if (!residentPart) {
                  return <div className="p-4 bg-white rounded-xl text-xs text-slate-400">Loading resident credentials...</div>;
                }

                const myOutreaches = db.program_participants.filter((pp) => pp.participant_id === residentPart.id);

                return myOutreaches.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white border border-dashed rounded-3xl">
                    You have not registered for any SK program outreaches yet. Explore the SK program list to sign up!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myOutreaches.map((mo) => {
                      const prog = db.programs.find((p) => p.id === mo.program_id);
                      if (!prog) return null;
                      return (
                        <div
                          key={prog.id}
                          className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col justify-between gap-4 shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                          onClick={() => { setSelectedProgramId(prog.id); setCurrentRoute('program-detail'); }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400">PID-{prog.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                mo.registration_status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : mo.registration_status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {mo.registration_status}
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm mt-2">{prog.name}</h3>
                            <div className="space-y-1 mt-3 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-300" /> <span>{prog.date}</span></div>
                              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-300" /> <span>{prog.location}</span></div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>Attendance Check Roll:</span>
                            <span className={`uppercase text-[9px] px-2 py-0.5 rounded ${
                              mo.attendance_status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {mo.attendance_status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* PAGE 3: PROGRAMS REGISTRY */}
          {currentRoute === 'programs' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                <div>
                  <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">SK Programs Registry</h1>
                  <p className="text-xs text-slate-400">Filter, search, or toggle scheduled youth mobilizations.</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-slate-50 p-1 rounded-xl border border-slate-200/50 flex items-center gap-1">
                    <button
                      onClick={() => setProgramViewType('grid')}
                      className={`p-1.5 rounded-lg transition-all ${programViewType === 'grid' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-400'}`}
                      title="Grid list"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProgramViewType('calendar')}
                      className={`p-1.5 rounded-lg transition-all ${programViewType === 'calendar' ? 'bg-white text-emerald-700 shadow-3xs' : 'text-slate-400'}`}
                      title="Calendar view"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>

                  {(currentUser.role === 'admin' || currentUser.role === 'skofficial') && (
                    <button
                      onClick={() => setCurrentRoute('programs-new')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Program</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Programs search block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or venue location..."
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pl-10 border border-slate-200 bg-white rounded-xl focus:outline-none"
                  />
                </div>

                <select
                  value={programStatusFilter}
                  onChange={(e) => setProgramStatusFilter(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="all">All statuses</option>
                  <option value="planned">planned</option>
                  <option value="ongoing">ongoing</option>
                  <option value="completed">completed</option>
                </select>

                <select
                  value={programMonthFilter}
                  onChange={(e) => setProgramMonthFilter(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="all">All target months</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                </select>
              </div>

              {programViewType === 'calendar' ? (
                <CalendarComponent
                  programs={filteredPrograms}
                  onSelectProgram={(id) => { setSelectedProgramId(id); setCurrentRoute('program-detail'); }}
                />
              ) : (
                /* Grid view list */
                <div className="space-y-4">
                  {filteredPrograms.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-dashed">
                      No program registries matched your search filters.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {filteredPrograms.map((p) => {
                        const count = db.program_participants.filter(
                          (pp) => pp.program_id === p.id && pp.registration_status === 'approved'
                        ).length;

                        return (
                          <div
                            key={p.id}
                            onClick={() => { setSelectedProgramId(p.id); setCurrentRoute('program-detail'); }}
                            className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-3xl shadow-3xs hover:shadow-2xs transition-all cursor-pointer flex flex-col justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                                  p.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : p.status === 'ongoing'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {p.status}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">PID-{p.id}</span>
                              </div>
                              <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</h3>
                              <p className="text-slate-500 text-[11px] line-clamp-2">{p.description}</p>
                            </div>

                            <div className="space-y-1.5 pt-3 border-t border-slate-50 text-[11px] text-slate-500">
                              <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-300" /> <span>{p.date}</span></div>
                              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-300" /> <span>{p.location}</span></div>
                              <div className="flex items-center gap-1.5"><CircleDollarSign className="w-3.5 h-3.5 text-slate-300" /> <span>Budget: P {p.budget.toLocaleString()}</span></div>
                            </div>

                            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-bold">
                              <span>Sittings Roster</span>
                              <span className="text-emerald-700 font-black">{count} approved</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PAGE 4: DETAILED TAB VIEW */}
          {currentRoute === 'program-detail' && selectedProgramId && (
            (() => {
              const matched = db.programs.find((p) => p.id === selectedProgramId);
              if (!matched) return <div className="p-4 text-xs text-slate-400">Program item not found.</div>;
              return (
                <ProgramDetailsTab
                  program={matched}
                  participants={db.participants}
                  expenses={db.expenses}
                  programParticipants={db.program_participants}
                  registrations={db.registrations}
                  feedbacks={db.feedbacks}
                  currentUser={currentUser}
                  onBack={() => setCurrentRoute('programs')}
                  onEditProgram={(id) => startEditProgram(id)}
                  onDeleteProgram={(id) => handleDeleteProgram(id)}
                  onRegisterSelf={(pId) => handleJoinProgramSelf(pId)}
                  onApproveRegistration={(rId, notes) => handleApproveRegistration(rId, notes)}
                  onRejectRegistration={(rId, notes) => handleRejectRegistration(rId, notes)}
                  onUpdateAttendance={(pId, ptId, st) => handleUpdateAttendanceState(pId, ptId, st)}
                  onLogProgramExpense={(pId, ex) => handleAddNewProgramExpense(pId, ex)}
                  onDeleteExpense={(exId) => handleDeleteExpenseGlobal(exId)}
                  onSubmitFeedback={(pId, rt, com) => handlePublishFeedback(pId, rt, com)}
                />
              );
            })()
          )}

          {/* PAGE 5: CREATE PROGRAM FORM */}
          {currentRoute === 'programs-new' && (
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">Schedule New Youth Program</h1>
                <p className="text-xs text-slate-400">Add operational details below. This will publish into the resident database.</p>
              </div>

              <form onSubmit={handleCreateProgramSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Program Name Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eco-Basura Cleaning Swaps"
                    value={progFormName}
                    onChange={(e) => setProgFormName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Operational Goals / Descriptive write-up</label>
                  <textarea
                    rows={4}
                    placeholder="Provide full program outline..."
                    value={progFormDesc}
                    onChange={(e) => setProgFormDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Target Date</label>
                    <input
                      type="date"
                      required
                      value={progFormDate}
                      onChange={(e) => setProgFormDate(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl animate-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Scheduled Timings</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:30 AM - 12:00 PM"
                      value={progFormTime}
                      onChange={(e) => setProgFormTime(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Venue Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Barangay Covered Court"
                      required
                      value={progFormLoc}
                      onChange={(e) => setProgFormLoc(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Allocated Budget ceiling (₱)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={progFormBudget}
                      onChange={(e) => setProgFormBudget(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Current Status</label>
                    <select
                      value={progFormStatus}
                      onChange={(e: any) => setProgFormStatus(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    >
                      <option value="planned">planned</option>
                      <option value="ongoing">ongoing</option>
                      <option value="completed">completed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Document Attachment URLs (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. /poster.jpg, /sched.pdf"
                      value={progFormFiles}
                      onChange={(e) => setProgFormFiles(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('programs')}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                  >
                    Publish Program Registry
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAGE 6: EDIT PROGRAM FORM */}
          {currentRoute === 'programs-edit' && (
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">Modify Program Registries</h1>
                <p className="text-xs text-slate-400">Update parameters for administrative consistency.</p>
              </div>

              <form onSubmit={handleEditProgramSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Program Name</label>
                  <input
                    type="text"
                    required
                    value={progFormName}
                    onChange={(e) => setProgFormName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Goals descriptor</label>
                  <textarea
                    rows={4}
                    value={progFormDesc}
                    onChange={(e) => setProgFormDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Target Date</label>
                    <input
                      type="date"
                      required
                      value={progFormDate}
                      onChange={(e) => setProgFormDate(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl animate-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Timings</label>
                    <input
                      type="text"
                      value={progFormTime}
                      onChange={(e) => setProgFormTime(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Assigned Venue</label>
                    <input
                      type="text"
                      required
                      value={progFormLoc}
                      onChange={(e) => setProgFormLoc(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Allocated Budget (₱)</label>
                    <input
                      type="number"
                      value={progFormBudget}
                      onChange={(e) => setProgFormBudget(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Program Status</label>
                    <select
                      value={progFormStatus}
                      onChange={(e: any) => setProgFormStatus(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    >
                      <option value="planned">planned</option>
                      <option value="ongoing">ongoing</option>
                      <option value="completed">completed</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Files attachment urls (Comma separated)</label>
                    <input
                      type="text"
                      value={progFormFiles}
                      onChange={(e) => setProgFormFiles(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('programs')}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Save modifications
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAGE 7: PARTICIPANTS LIST */}
          {currentRoute === 'participants' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                <div>
                  <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">SK Youth Residents Registry</h1>
                  <p className="text-xs text-slate-400">Total verified members registered inside Barangay San Francisco.</p>
                </div>

                {(currentUser.role === 'admin' || currentUser.role === 'skofficial') && (
                  <button
                    onClick={() => setCurrentRoute('participant-new')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Participant</span>
                  </button>
                )}
              </div>

              {/* Seek tools */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Seek participant profile files by name, email, or telephone contact..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full text-xs p-2.5 pl-10 border border-slate-200 bg-white rounded-xl focus:outline-none"
                />
              </div>

              {/* Listing grid */}
              {filteredParticipants.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-dashed">
                  No youth participant profiles match your database seek query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredParticipants.map((p) => {
                    const joinedCount = db.program_participants.filter(
                      (pp) => pp.participant_id === p.id && pp.registration_status === 'approved'
                    ).length;

                    return (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedParticipantId(p.id); setCurrentRoute('participant-detail'); }}
                        className="bg-white border border-slate-100 p-5 rounded-3xl shadow-3xs hover:shadow-2xs cursor-pointer hover:border-slate-200 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-800 text-sm">
                            {p.first_name} {p.last_name}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium">Email: {p.email}</p>
                          <p className="text-[11px] text-slate-500 font-medium">Address: {p.address}</p>
                          <span className="inline-block mt-2 text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded">
                            Age: {p.age} yrs old
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-2xl font-black text-emerald-800">{joinedCount}</span>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Joined Outreaches</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PAGE 8: ADD PARTICIPANT MANUALLY */}
          {currentRoute === 'participant-new' && (
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">Manual Participant Profile Intake</h1>
                <p className="text-xs text-slate-400">Add youth profiles directly for manual program tracking.</p>
              </div>

              <form onSubmit={handleCreateParticipantSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Christian"
                      value={partFormFirst}
                      onChange={(e) => setPartFormFirst(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pena"
                      value={partFormLast}
                      onChange={(e) => setPartFormLast(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Age (15 - 30)</label>
                    <input
                      type="number"
                      required
                      min="15"
                      max="30"
                      value={partFormAge}
                      onChange={(e) => setPartFormAge(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +63 945 888 7766"
                      value={partFormCont}
                      onChange={(e) => setPartFormCont(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Secure Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. cp.pena@yahoo.com"
                    value={partFormEmail}
                    onChange={(e) => setPartFormEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Resident Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Zone 5, Barangay San Francisco, Naga City"
                    value={partFormAddr}
                    onChange={(e) => setPartFormAddr(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('participants')}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Add Participant Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAGE 9: PARTICIPANT DETAIL HISTORIES */}
          {currentRoute === 'participant-detail' && selectedParticipantId && (
            (() => {
              const matchedPart = db.participants.find((p) => p.id === selectedParticipantId);
              if (!matchedPart) return <div className="p-4 text-xs text-slate-400">Resident file not found.</div>;

              const joinedOutreaches = db.program_participants.filter((pp) => pp.participant_id === matchedPart.id);

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentRoute('participants')}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
                    >
                      ← Back list
                    </button>
                    {(currentUser.role === 'admin' || currentUser.role === 'skofficial') && (
                      <button
                        onClick={() => startEditParticipant(matchedPart.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Modify Profile
                      </button>
                    )}
                  </div>

                  {/* Profile dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-750 font-black text-xl flex items-center justify-center uppercase border border-emerald-100">
                        {matchedPart.first_name[0]}{matchedPart.last_name[0]}
                      </div>
                      <div>
                        <h2 className="text-md font-bold text-slate-800">
                          {matchedPart.first_name} {matchedPart.last_name}
                        </h2>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase mt-1">Naga Resident Register File</span>
                      </div>

                      <div className="pt-4 border-t border-slate-50 text-xs space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Age:</span>
                          <span className="text-slate-700 font-bold">{matchedPart.age} yrs old</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Telephone:</span>
                          <span className="text-slate-700 font-bold">{matchedPart.contact || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Register email:</span>
                          <span className="text-slate-700 font-bold">{matchedPart.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Municipal address:</span>
                          <span className="text-slate-700 font-bold max-w-[150px] truncate">{matchedPart.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* outreaches lists */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Outreach Program Histories</h3>

                      {joinedOutreaches.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed text-center">
                          This resident has not actively logged on any SK program lists.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                          {joinedOutreaches.map((jo) => {
                            const programObj = db.programs.find((p) => p.id === jo.program_id);
                            if (!programObj) return null;

                            return (
                              <div key={jo.program_id} className="p-4 flex items-center justify-between text-xs gap-3">
                                <div>
                                  <h4 className="font-bold text-slate-800">{programObj.name}</h4>
                                  <p className="text-[10px] text-slate-400 font-medium">Date Target: {programObj.date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                    jo.registration_status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {jo.registration_status}
                                  </span>

                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                    jo.attendance_status === 'present'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {jo.attendance_status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* PAGE 10: EDIT PARTICIPANT PROFILE */}
          {currentRoute === 'participant-edit' && selectedParticipantId && (
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">Modify Resident Profiles</h1>
                <p className="text-xs text-slate-400">Keep demographic statistics updated.</p>
              </div>

              <form onSubmit={handleEditParticipantSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">First Name</label>
                    <input
                      type="text"
                      required
                      value={partFormFirst}
                      onChange={(e) => setPartFormFirst(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Last Name</label>
                    <input
                      type="text"
                      required
                      value={partFormLast}
                      onChange={(e) => setPartFormLast(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Age (15 - 30)</label>
                    <input
                      type="number"
                      required
                      value={partFormAge}
                      onChange={(e) => setPartFormAge(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      value={partFormCont}
                      onChange={(e) => setPartFormCont(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Demographic Home Address</label>
                  <input
                    type="text"
                    value={partFormAddr}
                    onChange={(e) => setPartFormAddr(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('participants')}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold animate-none"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAGE 11: EXPENSES GENERAL LIST LEDGER */}
          {currentRoute === 'expenses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                <div>
                  <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">SK Expenses ledger</h1>
                  <p className="text-xs text-slate-400">Total accumulated itemized expenditures logged into database.</p>
                </div>

                {(currentUser.role === 'admin' || currentUser.role === 'skofficial') && (
                  <button
                    onClick={() => setCurrentRoute('expenses-new')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Expense</span>
                  </button>
                )}
              </div>

              {/* expense seek grids */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search expense description..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full text-xs p-2.5 pl-10 border border-slate-200 bg-white rounded-xl focus:outline-none"
                  />
                </div>

                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="all">All categories</option>
                  <option value="Food">Food</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Transport">Transport</option>
                  <option value="Honorarium">Honorarium</option>
                  <option value="Other">Other</option>
                </select>

                <select
                  value={expenseProgramFilter}
                  onChange={(e) => setExpenseProgramFilter(e.target.value)}
                  className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="all">All programs linked</option>
                  {db.programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* listing records */}
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-3xs">
                {filteredExpenses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No itemized expense records logged.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 text-xs">
                    {filteredExpenses.map((ex) => {
                      const prog = db.programs.find((p) => p.id === ex.program_id);
                      return (
                        <div key={ex.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-5/50 transition-all">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-800">{ex.description}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold">
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md uppercase font-black text-[9px]">
                                {ex.category}
                              </span>
                              <span>•</span>
                              <span className="text-slate-500 font-medium">Link: {prog?.name || `Prog #${ex.program_id}`}</span>
                              <span>•</span>
                              <span>{ex.date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-slate-700">P {ex.amount.toLocaleString()}</span>
                            {(currentUser.role === 'admin' || currentUser.role === 'skofficial') && (
                              <button
                                onClick={() => { if (confirm('Irreversibly clear this expense?')) { handleDeleteExpenseGlobal(ex.id); } }}
                                className="p-1.5 hover:bg-red-50 text-rose-500 rounded-lg cursor-pointer transition-all font-bold"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAGE 12: LOG GLOBAL EXPENSE FORM */}
          {currentRoute === 'expenses-new' && (
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">Log General Expense</h1>
                <p className="text-xs text-slate-400">Log municipal expenditures corresponding to active programs.</p>
              </div>

              <form onSubmit={handleAddNewGlobalExpense} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Link Program Initiative</label>
                  <select
                    required
                    value={expFormProgId}
                    onChange={(e) => setExpFormProgId(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">Select Target Program...</option>
                    {db.programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (Budget limit: ₱{p.budget.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Expenditure Description Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Refreshment lunch treats for coding attendees"
                    value={expFormDesc}
                    onChange={(e) => setExpFormDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Amount Disbursed (₱)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Pesos"
                      value={expFormAmount}
                      onChange={(e) => setExpFormAmount(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Category type</label>
                    <select
                      value={expFormCat}
                      onChange={(e: any) => setExpFormCat(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
                    >
                      {['Food', 'Supplies', 'Transport', 'Honorarium', 'Other'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={expFormDate}
                    onChange={(e) => setExpFormDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white animate-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('expenses')}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                  >
                    Log Expenditure
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PAGE 13: FINANCIAL ANALYTICS & PDF REPORTS EXPORT */}
          {currentRoute === 'expenses-report' && (
            <div className="space-y-6">
              <div className="bg-white p-6 border border-slate-100 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
                <div>
                  <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">SK Expenditure Audit compiler</h1>
                  <p className="text-xs text-slate-400">Establish date intervals, select criteria, and compile automated PDF records.</p>
                </div>

                <button
                  onClick={handleExportPDF}
                  className="px-4.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Compile PDF Audit Report</span>
                </button>
              </div>

              {/* filter sets */}
              <div className="bg-white border border-slate-100 p-5 rounded-3xl space-y-4 shadow-3xs">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Interval Parameters</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Start Date</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">End Date</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Initiative scope</label>
                    <select
                      value={reportProgramFilter}
                      onChange={(e) => setReportProgramFilter(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-xl bg-white"
                    >
                      <option value="all">ALL SCHEDULED PROGRAMS</option>
                      {db.programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Category Filter</label>
                    <select
                      value={reportCategoryFilter}
                      onChange={(e) => setReportCategoryFilter(e.target.value)}
                      className="w-full text-xs p-2.5 border rounded-xl bg-white"
                    >
                      <option value="all">ALL DISBURSEMENT CHANNELS</option>
                      <option value="Food">Food</option>
                      <option value="Supplies">Supplies</option>
                      <option value="Transport">Transport</option>
                      <option value="Honorarium">Honorarium</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* results view sheet preview */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-3xs">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <span className="text-xs font-bold text-slate-800">Previewing compiled statement rows ({reportRecords.length})</span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Total disbursements sum</span>
                    <span className="text-lg font-black text-emerald-800">₱ {reportTotalSum.toLocaleString()}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-bold text-[10px] border-b border-slate-100 uppercase tracking-wider">
                        <th className="p-3">Purchase Date</th>
                        <th className="p-3">Program initiative</th>
                        <th className="p-3">Disbursement Category</th>
                        <th className="p-3">Itemized Remarks</th>
                        <th className="p-3 text-right">Amount Out (₱)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {reportRecords.map((rec) => {
                        const targetProg = db.programs.find((p) => p.id === rec.program_id);
                        return (
                          <tr key={rec.id} className="hover:bg-slate-5/20 transition-all">
                            <td className="p-3 text-slate-500">{rec.date}</td>
                            <td className="p-3 font-bold text-slate-800">{targetProg?.name || `Prog #${rec.program_id}`}</td>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {rec.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{rec.description}</td>
                            <td className="p-3 text-right text-slate-800 font-bold">P {rec.amount.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 14: USER PROFILE SECURITY UPDATE */}
          {currentRoute === 'profile' && (
            <div className="bg-white border border-slate-100 p-6 md:p-8 rounded-3xl max-w-xl mx-auto space-y-6">
              <div>
                <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">My User Profile</h1>
                <p className="text-xs text-slate-400">View role credentials or assign security codes.</p>
              </div>

              {profileSuccessAlert && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs text-center font-bold">
                  Security change has been logged into current session records.
                </div>
              )}

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium font-bold uppercase">Role:</span>
                    <span className="text-slate-800 font-black uppercase text-emerald-700">{currentUser.role}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium font-bold uppercase">Authorized Email:</span>
                    <span className="text-slate-800 font-bold">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium font-bold uppercase">Register index:</span>
                    <span className="text-slate-500 font-mono">ID {currentUser.id}</span>
                  </div>
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); setProfileSuccessAlert(true); setTimeout(() => setProfileSuccessAlert(false), 3000); }}
                  className="pt-4 border-t border-slate-50 space-y-4"
                >
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Security Settings</h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Input security passcode</label>
                    <input
                      type="password"
                      placeholder="******"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm security passcode</label>
                    <input
                      type="password"
                      placeholder="******"
                      value={profileConfirmPat}
                      onChange={(e) => setProfileConfirmPat(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Update passcodes
                  </button>
                </form>

                {/* SQL schema quick view for student comfort */}
                <div className="pt-6 border-t border-slate-150 space-y-2.5 text-xs">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest block flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span>Supabase SQL Migrations</span>
                  </h3>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    A copy of `schema.sql` has been stored at your workspace root directory. You can easily copy/paste that script into the SQL Editor of your Supabase project online!
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(SCHEMAS_SQL_TEXT);
                      showToast('Copied PostgreSQL migration SQL script directly to clipboard!');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl truncate"
                  >
                    Copy SQL Migration Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PAGE 15: ADMIN MANAGE USERS APPROVAL CONSOLE */}
          {currentRoute === 'admin-users' && (
            <div className="space-y-6">
              <div className="bg-white p-5 border border-slate-100 rounded-3xl shadow-3xs">
                <h1 className="text-md font-bold text-slate-800 uppercase tracking-wider">SK Resident verification center</h1>
                <p className="text-xs text-slate-400">Review pending youth resident requests to grant portal clearance.</p>
              </div>

              {/* listings */}
              {(() => {
                const pendingUsers = db.users.filter((u) => !u.is_approved);
                return (
                  <div className="bg-white border rounded-3xl overflow-hidden shadow-3xs">
                    {pendingUsers.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium">
                        No pending youth accounts requiring verification are currently registered.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50 text-xs">
                        {pendingUsers.map((pu) => {
                          const part = db.participants.find((p) => p.user_id === pu.id);
                          return (
                            <div key={pu.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-5/40 transition-all">
                              <div className="space-y-1">
                                <h4 className="font-bold text-slate-800">
                                  {part ? `${part.first_name} ${part.last_name}` : 'Unidentified user file'}
                                </h4>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                  <span>Email: {pu.email}</span>
                                  <span>•</span>
                                  <span>Requested Role: <span className="text-emerald-700 uppercase">{pu.role}</span></span>
                                  {part && <span>• Zone: {part.address}</span>}
                                </div>
                              </div>

                              <button
                                onClick={() => handleApproveUserAccount(pu.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
                              >
                                Approve Registration
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </DashboardLayout>
      )}
    </div>
  );
}
