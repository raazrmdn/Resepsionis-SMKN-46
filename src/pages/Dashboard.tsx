import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Users, 
  Calendar, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Zap,
  FileText,
  Building2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const data = [
  { name: 'Sen', tamu: 12, janji: 8 },
  { name: 'Sel', tamu: 19, janji: 12 },
  { name: 'Rab', tamu: 15, janji: 10 },
  { name: 'Kam', tamu: 22, janji: 15 },
  { name: 'Jum', tamu: 30, janji: 20 },
];

const pieData = [
  { name: 'Selesai', value: 45 },
  { name: 'Proses', value: 35 },
  { name: 'Batal', value: 20 },
];

const COLORS = ['#A855F7', '#EC4899', '#3B82F6', '#EAB308', '#22C55E'];
const PIE_COLORS = ['#22C55E', '#3B82F6', '#EF4444'];

// --- Memoized Components ---

const StatCard = React.memo(({ title, value, icon: Icon, color, trend, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white p-4 sm:p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl border-4 border-playful-200 relative overflow-hidden group"
  >
    <div className={cn("absolute -right-4 -top-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full opacity-10 transition-transform duration-500", color)}></div>
    <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
      <div className={cn("p-3 sm:p-4 rounded-xl sm:rounded-full shadow-lg text-white", color)}>
        <Icon size={20} className="sm:w-6 sm:h-6" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black border-2 border-green-100">
          <TrendingUp size={10} className="sm:w-3 sm:h-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <h3 className="text-gray-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 relative z-10">{title}</h3>
    <p className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 relative z-10 tracking-tighter leading-none">{value}</p>
  </motion.div>
));

const ActionCard = React.memo(({ title, icon: Icon, onClick, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3 }}
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.98 }}
    className="cursor-pointer"
    onClick={onClick}
  >
    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-xl border-4 border-playful-200 flex flex-col items-center text-center gap-3 sm:gap-4 group transition-colors hover:bg-playful-50 h-full">
      <div className={cn("w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
        <Icon size={20} className="sm:w-7 sm:h-7" />
      </div>
      <h3 className="font-black text-gray-900 text-[8px] sm:text-[10px] uppercase tracking-widest leading-tight">{title}</h3>
    </div>
  </motion.div>
));

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalGuests: 0, activeAppointments: 0, pendingPackages: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleNavigate = useCallback((path: string) => navigate(path), [navigate]);

  useEffect(() => {
    if (profile?.role === 'teacher') {
      navigate('/app/teacher-schedule', { replace: true });
    }
  }, [profile, navigate]);

  // --- Memo Logic ---
  const [notes, setNotes] = useState<{ id: string, text: string, time: string }[]>(() => {
    const saved = localStorage.getItem('smkn46_dashboard_memos');
    return saved ? JSON.parse(saved) : [];
  });

  const saveNote = (text: string) => {
    const newNote = {
      id: crypto.randomUUID(),
      text,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    };
    const updated = [newNote, ...notes].slice(0, 5); // Keep latest 5
    setNotes(updated);
    localStorage.setItem('smkn46_dashboard_memos', JSON.stringify(updated));
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('smkn46_dashboard_memos', JSON.stringify(updated));
  };

  const fetchStatsAndActivity = useCallback(async () => {
    if (!profile) return;
    try {
      setError(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let guestQuery = supabase.from('guests').select('*', { count: 'exact', head: true });
      let aptQuery = supabase.from('appointments').select('*', { count: 'exact', head: true });
      let pkgQuery = supabase.from('packages').select('*', { count: 'exact', head: true });
      
      let recentGuestQuery = supabase.from('guests').select('*').order('created_at', { ascending: false }).limit(2);
      let recentAptQuery = supabase.from('appointments').select('*').order('created_at', { ascending: false }).limit(2);
      let recentPkgQuery = supabase.from('packages').select('*').order('received_at', { ascending: false }).limit(2);

      // Role-based filtering
      if (profile.role === 'guest') {
        guestQuery = guestQuery.eq('receptionist_id', profile.id);
        aptQuery = aptQuery.eq('receptionist_id', profile.id);
        pkgQuery = pkgQuery.eq('receptionist_id', profile.id);
        recentGuestQuery = recentGuestQuery.eq('receptionist_id', profile.id);
        recentAptQuery = recentAptQuery.eq('receptionist_id', profile.id);
        recentPkgQuery = recentPkgQuery.eq('receptionist_id', profile.id);
      } else if (profile.role === 'student' || profile.role === 'teacher') {
        aptQuery = aptQuery.eq('teacher_id', profile.id);
        pkgQuery = pkgQuery.eq('recipient_id', profile.id);
        recentAptQuery = recentAptQuery.eq('teacher_id', profile.id);
        recentPkgQuery = recentPkgQuery.eq('recipient_id', profile.id);
      }

      const [guestCountRes, aptCountRes, pkgCountRes, guestsRes, aptsRes, pkgsRes] = await Promise.all([
        guestQuery.gte('created_at', today.toISOString()),
        aptQuery.eq('status', 'pending'),
        pkgQuery.eq('status', 'received'),
        recentGuestQuery,
        recentAptQuery,
        recentPkgQuery
      ]);

      if (guestCountRes.error) throw guestCountRes.error;
      if (aptCountRes.error) throw aptCountRes.error;
      if (pkgCountRes.error) throw pkgCountRes.error;

      setStats({
        totalGuests: guestCountRes.count || 0,
        activeAppointments: aptCountRes.count || 0,
        pendingPackages: pkgCountRes.count || 0
      });

      const activities = [
        ...(guestsRes.data || []).map(g => ({ title: `Tamu: ${g.name}`, time: new Date(g.created_at), icon: Users, color: 'bg-vibrant-pink', path: '/app/guestbook' })),
        ...(aptsRes.data || []).map(a => ({ title: `Janji: ${a.guest_name}`, time: new Date(a.created_at), icon: Calendar, color: 'bg-vibrant-purple', path: '/app/appointment-list' })),
        ...(pkgsRes.data || []).map(p => ({ title: `Paket: ${p.sender_name}`, time: new Date(p.received_at), icon: Package, color: 'bg-vibrant-blue', path: '/app/packages' }))
      ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 4);

      setRecentActivity(activities);
    } catch (error: any) {
      console.error('Dashboard Error:', error);
      if (error.message === 'Failed to fetch') {
        setError('Koneksi database gagal (Failed to Fetch). Periksa URL Supabase di Secrets panel.');
      } else {
        setError('Gagal memuat data dashboard: ' + error.message);
      }
    }
  }, [profile]);

  useEffect(() => {
    fetchStatsAndActivity();
    const channel = supabase.channel('dashboard-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, fetchStatsAndActivity)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchStatsAndActivity)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, fetchStatsAndActivity)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStatsAndActivity]);

  return (
    <div className="space-y-12">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 md:gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="text-vibrant-yellow fill-vibrant-yellow" size={18} />
            <span className="text-vibrant-purple font-black text-[9px] sm:text-[10px] uppercase tracking-[0.4em]">
              {profile?.role === 'admin' ? 'Administrative Overlook' : 
               profile?.role === 'receptionist' ? 'Receptionist Center' : 
               profile?.role === 'teacher' ? 'Teacher Dashboard' : 
               profile?.role === 'student' ? 'Student Workspace' : 'Meja Tamu'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight uppercase">
            HELLO, <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibrant-purple to-vibrant-pink">{profile?.full_name?.split(' ')[0].toUpperCase()}!</span>
          </h1>
          <p className="text-gray-500 font-bold mt-2 text-xs sm:text-sm md:text-base">
            {profile?.role === 'admin' ? 'Siap memantau sistem SMKN 46 hari ini?' : 
             profile?.role === 'receptionist' ? 'Resepsionis SMKN 46 siap melayani tamu hari ini.' :
             profile?.role === 'teacher' ? 'Siap mengajar dan memandu siswa hari ini?' :
             profile?.role === 'student' ? 'Tetap semangat belajar di SMKN 46!' :
             'Senang melihat Anda kembali di portal SMKN 46 Jakarta.'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 p-4 bg-red-50 border-4 border-red-100 rounded-2xl text-red-600 shadow-lg w-full lg:w-auto"
          >
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest mb-1">Warning: Network Error</p>
              <p className="text-[10px] font-bold leading-tight">{error}</p>
            </div>
            <button 
              onClick={() => fetchStatsAndActivity()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}

        <div className="bg-white px-5 py-3 rounded-2xl shadow-lg border-2 border-playful-100 flex items-center gap-4 w-full sm:w-auto self-stretch sm:self-auto">
          <div className="w-10 h-10 bg-vibrant-blue/10 rounded-xl flex items-center justify-center text-vibrant-blue shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <p className="text-[10px] text-vibrant-purple font-black uppercase tracking-[0.2em]">SMKN 46 JAKARTA</p>
          </div>
        </div>
      </header>

      {/* Common Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        <StatCard title="Tamu Hari Ini" value={stats.totalGuests} icon={Users} color="bg-vibrant-pink" trend="+12%" delay={0.1} />
        <StatCard title="Janji Aktif" value={stats.activeAppointments} icon={Calendar} color="bg-vibrant-purple" trend="+5%" delay={0.2} />
        <StatCard title="Paket Pending" value={stats.pendingPackages} icon={Package} color="bg-vibrant-blue" delay={0.3} />
      </div>

      {(profile?.role === 'receptionist' || profile?.role === 'guest' || profile?.role === 'admin' || profile?.role === 'student') && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {(profile?.role === 'receptionist' || profile?.role === 'guest') && (
            <ActionCard title="Input Janji" icon={Calendar} onClick={() => handleNavigate('/app/appointments')} color="bg-vibrant-purple" delay={0.1} />
          )}
          <ActionCard 
            title="Daftar Janji" 
            icon={CheckCircle2} 
            onClick={() => navigate('/app/appointment-list', { state: { tab: 'appointments' } })} 
            color="bg-vibrant-blue" 
            delay={0.2} 
          />
          <ActionCard 
            title="Daftar Kunjungan" 
            icon={Building2} 
            onClick={() => navigate('/app/appointment-list', { state: { tab: 'visits' } })} 
            color="bg-vibrant-green" 
            delay={0.25} 
          />
          {(profile?.role === 'receptionist' || profile?.role === 'admin') && (
            <ActionCard title="Jadwal Guru" icon={Clock} onClick={() => handleNavigate('/app/teacher-schedule')} color="bg-vibrant-yellow" delay={0.3} />
          )}
          {(profile?.role !== 'student') && (
            <ActionCard title={profile?.role === 'guest' ? "Histori Janji" : "Buku Tamu"} icon={Users} onClick={() => handleNavigate('/app/guestbook')} color="bg-vibrant-pink" delay={0.4} />
          )}
          <ActionCard title="Barang & Surat" icon={Package} onClick={() => handleNavigate('/app/packages')} color="bg-amber-500" delay={0.5} />
          {(profile?.role !== 'student') && (
            <ActionCard title="Laporan" icon={FileText} onClick={() => handleNavigate('/app/reports')} color="bg-gray-500" delay={0.6} />
          )}
        </div>
      )}

      {/* Main Visuals Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl border-4 border-playful-200">
          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-8">Tren Kunjungan</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }} />
                <Tooltip cursor={{ fill: '#f9fafb', radius: 10 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="tamu" radius={[8, 8, 8, 8]} barSize={20}>
                  {data.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-playful-200 flex flex-col">
          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-8">Status Janji</h3>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {pieData.map((_, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mt-4">
            {pieData.map((d, i) => (
              <div key={d.name}>
                <p className="text-[8px] font-black uppercase text-gray-400">{d.name}</p>
                <p className="text-base font-black" style={{ color: PIE_COLORS[i] }}>{d.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Group */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Riwayat Aktivitas */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-playful-200">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Riwayat Aktivitas</h3>
            <Sparkles className="text-vibrant-yellow" size={20} />
          </div>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="py-10 text-center text-gray-400 font-bold uppercase text-[10px] italic">Belum ada aktivitas baru.</div>
            ) : (
              recentActivity.map((activity, i) => (
                <Link key={i} to={activity.path} className="flex items-center gap-4 p-4 hover:bg-playful-50 rounded-2xl transition-colors group">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110", activity.color)}>
                    <activity.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-gray-900 group-hover:text-vibrant-purple transition-colors">{activity.title}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                      {formatDistanceToNow(activity.time, { addSuffix: true, locale: id })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link to="/app/guestbook" className="w-full inline-block text-center mt-6 py-4 rounded-xl bg-playful-50 text-vibrant-purple font-black text-[10px] uppercase tracking-widest hover:bg-playful-100 transition-all border-2 border-white shadow-sm">
            LIHAT SEMUA
          </Link>
        </div>

        {/* Papan Memo Sekolah */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-playful-200 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Papan Memo Sekolah</h3>
            <div className="w-8 h-8 rounded-full bg-vibrant-pink/10 flex items-center justify-center text-vibrant-pink">
              <Zap size={16} className="fill-vibrant-pink/20" />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="mb-6">
            <div className="relative group">
              <textarea 
                placeholder="Ada pengumuman atau rapat hari ini? Tulis di sini..." 
                className="w-full p-4 pr-12 bg-playful-50 border-2 border-playful-100 rounded-2xl outline-none focus:border-vibrant-pink/30 font-bold text-xs text-gray-800 placeholder:text-gray-300 resize-none h-24"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const target = e.target as HTMLTextAreaElement;
                    if (target.value.trim()) {
                      saveNote(target.value);
                      target.value = '';
                    }
                  }
                }}
              />
              <button 
                onClick={(e) => {
                  const textarea = (e.currentTarget.previousSibling as HTMLTextAreaElement);
                  if (textarea.value.trim()) {
                    saveNote(textarea.value);
                    textarea.value = '';
                  }
                }}
                className="absolute right-4 bottom-4 w-8 h-8 bg-vibrant-pink text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-vibrant-pink/20"
              >
                <Zap size={16} fill="currentColor" />
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[200px] pr-2 scrollbar-hide">
            {notes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                <Clock size={32} strokeWidth={1} />
                <p className="text-[10px] uppercase font-black tracking-widest">Belum ada memo.</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="p-3 bg-playful-50/50 border border-playful-100 rounded-xl group/note relative">
                  <p className="text-xs font-bold text-gray-700 leading-tight pr-4">{note.text}</p>
                  <p className="text-[8px] text-gray-400 font-black uppercase mt-2">{note.time}</p>
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover/note:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
