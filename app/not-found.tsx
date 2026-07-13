'use client';

import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <main 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-fixed p-6 font-sans text-slate-800 relative"
      style={{ backgroundImage: "url('/bg.jpeg')" }}
    >
      <div className="absolute inset-0 bg-[#0066cc]/10 backdrop-blur-2xs pointer-events-none" />
      
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-slate-100 p-8 flex flex-col items-center shadow-2xl relative z-10 text-center">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Selamat Datang di</h2>
        
        {/* Logo and Name */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="CAI Logo" className="h-24 mb-4 object-contain animate-pulse" style={{ animationDuration: '3s' }} />
          <h1 className="text-xl font-black text-slate-900 tracking-wider uppercase leading-tight">
            Cilacap Timur 1
          </h1>
          <p className="text-[10px] text-[#0066cc] font-extrabold tracking-widest uppercase mt-1">
            CAI 47 Cinta Alam Indonesia
          </p>
        </div>

        <div className="w-12 h-1 bg-[#0066cc] rounded-full mb-6" />

        <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-8 px-4">
          Halaman yang Anda tuju tidak ditemukan. Mari berpartisipasi menyukseskan kegiatan dengan menyalurkan kritik, saran, serta masukan konstruktif Anda.
        </p>

        {/* Link Button */}
        <Link 
          href="/saran"
          className="w-full py-4 bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] group"
        >
          <MessageSquare className="w-4.5 h-4.5" />
          <span>ISI KRITIK & SARAN</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </main>
  );
}
