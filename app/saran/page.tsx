'use client';

import { useState } from 'react';
import { MessageSquare, Send, Loader2, Sparkles, Heart } from 'lucide-react';

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
        
        // Trigger client-side confetti
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
    <div 
      className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-slate-800 font-sans"
      style={{ backgroundImage: "url('/bg.jpeg')" }}
    >
      <div className="absolute inset-0 bg-[#0066cc]/5 backdrop-blur-2xs pointer-events-none" />
      {/* Premium Blue Header */}
      <header className="sticky top-0 z-45 w-full bg-[#0066cc] px-4 py-4 flex items-center justify-between shadow-md">
        <div className="w-6" /> {/* spacer */}
        <div className="flex items-center gap-2 font-bold text-white tracking-wider uppercase">
          <MessageSquare className="w-5 h-5" />
          <span>KRITIK & SARAN</span>
        </div>
        <div className="w-6" /> {/* spacer */}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center p-6 max-w-md mx-auto w-full relative z-10">
        
        {isSuccess ? (
          <div className="w-full bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-lg animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mx-auto mb-5 animate-bounce">
              <Heart className="w-8 h-8 fill-emerald-500/20" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-tight">Masukan Terkirim!</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
              Terima kasih banyak atas kritik dan saran yang telah Anda berikan. Masukan Anda sangat berharga bagi peningkatan kualitas acara kami.
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={() => setIsSuccess(false)}
                className="w-full py-3.5 bg-slate-850 hover:bg-slate-750 text-xs font-bold text-white rounded-xl transition-colors shadow-xs active:scale-[0.99]"
              >
                Kirim Saran Lagi
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-100 rounded-3xl p-6.5 shadow-lg flex flex-col items-center">
            
            {/* Embedded Logo on Form */}
            <img src="/logo.png" alt="CAI Logo" className="h-16 mb-4 object-contain" />
            <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-1">CAI 47 Ciltim 1</h2>
            <div className="w-8 h-1 bg-[#0066cc] rounded-full mb-6" />

            <div className="mb-6 text-center w-full">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-1.5 leading-snug">
                <Sparkles className="w-4.5 h-4.5 text-[#0066cc]" />
                Form Tanggapan
              </h3>
              <p className="text-slate-400 text-[11px] font-medium mt-1.5 leading-relaxed px-2">
                Silakan isi kritik, saran, pesan, maupun kesan selama mengikuti rangkaian acara. Tanggapan Anda dijamin anonim.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 w-full">
              {/* Pesan (Kritik/Saran) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Kritik & Saran <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  placeholder="Tuliskan kritik dan saran Anda untuk kelancaran acara..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-800 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30 transition-all placeholder:text-slate-400 resize-none font-medium"
                />
              </div>

              {/* Kesan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Kesan Acara (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={kesan}
                  onChange={(e) => setKesan(e.target.value)}
                  placeholder="Apa kesan atau pengalaman yang paling berkesan bagi Anda?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs text-slate-800 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/30 transition-all placeholder:text-slate-400 resize-none font-medium"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !pesan.trim()}
                className="w-full py-4 bg-[#0066cc] hover:bg-[#0052a3] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
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
      <footer className="py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        CAI Event Feedback System
      </footer>
    </div>
  );
}

