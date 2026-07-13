import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { scannerId, accessCode } = await request.json();

    if (!scannerId || typeof scannerId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'ID scanner tidak valid.' },
        { status: 400 }
      );
    }

    // 0. Verify access code
    const codeResult = await query(
      "SELECT access_code FROM sesi WHERE status = 1 AND access_code = ? LIMIT 1",
      [(accessCode || '').trim()]
    );
    if (!codeResult || codeResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CODE', message: 'Kode akses scanner tidak valid atau sesi telah ditutup.' },
        { status: 403 }
      );
    }

    // 1. Get max scanners configuration
    let maxScanners = 5;
    const settings = await query(
      "SELECT `value` FROM settings WHERE `key` = 'max_scanners' LIMIT 1"
    );
    if (settings && settings.length > 0) {
      maxScanners = parseInt(settings[0].value, 10) || 5;
    }

    // 2. Clean up inactive scanner sessions (inactive for more than 12 seconds)
    await query(
      "DELETE FROM scanner_sessions WHERE last_seen < DATE_SUB(NOW(), INTERVAL 12 SECOND)"
    );

    // 3. Check if this scanner session is already registered
    const existing = await query(
      "SELECT session_id FROM scanner_sessions WHERE session_id = ? LIMIT 1",
      [scannerId]
    );

    if (existing && existing.length > 0) {
      // Update last seen
      await query(
        "UPDATE scanner_sessions SET last_seen = CURRENT_TIMESTAMP WHERE session_id = ?",
        [scannerId]
      );
      
      const [countResult] = await query("SELECT COUNT(*) as count FROM scanner_sessions");
      return NextResponse.json({
        success: true,
        count: countResult.count,
        max: maxScanners
      });
    }

    // 4. If not registered, check if we exceeded the limit
    const [countResult] = await query("SELECT COUNT(*) as count FROM scanner_sessions");
    const activeCount = countResult.count;

    if (activeCount >= maxScanners) {
      return NextResponse.json(
        {
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: 'Batas user scan tercapai. Akses dibatasi.',
          count: activeCount,
          max: maxScanners
        },
        { status: 403 }
      );
    }

    // 5. Register new scanner session
    await query(
      "INSERT INTO scanner_sessions (session_id, last_seen) VALUES (?, CURRENT_TIMESTAMP)",
      [scannerId]
    );

    return NextResponse.json({
      success: true,
      count: activeCount + 1,
      max: maxScanners
    });
  } catch (error: any) {
    console.error('Scanner heartbeat error:', error);
    return NextResponse.json(
      { success: false, error: 'DB_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
