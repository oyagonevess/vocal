import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || 'vocalis_super_secret_jwt_key_2026_aes256',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'vocalis_refresh_secret_key_2026_strict',
  turnSecret: process.env.TURN_SECRET || 'vocalis_turn_hmac_secret_key_8989',
  turnUrls: (process.env.TURN_URLS || 'stun:stun.l.google.com:19302').split(','),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProd: process.env.NODE_ENV === 'production',
  agoraAppId: process.env.AGORA_APP_ID || '74b6478f2c364b12a680839bab20cad6',
  agoraAppCertificate: process.env.AGORA_APP_CERTIFICATE || '29029e29d96b49188a043a6cb7e85df6',
};
