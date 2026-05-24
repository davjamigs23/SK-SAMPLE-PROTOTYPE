/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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

import { motion } from "motion/react";

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
import { supabase, isSupabaseConfigured } from './lib/supabase';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends (React.Component as any)<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState;
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Application Error</h1>
            <p className="text-sm text-slate-500">Something went wrong while rendering the application. This might be due to a synchronization issue or invalid session state.</p>
            <div className="bg-slate-50 p-4 rounded-xl text-left overflow-auto max-h-40">
              <pre className="text-[10px] text-slate-600 leading-relaxed font-mono">
                {this.state.error?.message || String(this.state.error)}
              </pre>
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold active:scale-95 transition-all"
            >
              Clear Session & Reload Registry
            </button>
            <p className="text-[10px] text-slate-400">Warning: This will log you out of current session.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  // --- DATABASE & SESSION STATES ---
  const [db, setDb] = useState<SKDatabase>(getStoredDB());
  
  // Set initial user: 
  // If Supabase is configured, we start as null (forcing a real login).
  // If not, we start as the seeded admin to allow immediate demoing.
  const [currentUser, setCurrentUser] = useState<User | null>(isSupabaseConfigured ? null : db.users[0]);
  const [currentRoute, setCurrentRoute] = useState<string>('landing');

  // --- FORM INPUT STATES ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('regular');
  const [registerSecretCode, setRegisterSecretCode] = useState('');
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

  // Sync state mutations to LocalStorage and Supabase
  const updateDBState = async (updated: SKDatabase) => {
    setDb(updated);
    saveStoredDB(updated);

    // Notice: Instead of sinking the entire `updated` object into a monolithic table,
    // future inserts/updates should ideally use `await supabase.from('table_name').insert(data)`
    // individually within their respective handler functions.
    // For now, this local mutation syncs the UI, and relying on `supabase.from` 
    // for true REST backend persistence.
  };

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    // 1. Load initial state from Supabase
    const fetchState = async () => {
      try {
        const [
          { data: users },
          { data: participants },
          { data: programs },
          { data: expenses },
          { data: program_participants },
          { data: registrations },
          { data: feedbacks }
        ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('participants').select('*'),
          supabase.from('programs').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('program_participants').select('*'),
          supabase.from('registrations').select('*'),
          supabase.from('feedback').select('*')
        ]);

        const remoteDb: SKDatabase = {
          users: users && users.length > 0 ? users as User[] : db.users,
          participants: participants && participants.length > 0 ? participants as Participant[] : db.participants,
          programs: programs && programs.length > 0 ? programs as Program[] : db.programs,
          expenses: expenses && expenses.length > 0 ? expenses as Expense[] : db.expenses,
          program_participants: program_participants && program_participants.length > 0 ? program_participants as ProgramParticipant[] : db.program_participants,
          registrations: registrations && registrations.length > 0 ? registrations as Registration[] : db.registrations,
          feedbacks: feedbacks && feedbacks.length > 0 ? feedbacks as Feedback[] : db.feedbacks,
          notifications: db.notifications // Preserve local notifications
        };

        setDb(remoteDb);
        saveStoredDB(remoteDb);
        
        // Ensure currentUser updates if their profile was changed
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const matched = remoteDb.users.find(u => u.id === prevUser.id);
          return matched || prevUser;
        });

      } catch(err) {
        console.error("Supabase initial fetch exception:", err);
      }
    };

    fetchState();

    // 2. Auth Session Listener
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          let { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
          
          if (!data && !error) {
            // User is in auth but not in public.users - sync them
            const isAdmin = ['sksanfrancisconagacity@gmail.com'].includes(session.user.email?.toLowerCase() || '');
            const { data: newData, error: insertError } = await supabase.from('users').upsert({
              id: session.user.id,
              email: session.user.email?.toLowerCase() || '',
              role: isAdmin ? 'admin' : 'regular',
              is_approved: isAdmin
            }).select().single();
            
            if (!insertError) {
              data = newData;
            }
          }

          if (data) {
            setCurrentUser(data as User);
            if (currentRoute === 'landing' || currentRoute === 'login') {
               setCurrentRoute(data.role === 'regular' ? 'user-dashboard' : 'dashboard');
            }
          }
        } catch (authErr) {
          console.error("Auth sync error:", authErr);
        }
      } else {
        setCurrentUser(isSupabaseConfigured ? null : getStoredDB().users[0]);
        if (['dashboard', 'user-dashboard', 'programs', 'participants', 'expenses', 'reports'].includes(currentRoute)) {
           setCurrentRoute('landing');
        }
      }
    });

    // 3. Realtime Subscription
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      authSub.unsubscribe();
    };
  }, []);

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
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Complete all password and email entry slots.');
      return;
    }

    // FALLBACK: If Supabase is not configured, allow signing in with seeded users for testing
    if (!isSupabaseConfigured || !supabase) {
      const localMatch = db.users.find(u => u.email === loginEmail && u.password === loginPassword);
      if (localMatch) {
         setCurrentUser(localMatch);
         showToast(`Local Mode: Welcome ${localMatch.email}!`, 'info');
         setCurrentRoute(localMatch.role === 'regular' ? 'user-dashboard' : 'dashboard');
         setLoginEmail('');
         setLoginPassword('');
      } else {
         setLoginError('Local Mode: User not found in seed data. Please configure Supabase for real accounts.');
      }
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setLoginError('Sign in failed: Email has not been confirmed. Please check your inbox for a verification link from Supabase.');
        } else {
          setLoginError('Invalid credentials or account not verified. Please double-check your email and password.');
        }
        return;
      }

      // After successful Auth, fetch user record from public.users to check role/approval
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError || !userData) {
         setLoginError('Login successful, but profile table not found. Please ensure Supabase tables are created.');
         return;
      }

      if (!userData.is_approved) {
        setLoginError('Your account is pending verification. Please wait for an SK Official to approve your resident profile.');
        return;
      }

      // Success login
      setCurrentUser(userData as User);
      showToast(`Access Granted. Welcome back, ${userData.email}!`, 'success');
      if (userData.role === 'regular') {
        setCurrentRoute('user-dashboard');
      } else {
        setCurrentRoute('dashboard');
      }
      setLoginEmail('');
      setLoginPassword('');
    } catch(err) {
       console.error('Login exception:', err);
       setLoginError('An unexpected error occurred.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);

    if (!registerEmail || !registerPassword || !registerFirstName || !registerLastName || !registerContact) {
      setRegisterError('All personal details are mandatory.');
      return;
    }

    if (registerRole === 'skofficial' && registerSecretCode !== 'SKSF2026') {
      setRegisterError('Invalid secret code for SK Official registration.');
      return;
    }

    if (!supabase) {
      setRegisterError('Database connection not initialized.');
      return;
    }

    try {
      // 1. Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
      });

      if (error) {
        setRegisterError(error.message);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setRegisterError('Registration failed: no user ID received.');
        return;
      }

      // 2. Upsert record into public.users
      const isAdmin = ['sksanfrancisconagacity@gmail.com'].includes(registerEmail.toLowerCase());
      const { error: userError } = await supabase.from('users').upsert({
        id: userId,
        email: registerEmail.toLowerCase(),
        role: isAdmin ? 'admin' : registerRole,
        is_approved: isAdmin
      });

      if (userError) {
        setRegisterError('Failed to sync user profile: ' + userError.message);
        return;
      }

      // 3. Upsert record into public.participants
      const { error: partError } = await supabase.from('participants').upsert({
        user_id: userId,
        first_name: registerFirstName,
        last_name: registerLastName,
        age: parseInt(registerAge) || 20,
        contact: registerContact,
        email: registerEmail.toLowerCase(),
        address: registerAddress
      }, { onConflict: 'user_id' });

      if (partError) {
        setRegisterError('Failed to create participant profile: ' + partError.message);
        return;
      }

      setRegisterSuccess(true);
      showToast('Registration submitted for administrator approval.', 'success');
      
      // Reset inputs
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterFirstName('');
      setRegisterLastName('');
      setRegisterContact('');
    } catch(err) {
      console.error('Registration exception:', err);
      setRegisterError('An unexpected error occurred during registration.');
    }
  };

  // --- PROGRAM MANAGEMENT OPERATIONS ---
  const handleCreateProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progFormName || !progFormDate || !progFormLoc || !currentUser) {
      showToast('Program parameters missing or unauthorized session!', 'error');
      return;
    }

    const filesArray = progFormFiles ? progFormFiles.split(',').map(s => s.trim()) : [];

    const newProg: Omit<Program, 'id' | 'created_at' | 'updated_at'> = {
      name: progFormName,
      description: progFormDesc,
      date: progFormDate,
      time: progFormTime || '10:00 AM',
      location: progFormLoc,
      budget: parseFloat(progFormBudget) || 0,
      status: progFormStatus,
      file_urls: filesArray,
      created_by: currentUser.id
    };

    if (supabase) {
      const { data, error } = await supabase.from('programs').insert(newProg).select().single();
      if (error) {
        console.error('Supabase error creating program:', error);
        showToast('Failed to sync program to database.', 'error');
        return;
      }
      // Local state will be updated via realtime subscription, but we update locally for immediate feedback
      updateDBState({
        ...db,
        programs: [...db.programs, data as Program]
      });
    }

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

  const handleEditProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) return;

    const filesArray = progFormFiles ? progFormFiles.split(',').map(s => s.trim()) : [];

    const updateData = {
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

    if (supabase) {
      const { error } = await supabase.from('programs').update(updateData).eq('id', selectedProgramId);
      if (error) {
        console.error('Supabase error updating program:', error);
        showToast('Failed to sync changes to database.', 'error');
        return;
      }
    }

    const updatedProgs = db.programs.map((p) => {
      if (p.id === selectedProgramId) {
        return { ...p, ...updateData };
      }
      return p;
    });

    updateDBState({ ...db, programs: updatedProgs });
    showToast('Program parameters modified successfully.', 'success');
    setCurrentRoute('programs');
  };

  const handleDeleteProgram = async (id: number) => {
    if (supabase) {
      const { error } = await supabase.from('programs').delete().eq('id', id);
      if (error) {
        console.error('Supabase error deleting program:', error);
        showToast('Failed to delete program from database.', 'error');
        return;
      }
    }

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
  const handleCreateParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partFormFirst || !partFormLast || !partFormEmail) return;

    const newPart: Omit<Participant, 'id' | 'created_at' | 'updated_at'> = {
      user_id: `user-guest-${Date.now()}`,
      first_name: partFormFirst,
      last_name: partFormLast,
      age: parseInt(partFormAge) || 20,
      contact: partFormCont,
      email: partFormEmail.toLowerCase(),
      address: partFormAddr || 'Barangay San Francisco, Naga City'
    };

    if (supabase) {
      const { data, error } = await supabase.from('participants').insert(newPart).select().single();
      if (error) {
        console.error('Supabase error creating participant:', error);
        showToast('Failed to sync resident profile.', 'error');
        return;
      }
      updateDBState({ ...db, participants: [...db.participants, data as Participant] });
    }

    showToast(`Resident profiles created: ${partFormFirst} ${partFormLast}`);

    setPartFormFirst('');
    setPartFormLast('');
    setPartFormAge('20');
    setPartFormCont('');
    setPartFormEmail('');
    setPartFormAddr('');
    setCurrentRoute('participants');
  };

  const handleEditParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId) return;

    const updateData = {
      first_name: partFormFirst,
      last_name: partFormLast,
      age: parseInt(partFormAge) || 20,
      contact: partFormCont,
      address: partFormAddr,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('participants').update(updateData).eq('id', selectedParticipantId);
      if (error) {
        console.error('Supabase error updating participant:', error);
        showToast('Failed to sync participant updates.', 'error');
        return;
      }
    }

    const updated = db.participants.map((p) => {
      if (p.id === selectedParticipantId) {
        return { ...p, ...updateData };
      }
      return p;
    });

    updateDBState({ ...db, participants: updated });
    showToast('Resident profile modified.', 'success');
    setCurrentRoute('participants');
  };

  // --- REGISTRATION APPROVALWORKFLOWS ---
  const handleJoinProgramSelf = async (progId: number) => {
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
    const freshAudit: Omit<Registration, 'id'> = {
      program_id: progId,
      participant_id: residentPart.id,
      registration_date: new Date().toISOString(),
      status: 'pending',
      notes: 'Initial youth resident self-registration upload slot.'
    };

    if (supabase) {
      const { error: ppError } = await supabase.from('program_participants').insert(freshPP);
      const { data: regData, error: regError } = await supabase.from('registrations').insert(freshAudit).select().single();
      
      if (ppError || regError) {
        console.error('Supabase join error:', ppError || regError);
        showToast('Failed to file join request in database.', 'error');
        return;
      }

      updateDBState({
        ...db,
        program_participants: [...db.program_participants, freshPP],
        registrations: [...db.registrations, regData as Registration]
      });
    }

    const targetProg = db.programs.find(p => p.id === progId);
    pushNotification(
      'New Student Join Request',
      `${residentPart.first_name} applied for "${targetProg?.name || 'Program'}"`
    );
    showToast('Join request filed. Awaiting SK board validation.', 'success');
  };

  const handleApproveRegistration = async (regId: number, notes: string) => {
    const matchedAudit = db.registrations.find((r) => r.id === regId);
    if (!matchedAudit) return;

    if (supabase) {
      const { error: regError } = await supabase.from('registrations').update({
        status: 'approved',
        notes,
        approved_by: currentUser.id,
        approved_at: new Date().toISOString()
      }).eq('id', regId);

      const { error: ppError } = await supabase.from('program_participants').update({
        registration_status: 'approved'
      }).match({ program_id: matchedAudit.program_id, participant_id: matchedAudit.participant_id });

      if (regError || ppError) {
        console.error('Supabase approval error:', regError || ppError);
        showToast('Failed to sync approval state.', 'error');
        return;
      }
    }

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

  const handleRejectRegistration = async (regId: number, notes: string) => {
    const matchedAudit = db.registrations.find((r) => r.id === regId);
    if (!matchedAudit) return;

    if (supabase) {
      const { error: regError } = await supabase.from('registrations').update({
        status: 'rejected',
        notes,
        approved_by: currentUser.id,
        approved_at: new Date().toISOString()
      }).eq('id', regId);

      const { error: ppError } = await supabase.from('program_participants').update({
        registration_status: 'rejected'
      }).match({ program_id: matchedAudit.program_id, participant_id: matchedAudit.participant_id });

      if (regError || ppError) {
        console.error('Supabase rejection error:', regError || ppError);
        showToast('Failed to sync rejection state.', 'error');
        return;
      }
    }

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
  const handleUpdateAttendanceState = async (progId: number, partId: number, status: ProgramParticipant['attendance_status']) => {
    if (supabase) {
      const { error } = await supabase.from('program_participants').update({
        attendance_status: status
      }).match({ program_id: progId, participant_id: partId });

      if (error) {
        console.error('Supabase attendance error:', error);
        showToast('Failed to sync attendance update.', 'error');
        return;
      }
    }

    const updated = db.program_participants.map((pp) =>
      pp.program_id === progId && pp.participant_id === partId
        ? { ...pp, attendance_status: status }
        : pp
    );

    updateDBState({ ...db, program_participants: updated });
    showToast('Attendance status saved.', 'success');
  };

  // --- EXPENSE MONITORING CORES ---
  const handleAddNewGlobalExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expFormProgId || !expFormDesc || !expFormAmount || !expFormDate || !currentUser) {
      showToast('Fill in all necessary expense criteria or session lost.', 'error');
      return;
    }

    const freshEx: Omit<Expense, 'id'> = {
      program_id: parseInt(expFormProgId),
      description: expFormDesc,
      amount: parseFloat(expFormAmount),
      date: expFormDate,
      category: expFormCat,
      recorded_by: currentUser.id,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('expenses').insert(freshEx);
      if (error) {
        console.error('Supabase error inserting expense:', error);
        showToast('Failed to sync expense to database.', 'error');
        return;
      }
    } else {
      const nextId = db.expenses.length > 0 ? Math.max(...db.expenses.map((ex) => ex.id)) + 1 : 1;
      updateDBState({ ...db, expenses: [...db.expenses, { ...freshEx, id: nextId } as Expense] });
    }

    showToast(`Logged expenditure allocation: ${expFormDesc}`, 'success');

    // Reset
    setExpFormProgId('');
    setExpFormDesc('');
    setExpFormAmount('');
    setExpFormDate('');
    setExpFormCat('Supplies');
    setCurrentRoute('expenses');
  };

  const handleAddNewProgramExpense = async (progId: number, partialExpense: Omit<Expense, 'id' | 'created_at'>) => {
    if (supabase) {
      const { data, error } = await supabase.from('expenses').insert(partialExpense).select().single();
      if (error) {
        console.error('Supabase error inserting linked expense:', error);
        showToast('Failed to sync expense.', 'error');
        return;
      }
      updateDBState({ ...db, expenses: [...db.expenses, data as Expense] });
    } else {
      const nextId = db.expenses.length > 0 ? Math.max(...db.expenses.map((ex) => ex.id)) + 1 : 1;
      const fresh: Expense = {
        ...partialExpense,
        id: nextId,
        created_at: new Date().toISOString()
      } as Expense;
      updateDBState({ ...db, expenses: [...db.expenses, fresh] });
    }
    showToast('Disbursement logged on the fly.', 'success');
  };

  const handleDeleteExpenseGlobal = async (id: number) => {
    if (supabase) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        console.error('Supabase error deleting expense:', error);
        showToast('Failed to delete expense from database.', 'error');
        return;
      }
    }
    const updated = db.expenses.filter((e) => e.id !== id);
    updateDBState({ ...db, expenses: updated });
    showToast('Expense records updated successfully.', 'info');
  };

  // --- FEEDBACK MODULE ---
  const handlePublishFeedback = async (progId: number, rating: number, comment: string) => {
    const resident = db.participants.find((p) => p.user_id === currentUser.id);
    if (!resident) return;

    const freshFeed: Omit<Feedback, 'id' | 'created_at'> = {
      program_id: progId,
      participant_id: resident.id,
      rating,
      comment
    };

    if (supabase) {
      const { data, error } = await supabase.from('feedback').insert(freshFeed).select().single();
      if (error) {
        console.error('Supabase error publishing feedback:', error);
        showToast('Failed to sync evaluation.', 'error');
        return;
      }
      updateDBState({ ...db, feedbacks: [...db.feedbacks, data as Feedback] });
    } else {
      const nextId = db.feedbacks.length > 0 ? Math.max(...db.feedbacks.map((f) => f.id)) + 1 : 1;
      const fresh: Feedback = { ...freshFeed, id: nextId, created_at: new Date().toISOString() } as Feedback;
      updateDBState({ ...db, feedbacks: [...db.feedbacks, fresh] });
    }
    
    showToast('Your program evaluation was logged to Naga LGU auditors.', 'success');
  };

  // --- ADMIN USER CONSOLE APPROVALS ---
  const handleApproveUserAccount = async (userId: string) => {
    if (supabase) {
      const { error } = await supabase.from('users').update({ is_approved: true }).eq('id', userId);
      if (error) {
        console.error('Supabase error approving user:', error);
        showToast('Failed to approve user in database.', 'error');
        return;
      }
    }

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
      doc.text("Bernadette Sapo Barrosa", 14, currentY + 4);
      doc.setFont("Helvetica", "bold");
      doc.text("SK Treasurer", 14, currentY + 8);

      doc.setFont("Helvetica", "normal");
      doc.text("Zaldy D. Bragais Jr.", 120, currentY + 4);
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

  // --- RENDERING ROUTER ---
  if (!currentUser && !['landing', 'login', 'register', 'forgot-password'].includes(currentRoute)) {
    // If somehow lost session, force to landing
    return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Supabase Status Indicator */}
      {!isSupabaseConfigured && (
        <div className="fixed top-2 right-2 z-[60] bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm pointer-events-none opacity-80 sm:opacity-100">
           <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
           <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Local Demo Mode</span>
        </div>
      )}
      
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
      {/* PENDING APPROVAL GUARD */}
      {currentUser && currentUser.id !== '0' && currentUser.id !== 'user-admin-1' && !currentUser.is_approved && !['landing', 'register', 'login'].includes(currentRoute) && (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Account Verification Pending</h1>
          <p className="text-sm text-slate-500 max-w-sm mb-8">
            Your resident profile has been submitted successfully. Please wait for an SK Official to review and verify your identity before accessing the SK Program Monitoring System.
          </p>
          <button
            onClick={() => {
              supabase?.auth.signOut();
              setCurrentRoute('landing');
            }}
            className="px-6 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Sign Out & Return Home
          </button>
        </div>
      )}

      {currentRoute === 'landing' ? (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
          {/* Header */}
          <header className="w-full px-4 md:px-8 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 bg-white z-50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentRoute('landing')}>
                <img src="/Sk_logo.jpg" alt="SK Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                <span className="font-black text-slate-800 tracking-tight text-sm hidden sm:block">SK SAN FRANCISCO</span>
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
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 mb-6 shadow-md overflow-hidden">
                <img src="/Sk_logo.jpg" alt="SK Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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
            </div>

            <div className="relative z-10 md:w-5/12 mt-12 md:mt-0 right-0">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20 shadow-2xl">
                <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-[16/10] bg-teal-900 flex items-center justify-center group shadow-2xl">
                  <img src="/sk_mem.jpg" alt="SK San Francisco Group" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" referrerPolicy="no-referrer" />
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

          {/* Organizational Chart Section */}
          <section className="bg-slate-50 py-24 px-6 md:px-12 w-full flex-1 border-t border-slate-200" id="organizational-chart">
            <div className="max-w-6xl mx-auto flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a1f2e] mb-3">Organizational Chart</h2>
                <div className="h-1 w-20 bg-emerald-600 mx-auto rounded-full mb-4"></div>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                  Meet the dedicated leaders of the Sangguniang Kabataan of Brgy. San Francisco, Naga City
                </p>
              </motion.div>

              <div className="w-full space-y-12">
                {/* Level 1: Chairperson clouds */}
                <div className="flex justify-center">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-6 border-2 border-emerald-600 shadow-xl text-center w-full max-w-sm relative"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest z-20">Chairperson</div>
                    
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-emerald-50 shadow-inner bg-slate-50">
                      <img src="/chairman.jpg" alt="Hon. Zaldy D. Bragais Jr." className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <h3 className="text-xl font-black text-[#1a1f2e] mb-1">Hon. Zaldy D. Bragais Jr.</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">SK Chairperson</p>
                  </motion.div>
                </div>

                {/* Connectors */}
                <div className="hidden md:flex justify-center h-8">
                  <div className="w-px bg-slate-200"></div>
                </div>

                {/* Level 2: Secretary & Treasurer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg text-center relative"
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest z-20">Secretariat</div>
                    
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-slate-50 bg-slate-50">
                      <img src="/secretary.jpg" alt="David James Ignacio" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <h3 className="text-lg font-bold text-[#1a1f2e] mb-0.5">David James Ignacio</h3>
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">SK Secretary</p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg text-center relative"
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest z-20">Finance</div>
                    
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-slate-50 bg-slate-50">
                      <img src="/treasurer.jpg" alt="Bernadette Barrosa" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <h3 className="text-lg font-bold text-[#1a1f2e] mb-0.5">Bernadette Barrosa</h3>
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">SK Treasurer</p>
                  </motion.div>
                </div>

                {/* Level 3: Kagawads Grid */}
                <div className="space-y-8 pt-8">
                  <div className="text-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">SK Kagawads (Council Members)</h4>
                  </div>
                  
                  {/* First Row: 4 Members */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { name: "Hon. Kailah Mae Balmes", role: "SK Kagawad", img: "/input_file_9.png" },
                      { name: "Hon. Luigi Verdadero", role: "SK Kagawad", img: "/luigi.jpg" },
                      { name: "Hon. Aliyah Guevarra", role: "SK Kagawad", img: "/aliyah.jpg" },
                      { name: "Hon. Ma. Angeline Bok", role: "SK Kagawad", img: "/angeline.jpg" }
                    ].map((member, idx) => (
                      <motion.div 
                        key={member.name}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center group"
                      >
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border border-slate-100 group-hover:border-emerald-200 transition-colors">
                          <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <h3 className="text-sm font-bold text-[#1a1f2e] mb-1">{member.name}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{member.role}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Second Row: 3 Members Centered */}
                  <div className="flex flex-wrap justify-center gap-6">
                    {[
                      { name: "Hon. Mark Angelo Frago", role: "SK Kagawad", img: "/input_file_8.png" },
                      { name: "Hon. Roy Bragais", role: "SK Kagawad", img: "/input_file_6.png" },
                      { name: "Hon. Julius Eco", role: "SK Kagawad", img: "/input_file_7.png" }
                    ].map((member, idx) => (
                      <motion.div 
                        key={member.name}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (idx + 4) * 0.05 }}
                        className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center group w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                      >
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border border-slate-100 group-hover:border-emerald-200 transition-colors">
                          <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <h3 className="text-sm font-bold text-[#1a1f2e] mb-1">{member.name}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{member.role}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#125840] text-teal-50 py-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1">
                <img src="/Sk_logo.jpg" alt="SK Logo" className="w-full h-full object-contain" />
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
        <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col items-center justify-center p-6 relative font-sans">
          
          <div className="w-full max-w-md mb-4 flex items-center">
             <button
              onClick={() => setCurrentRoute('landing')}
              className="flex items-center gap-2 text-sm font-medium hover:text-slate-600 transition-colors"
            >
              <span>←</span> Back to Home
            </button>
          </div>

          <div className="bg-white border text-left border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 mb-4 rounded-full overflow-hidden flex items-center justify-center p-1 border-2 border-slate-100 shadow-sm bg-white">
                 <img src="/Sk_logo.jpg" alt="SK Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">Sign In</h1>
              <p className="text-gray-500 text-sm">Enter your credentials to access your account</p>
            </div>

            {loginError && (
              <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-black">Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                />
                <p className="text-[11px] text-gray-500 mt-1">Please use the email you registered with</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-black">Password</label>
                  <button
                    type="button"
                    onClick={() => setCurrentRoute('forgot-password')}
                    className="text-sm text-teal-600 font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-black rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>

            <div className="text-center mt-6 flex flex-col space-y-3">
              <div className="text-sm text-gray-700">
                Don't have an account?{' '}
                <button
                  onClick={() => setCurrentRoute('register')}
                  className="text-teal-600 font-medium hover:underline"
                >
                  Sign up
                </button>
              </div>
              <p className="text-[11px] text-gray-500">Use the email address you registered with.</p>
            </div>
          </div>
        </div>
      ) : currentRoute === 'register' ? (
        <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex flex-col items-center justify-center p-6 relative font-sans">
          <div className="w-full max-w-md mb-4 flex items-center">
            <button
              onClick={() => setCurrentRoute('landing')}
              className="flex items-center gap-2 text-sm font-medium hover:text-slate-600 transition-colors"
            >
              <span>←</span> Back to Home
            </button>
          </div>

          <div className="bg-white border text-left border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 mb-4 rounded-full overflow-hidden flex items-center justify-center p-1 border-2 border-slate-100 shadow-sm bg-white">
                 <img src="/Sk_logo.jpg" alt="SK Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2 text-center">Registration</h1>
              <p className="text-gray-500 text-sm text-center">
                Create your account for the SK Program Monitoring System
              </p>
            </div>

            {registerError && (
              <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="p-3 mb-6 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 text-sm space-y-1">
                <h4 className="font-bold">Application Sent!</h4>
                <p>Registration completed successfully. Your resident credentials have been logged. Please wait for SK Chairman Zaldy D. Bragais Jr. to approve your login credentials.</p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentRoute('login')}
                    className="text-teal-700 underline font-semibold hover:text-teal-800"
                  >
                    Go to Login screen
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-black">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Mark"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-black">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="San Jose"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-black">Age (15 - 30)</label>
                  <input
                    type="number"
                    required
                    min="15"
                    max="30"
                    placeholder="Age"
                    value={registerAge}
                    onChange={(e) => setRegisterAge(e.target.value)}
                    className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-black">Contact Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+63 917 123 4567"
                    value={registerContact}
                    onChange={(e) => setRegisterContact(e.target.value)}
                    className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-black">Address</label>
                <select
                  value={registerAddress}
                  onChange={(e) => setRegisterAddress(e.target.value)}
                  className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                >
                  <option value="Zone 1, Barangay San Francisco, Naga City">Zone 1, Barangay San Francisco</option>
                  <option value="Zone 2, Barangay San Francisco, Naga City">Zone 2, Barangay San Francisco</option>
                  <option value="Zone 3, Barangay San Francisco, Naga City">Zone 3, Barangay San Francisco</option>
                  <option value="Zone 4, Barangay San Francisco, Naga City">Zone 4, Barangay San Francisco</option>
                  <option value="Zone 5, Barangay San Francisco, Naga City">Zone 5, Barangay San Francisco</option>
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-black">Account Type</label>
                  <select
                    value={registerRole}
                    onChange={(e: any) => setRegisterRole(e.target.value)}
                    className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  >
                    <option value="regular">Youth Resident</option>
                    <option value="skofficial">SK Official</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                {registerRole === 'skofficial' && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-black">Secret Access Code</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter the secret code for Officials"
                      value={registerSecretCode}
                      onChange={(e) => setRegisterSecretCode(e.target.value)}
                      className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-black">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. joshua.v@gmail.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-black">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter security password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full text-sm p-2.5 px-3 border border-gray-300 bg-white rounded-md focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#111111] hover:bg-black rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
            
            <div className="text-center mt-6 flex flex-col space-y-3">
              <div className="text-sm text-gray-700">
                Already have an account?{' '}
                <button
                  onClick={() => setCurrentRoute('login')}
                  className="text-teal-600 font-medium hover:underline"
                >
                  Sign in
                </button>
              </div>
            </div>
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
        currentUser ? (
          <DashboardLayout
            currentUser={currentUser}
            currentRoute={currentRoute}
            onNavigate={(route) => {
              setCurrentRoute(route);
              setSelectedProgramId(null);
              setSelectedParticipantId(null);
            }}
            notifications={db.notifications || []}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onClearNotifications={handleClearNotifications}
          >
          {/* SECURE SUB-PAGES */}

          {/* PAGE 1: CORE KPIs FOR OFFICIALS */}
          {currentRoute === 'dashboard' && ['admin', 'skofficial', 'viewer'].includes(currentUser.role) && (
            <DashboardView
              programs={db.programs}
              participants={db.participants}
              expenses={db.expenses}
              onNavigate={(route) => setCurrentRoute(route)}
              onSelectProgram={(id) => { setSelectedProgramId(id); setCurrentRoute('program-detail'); }}
              onSelectParticipant={(id) => { setSelectedParticipantId(id); setCurrentRoute('participant-detail'); }}
              currentUserRole={currentUser.role}
            />
          )}

          {/* PAGE 2: USER PROFILE MY REGISTRATIONS FOR RESIDENTS */}
          {currentRoute === 'user-dashboard' && currentUser.role === 'regular' && (
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
          {currentRoute === 'programs' && ['admin', 'skofficial', 'regular', 'viewer'].includes(currentUser.role) && (
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
          {currentRoute === 'program-detail' && selectedProgramId && ['admin', 'skofficial', 'regular', 'viewer'].includes(currentUser.role) && (
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
          {currentRoute === 'programs-new' && ['admin', 'skofficial'].includes(currentUser.role) && (
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
          {currentRoute === 'programs-edit' && ['admin', 'skofficial'].includes(currentUser.role) && (
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
          {currentRoute === 'participants' && ['admin', 'skofficial', 'viewer'].includes(currentUser.role) && (
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
          {currentRoute === 'participant-new' && ['admin', 'skofficial'].includes(currentUser.role) && (
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
          {currentRoute === 'participant-detail' && selectedParticipantId && ['admin', 'skofficial', 'viewer'].includes(currentUser.role) && (
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
          {currentRoute === 'participant-edit' && selectedParticipantId && ['admin', 'skofficial'].includes(currentUser.role) && (
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
          {currentRoute === 'expenses' && ['admin', 'skofficial', 'viewer'].includes(currentUser.role) && (
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
          {currentRoute === 'expenses-new' && ['admin', 'skofficial'].includes(currentUser.role) && (
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
          {currentRoute === 'expenses-report' && ['admin', 'skofficial', 'viewer'].includes(currentUser.role) && (
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
          {currentRoute === 'profile' && ['admin', 'skofficial', 'regular', 'viewer'].includes(currentUser.role) && (
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
          {currentRoute === 'admin-users' && currentUser.role === 'admin' && (
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
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hydrating Session...</p>
             </div>
          </div>
        )
      )}
    </div>
  );
}
