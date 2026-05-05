import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, Menu, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../AuthContext';

export default function AppLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-playful-50 mesh-gradient">
        <div className="relative">
          <div className="w-20 h-20 border-8 border-vibrant-purple/10 rounded-full"></div>
          <div className="w-20 h-20 border-8 border-vibrant-purple border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading || !profile) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-playful-50 mesh-gradient">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-8 border-vibrant-purple/10 rounded-full"></div>
            <div className="w-20 h-20 border-8 border-vibrant-purple border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-vibrant-purple font-black animate-pulse uppercase tracking-widest text-sm">
            {loading ? 'Menyiapkan Profil...' : 'Profil Tidak Ditemukan'}
          </p>
          
          {!loading && !profile && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center space-y-6"
            >
              <p className="text-gray-500 text-sm font-bold max-w-xs mx-auto">
                Maaf, akun Anda belum terdaftar di sistem profil. Silakan hubungi Admin atau coba login kembali.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-vibrant-purple text-white font-black text-xs rounded-2xl shadow-lg uppercase tracking-widest hover:scale-105 transition-all"
                >
                  Refresh Halaman
                </button>
                <button 
                  onClick={() => signOut()}
                  className="px-8 py-3 bg-white text-gray-400 font-black text-xs rounded-2xl shadow-md uppercase tracking-widest border-2 border-white hover:text-red-500 transition-all"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-playful-50 text-gray-900 selection:bg-vibrant-yellow selection:text-gray-900">
      <Sidebar 
        role={profile.role} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b-4 border-playful-200 px-4 py-3 flex items-center justify-between sticky top-0 z-[40]">
          <div className="flex items-center gap-2">
            <img 
              src="https://drive.google.com/thumbnail?id=1w1hSW0d-j-ni3t7AqEAhsSnC-FUGz4kh&sz=w200" 
              alt="Logo" 
              className="w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-gray-900 font-black text-[10px] tracking-tighter uppercase leading-none">SMKN 46<br/><span className="text-vibrant-purple">Receptionist</span></h1>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => signOut()}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-playful-50 text-vibrant-purple rounded-xl hover:bg-playful-100 transition-all border-2 border-playful-200"
            >
              <Menu size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 lg:ml-64 p-6 md:p-12 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-vibrant-pink/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-vibrant-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <Outlet />
        </div>
        </main>
      </div>
    </div>
  );
}
