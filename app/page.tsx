import Link from 'next/link';
import { QrCode, MessageSquareHeart, LayoutDashboard, CalendarRange } from 'lucide-react';

export const metadata = {
  title: 'CAI Absensi & Saran - Beranda',
  description: 'Portal Absensi Mandiri dan Kritik Saran CAI',
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-900">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] overflow-hidden pointer-events-none opacity-40 z-0">
        <div className="absolute -top-[30%] left-[10%] w-[350px] h-[350px] bg-teal-500/20 rounded-full blur-[100px]" />
        <div className="absolute -top-[20%] right-[10%] w-[350px] h-[350px] bg-indigo-500/20 rounded-full blur-[100px]" />
      </div>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10 w-full max-w-md mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs font-semibold text-teal-400 mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            CAI Event System
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-300 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            Aplikasi CAI
          </h1>
          <p className="mt-3 text-slate-400 text-sm">
            Portal digital absensi kehadiran dan pengisian kritik saran peserta acara.
          </p>
        </div>

        {/* Feature Navigation Cards */}
        <div className="w-full flex flex-col gap-4">
          {/* Scan QR Code */}
          <Link
            href="/scan"
            className="group relative flex items-center gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/40 hover:border-teal-500/50 hover:bg-slate-800/70 transition-all duration-300 backdrop-blur-md shadow-lg shadow-slate-950/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-900 transition-all duration-300">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-200 group-hover:text-teal-300 transition-colors">
                Scan QR Absensi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kamera scan QR Code Anda untuk mencatat kehadiran sesi aktif.
              </p>
            </div>
          </Link>

          {/* Kritik & Saran */}
          <Link
            href="/saran"
            className="group relative flex items-center gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/40 hover:border-pink-500/50 hover:bg-slate-800/70 transition-all duration-300 backdrop-blur-md shadow-lg shadow-slate-950/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 group-hover:bg-pink-500 group-hover:text-slate-900 transition-all duration-300">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-200 group-hover:text-pink-300 transition-colors">
                Kritik & Saran
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Berikan tanggapan, pesan, dan kesan Anda demi kelancaran acara.
              </p>
            </div>
          </Link>

          {/* Monitor Dashboard */}
          <Link
            href="/monitor"
            className="group relative flex items-center gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/40 hover:border-indigo-500/50 hover:bg-slate-800/70 transition-all duration-300 backdrop-blur-md shadow-lg shadow-slate-950/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-slate-900 transition-all duration-300">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                Monitor Dashboard
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Lihat data statistik peserta, rekap kehadiran, dan daftar saran.
              </p>
            </div>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-slate-500 text-xs flex flex-col gap-1">
          <p>© {new Date().getFullYear()} CAI Management System</p>
          <p className="text-slate-600">Premium Mobile Layout Experience</p>
        </div>
      </main>
    </div>
  );
}
