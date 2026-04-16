import { NextRequest, NextResponse } from 'next/server';
import { encodeSession, COOKIE_NAME } from '@/lib/session-cookie';

const TOKEN_TTL = 3600; // 1 hour in seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      uid?: string;
      email?: string;
      googleAccessToken?: string;
    };

    const { uid, email, googleAccessToken } = body;
    if (!uid || !email || !googleAccessToken) {
      return NextResponse.json({ error: 'uid, email, googleAccessToken are required' }, { status: 400 });
    }

    const cookie = encodeSession({
      uid,
      email,
      googleAccessToken,
      expiresAt: Math.floor(Date.now() / 1000) + TOKEN_TTL,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_TTL,
      path: '/',
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
