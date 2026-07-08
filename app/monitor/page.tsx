'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, RefreshCw, Users, MessageSquare, QrCode, 
  Calendar, Clock, CheckCircle2, UserCheck, Trash2, Search,
  Filter, HelpCircle, X, ChevronRight, CheckCircle, Smartphone, User
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function MonitorPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'saran'>('logs');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDesa, setFilterDesa] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  // Selected participant for QR code display
  const [selectedPeserta, setSelectedPeserta] = useState<any>(null);

  // Fetch all dashboard data
  const fetchData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch('/api/monitor');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching monitor data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    // Poll every 5 seconds for live dashboard updates
    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Delete handlers
  const handleDelete = async (action: 'delete_saran' | 'delete_kehadiran' | 'delete_sesi', targetId: any) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetId }),
      });
      const resData = await res.json();
      if (resData.success) {
        fetchData(false);
      } else {
        alert(resData.message);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus data.');
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans">
        <LoaderSpinner size="lg" />
        <p className="mt-4 text-sm text-slate-400 font-medium">Memuat Dashboard CAI...</p>
      </div>
    );
  }

  // Get unique lists for filtering dropdowns
  const uniqueDesa = Array.from(new Set(data.pesertaList.map((p: any) => p.nama_desa).filter(Boolean)));
  const uniqueKelompok = Array.from(new Set(data.pesertaList.map((p: any) => p.nama_kelompok).filter(Boolean)));
  const uniqueKategori = Array.from(new Set(data.pesertaList.map((p: any) => p.nama_kategori).filter(Boolean)));

  // Filter participants list
  const filteredPeserta = data.pesertaList.filter((p: any) => {
    const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesa = filterDesa === '' || p.nama_desa === filterDesa;
    const matchesKelompok = filterKelompok === '' || p.nama_kelompok === filterKelompok;
    const matchesKategori = filterKategori === '' || p.nama_kategori === filterKategori;
    return matchesSearch && matchesDesa && matchesKelompok && matchesKategori;
  });

  const stats = data.stats;
  const activeSession = data.activeSession;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-900">
      
      {/* Dashboard Navbar */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
              CAI Event Monitor
            </h1>
            <p className="text-xxs text-slate-500 hidden sm:block">Panel pemantauan data kehadiran & masukan secara real-time</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 hover:text-slate-100 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Perbarui</span>
          </button>
          <Link 
            href="/scan" 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-xs font-bold rounded-lg text-slate-950 transition-all shadow-md shadow-teal-500/10"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Buka Scanner</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Row 1: KPI Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Attendance & Active Session */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                {activeSession ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xxs font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Sesi Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xxs font-semibold text-slate-400">
                    Sesi Ditutup
                  </span>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hadir di Sesi Ini</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-slate-100">{activeSession ? stats.kehadiranSesiAktif : 0}</span>
                  <span className="text-sm text-slate-500">/ {stats.totalPeserta} Peserta</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 line-clamp-1 max-w-[180px]">
                {activeSession ? activeSession.nama_sesi : 'Tidak ada sesi dibuka'}
              </span>
              {activeSession && (
                <span className="text-slate-500 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(activeSession.buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Total Registered Participants */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Terdaftar</h3>
                <span className="text-3xl font-extrabold text-slate-100 mt-1 block">{stats.totalPeserta}</span>
              </div>
            </div>

            {/* Gender breakdown bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/60">
              <div className="flex justify-between text-xxs text-slate-400 font-semibold mb-1">
                <span>L: {stats.lakiLaki} ({Math.round((stats.lakiLaki / (stats.totalPeserta || 1)) * 100)}%)</span>
                <span>P: {stats.perempuan} ({Math.round((stats.perempuan / (stats.totalPeserta || 1)) * 100)}%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-500" style={{ width: `${(stats.lakiLaki / (stats.totalPeserta || 1)) * 100}%` }} />
                <div className="h-full bg-pink-500" style={{ width: `${(stats.perempuan / (stats.totalPeserta || 1)) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Card 3: Total Suggestions */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kritik & Saran</h3>
                <span className="text-3xl font-extrabold text-slate-100 mt-1 block">{stats.totalSaran}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>Masukan Terkumpul</span>
              <span className="text-xxs px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">Anonim</span>
            </div>
          </div>
        </section>

        {/* Row 2: Main Content Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Logs / Suggestions (Takes 7 cols on desktop) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            
            {/* Header Tabs */}
            <div className="flex border-b border-slate-850 pb-1.5 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'logs' 
                      ? 'bg-teal-500 text-slate-950' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Logs Kehadiran ({data.kehadiranLog.length})
                </button>
                <button
                  onClick={() => setActiveTab('saran')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'saran' 
                      ? 'bg-pink-500 text-slate-950' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Kritik & Saran ({data.saranList.length})
                </button>
              </div>
            </div>

            {/* Tab: Logs Kehadiran */}
            {activeTab === 'logs' && (
              <div className="overflow-hidden">
                {data.kehadiranLog.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 flex flex-col items-center">
                    <Clock className="w-10 h-10 text-slate-700 mb-2" />
                    <p className="text-sm">Belum ada catatan kehadiran.</p>
                    <p className="text-xs text-slate-650 mt-1">Kehadiran akan muncul di sini setelah peserta memindai QR code mereka.</p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-850/65 pr-1 space-y-1 scrollbar-thin">
                    {data.kehadiranLog.map((log: any) => (
                      <div key={log.id} className="py-3 flex items-center justify-between group hover:bg-slate-850/30 px-2 rounded-xl transition-colors">
                        <div className="flex gap-3 items-center min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            log.kelamin === 1 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'
                          }`}>
                            {log.nama_peserta.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{log.nama_peserta}</h4>
                            <p className="text-xxs text-slate-450 mt-0.5 line-clamp-1">
                              {log.nama_kelompok} • {log.nama_desa} • Sesi: {log.nama_sesi}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-xs text-teal-400 font-semibold">Berhasil Scan</span>
                            <p className="text-xxs text-slate-500">
                              {new Date(log.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete('delete_kehadiran', log.id)}
                            className="p-1.5 hover:bg-slate-850 text-slate-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Hapus Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Kritik & Saran */}
            {activeTab === 'saran' && (
              <div className="overflow-hidden">
                {data.saranList.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 flex flex-col items-center">
                    <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
                    <p className="text-sm">Belum ada saran terkirim.</p>
                    <p className="text-xs text-slate-650 mt-1">Saran yang diisi oleh peserta lewat form saran akan tersaji di sini.</p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                    {data.saranList.map((saran: any) => (
                      <div key={saran.id} className="relative bg-slate-950/60 border border-slate-850/80 rounded-2xl p-4 hover:border-pink-500/20 transition-all group shadow-sm">
                        <button
                          onClick={() => handleDelete('delete_saran', saran.id)}
                          className="absolute top-3 right-3 p-1.5 hover:bg-slate-850 text-slate-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus Saran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-2.5">
                          <div>
                            <span className="text-xxs font-bold text-pink-400 uppercase tracking-wider">Kritik & Saran:</span>
                            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed whitespace-pre-wrap">{saran.pesan}</p>
                          </div>
                          
                          {saran.kesan && (
                            <div className="pt-2.5 border-t border-slate-900/60">
                              <span className="text-xxs font-bold text-purple-400 uppercase tracking-wider">Kesan Acara:</span>
                              <p className="text-xs text-slate-350 mt-0.5 leading-relaxed italic whitespace-pre-wrap">&ldquo;{saran.kesan}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Participant List & Tester (Takes 5 cols on desktop) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            
            <div>
              <h3 className="text-base font-bold text-slate-250 flex items-center gap-1.5">
                <QrCode className="w-5 h-5 text-teal-400" />
                Daftar Peserta & QR Tester
              </h3>
              <p className="text-xxs text-slate-450 mt-0.5">
                Tampilkan kode QR peserta di layar untuk pengujian scan absensi secara mudah.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atau ID peserta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Filters grid */}
              <div className="grid grid-cols-3 gap-1.5">
                <select
                  value={filterDesa}
                  onChange={(e) => setFilterDesa(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xxs text-slate-300 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">Desa</option>
                  {uniqueDesa.map((d: any) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={filterKelompok}
                  onChange={(e) => setFilterKelompok(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xxs text-slate-300 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">Kelompok</option>
                  {uniqueKelompok.map((k: any) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>

                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xxs text-slate-300 focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">Kategori</option>
                  {uniqueKategori.map((k: any) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Participants scrollbox */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-850/60 pr-1 scrollbar-thin">
              {filteredPeserta.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Filter className="w-8 h-8 text-slate-700 mx-auto mb-1.5" />
                  <p className="text-xs">Tidak menemukan hasil pencarian.</p>
                </div>
              ) : (
                filteredPeserta.map((peserta: any) => (
                  <div key={peserta.id} className="py-2.5 flex items-center justify-between hover:bg-slate-850/20 px-2 rounded-xl transition-colors group">
                    <div className="min-w-0 mr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 line-clamp-1">{peserta.nama}</span>
                        {peserta.terakhir_absen && (
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" title="Sudah pernah absen" />
                        )}
                      </div>
                      <p className="text-xxs text-slate-450 mt-0.5 line-clamp-1">
                        {peserta.id} • {peserta.nama_kelompok} • {peserta.nama_desa}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setSelectedPeserta(peserta)}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 group-hover:border-teal-500/40 hover:!bg-teal-500 hover:!text-slate-950 text-xxs font-bold text-slate-300 rounded-lg transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Code</span>
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>

        </section>

      </main>

      {/* QR Code Modal for Testing */}
      {selectedPeserta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl relative animate-scale-up text-center">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedPeserta(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-950/60 border border-slate-850 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-100">QR Code Test Tool</h3>
              <p className="text-xxs text-slate-450 mt-0.5">Pindai kode di bawah ini pada halaman /scan</p>
            </div>

            {/* QR display box */}
            <div className="bg-white p-5 rounded-2xl inline-block shadow-inner mb-4">
              <QRCodeSVG 
                value={selectedPeserta.id} 
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Participant details */}
            <div className="bg-slate-950/50 border border-slate-850/80 rounded-2xl p-4 text-left space-y-2">
              <div className="flex gap-2.5 items-center">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                  {selectedPeserta.kelamin === 1 ? 'L' : 'P'}
                </div>
                <div className="min-w-0">
                  <p className="text-xxs text-slate-500 font-bold uppercase tracking-wider">Nama Peserta</p>
                  <p className="text-sm font-bold text-slate-200 leading-tight line-clamp-1">{selectedPeserta.nama}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850/60 text-xxs">
                <div>
                  <p className="text-slate-550 font-semibold uppercase">ID Peserta</p>
                  <p className="text-slate-300 font-bold mt-0.5">{selectedPeserta.id}</p>
                </div>
                <div>
                  <p className="text-slate-550 font-semibold uppercase">Kategori</p>
                  <p className="text-slate-300 font-bold mt-0.5">{selectedPeserta.nama_kategori}</p>
                </div>
                <div>
                  <p className="text-slate-550 font-semibold uppercase">Kelompok</p>
                  <p className="text-slate-300 font-bold mt-0.5">{selectedPeserta.nama_kelompok}</p>
                </div>
                <div>
                  <p className="text-slate-550 font-semibold uppercase">Desa Asal</p>
                  <p className="text-slate-300 font-bold mt-0.5">{selectedPeserta.nama_desa}</p>
                </div>
              </div>
            </div>

            {/* Help instructions */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xxs text-teal-400 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Gunakan halaman /scan untuk memindai kode ini</span>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-slate-700 text-xs border-t border-slate-900/50 mt-12 bg-slate-900/20">
        CAI Monitoring Station • Mobile & Desktop Responsive
      </footer>
    </div>
  );
}

// Simple Helper Spinner
function LoaderSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  return (
    <div className={`${sizeClasses[size]} border-teal-500/20 border-t-teal-400 rounded-full animate-spin`} />
  );
}
