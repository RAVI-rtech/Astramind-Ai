import React, { useEffect, useRef, useState } from "react";
import { X, Mic, MicOff, AudioLines } from "lucide-react";

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColorClass: string;
}

export default function LiveVoiceModal({ isOpen, onClose, accentColorClass }: LiveVoiceModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }
    initLiveSession();
  }, [isOpen]);

  const initLiveSession = async () => {
    setError(null);
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processorRef.current.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || isMicMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);

        wsRef.current.send(JSON.stringify({
          audio: base64
        }));
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.audio) {
            playAudioChunk(data.audio);
          }
        } catch (err) {}
      };

      wsRef.current.onerror = (e) => {
        setError("WebSocket error occurred");
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
      };

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to initialize audio.");
    }
  };

  const playAudioChunk = (base64: string) => {
    if (!audioContextRef.current) return;
    try {
      const binary = window.atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000); // output is 24kHz
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch(e) {}
  };

  const cleanup = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050816]/80 backdrop-blur-md">
      <div className="bg-[#0A0E22] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl overflow-hidden">
        {/* Glow */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accentColorClass}`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[100px] opacity-20 pointer-events-none bg-gradient-to-br ${accentColorClass}`} />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center relative shadow-lg">
             {isConnected ? (
               <>
                 <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping"></div>
                 <AudioLines className="w-10 h-10 text-emerald-400 animate-pulse" />
               </>
             ) : (
               <AudioLines className="w-10 h-10 text-slate-500" />
             )}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Live Voice</h2>
            <p className="text-sm text-slate-400 font-mono">
              {error ? <span className="text-rose-400">{error}</span> : isConnected ? "Connected. Speak to AstraMind." : "Connecting..."}
            </p>
          </div>

          <div className="flex gap-4">
             <button
               onClick={() => setIsMicMuted(!isMicMuted)}
               className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                 isMicMuted ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
               }`}
             >
               {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
             </button>
             <button
               onClick={onClose}
               className="w-14 h-14 rounded-full flex items-center justify-center bg-rose-600/20 text-rose-500 border border-rose-600/30 hover:bg-rose-600/30 transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
