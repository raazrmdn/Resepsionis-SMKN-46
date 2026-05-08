import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, UserCircle, Users, MessageSquare, Check, Sparkles, Building, Phone, Calendar as CalendarIcon, Clock, ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

import { WALI_KELAS_LIST, CLASS_LIST } from '../constants';

export default function PublicVisit() {
  const [loading, setLoading] = useState(false);
  const [targetClass, setTargetClass] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
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
      const displayTarget = formData.target_unit === 'Peserta Didik' 
        ? `${targetClass} - ${formData.target_person}` 
        : formData.target_person;

      const fullPurpose = `[KUNJUNGAN RESMI: ${formData.organization}] (${formData.visitor_count} Orang) - Menuju ${formData.target_unit}: ${displayTarget}. Pesan: ${formData.purpose}`;
      
      // 1. Save to appointments table
      const { error: aptError } = await supabase
        .from('appointments')
        .insert([{ 
          guest_name: formData.visitor_name,
          organization: formData.organization || 'Pribadi',
          phone: formData.phone || '-',
          date: formData.date,
          time: formData.time,
          purpose: fullPurpose,
          status: 'pending',
          teacher_id: null,
          receptionist_id: null
        }]);

      if (aptError) {
        console.error('Initial insert failed:', aptError);
        // Fallback for potential schema mismatch
        const { error: fallbackError } = await supabase
          .from('appointments')
          .insert([{
            guest_name: formData.visitor_name,
            date: formData.date,
            time: formData.time,
            purpose: fullPurpose,
            status: 'pending'
          }]);
        if (fallbackError) throw fallbackError;
      }

      // 2. Also log to guests table (Don't throw if fails)
      const { error: guestError } = await supabase
        .from('guests')
        .insert([{
          name: formData.visitor_name,
          organization: formData.organization || '-',
          purpose: fullPurpose,
          phone: formData.phone || '-',
          receptionist_id: null
        }]);

      if (guestError) console.warn('History log error:', guestError);

      setIsSuccess(true);
    } catch (error: any) {
      console.error('Submit error:', error);
      setNotification({ type: 'error', message: 'Gagal mencatat: ' + (error.message || 'Error sistem.') });
    } finally {
      setLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-playful-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border-8 border-playful-200 max-w-lg w-full"
        >
          <div className="w-16 h-16 md:w-24 md:h-24 bg-vibrant-blue rounded-2xl md:rounded-3xl flex items-center justify-center text-white mx-auto mb-6 md:mb-8 shadow-lg shadow-blue-200 rotate-6">
            <Sparkles size={32} className="md:hidden" />
            <Sparkles size={48} className="hidden md:block" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase mb-4">Tercatat!</h2>
          <p className="text-gray-500 font-bold mb-8 md:mb-10 leading-relaxed text-sm md:text-base">
            Data kunjungan resmi Anda telah berhasil masuk ke sistem SMKN 46 Jakarta. Terima kasih telah melapor.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-vibrant-blue hover:bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
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
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-vibrant-blue rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md -rotate-3">
              46
            </div>
            <div>
              <h1 className="text-gray-900 font-black text-xs tracking-tighter uppercase leading-none">SMKN 46 JAKARTA</h1>
              <p className="text-vibrant-blue text-[8px] uppercase font-black tracking-widest mt-1">Layanan Kunjungan Resmi</p>
            </div>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-vibrant-blue transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Kembali</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-12 text-center px-4">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase mb-4">Input <span className="text-vibrant-blue">Kunjungan Resmi</span></h1>
          <p className="text-gray-500 font-bold text-sm md:text-base">Registrasi kedatangan Dinas, Instansi, atau Tamu Resmi SMKN 46 Jakarta.</p>
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
          className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border-8 border-playful-200 overflow-hidden"
        >
          <div className="p-8 md:p-12 bg-gradient-to-br from-vibrant-blue to-blue-600 text-white relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Building2 size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-none mb-2">Form Tamu Dinas</h3>
                <p className="text-white/70 font-bold text-xs md:text-base uppercase tracking-widest">Informasi Kedatangan Instansi</p>
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
                  Nomor Telepon (WhatsApp)
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
                  Tanggal Kedatangan
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
                Detail Keperluan / Keterangan
              </label>
              <textarea 
                required rows={4}
                className="w-full px-8 py-5 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-[2rem] outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm"
                placeholder="Apa keperluan kunjungan resmi Anda?"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-6 md:py-8 bg-vibrant-blue text-white rounded-[2.5rem] font-black text-xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              {loading ? (
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Building2 size={24} />
                  <span>KIRIM DATA KUNJUNGAN</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Public Footer */}
        <div className="mt-16 text-center space-y-6">
          <div className="flex justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Cipinang Pulo, Jakarta</span>
            </div>
            <div className="flex items-center gap-2 text-vibrant-blue">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">SMKN 46 JAKARTA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
