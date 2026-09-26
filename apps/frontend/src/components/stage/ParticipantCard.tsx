import React from 'react';
import { RoomPeer } from '../../types/index';
import { MicOff, Monitor, Video } from 'lucide-react';
import { StreamPlayer } from './StreamPlayer';

interface ParticipantCardProps {
  peer: RoomPeer;
  isSelf?: boolean;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({ peer, isSelf = false }) => {
  const activeStream = (peer.screenSharing ? peer.screenStream : null) || peer.stream;
  const hasActiveMedia = (peer.cameraOn || peer.screenSharing) && !!activeStream;

  return (
    <div
      className={`relative w-full h-40 md:h-48 bg-vocalis-card rounded-2xl overflow-hidden flex flex-col items-center justify-center border transition-all duration-200 shadow-lg ${
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
          stream={activeStream}
          isSelf={isSelf}
          objectFit="cover"
        />
      ) : (
        /* Avatar Placeholder when Camera and Screen Share are Off */
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            {peer.avatarUrl ? (
              <img
                src={peer.avatarUrl}
                alt={peer.username}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-800 object-cover border-2 transition-all ${
                  peer.isSpeaking ? 'border-vocalis-neon scale-105 shadow-speaker' : 'border-gray-700'
                }`}
              />
            ) : (
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-800 border-2 flex items-center justify-center text-xl font-bold text-gray-200 transition-all ${
                  peer.isSpeaking ? 'border-vocalis-neon scale-105 shadow-speaker' : 'border-gray-700'
                }`}
              >
                {peer.username.substring(0, 2).toUpperCase()}
              </div>
            )}
            {peer.isSpeaking && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-vocalis-neon text-[9px] font-bold text-white rounded-full uppercase tracking-wider animate-pulse">
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
