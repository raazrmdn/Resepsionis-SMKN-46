import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Users, Calendar, Package, ArrowRight, School, FileText, Rocket, Sparkles, MapPin, Mail, Phone, Facebook, Instagram, Twitter, Youtube, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-playful-50 text-gray-900 selection:bg-vibrant-yellow selection:text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-xl z-50 border-b-2 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center gap-4">
              <img 
                src="https://drive.google.com/thumbnail?id=1w1hSW0d-j-ni3t7AqEAhsSnC-FUGz4kh&sz=w500" 
                alt="SMKN 46 Logo" 
                className="w-16 h-16 object-contain drop-shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="text-gray-900 font-black text-3xl tracking-tighter">RESEPSIONIS <span className="text-vibrant-purple">SMKN 46</span></span>
            </div>
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-gray-500 hover:text-vibrant-purple font-black transition-all text-sm uppercase tracking-widest">Features</a>
              <Link to="/login" className="text-gray-500 hover:text-vibrant-purple font-black transition-all text-sm uppercase tracking-widest">Login</Link>
              <Link to="/register" className="btn-primary">GET STARTED</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-56 pb-24 px-4 relative overflow-hidden mesh-gradient">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-xl text-vibrant-purple text-xs font-black mb-10 border-2 border-vibrant-purple/10 uppercase tracking-[0.3em]">
                <div className="w-2 h-2 rounded-full bg-vibrant-pink animate-ping"></div>
                <span>Digital Receptionist SMKN 46</span>
              </div>
              <h1 className="text-7xl md:text-[8rem] font-black text-gray-900 leading-[0.8] mb-12 tracking-tighter">
                SISTEM <span className="text-vibrant-purple">MEJA</span> <br />
                <span className="text-vibrant-pink italic">DEPAN</span> <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibrant-pink via-vibrant-purple to-vibrant-blue">SMKN 46</span>
              </h1>
              <p className="text-2xl text-gray-500 mb-14 max-w-lg font-bold leading-relaxed">
                Meja Resepsionis Digital Terpadu SMKN 46 Jakarta. <br />
                <span className="text-gray-400 font-medium">Beralih ke sistem pendataan tamu, janji temu, dan logistik yang lebih modern, cepat, dan terorganisir.</span>
              </p>
              <div className="flex flex-wrap gap-8 items-center">
                <Link to="/register" className="btn-primary py-6 px-12 flex items-center gap-4 text-xl shadow-2xl group">
                  DAFTAR SEKARANG 
                  <ArrowRight size={26} className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link to="/login" className="px-10 py-6 rounded-2xl font-black text-gray-700 border-4 border-white hover:bg-white/50 transition-all uppercase tracking-widest text-sm shadow-lg">
                  LOGIN MEJA
                </Link>
              </div>
              
              <div className="mt-20 flex items-center gap-10">
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-playful-100 flex items-center justify-center text-vibrant-purple text-xs font-black">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-tight">
                  <span className="text-vibrant-purple font-black">200+</span> AKTIVITAS <br />
                  TERCATAT HARI INI
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Abstract UI Visual (No Images) */}
              <div className="relative w-full aspect-square max-w-[600px] mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-vibrant-purple/20 to-vibrant-blue/20 rounded-[4rem] blur-3xl animate-pulse"></div>
                
                {/* Main Card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[70%] bg-white rounded-[3rem] shadow-2xl border-8 border-white overflow-hidden p-8 z-10 rotate-3">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="w-32 h-4 bg-gray-100 rounded-full"></div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-12 w-full bg-playful-50 rounded-2xl"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 bg-vibrant-purple/5 rounded-3xl border-2 border-dashed border-vibrant-purple/10 flex flex-col items-center justify-center gap-3">
                        <Users className="text-vibrant-purple" size={32} />
                        <div className="w-12 h-3 bg-vibrant-purple/10 rounded-full"></div>
                      </div>
                      <div className="h-32 bg-vibrant-pink/5 rounded-3xl border-2 border-dashed border-vibrant-pink/10 flex flex-col items-center justify-center gap-3">
                        <Calendar className="text-vibrant-pink" size={32} />
                        <div className="w-12 h-3 bg-vibrant-pink/10 rounded-full"></div>
                      </div>
                    </div>
                    <div className="h-20 w-full bg-vibrant-blue/5 rounded-2xl flex items-center px-6 gap-4">
                      <div className="w-10 h-10 rounded-xl bg-vibrant-blue flex items-center justify-center text-white">
                        <Package size={20} />
                      </div>
                      <div className="space-y-2">
                        <div className="w-24 h-3 bg-vibrant-blue/10 rounded-full"></div>
                        <div className="w-16 h-2 bg-vibrant-blue/5 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <motion.div 
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 right-0 w-32 h-32 bg-white rounded-[2rem] shadow-2xl z-20 flex items-center justify-center -rotate-12 border-4 border-white"
                >
                  <Sparkles size={48} className="text-vibrant-yellow" />
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full shadow-2xl z-20 p-4 flex flex-col items-center justify-center border-4 border-white"
                >
                  <img 
                    src="https://drive.google.com/thumbnail?id=1w1hSW0d-j-ni3t7AqEAhsSnC-FUGz4kh&sz=w400" 
                    alt="SMKN 46 Logo" 
                    className="w-24 h-24 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-2">SMKN 46 JAKARTA</div>
                </motion.div>
                
                {/* Floating Bubbles */}
                <div className="absolute top-1/4 -left-10 w-16 h-16 bg-vibrant-blue/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-10 w-24 h-24 bg-vibrant-pink/20 rounded-full blur-xl animate-pulse delay-1000"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-40 bg-[#0a0a0c] relative overflow-hidden">
        {/* Neon Glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-vibrant-purple/20 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-vibrant-pink/10 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/4"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-vibrant-blue/5 rounded-full blur-[180px]"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-32 gap-10">
            <div className="lg:w-2/3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vibrant-purple/10 border border-vibrant-purple/20 text-vibrant-purple text-[10px] font-black uppercase tracking-[0.4em] mb-8"
              >
                <Sparkles size={12} className="animate-spin-slow" />
                DIGITAL ECOSYSTEM
              </motion.div>
              <h2 className="text-6xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter uppercase">
                LAYANAN <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-vibrant-pink via-vibrant-purple to-vibrant-blue">RESEPSIONIS</span>
              </h2>
            </div>
            <div className="lg:w-1/3 text-right">
              <p className="text-gray-400 font-bold text-xl leading-relaxed">
                Platform satu pintu untuk segala urusan meja depan. Cepat, akurat, dan <span className="text-white">menyenangkan untuk digunakan.</span>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-12 auto-rows-[300px] gap-6">
            {[
              { icon: Users, title: 'Happy Guest', desc: 'Sambut tamu dengan senyuman digital.', color: 'from-vibrant-pink to-vibrant-pink/50', span: 'md:col-span-8', rotate: '-rotate-1' },
              { icon: Calendar, title: 'Easy Meet', desc: 'Janji temu anti ribet.', color: 'from-vibrant-purple to-vibrant-purple/50', span: 'md:col-span-4', rotate: 'rotate-2' },
              { icon: Package, title: 'Safe Box', desc: 'Paket aman terkendali.', color: 'from-vibrant-blue to-vibrant-blue/50', span: 'md:col-span-4', rotate: 'rotate-1' },
              { icon: ShieldCheck, title: 'Iron Shield', desc: 'Data aman terenkripsi.', color: 'from-vibrant-green to-vibrant-green/50', span: 'md:col-span-4', rotate: '-rotate-2' },
              { icon: FileText, title: 'Magic Report', desc: 'Laporan otomatis cantik.', color: 'from-vibrant-yellow to-vibrant-yellow/50', span: 'md:col-span-4', rotate: 'rotate-1' },
              { icon: School, title: 'PPLG Pride', desc: 'Karya asli SMK Negeri 46 Jakarta.', color: 'from-white to-gray-500', span: 'md:col-span-12', rotate: 'rotate-0' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, rotate: 0 }}
                className={cn(
                  "relative group overflow-hidden rounded-[3rem] p-10 flex flex-col justify-between border-2 border-white/5 bg-white/[0.02] backdrop-blur-3xl hover:bg-white/[0.05] hover:border-white/20 transition-all",
                  feature.span,
                  feature.rotate
                )}
              >
                {/* Glow Background */}
                <div className={cn("absolute -top-20 -right-20 w-80 h-80 blur-[100px] opacity-20 group-hover:opacity-40 transition-all duration-1000 bg-gradient-to-br animate-pulse", feature.color)}></div>
                
                <div className="relative z-10">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 bg-gradient-to-br shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500", feature.color)}>
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight uppercase mb-4">{feature.title}</h3>
                  <p className="text-gray-400 font-bold max-w-[200px]">{feature.desc}</p>
                </div>

                <div className="relative z-10 mt-8 h-8" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Core Features Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 0)', backgroundSize: '30px 30px' }}></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter uppercase leading-none">
              LAYANAN <span className="text-vibrant-purple">UTAMA</span> <br />
              <span className="text-vibrant-pink italic">RESEPSIONIS</span> KAMI
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Input Janji Temu",
                desc: "Siapapun kini bisa menjadwalkan pertemuan dengan Civitas SMKN 46 secara digital. Lebih teratur, efisien, dan otomatis terdata di sistem.",
                icon: <Calendar className="text-vibrant-purple" size={32} />,
                bg: "bg-vibrant-purple/5",
                border: "border-vibrant-purple/10",
                number: "01",
                link: "/public/appointment"
              },
              {
                title: "Input Kunjungan",
                desc: "Khusus untuk tamu kedinasan atau studi banding dari sekolah lain. Pendataan yang rapi memudahkan dokumentasi dan arsip kunjungan resmi.",
                icon: <Users className="text-vibrant-blue" size={32} />,
                bg: "bg-vibrant-blue/5",
                border: "border-vibrant-blue/10",
                number: "02",
                link: "/public/visit"
              },
              {
                title: "Titipan Barang / Surat",
                desc: "Layanan drop-off untuk paket, bekal makanan, baju, dokumen, hingga orderan kurir. Kami pastikan setiap titipan tercatat dan sampai ke tujuan.",
                icon: <Package className="text-vibrant-pink" size={32} />,
                bg: "bg-vibrant-pink/5",
                border: "border-vibrant-pink/10",
                number: "03",
                link: "/login"
              },
              {
                title: "Dispensasi Siswa",
                desc: "Pencatatan resmi untuk siswa yang izin keluar lingkungan sekolah. Memastikan setiap pergerakan siswa terpantau dengan izin guru yang valid.",
                icon: <LogOut className="text-vibrant-yellow" size={32} />,
                bg: "bg-vibrant-yellow/5",
                border: "border-vibrant-yellow/10",
                number: "04",
                link: "/login"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  to={item.link}
                  className={cn(
                    "p-10 rounded-[3rem] border-4 flex flex-col h-full items-start gap-8 group hover:shadow-2xl transition-all duration-500 bg-white block",
                    item.border
                  )}
                >
                  <div className="flex justify-between w-full items-start">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500", item.bg)}>
                      {item.icon}
                    </div>
                    <span className="text-4xl font-black text-gray-100 group-hover:text-gray-200 transition-colors uppercase italic">{item.number}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight uppercase group-hover:text-vibrant-purple transition-colors">{item.title}</h3>
                    <p className="text-gray-500 font-bold leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-auto pt-6 border-t border-gray-50 w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-vibrant-purple"></div>
                       <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Ready to assist</span>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-vibrant-purple group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-40 bg-playful-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/3">
              <h2 className="text-6xl font-black text-gray-900 mb-8 tracking-tighter leading-none">HOW IT <br /><span className="text-vibrant-purple">WORKS</span></h2>
              <div className="w-24 h-4 bg-vibrant-yellow rounded-full"></div>
            </div>
            <div className="lg:w-2/3 grid md:grid-cols-3 gap-10">
              {[
                { step: '01', title: 'Kedatangan', desc: 'Tamu melakukan scan atau input data digital di meja depan.' },
                { step: '02', title: 'Notifikasi', desc: 'Sistem memberi tahu guru atau staf terkait secara real-time.' },
                { step: '03', title: 'Selesai', desc: 'Data tersimpan rapi untuk laporan dan keamanan sekolah.' }
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="text-8xl font-black text-vibrant-purple/5 absolute -top-10 -left-6">{item.step}</div>
                  <div className="relative z-10">
                    <h4 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tighter italic">{item.title}</h4>
                    <p className="text-gray-500 font-bold leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 overflow-hidden border-t-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
            {/* School Info */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <img 
                  src="https://drive.google.com/thumbnail?id=1w1hSW0d-j-ni3t7AqEAhsSnC-FUGz4kh&sz=w400" 
                  alt="SMKN 46" 
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                />
                <h4 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">SMK Negeri 46 Jakarta</h4>
              </div>
              <p className="text-gray-500 font-bold text-lg leading-relaxed">
                Mencetak generasi unggul yang berkarakter, kompeten, dan siap menghadapi tantangan masa depan.
              </p>
              <div className="flex gap-4">
                {[
                  { Icon: Facebook, link: "https://facebook.com/groups/780673412140743/" },
                  { Icon: Instagram, link: "https://www.instagram.com/smknegeri46jakarta?igsh=Z2MwMnIxcHY4ZHF0" },
                  { Icon: Twitter, link: "#" },
                  { Icon: Youtube, link: "https://youtube.com/@smkn4644?si=pvP70OWsHjMaKzSa" }
                ].map((item, idx) => (
                  <a 
                    key={idx} 
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-2xl bg-playful-50 flex items-center justify-center text-gray-400 hover:text-vibrant-purple hover:bg-playful-100 transition-all border-2 border-transparent hover:border-vibrant-purple/10"
                  >
                    <item.Icon size={20} />
                  </a>
                ))}
              </div>
              <div className="mt-8">
                <a 
                  href="https://smkn46jaktim.sch.id/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-vibrant-purple hover:shadow-xl hover:shadow-vibrant-purple/20 transition-all active:scale-95 group border-2 border-transparent"
                >
                  <School size={16} className="group-hover:rotate-12 transition-transform text-vibrant-yellow" />
                  Kunjungi Website Sekolah
                </a>
              </div>
            </div>

            {/* Layanan */}
            <div className="space-y-8">
              <h5 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-10">LAYANAN</h5>
              <ul className="space-y-4">
                {[
                  { label: 'Beranda', path: '/' },
                  { label: 'Janji Temu Mandiri', path: '/public/appointment' },
                  { label: 'Kunjungan Resmi Mandiri', path: '/public/visit' },
                  { label: 'Buku Tamu Digital', path: '/login' },
                  { label: 'Jadwal Guru', path: '/login' },
                  { label: 'Logistik & Paket', path: '/login' },
                  { label: 'Login Petugas', path: '/login' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.path} className="text-gray-600 font-bold hover:text-vibrant-purple transition-colors">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontak */}
            <div className="space-y-8">
              <h5 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-10">KONTAK</h5>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-vibrant-blue/10 flex items-center justify-center text-vibrant-blue shrink-0">
                    <MapPin size={18} />
                  </div>
                  <p className="text-gray-600 font-bold text-sm leading-relaxed pt-2">
                    Jl. B7 Cipinang Pulo, <br /> Jakarta Timur, DKI Jakarta
                  </p>
                </li>
                <li className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-vibrant-blue/10 flex items-center justify-center text-vibrant-blue shrink-0">
                    <Phone size={18} />
                  </div>
                  <p className="text-gray-600 font-bold text-sm">(021) 8195127</p>
                </li>
                <li className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-vibrant-blue/10 flex items-center justify-center text-vibrant-blue shrink-0">
                    <Mail size={18} />
                  </div>
                  <p className="text-gray-600 font-bold text-sm">smkn46jakarta@gmail.com</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Credits */}
          <div className="pt-12 border-t-2 border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <p className="text-gray-400 font-bold text-sm">© 2026 SMKN 46 Jakarta.</p>
              <div className="hidden md:block w-1 h-1 bg-gray-300 rounded-full"></div>
              <p className="text-vibrant-purple font-black text-sm uppercase tracking-widest">
                by Rifa Azhar Rahmadhan
              </p>
            </div>
            <div className="px-6 py-2 rounded-full bg-vibrant-purple/5 border border-vibrant-purple/10">
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-vibrant-purple via-vibrant-pink to-vibrant-blue font-black text-xs uppercase tracking-[0.2em]">
                PENGEMBANGAN PERANGKAT LUNAK DAN GIM
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
