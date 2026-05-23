/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'skofficial' | 'regular' | 'viewer';

export interface User {
  id: string; // UUID from Auth
  email: string;
  role: UserRole;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: number; // BIGINT
  user_id: string; // FK -> users.id
  first_name: string;
  last_name: string;
  age: number;
  contact: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: number; // BIGINT
  name: string;
  description: string;
  date: string; // DATE ISO
  time: string;
  location: string;
  budget: number;
  status: 'planned' | 'ongoing' | 'completed';
  file_urls?: string[];
  created_by: string; // UUID -> users.id
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number; // BIGINT
  program_id: number; // FK -> programs.id
  description: string;
  amount: number;
  date: string;
  category: 'Food' | 'Supplies' | 'Transport' | 'Honorarium' | 'Other';
  recorded_by: string; // UUID -> users.id
  created_at: string;
}

export interface ProgramParticipant {
  program_id: number;
  participant_id: number;
  registration_status: 'pending' | 'approved' | 'rejected';
  attendance_status: 'present' | 'absent' | 'excused';
  registered_at: string;
}

export interface Registration {
  id: number;
  program_id: number;
  participant_id: number;
  registration_date: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approved_by?: string; // UUID -> users.id
  approved_at?: string;
}

export interface Feedback {
  id: number;
  program_id: number;
  participant_id: number;
  rating: number; // 1 to 5
  comment: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// Database Structure for client-side state
export interface SKDatabase {
  users: User[];
  participants: Participant[];
  programs: Program[];
  expenses: Expense[];
  program_participants: ProgramParticipant[];
  registrations: Registration[];
  feedbacks: Feedback[];
  notifications: AppNotification[];
}
