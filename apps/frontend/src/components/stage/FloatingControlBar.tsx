import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Maximize2 } from 'lucide-react';
import { useRTC } from '../../context/RTCContext.js';

export const FloatingControlBar: React.FC = () => {
  const { activeChannel, leaveChannel, mediaDevices } = useRTC();

  if (!activeChannel) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 md:space-x-3 px-3.5 md:px-5 py-2.5 md:py-3 bg-vocalis-sidebar/95 backdrop-blur-xl border border-gray-800/90 rounded-2xl shadow-2xl max-w-[95vw]">
      {/* Microphone Toggle */}
      <button
        onClick={mediaDevices.toggleMute}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          mediaDevices.muted
            ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
            : 'bg-gray-800 text-gray-200 hover:bg-vocalis-hover hover:text-white'
        }`}
        title={mediaDevices.muted ? 'Desmutar Microfone' : 'Mutar Microfone'}
      >
        {mediaDevices.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera Toggle */}
      <button
        onClick={mediaDevices.toggleCamera}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          mediaDevices.cameraOn
            ? 'bg-vocalis-accent text-white shadow-lg shadow-indigo-500/30'
            : 'bg-gray-800 text-gray-200 hover:bg-vocalis-hover hover:text-white'
        }`}
        title={mediaDevices.cameraOn ? 'Desativar Câmera' : 'Ativar Câmera'}
      >
        {mediaDevices.cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* Disconnect / Leave Call Red Button */}
      <button
        onClick={leaveChannel}
        className="w-14 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-600/30 font-bold"
        title="Desconectar do Canal"
      >
        <PhoneOff className="w-5 h-5" />
      </button>

      {/* Screen Sharing Toggle */}
      <button
        onClick={mediaDevices.toggleScreenShare}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          mediaDevices.screenSharing
            ? 'bg-vocalis-neon text-white shadow-neon'
            : 'bg-gray-800 text-gray-200 hover:bg-vocalis-hover hover:text-white'
        }`}
        title={mediaDevices.screenSharing ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
      >
        <Monitor className="w-5 h-5" />
      </button>

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="w-12 h-12 rounded-xl bg-gray-800 text-gray-200 flex items-center justify-center hover:bg-vocalis-hover hover:text-white transition-all"
        title="Tela Cheia"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
    </div>
  );
};

