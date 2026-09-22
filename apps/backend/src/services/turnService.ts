import crypto from 'crypto';
import { config } from '../config/index.js';

export interface TurnCredentials {
  urls: string[];
  username: string;
  credential: string;
  ttlSeconds: number;
}

/**
 * Generates ephemeral, time-limited TURN server credentials using HMAC-SHA1.
 * Standard draft-uberti-behave-turn-rest specification.
 */
export function generateEphemeralTurnCredentials(username: string, ttlSeconds = 86400): TurnCredentials {
  const timestamp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const ephemeralUsername = `${timestamp}:${username}`;
  
  const hmac = crypto.createHmac('sha1', config.turnSecret);
  hmac.update(ephemeralUsername);
  const credential = hmac.digest('base64');

  return {
    urls: config.turnUrls,
    username: ephemeralUsername,
    credential,
    ttlSeconds,
  };
}

