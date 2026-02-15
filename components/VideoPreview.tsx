
import React, { useRef, useEffect, useState } from 'react';
import { SfxSuggestion } from '../types';

interface VideoPreviewProps {
  videoUrl: string | null;
  overlayText?: string;
  sfxSuggestions?: SfxSuggestion[];
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl, overlayText, sfxSuggestions = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDucking, setIsDucking] = useState(false);
  const [activeSfx, setActiveSfx] = useState<string | null>(null);

  // Utility to convert "MM:SS" or "SS" strings to numbers
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
        // Duck for 0.8 seconds starting from the timestamp
        if (currentTime >= sfxTime && currentTime < sfxTime + 0.8) {
          shouldDuck = true;
          currentEffect = sfx.effect;
          break;
        }
      }

      if (shouldDuck !== isDucking) {
        setIsDucking(shouldDuck);
        setActiveSfx(currentEffect);
        // Smoothly adjust volume to simulate ducking
        video.volume = shouldDuck ? 0.2 : 1.0;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [sfxSuggestions, isDucking]);

  return (
    <div className="relative w-full aspect-[9/16] max-w-[400px] mx-auto bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl neon-border group">
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            controls={false}
            loop
            muted={false} // Ensure it's not muted so we can hear/see volume changes
            autoPlay
          />
          
          {/* Audio Ducking Indicator */}
          {isDucking && (
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-amber-500/90 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg animate-pulse z-50">
              <span className="text-sm">🔊</span>
              Ducking for {activeSfx}
            </div>
          )}

          {overlayText && (
            <div className="absolute inset-x-4 top-1/4 flex justify-center pointer-events-none">
              <span className="bg-white text-black font-extrabold px-4 py-2 text-xl italic uppercase tracking-tighter transform -rotate-2 shadow-lg animate-bounce">
                {overlayText}
              </span>
            </div>
          )}
          
          <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-2 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-500 border-2 border-white" />
              <div className="flex flex-col">
                <span className="text-sm font-bold">@editor_pro</span>
                <span className="text-xs text-slate-300">Viral Content Generator</span>
              </div>
            </div>
            <p className="text-sm text-slate-100 line-clamp-2">
              Automated edit powered by Gemini AI. #viral #editing #tiktok
            </p>
          </div>
          
          <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center pointer-events-none">
             <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  ❤️
                </div>
                <span className="text-xs text-slate-400">12.5k</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  💬
                </div>
                <span className="text-xs text-slate-400">432</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                  🔖
                </div>
                <span className="text-xs text-slate-400">98</span>
             </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-500 px-8 text-center">
          <svg className="w-16 h-16 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="font-medium">No video uploaded</p>
          <p className="text-xs opacity-70">Upload a raw clip to start the AI transformation</p>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
