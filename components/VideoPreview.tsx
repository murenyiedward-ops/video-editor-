
import React, { useRef, useEffect, useState } from 'react';
import { SfxSuggestion } from '../types';

interface VideoPreviewProps {
  videoUrl: string | null;
  overlayText?: string;
  sfxSuggestions?: SfxSuggestion[];
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl, overlayText, sfxSuggestions = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const [activeSfx, setActiveSfx] = useState<string | null>(null);

  const parseTimestamp = (ts: string): number => {
    const parts = ts.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      let shouldDuck = false;
      let currentEffect = null;

      for (const sfx of sfxSuggestions) {
        const sfxTime = parseTimestamp(sfx.timestamp);
        if (currentTime >= sfxTime && currentTime < sfxTime + 1.2) {
          shouldDuck = true;
          currentEffect = sfx.effect;
          break;
        }
      }

      if (shouldDuck !== isDucking) {
        setIsDucking(shouldDuck);
        setActiveSfx(currentEffect);
        video.volume = shouldDuck ? 0.15 : 1.0;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [sfxSuggestions, isDucking]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error("Play blocked:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full aspect-[9/16] max-w-[380px] mx-auto bg-slate-900 rounded-[2.5rem] overflow-hidden border-[8px] border-slate-800 shadow-2xl group transition-all duration-500 hover:border-slate-700">
      {videoUrl ? (
        <div className="relative w-full h-full cursor-pointer" onClick={togglePlay}>
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            controls={false}
            loop
            muted={false}
            playsInline
          />
          
          {/* Overlay Effects */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-20">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border border-white/30 transition-transform group-hover:scale-110">
                <span className="text-4xl">▶️</span>
              </div>
            </div>
          )}

          {isDucking && (
            <div className="absolute top-8 right-6 flex items-center gap-3 bg-amber-500 text-black px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tighter shadow-lg animate-bounce z-30">
              <span>🔊</span>
              DUCKING: {activeSfx}
            </div>
          )}

          {overlayText && isPlaying && (
            <div className="absolute inset-x-6 top-1/3 flex justify-center pointer-events-none z-10">
              <span className="bg-white text-black font-black px-5 py-2.5 text-2xl italic uppercase tracking-tighter transform -rotate-2 shadow-2xl animate-in zoom-in-50 duration-300">
                {overlayText}
              </span>
            </div>
          )}
          
          {/* Mock TikTok Interface */}
          <div className="absolute bottom-8 left-6 right-6 flex flex-col gap-3 pointer-events-none z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400 border-2 border-white shadow-lg" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-white drop-shadow-md">@editor_pro_ai</span>
                <span className="text-[10px] text-slate-200 font-bold uppercase tracking-widest">Master Studio</span>
              </div>
            </div>
            <p className="text-sm text-slate-50 font-medium drop-shadow-md leading-snug">
              Fresh AI synchronization enabled. Automatically ducks background music for cinematic SFX impact. #ai #editor #viral
            </p>
          </div>
          
          <div className="absolute right-6 bottom-32 flex flex-col gap-8 items-center pointer-events-none z-10">
             <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-lg">❤️</div>
                <span className="text-xs font-bold text-white shadow-black drop-shadow-lg">45.2K</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-lg">💬</div>
                <span className="text-xs font-bold text-white drop-shadow-lg">1,204</span>
             </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-slate-500 px-12 text-center bg-slate-950">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center border border-slate-800 animate-pulse">
            <span className="text-5xl">📼</span>
          </div>
          <div>
            <p className="font-black text-slate-200 text-lg uppercase tracking-tight mb-2">Editor Pro Awaiting Source</p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Upload your raw footage to begin the professional AI synchronization process.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
