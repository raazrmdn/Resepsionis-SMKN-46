import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MessageSquare,
  Search,
  Filter,
  Check,
  X,
  History,
  CalendarDays,
  RotateCcw,
  Eye,
  Building2,
  Phone
} from 'lucide-react';
import { supabase, type Appointment } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AppointmentList() {
  const { profile } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'appointments' | 'visits'>('appointments');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab as 'appointments' | 'visits');
      // Clear state so it doesn't revert on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [rescheduleData, setRescheduleData] = useState<{id: string, date: string, time: string} | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('public:appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  async function fetchAppointments() {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false });

      if (profile?.role === 'teacher') {
        // Teachers see appointments where they are the target OR the creator
        query = query.or(`teacher_id.eq.${profile.id},receptionist_id.eq.${profile.id}`);
      } else if (profile?.role !== 'admin' && profile?.role !== 'receptionist') {
        // General users (student, staff, guest) only see what they created
        query = query.eq('receptionist_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(appointmentId: string, status: Appointment['status'], extraData = {}) {
    console.log('Updating appointment status:', { appointmentId, status, extraData });
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status, ...extraData })
        .eq('id', appointmentId);

      if (error) {
        console.error('Supabase update error:', error);
        
        // Fallback for check constraint violation on 'completed' status
        if (status === 'completed' && error.message.includes('violates check constraint')) {
          console.warn('DB does not support "completed" status. Falling back to purpose flag.');
          
          // 1. Get current appointment to get its purpose
          const { data: currentApt } = await supabase
            .from('appointments')
            .select('purpose, status')
            .eq('id', appointmentId)
            .single();
            
          if (currentApt) {
            // 2. Append [SELESAI] to purpose if not already there, and keep status at 'confirmed' or existing
            const newPurpose = currentApt.purpose.includes('[SELESAI]') 
              ? currentApt.purpose 
              : `${currentApt.purpose} [SELESAI]`;
              
            const { error: fallbackError } = await supabase
              .from('appointments')
              .update({ 
                purpose: newPurpose, 
                status: currentApt.status === 'pending' ? 'confirmed' : currentApt.status // ensure it's not pending anymore
              })
              .eq('id', appointmentId);
              
            if (fallbackError) throw fallbackError;
            
            setNotification({ type: 'success', message: 'Pertemuan ditandai sebagai Selesai.' });
            fetchAppointments();
            return;
          }
        }
        throw error;
      }
      setNotification({ type: 'success', message: `Status berhasil diubah menjadi ${status}!` });
      fetchAppointments();
      setRescheduleData(null);
    } catch (error: any) {
      console.error('Error updating status:', error);
      setNotification({ type: 'error', message: 'Gagal memperbarui status: ' + (error.message || 'Error.') });
    }
  }

  async function deleteAppointment(id: string) {
    if (!window.confirm('Hapus data ini secara permanen? Tindakan ini tidak bisa dibatalkan.')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      
      if (error) throw error;
      
      setNotification({ type: 'success', message: 'Data berhasil dihapus dari sistem!' });
      await fetchAppointments();
    } catch (error: any) {
      console.error('Delete Error:', error);
      setNotification({ 
        type: 'error', 
        message: 'Gagal menghapus: ' + (error.message || 'Izin ditolak (cek SQL Editor).') 
      });
    } finally {
      setLoading(false);
    }
  }

  const filtered = appointments.filter(apt => {
    // 1. Filter by Tab (Appointment vs Visit)
    const isVisit = apt.purpose?.includes('[KUNJUNGAN RESMI');
    if (activeTab === 'visits' && !isVisit) return false;
    if (activeTab === 'appointments' && isVisit) return false;

    // 2. Filter by Status
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') {
      return apt.status === 'completed' || apt.purpose.includes('[SELESAI]');
    }
    // If filtering for confirmed but it's actually "completed" via flag, exclude it from confirmed list if 'completed' tab exists
    if (filterStatus === 'confirmed' && apt.status === 'confirmed' && apt.purpose.includes('[SELESAI]')) {
      return false;
    }
    return apt.status === filterStatus;
  });

  const getStatusColor = (status: string, purpose: string = '') => {
    if (status === 'completed' || purpose.includes('[SELESAI]')) return 'text-green-600 bg-green-50 border-green-100';
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50 border-green-100';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
      case 'rescheduled': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-vibrant-purple bg-playful-50 border-playful-100';
    }
  };

  const getStatusIcon = (status: string, purpose: string = '') => {
    if (status === 'completed' || purpose.includes('[SELESAI]')) return <CheckCircle2 size={16} />;
    switch (status) {
      case 'confirmed': return <CheckCircle2 size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'rescheduled': return <History size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
            {activeTab === 'appointments' ? 'Daftar' : 'Daftar'} <span className="text-vibrant-purple">{activeTab === 'appointments' ? 'Janji Temu' : 'Kunjungan'}</span>
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            {profile?.role === 'teacher' 
              ? 'Kelola jadwal tamu yang ingin bertemu dengan Anda.' 
              : `Pantau semua daftar ${activeTab === 'appointments' ? 'janji temu' : 'kunjungan resmi'} di sistem.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Tab Switcher */}
          <div className="flex bg-playful-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('appointments')}
              className={cn(
                "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                activeTab === 'appointments' 
                  ? "bg-white text-vibrant-purple shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Janji Temu
            </button>
            <button
              onClick={() => setActiveTab('visits')}
              className={cn(
                "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                activeTab === 'visits' 
                  ? "bg-white text-vibrant-purple shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Kunjungan
            </button>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchAppointments();
            }}
            disabled={loading}
            className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border-4 border-playful-100 hover:bg-playful-50 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Data"
          >
            <RotateCcw size={18} className={cn("text-vibrant-purple", loading && "animate-spin")} />
          </button>

          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border-4 border-playful-100">
            <Filter size={18} className="text-vibrant-purple ml-2" />
            <select 
              className="bg-transparent border-none outline-none font-bold text-sm text-gray-700 pr-4"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="confirmed">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="rescheduled">Reschedule</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 pointer-events-none">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -50 }}
              className={cn(
                "p-6 rounded-[2rem] border-4 flex items-center gap-4 font-black text-xs md:text-sm uppercase tracking-widest shadow-2xl pointer-events-auto backdrop-blur-md",
                notification.type === 'success' ? "bg-vibrant-purple text-white" : "bg-red-500 text-white"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0",
                notification.type === 'success' ? "bg-white/20" : "bg-white/20"
              )}>
                <CheckCircle2 size={20} className="text-white" />
              </div>
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-12 h-12 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] shadow-xl border-4 border-playful-200 text-center">
            <CalendarDays size={64} className="text-gray-200 mx-auto mb-6" />
            <p className="text-gray-400 font-bold text-xl uppercase tracking-widest">
              Belum ada janji temu yang sesuai. 📅
            </p>
          </div>
        ) : (
          filtered.map((apt, i) => (
            <motion.div 
              key={apt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-playful-200 group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                    {apt.guest_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{apt.guest_name}</h3>
                    <div className="flex gap-2 items-center">
                      <p className="text-[10px] text-vibrant-purple font-black uppercase tracking-widest">
                        {(apt as any).organization || 'UMUM'}
                      </p>
                      <span className="text-gray-300 text-[10px]">•</span>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {(apt as any).phone || '-'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2",
                    getStatusColor(apt.status, apt.purpose)
                  )}>
                    {getStatusIcon(apt.status, apt.purpose)}
                    {apt.purpose.includes('[SELESAI]') ? 'Selesai' :
                     apt.status === 'pending' ? 'Menunggu' : 
                     apt.status === 'confirmed' ? 'Disetujui' :
                     apt.status === 'completed' ? 'Selesai' : 
                     apt.status}
                  </div>
                  
                  {/* Detail Button */}
                  <button 
                    onClick={() => setSelectedApt(apt)}
                    className="p-2 text-vibrant-purple hover:bg-vibrant-purple/5 rounded-xl transition-all"
                    title="Lihat Detail"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="w-10 h-10 bg-playful-50 rounded-xl flex items-center justify-center text-vibrant-blue">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Jadwal</p>
                    <p className="font-bold">{apt.date ? format(new Date(apt.date), 'EEEE, dd MMM yyyy', { locale: id }) : 'Belum ditentukan'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="w-10 h-10 bg-playful-50 rounded-xl flex items-center justify-center text-vibrant-pink">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Waktu</p>
                    <p className="font-bold">{apt.time || '-'} WIB</p>
                  </div>
                </div>
                <div className="bg-playful-50/50 p-6 rounded-2xl border-2 border-white relative">
                  <MessageSquare size={16} className="absolute right-4 top-4 text-gray-300" />
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Keperluan</p>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed italic line-clamp-3">
                    {apt.purpose}
                  </p>
                </div>
              </div>

              {(profile?.role === 'teacher' || profile?.role === 'receptionist' || profile?.role === 'admin') && apt.status === 'pending' && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => updateStatus(apt.id, (profile?.role === 'receptionist' || profile?.role === 'admin') ? 'completed' : 'confirmed')}
                    className="flex items-center justify-center gap-2 py-4 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-95"
                  >
                    <Check size={18} /> {(profile?.role === 'receptionist' || profile?.role === 'admin') ? 'Selesai' : 'Terima'}
                  </button>
                  <button 
                    onClick={() => updateStatus(apt.id, 'rejected')}
                    className="flex items-center justify-center gap-2 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
                  >
                    <X size={18} /> Tolak
                  </button>
                  <button 
                    onClick={() => setRescheduleData({ id: apt.id, date: apt.date, time: apt.time })}
                    className="col-span-2 flex items-center justify-center gap-2 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all active:scale-95"
                  >
                    <History size={18} /> Atur Ulang Jadwal
                  </button>
                </div>
              )}

              {/* Selesai Button - Visible for Receptionist and Admins for gate management, or Teacher for their own appointments */}
              {(apt.status === 'confirmed' || apt.status === 'rescheduled') && !apt.purpose.includes('[SELESAI]') && (profile?.role === 'receptionist' || profile?.role === 'admin' || (profile?.role === 'teacher' && apt.teacher_id === profile.id)) && (
                <div className="pt-2">
                  <button 
                    onClick={() => updateStatus(apt.id, 'completed')}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-vibrant-purple text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-vibrant-purple/90 shadow-lg shadow-vibrant-purple/20 transition-all active:scale-95"
                  >
                    <CheckCircle2 size={18} /> Selesai / Tamu Keluar
                  </button>
                </div>
              )}

              {profile?.role === 'teacher' && apt.status === 'pending' && (
                <p className="text-center text-[10px] font-black text-vibrant-purple mt-4 uppercase tracking-widest animate-pulse">
                  Menunggu Keputusan Anda
                </p>
              )}

              {profile?.role !== 'teacher' && profile?.role !== 'receptionist' && profile?.role !== 'admin' && apt.status === 'pending' && (
                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                  Menunggu konfirmasi dari guru bersangkutan
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Reschedule */}
      <AnimatePresence>
        {rescheduleData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRescheduleData(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden border-8 border-white"
            >
              <div className="p-8 bg-amber-500 text-white">
                <h3 className="text-2xl font-black tracking-tight uppercase">Atur Ulang Jadwal</h3>
                <p className="text-white/80 font-bold text-xs mt-2">Pilih tanggal dan waktu baru untuk pertemuan</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Tanggal Baru</label>
                  <input 
                    type="date"
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-amber-500/10 rounded-2xl outline-none font-bold"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Waktu Baru</label>
                  <input 
                    type="time"
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-amber-500/10 rounded-2xl outline-none font-bold"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setRescheduleData(null)}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => updateStatus(rescheduleData.id, 'rescheduled', { date: rescheduleData.date, time: rescheduleData.time })}
                    className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-200"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedApt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApt(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white"
            >
              <div className={cn(
                "p-10 text-white relative",
                activeTab === 'appointments' ? "bg-gradient-to-br from-vibrant-purple to-vibrant-pink" : "bg-gradient-to-br from-vibrant-blue to-vibrant-purple"
              )}>
                <button 
                  onClick={() => setSelectedApt(null)}
                  className="absolute top-8 right-8 p-3 h-12 w-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white text-gray-900 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-xl">
                    {selectedApt.guest_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] opacity-80 mb-2">Detail {activeTab === 'appointments' ? 'Janji Temu' : 'Kunjungan'}</p>
                    <h2 className="text-4xl font-black tracking-tighter leading-none">{selectedApt.guest_name}</h2>
                    <p className="font-bold text-white/90 mt-2 text-lg">{(selectedApt as any).organization || 'Masyarakat Umum'}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jadwal</p>
                    <p className="font-bold text-gray-900">{selectedApt.date ? format(new Date(selectedApt.date), 'EEEE, dd MMM yyyy', { locale: id }) : '-'}</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Waktu</p>
                    <p className="font-bold text-gray-900">{selectedApt.time || '-'} WIB</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-vibrant-purple shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor Telepon</p>
                      <p className="font-bold text-gray-900">{(selectedApt as any).phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border-2 border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-vibrant-blue shadow-sm">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tujuan Unit/Bidang</p>
                      <p className="font-bold text-gray-900">{(selectedApt as any).target_unit || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-playful-50 rounded-3xl border-2 border-white shadow-inner">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={16} className="text-vibrant-purple" />
                    <p className="text-[10px] font-black text-vibrant-purple uppercase tracking-widest">Keperluan</p>
                  </div>
                  <p className="text-gray-700 font-bold leading-relaxed whitespace-pre-wrap">
                    {selectedApt.purpose}
                  </p>
                </div>
              </div>

              <div className="p-10 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                <div className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-4",
                  getStatusColor(selectedApt.status, selectedApt.purpose)
                )}>
                  {getStatusIcon(selectedApt.status, selectedApt.purpose)}
                  {selectedApt.purpose.includes('[SELESAI]') ? 'Selesai' : selectedApt.status}
                </div>
                <button 
                  onClick={() => setSelectedApt(null)}
                  className="px-10 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl"
                >
                  Tutup Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
