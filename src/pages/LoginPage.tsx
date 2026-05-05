import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('registered') === 'true') {
      setSuccess('Registrasi berhasil! Silakan login dengan akun baru Anda. 🎉');
    }
  }, [location]);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Gagal login. Silakan periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-vibrant-yellow/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibrant-purple/10 rounded-full blur-[100px]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Link 
          to="/" 
          className="fixed top-6 left-6 z-[100] flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur-md border-2 border-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-vibrant-purple hover:bg-vibrant-purple hover:text-white transition-all shadow-xl active:scale-95 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Beranda
        </Link>

        <div className="card-glass overflow-hidden">
          <div className="p-10 text-center bg-gradient-to-br from-vibrant-purple/5 to-vibrant-pink/5 border-b-2 border-white">
            <img 
              src="https://drive.google.com/thumbnail?id=1w1hSW0d-j-ni3t7AqEAhsSnC-FUGz4kh&sz=w500" 
              alt="SMKN 46 Logo" 
              className="w-24 h-24 object-contain mx-auto mb-6 drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Welcome Back!</h1>
            <p className="text-vibrant-blue text-xs font-black mt-2 uppercase tracking-[0.3em]">Meja Resepsionis SMKN 46</p>
          </div>

          <div className="p-10">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-bold">
                <CheckCircle2 size={20} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Neural ID (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-blue/40" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 focus:border-vibrant-blue outline-none transition-all placeholder:text-gray-300 font-bold"
                    placeholder="admin@smkn46.sch.id"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">Access Key (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-blue/40" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-900 focus:border-vibrant-blue outline-none transition-all placeholder:text-gray-300 font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold py-5 flex items-center justify-center gap-3 text-lg shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={22} />
                    <span>AUTHORIZE ACCESS</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t-2 border-gray-50 text-center">
              <p className="text-gray-500 font-bold text-sm">
                Belum punya akun? <Link to="/register" className="text-vibrant-blue hover:underline">Daftar sekarang</Link>
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-center text-gray-400 text-[10px] mt-10 font-black uppercase tracking-[0.5em]">
          Pengembangan Perangkat Lunak dan Gim
        </p>
      </motion.div>
    </div>
  );
}
