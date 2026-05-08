import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  Search,
  MessageSquare,
  Flag,
  Filter,
  Plus,
  FileDown
} from 'lucide-react';
import { supabase, type SystemReport } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { profile } = useAuth();
  const [reports, setReports] = useState<SystemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const
  });

  useEffect(() => {
    fetchReports();
  }, [profile]);

  async function fetchReports() {
    try {
      let query = supabase
        .from('system_reports')
        .select(`
          *,
          profiles:user_id (full_name)
        `);

      if (profile?.role === 'guest') {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.system_reports" does not exist')) {
          console.warn('System reports table not set up yet.');
          return;
        }
        throw error;
      }
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from('system_reports').insert({
        user_id: profile.id,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open'
      });

      if (error) {
        if (error.message.includes('relation "public.system_reports" does not exist')) {
          throw new Error('Tabel laporan belum ada di database. Silakan jalankan SQL setup terlebih dahulu.');
        }
        throw error;
      }
      
      setFormData({ title: '', description: '', priority: 'medium' });
      setShowForm(false);
      fetchReports();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      alert(error.message || 'Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(reportId: string, status: 'open' | 'in_progress' | 'resolved') {
    // Optimistic update
    const previousReports = [...reports];
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));

    try {
      const { error } = await supabase
        .from('system_reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating status:', error);
      // Revert on error
      setReports(previousReports);
      alert('Gagal memperbarui status: ' + (error.message || 'Error tidak diketahui. Pastikan Anda adalah Admin.'));
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('SMKN 46 JAKARTA - LAPORAN KENDALA SISTEM', 14, 20);
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 28);
    doc.text(`Dicetak oleh: ${profile?.full_name || 'Anonymous'}`, 14, 34);

    const tableData = reports.map((report) => [
      report.title,
      report.description,
      report.priority.toUpperCase(),
      report.status === 'resolved' ? 'SELESAI' : report.status.replace('_', ' ').toUpperCase(),
      (report as any).profiles?.full_name || 'Anonymous',
      format(new Date(report.created_at), 'dd/MM/yyyy HH:mm')
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Subjek', 'Deskripsi', 'Prioritas', 'Status', 'Pelapor', 'Waktu']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 }
      }
    });

    const fileName = `laporan_kendala_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
            Pusat <span className="text-vibrant-purple">Laporan</span> Kendala
          </h1>
          <p className="text-gray-500 font-bold mt-1">Laporkan kendala sistem atau berikan feedback untuk pengembangan aplikasi.</p>
        </div>
        <div className="flex flex-wrap gap-4 md:ml-auto">
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-3 px-8 py-5 bg-white border-4 border-vibrant-purple text-vibrant-purple rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-vibrant-purple hover:text-white shadow-xl shadow-vibrant-purple/10 transition-all active:scale-95 whitespace-nowrap"
          >
            <FileDown size={20} /> Export PDF
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 px-8 py-5 bg-vibrant-purple text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-vibrant-purple/90 shadow-xl shadow-vibrant-purple/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> Buat Laporan Baru
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl border-8 border-playful-200"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">Ketik Kendala Baru</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Subjek / Judul</label>
                  <input 
                    required
                    type="text"
                    placeholder="Contoh: Error saat menginput janji temu..."
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-playful-100 focus:border-vibrant-purple/10 rounded-2xl outline-none font-bold"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Prioritas</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p as any})}
                        className={cn(
                          "py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all",
                          formData.priority === p 
                            ? "bg-vibrant-purple text-white border-vibrant-purple" 
                            : "bg-white text-gray-400 border-gray-100 hover:border-vibrant-purple/20"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Deskripsi Detail</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Jelaskan kendala yang Anda alami secara mendalam..."
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-purple/10 rounded-2xl outline-none font-bold resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-8 py-4 bg-playful-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-8 py-4 bg-vibrant-purple text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-vibrant-purple/90 shadow-lg shadow-vibrant-purple/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white p-10 rounded-[4rem] shadow-xl border-4 border-playful-200">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-4">
            <Flag className="text-vibrant-pink" />
            Daftar Laporan Terkini
          </h2>
          <div className="flex gap-2">
            <div className="px-5 py-2 bg-playful-50 rounded-full text-[10px] font-black uppercase tracking-widest text-vibrant-purple">
              {reports.length} Laporan
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-12 h-12 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin mx-auto opacity-20"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-playful-100 rounded-full flex items-center justify-center mx-auto text-vibrant-purple border-4 border-playful-200">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 uppercase tracking-tight">Sistem Lancar!</p>
                <p className="text-gray-400 font-bold text-sm">Belum ada laporan kendala yang masuk.</p>
              </div>
            </div>
          ) : (
            reports.map((report, i) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-white rounded-[2.5rem] border-4 border-playful-200 p-8 hover:border-vibrant-purple/10 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                    report.priority === 'high' ? "bg-red-50 text-red-500" :
                    report.priority === 'medium' ? "bg-amber-50 text-amber-500" :
                    "bg-green-50 text-green-500"
                  )}>
                    {report.priority} Priority
                  </span>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                    report.status === 'open' ? "bg-playful-50 text-vibrant-purple" :
                    report.status === 'in_progress' ? "bg-blue-50 text-blue-500" :
                    "bg-green-50 text-green-500"
                  )}>
                    {report.status === 'resolved' ? 'Selesai' : report.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight uppercase line-clamp-2">
                  {report.title}
                </h3>
                <p className="text-xs text-gray-500 font-bold mb-8 line-clamp-3 leading-relaxed italic">
                  "{report.description}"
                </p>

                <div className="mt-auto pt-6 border-t-4 border-playful-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black uppercase">
                      {(report as any).profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest truncate">{(report as any).profiles?.full_name || 'Anonymous'}</p>
                      <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                      </p>
                    </div>
                  </div>
                  
                  {profile?.role === 'admin' && report.status !== 'resolved' && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      {report.status === 'open' && (
                        <button 
                          onClick={() => updateStatus(report.id, 'in_progress')}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          Proses
                        </button>
                      )}
                      <button 
                        onClick={() => updateStatus(report.id, 'resolved')}
                        className="px-2.5 py-1.5 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 size={10} />
                        Selesai
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
