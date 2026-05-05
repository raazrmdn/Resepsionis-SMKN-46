import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, User, LogIn, AlertCircle, Sparkles, Rocket, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase, type Role } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('guest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          },
        },
      });

      if (authError) throw authError;
      
      // Fallback: Manually insert profile if trigger fails or is not set up
      if (authData.user) {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: role
        });
      }
      
      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Gagal registrasi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-vibrant-pink/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-vibrant-blue/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link 
          to="/" 
          className="fixed top-6 left-6 z-[100] flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur-md border-2 border-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-vibrant-pink hover:bg-vibrant-pink hover:text-white transition-all shadow-xl active:scale-95 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Beranda
        </Link>
        
        <div className="card-glass overflow-hidden">
          <div className="p-10 text-center bg-gradient-to-br from-vibrant-purple/10 to-vibrant-blue/10 border-b-2 border-white">
            <img 
              src="https://drive.google.com/thumbnail?id=1w1hSW0d-j-ni3t7AqEAhsSnC-FUGz4kh&sz=w500" 
              alt="SMKN 46 Logo" 
              className="w-24 h-24 object-contain mx-auto mb-6 drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">JOIN THE SQUAD</h1>
            <p className="text-vibrant-purple text-sm font-bold mt-2 uppercase tracking-widest">SMKN 46 MEJA RESEPSIONIS</p>
          </div>

          <div className="p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Daftar Sebagai</label>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     { id: 'guest', label: 'Umum' },
                     { id: 'student', label: 'Siswa' },
                     { id: 'teacher', label: 'Guru' },
                     { id: 'staff', label: 'Staff' }
                   ].map((r) => (
                     <button
                       key={r.id}
                       type="button"
                       onClick={() => setRole(r.id as Role)}
                       className={cn(
                         "py-3 rounded-xl text-xs font-black uppercase tracking-widest border-4 transition-all",
                         role === r.id 
                           ? "bg-vibrant-purple text-white border-vibrant-purple shadow-lg scale-105" 
                           : "bg-white text-gray-300 border-playful-100 hover:border-vibrant-purple/20"
                       )}
                     >
                       {r.label}
                     </button>
                   ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-purple/40" size={20} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 focus:border-vibrant-purple outline-none transition-all placeholder:text-gray-300 font-bold"
                    placeholder="Nama Lengkap Anda"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-purple/40" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 focus:border-vibrant-purple outline-none transition-all placeholder:text-gray-300 font-bold"
                    placeholder="email@sekolah.id"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Secret Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-purple/40" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 focus:border-vibrant-purple outline-none transition-all placeholder:text-gray-300 font-bold"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-vibrant-purple/40 hover:text-vibrant-purple transition-colors"
                    title={showPassword ? "Sembunyikan" : "Lihat"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-5 flex items-center justify-center gap-3 text-lg disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Rocket size={22} />
                    <span>CREATE ACCOUNT</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t-2 border-gray-50 text-center">
              <p className="text-gray-500 font-bold text-sm">
                Sudah punya akun? <Link to="/login" className="text-vibrant-purple hover:underline">Login di sini</Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mt-10">
          <Sparkles className="text-vibrant-yellow animate-bounce" />
          <p className="text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">
            SMKN 46 JAKARTA • PPLG DIGITAL
          </p>
          <Sparkles className="text-vibrant-pink animate-bounce delay-100" />
        </div>
      </motion.div>
    </div>
  );
}
