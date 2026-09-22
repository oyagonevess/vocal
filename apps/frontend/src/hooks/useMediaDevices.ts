import { useState, useCallback } from 'react';

export interface MediaErrorState {
  hasError: boolean;
  type?: 'permission_denied' | 'not_found' | 'unknown';
  message?: string;
}

export function useMediaDevices() {
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);

  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  const [mediaError, setMediaError] = useState<MediaErrorState>({ hasError: false });

  // Start Audio Mic Stream
  const startAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      setLocalAudioStream(stream);
      setMediaError({ hasError: false });
      return stream;
    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      let errorType: MediaErrorState['type'] = 'unknown';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorType = 'permission_denied';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorType = 'not_found';
      }
      setMediaError({
        hasError: true,
        type: errorType,
        message: 'Acesso ao microfone foi negado ou dispositivo não encontrado.',
      });
      return null;
    }
  }, []);

  // Toggle Camera
  const toggleCamera = useCallback(async () => {
    if (cameraOn) {
      if (localVideoStream) {
        localVideoStream.getTracks().forEach((track) => track.stop());
        setLocalVideoStream(null);
      }
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
          audio: false,
        });
        setLocalVideoStream(stream);
        setCameraOn(true);
        setMediaError({ hasError: false });
      } catch (err: any) {
        console.error('Erro ao acessar câmera:', err);
        setMediaError({
          hasError: true,
          type: err.name === 'NotAllowedError' ? 'permission_denied' : 'not_found',
          message: 'Permissão de câmera negada ou câmera não conectada.',
        });
      }
    }
  }, [cameraOn, localVideoStream]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (screenSharing) {
      if (localScreenStream) {
        localScreenStream.getTracks().forEach((track) => track.stop());
        setLocalScreenStream(null);
      }
      setScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true, // Captura de áudio do sistema se suportado
        });

        stream.getVideoTracks()[0].onended = () => {
          setLocalScreenStream(null);
          setScreenSharing(false);
        };

        setLocalScreenStream(stream);
        setScreenSharing(true);
      } catch (err: any) {
        console.warn('Compartilhamento de tela cancelado ou negado:', err);
      }
    }
  }, [screenSharing, localScreenStream]);

  // Toggle Mute Audio Track
  const toggleMute = useCallback(() => {
    if (localAudioStream) {
      localAudioStream.getAudioTracks().forEach((track) => {
        track.enabled = muted;
      });
    }
    setMuted((prev) => !prev);
  }, [localAudioStream, muted]);

  // Toggle Deafen Audio
  const toggleDeafen = useCallback(() => {
    setDeafened((prev) => !prev);
  }, []);

  // Stop All Media Streams
  const stopAllMedia = useCallback(() => {
    if (localAudioStream) {
      localAudioStream.getTracks().forEach((t) => t.stop());
      setLocalAudioStream(null);
    }
    if (localVideoStream) {
      localVideoStream.getTracks().forEach((t) => t.stop());
      setLocalVideoStream(null);
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((t) => t.stop());
      setLocalScreenStream(null);
    }
    setCameraOn(false);
    setScreenSharing(false);
    setMuted(false);
    setDeafened(false);
  }, [localAudioStream, localVideoStream, localScreenStream]);

  const clearMediaError = useCallback(() => {
    setMediaError({ hasError: false });
  }, []);

  return {
    localAudioStream,
    localVideoStream,
    localScreenStream,
    setLocalScreenStream,
    muted,
    deafened,
    cameraOn,
    screenSharing,
    mediaError,
    startAudio,
    toggleMute,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    stopAllMedia,
    clearMediaError,
  };
}
