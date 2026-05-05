import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Mail, 
  Edit2, 
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  X,
  Calendar,
  Key
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { supabase, type Profile, type Role } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

export default function UserManagement() {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'teacher' as Role
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  const [isBulkImporting, setIsBulkImporting] = useState(false);

  const teacherSeedData = [
    { name: "Osda Ida Perida Manurung, M.Pd", role: "Kepala Sekolah" },
    { name: "Nurbaiti Salpida Ginayanti, S.Pd.", role: "Guru Mapel" },
    { name: "Ipung Purwani, S.Pd.", role: "Guru PPKN" },
    { name: "Ponisih, S.Pd.", role: "Guru IPAS" },
    { name: "Dra. Cik Noni", role: "Waka Siswa, Guru BK" },
    { name: "Sunanti Sanuji, M.Pd.", role: "Guru B.Inggris" },
    { name: "Efa Herawati, S.Pd.", role: "Guru Matematika" },
    { name: "Tati Sulastri, S.Pd.", role: "Waka. Sarpras" },
    { name: "Rosalia Windarti, S.Pd.", role: "Guru Sejarah" },
    { name: "Ariesti Purwandari, S.Pd.", role: "Guru B.Inggris, B.Jepang" },
    { name: "AP. Widiastuti, S.E.", role: "Guru Produktif" },
    { name: "Sugiyono, S.Pd.", role: "Waka. Humas" },
    { name: "Asep Ahmad F, S.Pd.", role: "Guru Informatika" },
    { name: "Preh Sriyanto, S.Pd.", role: "Guru PJOK" },
    { name: "Ono Sasmita Jaya, S.Pd.", role: "Ketua LSP, Guru Produktif AKL" },
    { name: "Kukuh Pribadi, S.Pd.", role: "Guru Produktif DKV" },
    { name: "Eka Wahyudi, S.Pd.", role: "Guru Matematika" },
    { name: "Arief Nurmansyah, S.E.", role: "Guru Produkitf DKV" },
    { name: "Irma Mila Oktaviani, S.Pd.", role: "Guru Seni Budaya" },
    { name: "Reni, S.Pd.", role: "Guru Produktif RPL" },
    { name: "Muhammad Riyadi, S.Sn.", role: "Guru Produktif DKV, Informatika" },
    { name: "Cahaya Apriska Ike Puri, S.Pd.", role: "Guru Muatan Lokal Betawi" },
    { name: "Veranika TM, S.Kom.", role: "Guru Informatika" },
    { name: "Irna Dian Rahmawati, S.S.", role: "Guru B. Jepang" },
    { name: "Yulia Fatma, S.Pd.", role: "Guru" },
    { name: "Niken Riyaningsih, S.E.", role: "Guru" },
    { name: "Kusnadi, S.Kom.", role: "Guru Produktif RPL" },
    { name: "Ani Tri Astuti, S.Pd.", role: "Guru BK" },
    { name: "Endah Pratiwi Supriani, S.A.P.", role: "Guru" },
    { name: "Kiki Oliviari Putri, S.Pd.", role: "Guru Produktif RPL" },
    { name: "Aji Rachmad Sucianto, S.Pd.", role: "Guru Sejarah" },
    { name: "Nugraha Brahmana Putra, S.Sn.", role: "Guru Produktif DKV" },
    { name: "Irfan Mahmudi, S.E.", role: "Guru Produktif DKV" },
    { name: "Ma'ruf, S.Ag.", role: "Guru PAI" },
    { name: "Elia Lisdaningrum, S.Pd.", role: "Guru B.Inggris" },
    { name: "Sumiatun, S.Pd.", role: "Guru" },
    { name: "Hilaliah, S.Pd.", role: "Guru" },
    { name: "Siti Rahayu, S.E.", role: "Guru B. Indonesia" },
    { name: "Nur Febri Suryaningsih, S.Pd.", role: "Guru Matematika" },
    { name: "Desrini Rahayu Harahap, S.Pd.", role: "Guru" },
    { name: "Riza Novasari, S.Pd.", role: "Guru B. Indonesia" },
    { name: "Yeyeh Komariyah, S.Pd.I.", role: "Guru PAI" },
    { name: "Miftakhurrohmah,S.Pd.", role: "Guru" },
    { name: "Ade Komaria, S.Pd.", role: "Guru" },
    { name: "Kusdi Handoko, S.Kom.", role: "Guru" },
    { name: "Bashir Rahadi, S.Pd.", role: "Guru" },
    { name: "Giusti Murah Sulanjari, S.Pd.", role: "Guru" },
    { name: "Hema Orline Manik, S.Pd.", role: "Guru B. Inggris" },
    { name: "Samuel Hari Malyana, S.Pd.K.", role: "Guru" }
  ];

  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  async function handleBulkImport() {
    setError(null);
    setSuccess(null);
    setIsBulkImporting(true);
    setImportProgress({ current: 0, total: teacherSeedData.length });
    
    // Create a temporary client that doesn't persist session to avoid logging out the current admin
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < teacherSeedData.length; i++) {
      const teacher = teacherSeedData[i];
      setImportProgress({ current: i + 1, total: teacherSeedData.length });
      
      // Check if teacher already exists in current users list
      const exists = users.some(u => 
        u.full_name.toLowerCase().includes(teacher.name.toLowerCase()) || 
        teacher.name.toLowerCase().includes(u.full_name.toLowerCase())
      );

      if (exists) {
        successCount++; // Count as success if already exists
        continue;
      }
      
      try {
        // More robust unique email generation
        const cleanName = teacher.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
        const timestamp = Date.now().toString().slice(-4);
        const randomStr = Math.random().toString(36).substring(2, 5);
        const email = `${cleanName}.${timestamp}${randomStr}@smkn46.sch.id`;
        const password = 'smkn46jakarta';

        const { data: authData, error: authError } = await tempClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: teacher.name,
              role: 'teacher' as Role
            }
          }
        });

        if (authError) {
          console.error(`Auth error for ${teacher.name}:`, authError);
          // If rate limited, wait MUCH longer (1 minute) and retry this specific index
          if (authError.status === 429 || authError.message.includes('rate limit')) {
            console.warn('Rate limit reached. Waiting 60 seconds before continuing...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            i--; // Retry this same teacher
            continue;
          }
          errorCount++;
          continue;
        }

        if (authData.user) {
          // Use the main supabase client to insert the profile
          const { error: profileError } = await supabase.from('profiles').upsert([
            {
              id: authData.user.id,
              email,
              full_name: teacher.name,
              role: 'teacher' as Role
            }
          ]);
          
          if (profileError) {
            console.error(`Profile error for ${teacher.name}:`, profileError);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        console.error('Error importing:', teacher.name, err);
        errorCount++;
      }
      
      // Increased delay to 3 seconds to be safe with Supabase free tier limits (usually 5 requests per minute or similar)
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    if (successCount > 0) {
      setSuccess(`Berhasil mengimpor ${successCount} guru! 🎉 ${errorCount > 0 ? `(${errorCount} gagal)` : ''}`);
    } else if (errorCount > 0) {
      setError(`Gagal mengimpor data. Silakan periksa koneksi atau kuota Supabase Auth Anda.`);
    }
    
    setIsBulkImporting(false);
    fetchUsers();
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingUser) {
        // Handle Update (Update Profile Only as updating email/password requires different Auth methods)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role
          })
          .eq('id', editingUser.id);

        if (updateError) {
          if (updateError.message.includes('user_role')) {
            throw new Error(`Role "${formData.role}" belum terdaftar di database Supabase Anda. Silakan jalankan perintah ini di SQL Editor: ALTER TYPE user_role ADD VALUE IF NOT EXISTS '${formData.role}';`);
          }
          throw updateError;
        }
        setSuccess('User berhasil diperbarui! 📝');
      } else {
        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: formData.role
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').upsert([
            {
              id: authData.user.id,
              email: formData.email,
              full_name: formData.full_name,
              role: formData.role
            }
          ]);
          if (profileError) {
            if (profileError.message.includes('user_role')) {
              throw new Error(`Role "${formData.role}" belum terdaftar di database Supabase Anda. Silakan jalankan perintah ini di SQL Editor: ALTER TYPE user_role ADD VALUE IF NOT EXISTS '${formData.role}';`);
            }
            throw profileError;
          }
        }
        setSuccess('User berhasil dibuat. Silakan cek email untuk verifikasi (jika diaktifkan).');
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', full_name: '', role: 'teacher' });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data user.');
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(user: Profile) {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Password cannot be fetched for security
      full_name: user.full_name,
      role: user.role
    });
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingUser(null);
    setFormData({ email: '', password: '', full_name: '', role: 'teacher' });
    setShowModal(true);
  }

  async function handleDeleteUser(id: string) {
    if (id === currentProfile?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri! 🚫');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menghapus user ini? Semua data terkait (janji temu, paket, jadwal, dll) juga akan ikut terhapus. Lanjutkan?')) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // 1. Delete related records first to avoid foreign key violations
      setSuccess('Sedang membersihkan data terkait...');
      
      // Define all possible tables that might have a reference to this user
      const cleanupTasks = [
        supabase.from('appointments').delete().eq('teacher_id', id),
        supabase.from('appointments').delete().eq('receptionist_id', id),
        supabase.from('janji_temu').delete().eq('teacher_id', id),
        supabase.from('packages').delete().eq('recipient_id', id),
        supabase.from('packages').delete().eq('receptionist_id', id),
        supabase.from('titipan_barang').delete().eq('recipient_id', id),
        supabase.from('guests').delete().eq('receptionist_id', id),
        supabase.from('tamu').delete().eq('teacher_id', id),
        supabase.from('teacher_schedule').delete().eq('teacher_id', id),
        supabase.from('system_reports').delete().eq('user_id', id)
      ];

      const cleanupResults = await Promise.all(cleanupTasks);
      const errors = cleanupResults.filter(r => r.error).map(r => r.error?.message);
      
      if (errors.length > 0) {
        console.warn('Some cleanup tasks failed, but attempting main account deletion anyway:', errors);
      }

      // 2. Delete from auth.users via RPC
      setSuccess('Menghapus akun pengguna dari database utama...');
      const { error: deleteError } = await supabase.rpc('delete_user_admin', { 
        target_user_id: id 
      });
      
      if (deleteError) {
        console.error('Supabase RPC Error Detail:', deleteError);
        
        // Handle specific error case where RPC doesn't exist
        if (deleteError.message?.includes('not found') || 
            deleteError.message?.includes('does not exist') || 
            deleteError.code === 'PGRST104' || // Could not find function
            deleteError.code === 'PGRST202') { // No object matches the given conditions
          throw new Error('Fitur hapus (RPC: delete_user_admin) belum dipasang di database Supabase Anda. Silakan jalankan script SQL terbaru di Supabase SQL Editor.');
        }

        // Handle permission errors
        if (deleteError.message?.includes('policy') || deleteError.message?.includes('Only admins')) {
          throw new Error('Anda tidak memiliki izin untuk menghapus user. Pastikan Anda masuk sebagai Admin.');
        }

        throw new Error(`Gagal menghapus user: ${deleteError.message || 'Error tidak diketahui'}`);
      }

      setSuccess('User dan data terkait berhasil dihapus! 🗑️');
      await fetchUsers();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Full deletion error trace:', err);
      setError(err.message || 'Gagal menghapus user. Silakan hubungi pengembang sistem.');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users
    .filter(u => 
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.full_name.localeCompare(b.full_name, 'id'));

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">User <span className="text-vibrant-purple">Management</span></h1>
          <p className="text-gray-500 font-bold mt-1">Kelola akun Admin, Petugas Resepsionis, dan Guru SMKN 46 Jakarta.</p>
        </div>
        <div className="flex flex-wrap gap-4 md:justify-end items-center flex-1">
          <button 
            onClick={handleBulkImport}
            disabled={isBulkImporting}
            className="px-8 py-4 bg-playful-50 text-vibrant-purple font-black text-[10px] rounded-2xl hover:bg-playful-100 transition-all uppercase tracking-[0.2em] disabled:opacity-50 border-2 border-white shadow-sm hover:shadow-md"
          >
            {isBulkImporting ? `IMPORTING ${importProgress.current}/${importProgress.total}...` : 'IMPORT DAFTAR GURU'}
          </button>
          <button 
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-3 text-[10px] tracking-[0.2em] shadow-vibrant-purple/20 shadow-xl py-4"
          >
            <UserPlus size={18} />
            TAMBAH USER BARU
          </button>
        </div>
      </div>

      {(error || success) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-[2rem] flex items-center gap-4 text-sm font-bold border-4",
            error ? "bg-red-50 text-red-600 border-white shadow-lg" : "bg-green-50 text-green-600 border-white shadow-lg"
          )}
        >
          {error ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          <span>{error || success}</span>
        </motion.div>
      )}

      <div className="bg-white rounded-[3rem] shadow-xl border-4 border-playful-200 overflow-hidden">
        <div className="p-8 border-b-4 border-playful-50 bg-playful-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-vibrant-purple/40" size={22} />
            <input 
              type="text"
              placeholder="Cari nama, email, atau role..."
              className="w-full pl-14 pr-6 py-4 bg-white border-4 border-white rounded-2xl shadow-sm focus:shadow-md outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-playful-50/50 text-vibrant-purple text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="px-10 py-6">Nama & Email</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6">Dibuat Pada</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-center">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-playful-50">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="w-12 h-12 border-4 border-vibrant-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-playful-50 rounded-full flex items-center justify-center mx-auto text-vibrant-purple/30">
                        <Search size={32} />
                      </div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Pencarian tidak ditemukan: "{searchTerm}"</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={user.id} 
                    className="hover:bg-playful-50/30 transition-colors group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md group-hover:rotate-6 transition-transform">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg tracking-tight">{user.full_name}</p>
                          <p className="text-xs text-gray-400 font-bold">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className={cn(
                          user.role === 'admin' ? "text-vibrant-pink" : 
                          user.role === 'receptionist' ? "text-vibrant-yellow" : "text-vibrant-blue"
                        )} />
                        <span className="text-sm font-black uppercase tracking-widest text-gray-700">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-sm font-bold text-gray-400">
                      {format(new Date(user.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-green-100">Active</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-md flex items-center justify-center text-gray-300 hover:text-vibrant-purple transition-all"
                          title="Edit User"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-md flex items-center justify-center text-gray-300 hover:text-vibrant-blue transition-all"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah User */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
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
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden border-8 border-playful-200"
            >
              <div className="p-10 bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <h3 className="text-3xl font-black tracking-tight uppercase">
                  {editingUser ? 'Edit User Profile' : 'Tambah User Baru'}
                </h3>
                <p className="text-white/70 font-bold mt-2">
                  {editingUser ? `Mengubah data ${editingUser.full_name}` : 'Buat akun untuk staf atau guru'}
                </p>
              </div>
              <form onSubmit={handleCreateUser} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Nama Lengkap</label>
                  <input 
                    type="text" required
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900"
                    placeholder="Nama Lengkap"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                {!editingUser && (
                  <>
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-blue/40" size={20} />
                        <input 
                          type="email" required
                          className="w-full pl-12 pr-4 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900"
                          placeholder="email@smkn46.sch.id"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-blue/40" size={20} />
                        <input 
                          type="password" required minLength={6}
                          className="w-full pl-12 pr-4 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-[0.2em]">Role Akses</label>
                  <select 
                    required
                    className="w-full px-6 py-4 bg-playful-50 border-4 border-transparent focus:border-vibrant-blue/10 rounded-2xl outline-none transition-all font-bold text-gray-900 appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                  >
                    <option value="teacher">Guru</option>
                    <option value="staff">Staff</option>
                    <option value="student">Siswa / Peserta Didik</option>
                    <option value="guest">Umum / Khalayak</option>
                    <option value="receptionist">Petugas Resepsionis (MP)</option>
                    <option value="admin">Admin / Pemilik</option>
                  </select>
                </div>
                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 bg-gray-50 rounded-2xl font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all">Batal</button>
                  <button type="submit" disabled={loading} className="flex-1 btn-primary py-5 disabled:opacity-50 shadow-xl shadow-vibrant-blue/20 bg-vibrant-blue">
                    {editingUser ? 'SIMPAN PERUBAHAN' : 'BUAT AKUN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Detail User Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-white"
            >
              <div className="p-10 bg-gradient-to-br from-vibrant-blue to-vibrant-purple text-white relative">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-8 right-8 p-3 h-12 w-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all"
                >
                  <X size={24} />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white text-gray-900 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-xl">
                    {selectedUser.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] opacity-80 mb-2">Profil Pengguna</p>
                    <h2 className="text-4xl font-black tracking-tighter leading-none">{selectedUser.full_name}</h2>
                    <p className="font-bold text-white/90 mt-2 text-lg">SMKN 46 Jakarta</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hak Akses</p>
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-vibrant-purple" />
                      <p className="font-black text-gray-900 uppercase">{selectedUser.role}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border-2 border-slate-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Terdaftar</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-vibrant-blue" />
                      <p className="font-bold text-gray-900">{format(new Date(selectedUser.created_at), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-playful-50 rounded-3xl border-2 border-white shadow-inner">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-vibrant-purple shadow-sm">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-vibrant-purple uppercase tracking-widest">Alamat Email</p>
                      <p className="font-bold text-gray-900">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border-2 border-white">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-vibrant-blue shadow-sm">
                      <Lock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-vibrant-blue uppercase tracking-widest">User ID (External Reference)</p>
                      <p className="font-mono text-[10px] font-bold text-gray-400 truncate w-64">{selectedUser.id}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-green-50/50 rounded-3xl border-2 border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Status Akun</p>
                      <p className="font-bold text-green-700">AKTIF & TERVERIFIKASI</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
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
