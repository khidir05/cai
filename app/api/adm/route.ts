import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

// GET: Fetch all admin dashboard data
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (sessionId) {
      const attendance = await query(
        `SELECT k.waktu_scan, p.nama, p.id as peserta_id, p.ukuran_baju,
                d.nama_desa, kat.nama_kategori, kl.nama_kelompok
         FROM kehadiran k
         JOIN peserta p ON k.peserta = p.id
         LEFT JOIN desa d ON p.desa = d.id
         LEFT JOIN kategori kat ON p.kategori = kat.id
         LEFT JOIN kelompok kl ON p.kelompok = kl.id
         WHERE k.sesi = ?
         ORDER BY k.waktu_scan ASC`,
        [sessionId]
      );
      return NextResponse.json({ success: true, attendance });
    }

    // 0. Fetch all sessions list
    const sessionsList = await query(
      `SELECT s.id, s.nama_sesi, s.tanggal, s.status, s.buka, s.tutup, s.access_code,
              (SELECT COUNT(*) FROM kehadiran WHERE sesi = s.id) as total_hadir
       FROM sesi s
       ORDER BY s.created_at DESC`
    );
    // 1. Active session details
    const activeSessions = await query(
      'SELECT id, nama_sesi, tanggal, status, buka, access_code FROM sesi WHERE status = 1 LIMIT 1'
    );
    const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;

    // 2. Settings
    let maxScanners = 5;
    const settings = await query("SELECT `value` FROM settings WHERE `key` = 'max_scanners' LIMIT 1");
    if (settings && settings.length > 0) {
      maxScanners = parseInt(settings[0].value, 10) || 5;
    }

    // 3. Stats counts
    const [pesertaCount] = await query('SELECT COUNT(*) as count FROM peserta');
    const [desaCount] = await query('SELECT COUNT(*) as count FROM desa');
    const [kelompokCount] = await query('SELECT COUNT(*) as count FROM kelompok');
    const [saranCount] = await query('SELECT COUNT(*) as count FROM saran');

    // 4. Active session attendance count
    let activeSessionAttendanceCount = 0;
    if (activeSession) {
      const [attCount] = await query(
        'SELECT COUNT(*) as count FROM kehadiran WHERE sesi = ?',
        [activeSession.id]
      );
      activeSessionAttendanceCount = attCount.count;
    }

    // 5. Gender distribution
    const genderStats = await query(
      'SELECT kelamin, COUNT(*) as count FROM peserta GROUP BY kelamin'
    );
    let maleCount = 0;
    let femaleCount = 0;
    genderStats.forEach((g: any) => {
      if (g.kelamin === 1) maleCount = g.count;
      if (g.kelamin === 2) femaleCount = g.count;
    });

    // 6. Category breakdown
    const categoryStats = await query(
      `SELECT kat.nama_kategori, COUNT(p.id) as count 
       FROM peserta p
       JOIN kategori kat ON p.kategori = kat.id
       GROUP BY kat.nama_kategori`
    );

    // 7. All participants list
    const pesertaList = await query(
      `SELECT p.id, p.nama, p.kelamin, p.telp, p.ukuran_baju,
              d.nama_desa, kat.nama_kategori, kl.nama_kelompok,
              (SELECT waktu_scan FROM kehadiran k WHERE k.peserta = p.id ORDER BY waktu_scan DESC LIMIT 1) as terakhir_absen
       FROM peserta p
       LEFT JOIN desa d ON p.desa = d.id
       LEFT JOIN kategori kat ON p.kategori = kat.id
       LEFT JOIN kelompok kl ON p.kelompok = kl.id
       ORDER BY p.nama ASC`
    );

    // 8. Lookup tables for dropdowns
    const desas = await query('SELECT id, nama_desa FROM desa ORDER BY nama_desa ASC');
    const kategoris = await query('SELECT id, nama_kategori FROM kategori ORDER BY nama_kategori ASC');
    const kelompoks = await query('SELECT id, nama_kelompok FROM kelompok ORDER BY nama_kelompok ASC');

    // 9. Saran list
    const saranList = await query('SELECT id, pesan, kesan FROM saran ORDER BY id DESC');

    // 10. Real-time check-in log (latest 100) for active session only
    let kehadiranLog = [];
    if (activeSession) {
      kehadiranLog = await query(
        `SELECT k.id, k.waktu_scan, 
                p.nama as nama_peserta, p.kelamin, p.id as peserta_id, p.ukuran_baju,
                d.nama_desa, kat.nama_kategori, kl.nama_kelompok,
                s.nama_sesi
         FROM kehadiran k
         JOIN peserta p ON k.peserta = p.id
         JOIN sesi s ON k.sesi = s.id
         LEFT JOIN desa d ON p.desa = d.id
         LEFT JOIN kategori kat ON p.kategori = kat.id
         LEFT JOIN kelompok kl ON p.kelompok = kl.id
         WHERE k.sesi = ?
         ORDER BY k.waktu_scan DESC
         LIMIT 100`,
        [activeSession.id]
      );
    }

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
      maxScanners,
      activeSession,
      sessionsList,
      pesertaList,
      saranList,
      kehadiranLog,
      lookups: { desas, kategoris, kelompoks },
      categoryStats
    });
  } catch (error: any) {
    console.error('Failed to load admin data:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

// POST: Handle admin actions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Add participant
    if (action === 'add_peserta') {
      const { id, nama, kategori, desa, kelompok, kelamin, telp, ukuran_baju } = body;

      if (!id || !nama || !kategori || !desa || !kelompok || !kelamin || !ukuran_baju) {
        return NextResponse.json({ success: false, message: 'Semua kolom bertanda * wajib diisi.' }, { status: 400 });
      }

      // Check duplicate ID
      const duplicate = await query('SELECT id FROM peserta WHERE id = ? LIMIT 1', [id.trim()]);
      if (duplicate && duplicate.length > 0) {
        return NextResponse.json({ success: false, message: `ID "${id}" sudah digunakan oleh peserta lain.` }, { status: 400 });
      }

      await query(
        `INSERT INTO peserta (id, nama, kategori, desa, kelompok, kelamin, telp, ukuran_baju) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id.trim(), nama.trim(), kategori, desa, kelompok, kelamin, (telp || '').trim(), ukuran_baju.trim()]
      );

      return NextResponse.json({ success: true, message: 'Peserta berhasil ditambahkan!' });
    }

    // 2. Delete participant
    if (action === 'delete_peserta') {
      const { targetId } = body;
      await query('DELETE FROM peserta WHERE id = ?', [targetId]);
      return NextResponse.json({ success: true, message: 'Peserta berhasil dihapus.' });
    }

    // 3. Open session
    if (action === 'open_session') {
      const { nama_sesi } = body;
      if (!nama_sesi || nama_sesi.trim() === '') {
        return NextResponse.json({ success: false, message: 'Nama sesi harus diisi.' }, { status: 400 });
      }

      // Close all currently active sessions
      await query('UPDATE sesi SET status = 0, tutup = CURRENT_TIMESTAMP WHERE status = 1');

      // Create new session
      const id = crypto.randomUUID();
      const today = new Date().toISOString().slice(0, 10);
      
      // Auto-generate 4 random letters/numbers code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let randomCode = '';
      for (let i = 0; i < 4; i++) {
        randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const accessCode = 'CAI-' + randomCode;

      await query(
        'INSERT INTO sesi (id, nama_sesi, tanggal, status, buka, access_code) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, ?)',
        [id, nama_sesi.trim(), today, accessCode]
      );

      return NextResponse.json({ success: true, message: 'Sesi absensi berhasil dibuka.', accessCode });
    }

    // 4. Close session
    if (action === 'close_session') {
      await query('UPDATE sesi SET status = 0, tutup = CURRENT_TIMESTAMP WHERE status = 1');
      return NextResponse.json({ success: true, message: 'Sesi absensi berhasil ditutup.' });
    }

    // 5. Update scanner setting limit
    if (action === 'save_settings') {
      const { max_scanners } = body;
      const limitVal = parseInt(max_scanners, 10);
      if (isNaN(limitVal) || limitVal < 1) {
        return NextResponse.json({ success: false, message: 'Batas scanner tidak valid.' }, { status: 400 });
      }

      await query(
        "INSERT INTO settings (`key`, `value`) VALUES ('max_scanners', ?) ON DUPLICATE KEY UPDATE `value` = ?",
        [limitVal.toString(), limitVal.toString()]
      );

      return NextResponse.json({ success: true, message: 'Pengaturan berhasil diperbarui.' });
    }

    // 6. Delete suggestion
    if (action === 'delete_saran') {
      const { targetId } = body;
      await query('DELETE FROM saran WHERE id = ?', [targetId]);
      return NextResponse.json({ success: true, message: 'Saran berhasil dihapus.' });
    }

    // 7. Import participants mass data (Excel/CSV)
    if (action === 'import_peserta') {
      const { pesertaList } = body;
      if (!pesertaList || !Array.isArray(pesertaList)) {
        return NextResponse.json({ success: false, message: 'Format data tidak valid.' }, { status: 400 });
      }

      // Fetch existing lookups to optimize inserts
      const desas = await query('SELECT id, nama_desa FROM desa');
      const kategoris = await query('SELECT id, nama_kategori FROM kategori');
      const kelompoks = await query('SELECT id, nama_kelompok FROM kelompok');

      const desaMap = new Map<string, number>(desas.map((d: any) => [d.nama_desa.toLowerCase().trim(), d.id]));
      const kategoriMap = new Map<string, number>(kategoris.map((k: any) => [k.nama_kategori.toLowerCase().trim(), k.id]));
      const kelompokMap = new Map<string, number>(kelompoks.map((k: any) => [k.nama_kelompok.toLowerCase().trim(), k.id]));

      let successCount = 0;
      let errorCount = 0;

      for (const row of pesertaList) {
        try {
          const rawId = (row.id || '').toString().trim();
          const rawNama = (row.nama || '').toString().trim();
          const rawKategori = (row.kategori || '').toString().trim();
          const rawDesa = (row.desa || '').toString().trim();
          const rawKelompok = (row.kelompok || '').toString().trim();
          const rawKelamin = (row.kelamin || row.jenis_kelamin || '').toString().trim();
          const rawTelp = (row.telp || row.no_telp || row.telepon || '').toString().trim();
          const rawUkuran = (row.ukuran_baju || row.ukuran || '').toString().trim();

          if (!rawId || !rawNama) {
            errorCount++;
            continue;
          }

          // Handle Desa Lookup
          let desaId = null;
          if (rawDesa) {
            const lowerDesa = rawDesa.toLowerCase();
            if (desaMap.has(lowerDesa)) {
              desaId = desaMap.get(lowerDesa);
            } else {
              const insertRes = await query('INSERT INTO desa (nama_desa) VALUES (?)', [rawDesa]);
              desaId = insertRes.insertId;
              desaMap.set(lowerDesa, desaId);
            }
          }

          // Handle Kelompok Lookup
          let kelompokId = null;
          if (rawKelompok) {
            const lowerKel = rawKelompok.toLowerCase();
            if (kelompokMap.has(lowerKel)) {
              kelompokId = kelompokMap.get(lowerKel);
            } else {
              const insertRes = await query('INSERT INTO kelompok (nama_kelompok) VALUES (?)', [rawKelompok]);
              kelompokId = insertRes.insertId;
              kelompokMap.set(lowerKel, kelompokId);
            }
          }

          // Handle Kategori Lookup
          let kategoriId = null;
          if (rawKategori) {
            const lowerKat = rawKategori.toLowerCase();
            if (kategoriMap.has(lowerKat)) {
              kategoriId = kategoriMap.get(lowerKat);
            } else {
              // Standardize case or dynamically insert
              // If it matches name in lower like ki->KI, 4s->4S, pondok->Pondok
              let formattedKatName = rawKategori;
              if (lowerKat === 'ki') formattedKatName = 'KI';
              else if (lowerKat === '4s') formattedKatName = '4S';
              else if (lowerKat === 'mt') formattedKatName = 'MT';
              else if (lowerKat === 'pondok') formattedKatName = 'Pondok';
              else if (lowerKat === 'kiriman') formattedKatName = 'Kiriman';

              const insertRes = await query('INSERT INTO kategori (nama_kategori) VALUES (?)', [formattedKatName]);
              kategoriId = insertRes.insertId;
              kategoriMap.set(lowerKat, kategoriId);
            }
          } else {
            // Default to 'Kiriman' or first category
            kategoriId = getFirstCategoryId(kategoriMap);
          }

          // Handle Gender mapping: 1 for Laki-laki, 2 for Perempuan
          let kelaminId = 1;
          const lowerKelamin = rawKelamin.toLowerCase();
          if (lowerKelamin.startsWith('p') || lowerKelamin === 'perempuan' || lowerKelamin === '2' || lowerKelamin.startsWith('w')) {
            kelaminId = 2;
          }

          const telpValue = rawTelp || '';
          const ukuranValue = rawUkuran || 'L'; // default to L

          // Insert or Update participant
          await query(
            `INSERT INTO peserta (id, nama, kategori, desa, kelompok, kelamin, telp, ukuran_baju) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
               nama = VALUES(nama), 
               kategori = VALUES(kategori), 
               desa = VALUES(desa), 
               kelompok = VALUES(kelompok), 
               kelamin = VALUES(kelamin), 
               telp = VALUES(telp), 
               ukuran_baju = VALUES(ukuran_baju)`,
            [rawId, rawNama, kategoriId, desaId, kelompokId, kelaminId, telpValue, ukuranValue]
          );

          successCount++;
        } catch (err) {
          console.error('Failed to import row:', row, err);
          errorCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai. Berhasil: ${successCount}, Gagal: ${errorCount}`
      });
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin POST failed:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

// Helpers
function getFirstCategoryId(kategoriMap: Map<string, number>): number {
  if (kategoriMap.has('kiriman')) return kategoriMap.get('kiriman')!;
  if (kategoriMap.size > 0) return Array.from(kategoriMap.values())[0];
  return 1;
}
