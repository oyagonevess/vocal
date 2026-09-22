import React from 'react';
import { RoomPeer } from '../../types/index.js';
import { MicOff, Monitor, Video } from 'lucide-react';
import { StreamPlayer } from './StreamPlayer.js';

interface ParticipantCardProps {
  peer: RoomPeer;
  isSelf?: boolean;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({ peer, isSelf = false }) => {
  const activeStream = (peer.screenSharing ? peer.screenStream : null) || peer.stream;
  const activeTrack = (peer.screenSharing ? peer.screenTrack : null) || peer.videoTrack;
  const hasActiveMedia = (peer.cameraOn || peer.screenSharing) && (!!activeTrack || !!activeStream);

  return (
    <div
      className={`relative w-full h-full min-h-[240px] bg-vocalis-card rounded-2xl overflow-hidden flex flex-col items-center justify-center border transition-all duration-200 shadow-xl ${
        peer.isSpeaking
          ? 'border-vocalis-neon shadow-speaker'
          : peer.screenSharing
          ? 'border-vocalis-accent/80 ring-2 ring-vocalis-accent/50'
          : 'border-gray-800/80 hover:border-gray-700'
      }`}
    >
      {/* Active Video/Screen Track */}
      {hasActiveMedia ? (
        <StreamPlayer
          track={activeTrack}
          stream={activeStream}
          isSelf={isSelf}
          objectFit="cover"
        />
      ) : (
        /* Avatar Placeholder when Camera and Screen Share are Off */
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <img
              src={peer.avatarUrl}
              alt={peer.username}
              className={`w-24 h-24 rounded-full bg-gray-800 object-cover border-2 transition-all ${
                peer.isSpeaking ? 'border-vocalis-neon scale-105 shadow-speaker' : 'border-gray-700'
              }`}
            />
            {peer.isSpeaking && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-vocalis-neon text-[10px] font-bold text-white rounded-full uppercase tracking-wider animate-pulse">
                Falando
              </span>
            )}
          </div>
        </div>
      )}

      {/* Screen Sharing Active Badge */}
      {peer.screenSharing && (
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-vocalis-accent/90 backdrop-blur-md rounded-xl flex items-center space-x-2 text-xs font-bold text-white shadow-lg border border-indigo-400/30">
          <Monitor className="w-4 h-4 text-white animate-pulse" />
          <span>TRANSMISSÃO AO VIVO</span>
        </div>
      )}

      {/* Participant Name & Status Footer */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="px-3 py-1.5 bg-gray-900/85 backdrop-blur-md rounded-xl border border-gray-800 flex items-center space-x-2 text-xs font-semibold text-white shadow-md">
          <span className="flex items-center space-x-1.5">
            {peer.screenSharing && <Monitor className="w-3.5 h-3.5 text-vocalis-accent" />}
            {peer.cameraOn && <Video className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSelf ? `${peer.username} (Você)` : peer.username}</span>
          </span>
          {peer.muted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
        </div>
      </div>
    </div>
  );
};
