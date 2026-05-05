import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, User, MessageSquare, Sparkles, MapPin, Phone, Mail, Search, Plus } from 'lucide-react';
import { supabase, type Profile } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

export default function PublicAppointment() {
  const { profile } = useAuth();
  const [personnel, setPersonnel] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
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

  const CLASSES = [
    'X AKL 1', 'X AKL 2', 'X MPLB 1', 'X MPLB 2', 'X BR 1', 'X BR 2', 'X DKV', 'X PPLG',
    'XI AKL 1', 'XI AKL 2', 'XI MPLB', 'XI BR 1', 'XI BR 2', 'XI DKV', 'XI PPLG 1', 'XI PPLG 2',
    'XII AKL 1', 'XII AKL 2', 'XII MP 1', 'XII MP 2', 'XII BR 1', 'XII BR 2', 'XII DKV', 'XII PPLG'
  ];

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function fetchPersonnel() {
    try {
      const { data } = await supabase.from('profiles').select('*').in('role', ['teacher', 'admin', 'staff', 'student']);
      setPersonnel(data || []);
    } catch (err) {
      console.error('Fetch personnel error:', err);
    } finally {
      setInitialLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.target_category) throw new Error('Silakan pilih kategori tujuan.');

      const isManual = formData.teacher_id === 'manual' || !formData.teacher_id;
      const selectedTeacher = isManual ? null : personnel.find(p => p.id === formData.teacher_id);
      const displayTargetName = selectedTeacher ? selectedTeacher.full_name : formData.target_name;
      
      const categoryLabel = formData.target_class ? `${formData.target_category} (${formData.target_class})` : formData.target_category;
      const fullPurpose = `[${categoryLabel}: ${displayTargetName}] - ${formData.purpose}`;
      
      // Save to appointments table
      let insertPayload: any = { 
        guest_name: formData.guest_name,
        teacher_id: selectedTeacher ? selectedTeacher.id : null, 
        date: formData.date,
        time: formData.time,
        purpose: fullPurpose,
        status: 'pending',
        receptionist_id: profile?.id || null
      };

      const { error: aptError } = await supabase
        .from('appointments')
        .insert([{ 
          ...insertPayload,
          phone: formData.phone || '-',
          organization: formData.organization || 'Pribadi'
        }]);

      if (aptError) {
        if (aptError.message.includes('column')) {
          console.warn('Fallback: DB columns missing. Inserting minimal data.');
          const { error: fallbackError } = await supabase
            .from('appointments')
            .insert([{
              guest_name: formData.guest_name,
              teacher_id: (formData.teacher_id && formData.teacher_id !== 'manual') ? formData.teacher_id : null, 
              date: formData.date,
              time: formData.time,
              purpose: fullPurpose,
              status: 'pending',
              receptionist_id: profile?.id || null
            }]);
          if (fallbackError) throw fallbackError;
        } else {
          throw aptError;
        }
      }

      // Also log to guests table
      const { error: guestError } = await supabase
        .from('guests')
        .insert([{
          name: formData.guest_name,
          organization: formData.organization || '-',
          purpose: fullPurpose,
          phone: formData.phone || '-', 
          receptionist_id: profile?.id || null
        }]);

      if (guestError) console.warn('History log error:', guestError);

      setIsSuccess(true);
    } catch (error: any) {
      console.error('Submit error:', error);
      setNotification({ type: 'error', message: 'Gagal mendaftar: ' + (error.message || 'Error sistem.') });
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-playful-50">
        <div className="w-12 h-12 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-playful-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border-8 border-playful-200 max-w-lg w-full"
        >
          <div className="w-16 h-16 md:w-24 md:h-24 bg-green-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-white mx-auto mb-6 md:mb-8 shadow-lg shadow-green-200 rotate-6">
            <Sparkles size={32} className="md:hidden" />
            <Sparkles size={48} className="hidden md:block" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase mb-4">Berhasil!</h2>
          <p className="text-gray-500 font-bold mb-8 md:mb-10 leading-relaxed text-sm md:text-base">
            Janji temu Anda telah berhasil didaftarkan. Silakan lapor ke petugas keamanan atau resepsionis saat tiba di SMKN 46 Jakarta.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full btn-primary py-5 text-lg"
          >
            ISI FORMULIR LAGI
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-playful-50 pb-20">
      {/* Public Header */}
      <nav className="bg-white border-b-4 border-playful-100 py-6 px-4 mb-10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-vibrant-purple rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md rotate-3">
              46
            </div>
            <div>
              <h1 className="text-gray-900 font-black text-xs tracking-tighter uppercase leading-none">SMKN 46 JAKARTA</h1>
              <p className="text-vibrant-purple text-[8px] uppercase font-black tracking-widest mt-1">Layanan Tamu Mandiri</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase mb-4">Input <span className="text-vibrant-purple">Janji Temu</span></h1>
          <p className="text-gray-500 font-bold">Lengkapi formulir di bawah untuk mendaftarkan jadwal kunjungan Anda.</p>
        </div>

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 pointer-events-none">
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border-8 border-playful-200 overflow-hidden shadow-vibrant-purple/5"
        >
          <div className="p-8 md:p-10 bg-gradient-to-br from-vibrant-purple to-vibrant-pink text-white relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <CalendarIcon size={28} className="md:hidden" />
                <CalendarIcon size={32} className="hidden md:block" />
              </div>
              <div>
                <h3 className="text-xl md:text-3xl font-black tracking-tight uppercase">Formulir Tamu</h3>
                <p className="text-white/70 font-bold text-xs md:text-sm">Silakan isi data diri dengan benar</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-8 md:space-y-10">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                  <User size={14} className="text-vibrant-purple" />
                  Nama Lengkap
                </label>
                <input 
                  type="text" required
                  className="w-full px-8 py-5 bg-playful-50 border-4 border-playful-100 focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                  placeholder="Siapa nama Anda?"
                  value={formData.guest_name}
                  onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                  <Search size={14} className="text-vibrant-pink" />
                  Instansi / Organisasi
                </label>
                <input 
                  type="text"
                  className="w-full px-8 py-5 bg-playful-50 border-4 border-playful-100 focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-100 placeholder:text-gray-300"
                  placeholder="Ex: Pribadi, Wali Murid, atau PT. ABC"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                  <Phone size={14} className="text-vibrant-purple" />
                  Nomor HP (WhatsApp)
                </label>
                <input 
                  type="tel" required
                  className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                  placeholder="08xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                  <Sparkles size={14} className="text-vibrant-blue" />
                  Kategori Tujuan
                </label>
                <select 
                  required
                  className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none"
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
            </div>

            {(formData.target_category) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid md:grid-cols-2 gap-10"
              >
                {formData.target_category === 'Siswa' && (
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                      <Search size={14} className="text-vibrant-pink" />
                      Kelas Siswa
                    </label>
                    <select 
                      required
                      className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none"
                      value={formData.target_class}
                      onChange={(e) => setFormData({...formData, target_class: e.target.value})}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {CLASSES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                    <User size={14} className="text-vibrant-blue" />
                    {formData.target_category === 'Guru' ? 'Pilih Guru / Ketik Manual' : formData.target_category === 'Siswa' ? 'Nama Siswa/Siswi' : 'Nama Personil'}
                  </label>
                  
                  {formData.target_category === 'Guru' ? (
                    <div className="space-y-4">
                      <select 
                        className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 appearance-none"
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
                          className="w-full px-8 py-5 bg-playful-50 border-4 border-vibrant-purple/20 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                          placeholder="Ketik Nama Guru secara manual..."
                          value={formData.target_name}
                          onChange={(e) => setFormData({...formData, target_name: e.target.value})}
                        />
                      )}
                    </div>
                  ) : (
                    <input 
                      type="text" required
                      className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                      placeholder={formData.target_category === 'Siswa' ? "Nama Lengkap Siswa..." : "Nama Lengkap Personil..."}
                      value={formData.target_name}
                      onChange={(e) => setFormData({...formData, target_name: e.target.value, teacher_id: ''})}
                    />
                  )}
                </div>
              </motion.div>
            )}

            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-[0.2em]">
                  <CalendarIcon size={14} className="text-vibrant-purple" />
                  Tanggal Kedatangan
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
                  Estimasi Waktu
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
                Detail Keperluan
              </label>
              <textarea 
                required rows={4}
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
                placeholder="Apa keperluan Anda berkunjung?"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              ></textarea>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full btn-primary py-6 text-xl shadow-2xl flex items-center justify-center gap-4 group"
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

        {/* Public Footer */}
        <div className="mt-16 text-center space-y-6">
          <div className="flex justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Cipinang Pulo, Jakarta</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">(021) 8195127</span>
            </div>
          </div>
          <p className="text-gray-300 font-black text-[10px] uppercase tracking-[0.4em]">
            © 2026 SMKN 46 JAKARTA | PPLG Development
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
