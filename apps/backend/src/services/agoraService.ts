import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { config } from '../config/index.js';

export interface AgoraTokenResponse {
  appId: string;
  token: string;
  channelName: string;
  uid: string;
  expireTimestamp: number;
}

/**
 * Generates dynamic, time-limited Agora RTC Token for channel access
 */
export function generateAgoraRtcToken(channelName: string, uid: string, expirationTimeInSeconds = 86400): AgoraTokenResponse {
  const appId = config.agoraAppId;
  const appCertificate = config.agoraAppCertificate;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  const role = RtcRole.PUBLISHER;

  // Build RTC token with Account string UID
  const token = RtcTokenBuilder.buildTokenWithUserAccount(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return {
    appId,
    token,
    channelName,
    uid,
    expireTimestamp: privilegeExpiredTs,
  };
}

