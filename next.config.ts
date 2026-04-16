import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // クリックジャッキング防止
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME スニッフィング防止
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // リファラー情報を最小化
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // 不要なブラウザ機能を無効化
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS（本番のみ）
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
