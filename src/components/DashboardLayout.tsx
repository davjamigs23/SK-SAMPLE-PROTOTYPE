/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole, AppNotification } from '../types';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CircleDollarSign,
  FileBarChart,
  UserCircle,
  MessageSquare,
  ShieldAlert,
  Bell,
  LogOut,
  Sparkles,
  Menu,
  X,
  UserCheck,
  Building,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface DashboardLayoutProps {
  currentUser: User;
  currentRoute: string;
  onNavigate: (route: string) => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearNotifications: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({
  currentUser,
  currentRoute,
  onNavigate,
  notifications,
  onMarkNotificationAsRead,
  onClearNotifications,
  children
}: DashboardLayoutProps) {
  const [showNotifIdx, setShowNotifIdx] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'skofficial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'SK Chairman (Admin)';
      case 'skofficial': return 'SK Kagawad/Treas. (Official)';
      case 'regular': return 'Youth Resident';
      case 'viewer': return 'Barangay LGU Visitor';
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'KPI Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'skofficial', 'viewer']
    },
    {
      id: 'user-dashboard',
      label: 'My Registrations',
      icon: CheckCircle2,
      roles: ['regular']
    },
    {
      id: 'programs',
      label: 'SK Programs Registry',
      icon: CalendarDays,
      roles: ['admin', 'skofficial', 'regular', 'viewer']
    },
    {
      id: 'participants',
      label: 'Youth Participants',
      icon: Users,
      roles: ['admin', 'skofficial', 'viewer']
    },
    {
      id: 'expenses',
      label: 'Expenses Ledger',
      icon: CircleDollarSign,
      roles: ['admin', 'skofficial', 'viewer']
    },
    {
      id: 'expenses-report',
      label: 'Financial Analytics',
      icon: FileBarChart,
      roles: ['admin', 'skofficial', 'viewer']
    },
    {
      id: 'admin-users',
      label: 'Resident Access Approvals',
      icon: UserCheck,
      roles: ['admin']
    },
    {
      id: 'profile',
      label: 'Account Profile',
      icon: UserCircle,
      roles: ['admin', 'skofficial', 'regular', 'viewer']
    }
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex flex-1 relative">
        {/* Sidebar Left Component */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 flex flex-col shadow-xl lg:shadow-none transition-transform pointer-events-auto duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-18 px-6 border-b border-slate-50 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-600/5 to-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                <img src="/Sk_logo.jpg" alt="SK Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h1 className="text-xs font-black text-slate-900 tracking-wide uppercase">San Francisco</h1>
                <p className="text-[10px] font-medium text-slate-500">PMMS System</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User profile details in sidebar */}
          <div className="p-4 mx-4 my-3 bg-slate-50 border border-slate-100/50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold flex items-center justify-center text-xs shadow-3xs uppercase">
              {currentUser.email.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-slate-400 truncate uppercase tracking-wider block">Logged In As</div>
              <div className="text-xs font-bold text-slate-800 truncate block">{currentUser.email}</div>
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getRoleBadgeColor(currentUser.role)}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-2">
              Menu Navigation
            </div>
            {allowedMenuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <IconComp className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-50 text-[11px] text-slate-400 flex flex-col gap-2 bg-slate-50/50">
            <div className="flex items-center gap-1.5 font-medium text-slate-500">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              <span>San Francisco, Naga City</span>
            </div>
            <p className="text-[9px] text-slate-400">Approved for LGU Capstone Submission v1.0.0</p>
            <button
              onClick={() => onNavigate('landing')}
              className="w-full mt-2 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 rounded-xl transition-all font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Portal</span>
            </button>
          </div>
        </aside>

        {/* Content pane right */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {/* Header */}
          <header className="h-18 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 relative z-30 shadow-3xs">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-700 border border-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Sangguniang Kabataan Portal</h2>
                <p className="text-xs text-slate-400 hidden sm:block">Barangay San Francisco • City of Naga</p>
              </div>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-4 relative">
              {/* Notification icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifIdx(!showNotifIdx)}
                  className="p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/60 rounded-xl transition-all relative cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white animate-bounce">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown list */}
                {showNotifIdx && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-xl border border-slate-100 p-2 z-50">
                    <div className="flex items-center justify-between p-3 border-b border-slate-50">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        <span>Recent Real-time Alerts</span>
                      </span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => {
                            onClearNotifications();
                            setShowNotifIdx(false);
                          }}
                          className="text-[10px] font-semibold text-rose-600 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 font-medium">
                          No recent notifications.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 text-xs transition-colors ${
                              notif.is_read ? 'bg-white' : 'bg-emerald-50/40 hover:bg-emerald-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-800">{notif.title}</h4>
                                <p className="text-slate-600 mt-1 leading-snug">{notif.message}</p>
                                <span className="text-[9px] text-slate-400 mt-1 block">
                                  {new Date(notif.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {!notif.is_read && (
                                <button
                                  onClick={() => onMarkNotificationAsRead(notif.id)}
                                  className="text-[9px] font-bold text-emerald-600 hover:underline shrink-0"
                                >
                                  Mark Read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick static user indicator with Naga Badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
                <div className="hidden md:block text-right">
                  <span className="text-xs font-black block text-slate-800">
                    {currentUser.role === 'admin' ? 'SK Chairman' : currentUser.role === 'skofficial' ? 'SK Official' : currentUser.role === 'regular' ? 'Youth Resident' : 'Viewer'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block">San Francisco Youth Council</span>
                </div>
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-emerald-600 border border-slate-200">
                  <div className="w-full h-full text-white font-bold text-xs flex items-center justify-center uppercase">
                    {currentUser.email.slice(0, 1)}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Workspace Frame */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
