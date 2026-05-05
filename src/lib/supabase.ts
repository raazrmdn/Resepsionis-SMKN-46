import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key is missing. Please configure them in the Secrets panel.');
      throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    
    // Log masked URL for debugging, but only if it's not a known placeholder
    if (supabaseUrl.includes('your-project-url')) {
        console.warn('WARNING: VITE_SUPABASE_URL still contains the default placeholder. Please update your secrets.');
    } else {
        const maskedUrl = supabaseUrl.replace(/(https?:\/\/)([^.]+)(.*)/, '$1***$3');
        console.log(`Initializing Supabase with URL: ${maskedUrl}`);
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Export a proxy or a getter-based object to maintain compatibility if possible, 
// but it's safer to use the getter function.
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    return (getSupabase() as any)[prop];
  }
});

export type Role = 'admin' | 'receptionist' | 'teacher' | 'staff' | 'student' | 'guest';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  organization: string;
  purpose: string;
  phone: string;
  created_at: string;
  receptionist_id: string;
}

export interface Appointment {
  id: string;
  guest_name: string;
  teacher_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'rescheduled' | 'completed';
  purpose: string;
  created_at: string;
}

export interface Package {
  id: string;
  recipient_id: string;
  sender_name: string;
  description: string;
  status: 'received' | 'taken';
  received_at: string;
  taken_at?: string;
  receptionist_id: string;
}

export interface TeacherSchedule {
  id: string;
  teacher_id: string;
  date: string;
  status: 'available' | 'teaching' | 'duty' | 'out_of_school' | 'leave';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface StudentDispensation {
  id: string;
  student_name: string;
  student_class: string;
  reason: string;
  granting_teacher: string;
  dispensation_type: 'back_to_school' | 'go_home';
  status: 'out' | 'returned' | 'home';
  receptionist_id: string;
  created_at: string;
  updated_at: string;
}
