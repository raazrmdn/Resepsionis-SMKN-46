import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Package, 
  FileText, 
  Settings, 
  LogOut,
  UserCircle,
  Clock,
  X,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

interface SidebarProps {
  role: 'admin' | 'receptionist' | 'teacher' | 'staff' | 'student' | 'guest';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/app',
      roles: ['admin', 'receptionist', 'staff', 'student', 'guest']
    },
    {
      title: 'Input Data Tamu',
      icon: Calendar,
      roles: ['admin', 'receptionist', 'teacher', 'staff', 'student', 'guest'],
      subItems: [
        {
          title: 'Input Kunjungan',
          icon: UserPlus,
          path: '/app/visit-input',
        },
        {
          title: 'Input Janji Temu',
          icon: Calendar,
          path: '/app/appointments',
        }
      ]
    },
    {
      title: 'Daftar Janji Temu',
      icon: Calendar,
      path: '/app/appointment-list',
      roles: ['admin', 'receptionist', 'teacher', 'staff', 'student', 'guest']
    },
    {
      title: 'Barang & Surat',
      icon: Package,
      path: '/app/packages',
      roles: ['admin', 'receptionist', 'teacher', 'staff', 'guest', 'student']
    },
    {
      title: 'Dispensasi Siswa',
      icon: LogOut,
      path: '/app/student-dispensation',
      roles: ['admin', 'receptionist']
    },
    {
      title: 'Jadwal Guru',
      icon: Clock,
      path: '/app/teacher-schedule',
      roles: ['admin', 'receptionist', 'teacher', 'staff', 'student', 'guest']
    },
    {
      title: 'Histori Kunjungan',
      icon: Users,
      path: '/app/guestbook',
      roles: ['admin', 'receptionist']
    },
    {
      title: 'Laporan',
      icon: FileText,
      path: '/app/reports',
      roles: ['admin', 'receptionist', 'teacher', 'staff', 'student', 'guest']
    },
    {
      title: 'User Management',
      icon: Settings,
      path: '/app/users',
      roles: ['admin']
    }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={cn(
        "w-64 bg-white h-screen fixed left-0 top-0 flex flex-col border-r-4 border-playful-200 shadow-2xl z-[60] transition-transform duration-300 transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-vibrant-purple hover:bg-playful-100 rounded-xl lg:hidden z-[70] transition-all border-2 border-gray-100 shadow-sm"
        >
          <X size={24} />
        </button>
        {(role === 'guest' || role === 'student') ? (
        <div className="p-6 border-b-4 border-playful-200">
          <div className={cn(
            "p-4 rounded-3xl shadow-xl relative overflow-hidden group",
            role === 'guest' ? "bg-gradient-to-br from-vibrant-blue to-blue-600 shadow-vibrant-blue/20" : "bg-gradient-to-br from-vibrant-purple to-purple-600 shadow-vibrant-purple/20"
          )}>
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <UserCircle size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-sm tracking-tight leading-tight uppercase truncate">
                  {profile?.full_name || (role === 'guest' ? 'Tamu Umum' : 'Siswa')}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-blue-100 text-[10px] uppercase font-black tracking-widest">
                    {role === 'guest' ? 'Akun Umum' : 'Siswa SMKN 46'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 flex items-center gap-4">
          <img 
            src="https://drive.google.com/thumbnail?id=1w1hSW0d-j-ni3t7AqEAhsSnC-FUGz4kh&sz=w400" 
            alt="SMKN 46 Logo" 
            className="w-14 h-14 object-contain drop-shadow-md"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-gray-900 font-black text-sm tracking-tighter leading-tight uppercase">
              {role === 'admin' ? 'Admin' : 
               role === 'receptionist' ? 'Receptionist' : 
               role === 'teacher' ? 'Guru' : 
               role === 'staff' ? 'Staff' : 
               role === 'student' ? 'Siswa' : 'Umum'} SMKN 46
            </h1>
            <p className="text-vibrant-purple text-[8px] uppercase font-black tracking-[0.1em]">SMKN 46 Jakarta</p>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredMenu.map((item) => {
          if (item.subItems) {
            const isExpanded = expandedItems.includes(item.title);
            const isAnySubActive = item.subItems.some(sub => location.pathname === sub.path);
            
            return (
              <div key={item.title} className="space-y-1">
                <button
                  onClick={() => toggleExpand(item.title)}
                  className={cn(
                    "w-full sidebar-link flex items-center justify-between",
                    isAnySubActive && !isExpanded && "sidebar-link-active"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={22} />
                    <span className="tracking-tight">{item.title}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-9 pl-4 space-y-1 overflow-hidden relative"
                    >
                      {/* Vertical line connector */}
                      <div className="absolute left-0 top-0 bottom-6 w-0.5 bg-gray-100 rounded-full" />
                      
                      {item.subItems.map((sub) => {
                        const isSubActive = location.pathname === sub.path;
                        return (
                          <div key={sub.path} className="relative">
                            {/* Horizontal line connector */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gray-100" />
                            
                            <Link
                              to={sub.path}
                              className={cn(
                                "sidebar-link text-sm py-3",
                                isSubActive && "sidebar-link-active"
                              )}
                            >
                              <sub.icon size={18} />
                              <span className="tracking-tight">{sub.title}</span>
                            </Link>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-link",
                isActive && "sidebar-link-active"
              )}
            >
              <item.icon size={22} />
              <span className="tracking-tight">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t-4 border-playful-200 bg-playful-50/50">
        <button
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 shadow-lg shadow-red-200 transition-all uppercase tracking-widest active:scale-95"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
        <div className="mt-4 text-center">
          <p className="text-[8px] text-gray-300 font-black uppercase tracking-[0.3em]">v1.0.5 • LATEST UPDATED</p>
        </div>
      </div>
    </div>
  </>
);
}
