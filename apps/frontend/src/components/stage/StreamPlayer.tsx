import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
      videoEl.muted = isSelf;
      videoEl.play().catch((err) => {
        console.warn('Erro ao reproduzir MediaStream:', err);
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
  }, [stream, isSelf]);

  return (
    <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-black ${className}`}>
      {stream && (
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

export const StreamPlayer = React.memo(
  StreamPlayerComponent,
  (prev, next) =>
    prev.stream === next.stream &&
    prev.isSelf === next.isSelf &&
    prev.className === next.className &&
    prev.objectFit === next.objectFit
);
