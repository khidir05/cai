'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, Loader2, Sparkles, Heart } from 'lucide-react';

export default function SaranPage() {
  const [pesan, setPesan] = useState('');
  const [kesan, setKesan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesan.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/saran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan, kesan }),
      });
      const data = await res.json();
      
      if (data.success) {
        setIsSuccess(true);
        setPesan('');
        setKesan('');
        // Trigger client-side confetti if available
        try {
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch (e) {
          console.error(e);
        }
      } else {
        alert(data.message || 'Gagal mengirim saran.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-pink-500 selection:text-slate-950">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] overflow-hidden pointer-events-none opacity-30 z-0">
        <div className="absolute -top-[30%] left-[20%] w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[100px]" />
        <div className="absolute -top-[20%] right-[20%] w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Kembali</span>
        </Link>
        <div className="flex items-center gap-1.5 font-bold text-pink-400">
          <MessageSquare className="w-5 h-5" />
          <span>KRITIK & SARAN</span>
        </div>
        <div className="w-16" /> {/* spacer */}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 max-w-md mx-auto w-full relative z-10">
        
        {isSuccess ? (
          <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center shadow-2xl backdrop-blur-sm animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mx-auto mb-4 animate-bounce">
              <Heart className="w-8 h-8 fill-pink-400/20" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Pesan Terkirim!</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Terima kasih banyak atas kritik dan saran yang telah Anda berikan. Masukan Anda sangat berharga bagi peningkatan kualitas acara kami.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setIsSuccess(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-colors border border-slate-700/50"
              >
                Kirim Saran Lagi
              </button>
              <Link
                href="/"
                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-450 hover:to-purple-550 text-xs font-bold text-white rounded-xl transition-all shadow-md shadow-pink-500/10 flex items-center justify-center"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full bg-slate-900/40 border border-slate-800/50 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Form Tanggapan
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Silakan isi kritik, saran, pesan, maupun kesan selama mengikuti rangkaian acara. Tanggapan Anda dijamin anonim.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Pesan (Kritik/Saran) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Kritik & Saran <span className="text-pink-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  placeholder="Tuliskan kritik dan saran Anda untuk kelancaran acara..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all placeholder:text-slate-650 resize-none"
                />
              </div>

              {/* Kesan */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Kesan Acara (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={kesan}
                  onChange={(e) => setKesan(e.target.value)}
                  placeholder="Apa kesan atau pengalaman yang paling berkesan bagi Anda?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all placeholder:text-slate-650 resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !pesan.trim()}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-450 hover:to-purple-550 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-xs font-bold text-white rounded-xl transition-all shadow-lg shadow-pink-500/10 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Kritik & Saran
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* Footer Info */}
      <footer className="py-6 text-center text-slate-600 text-xs">
        CAI Event Feedback System
      </footer>
    </div>
  );
}
