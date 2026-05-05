import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, User, MessageSquare, Check, X, AlertCircle, Plus, Search, Sparkles } from 'lucide-react';
import { supabase, type Appointment, type Profile } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Appointments() {
  const { profile } = useAuth();
  const [personnel, setPersonnel] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    guest_name: '',
    organization: '',
    phone: '',
    target_category: '', // Changed to empty default
    target_class: '',    // Added class selection for students
    target_name: '',        // Manual name input
    teacher_id: '',         // Registered teacher ID
    date: '',
    time: '',
    purpose: ''
  });

  const CLASSES = [
    'X AKL 1', 'X AKL 2', 'X MPLB 1', 'X MPLB 2', 'X BR 1', 'X BR 2', 'X DKV', 'X PPLG',
    'XI AKL 1', 'XI AKL 2', 'XI MPLB', 'XI BR 1', 'XI BR 2', 'XI DKV', 'XI PPLG 1', 'XI PPLG 2',
    'XII AKL 1', 'XII AKL 2', 'XII MP 1', 'XII MP 2', 'XII BR 1', 'XII BR 2', 'XII DKV', 'XII PPLG'
  ];

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  async function fetchPersonnel() {
    try {
      const { data } = await supabase.from('profiles').select('*').in('role', ['teacher', 'admin', 'staff', 'student']);
      setPersonnel(data || []);
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!profile) throw new Error('Sesi login tidak valid.');
      if (!formData.target_category) throw new Error('Silakan pilih kategori tujuan.');

      // Determination: Is it a registered teacher or manual entry?
      const isManual = formData.teacher_id === 'manual' || !formData.teacher_id;
      const selectedTeacher = isManual ? null : personnel.find(p => p.id === formData.teacher_id);
      const displayTargetName = selectedTeacher ? selectedTeacher.full_name : formData.target_name;
      
      const categoryLabel = formData.target_class ? `${formData.target_category} (${formData.target_class})` : formData.target_category;
      const fullPurpose = `[${categoryLabel}: ${displayTargetName}] - ${formData.purpose}`;
      
      // 1. Save to appointments table
      let insertPayload: any = { 
        guest_name: formData.guest_name,
        teacher_id: selectedTeacher ? selectedTeacher.id : null, 
        date: formData.date,
        time: formData.time,
        purpose: fullPurpose,
        status: 'pending',
        receptionist_id: profile.id
      };

      // Try adding organization/phone, but allow fallback if columns don't exist yet
      const { data: aptData, error: aptError } = await supabase
        .from('appointments')
        .insert([{ 
          ...insertPayload,
          phone: formData.phone || '-',
          organization: formData.organization || 'Pribadi'
        }])
        .select();

      if (aptError) {
        // Fallback for older database schemas (missing organization, phone, or receptionist_id)
        if (aptError.message.includes('column')) {
          console.warn('Fallback: Some DB columns missing. Attempting minimal insert.');
          
          // Create a minimal version of the payload
          const minimalPayload = {
            guest_name: formData.guest_name,
            teacher_id: (formData.teacher_id && formData.teacher_id !== 'manual') ? formData.teacher_id : null,
            date: formData.date,
            time: formData.time,
            purpose: fullPurpose,
            status: 'pending',
            receptionist_id: profile.id
          };

          const { error: fallbackError } = await supabase
            .from('appointments')
            .insert([minimalPayload]);
          
          if (fallbackError) throw fallbackError;
        } else {
          throw aptError;
        }
      }

      // 2. Also log to guests table as history
      const { error: guestError } = await supabase
        .from('guests')
        .insert([{
          name: formData.guest_name,
          organization: formData.organization || '-',
          purpose: fullPurpose,
          phone: formData.phone || '-', 
          receptionist_id: profile.id
        }]);

      if (guestError) throw guestError;

      setFormData({ 
        guest_name: '', 
        organization: '', 
        phone: '',
        target_category: '',
        target_class: '',
        target_name: '',
        teacher_id: '',
        date: '', 
        time: '', 
        purpose: '' 
      });
      setNotification({ type: 'success', message: 'Janji temu berhasil didaftarkan dan tercatat di Buku Tamu! 📅' });
    } catch (error: any) {
      console.error('Submit error:', error);
      setNotification({ type: 'error', message: 'Gagal mendaftar: ' + (error.message || 'Error sistem.') });
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-12 text-center px-4">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase mb-4">Input <span className="text-vibrant-purple">Janji Temu</span></h1>
        <p className="text-gray-500 font-bold mb-6 text-sm md:text-base">Silakan isi formulir di bawah untuk mendaftarkan jadwal pertemuan tamu.</p>
        
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-white border-4 border-dashed border-playful-200 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-playful-100 rounded-xl flex items-center justify-center text-vibrant-purple">
            <Search size={20} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link Untuk QR Code Janji Temu (Gunakan Untuk Guest)</p>
            <p className="font-mono text-xs font-bold text-vibrant-purple break-all text-left">
              {window.location.origin}/public/appointment
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/public/appointment`);
            setNotification({ type: 'success', message: 'Link public berhasil disalin! 📋' });
          }}
          className="px-6 py-3 bg-playful-100 hover:bg-vibrant-purple hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 text-vibrant-purple"
        >
          Salin Link Public
        </button>
      </motion.div>
      </div>

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 pointer-events-none">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -50 }}
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

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] shadow-2xl border-8 border-playful-200 overflow-hidden"
      >
        <div className="p-8 md:p-12 bg-gradient-to-br from-vibrant-purple to-vibrant-pink text-white relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <CalendarIcon size={28} className="md:hidden" />
              <CalendarIcon size={32} className="hidden md:block" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Data Kunjungan</h3>
              <p className="text-white/70 font-bold text-xs md:text-base">Formulir pendaftaran tamu & janji temu</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-8 md:space-y-10">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <User size={14} className="text-vibrant-purple" />
                Nama Tamu
              </label>
              <input 
                type="text" required
                className="w-full px-6 md:px-8 py-4 md:py-5 bg-playful-50 border-4 border-playful-100 focus:border-vibrant-purple/10 rounded-[1.5rem] md:rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm md:text-base"
                placeholder="Nama Lengkap Tamu"
                value={formData.guest_name}
                onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                <Search size={14} className="text-vibrant-pink" />
                Umum / Instansi
              </label>
              <input 
                type="text"
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                placeholder="Ex: Pribadi, PT. Sejahtera, atau Sekolah Lain"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                <Plus size={14} className="text-vibrant-purple" />
                Nomor Telepon
              </label>
              <input 
                type="tel"
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                placeholder="0812xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                  <Sparkles size={14} className="text-vibrant-blue" />
                  Target / Orang yang Dituju
                </label>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Category Dropdown */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Kategori</p>
                    <select 
                      className="w-full px-6 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none text-sm"
                      value={formData.target_category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setFormData({
                          ...formData, 
                          target_category: cat,
                          target_class: '',
                          teacher_id: '',
                          target_name: ''
                        });
                      }}
                    >
                      <option value="">-- Pilih Kategori --</option>
                      <option value="Guru">GURU</option>
                      <option value="Staff">STAFF / KARYAWAN</option>
                      <option value="Siswa">SISWA</option>
                      <option value="Lainnya">LAINNYA / MANUAL</option>
                    </select>
                  </div>

                  {/* Class Dropdown for Students */}
                  {formData.target_category === 'Siswa' && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-2"
                    >
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Pilih Kelas</p>
                      <select 
                        required
                        className="w-full px-6 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none text-sm"
                        value={formData.target_class}
                        onChange={(e) => setFormData({...formData, target_class: e.target.value})}
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {CLASSES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {/* Person Selection / Manual Input */}
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                       {formData.target_category === 'Guru' ? 'Pilih Guru / Ketik Manual' : formData.target_category === 'Siswa' ? 'Nama Siswa/Siswi' : 'Nama Personil'}
                     </p>
                     
                     {!formData.target_category ? (
                        <div className="w-full px-6 py-5 bg-gray-50 border-4 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-bold text-sm italic flex items-center justify-center">
                          Pilih Kategori Dahulu
                        </div>
                     ) : formData.target_category === 'Guru' ? (
                       <div className="space-y-3">
                         <select 
                           className="w-full px-6 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none text-sm"
                           value={formData.teacher_id}
                           onChange={(e) => {
                             const val = e.target.value;
                             const selected = personnel.find(p => p.id === val);
                             if (val === 'manual') {
                               setFormData({...formData, teacher_id: 'manual', target_name: ''});
                             } else if (selected) {
                               setFormData({...formData, teacher_id: val, target_name: selected.full_name});
                             } else {
                               setFormData({...formData, teacher_id: '', target_name: ''});
                             }
                           }}
                         >
                           <option value="">-- Pilih Nama Guru --</option>
                           {personnel
                             .filter(p => p.role === 'teacher')
                             .map(p => (
                               <option key={p.id} value={p.id}>{p.full_name}</option>
                             ))
                           }
                           <option value="manual">-- KETIK MANUAL --</option>
                         </select>

                         {(formData.teacher_id === 'manual') && (
                           <motion.input 
                             initial={{ opacity: 0, y: -10 }}
                             animate={{ opacity: 1, y: 0 }}
                             type="text" required
                             className="w-full px-8 py-5 bg-playful-50 border-4 border-vibrant-purple/20 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                             placeholder="Ketik Nama Guru secara manual..."
                             value={formData.target_name}
                             onChange={(e) => setFormData({...formData, target_name: e.target.value})}
                           />
                         )}
                       </div>
                     ) : (
                       <input 
                         type="text" required
                         className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                         placeholder={formData.target_category === 'Siswa' ? "Nama Lengkap Siswa..." : "Nama Lengkap Personil..."}
                         value={formData.target_name}
                         onChange={(e) => setFormData({...formData, target_name: e.target.value, teacher_id: ''})}
                       />
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                <CalendarIcon size={14} className="text-vibrant-purple" />
                Tanggal
              </label>
              <input 
                type="date" required
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                <Clock size={14} className="text-vibrant-blue" />
                Waktu
              </label>
              <input 
                type="time" required
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
              <MessageSquare size={14} className="text-vibrant-pink" />
              Keperluan / Pesan
            </label>
            <textarea 
              required rows={4}
              className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
              placeholder="Berikan alasan atau detail kunjungan..."
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
            ></textarea>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full btn-primary py-6 text-xl shadow-2xl shadow-vibrant-purple/20 flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                  <span>AJUKAN JANJI TEMU</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
