import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pesertaId = (body.id || body.barcode || body.pesertaId || '').trim();

    if (!pesertaId) {
      return NextResponse.json(
        { success: false, message: 'ID Peserta tidak valid.' },
        { status: 400 }
      );
    }

    // 1. Check if there is an active session
    const activeSessions = await query(
      'SELECT id, nama_sesi FROM sesi WHERE status = 1 LIMIT 1'
    );

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'NO_ACTIVE_SESSION',
        message: 'Sesi absensi belum dibuka atau sudah ditutup.',
      }, { status: 400 });
    }

    const activeSession = activeSessions[0];

    // 2. Check if participant exists
    const pesertas = await query(
      `SELECT p.id, p.nama, p.kelamin, p.telp, 
              d.nama_desa, k.nama_kategori, kl.nama_kelompok 
       FROM peserta p 
       LEFT JOIN desa d ON p.desa = d.id 
       LEFT JOIN kategori k ON p.kategori = k.id 
       LEFT JOIN kelompok kl ON p.kelompok = kl.id 
       WHERE p.id = ?`,
      [pesertaId]
    );

    if (!pesertas || pesertas.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'PESERTA_NOT_FOUND',
        message: `Peserta dengan ID "${pesertaId}" tidak terdaftar.`,
      }, { status: 404 });
    }

    const peserta = pesertas[0];

    // 3. Check if participant has already scanned in this session
    const existingAttendance = await query(
      'SELECT id, waktu_scan FROM kehadiran WHERE sesi = ? AND peserta = ? LIMIT 1',
      [activeSession.id, pesertaId]
    );

    if (existingAttendance && existingAttendance.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'ALREADY_SCANNED',
        message: `${peserta.nama} sudah melakukan absensi untuk sesi ini.`,
        peserta: {
          id: peserta.id,
          nama: peserta.nama,
          nama_desa: peserta.nama_desa || 'Tidak ada',
          nama_kategori: peserta.nama_kategori || 'Tidak ada',
          nama_kelompok: peserta.nama_kelompok || 'Tidak ada',
          waktu_scan: existingAttendance[0].waktu_scan,
        },
      }, { status: 400 });
    }

    // 4. Record attendance
    const kehadiranId = crypto.randomUUID();
    await query(
      'INSERT INTO kehadiran (id, sesi, peserta, waktu_scan) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [kehadiranId, activeSession.id, pesertaId]
    );

    return NextResponse.json({
      success: true,
      message: `Absensi berhasil dicatat untuk ${peserta.nama}!`,
      peserta: {
        id: peserta.id,
        nama: peserta.nama,
        nama_desa: peserta.nama_desa || 'Tidak ada',
        nama_kategori: peserta.nama_kategori || 'Tidak ada',
        nama_kelompok: peserta.nama_kelompok || 'Tidak ada',
        kelamin: peserta.kelamin,
        telp: peserta.telp,
      },
    });
  } catch (error: any) {
    console.error('Scan processing failed:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
