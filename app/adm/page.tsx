'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  LayoutDashboard, Users, FileSpreadsheet, Settings, LogOut,
  Printer, Share2, Search, Plus, Trash2, Download, Upload,
  UserCheck, User, MessageSquare, Calendar, Clock, AlertTriangle,
  Smartphone, UserPlus, ChevronDown, Check, Sparkles, RefreshCw, Loader2,
  Square, Play, Menu, X, Eye
} from 'lucide-react';

export default function AdminPage() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard State
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sesi' | 'riwayat' | 'peserta' | 'database' | 'settings'>('dashboard');
  // Search & Filtering (for participants list)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDesa, setFilterDesa] = useState('');
  const [filterKelompok, setFilterKelompok] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  // Add Participant Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPesertaId, setNewPesertaId] = useState('');
  const [newPesertaNama, setNewPesertaNama] = useState('');
  const [newPesertaKategori, setNewPesertaKategori] = useState('');
  const [newPesertaDesa, setNewPesertaDesa] = useState('');
  const [newPesertaKelompok, setNewPesertaKelompok] = useState('');
  const [newPesertaKelamin, setNewPesertaKelamin] = useState('1');
  const [newPesertaTelp, setNewPesertaTelp] = useState('');
  const [newPesertaUkuran, setNewPesertaUkuran] = useState('L');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Active Session Control Form State
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [isTogglingSession, setIsTogglingSession] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Settings Configuration State
  const [scannerLimitInput, setScannerLimitInput] = useState('5');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Printed QR Code Popup Modal State
  const [selectedPesertaQr, setSelectedPesertaQr] = useState<any>(null);

  // Riwayat Sesi Tab State
  const [selectedHistorySession, setSelectedHistorySession] = useState<any>(null);
  const [historyAttendanceList, setHistoryAttendanceList] = useState<any[]>([]);
  const [isLoadingHistoryAttendance, setIsLoadingHistoryAttendance] = useState(false);

  // Mobile UI States
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. Initial Authentication Check
  useEffect(() => {
    const logged = localStorage.getItem('cai_admin_logged_in');
    if (logged === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // 2. Fetch Data from API
  const fetchDashboardData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/adm');
      const json = await res.json();
      if (json.success) {
        setData(json);
        setScannerLimitInput(json.maxScanners.toString());
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData(true);
      // Polling for live attendance updates
      const interval = setInterval(() => {
        fetchDashboardData(false);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // 3. Handle Admin Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('cai_admin_logged_in', 'true');
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  // 4. Handle Log Out
  const handleLogOut = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari panel admin?')) {
      localStorage.removeItem('cai_admin_logged_in');
      setIsLoggedIn(false);
    }
  };

  // 5. Handle Open Sesi
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionNameInput.trim()) return;
    setIsTogglingSession(true);
    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open_session', nama_sesi: sessionNameInput })
      });
      const resJson = await res.json();
      if (resJson.success) {
        setSessionNameInput('');
        fetchDashboardData(false);
      } else {
        alert(resJson.message);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuka sesi.');
    } finally {
      setIsTogglingSession(false);
    }
  };

  // 6. Handle Close Sesi
  const handleCloseSession = async () => {
    if (!confirm('Apakah Anda yakin ingin menutup sesi absensi?')) return;
    setIsTogglingSession(true);
    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close_session' })
      });
      const resJson = await res.json();
      if (resJson.success) {
        fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menutup sesi.');
    } finally {
      setIsTogglingSession(false);
    }
  };

  const handleCopyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const fetchHistoryAttendance = async (session: any) => {
    setSelectedHistorySession(session);
    setIsLoadingHistoryAttendance(true);
    try {
      const res = await fetch(`/api/adm?sessionId=${session.id}`);
      const resJson = await res.json();
      if (resJson.success) {
        setHistoryAttendanceList(resJson.attendance || []);
      } else {
        alert(resJson.message);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data kehadiran sesi.');
    } finally {
      setIsLoadingHistoryAttendance(false);
    }
  };

  // 7. Handle Save Settings (Scanner device Limit)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', max_scanners: scannerLimitInput })
      });
      const resJson = await res.json();
      if (resJson.success) {
        alert('Pengaturan batas scanner berhasil diperbarui!');
        fetchDashboardData(false);
      } else {
        alert(resJson.message);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui pengaturan.');
    } finally {
      setIsSavingSettings(false);
    }
  };


  // 8. Handle Add Participant
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newPesertaId.trim() || !newPesertaNama.trim() || !newPesertaKategori || !newPesertaDesa || !newPesertaKelompok) {
      setFormError('Harap lengkapi semua kolom wajib.');
      return;
    }

    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_peserta',
          id: newPesertaId,
          nama: newPesertaNama,
          kategori: newPesertaKategori,
          desa: newPesertaDesa,
          kelompok: newPesertaKelompok,
          kelamin: parseInt(newPesertaKelamin, 10),
          telp: newPesertaTelp,
          ukuran_baju: newPesertaUkuran
        })
      });
      const resJson = await res.json();
      if (resJson.success) {
        setFormSuccess('Peserta berhasil ditambahkan!');
        setNewPesertaId('');
        setNewPesertaNama('');
        setNewPesertaTelp('');
        fetchDashboardData(false);
      } else {
        setFormError(resJson.message);
      }
    } catch (err) {
      console.error(err);
      setFormError('Gagal menambahkan peserta.');
    }
  };

  // 9. Handle Delete Participant
  const handleDeleteParticipant = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus peserta "${name}" (${id})?`)) return;
    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_peserta', targetId: id })
      });
      const resJson = await res.json();
      if (resJson.success) {
        fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus peserta.');
    }
  };

  // 10. Handle Delete Suggestion
  const handleDeleteSuggestion = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus saran ini?')) return;
    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_saran', targetId: id })
      });
      const resJson = await res.json();
      if (resJson.success) {
        fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus saran.');
    }
  };

  // 11. Handle Import Excel / CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        let parsedData: any[] = [];

        if (fileExt === 'xlsx' || fileExt === 'xls') {
          // Excel parser
          const dataBytes = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(dataBytes, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
        } else if (fileExt === 'csv') {
          // Simple CSV parser
          const text = evt.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
            const rowObject: any = {};
            headers.forEach((header, index) => {
              rowObject[header] = values[index];
            });
            parsedData.push(rowObject);
          }
        } else {
          alert('Format file tidak didukung. Harap unggah file XLSX atau CSV.');
          return;
        }

        if (parsedData.length === 0) {
          alert('File kosong atau format baris tidak sesuai.');
          return;
        }

        if (confirm(`Apakah Anda yakin ingin mengimport ${parsedData.length} data peserta?`)) {
          const res = await fetch('/api/adm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'import_peserta', pesertaList: parsedData })
          });
          const resJson = await res.json();
          alert(resJson.message);
          fetchDashboardData(false);
        }
      } catch (err) {
        console.error(err);
        alert('Gagal membaca dan mengimport file. Periksa kesesuaian kolom.');
      }
    };

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }

    // Reset input
    e.target.value = '';
  };

  // 12. Template & Data Exports (Excel, CSV, PDF)
  const downloadCsvTemplate = () => {
    const headers = 'id,nama,kategori,desa,kelompok,kelamin,telp,ukuran_baju\n';
    const sample = 'PES-999,Contoh Nama Lengkap,Kiriman,Cilacap Kota,Cilacap 1,L,08123456789,L\n';
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_import_peserta.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCsv = () => {
    if (!data?.pesertaList || data.pesertaList.length === 0) return;
    const headers = 'ID Peserta,Nama,Kategori,Kelompok,Desa,Jenis Kelamin,No Telepon,Ukuran Baju,Waktu Terakhir Absen\n';
    const rows = data.pesertaList.map((p: any) => {
      const gender = p.kelamin === 1 ? 'Laki-laki' : 'Perempuan';
      const lastAbsen = p.terakhir_absen ? new Date(p.terakhir_absen).toLocaleString('id-ID') : 'Belum Absen';
      return `"${p.id}","${p.nama}","${p.nama_kategori || ''}","${p.nama_kelompok || ''}","${p.nama_desa || ''}","${gender}","${p.telp || ''}","${p.ukuran_baju || ''}","${lastAbsen}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'data_peserta_cai.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (!data?.pesertaList || data.pesertaList.length === 0) return;
    const mappedData = data.pesertaList.map((p: any) => ({
      'ID Peserta': p.id,
      'Nama': p.nama,
      'Kategori': p.nama_kategori || '',
      'Kelompok': p.nama_kelompok || '',
      'Desa': p.nama_desa || '',
      'Jenis Kelamin': p.kelamin === 1 ? 'Laki-laki' : 'Perempuan',
      'No Telepon': p.telp || '',
      'Ukuran Baju': p.ukuran_baju || '',
      'Waktu Terakhir Absen': p.terakhir_absen ? new Date(p.terakhir_absen).toLocaleString('id-ID') : 'Belum Absen'
    }));

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Peserta');
    XLSX.writeFile(workbook, 'data_peserta_cai.xlsx');
  };

  const exportToPdf = () => {
    if (!data?.pesertaList || data.pesertaList.length === 0) return;
    const doc = new jsPDF();
    doc.text('REKAPITULASI DATA PESERTA CAI 47', 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 21);

    const tableRows = data.pesertaList.map((p: any, idx: number) => [
      idx + 1,
      p.id,
      p.nama,
      p.nama_kategori || '-',
      p.nama_kelompok || '-',
      p.nama_desa || '-',
      p.ukuran_baju || '-'
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['No', 'ID', 'Nama', 'Kategori', 'Kelompok', 'Desa', 'Ukuran']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 165, 225] }
    });

    doc.save('data_peserta_cai.pdf');
  };

  // Sessions Export and Action Handlers
  const exportSessionsToCsv = () => {
    if (!data?.sessionsList || data.sessionsList.length === 0) return;
    const headers = 'No,Nama Sesi,Tanggal,Waktu Buka,Waktu Tutup,Kode Akses,Status,Total Hadir\n';
    const rows = data.sessionsList.map((s: any, idx: number) => {
      const statusText = s.status === 1 ? 'Aktif' : 'Tutup';
      const bukaTime = s.buka ? new Date(s.buka).toLocaleString('id-ID') : '-';
      const tutupTime = s.tutup ? new Date(s.tutup).toLocaleString('id-ID') : '-';
      return `${idx + 1},"${s.nama_sesi}","${s.tanggal}","${bukaTime}","${tutupTime}","${s.access_code || ''}","${statusText}",${s.total_hadir}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'riwayat_sesi_cai.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSessionsToExcel = () => {
    if (!data?.sessionsList || data.sessionsList.length === 0) return;
    const mapped = data.sessionsList.map((s: any, idx: number) => ({
      'No': idx + 1,
      'Nama Sesi': s.nama_sesi,
      'Tanggal': s.tanggal,
      'Waktu Buka': s.buka ? new Date(s.buka).toLocaleString('id-ID') : '-',
      'Waktu Tutup': s.tutup ? new Date(s.tutup).toLocaleString('id-ID') : '-',
      'Kode Akses': s.access_code || '',
      'Status': s.status === 1 ? 'Aktif' : 'Tutup',
      'Total Hadir': s.total_hadir
    }));

    const worksheet = XLSX.utils.json_to_sheet(mapped);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Sesi');
    XLSX.writeFile(workbook, 'riwayat_sesi_cai.xlsx');
  };

  const exportSessionsToPdf = () => {
    if (!data?.sessionsList || data.sessionsList.length === 0) return;
    const doc = new jsPDF();
    doc.text('LAPORAN RIWAYAT SESI ABSENSI CAI 47', 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 21);

    const rows = data.sessionsList.map((s: any, idx: number) => [
      idx + 1,
      s.nama_sesi,
      new Date(s.tanggal).toLocaleDateString('id-ID'),
      s.buka ? new Date(s.buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
      s.tutup ? new Date(s.tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
      s.access_code || '-',
      s.status === 1 ? 'Aktif' : 'Tutup',
      `${s.total_hadir} Hadir`
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['No', 'Nama Sesi', 'Tanggal', 'Buka', 'Tutup', 'Kode Akses', 'Status', 'Total Hadir']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [30, 165, 225] }
    });

    doc.save('riwayat_sesi_cai.pdf');
  };

  const exportSingleSession = async (session: any, format: 'pdf' | 'excel') => {
    try {
      const res = await fetch(`/api/adm?sessionId=${session.id}`);
      const json = await res.json();
      if (!json.success || !json.attendance) {
        alert('Gagal mengambil data kehadiran untuk ekspor.');
        return;
      }
      const list = json.attendance;
      if (list.length === 0) {
        alert('Sesi ini belum memiliki data kehadiran untuk diekspor.');
        return;
      }

      if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text(`LAPORAN KEHADIRAN SESI: ${session.nama_sesi.toUpperCase()}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Tanggal: ${new Date(session.tanggal).toLocaleDateString('id-ID')} | Kode Akses: ${session.access_code || '-'}`, 14, 21);
        doc.text(`Total Hadir: ${list.length} Peserta | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 26);

        const rows = list.map((l: any, idx: number) => [
          idx + 1,
          l.peserta_id,
          l.nama,
          l.nama_kategori || '-',
          l.nama_kelompok || '-',
          l.nama_desa || '-',
          l.ukuran_baju || '-',
          new Date(l.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
        ]);

        autoTable(doc, {
          startY: 31,
          head: [['No', 'ID Peserta', 'Nama', 'Kategori', 'Kelompok', 'Desa', 'Ukuran', 'Waktu Scan']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [30, 165, 225] }
        });

        doc.save(`kehadiran_${session.nama_sesi.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      } else {
        const mapped = list.map((l: any, idx: number) => ({
          'No': idx + 1,
          'ID Peserta': l.peserta_id,
          'Nama': l.nama,
          'Kategori': l.nama_kategori || '',
          'Kelompok': l.nama_kelompok || '',
          'Desa': l.nama_desa || '',
          'Ukuran Baju': l.ukuran_baju || '',
          'Waktu Scan': new Date(l.waktu_scan).toLocaleString('id-ID')
        }));

        const worksheet = XLSX.utils.json_to_sheet(mapped);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Kehadiran Sesi');
        XLSX.writeFile(workbook, `kehadiran_${session.nama_sesi.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekspor data: ' + err.message);
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus sesi "${sessionName}"? Semua data scan kehadiran pada sesi ini juga akan dihapus secara permanen.`)) {
      return;
    }
    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_session', sessionId })
      });
      const json = await res.json();
      if (json.success) {
        alert('Sesi berhasil dihapus.');
        fetchDashboardData(false);
      } else {
        alert('Gagal menghapus sesi: ' + json.message);
      }
    } catch (err: any) {
      alert('Gagal menghubungi server: ' + err.message);
    }
  };

  const handleReopenSession = async (sessionId: string, sessionName: string) => {
    if (data?.activeSession) {
      alert('Gagal membuka kembali sesi. Ada sesi lain yang sedang aktif berjalan! Silakan tutup sesi aktif terlebih dahulu.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin membuka kembali sesi "${sessionName}"? Kode akses lama akan aktif kembali dan scan absensi bisa dilanjutkan.`)) {
      return;
    }
    try {
      const res = await fetch('/api/adm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen_session', sessionId })
      });
      const json = await res.json();
      if (json.success) {
        alert('Sesi berhasil dibuka kembali!');
        fetchDashboardData(false);
      } else {
        alert('Gagal membuka kembali sesi: ' + json.message);
      }
    } catch (err: any) {
      alert('Gagal menghubungi server: ' + err.message);
    }
  };

  // 13. Printable QR Card Action
  const triggerPrintQr = (peserta: any) => {
    setSelectedPesertaQr(peserta);
    // Let DOM update first then print
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // 14. Filter and Search logic for participant lists
  const filteredPeserta = data?.pesertaList?.filter((p: any) => {
    const matchesSearch = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDesa = filterDesa === '' || p.nama_desa === filterDesa;
    const matchesKelompok = filterKelompok === '' || p.nama_kelompok === filterKelompok;
    const matchesKategori = filterKategori === '' || p.nama_kategori === filterKategori;
    return matchesSearch && matchesDesa && matchesKelompok && matchesKategori;
  }) || [];

  // Render Login Page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f4f7fc] flex items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.png" alt="CAI Logo" className="h-16 mb-4 object-contain" />
            <h1 className="text-2xl font-black text-slate-900 tracking-wide">CAI EVENT ADMIN</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">Masukkan kredensial Anda untuk masuk panel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#63c5eb] focus:ring-1 focus:ring-[#63c5eb]/30 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#63c5eb] focus:ring-1 focus:ring-[#63c5eb]/30 transition-all placeholder:text-slate-400"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-xs font-semibold">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#63c5eb] hover:bg-[#4baecd] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] mt-2"
            >
              Masuk Sekarang
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Loading Dashboard Screen
  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-[#f4f7fc] flex flex-col items-center justify-center font-sans text-slate-500">
        <Loader2 className="w-10 h-10 text-[#63c5eb] animate-spin mb-4" />
        <span className="text-sm font-bold tracking-wide">Memuat Panel Admin CAI...</span>
      </div>
    );
  }

  const uniqueDesas = Array.from(new Set(data.pesertaList.map((p: any) => p.nama_desa).filter(Boolean)));
  const uniqueKelompoks = Array.from(new Set(data.pesertaList.map((p: any) => p.nama_kelompok).filter(Boolean)));
  const uniqueKategoris = Array.from(new Set(data.pesertaList.map((p: any) => p.nama_kategori).filter(Boolean)));

  const stats = data.stats;
  const activeSession = data.activeSession;

  return (
    <div className="min-h-screen bg-[#edf0f5] flex font-sans text-slate-800 relative">

      {/* -------------------- PRINT-ONLY CONTAINER -------------------- */}
      {selectedPesertaQr && (
        <div id="print-section" className="hidden print:block fixed inset-0 bg-white z-50 p-8 text-black text-center font-sans">
          <div className="max-w-xs mx-auto border-4 border-double border-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center">
            <img src="/logo.png" alt="CAI Logo" className="h-10 mb-4 object-contain" />
            <h2 className="text-lg font-black tracking-wide text-slate-900 leading-tight uppercase">CAI 47 Ciltim 1</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">KARTU PESERTA</p>

            <div className="my-6 border border-slate-350 p-2.5 bg-white rounded-xl shadow-inner">
              <QRCodeSVG value={selectedPesertaQr.id} size={150} />
            </div>

            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wide leading-snug">{selectedPesertaQr.nama}</h3>
            <p className="text-xs font-bold text-slate-500 tracking-wider mt-0.5">{selectedPesertaQr.id}</p>

            <div className="w-full border-t border-slate-200 mt-4 pt-3 flex flex-wrap justify-between text-[9px] font-semibold text-slate-650 uppercase">
              <span>Kat: {selectedPesertaQr.nama_kategori || '-'}</span>
              <span>Klp: {selectedPesertaQr.nama_kelompok || '-'}</span>
              <span>Desa: {selectedPesertaQr.nama_desa || '-'}</span>
              <span>Baju: {selectedPesertaQr.ukuran_baju || '-'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden print:hidden transition-opacity duration-300"
        />
      )}

      {/* -------------------- MAIN SIDEBAR -------------------- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#63c5eb] via-[#5dbbe0] to-[#2974c5] text-slate-900 flex flex-col print:hidden shadow-xl shrink-0 transition-transform duration-300 md:translate-x-0 md:relative md:flex ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="p-6 flex flex-col items-center border-b border-black/10 relative">
          {/* Close button for Mobile Sidebar */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute top-4 right-4 p-1 text-slate-850 hover:text-black md:hidden focus:outline-none"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>

          <img src="/logo.png" alt="CAI Logo" className="h-14 mb-3 object-contain animate-pulse" style={{ animationDuration: '3s' }} />
          <h2 className="text-sm font-extrabold tracking-widest text-[#041a30] uppercase text-center">CAI 47 Ciltim 1</h2>
          <p className="text-[9px] text-white font-black tracking-widest uppercase mt-0.5 drop-shadow-xs">ADMIN SYSTEM</p>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 py-3.5 transition-all text-xs border-none focus:outline-none ${activeTab === 'dashboard'
              ? 'bg-white text-slate-900 shadow-sm font-black px-8'
              : 'text-[#041a30]/85 hover:bg-white/10 hover:text-slate-950 font-bold px-8'
              }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('sesi'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 py-3.5 transition-all text-xs border-none focus:outline-none ${activeTab === 'sesi'
              ? 'bg-white text-slate-900 shadow-sm font-black px-8'
              : 'text-[#041a30]/85 hover:bg-white/10 hover:text-slate-950 font-bold px-8'
              }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span>Sesi & Akses</span>
          </button>

          <button
            onClick={() => { setActiveTab('riwayat'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 py-3.5 transition-all text-xs border-none focus:outline-none ${activeTab === 'riwayat'
              ? 'bg-white text-slate-900 shadow-sm font-black px-8'
              : 'text-[#041a30]/85 hover:bg-white/10 hover:text-slate-950 font-bold px-8'
              }`}
          >
            <Clock className="w-4.5 h-4.5" />
            <span>Riwayat Sesi</span>
          </button>

          <button
            onClick={() => { setActiveTab('peserta'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 py-3.5 transition-all text-xs border-none focus:outline-none ${activeTab === 'peserta'
              ? 'bg-white text-slate-900 shadow-sm font-black px-8'
              : 'text-[#041a30]/85 hover:bg-white/10 hover:text-slate-950 font-bold px-8'
              }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span>Peserta</span>
          </button>

          <button
            onClick={() => { setActiveTab('database'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 py-3.5 transition-all text-xs border-none focus:outline-none ${activeTab === 'database'
              ? 'bg-white text-slate-900 shadow-sm font-black px-8'
              : 'text-[#041a30]/85 hover:bg-white/10 hover:text-slate-950 font-bold px-8'
              }`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5" />
            <span>Database</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3.5 py-3.5 transition-all text-xs border-none focus:outline-none ${activeTab === 'settings'
              ? 'bg-white text-slate-900 shadow-sm font-black px-8'
              : 'text-[#041a30]/85 hover:bg-white/10 hover:text-slate-950 font-bold px-8'
              }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-black/10">
          <button
            onClick={handleLogOut}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#041a30]/10 hover:bg-[#041a30] hover:text-white rounded-xl text-xs font-bold text-[#041a30] transition-all border border-[#041a30]/15"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* -------------------- MAIN WORKSPACE -------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto print:hidden">

        {/* -------------------- PREMIUM HEADER -------------------- */}
        <header
          className="bg-cover bg-center h-48 px-8 py-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center shadow-inner relative transition-all duration-300 gap-4"
          style={{ backgroundImage: "url('/bg.jpeg')" }}
        >
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xs pointer-events-none" />

          {/* Left Title */}
          <div className="relative z-10 flex items-center">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-white bg-white/10 rounded-xl hover:bg-white/20 active:bg-white/30 md:hidden mr-3 focus:outline-none"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wide leading-tight text-white drop-shadow-md">
                Selamat Datang, CAI 47 Ciltim 1
              </h1>
              <p className="text-slate-100 text-xxs font-bold mt-1.5 drop-shadow-md">
                Perkemahan Akhir Tahun Ajaran Cinta Alam Indonesia
              </p>
            </div>
          </div>
        </header>

        {/* -------------------- MAIN PANELS CARD -------------------- */}
        <main className="p-6 -mt-10 relative z-20 flex-1">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 min-h-[500px]">

            {/* ==================== TAB 1: DASHBOARD ==================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">

                {/* Dashboard Stats KPI Row - Only Session and Attendance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sesi yang Berlangsung */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl animate-pulse" />
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 font-bold">
                          <Calendar className="w-6 h-6" />
                        </div>
                        {activeSession ? (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            Sesi Berlangsung
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-155 border border-slate-200 text-xs font-bold text-slate-500">
                            Sesi Ditutup
                          </span>
                        )}
                      </div>
                      <div className="mt-5">
                        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Sesi yang Berlangsung</h3>
                        <h4 className="text-xl font-black text-slate-900 mt-1.5">
                          {activeSession ? activeSession.nama_sesi : 'Tidak ada sesi aktif'}
                        </h4>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Tanggal: {activeSession ? new Date(activeSession.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                      {activeSession && (
                        <span className="text-slate-400 font-normal">
                          Mulai: {new Date(activeSession.buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Peserta yang Hadir */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-600">
                          Kehadiran
                        </span>
                      </div>
                      <div className="mt-5">
                        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Peserta yang Hadir</h3>
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-3xl font-black text-slate-900">
                            {activeSession ? stats.kehadiranSesiAktif : 0}
                          </span>
                          <span className="text-sm text-slate-400 font-bold">/ {stats.totalPeserta} Total Peserta</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${(stats.kehadiranSesiAktif / (stats.totalPeserta || 1)) * 105}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 font-semibold uppercase tracking-wider text-right">
                        Persentase: {Math.round((stats.kehadiranSesiAktif / (stats.totalPeserta || 1)) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Latest 5-10 scan names list */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Smartphone className="w-4.5 h-4.5 text-[#63c5eb]" />
                        Data Terbaru Peserta yang Scan
                      </h2>
                      <p className="text-[10px] text-slate-400 font-medium">Menampilkan 5 - 10 data scan paling akhir</p>
                    </div>
                    <button
                      onClick={() => fetchDashboardData(false)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Desktop View Table */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-150 bg-white">
                    <table className="min-w-full divide-y divide-slate-150 text-left">
                      <thead className="bg-[#1ea5e1] text-white font-bold">
                        <tr>
                          <th scope="col" className="px-5 py-3 text-xs font-bold text-center w-12 rounded-l-2xl">No</th>
                          <th scope="col" className="px-5 py-3 text-xs font-bold">Nama</th>
                          <th scope="col" className="px-5 py-3 text-xs font-bold">ID Peserta</th>
                          <th scope="col" className="px-5 py-3 text-xs font-bold">Kategori</th>
                          <th scope="col" className="px-5 py-3 text-xs font-bold">Kelompok</th>
                          <th scope="col" className="px-5 py-3 text-xs font-bold">Desa</th>
                          <th scope="col" className="px-5 py-3 text-xs font-bold text-center rounded-r-2xl">Waktu Scan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                        {data.kehadiranLog?.slice(0, 10).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">
                              Belum ada data scan sesi ini.
                            </td>
                          </tr>
                        ) : (
                          data.kehadiranLog?.slice(0, 10).map((log: any, idx: number) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                              <td className="px-5 py-3.5 font-bold text-slate-900">{log.nama_peserta}</td>
                              <td className="px-5 py-3.5 font-semibold text-slate-500 uppercase tracking-wider">{log.peserta_id}</td>
                              <td className="px-5 py-3.5 font-semibold text-slate-650">{log.nama_kategori || '-'}</td>
                              <td className="px-5 py-3.5 font-medium text-slate-600">{log.nama_kelompok || '-'}</td>
                              <td className="px-5 py-3.5 font-medium text-slate-650">{log.nama_desa || '-'}</td>
                              <td className="px-5 py-3.5 text-center font-bold text-[#63c5eb]">
                                {new Date(log.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View: Cards */}
                  <div className="block md:hidden space-y-3">
                    {data.kehadiranLog?.slice(0, 10).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100">
                        Belum ada data scan sesi ini.
                      </div>
                    ) : (
                      data.kehadiranLog?.slice(0, 10).map((log: any, idx: number) => (
                        <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="font-bold text-slate-400 text-[10px]">#{idx + 1} • {log.peserta_id}</span>
                            <span className="text-[10px] font-bold text-[#63c5eb]">
                              {new Date(log.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{log.nama_peserta}</h4>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                              <div>Kategori: <span className="text-slate-800 font-bold">{log.nama_kategori || '-'}</span></div>
                              <div>Kelompok: <span className="text-slate-800 font-bold">{log.nama_kelompok || '-'}</span></div>
                              <div>Desa: <span className="text-slate-800 font-bold">{log.nama_desa || '-'}</span></div>
                              <div>Ukuran: <span className="text-slate-800 font-bold">{log.ukuran_baju || '-'}</span></div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB 1.5: SESI & AKSES ==================== */}
            {activeTab === 'sesi' && (
              <div className="space-y-6">

                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Sesi Absensi & Akses Scanner</h2>
                  <p className="text-xs text-slate-400">Atur jalannya sesi absensi aktif dan dapatkan kode akses untuk perangkat scanner.</p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">Status Sesi & Akses Scanner</h3>

                  {activeSession ? (
                    <div className="space-y-6 text-center">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sesi Sedang Dibuka</p>
                        <h4 className="text-xl font-black text-slate-900 mt-2">{activeSession.nama_sesi}</h4>
                        <p className="text-xs text-slate-400 mt-1 font-semibold">
                          Mulai Sejak: {new Date(activeSession.buka).toLocaleString('id-ID')}
                        </p>

                        <div className="mt-6 border-t border-emerald-200/50 pt-5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">KODE AKSES SCANNER</p>
                          <div className="relative inline-block">
                            <span
                              onClick={() => handleCopyCode(activeSession.access_code)}
                              className="inline-block bg-[#63c5eb] hover:bg-[#4baecd] text-white font-mono font-black text-3xl px-6 py-3 rounded-2xl tracking-widest shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 select-all"
                              title="Klik untuk menyalin"
                            >
                              {activeSession.access_code || '-'}
                            </span>
                            {isCopied && (
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wide whitespace-nowrap animate-pulse">
                                Berhasil Disalin!
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-5 font-semibold px-4 leading-relaxed">
                            Klik pada kode di atas untuk menyalin, lalu bagikan ke petugas scan untuk digunakan masuk di rute <span className="text-[#63c5eb] font-bold">/scan</span>.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleCloseSession}
                        disabled={isTogglingSession}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        {isTogglingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4 fill-white" />}
                        TUTUP SESI ABSENSI
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleOpenSession} className="space-y-5">
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4.5 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
                        Tidak Ada Sesi Aktif
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nama Sesi Absensi Baru *</label>
                        <input
                          type="text"
                          required
                          value={sessionNameInput}
                          onChange={(e) => setSessionNameInput(e.target.value)}
                          placeholder="Contoh: Pembukaan Hari 1, Sesi Malam"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-[#63c5eb] focus:ring-1 focus:ring-[#63c5eb]/30"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isTogglingSession || !sessionNameInput.trim()}
                        className="w-full py-4 bg-[#63c5eb] hover:bg-[#4baecd] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        {isTogglingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                        BUKA SESI BARU & BUAT KODE AKSES
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}

            {/* ==================== TAB 1.6: RIWAYAT SESI ==================== */}
            {activeTab === 'riwayat' && (
              <div className="space-y-6">

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Riwayat Sesi Absensi</h2>
                    <p className="text-xs text-slate-400">Daftar seluruh sesi absensi yang pernah dibuka beserta total kehadiran peserta.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={exportSessionsToCsv}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xxs font-bold rounded-xl transition-all shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={exportSessionsToExcel}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1ea5e1] hover:bg-[#2974c5] text-white text-xxs font-bold rounded-xl transition-all shadow-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export Excel</span>
                    </button>
                    <button
                      onClick={exportSessionsToPdf}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1ea5e1] hover:bg-[#2974c5] text-white text-xxs font-bold rounded-xl transition-all shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>
                    <button
                      onClick={() => fetchDashboardData(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xxs font-bold rounded-xl transition-all border border-slate-200"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Session list table */}
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-150 bg-white">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-[#1ea5e1] text-white font-bold">
                      <tr>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center w-12 rounded-l-2xl">No</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold">Nama Sesi</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center">Tanggal</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center">Waktu Buka</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center">Waktu Tutup</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center">Kode Akses</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center">Status</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center">Total Hadir</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center w-72 rounded-r-2xl">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                      {data.sessionsList?.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-slate-400 font-semibold">
                            Belum ada riwayat sesi absensi.
                          </td>
                        </tr>
                      ) : (
                        data.sessionsList?.map((s: any, idx: number) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-4 font-bold text-slate-900">{s.nama_sesi}</td>
                            <td className="px-5 py-4 text-center font-semibold text-slate-500">
                              {new Date(s.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-5 py-4 text-center font-medium text-slate-600">
                              {s.buka ? new Date(s.buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB
                            </td>
                            <td className="px-5 py-4 text-center font-medium text-slate-600">
                              {s.tutup ? new Date(s.tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : (s.status === 1 ? 'Sedang Berjalan' : '-')}
                            </td>
                            <td className="px-5 py-4 text-center font-mono font-extrabold text-[#63c5eb] tracking-wider">
                              {s.access_code || '-'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              {s.status === 1 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600">
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500">
                                  Tutup
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center font-bold text-slate-900">
                              {s.total_hadir} Hadir
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => fetchHistoryAttendance(s)}
                                  className="p-1.5 bg-sky-50 text-sky-600 hover:bg-[#63c5eb] hover:text-slate-900 border border-sky-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                                  title="Lihat Daftar Hadir Sesi"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => exportSingleSession(s, 'pdf')}
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                                  title="Export PDF Kehadiran Sesi"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => exportSingleSession(s, 'excel')}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                                  title="Export Excel Kehadiran Sesi"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                </button>
                                {s.status === 0 && (
                                  <button
                                    onClick={() => handleReopenSession(s.id, s.nama_sesi)}
                                    className={`p-1.5 border rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center ${
                                      data?.activeSession
                                        ? 'bg-slate-50 text-slate-355 border-slate-150 cursor-not-allowed'
                                        : 'bg-indigo-50 text-indigo-650 hover:bg-indigo-650 hover:text-white border-indigo-100'
                                    }`}
                                    title={data?.activeSession ? 'Ada sesi lain yang sedang aktif' : 'Buka Kembali Sesi Ini'}
                                    disabled={!!data?.activeSession}
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteSession(s.id, s.nama_sesi)}
                                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-650 hover:text-white border border-red-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                                  title="Hapus Sesi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="block md:hidden space-y-3">
                  {data.sessionsList?.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100">
                      Belum ada riwayat sesi absensi.
                    </div>
                  ) : (
                    data.sessionsList?.map((s: any, idx: number) => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-400 text-[10px]">#{idx + 1} • {s.access_code || '-'}</span>
                          {s.status === 1 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-600">
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-500">
                              Tutup
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{s.nama_sesi}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Tanggal: {new Date(s.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px] text-slate-500 font-semibold border-t border-slate-100 pt-2">
                            <div>Buka: <span className="text-slate-800 font-bold">{s.buka ? new Date(s.buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span></div>
                            <div>Tutup: <span className="text-slate-800 font-bold">{s.tutup ? new Date(s.tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : (s.status === 1 ? 'Aktif' : '-')}</span></div>
                            <div className="col-span-2 text-[#1ea5e1] font-bold mt-1 text-xs">
                              Kehadiran: {s.total_hadir} Peserta
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 justify-end">
                          <button
                            onClick={() => fetchHistoryAttendance(s)}
                            className="p-2 bg-sky-50 text-sky-600 hover:bg-[#63c5eb] hover:text-slate-900 border border-sky-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                            title="Detail Sesi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportSingleSession(s, 'pdf')}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                            title="Export PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportSingleSession(s, 'excel')}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                            title="Export Excel"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                          {s.status === 0 && (
                            <button
                              onClick={() => handleReopenSession(s.id, s.nama_sesi)}
                              className={`p-2 border rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center ${
                                data?.activeSession
                                  ? 'bg-slate-50 text-slate-355 border-slate-150 cursor-not-allowed'
                                  : 'bg-indigo-50 text-indigo-650 hover:bg-indigo-650 hover:text-white border-indigo-100'
                              }`}
                              title={data?.activeSession ? 'Ada sesi lain yang sedang aktif' : 'Buka Kembali Sesi Ini'}
                              disabled={!!data?.activeSession}
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSession(s.id, s.nama_sesi)}
                            className="p-2 bg-red-50 text-red-650 hover:bg-red-650 hover:text-white border border-red-100 rounded-lg shadow-xs transition-all active:scale-95 flex items-center justify-center"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Session Attendance Detail Modal */}
                {selectedHistorySession && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-2xs p-4 animate-fade-in text-slate-800">
                    <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
                      {/* Modal Header */}
                      <div className="bg-gradient-to-r from-[#0e487f] to-[#041a30] p-5 text-white flex justify-between items-center">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Daftar Kehadiran</h3>
                          <h4 className="text-base font-black mt-0.5">{selectedHistorySession.nama_sesi}</h4>
                          <p className="text-[10px] text-slate-300 font-semibold mt-1">
                            Kode Akses: {selectedHistorySession.access_code || '-'} • Total Hadir: {selectedHistorySession.total_hadir} Peserta
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedHistorySession(null)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl text-xs font-bold transition-all text-white border border-white/10"
                        >
                          Tutup
                        </button>
                      </div>

                      {/* Modal Content - Attendance Table */}
                      <div className="p-6 overflow-y-auto flex-1">
                        {isLoadingHistoryAttendance ? (
                          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-[#63c5eb]" />
                            <span className="text-xs font-bold">Memuat daftar hadir...</span>
                          </div>
                        ) : historyAttendanceList.length === 0 ? (
                          <div className="text-center py-20 text-slate-450 text-xs font-bold">
                            Tidak ada peserta yang hadir pada sesi ini.
                          </div>
                        ) : (
                          <>
                            {/* Desktop View Table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-150 bg-white">
                              <table className="min-w-full divide-y divide-slate-150 text-left">
                                <thead className="bg-[#1ea5e1] text-white font-bold text-xxs">
                                  <tr>
                                    <th scope="col" className="px-4 py-2.5 text-xxs font-bold text-center w-12 rounded-l-2xl">No</th>
                                    <th scope="col" className="px-4 py-2.5 text-xxs font-bold">Nama</th>
                                    <th scope="col" className="px-4 py-2.5 text-xxs font-bold">ID Peserta</th>
                                    <th scope="col" className="px-4 py-2.5 text-xxs font-bold">Kategori</th>
                                    <th scope="col" className="px-4 py-2.5 text-xxs font-bold">Kelompok</th>
                                    <th scope="col" className="px-4 py-2.5 text-xxs font-bold">Desa</th>
                                    <th scope="col" className="px-4 py-2.5 text-xxs font-bold text-center rounded-r-2xl">Waktu Scan</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-750 text-xxs">
                                  {historyAttendanceList.map((log: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3 text-center font-bold text-slate-450">{idx + 1}</td>
                                      <td className="px-4 py-3 font-bold text-slate-900">{log.nama}</td>
                                      <td className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">{log.peserta_id}</td>
                                      <td className="px-4 py-3 font-semibold text-slate-600">{log.nama_kategori || '-'}</td>
                                      <td className="px-4 py-3 font-medium text-slate-650">{log.nama_kelompok || '-'}</td>
                                      <td className="px-4 py-3 font-medium text-slate-600">{log.nama_desa || '-'}</td>
                                      <td className="px-4 py-3 text-center font-bold text-[#63c5eb]">
                                        {new Date(log.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile View: Cards */}
                            <div className="block md:hidden space-y-3">
                              {historyAttendanceList.map((log: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <span className="font-bold text-slate-400 text-[10px]">#{idx + 1} • {log.peserta_id}</span>
                                    <span className="text-[10px] font-bold text-[#63c5eb]">
                                      {new Date(log.waktu_scan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-xs">{log.nama}</h4>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                                      <div>Kategori: <span className="text-slate-800 font-bold">{log.nama_kategori || '-'}</span></div>
                                      <div>Kelompok: <span className="text-slate-800 font-bold">{log.nama_kelompok || '-'}</span></div>
                                      <div>Desa: <span className="text-slate-800 font-bold">{log.nama_desa || '-'}</span></div>
                                      <div>Ukuran: <span className="text-slate-800 font-bold">{log.ukuran_baju || '-'}</span></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Modal Footer */}
                      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => setSelectedHistorySession(null)}
                          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-755 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                        >
                          Tutup Detail
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ==================== TAB 2: PESERTA ==================== */}
            {activeTab === 'peserta' && (
              <div className="space-y-5">

                {/* List Peserta Toolbar (Matching Page 3 PDF) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">List Peserta</h2>
                    <div className="flex items-center gap-1 text-slate-400 text-xxs font-semibold mt-0.5 uppercase tracking-wide">
                      <span>Sort by</span>
                      <span className="text-[#1ea5e1] flex items-center gap-0.5 cursor-pointer hover:underline">
                        Recently <ChevronDown className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Collapsible Add Form Toggle */}
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                    >
                      {showAddForm ? <ChevronDown className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      <span>{showAddForm ? 'Tutup Form' : 'Tambah Peserta'}</span>
                    </button>

                    <button
                      onClick={exportToPdf}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#1ea5e1] hover:bg-[#2974c5] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${window.location.origin}/saran`);
                          alert('Tautan saran berhasil disalin ke clipboard!');
                        } else {
                          alert(`Tautan: ${window.location.origin}/saran`);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#1ea5e1] hover:bg-[#2974c5] text-white text-xs font-bold rounded-xl transition-all shadow-md"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Form Tambah Peserta Collapsible */}
                {showAddForm && (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 shadow-inner">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1">
                      <Sparkles className="w-4.5 h-4.5 text-[#63c5eb]" />
                      Form Registrasi Peserta Baru
                    </h3>

                    <form onSubmit={handleAddParticipant} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">ID Peserta *</label>
                        <input
                          type="text"
                          required
                          value={newPesertaId}
                          onChange={(e) => setNewPesertaId(e.target.value)}
                          placeholder="Contoh: PES-009"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Nama Lengkap *</label>
                        <input
                          type="text"
                          required
                          value={newPesertaNama}
                          onChange={(e) => setNewPesertaNama(e.target.value)}
                          placeholder="Contoh: Khidir Afwan"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Kategori *</label>
                        <select
                          required
                          value={newPesertaKategori}
                          onChange={(e) => setNewPesertaKategori(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        >
                          <option value="">-- Pilih Kategori --</option>
                          {data.lookups?.kategoris.map((k: any) => (
                            <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Kelompok *</label>
                        <select
                          required
                          value={newPesertaKelompok}
                          onChange={(e) => setNewPesertaKelompok(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        >
                          <option value="">-- Pilih Kelompok --</option>
                          {data.lookups?.kelompoks.map((kl: any) => (
                            <option key={kl.id} value={kl.id}>{kl.nama_kelompok}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Desa *</label>
                        <select
                          required
                          value={newPesertaDesa}
                          onChange={(e) => setNewPesertaDesa(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        >
                          <option value="">-- Pilih Desa --</option>
                          {data.lookups?.desas.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.nama_desa}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Jenis Kelamin</label>
                        <select
                          value={newPesertaKelamin}
                          onChange={(e) => setNewPesertaKelamin(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        >
                          <option value="1">Laki-laki</option>
                          <option value="2">Perempuan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">No Telepon</label>
                        <input
                          type="text"
                          value={newPesertaTelp}
                          onChange={(e) => setNewPesertaTelp(e.target.value)}
                          placeholder="Contoh: 0812..."
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 mb-1 uppercase tracking-wider">Ukuran Baju</label>
                        <select
                          value={newPesertaUkuran}
                          onChange={(e) => setNewPesertaUkuran(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                        >
                          {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((sz) => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-4 flex justify-between items-center border-t border-slate-200 pt-3 mt-1">
                        <div className="text-[10px] font-semibold text-slate-450 uppercase">
                          {formError && <span className="text-red-500">{formError}</span>}
                          {formSuccess && <span className="text-emerald-600">{formSuccess}</span>}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-lg transition-all"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-md"
                          >
                            Simpan Peserta
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Filter and Search Bar row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl shadow-xs">
                  {/* Text search */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama atau ID..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-[#63c5eb]"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>

                  {/* Filter Kategori */}
                  <select
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                  >
                    <option value="">Semua Kategori</option>
                    {uniqueKategoris.map((k: any) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>

                  {/* Filter Kelompok */}
                  <select
                    value={filterKelompok}
                    onChange={(e) => setFilterKelompok(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                  >
                    <option value="">Semua Kelompok</option>
                    {uniqueKelompoks.map((k: any) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>

                  {/* Filter Desa */}
                  <select
                    value={filterDesa}
                    onChange={(e) => setFilterDesa(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#63c5eb]"
                  >
                    <option value="">Semua Desa</option>
                    {uniqueDesas.map((d: any) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Participants list table (Layout matching Page 3 PDF                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-[#1ea5e1] text-white font-bold">
                      <tr>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold rounded-l-2xl">Nama</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold">Kategori</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold">Kelompok</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold">Desa</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center">Ukuran</th>
                        <th scope="col" className="px-5 py-3.5 text-xs font-bold text-center rounded-r-2xl print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-slate-700 text-xs">
                      {filteredPeserta.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-20 text-slate-400 font-semibold">
                            Tidak ada data peserta yang cocok.
                          </td>
                        </tr>
                      ) : (
                        filteredPeserta.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-4">
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">{p.nama}</span>
                                <span className="text-[10px] text-slate-450 font-bold block mt-0.5 uppercase tracking-wider">{p.id}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-655">{p.nama_kategori || '-'}</td>
                            <td className="px-5 py-4 font-semibold text-slate-600">{p.nama_kelompok || '-'}</td>
                            <td className="px-5 py-4 font-semibold text-slate-655">{p.nama_desa || '-'}</td>
                            <td className="px-5 py-4 text-center font-black text-slate-800">{p.ukuran_baju || '-'}</td>
                            <td className="px-5 py-4 text-center print:hidden whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => triggerPrintQr(p)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#63c5eb]/10 text-[#63c5eb] hover:bg-[#63c5eb] hover:text-white font-bold text-[10px] rounded-lg transition-all"
                                  title="Print Participant QR Card"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Cetak QR</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteParticipant(p.id, p.nama)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Hapus Peserta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View: Cards */}
                <div className="block md:hidden space-y-3">
                  {filteredPeserta.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100">
                      Tidak ada data peserta yang cocok.
                    </div>
                  ) : (
                    filteredPeserta.map((p: any) => (
                      <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-slate-900 text-sm">{p.nama}</span>
                          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{p.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                          <div>Kategori: <span className="text-slate-800 font-bold">{p.nama_kategori || '-'}</span></div>
                          <div>Kelompok: <span className="text-slate-800 font-bold">{p.nama_kelompok || '-'}</span></div>
                          <div>Desa: <span className="text-slate-800 font-bold">{p.nama_desa || '-'}</span></div>
                          <div>Ukuran: <span className="text-slate-800 font-bold">{p.ukuran_baju || '-'}</span></div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-end">
                          <button
                            onClick={() => triggerPrintQr(p)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#63c5eb]/10 text-[#63c5eb] hover:bg-[#63c5eb] hover:text-white font-bold text-[10px] rounded-lg transition-all"
                            title="Print Participant QR Card"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak QR</span>
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(p.id, p.nama)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Hapus Peserta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Show More Chevron Down footer (mockup matching) */}
                <div className="flex flex-col items-center justify-center pt-2 border-t border-slate-100 text-[10px] font-extrabold text-[#63c5eb]">
                  <span className="cursor-pointer hover:underline uppercase tracking-widest flex items-center gap-1">
                    Show More
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#63c5eb] mt-0.5 animate-bounce" />
                </div>

              </div>
            )}

            {/* ==================== TAB 3: REPORTING ==================== */}
            {activeTab === 'database' && (
              <div className="space-y-6">

                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Database & Data Tools</h2>
                  <p className="text-xs text-slate-400">Unggah data peserta masal atau unduh hasil rekapitulasi kehadiran.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Panel Import Data */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <Download className="w-4.5 h-4.5 text-[#63c5eb]" />
                      Import Data Peserta
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Tambahkan peserta dalam jumlah besar sekaligus menggunakan berkas template. Format file harus CSV atau Excel (XLSX). Kolom yang dibutuhkan:
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">id</code>,
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">nama</code>,
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">kategori</code>,
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">desa</code>,
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">kelompok</code>,
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">kelamin</code> (L/P),
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">telp</code>, dan
                      <code className="text-blue-600 bg-blue-50 px-1 rounded mx-1 font-bold">ukuran_baju</code>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={downloadCsvTemplate}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Unduh Template CSV</span>
                      </button>

                      <label className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Pilih & Unggah File</span>
                        <input
                          type="file"
                          accept=".csv, .xlsx, .xls"
                          onChange={handleImportFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Panel Export Data */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-[#63c5eb]" />
                      Export Data Peserta
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Unduh dan cetak seluruh daftar peserta beserta dengan status absensi terakhir mereka. Pilih format ekspor yang Anda inginkan di bawah ini.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      <button
                        onClick={exportToCsv}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-300/40"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>

                      <button
                        onClick={exportToExcel}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Excel</span>
                      </button>

                      <button
                        onClick={exportToPdf}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-[#63c5eb] border border-blue-200 text-xs font-bold rounded-xl transition-all"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Export PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ==================== TAB 4: SETTINGS ==================== */}
            {activeTab === 'settings' && (
              <div className="space-y-6">

                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-base font-bold text-slate-900">System Configurations</h2>
                  <p className="text-xs text-slate-400">Kelola kuota perangkat dan pembatasan operasional scanner absensi.</p>
                </div>

                <div className="max-w-md bg-slate-50 border border-slate-150 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
                    <Smartphone className="w-4.5 h-4.5 text-[#63c5eb]" />
                    Batasi Akses Scanner Absensi
                  </h3>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 mb-1.5 uppercase tracking-wider">Jumlah Maksimal Perangkat Scanner (/scan)</label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          min="1"
                          required
                          value={scannerLimitInput}
                          onChange={(e) => setScannerLimitInput(e.target.value)}
                          className="bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:outline-none w-28 focus:border-[#63c5eb]"
                        />
                        <button
                          type="submit"
                          disabled={isSavingSettings}
                          className="px-5 py-2.5 bg-[#63c5eb] hover:bg-[#4baecd] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                        >
                          {isSavingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Simpan Pengaturan</span>
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                        Pengaturan ini membatasi jumlah tab browser unik yang boleh membuka rute `/scan` secara bersamaan. Slot kosong dilepas otomatis jika scanner ditutup selama 12 detik.
                      </p>
                    </div>
                  </form>
                </div>

              </div>
            )}

          </div>
        </main>

        {/* Global Footer info */}
        <footer className="py-6 text-center text-slate-400 text-xs font-semibold uppercase tracking-widest border-t border-slate-200 mt-6 print:hidden">
          CAI Management System © {new Date().getFullYear()}
        </footer>

      </div>
    </div>
  );
}
