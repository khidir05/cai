import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Fetch current active session (if any)
    const activeSessions = await query(
      'SELECT id, nama_sesi, tanggal, status, buka FROM sesi WHERE status = 1 LIMIT 1'
    );
    const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;

    // 2. Fetch basic counts
    const [pesertaCount] = await query('SELECT COUNT(*) as count FROM peserta');
    const [desaCount] = await query('SELECT COUNT(*) as count FROM desa');
    const [kelompokCount] = await query('SELECT COUNT(*) as count FROM kelompok');
    const [saranCount] = await query('SELECT COUNT(*) as count FROM saran');

    // 3. Fetch gender distribution
    // 1: Laki-laki, 2: Perempuan (as per schema comment)
    const genderStats = await query(
      'SELECT kelamin, COUNT(*) as count FROM peserta GROUP BY kelamin'
    );
    let maleCount = 0;
    let femaleCount = 0;
    genderStats.forEach((g: any) => {
      if (g.kelamin === 1) maleCount = g.count;
      if (g.kelamin === 2) femaleCount = g.count;
    });

    // 4. Fetch session attendance stats
    let activeSessionAttendanceCount = 0;
    if (activeSession) {
      const [attCount] = await query(
        'SELECT COUNT(*) as count FROM kehadiran WHERE sesi = ?',
        [activeSession.id]
      );
      activeSessionAttendanceCount = attCount.count;
    }

    // 5. Fetch sessions list
    const sessions = await query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM kehadiran k WHERE k.sesi = s.id) as total_hadir
       FROM sesi s 
       ORDER BY s.created_at DESC`
    );

    // 6. Fetch check-in logs (latest 100 check-ins)
    const kehadiranLog = await query(
      `SELECT k.id, k.waktu_scan, 
              p.nama as nama_peserta, p.kelamin, p.telp, p.id as peserta_id,
              d.nama_desa, kat.nama_kategori, kl.nama_kelompok,
              s.nama_sesi
       FROM kehadiran k
       JOIN peserta p ON k.peserta = p.id
       JOIN sesi s ON k.sesi = s.id
       LEFT JOIN desa d ON p.desa = d.id
       LEFT JOIN kategori kat ON p.kategori = kat.id
       LEFT JOIN kelompok kl ON p.kelompok = kl.id
       ORDER BY k.waktu_scan DESC
       LIMIT 100`
    );

    // 7. Fetch all saran submissions
    const saranList = await query(
      'SELECT id, pesan, kesan FROM saran ORDER BY id DESC'
    );

    // 8. Fetch all participants for testing & listing
    const pesertaList = await query(
      `SELECT p.id, p.nama, p.kelamin, p.telp,
              d.nama_desa, kat.nama_kategori, kl.nama_kelompok,
              (SELECT waktu_scan FROM kehadiran k WHERE k.peserta = p.id ORDER BY waktu_scan DESC LIMIT 1) as terakhir_absen
       FROM peserta p
       LEFT JOIN desa d ON p.desa = d.id
       LEFT JOIN kategori kat ON p.kategori = kat.id
       LEFT JOIN kelompok kl ON p.kelompok = kl.id
       ORDER BY p.nama ASC`
    );

    // 9. Fetch category breakdown for charts
    const categoryStats = await query(
      `SELECT kat.nama_kategori, COUNT(p.id) as count 
       FROM peserta p
       JOIN kategori kat ON p.kategori = kat.id
       GROUP BY kat.nama_kategori`
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalPeserta: pesertaCount.count,
        totalDesa: desaCount.count,
        totalKelompok: kelompokCount.count,
        totalSaran: saranCount.count,
        lakiLaki: maleCount,
        perempuan: femaleCount,
        kehadiranSesiAktif: activeSessionAttendanceCount,
      },
      activeSession,
      sessions,
      kehadiranLog,
      saranList,
      pesertaList,
      categoryStats,
    });
  } catch (error: any) {
    console.error('Failed to load dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

// POST: Manage dashboard actions (delete saran, delete log, reset data)
export async function POST(request: Request) {
  try {
    const { action, targetId } = await request.json();

    if (action === 'delete_saran') {
      await query('DELETE FROM saran WHERE id = ?', [targetId]);
      return NextResponse.json({ success: true, message: 'Saran berhasil dihapus.' });
    }

    if (action === 'delete_kehadiran') {
      await query('DELETE FROM kehadiran WHERE id = ?', [targetId]);
      return NextResponse.json({ success: true, message: 'Catatan kehadiran berhasil dihapus.' });
    }

    if (action === 'delete_sesi') {
      await query('DELETE FROM sesi WHERE id = ?', [targetId]);
      return NextResponse.json({ success: true, message: 'Sesi berhasil dihapus.' });
    }

    return NextResponse.json(
      { success: false, message: 'Aksi tidak valid.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Action failed:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
