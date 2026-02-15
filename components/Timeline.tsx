
import React from 'react';
import { EditSuggestion, SfxSuggestion, AudioProfile } from '../types';

interface TimelineProps {
  duration: number;
  suggestions: EditSuggestion[];
  sfxSuggestions: SfxSuggestion[];
  audioProfile: AudioProfile | null;
  currentTime: number;
}

const Timeline: React.FC<TimelineProps> = ({ duration, suggestions, sfxSuggestions, audioProfile, currentTime }) => {
  const percentage = (currentTime / duration) * 100 || 0;

  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Master Timeline</h3>
          {audioProfile && (
            <div className="flex items-center gap-2 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-400 font-bold uppercase animate-pulse">
              <span className="text-lg">🎵</span> AI Sync Active: {audioProfile.mood} {audioProfile.genre}
            </div>
          )}
        </div>
        <div className="text-xs font-mono text-slate-400">00:00 / {Math.floor(duration)}s</div>
      </div>
      
      <div className="relative h-28 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        {/* Progress Bar */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `${percentage}%` }}
        />
        
        {/* Visual Blocks for Video */}
        <div className="absolute inset-x-0 top-0 h-10 flex border-b border-slate-900">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 border-r border-slate-800 flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-slate-800 rounded-sm opacity-50" />
            </div>
          ))}
        </div>

        {/* Audio Track Visualizer */}
        <div className="absolute inset-x-0 top-10 h-10 bg-slate-900/50 flex items-center px-2">
          {audioProfile ? (
            <div className="w-full h-6 bg-gradient-to-r from-cyan-900/40 via-cyan-500/20 to-cyan-900/40 rounded flex items-center gap-0.5 px-2 border border-cyan-500/20 overflow-hidden">
               {[...Array(40)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-1 bg-cyan-400/60 rounded-full transition-all"
                   style={{ height: `${20 + Math.random() * 80}%` }}
                 />
               ))}
               <span className="absolute right-4 text-[8px] text-cyan-500/50 font-mono uppercase tracking-widest">
                 {audioProfile.genre} @ {audioProfile.bpmRange} BPM
               </span>
            </div>
          ) : (
            <div className="w-full h-6 bg-slate-800/20 rounded border border-slate-800/40 flex items-center justify-center">
              <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest italic">No Audio Synced</span>
            </div>
          )}
        </div>

        {/* SFX Markers Track */}
        <div className="absolute inset-x-0 bottom-0 h-8 flex items-center">
           {sfxSuggestions.map((sfx, idx) => {
             const pos = (idx + 1) * 12; // Simulated relative pos
             return (
               <div 
                 key={idx}
                 className="absolute bottom-1 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                 style={{ left: `${pos}%` }}
               >
                 <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500 text-black px-2 py-1 rounded text-[10px] font-black whitespace-nowrap shadow-xl z-30 flex flex-col items-center">
                   <span className="uppercase">{sfx.effect}</span>
                   <span className="text-[8px] opacity-70 italic font-medium">Cue: {sfx.visualCue}</span>
                 </div>
                 <div className="w-2 h-2 bg-amber-500 rounded-full border border-black shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
               </div>
             );
           })}
        </div>

        {/* Cut Markers */}
        {suggestions.map((s, idx) => {
          const pos = (idx + 1) * 18; 
          return (
            <div 
              key={idx}
              className="absolute top-0 bottom-0 flex flex-col items-center group cursor-pointer"
              style={{ left: `${pos}%` }}
            >
              <div className="w-[1px] h-full bg-pink-500/30" />
              <div className="w-2 h-2 bg-pink-500 rounded-full border border-slate-900 mt-[-4px] z-10" />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <TrackBadge label="Video" color="slate" active />
        <TrackBadge label="AI Audio Sync" color="cyan" active={!!audioProfile} />
        <TrackBadge label="SFX Layer" color="amber" active={sfxSuggestions.length > 0} />
        <TrackBadge label="Captions" color="pink" />
      </div>
    </div>
  );
};

const TrackBadge: React.FC<{ label: string, color: string, active?: boolean }> = ({ label, color, active }) => {
  const colors: any = {
    slate: active ? 'bg-slate-700 text-slate-100 border-slate-600' : 'bg-slate-900 text-slate-600 border-slate-800',
    cyan: active ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800/50' : 'bg-slate-900 text-slate-600 border-slate-800',
    amber: active ? 'bg-amber-900/30 text-amber-500 border-amber-800/50' : 'bg-slate-900 text-slate-600 border-slate-800',
    pink: active ? 'bg-pink-900/30 text-pink-500 border-pink-800/50' : 'bg-slate-900 text-slate-600 border-slate-800',
  };

  return (
    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-2 whitespace-nowrap transition-all ${colors[color]}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'animate-pulse' : ''}`} style={{ backgroundColor: 'currentColor' }} />
      {label}
    </div>
  );
};

export default Timeline;
