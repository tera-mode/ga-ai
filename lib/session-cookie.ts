/**
 * サーバー側セッションクッキーのエンコード/デコード
 * HMAC-SHA256 で署名した Base64url ペイロード
 */
import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET;
if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET environment variable is required in production');
}
const _SECRET = SECRET ?? 'dev-secret-change-me';
const COOKIE_NAME = 'ga_session';

export { COOKIE_NAME };

export interface SessionData {
  uid: string;
  email: string;
  googleAccessToken: string;
  expiresAt: number; // Unix timestamp (seconds)
}

function sign(data: string): string {
  return crypto.createHmac('sha256', _SECRET).update(data).digest('hex');
}

export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function decodeSession(cookie: string): SessionData | null {
  const dotIndex = cookie.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const payload = cookie.slice(0, dotIndex);
  const sig = cookie.slice(dotIndex + 1);

  // タイミングセーフな比較
  const expected = sign(payload);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionData;
    // 期限チェック
    if (data.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
