import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Search, Filter, MoreVertical, Download, UserPlus, Building2, Phone, MessageSquare, Sparkles, Clock, Eye, CheckCircle2, X } from 'lucide-react';
import { supabase, type Guest } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Guestbook() {
  const { profile } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    fetchGuests();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('public:guests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
        fetchGuests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function deleteGuest(id: string) {
    if (!window.confirm('Hapus riwayat kunjungan ini secara permanen?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.from('guests').delete().eq('id', id);
      
      if (error) throw error;
      
      setNotification({ type: 'success', message: 'Riwayat kunjungan berhasil dihapus!' });
      await fetchGuests();
    } catch (error: any) {
      console.error('Error deleting guest:', error);
      setNotification({ 
        type: 'error', 
        message: 'Gagal menghapus: ' + (error.message || 'Izin ditolak (cek SQL Editor).') 
      });
    } finally {
      setLoading(false);
    }
  }

  const handleExport = () => {
    if (filteredGuests.length === 0) {
      setNotification({ type: 'error', message: 'Tidak ada data untuk diekspor' });
      return;
    }

    try {
      // Define headers
      const headers = ['Nama Tamu', 'Instansi', 'Keperluan/Pesan', 'Tanggal', 'Waktu', 'Status'];
      
      // Map data to rows
      const rows = filteredGuests.map(g => [
        `"${g.name.replace(/"/g, '""')}"`,
        `"${(g.organization || '-').replace(/"/g, '""')}"`,
        `"${(g.purpose || '-').replace(/"/g, '""')}"`,
        format(new Date(g.created_at), 'dd/MM/yyyy'),
        format(new Date(g.created_at), 'HH:mm'),
        'TERCATAT'
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `log_tamu_smkn46_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setNotification({ type: 'success', message: 'Log berhasil diekspor ke CSV' });
    } catch (error) {
      console.error('Export error:', error);
      setNotification({ type: 'error', message: 'Gagal mengekspor data' });
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  async function fetchGuests() {
    try {
      let query = supabase
        .from('guests')
        .select('*');
      
      if (profile?.role === 'guest') {
        query = query.eq('receptionist_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.organization && g.organization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
                <div className="flex items-center justify-between text-left">
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">History <span className="text-vibrant-pink">Kunjungan</span></h1>
                  {selectedGuest && (
                    <button onClick={() => setSelectedGuest(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <X size={24} className="text-gray-400" />
                    </button>
                  )}
                </div>
                <div className="text-gray-500 font-bold mt-3 text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-vibrant-pink animate-pulse"></div>
            Log aktivitas tamu dan janji temu SMKN 46 Jakarta.
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl shadow-xl hover:shadow-2xl hover:border-vibrant-blue/30 transition-all text-[10px] font-black text-gray-700 uppercase tracking-widest active:scale-95 transition-all"
          >
            <Download size={18} className="text-vibrant-blue" />
            EXPORT DATA
          </button>
        </div>
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
                notification.type === 'success' ? "bg-vibrant-pink text-white" : "bg-red-500 text-white"
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

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row gap-6 bg-gray-50/30">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-vibrant-purple/30 group-focus-within:text-vibrant-purple transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Cari dalam riwayat kunjungan..."
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm focus:border-vibrant-purple/30 focus:shadow-md outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setLoading(true); fetchGuests(); }}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:border-vibrant-purple/30 hover:shadow-md transition-all text-[10px] font-black text-vibrant-purple uppercase tracking-[0.2em]"
          >
            <Clock size={16} className={cn(loading && "animate-spin")} />
            REFRESH LOG
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-vibrant-purple/60 text-[9px] uppercase font-black tracking-[0.25em]">
                <th className="px-10 py-5 border-b border-gray-100">Nama Tamu</th>
                <th className="px-10 py-5 border-b border-gray-100">Instansi</th>
                <th className="px-10 py-5 border-b border-gray-100">Keperluan / Pesan</th>
                <th className="px-10 py-5 border-b border-gray-100">Waktu Kunjungan</th>
                <th className="px-10 py-5 border-b border-gray-100">Status</th>
                <th className="px-10 py-5 border-b border-gray-100 text-center">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <div className="w-12 h-12 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center text-gray-400 font-bold text-xl">
                    Belum ada riwayat kunjungan. 📭
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={guest.id} 
                    className="hover:bg-playful-50/20 transition-all group"
                  >
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-vibrant-purple to-vibrant-pink text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm group-hover:rotate-6 transition-transform">
                          {guest.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800 text-sm tracking-tight">{guest.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-5 font-semibold text-gray-500 text-xs tracking-tight">{guest.organization || '-'}</td>
                    <td className="px-10 py-5">
                      <p className="text-xs font-medium text-gray-500 max-w-[200px] line-clamp-1 group-hover:line-clamp-none transition-all" title={guest.purpose}>
                        {guest.purpose}
                      </p>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-bold text-[11px] tracking-tight">
                          {format(new Date(guest.created_at), 'dd MMM yyyy', { locale: id })}
                        </span>
                        <span className="text-[10px] text-vibrant-purple/60 font-black tracking-widest">{format(new Date(guest.created_at), 'HH:mm', { locale: id })}</span>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50/50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        TERCATAT
                      </div>
                    </td>
                    <td className="px-10 py-5 text-center">
                      <button 
                        onClick={() => setSelectedGuest(guest)}
                        className="p-2 text-vibrant-purple hover:bg-vibrant-purple/10 rounded-xl transition-all"
                        title="Lihat Detail"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedGuest && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGuest(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden text-left"
            >
              <div className="bg-gradient-to-br from-vibrant-purple to-vibrant-pink p-8 text-white relative">
                <button 
                  onClick={() => setSelectedGuest(null)}
                  className="absolute top-6 right-6 p-2 h-10 w-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-white text-vibrant-purple rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-xl">
                    {selectedGuest.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Detail Kunjungan</p>
                    <h2 className="text-3xl font-black tracking-tighter leading-none">{selectedGuest.name}</h2>
                    <p className="font-bold text-white/90 mt-1">{selectedGuest.organization || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tanggal</p>
                    <p className="font-bold text-gray-900">{format(new Date(selectedGuest.created_at), 'EEEE, dd MMMM yyyy', { locale: id })}</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Waktu</p>
                    <p className="font-bold text-gray-900">{format(new Date(selectedGuest.created_at), 'HH:mm', { locale: id })} WIB</p>
                  </div>
                </div>

                <div className="p-8 bg-blue-50/50 rounded-3xl border-2 border-blue-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <MessageSquare size={100} />
                  </div>
                  <p className="text-[10px] font-black text-vibrant-blue uppercase tracking-widest mb-3">Keperluan / Pesan</p>
                  <p className="text-gray-700 font-bold leading-relaxed relative z-10 whitespace-pre-wrap">
                    {selectedGuest.purpose}
                  </p>
                </div>

                <div className="flex items-center justify-between p-6 bg-green-50/50 rounded-3xl border-2 border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Status</p>
                      <p className="font-bold text-green-700">TERCATAT</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedGuest(null)}
                    className="px-8 py-3 bg-white text-gray-900 font-black text-[10px] uppercase tracking-widest rounded-xl border-2 border-slate-100 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
