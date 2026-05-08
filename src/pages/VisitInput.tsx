import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, UserCircle, Users, MessageSquare, Check, X, AlertCircle, Plus, Search, Sparkles, Building, Phone, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { supabase, type Profile } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

const WALI_KELAS_LIST = [
  "(X AK-1) Aji Rachmad Sucianto, S.Pd.",
  "(X AK-2) Yeyeh Komariyah, S.Pd.I.",
  "(X MP-1) Bashir Rahadi, S.Pd.",
  "(X MP-2) Rosalia Windarti, S.Pd.",
  "(X BR) Cahaya Apriska Ike Puri, S.Pd.",
  "(X DKV) Kusdi Handoko, S.Kom.",
  "(X PPLG) Asep Ahmad F, S.Pd.",
  "(XI AK-1) Desrini Rahayu Harahap, S.Pd.",
  "(XI AK-2) Siti Rahayu, S.E.",
  "(XI MP) Sumiatun, S.Pd.",
  "(XI BR-1) Endah Pratiwi Supriani, S.Ap.",
  "(XI BR-2) Ade Komaria, S.Pd.",
  "(XI DKV) Muhammad Riyadi, S.Sn.",
  "(XI PPLG-1) rna Dian Rahmawati, S.S.",
  "(XI PPLG-2) Kiki Oliviari Putri, S.Pd.",
  "(XII AK-1) Sunanti Sanuji, M.Pd.",
  "(XII AK-2) AP. Widiastuti, S.E.",
  "(XII MP-1) Yulia Fatma, S.Pd.",
  "(XII MP-2) Ipung Purwani, S.Pd.",
  "(XII BR-1) Giusti Murah Sulanjari, S.Pd.",
  "(XII BR-2) Arief Nurmansyah, S.E.",
  "(XII DKV) Nugraha Brahmana Putra, S.Sn.",
  "(XII PPLG) Kusnadi, S.Kom.",
];

const CLASS_LIST = [
  "X AK-1", "X AK-2", "X MP-1", "X MP-2", "X BR", "X DKV", "X PPLG",
  "XI AK-1", "XI AK-2", "XI MP", "XI BR-1", "XI BR-2", "XI DKV", "XI PPLG-1", "XI PPLG-2",
  "XII AK-1", "XII AK-2", "XII MP-1", "XII MP-2", "XII BR-1", "XII BR-2", "XII DKV", "XII PPLG"
];

export default function VisitInput() {
  const { profile } = useAuth();
  const [personnel, setPersonnel] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [targetClass, setTargetClass] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    organization: '',
    visitor_name: '',
    visitor_count: '1',
    phone: '',
    target_unit: '',    // Bidang / Unit yang dituju
    target_person: '',  // Nama orang yang dituju (manual input)
    date: new Date().toISOString().split('T')[0],
    time: '',
    purpose: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

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

      const displayTarget = formData.target_unit === 'Peserta Didik' 
        ? `${targetClass} - ${formData.target_person}` 
        : formData.target_person;

      const fullPurpose = `[KUNJUNGAN RESMI: ${formData.organization}] (${formData.visitor_count} Orang) - Menuju ${formData.target_unit}: ${displayTarget}. Pesan: ${formData.purpose}`;
      
      // 1. Save to appointments table (as a 'completed' visit record automatically if it's currently happening)
      // Or just keep as 'pending' if it's a future visit. 
      // For visit-input (usually at reception), we might want to mark it as 'completed' or 'arrived'.
      const { error: aptError } = await supabase
        .from('appointments')
        .insert([{ 
          guest_name: formData.visitor_name,
          organization: formData.organization,
          phone: formData.phone || '-',
          date: formData.date,
          time: formData.time,
          purpose: fullPurpose,
          status: 'confirmed', // Gunakan confirmed dulu agar tidak kena error check constraint lama
          receptionist_id: profile.id
        }]);

      if (aptError) throw aptError;

      // 2. Also log to guests table for the Guestbook/History
      const { error: guestError } = await supabase
        .from('guests')
        .insert([{
          name: formData.visitor_name,
          organization: formData.organization,
          purpose: fullPurpose,
          phone: formData.phone || '-',
          receptionist_id: profile.id
        }]);

      if (guestError) throw guestError;

      setFormData({ 
        organization: '',
        visitor_name: '',
        visitor_count: '1',
        phone: '',
        target_unit: '',
        target_person: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        purpose: ''
      });
      setNotification({ type: 'success', message: 'Kunjungan resmi berhasil dicatat ke sistem! 🏛️' });
    } catch (error: any) {
      console.error('Submit error:', error);
      setNotification({ type: 'error', message: 'Gagal mencatat: ' + (error.message || 'Error sistem.') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
      <div className="mb-8 sm:mb-12 text-center px-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2 sm:mb-4 leading-tight">
          Input <span className="text-vibrant-blue">Kunjungan</span>
        </h1>
        <p className="text-gray-500 font-bold text-xs sm:text-sm md:text-base">Mencatat kedatangan Dinas, Sekolah lain, atau Instansi resmi ke SMKN 46 Jakarta.</p>
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
                notification.type === 'success' ? "bg-vibrant-blue text-white" : "bg-red-500 text-white"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
                notification.type === 'success' ? "bg-white/20" : "bg-white/20"
              )}>
                <Check size={20} className="text-white" />
              </div>
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl border-8 border-playful-200 overflow-hidden"
      >
        <div className="p-8 md:p-12 bg-gradient-to-br from-vibrant-blue to-blue-600 text-white relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none mb-2">Form Tamu Dinas</h3>
              <p className="text-white/70 font-bold text-xs md:text-base uppercase tracking-widest">Registrasi Kunjungan Luar / Instansi</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-12 space-y-10">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Instansi */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <Building size={14} className="text-vibrant-blue" />
                Asal Instansi / Dinas / Sekolah
              </label>
              <input 
                type="text" required
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                placeholder="Nama Dinas atau Instansi"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
              />
            </div>
            {/* Perwakilan */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <UserCircle size={14} className="text-vibrant-blue" />
                Nama Perwakilan / Ketua Rombongan
              </label>
              <input 
                type="text" required
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                placeholder="Nama Lengkap"
                value={formData.visitor_name}
                onChange={(e) => setFormData({...formData, visitor_name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
             {/* Visitor Count */}
             <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <Users size={14} className="text-vibrant-blue" />
                Jumlah Anggota Rombongan
              </label>
              <input 
                type="number" required min="1"
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 text-sm"
                value={formData.visitor_count}
                onChange={(e) => setFormData({...formData, visitor_count: e.target.value})}
              />
            </div>
            {/* Phone */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <Phone size={14} className="text-vibrant-blue" />
                Nomor Telepon HP/WA
              </label>
              <input 
                type="tel" required
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                placeholder="08xxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Target Unit */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <Sparkles size={14} className="text-vibrant-blue" />
                Unit / Bidang yang Dituju
              </label>
              <select 
                required
                className={cn(
                  "w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-black appearance-none text-sm",
                  formData.target_unit === "" ? "text-gray-300" : "text-gray-900"
                )}
                value={formData.target_unit}
                onChange={(e) => {
                  setFormData({...formData, target_unit: e.target.value, target_person: ''});
                  setTargetClass('');
                }}
              >
                <option value="" className="text-gray-300">-- PILIH UNIT --</option>
                <option value="Kepala Sekolah" className="text-gray-900">Kepala Sekolah</option>
                <option value="Wak. Humas" className="text-gray-900">Wak. Humas</option>
                <option value="Wak. Kurikulum" className="text-gray-900">Wak. Kurikulum</option>
                <option value="Wak. Kesiswaan" className="text-gray-900">Wak. Kesiswaan</option>
                <option value="Wak. Sarana Prasarana" className="text-gray-900">Wak. Sarana Prasarana</option>
                <option value="Tata Usaha" className="text-gray-900">Tata Usaha</option>
                <option value="Wali Kelas" className="text-gray-900">Wali Kelas</option>
                <option value="Wali Murid" className="text-gray-900">Wali Murid</option>
                <option value="OSIS/MPK" className="text-gray-900">OSIS/MPK</option>
                <option value="Peserta Didik" className="text-gray-900">Peserta Didik</option>
                <option value="Staff/Karyawan" className="text-gray-900">Staff/Karyawan</option>
              </select>
            </div>
            {/* Target Person / Class */}
            <div className="space-y-6">
              {formData.target_unit === 'Peserta Didik' ? (
                <>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                      <Users size={14} className="text-vibrant-blue" />
                      Pilih Kelas Peserta Didik
                    </label>
                    <select 
                      required
                      className={cn(
                        "w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-black appearance-none text-sm",
                        targetClass === "" ? "text-gray-300" : "text-gray-900"
                      )}
                      value={targetClass}
                      onChange={(e) => setTargetClass(e.target.value)}
                    >
                      <option value="" className="text-gray-300">-- PILIH KELAS --</option>
                      {CLASS_LIST.map((cls) => (
                        <option key={cls} value={cls} className="text-gray-900">{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                      <UserCircle size={14} className="text-vibrant-blue" />
                      Nama Peserta Didik
                    </label>
                    <input 
                      type="text" required
                      className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                      placeholder="Ketik Nama Siswa"
                      value={formData.target_person}
                      onChange={(e) => setFormData({...formData, target_person: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                    <UserCircle size={14} className="text-vibrant-blue" />
                    {formData.target_unit === 'Wali Murid' || formData.target_unit === 'Wali Kelas' 
                      ? 'Pilih Wali Kelas yang Dituju' 
                      : 'Menemui (Jika ada nama spesifik)'}
                  </label>
                  {formData.target_unit === 'Wali Murid' || formData.target_unit === 'Wali Kelas' ? (
                    <select 
                      required
                      className={cn(
                        "w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold appearance-none text-sm",
                        formData.target_person === "" ? "text-gray-300" : "text-gray-900"
                      )}
                      value={formData.target_person}
                      onChange={(e) => setFormData({...formData, target_person: e.target.value})}
                    >
                      <option value="" className="text-gray-300">-- PILIH WALI KELAS --</option>
                      {WALI_KELAS_LIST.map((wali) => (
                        <option key={wali} value={wali} className="text-gray-900">{wali}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text"
                      className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                      placeholder="Nama Pejabat/Guru yang dituju"
                      value={formData.target_person}
                      onChange={(e) => setFormData({...formData, target_person: e.target.value})}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
             <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <CalendarIcon size={14} className="text-vibrant-blue" />
                Tanggal
              </label>
              <input 
                type="date" required
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                <Clock size={14} className="text-vibrant-blue" />
                Waktu
              </label>
              <input 
                type="time" required
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
              <MessageSquare size={14} className="text-vibrant-blue" />
              Detail Keperluan / Surat Perintah
            </label>
            <textarea 
              required rows={4}
              className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
              placeholder="Contoh: Studi banding, Koordinasi Dinas, Monitoring, dll..."
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-6 md:py-8 bg-vibrant-blue text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-4"
          >
            {loading ? (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Building2 size={24} />
                <span>SIMPAN LOG KUNJUNGAN</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
