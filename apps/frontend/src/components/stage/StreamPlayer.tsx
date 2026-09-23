import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface StreamPlayerProps {
  stream?: MediaStream | null;
  isSelf?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover';
}

const StreamPlayerComponent: React.FC<StreamPlayerProps> = ({
  stream,
  isSelf = false,
  className = '',
  objectFit = 'contain',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(isSelf);
  const [volume, setVolume] = useState(isSelf ? 0 : 1);
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    setIsMuted(isSelf);
    setVolume(isSelf ? 0 : 1);
  }, [isSelf]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }

    videoEl.muted = isMuted;
    videoEl.volume = volume;

    videoEl.play().catch((err) => {
      console.warn('Autoplay com áudio prevenido pelo navegador:', err);
    });

    return () => {
      if (videoEl) {
        try {
          videoEl.pause();
        } catch (e) {}
      }
    };
  }, [stream, isMuted, volume]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      const targetVol = volume === 0 ? 0.8 : volume;
      setVolume(targetVol);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = targetVol;
        videoRef.current.play().catch(() => {});
      }
    } else {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
    } else {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = newVol;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-black group ${className}`}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-${objectFit}`}
        />
      )}

      {/* Minimalist Stream Volume Control Pill Overlay */}
      {stream && !isSelf && (
        <div
          className={`absolute bottom-4 right-4 z-20 flex items-center space-x-2 px-3 py-1.5 bg-gray-900/80 backdrop-blur-md border border-gray-700/60 rounded-xl transition-all duration-300 shadow-lg ${
            showSlider ? 'opacity-100 scale-100' : 'opacity-80 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={toggleMute}
            className="p-1 text-gray-200 hover:text-white transition-colors focus:outline-none"
            title={isMuted ? 'Ativar Áudio da Live' : 'Mutar Áudio da Live'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4 text-vocalis-accent" />
            ) : (
              <Volume2 className="w-4 h-4 text-vocalis-accent" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-vocalis-accent focus:outline-none"
            title={`Volume da Live: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />

          <span className="text-[10px] font-mono text-gray-300 min-w-[24px]">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};

export const StreamPlayer = React.memo(
  StreamPlayerComponent,
  (prev, next) =>
    prev.stream === next.stream &&
    prev.isSelf === next.isSelf &&
    prev.className === next.className &&
    prev.objectFit === next.objectFit
);
