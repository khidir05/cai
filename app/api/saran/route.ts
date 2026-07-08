import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { pesan, kesan } = await request.json();

    if (!pesan || pesan.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Pesan (kritik/saran) tidak boleh kosong.' },
        { status: 400 }
      );
    }

    await query(
      'INSERT INTO saran (pesan, kesan) VALUES (?, ?)',
      [pesan.trim(), (kesan || '').trim()]
    );

    return NextResponse.json({
      success: true,
      message: 'Kritik dan saran Anda telah berhasil dikirim. Terima kasih!',
    });
  } catch (error: any) {
    console.error('Failed to submit suggestion:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
