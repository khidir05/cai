'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Square, QrCode, Loader2, AlertTriangle, KeyRound } from 'lucide-react';

export default function ScanPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  
  // Scanner access code state
  const [accessCode, setAccessCode] = useState<string>('');
  const [accessInput, setAccessInput] = useState<string>('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeError, setCodeError] = useState<string>('');

  // Scanner slot limitation
  const [isBlocked, setIsBlocked] = useState(false);
  const [scannerId, setScannerId] = useState<string>('');

  // Toggled view mode: 'scan' | 'data'
  const [viewMode, setViewMode] = useState<'scan' | 'data'>('scan');
  const [kehadiranList, setKehadiranList] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Scan states
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

  // 1. Initialize Access Code & Scanner Device ID
  useEffect(() => {
    let devId = localStorage.getItem('cai_scanner_device_id');
    if (!devId) {
      devId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('cai_scanner_device_id', devId);
    }
    setScannerId(devId);

    const savedCode = localStorage.getItem('cai_scanner_access_code');
    if (savedCode) {
      setAccessCode(savedCode);
    }
  }, []);

  // 2. Heartbeat to maintain session & verify limit + code validation
  useEffect(() => {
    if (!accessCode || !scannerId) return;

    const checkSlot = async () => {
      try {
        const res = await fetch('/api/scan/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scannerId, accessCode })
        });
        const data = await res.json();
        
        if (!data.success) {
          if (data.error === 'LIMIT_EXCEEDED') {
            setIsBlocked(true);
          } else if (data.error === 'INVALID_CODE') {
            alert('Kode akses dibatalkan atau telah dihapus oleh admin.');
            localStorage.removeItem('cai_scanner_access_code');
            setAccessCode('');
            setIsBlocked(false);
          }
        } else {
          setIsBlocked(false);
        }
      } catch (err) {
        console.error('Heartbeat check failed:', err);
      }
    };

    checkSlot();
    const interval = setInterval(checkSlot, 5000);
    return () => clearInterval(interval);
  }, [accessCode, scannerId]);

  // 3. Poll Session Status
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
    const interval = setInterval(() => {
      fetchSessionStatus(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 4. Fetch attendance list for 'data' mode
  const fetchAttendanceList = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/scan');
      const data = await res.json();
      if (data.success) {
        setKehadiranList(data.kehadiran || []);
      }
    } catch (err) {
      console.error('Error fetching attendance list:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'data' && !!accessCode) {
      fetchAttendanceList();
      const interval = setInterval(fetchAttendanceList, 3050);
      return () => clearInterval(interval);
    }
  }, [viewMode, accessCode]);

  // 5. Initialize QR Scanner with a 150ms timeout to ensure DOM container is rendered
  useEffect(() => {
    const isSessionActive = session && session.status === 1;
    const shouldStartScanner = isSessionActive && viewMode === 'scan' && !isBlocked && !!accessCode;
    
    if (!shouldStartScanner) {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch((e: any) => console.log('Scanner stop err:', e));
          }
        } catch (err) {
          console.log('Scanner stop err swallowed:', err);
        }
        scannerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let html5QrCodeInstance: any = null;

    // Small delay to ensure the div element is mounted in DOM
    const startTimeout = setTimeout(() => {
      const elementId = 'qr-reader';
      const container = document.getElementById(elementId);
      if (!container || !isMounted) return;

      import('html5-qrcode').then(({ Html5Qrcode }) => {
        if (!isMounted) return;

        html5QrCodeInstance = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCodeInstance;

        const config = { 
          fps: 10, 
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0
        };

        html5QrCodeInstance.start(
          { facingMode: 'environment' },
          config,
          async (decodedText: string) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            await handleQrCodeScanned(decodedText);
          },
          (errorMessage: string) => {
            // Ignore frame check warnings
          }
        ).catch((err: any) => {
          console.error('Error starting camera scanner:', err);
        });
      }).catch(err => {
        console.error('Failed to load html5-qrcode library:', err);
      });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(startTimeout);
      if (html5QrCodeInstance) {
        try {
          if (html5QrCodeInstance.isScanning) {
            html5QrCodeInstance.stop().catch((e: any) => console.log('Scanner cleanup stop err:', e));
          }
        } catch (err) {
          console.log('Scanner cleanup stop err swallowed:', err);
        }
      }
    };
  }, [session?.id, session?.status, viewMode, isBlocked, accessCode]);

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
        setScannedParticipant(data.peserta || { nama: 'Tidak Dikenal' });
      }
    } catch (error) {
      playBeep('error');
      setScanStatus('error');
      setScanMessage('Masalah koneksi. Gagal mencatat absensi.');
      setScannedParticipant({ nama: 'Tidak Dikenal' });
    } finally {
      setTimeout(() => {
        setScanStatus('idle');
        setScanMessage('');
        setScannedParticipant(null);
        isProcessingRef.current = false;
      }, 3500);
    }
  };

  // Verify access code form submit
  const handleVerifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessInput.trim()) return;

    setIsVerifyingCode(true);
    setCodeError('');
    try {
      const res = await fetch('/api/scan/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessInput.trim().toUpperCase() })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('cai_scanner_access_code', accessInput.trim().toUpperCase());
        setAccessCode(accessInput.trim().toUpperCase());
        setAccessInput('');
      } else {
        setCodeError(data.message || 'Kode akses tidak terdaftar.');
      }
    } catch (err) {
      console.error(err);
      setCodeError('Masalah koneksi. Silakan coba lagi.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const isSessionActive = session && session.status === 1;
  const sessionTitle = session ? session.nama_sesi : 'TIDAK ADA SESI';

  // 6. Access Code Form Screen (if accessCode is empty)
  if (!accessCode) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat bg-fixed p-6 font-sans text-slate-800"
        style={{ backgroundImage: "url('/bg.jpeg')" }}
      >
        <div className="absolute inset-0 bg-[#0066cc]/10 backdrop-blur-xs pointer-events-none" />
        
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 p-6 flex flex-col items-center shadow-2xl relative z-10">
          <img src="/logo.png" alt="CAI Logo" className="h-16 mb-4 object-contain" />
          <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-1">CAI 47 Ciltim 1</h2>
          <div className="w-8 h-1 bg-[#0066cc] rounded-full mb-6" />

          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <KeyRound className="w-4.5 h-4.5 text-[#0066cc]" />
            Aktivasi Scanner
          </h3>
          <p className="text-slate-400 text-[10px] text-center font-medium mb-5 px-3 leading-relaxed">
            Masukkan kode akses scanner yang diberikan oleh admin untuk mengaktifkan kamera absensi.
          </p>

          <form onSubmit={handleVerifyAccessCode} className="w-full space-y-4">
            <input
              type="text"
              required
              value={accessInput}
              onChange={(e) => setAccessInput(e.target.value)}
              placeholder="Contoh: SCAN47"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/20"
            />

            {codeError && (
              <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-wider leading-tight">{codeError}</p>
            )}

            <button
              type="submit"
              disabled={isVerifyingCode || !accessInput.trim()}
              className="w-full py-3.5 bg-[#0066cc] hover:bg-[#0052a3] disabled:bg-slate-200 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isVerifyingCode ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Aktifkan Kamera'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 7. Render Blocked View if scanner limit exceeded
  if (isBlocked) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat bg-fixed p-6 text-center font-sans text-slate-800"
        style={{ backgroundImage: "url('/bg.jpeg')" }}
      >
        <div className="absolute inset-0 bg-[#0066cc]/10 backdrop-blur-xs pointer-events-none" />
        
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 p-8 flex flex-col items-center shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 text-red-650 flex items-center justify-center mb-5 shadow-sm">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Akses Scanner Dibatasi</h1>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed font-semibold">
            Jumlah perangkat aktif yang mengakses scanner absensi telah mencapai batas maksimum.
          </p>
          <p className="text-slate-400 text-[10px] mt-6 leading-relaxed font-medium">
            Tutup tab scanner di perangkat lain atau hubungi Administrator untuk memperbarui pengaturan batas perangkat.
          </p>
        </div>
      </div>
    );
  }

  // 8. Render Scan View Mode (matching PDF Page 1)
  if (viewMode === 'scan') {
    return (
      <div 
        className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-slate-800 font-sans"
        style={{ backgroundImage: "url('/bg.jpeg')" }}
      >
        <div className="absolute inset-0 bg-[#0066cc]/5 backdrop-blur-2xs pointer-events-none" />

        {/* Custom Blue Header */}
        <header className="sticky top-0 z-40 w-full bg-[#0066cc] px-4 py-4 flex items-center shadow-md relative z-10">
          <button 
            onClick={() => {
              if(confirm('Keluar dari mode scanner?')) {
                localStorage.removeItem('cai_scanner_access_code');
                setAccessCode('');
              }
            }}
            className="text-white hover:opacity-85 transition-opacity"
            title="Keluar / Ganti Kode Akses"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center pr-6">
            <h1 className="text-lg font-bold text-white tracking-wide uppercase">
              {sessionTitle}
            </h1>
          </div>
        </header>

        {/* Main Scanner Card Area */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10">
          <div className="w-full max-w-[340px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 flex flex-col items-center transition-all duration-300">
            
            {/* Logo inside Card */}
            <img src="/logo.png" alt="CAI Logo" className="h-12 mb-3 object-contain" />
            <h2 className="text-sm font-black text-slate-900 tracking-widest uppercase mb-1">CAI 47 Ciltim 1</h2>
            <div className="w-6 h-0.5 bg-[#0066cc] rounded-full mb-4" />

            <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wide">
              SCAN DISINI
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
              Cek in peserta CAI 47
            </p>

            {/* QR Scanner Container */}
            <div className="relative w-[230px] h-[230px] bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden mt-5 flex items-center justify-center shadow-inner">
              
              {isSessionActive && (
                <>
                  {/* Corner Targets from Mockup */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-[4px] border-l-[4px] border-black rounded-tl-md z-20 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-[4px] border-r-[4px] border-black rounded-tr-md z-20 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-[4px] border-l-[4px] border-black rounded-bl-md z-20 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-[4px] border-r-[4px] border-black rounded-br-md z-20 pointer-events-none" />
                </>
              )}

              {/* Locked view when session inactive */}
              {!isSessionActive && (
                <div className="flex flex-col items-center text-center p-4 z-15">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <p className="text-slate-800 font-bold text-xs uppercase tracking-wider">Scanner Nonaktif</p>
                  <p className="text-slate-400 text-[10px] mt-1 px-2 leading-relaxed">
                    Sesi absensi sedang ditutup. Hubungi admin untuk membuka sesi absensi.
                  </p>
                </div>
              )}

              {/* HTML5 QR Camera Element */}
              <div 
                id="qr-reader" 
                className={`w-full h-full object-cover transition-opacity duration-300 ${isSessionActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              />
            </div>

            {/* Scan Feedback Text (Green / Red) */}
            <div className="mt-5 min-h-[60px] w-full flex flex-col items-center justify-center text-center px-2">
              {scanStatus === 'success' && (
                <p className="text-emerald-600 font-extrabold text-xs leading-normal animate-scale-up uppercase tracking-wider">
                  Peserta {scannedParticipant?.nama} berhasil Cek in
                </p>
              )}

              {scanStatus === 'error' && (
                <div className="flex flex-col items-center animate-scale-up">
                  <span className="text-red-650 font-black text-sm block tracking-widest uppercase">Stop!!</span>
                  <p className="text-red-650 font-extrabold text-[11px] mt-0.5 leading-normal uppercase tracking-wider">
                    Peserta {scannedParticipant?.nama} sudah Cek in
                  </p>
                </div>
              )}

              {scanStatus === 'idle' && isSessionActive && (
                <p className="text-slate-400 text-[10px] font-semibold leading-relaxed max-w-[200px] animate-pulse">
                  Arahkan kamera ke QR Code peserta untuk mencatat absensi.
                </p>
              )}
            </div>

          </div>

          {/* LIHAT DATA Button */}
          <div className="mt-6 w-full max-w-[340px]">
            <button
              onClick={() => setViewMode('data')}
              className="w-full py-4.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-xs rounded-2xl transition-all shadow-md active:scale-[0.99]"
            >
              LIHAT DATA
            </button>
          </div>

        </main>
      </div>
    );
  }

  // 9. Render Data View Mode (matching PDF Page 2)
  return (
    <div 
      className="flex flex-col min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-slate-800 font-sans"
      style={{ backgroundImage: "url('/bg.jpeg')" }}
    >
      <div className="absolute inset-0 bg-[#0066cc]/5 backdrop-blur-2xs pointer-events-none" />

      {/* Custom Blue Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0066cc] px-4 py-4 flex items-center shadow-md relative z-10">
        <button 
          onClick={() => setViewMode('scan')}
          className="text-white hover:opacity-85 transition-opacity"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center pr-6">
          <h1 className="text-lg font-bold text-white tracking-wide uppercase">
            HADIR {sessionTitle}
          </h1>
        </div>
      </header>

      {/* Main List Container */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 mt-2">
          
          {isLoadingData && kehadiranList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#0066cc]" />
              <span className="text-xs">Memuat data kehadiran...</span>
            </div>
          ) : kehadiranList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-4">
              <QrCode className="w-12 h-12 text-slate-300 mb-3" />
              <span className="text-sm font-bold text-slate-700">Belum Ada Kehadiran</span>
              <span className="text-xs text-slate-400 mt-1 max-w-[200px]">Belum ada peserta yang melakukan scan pada sesi ini.</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead className="bg-[#007ceb] text-white">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-xs font-bold text-center w-12">No</th>
                    <th scope="col" className="px-3 py-3 text-xs font-bold">Nama</th>
                    <th scope="col" className="px-3 py-3 text-xs font-bold text-center">Kategori</th>
                    <th scope="col" className="px-3 py-3 text-xs font-bold text-center">Kelompok</th>
                    <th scope="col" className="px-3 py-3 text-xs font-bold text-center">Desa</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-700 text-xs">
                  {kehadiranList.map((k: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-3 py-3.5 text-center font-semibold text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-3.5 font-bold text-slate-900">{k.nama}</td>
                      <td className="px-3 py-3.5 text-center font-medium text-slate-600">{k.nama_kategori || '-'}</td>
                      <td className="px-3 py-3.5 text-center font-medium text-slate-650">{k.nama_kelompok || '-'}</td>
                      <td className="px-3 py-3.5 text-center font-medium text-slate-600 whitespace-nowrap">{k.nama_desa || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
