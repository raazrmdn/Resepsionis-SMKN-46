import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserCircle, MessageSquare, Check, X, AlertCircle, 
  Search, Sparkles, School, Calendar, Clock, ArrowRight,
  GraduationCap, FileCheck, LogOut, ArrowLeftRight, UserCheck
} from 'lucide-react';
import { supabase, type StudentDispensation } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const CLASS_LIST = [
  "X AK-1", "X AK-2", "X MP-1", "X MP-2", "X BR", "X DKV", "X PPLG",
  "XI AK-1", "XI AK-2", "XI MP", "XI BR-1", "XI BR-2", "XI DKV", "XI PPLG-1", "XI PPLG-2",
  "XII AK-1", "XII AK-2", "XII MP-1", "XII MP-2", "XII BR-1", "XII BR-2", "XII DKV", "XII PPLG"
];

export default function StudentDispensationPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState({ out: 0, returned: 0, home: 0 });
  const [history, setHistory] = useState<StudentDispensation[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    student_name: '',
    student_class: '',
    reason: '',
    granting_teacher: '',
    dispensation_type: 'back_to_school' as 'back_to_school' | 'go_home'
  });

  const fetchHistory = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('student_dispensations')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
      
      // Calculate stats
      const counts = (data || []).reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
      }, { out: 0, returned: 0, home: 0 } as any);
      setStats(counts);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Refresh history every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!profile) throw new Error('Sesi login tidak valid.');

      const { error } = await supabase
        .from('student_dispensations')
        .insert([{
          ...formData,
          status: formData.dispensation_type === 'back_to_school' ? 'out' : 'home',
          receptionist_id: profile.id
        }]);

      if (error) throw error;

      setNotification({ type: 'success', message: 'Data dispensasi berhasil disimpan!' });
      setFormData({
        student_name: '',
        student_class: '',
        reason: '',
        granting_teacher: '',
        dispensation_type: 'back_to_school'
      });
      fetchHistory();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menyimpan data.' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'returned') => {
    try {
      const { error } = await supabase
        .from('student_dispensations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setNotification({ type: 'success', message: 'Status berhasil diperbarui!' });
      fetchHistory();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal memperbarui status.' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'out': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'returned': return 'bg-vibrant-green/10 text-vibrant-green border-vibrant-green/20';
      case 'home': return 'bg-vibrant-blue/10 text-vibrant-blue border-vibrant-blue/20';
      default: return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'out': return 'Sedang Di Luar';
      case 'returned': return 'Sudah Kembali';
      case 'home': return 'Pulang';
      default: return status;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 text-vibrant-purple mb-2">
            <div className="w-10 h-10 bg-vibrant-purple/10 rounded-xl flex items-center justify-center">
              <LogOut size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em]">Student Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Dispensasi <span className="text-vibrant-purple">Siswa</span>
          </h1>
          <p className="text-gray-500 font-bold mt-4 max-w-lg">
            Pencatatan izin keluar sekolah untuk menjaga keamanan dan ketertiban lingkungan SMKN 46.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="px-6 py-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Hari Ini</p>
            <p className="text-2xl font-black text-gray-900">{history.length}</p>
          </div>
          <div className="px-6 py-4 bg-white border-2 border-amber-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Di Luar</p>
            <p className="text-2xl font-black text-amber-500">{stats.out}</p>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-12 xl:col-span-4"
        >
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border-4 border-white overflow-hidden sticky top-8">
            <div className="p-6 md:p-8 bg-gradient-to-br from-vibrant-purple to-purple-600 text-white relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4">
                <FileCheck size={80} />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-1">Input Izin Keluar</h2>
              <p className="text-purple-100 font-bold text-xs">Isi data sesuai surat izin asli.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {/* Nama Siswa */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                  <UserCircle size={14} className="text-vibrant-purple" />
                  Nama Siswa
                </label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[1.5rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                  placeholder="Nama Lengkap Siswa"
                  value={formData.student_name}
                  onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                />
              </div>

              {/* Kelas & Alasan */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                    <GraduationCap size={14} className="text-vibrant-purple" />
                    Kelas
                  </label>
                  <select 
                    required
                    className={cn(
                      "w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[1.5rem] outline-none transition-all font-black appearance-none text-sm",
                      formData.student_class === "" ? "text-gray-300" : "text-gray-900"
                    )}
                    value={formData.student_class}
                    onChange={(e) => setFormData({...formData, student_class: e.target.value})}
                  >
                    <option value="" className="text-gray-300">KELAS</option>
                    {CLASS_LIST.map((cls) => (
                      <option key={cls} value={cls} className="text-gray-900">{cls}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                    <UserCheck size={14} className="text-vibrant-purple" />
                    Pemberi Izin
                  </label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[1.5rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                    placeholder="Nama Guru"
                    value={formData.granting_teacher}
                    onChange={(e) => setFormData({...formData, granting_teacher: e.target.value})}
                  />
                </div>
              </div>

              {/* Jenis Izin */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                  <ArrowLeftRight size={14} className="text-vibrant-purple" />
                  Jenis Dispensasi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, dispensation_type: 'back_to_school'})}
                    className={cn(
                      "px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border-4",
                      formData.dispensation_type === 'back_to_school' 
                        ? "bg-vibrant-purple text-white border-vibrant-purple shadow-lg shadow-vibrant-purple/10" 
                        : "bg-playful-50 text-gray-400 border-transparent hover:bg-playful-100"
                    )}
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, dispensation_type: 'go_home'})}
                    className={cn(
                      "px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border-4",
                      formData.dispensation_type === 'go_home' 
                        ? "bg-vibrant-blue text-white border-vibrant-blue shadow-lg shadow-vibrant-blue/10" 
                        : "bg-playful-50 text-gray-400 border-transparent hover:bg-playful-100"
                    )}
                  >
                    Izin Pulang
                  </button>
                </div>
              </div>

              {/* Alasan */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                  <MessageSquare size={14} className="text-vibrant-purple" />
                  Alasan Keluar
                </label>
                <textarea 
                  required
                  className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[1.5rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm h-24 resize-none"
                  placeholder="Alasan Izin..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-vibrant-purple text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={24} />
                    SIMPAN DATA
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* History Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-12 xl:col-span-8"
        >
          <div className="bg-white rounded-[2.5rem] border-4 border-white shadow-lg overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-6 border-b-2 border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Riwayat Izin Hari Ini</h3>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Data Realtime SMKN 46</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-playful-50 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-vibrant-green animate-pulse"></div>
                <span className="text-[9px] font-black text-vibrant-green uppercase tracking-widest">Live Updates</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
              {initialLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                  <div className="w-10 h-10 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Memuat Data...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-playful-50 rounded-[1.5rem] flex items-center justify-center text-gray-200">
                    <Users size={32} />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 mb-1 uppercase tracking-tight">Belum Ada Data</p>
                    <p className="text-gray-400 font-bold text-xs">Belum ada siswa yang izin keluar.</p>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-1 gap-3">
                  {history.map((item, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.id}
                      className="group p-4 rounded-[1.5rem] border-4 border-playful-50 hover:border-vibrant-purple/10 transition-all bg-white hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br shadow-md group-hover:scale-105 transition-transform",
                            item.dispensation_type === 'back_to_school' ? "from-vibrant-purple to-purple-400" : "from-vibrant-blue to-blue-400"
                          )}>
                             <span className="text-white text-[8px] font-black mb-0.5 opacity-80">{item.student_class}</span>
                             <GraduationCap className="text-white" size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-gray-900 group-hover:text-vibrant-purple transition-colors truncate max-w-[150px] md:max-w-none">{item.student_name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={10} /> {format(new Date(item.created_at), 'HH:mm')}
                              </span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">•</span>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[100px]">{item.reason}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className={cn(
                              "px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2",
                              getStatusBadge(item.status)
                            )}>
                              {getStatusLabel(item.status)}
                            </span>
                            {item.updated_at && item.status === 'returned' && (
                              <p className="text-[8px] font-black text-gray-300 uppercase mt-1">
                                KEMBALI: {format(new Date(item.updated_at), 'HH:mm')}
                              </p>
                            )}
                          </div>
                          
                          {item.status === 'out' && (
                            <button
                              onClick={() => updateStatus(item.id, 'returned')}
                              className="w-8 h-8 flex items-center justify-center bg-vibrant-green text-white rounded-lg shadow-lg shadow-vibrant-green/20 hover:scale-110 active:scale-95 transition-all"
                              title="Tandai Siswa Kembali"
                            >
                              <Check size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={cn(
              "fixed top-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-[100] border-4 border-white/20 backdrop-blur-md",
              notification.type === 'success' ? "bg-vibrant-green text-white" : "bg-red-500 text-white"
            )}
          >
            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-black text-xs uppercase tracking-widest">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
