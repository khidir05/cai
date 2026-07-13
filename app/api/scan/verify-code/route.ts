import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Kode akses tidak valid.' },
        { status: 400 }
      );
    }

    const result = await query(
      "SELECT access_code FROM sesi WHERE status = 1 AND access_code = ? LIMIT 1",
      [code.trim()]
    );

    if (result && result.length > 0) {
      return NextResponse.json({ success: true, message: 'Kode akses valid.' });
    }

    return NextResponse.json(
      { success: false, message: 'Kode akses salah atau tidak ada sesi aktif.' },
      { status: 403 }
    );
  } catch (error: any) {
    console.error('Failed to verify access code:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
