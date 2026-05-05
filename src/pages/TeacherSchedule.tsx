import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Filter,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  FileText
} from 'lucide-react';
import { supabase, type TeacherSchedule, type Profile } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Tersedia', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  { value: 'teaching', label: 'Sedang Mengajar', color: 'bg-vibrant-blue', bgColor: 'bg-playful-50', textColor: 'text-vibrant-blue' },
  { value: 'duty', label: 'Piket', color: 'bg-vibrant-purple', bgColor: 'bg-playful-50', textColor: 'text-vibrant-purple' },
  { value: 'out_of_school', label: 'Luar Sekolah', color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  { value: 'leave', label: 'Izin / Sakit', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-600' }
];

export default function TeacherSchedule() {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mySchedule, setMySchedule] = useState<Partial<TeacherSchedule>>({
    status: 'available',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('public:teacher_schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_schedules' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    try {
      // Fetch all teachers
      const { data: teacherData, error: teacherError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher');

      if (teacherError) throw teacherError;
      setTeachers(teacherData || []);

      // Fetch today's schedules
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('teacher_schedules')
        .select('*')
        .eq('date', today);

      if (scheduleError) throw scheduleError;
      setSchedules(scheduleData || []);

      // If user is a teacher, set their current schedule
      if (profile?.role === 'teacher') {
        const current = (scheduleData || []).find(s => s.teacher_id === profile.id);
        if (current) {
          setMySchedule(current);
        } else {
          setMySchedule({
            teacher_id: profile.id,
            date: today,
            status: 'available',
            notes: ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSchedule() {
    if (!profile) return;
    setSaving(true);
    setNotification(null);
    try {
      const scheduleToSave = {
        ...mySchedule,
        teacher_id: profile.id,
        date: today,
        updated_at: new Date().toISOString()
      };

      // Remove created_at if it exists to let DB handled it, or keep id for upsert
      const { error } = await supabase
        .from('teacher_schedules')
        .upsert(scheduleToSave);

      if (error) throw error;
      
      setNotification({ type: 'success', message: 'Jadwal Anda berhasil diperbarui! ✨' });
      // Refresh local data
      fetchData();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      setNotification({ type: 'error', message: 'Gagal menyimpan: ' + (error.message || 'Error sistem') });
    } finally {
      setSaving(false);
    }
  }

  const filteredTeachers = teachers
    .filter(t => 
      t.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'id'));

  const getTeacherStatus = (teacherId: string) => {
    const schedule = schedules.find(s => s.teacher_id === teacherId);
    return schedule ? STATUS_OPTIONS.find(o => o.value === schedule.status) : null;
  };

  const getTeacherNotes = (teacherId: string) => {
    const schedule = schedules.find(s => s.teacher_id === teacherId);
    return schedule?.notes || '';
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-vibrant-purple to-purple-400',
      'from-vibrant-blue to-blue-400',
      'from-vibrant-yellow to-yellow-500',
      'from-green-400 to-green-600',
      'from-orange-400 to-orange-600',
      'from-pink-400 to-pink-600',
      'from-teal-400 to-teal-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
            Jadwal <span className="text-vibrant-purple">Guru</span>
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            Status kehadiran dan kegiatan guru SMKN 46 Jakarta hari ini.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <a 
            href="https://drive.google.com/file/d/1EuPoFlGxpKZAWnQ6lmsW3aWxb0ppfCvo/view?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-6 py-3 bg-vibrant-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-vibrant-blue/90 shadow-lg shadow-vibrant-blue/20 transition-all active:scale-95"
          >
            <FileText size={18} />
            Lihat Jadwal Pelajaran (PDF)
          </a>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border-4 border-playful-100 flex items-center gap-3">
            <Calendar size={18} className="text-vibrant-purple" />
            <span className="font-black text-xs uppercase tracking-widest text-gray-900">
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
            </span>
          </div>
        </div>
      </header>

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-xl px-4 pointer-events-none">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={cn(
                "p-6 rounded-[2rem] border-4 flex items-center gap-4 font-black text-sm uppercase tracking-widest shadow-2xl pointer-events-auto backdrop-blur-md",
                notification.type === 'success' ? "bg-vibrant-purple text-white" : "bg-red-500 text-white"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
                notification.type === 'success' ? "bg-white/20" : "bg-white/20"
              )}>
                <Sparkles size={20} className="text-white" />
              </div>
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {profile?.role === 'teacher' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-playful-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8">
            <Sparkles className="text-vibrant-yellow animate-pulse" size={32} />
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-vibrant-purple/10 rounded-xl flex items-center justify-center text-vibrant-purple">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Update Status Anda</h2>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Beritahukan posisi Anda hari ini kepada resepsionis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMySchedule({ ...mySchedule, status: opt.value as any })}
                className={cn(
                  "p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 group",
                  mySchedule.status === opt.value 
                    ? `${opt.bgColor} border-${opt.value === 'available' ? 'green-500' : opt.value === 'teaching' ? 'vibrant-blue' : opt.value === 'duty' ? 'vibrant-purple' : opt.value === 'out_of_school' ? 'amber-500' : 'red-500'} shadow-lg scale-105` 
                    : "bg-white border-playful-50 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  opt.color
                )}></div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  mySchedule.status === opt.value ? opt.textColor : "text-gray-400"
                )}>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4 mb-8">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Catatan Tambahan (Opsional)</label>
            <input 
              type="text"
              placeholder="Contoh: Mengajar di Lab Komputer, Sedang Rapat di Dinas..."
              className="w-full px-6 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-2xl outline-none transition-all font-bold text-gray-900"
              value={mySchedule.notes || ''}
              onChange={(e) => setMySchedule({ ...mySchedule, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-4">
             <button 
               onClick={fetchData}
               className="flex items-center gap-2 px-8 py-5 bg-playful-50 text-vibrant-purple rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-playful-100 transition-all active:scale-95 border-2 border-vibrant-purple/10"
             >
               <RotateCcw size={18} /> Refresh Data
             </button>
             <button 
               onClick={handleSaveSchedule}
               disabled={saving}
               className="flex items-center gap-2 px-10 py-5 bg-vibrant-purple text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-vibrant-purple/90 shadow-lg shadow-vibrant-purple/20 transition-all active:scale-95 disabled:opacity-50"
             >
               {saving ? 'Menyimpan...' : (
                 <>
                   <Save size={18} /> Simpan Perubahan Jadwal
                 </>
               )}
             </button>
          </div>
        </motion.div>
      )}

      <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-playful-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
            <User size={24} className="text-vibrant-blue" />
            Daftar Guru
          </h2>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <button 
              onClick={fetchData}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-playful-50 text-vibrant-blue rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-playful-100 transition-all active:scale-95 border-2 border-vibrant-blue/10"
            >
              <RotateCcw size={16} /> Refresh
            </button>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text"
                placeholder="Cari Nama Guru..."
                className="w-full pl-14 pr-6 py-4 bg-playful-50 border-4 border-playful-100 focus:border-vibrant-blue/10 rounded-2xl outline-none font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-10 text-center">
              <div className="w-10 h-10 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full py-10 text-center text-gray-400 font-bold">
              Tidak ada guru yang ditemukan.
            </div>
          ) : (
            filteredTeachers.map((teacher, i) => {
              const status = getTeacherStatus(teacher.id);
              const notes = getTeacherNotes(teacher.id);
              
              return (
                <motion.div 
                  key={teacher.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 rounded-3xl border-4 border-playful-50 hover:border-vibrant-blue/20 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "w-14 h-14 bg-gradient-to-br rounded-2xl flex items-center justify-center text-white font-black text-xl group-hover:rotate-6 transition-transform shadow-lg",
                      getAvatarColor(teacher.full_name)
                    )}>
                      {teacher.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{teacher.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{teacher.email.split('@')[0]}</p>
                    </div>
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl border-2 flex flex-col gap-2 relative overflow-hidden",
                    status ? `${status.bgColor} border-white` : "bg-gray-50 border-gray-100/50"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                        status ? status.textColor : "text-gray-400"
                      )}>
                        {status ? (
                          <>
                            <div className={cn("w-2 h-2 rounded-full", status.color)}></div>
                            {status.label}
                          </>
                        ) : (
                          'Belum Update'
                        )}
                      </span>
                      {status && <CheckCircle2 size={14} className={status.textColor} />}
                    </div>
                    <div className="mt-2 min-h-[40px]">
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1 mb-1">
                         <Info size={10} /> Catatan:
                       </p>
                       <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-relaxed italic">
                         {notes || '-'}
                       </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
