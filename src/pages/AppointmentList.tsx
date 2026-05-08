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
  Phone,
  FileDown
} from 'lucide-react';
import { supabase, type Appointment } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const exportToPDF = () => {
    if (filtered.length === 0) {
      setNotification({ type: 'error', message: 'Tidak ada data untuk diekspor' });
      return;
    }

    const doc = new jsPDF();
    const title = activeTab === 'appointments' ? 'DAFTAR JANJI TEMU' : 'DAFTAR KUNJUNGAN RESMI';
    
    // Header
    doc.setFontSize(18);
    doc.text(`SMKN 46 JAKARTA - ${title}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 28);
    doc.text(`Dicetak oleh: ${profile?.full_name || 'Anonymous'}`, 14, 34);

    const tableData = filtered.map((apt) => [
      apt.guest_name,
      (apt as any).organization || 'UMUM',
      apt.purpose,
      apt.date ? format(new Date(apt.date), 'dd/MM/yyyy') : '-',
      apt.time || '-',
      apt.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Nama Tamu', 'Instansi', 'Keperluan', 'Tanggal', 'Waktu', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 70 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 }
      }
    });

    const fileName = `laporan_${activeTab}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
    setNotification({ type: 'success', message: 'Laporan berhasil diekspor ke PDF' });
  };

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
    <div className="space-y-8 md:space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div className="max-w-xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight uppercase leading-tight sm:leading-none">
            {activeTab === 'appointments' ? 'Daftar' : 'Daftar'} <span className="text-vibrant-purple">{activeTab === 'appointments' ? 'Janji Temu' : 'Kunjungan'}</span>
          </h1>
          <p className="text-gray-500 font-bold mt-2 text-xs sm:text-sm md:text-base">
            {profile?.role === 'teacher' 
              ? 'Kelola jadwal tamu yang ingin bertemu dengan Anda.' 
              : `Pantau semua daftar ${activeTab === 'appointments' ? 'janji temu' : 'kunjungan resmi'} di sistem.`}
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-auto">
          {/* Tab Switcher - Now Full Width on Mobile */}
          <div className="flex bg-playful-100 p-1 rounded-2xl w-full">
            <button
              onClick={() => setActiveTab('appointments')}
              className={cn(
                "flex-1 px-4 sm:px-6 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all",
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
                "flex-1 px-4 sm:px-6 py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all",
                activeTab === 'visits' 
                  ? "bg-white text-vibrant-purple shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              Kunjungan
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={exportToPDF}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-vibrant-purple text-vibrant-purple rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-vibrant-purple hover:text-white transition-all active:scale-95 whitespace-nowrap"
            >
              <FileDown size={14} /> Export PDF
            </button>
            
            <button
              onClick={() => {
                setLoading(true);
                fetchAppointments();
              }}
              disabled={loading}
              className="p-2.5 bg-white rounded-xl shadow-sm border-2 border-playful-100 hover:bg-playful-50 transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Data"
            >
              <RotateCcw size={18} className={cn("text-vibrant-purple", loading && "animate-spin")} />
            </button>

            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-sm border-2 border-playful-100 max-w-[150px] sm:max-w-none group">
              <Filter size={14} className="text-vibrant-purple shrink-0" />
              <select 
                className="bg-transparent border-none outline-none font-bold text-[10px] text-gray-700 w-full cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Status</option>
                <option value="pending">Menunggu</option>
                <option value="confirmed">Disetujui</option>
                <option value="rejected">Ditolak</option>
                <option value="rescheduled">Reschedule</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
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
              className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border-4 border-playful-200 group relative overflow-hidden h-full flex flex-col"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-lg group-hover:rotate-6 transition-transform shrink-0">
                    {apt.guest_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate">{apt.guest_name}</h3>
                    <div className="flex gap-2 items-center">
                      <p className="text-[9px] sm:text-[10px] text-vibrant-purple font-black uppercase tracking-widest truncate">
                        {(apt as any).organization || 'UMUM'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-2",
                    getStatusColor(apt.status, apt.purpose)
                  )}>
                    {getStatusIcon(apt.status, apt.purpose)}
                    <span className="truncate">
                      {apt.purpose.includes('[SELESAI]') ? 'Selesai' :
                       apt.status === 'pending' ? 'Tunggu' : 
                       apt.status === 'confirmed' ? 'Setuju' :
                       apt.status === 'completed' ? 'Selesai' : 
                       apt.status}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedApt(apt)}
                    className="p-2 text-vibrant-purple hover:bg-vibrant-purple/5 rounded-xl transition-all"
                    title="Lihat Detail"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-6 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 bg-playful-50 rounded-lg flex items-center justify-center text-vibrant-blue shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Jadwal</p>
                      <p className="text-xs sm:text-sm font-bold truncate">{apt.date ? format(new Date(apt.date), 'dd MMM yyyy', { locale: id }) : '???'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-9 h-9 bg-playful-50 rounded-lg flex items-center justify-center text-vibrant-pink shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Waktu</p>
                      <p className="text-xs sm:text-sm font-bold">{apt.time || '-'} WIB</p>
                    </div>
                  </div>
                </div>
                <div className="bg-playful-50/50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-white relative min-h-[80px]">
                  <MessageSquare size={14} className="absolute right-3 top-3 text-gray-300 opacity-30" />
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 sm:mb-2">Keperluan</p>
                  <p className="text-xs font-semibold text-gray-700 leading-relaxed line-clamp-2">
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
              <div className="p-6 sm:p-10 text-white relative">
                <button 
                  onClick={() => setSelectedApt(null)}
                  className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 h-10 w-10 sm:h-12 sm:w-12 bg-white/20 hover:bg-white/30 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white text-gray-900 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl">
                    {selectedApt.guest_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.4em] opacity-80 mb-1 sm:mb-2">Detail Data</p>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tighter leading-tight">{selectedApt.guest_name}</h2>
                    <p className="font-bold text-white/90 mt-1 sm:mt-2 text-sm sm:text-lg truncate">{(selectedApt as any).organization || 'Masyarakat Umum'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-5 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border-2 border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">Jadwal</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{selectedApt.date ? format(new Date(selectedApt.date), 'EEEE, dd MMM yyyy', { locale: id }) : '-'}</p>
                  </div>
                  <div className="p-5 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-3xl border-2 border-slate-100">
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">Waktu</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{selectedApt.time || '-'} WIB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-2 border-slate-100">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-vibrant-purple shadow-sm shrink-0">
                      <Phone size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor Telepon</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{(selectedApt as any).phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-xl sm:rounded-2xl border-2 border-slate-100">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl flex items-center justify-center text-vibrant-blue shadow-sm shrink-0">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Tujuan</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{(selectedApt as any).target_unit || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-playful-50 rounded-2xl sm:rounded-3xl border-2 border-white shadow-inner">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <MessageSquare size={14} className="text-vibrant-purple" />
                    <p className="text-[10px] font-black text-vibrant-purple uppercase tracking-widest">Keperluan</p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 font-bold leading-relaxed whitespace-pre-wrap">
                    {selectedApt.purpose}
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-10 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                <div className={cn(
                  "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-4",
                  getStatusColor(selectedApt.status, selectedApt.purpose)
                )}>
                  {getStatusIcon(selectedApt.status, selectedApt.purpose)}
                  {selectedApt.purpose.includes('[SELESAI]') ? 'Selesai' : selectedApt.status}
                </div>
                <button 
                  onClick={() => setSelectedApt(null)}
                  className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
