import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const useJobProgress = (jobId: string | null) => {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'polling' | 'completed'>('connecting');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Conectamos al servidor
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on('connect', () => {
      setStatus('connected');
      // Nos unimos a la sala privada del Job (Paso 3 de la Fase 3)
      socketRef.current?.emit('subscribeToJob', jobId);
    });

    // Escuchamos el evento que definimos en el Paso 4 del Backend
    socketRef.current.on('progress_update', (data: { progress: number }) => {
      setProgress(data.progress);
      if (data.progress === 100) setStatus('completed');
    });

    // 🛡️ Fallback: Si el socket se desconecta, pasamos a Polling
    socketRef.current.on('disconnect', () => {
      if (status !== 'completed') {
        setStatus('polling');
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [jobId]);

  // Lógica de Polling (solo se activa si el status es 'polling')
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (status === 'polling' && jobId && progress < 100) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/upload/status/${jobId}`);
          const { data } = await res.json();
          setProgress(data.progress);
          if (data.progress === 100) setStatus('completed');
        } catch (e) {
          console.error("Error en polling de rescate", e);
        }
      }, 3000); // Preguntamos cada 3 segundos
    }

    return () => clearInterval(interval);
  }, [status, jobId, progress]);

  return { progress, status };
};