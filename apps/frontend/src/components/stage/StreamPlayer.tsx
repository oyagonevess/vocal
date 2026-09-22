import React, { useEffect, useRef } from 'react';

interface StreamPlayerProps {
  track?: any; // Agora ILocalVideoTrack | IRemoteVideoTrack
  stream?: MediaStream | null;
  isSelf?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover';
}

const StreamPlayerComponent: React.FC<StreamPlayerProps> = ({
  track,
  stream,
  isSelf = false,
  className = '',
  objectFit = 'contain',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 1. Play Agora RTC Track inside static containerRef (with track.stop() cleanup)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !track) return;

    try {
      track.play(container, { fit: objectFit === 'contain' ? 'contain' : 'cover' });
    } catch (err) {
      console.warn('Erro ao executar track.play() no container:', err);
    }

    return () => {
      try {
        if (track && typeof track.stop === 'function') {
          track.stop();
        }
      } catch (e) {
        console.warn('Erro no cleanup de track.stop():', e);
      }
    };
  }, [track, objectFit]);

  // 2. Play native MediaStream fallback if track is not provided
  useEffect(() => {
    if (track) return; // Prioritize Agora track if available
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
      videoEl.muted = isSelf;
      videoEl.play().catch((err) => {
        console.warn('Erro na reprodução do MediaStream:', err);
      });
    }

    return () => {
      if (videoEl) {
        try {
          videoEl.pause();
          videoEl.srcObject = null;
        } catch (e) {}
      }
    };
  }, [stream, track, isSelf]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-black ${className}`}
    >
      {/* Fallback HTML5 video element when using raw MediaStream */}
      {!track && stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className={`w-full h-full object-${objectFit}`}
        />
      )}
    </div>
  );
};

// React.memo with custom props comparison prevents unnecessary re-renders when parent states (like VAD speaking) change
export const StreamPlayer = React.memo(
  StreamPlayerComponent,
  (prev, next) =>
    prev.track === next.track &&
    prev.stream === next.stream &&
    prev.isSelf === next.isSelf &&
    prev.className === next.className &&
    prev.objectFit === next.objectFit
);

