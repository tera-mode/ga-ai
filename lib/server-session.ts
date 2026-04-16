/**
 * API ルートで getServerSession(authOptions) の代わりに使う
 */
import { NextRequest } from 'next/server';
import { decodeSession, COOKIE_NAME, type SessionData } from './session-cookie';

export type { SessionData };

export function getSession(req: NextRequest): SessionData | null {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return null;
  return decodeSession(cookie);
}
