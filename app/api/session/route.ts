import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

// GET: Fetch the current active session, or the most recent closed session if none is active
export async function GET() {
  try {
    const activeSessions = await query(
      'SELECT id, nama_sesi, tanggal, buka, status FROM sesi WHERE status = 1 LIMIT 1'
    );

    if (activeSessions && activeSessions.length > 0) {
      return NextResponse.json({
        success: true,
        session: activeSessions[0],
      });
    }

    const lastSessions = await query(
      'SELECT id, nama_sesi, tanggal, buka, tutup, status FROM sesi ORDER BY created_at DESC LIMIT 1'
    );

    return NextResponse.json({
      success: true,
      session: lastSessions.length > 0 ? lastSessions[0] : null,
    });
  } catch (error: any) {
    console.error('Failed to fetch session:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

// POST: Open or Close a session
export async function POST(request: Request) {
  try {
    const { action, nama_sesi } = await request.json();

    if (action === 'open') {
      if (!nama_sesi || nama_sesi.trim() === '') {
        return NextResponse.json(
          { success: false, message: 'Nama sesi harus diisi.' },
          { status: 400 }
        );
      }

      // Close all currently active sessions first
      await query(
        'UPDATE sesi SET status = 0, tutup = CURRENT_TIMESTAMP WHERE status = 1'
      );

      // Create new session
      const id = crypto.randomUUID();
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      
      await query(
        'INSERT INTO sesi (id, nama_sesi, tanggal, status, buka) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
        [id, nama_sesi.trim(), today]
      );

      return NextResponse.json({
        success: true,
        message: 'Sesi absensi berhasil dibuka.',
        session: {
          id,
          nama_sesi: nama_sesi.trim(),
          tanggal: today,
          status: 1,
        },
      });
    } else if (action === 'close') {
      // Close any active sessions
      await query(
        'UPDATE sesi SET status = 0, tutup = CURRENT_TIMESTAMP WHERE status = 1'
      );

      return NextResponse.json({
        success: true,
        message: 'Sesi absensi berhasil ditutup.',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Aksi tidak valid.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Failed to toggle session:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
