'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square, QrCode, Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ScanPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isTogglingSession, setIsTogglingSession] = useState(false);
  
  // Session modal
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  // Scanner states
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [scannedParticipant, setScannedParticipant] = useState<any>(null);

  const scannerRef = useRef<any>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Sound feedback using Web Audio API
  const playBeep = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'success' ? 880 : 330, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error('Failed to play beep sound:', e);
    }
  };

  // 1. Poll Session Status
  const fetchSessionStatus = async (showLoading = false) => {
    if (showLoading) setIsLoadingSession(true);
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    fetchSessionStatus(true);
    // Poll every 3 seconds to sync with other clients
    const interval = setInterval(() => {
      fetchSessionStatus(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Initialize QR Scanner
  useEffect(() => {
    const isSessionActive = session && session.status === 1;
    
    if (!isSessionActive) {
      // Clean up if session is closed
      if (scannerRef.current) {
        scannerRef.current.stop().catch((e: any) => console.log('Scanner stop err:', e));
        scannerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let html5QrCodeInstance: any = null;

    // Dynamically import html5-qrcode
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!isMounted) return;

      const elementId = 'qr-reader';
      const container = document.getElementById(elementId);
      if (!container) return;

      html5QrCodeInstance = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCodeInstance;

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      html5QrCodeInstance.start(
        { facingMode: 'environment' },
        config,
        async (decodedText: string) => {
          // Prevent multiple concurrent scans
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;

          await handleQrCodeScanned(decodedText);
        },
        (errorMessage: string) => {
          // Verbose qr code scanning frame errors can be ignored
        }
      ).catch((err: any) => {
        console.error('Error starting scanner:', err);
      });
    }).catch(err => {
      console.error('Failed to load html5-qrcode library:', err);
    });

    return () => {
      isMounted = false;
      if (html5QrCodeInstance) {
        html5QrCodeInstance.stop().catch((e: any) => console.log('Scanner cleanup stop err:', e));
      }
    };
  }, [session?.id, session?.status]); // Recreate scanner if session ID or status changes

  const handleQrCodeScanned = async (pesertaId: string) => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pesertaId }),
      });
      const data = await response.json();

      if (data.success) {
        playBeep('success');
        setScanStatus('success');
        setScanMessage(data.message);
        setScannedParticipant(data.peserta);
      } else {
        playBeep('error');
        setScanStatus('error');
        setScanMessage(data.message);
        setScannedParticipant(data.peserta || null);
      }
    } catch (error) {
      playBeep('error');
      setScanStatus('error');
      setScanMessage('Koneksi internet bermasalah. Gagal mencatat absensi.');
    } finally {
      // Keep frame green/red for 2.5 seconds, then reset
      setTimeout(() => {
        setScanStatus('idle');
        setScanMessage('');
        setScannedParticipant(null);
        isProcessingRef.current = false;
      }, 2500);
    }
  };

  // 3. Open Session
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    setIsTogglingSession(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', nama_sesi: newSessionName }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setNewSessionName('');
        setShowOpenModal(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuka sesi.');
    } finally {
      setIsTogglingSession(false);
    }
  };

  // 4. Close Session
  const handleCloseSession = async () => {
    if (!confirm('Apakah Anda yakin ingin menutup sesi absensi ini?')) return;

    setIsTogglingSession(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessionStatus(false);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menutup sesi.');
    } finally {
      setIsTogglingSession(false);
    }
  };

  const isSessionActive = session && session.status === 1;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Kembali</span>
        </Link>
        <div className="flex items-center gap-1.5 font-bold text-teal-400">
          <QrCode className="w-5 h-5 animate-pulse" />
          <span>CAI SCANNER</span>
        </div>
        <div className="w-16" /> {/* spacer */}
      </header>

      {/* Main Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        
        {/* Session Status Banner */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 shadow-md backdrop-blur-sm">
          {isLoadingSession ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
            </div>
          ) : isSessionActive ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    Sesi Aktif
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 line-clamp-1">{session.nama_sesi}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Mulai: {new Date(session.buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                </div>
                <button
                  onClick={handleCloseSession}
                  disabled={isTogglingSession}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-bold text-white rounded-lg transition-colors shadow-md"
                >
                  {isTogglingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                  Tutup Sesi
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 font-semibold mb-1">
                  Offline
                </div>
                <h3 className="text-base font-bold text-slate-300">Belum Ada Sesi Aktif</h3>
                <p className="text-xs text-slate-500 mt-0.5">Sesi absensi harus dibuka oleh admin.</p>
              </div>
              <button
                onClick={() => setShowOpenModal(true)}
                disabled={isTogglingSession}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-bold text-slate-950 rounded-lg transition-colors shadow-md"
              >
                {isTogglingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                Buka Sesi
              </button>
            </div>
          )}
        </div>

        {/* Scan Frame Area */}
        <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
          
          {/* Active Scanner Frame Indicator */}
          {isSessionActive && (
            <div className={`absolute inset-0 z-20 pointer-events-none transition-all duration-300 border-4 ${
              scanStatus === 'success' 
                ? 'border-emerald-500 ring-8 ring-emerald-500/20 shadow-[inset_0_0_30px_rgba(16,185,129,0.3)]' 
                : scanStatus === 'error'
                ? 'border-red-500 ring-8 ring-red-500/20 shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]'
                : 'border-transparent'
            }`} />
          )}

          {/* Scanner Overlay Elements */}
          {isSessionActive && scanStatus === 'idle' && (
            <>
              {/* Corner Targets */}
              <div className="absolute top-8 left-8 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-md z-10" />
              <div className="absolute top-8 right-8 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-md z-10" />
              <div className="absolute bottom-8 left-8 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-md z-10" />
              <div className="absolute bottom-8 right-8 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-md z-10" />
              
              {/* Laser Line */}
              <div className="absolute left-1/2 -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-bounce top-1/4 z-10 opacity-70" style={{ animationDuration: '2.5s' }} />
            </>
          )}

          {/* Locked / Closed Screen */}
          {!isSessionActive && (
            <div className="flex flex-col items-center justify-center text-center p-6 z-10">
              <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-4">
                <QrCode className="w-8 h-8" />
              </div>
              <p className="text-slate-300 font-bold text-sm">Scanner Dinonaktifkan</p>
              <p className="text-slate-500 text-xs mt-1.5 px-4 leading-normal">
                Sesi absensi sedang ditutup. Klik tombol &ldquo;Buka Sesi&rdquo; di atas untuk mengaktifkan scanner.
              </p>
            </div>
          )}

          {/* Video Container */}
          <div 
            id="qr-reader" 
            className={`w-full h-full object-cover transition-opacity duration-300 ${isSessionActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          />
        </div>

        {/* Scan Status Message & Feedback Toast */}
        <div className="w-full mt-6 min-h-[96px] flex items-center justify-center">
          {scanStatus === 'success' && (
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 items-center animate-scale-up">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-400 font-bold text-sm leading-tight">{scanMessage}</p>
                {scannedParticipant && (
                  <p className="text-slate-400 text-xs mt-1">
                    {scannedParticipant.nama_kelompok} • {scannedParticipant.nama_desa}
                  </p>
                )}
              </div>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3 items-center animate-scale-up">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-bold text-sm leading-tight">Gagal Absen</p>
                <p className="text-slate-300 text-xs mt-0.5">{scanMessage}</p>
                {scannedParticipant && (
                  <p className="text-slate-400 text-xs mt-1 font-medium">
                    Oleh: {scannedParticipant.nama}
                  </p>
                )}
              </div>
            </div>
          )}

          {scanStatus === 'idle' && isSessionActive && (
            <p className="text-slate-400 text-xs text-center px-8 leading-relaxed animate-pulse">
              Arahkan kamera ke QR Code peserta untuk mencatat kehadiran secara otomatis.
            </p>
          )}
        </div>

      </main>

      {/* Modal - Open Sesi */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Buka Sesi Absensi
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Semua orang yang membuka halaman scan pada domain ini akan tersinkronisasi ke sesi yang Anda buka.
            </p>
            <form onSubmit={handleOpenSession}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Nama Sesi Absensi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembukaan Hari Pertama, Sesi Malam"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isTogglingSession}
                  className="flex items-center gap-1 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 text-xs font-bold text-slate-950 rounded-xl transition-colors shadow-md shadow-teal-500/10"
                >
                  {isTogglingSession && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Buka Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
