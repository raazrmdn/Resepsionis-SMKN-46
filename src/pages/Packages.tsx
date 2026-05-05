import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package as PackageIcon, Plus, Search, User, Truck, CheckCircle2, Clock, MoreVertical, Bell, Sparkles } from 'lucide-react';
import { supabase, type Package, type Profile } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Packages() {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [personnel, setPersonnel] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    recipient_category: '',
    recipient_id: '',
    recipient_class: '',
    recipient_name_manual: '',
    sender_name: '',
    description: ''
  });

  const CLASSES = [
    'X AKL 1', 'X AKL 2', 'X MPLB 1', 'X MPLB 2', 'X BR 1', 'X BR 2', 'X DKV', 'X PPLG',
    'XI AKL 1', 'XI AKL 2', 'XI MPLB', 'XI BR 1', 'XI BR 2', 'XI DKV', 'XI PPLG 1', 'XI PPLG 2',
    'XII AKL 1', 'XII AKL 2', 'XII MP 1', 'XII MP 2', 'XII BR 1', 'XII BR 2', 'XII DKV', 'XII PPLG'
  ];

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    fetchPackages();
    fetchPersonnel();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:packages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packages' }, () => {
        fetchPackages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  async function fetchPersonnel() {
    const { data } = await supabase.from('profiles').select('*').in('role', ['teacher', 'admin', 'staff', 'student']);
    setPersonnel(data || []);
  }

  async function fetchPackages() {
    try {
      let query = supabase
        .from('packages')
        .select('*')
        .order('received_at', { ascending: false });

      if (profile?.role === 'teacher') {
        query = query.eq('recipient_id', profile.id);
      } else if (profile?.role === 'guest') {
        query = query.eq('receptionist_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsTaken(id: string) {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ 
          status: 'taken',
          taken_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      fetchPackages();
    } catch (error) {
      console.error('Error updating package status:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!profile) throw new Error('Sesi login tidak valid.');
      if (!formData.recipient_category) throw new Error('Silakan pilih kategori penerima.');

      // Final recipient name for display/logging if not in profiles
      const selectedPerson = personnel.find(p => p.id === formData.recipient_id);
      const finalDescription = formData.recipient_name_manual 
        ? `[Tujuan: ${formData.recipient_name_manual}] - ${formData.description}` 
        : formData.description;

      const newPackage = { 
        recipient_id: (formData.recipient_id && formData.recipient_id !== 'manual') ? formData.recipient_id : null,
        recipient_class: formData.recipient_class || null,
        sender_name: formData.sender_name,
        description: finalDescription,
        status: 'received' as const,
        received_at: new Date().toISOString(),
        receptionist_id: profile.id 
      };

      const { data: insertedData, error } = await supabase
        .from('packages')
        .insert([newPackage])
        .select();

      if (error) throw error;

      if (insertedData && insertedData[0]) {
        setPackages(prev => [insertedData[0], ...prev]);
      } else {
        fetchPackages();
      }

      setShowModal(false);
      setFormData({ 
        recipient_category: '',
        recipient_id: '', 
        recipient_class: '', 
        recipient_name_manual: '',
        sender_name: '', 
        description: '' 
      });
      setNotification({ type: 'success', message: 'Data barang masuk berhasil disimpan! 📦' });
    } catch (error: any) {
      console.error('Save error:', error);
      setNotification({ type: 'error', message: 'Gagal menyimpan: ' + (error.message || 'Error sistem.') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
            {profile?.role === 'teacher' ? (
              <>Notifikasi <span className="text-vibrant-blue">Barang & Surat</span></>
            ) : (
              <>Log <span className="text-vibrant-blue">Barang & Surat</span></>
            )}
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            {profile?.role === 'teacher' ? 'Daftar paket dan dokumen yang dititipkan untuk Anda' : 'Catat dan pantau paket/dokumen yang masuk ke sekolah'}
          </p>
        </div>
        {profile?.role !== 'teacher' && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-3 text-sm shadow-vibrant-purple/20 shadow-xl"
          >
            <Plus size={20} />
            INPUT BARANG MASUK
          </button>
        )}
      </div>

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-xl px-4 pointer-events-none">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={cn(
                "p-6 rounded-[2rem] border-4 flex items-center gap-4 font-black text-sm uppercase tracking-widest shadow-2xl pointer-events-auto backdrop-blur-md",
                notification.type === 'success' ? "bg-vibrant-blue text-white" : "bg-red-500 text-white"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-12 h-12 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : packages.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] shadow-xl border-4 border-white text-center text-gray-400 font-bold text-xl">
            Belum ada paket atau surat yang tercatat. 📦
          </div>
        ) : (
          packages.map((pkg, i) => (
            <motion.div 
              key={pkg.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10, rotate: 1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-playful-200 relative overflow-hidden group"
            >
              <div className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500",
                pkg.status === 'received' ? "bg-vibrant-yellow" : "bg-vibrant-green"
              )}></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={cn(
                  "p-4 rounded-2xl shadow-lg text-white",
                  pkg.status === 'received' ? "bg-vibrant-yellow" : "bg-vibrant-green"
                )}>
                  <PackageIcon size={28} />
                </div>
                <div className="flex items-center gap-2">
                  {pkg.status === 'received' ? (
                    <span className="flex items-center gap-2 bg-vibrant-yellow/10 text-vibrant-yellow px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-vibrant-yellow/10">
                      <Clock size={12} /> Belum Diambil
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-vibrant-green/10">
                      <CheckCircle2 size={12} /> Sudah Diambil
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1">Penerima</p>
                  <p className="text-xl font-black text-gray-900 tracking-tight">
                    {personnel.find(p => p.id === pkg.recipient_id)?.full_name || 'Penerima Manual/Umum'}
                    {pkg.recipient_class && <span className="text-vibrant-purple ml-2 text-sm">({pkg.recipient_class})</span>}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1">Pengirim / Kurir</p>
                  <p className="text-gray-700 font-bold flex items-center gap-2">
                    <Truck size={16} className="text-vibrant-blue" />
                    {pkg.sender_name}
                  </p>
                </div>
                <div className="bg-playful-50/50 p-4 rounded-2xl border-2 border-white">
                  <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-1">Deskripsi</p>
                  <p className="text-gray-600 text-sm font-medium line-clamp-2 italic">"{pkg.description}"</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-playful-50 flex justify-between items-center relative z-10">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <p>IN: {format(new Date(pkg.received_at), 'dd/MM, HH:mm')}</p>
                  {pkg.taken_at && <p className="text-vibrant-green">OUT: {format(new Date(pkg.taken_at), 'dd/MM, HH:mm')}</p>}
                </div>
                {profile?.role !== 'teacher' && pkg.status === 'received' && (
                  <button 
                    onClick={() => handleMarkAsTaken(pkg.id)}
                    className="px-4 py-2 bg-vibrant-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-vibrant-blue/20 hover:scale-105 transition-transform"
                  >
                    Selesai
                  </button>
                )}
                {profile?.role === 'teacher' && pkg.status === 'received' && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-vibrant-pink animate-bounce">
                    <Bell size={14} /> SEGERA AMBIL
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Input Barang */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden border-8 border-white"
            >
              <div className="p-10 bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-3xl font-black tracking-tight uppercase">Input Barang Masuk</h3>
                <p className="text-white/70 font-bold mt-2">Catat penitipan barang/surat</p>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Category Selection */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Kategori Penerima</label>
                  <select 
                    required
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900 appearance-none"
                    value={formData.recipient_category}
                    onChange={(e) => setFormData({
                      ...formData, 
                      recipient_category: e.target.value,
                      recipient_id: '',
                      recipient_class: '',
                      recipient_name_manual: ''
                    })}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    <option value="Guru">GURU</option>
                    <option value="Staff">STAFF / KARYAWAN</option>
                    <option value="Siswa">SISWA</option>
                    <option value="Lainnya">LAINNYA / MANUAL</option>
                  </select>
                </div>

                {/* Class Selection for Students */}
                {formData.recipient_category === 'Siswa' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Pilih Kelas</label>
                    <select 
                      required
                      className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900 appearance-none"
                      value={formData.recipient_class}
                      onChange={(e) => setFormData({...formData, recipient_class: e.target.value})}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {CLASSES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </motion.div>
                )}

                {/* Name Dropdown / Manual Input */}
                {formData.recipient_category && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                      {formData.recipient_category === 'Lainnya' || formData.recipient_category === 'Staff' ? 'Nama Penerima' : 'Pilih Nama'}
                    </label>
                    {formData.recipient_category === 'Guru' || formData.recipient_category === 'Siswa' ? (
                      <select 
                        required
                        className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900 appearance-none"
                        value={formData.recipient_id}
                        onChange={(e) => setFormData({...formData, recipient_id: e.target.value, recipient_name_manual: ''})}
                      >
                        <option value="">-- Pilih Nama --</option>
                        {personnel
                          .filter(p => {
                            if (formData.recipient_category === 'Guru') return p.role === 'teacher';
                            if (formData.recipient_category === 'Siswa') return p.role === 'student';
                            return false;
                          })
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.full_name}</option>
                          ))
                        }
                        <option value="manual">-- KETIK MANUAL --</option>
                      </select>
                    ) : (
                      <input 
                        type="text" required
                        className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900"
                        placeholder="Nama Lengkap Penerima"
                        value={formData.recipient_name_manual}
                        onChange={(e) => setFormData({...formData, recipient_name_manual: e.target.value, recipient_id: ''})}
                      />
                    )}
                  </motion.div>
                )}

                {/* Conditional Manual Name especially for Students or Teachers not in list */}
                {(formData.recipient_id === 'manual') && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 bg-playful-50 border-4 border-vibrant-blue/20 rounded-2xl outline-none transition-all font-bold text-gray-900"
                      placeholder="Masukkan Nama Lengkap Di Sini..."
                      value={formData.recipient_name_manual}
                      onChange={(e) => setFormData({...formData, recipient_name_manual: e.target.value})}
                    />
                  </motion.div>
                )}

                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Nama Pengirim / Kurir</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900"
                    placeholder="Contoh: JNE / Bpk. Budi"
                    value={formData.sender_name}
                    onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Deskripsi Barang / Surat</label>
                  <textarea 
                    required rows={3}
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900"
                    placeholder="Contoh: Paket coklat ukuran sedang..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 bg-gray-50 rounded-2xl font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all">Batal</button>
                  <button type="submit" disabled={loading} className="flex-1 btn-primary py-5 disabled:opacity-50 shadow-xl shadow-vibrant-blue/20 bg-vibrant-blue">SIMPAN DATA</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
