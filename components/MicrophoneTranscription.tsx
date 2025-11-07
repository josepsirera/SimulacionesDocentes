

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveSession } from '@google/genai';
import { connectLiveAudioTranscription } from '../services/geminiService';
import { LiveCallbacks } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface MicrophoneTranscriptionProps {
  onTranscriptionUpdate: (transcription: string) => void;
  initialText?: string;
}

// Utility functions for audio encoding/decoding, as specified.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  // The supported audio MIME type is 'audio/pcm'. Do not use other types.
  return {
    data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
    mimeType: 'audio/pcm;rate=16000',
  };
}


const MicrophoneTranscription: React.FC<MicrophoneTranscriptionProps> = ({ onTranscriptionUpdate, initialText = '' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string>(initialText);
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const currentInputTranscriptionRef = useRef<string>('');
  const nextStartTimeRef = useRef(0); // For audio playback, though not strictly needed for input transcription

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    setIsLoadingConnection(true);
    setError(null);
    setCurrentTranscription('');
    onTranscriptionUpdate('');
    currentInputTranscriptionRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Create a ScriptProcessorNode for processing audio
      const bufferSize = 4096;
      scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

      scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`,
        // **do not** add other condition checks.
        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          }).catch(err => console.error("Error sending audio data:", err));
        }
      };

      source.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination); // Connect to destination to ensure it runs

      const callbacks: LiveCallbacks = {
        onopen: () => {
          setIsLoadingConnection(false);
          setIsRecording(true);
          console.debug('Live API session opened');
        },
        onmessage: (message: any) => {
          if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscriptionRef.current += text;
            setCurrentTranscription(currentInputTranscriptionRef.current);
          }
          if (message.serverContent?.turnComplete) {
            // Once a turn is complete, send the full transcription up
            onTranscriptionUpdate(currentInputTranscriptionRef.current.trim());
            // Reset for the next turn if continuous recording
            currentInputTranscriptionRef.current = '';
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error('Live API Error:', e);
          setError(`Error de conexión con la API Live: ${e.message}`);
          stopRecording(); // Stop on error
        },
        onclose: (e: CloseEvent) => {
          console.debug('Live API session closed:', e);
          setIsRecording(false);
          // If not explicitly stopped by user, report closure
          if (!e.wasClean) {
            setError(`La conexión con la API Live se cerró inesperadamente. Código: ${e.code}, Razón: ${e.reason}`);
          }
        },
      };

      sessionPromiseRef.current = connectLiveAudioTranscription(callbacks);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Error al iniciar el micrófono: ${(err as Error).message}`);
      setIsLoadingConnection(false);
      setIsRecording(false);
    }
  }, [isRecording, onTranscriptionUpdate]);

  const stopRecording = useCallback(() => {
    if (!isRecording && !isLoadingConnection) return;
    setIsRecording(false);
    setIsLoadingConnection(false);

    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        session.close();
      }).catch(err => console.error("Error closing session:", err));
      sessionPromiseRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.error("Error closing audio context:", err));
      audioContextRef.current = null;
    }
    // Final update for any remaining transcription text before clearing
    onTranscriptionUpdate(currentInputTranscriptionRef.current.trim());
    currentInputTranscriptionRef.current = '';
    setCurrentTranscription('');
  }, [isRecording, isLoadingConnection, onTranscriptionUpdate]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Transcripción de Audio en Vivo</h2>
      <p className="text-gray-600 mb-4">
        Haz clic para empezar a grabar tu voz. La aplicación transcribirá tu audio en tiempo real.
      </p>
      <div className="flex justify-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all duration-300 ease-in-out
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
            }
            ${isLoadingConnection ? 'opacity-70 cursor-not-allowed' : ''}
          `}
          disabled={isLoadingConnection}
        >
          {isLoadingConnection ? <LoadingSpinner /> : (isRecording ? 'Detener Grabación' : 'Iniciar Grabación')}
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md min-h-[100px] flex items-center justify-center">
        {currentTranscription ? (
          <p className="text-gray-800 text-center text-lg italic">{currentTranscription}</p>
        ) : (
          <p className="text-gray-400 text-center">
            {isRecording ? 'Escuchando...' : 'Tu transcripción aparecerá aquí.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default MicrophoneTranscription;