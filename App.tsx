
import React, { useState, useRef } from 'react';
import VideoPreview from './components/VideoPreview';
import Timeline from './components/Timeline';
import { analyzeRawFootage, generateAiCover } from './services/geminiService';
import { VideoMetadata, EditSuggestion, ProcessingState, EditorTool, AudioProfile, SfxSuggestion } from './types';

const App: React.FC = () => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.AI_GEN);
  const [processing, setProcessing] = useState<ProcessingState>({
    isAnalyzing: false,
    isGenerating: false,
    progress: 0,
    status: 'Idle'
  });
  
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [hook, setHook] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [audioProfile, setAudioProfile] = useState<AudioProfile | null>(null);
  const [sfxSuggestions, setSfxSuggestions] = useState<SfxSuggestion[]>([]);
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [magicPrompt, setMagicPrompt] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideo({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: url,
        duration: 30,
        type: file.type
      });
      resetStates();
    }
  };

  const resetStates = () => {
    setSuggestions([]);
    setHook('');
    setHashtags([]);
    setAudioProfile(null);
    setSfxSuggestions([]);
    setGeneratedCover(null);
  };

  const runAiAnalysis = async () => {
    if (!video) return;

    setProcessing(prev => ({ ...prev, isAnalyzing: true, status: 'Detecting Cues...' }));
    
    try {
      const videoEl = document.createElement('video');
      videoEl.src = video.url;
      await new Promise((resolve) => {
        videoEl.onloadeddata = resolve;
      });
      videoEl.currentTime = 1.0; 
      await new Promise((resolve) => {
        videoEl.onseeked = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoEl, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      const result = await analyzeRawFootage(imageData, "Professional dynamic TikTok edit with specific SFX timing");
      
      setSuggestions(result.suggestions);
      setHook(result.tiktokHook);
      setHashtags(result.hashtags);
      setAudioProfile(result.audioProfile);
      setSfxSuggestions(result.sfxSuggestions);
      
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'Analysis Ready' }));
      setActiveTool(EditorTool.AUDIO); 
    } catch (error) {
      console.error(error);
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'Analysis Failed' }));
    }
  };

  const handleMagicGeneration = async () => {
    if (!video) return;
    setProcessing(prev => ({ ...prev, isGenerating: true, status: 'Generating Cover Art...' }));
    
    try {
      const videoEl = document.querySelector('video');
      if (!videoEl) throw new Error("No video element found");
      
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      canvas.getContext('2d')?.drawImage(videoEl, 0, 0);
      const baseImage = canvas.toDataURL('image/jpeg');

      const coverUrl = await generateAiCover(magicPrompt || "Cinematic TikTok aesthetic", baseImage);
      setGeneratedCover(coverUrl);
      setProcessing(prev => ({ ...prev, isGenerating: false, status: 'Cover Ready' }));
    } catch (error) {
      console.error(error);
      setProcessing(prev => ({ ...prev, isGenerating: false, status: 'Magic Failed' }));
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 tiktok-gradient rounded-xl flex items-center justify-center shadow-lg">
             <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.42-.01 2.52 0 5.04-.01 7.56-.02 2.57-.85 5.33-3.05 6.94-2.18 1.69-5.41 1.93-7.85.64-2.45-1.29-4-3.95-3.8-6.73.18-2.5 1.76-4.93 4.14-5.83.6-.23 1.25-.38 1.88-.45v4.02c-.8.15-1.63.48-2.22 1.05-.7.66-1.13 1.68-1.01 2.66.11 1.04.88 2.01 1.88 2.3 1 .28 2.15.09 2.89-.64.71-.7 1.05-1.74 1.01-2.74-.01-3.26 0-6.52-.01-9.78.02-1.33.01-2.66.01-3.99Z" />
             </svg>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight italic">EDITOR PRO</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">AI Contextual Sync Active</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
             <div className={`w-2 h-2 rounded-full ${processing.isAnalyzing || processing.isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
             <span className="text-xs font-medium text-slate-300">{processing.status}</span>
          </div>
          <button 
            className="px-6 py-2 tiktok-gradient rounded-full text-sm font-bold shadow-lg hover:brightness-110 transition-all transform active:scale-95"
          >
            Export
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-20 border-r border-slate-800 flex flex-col items-center py-6 gap-6 bg-slate-900/30">
          <SidebarButton icon="🎬" label="Import" active={activeTool === EditorTool.TRIM} onClick={() => setActiveTool(EditorTool.TRIM)} />
          <SidebarButton icon="✨" label="Magic" active={activeTool === EditorTool.AI_GEN} onClick={() => setActiveTool(EditorTool.AI_GEN)} />
          <SidebarButton icon="🎵" label="Audio" active={activeTool === EditorTool.AUDIO} onClick={() => setActiveTool(EditorTool.AUDIO)} />
          <SidebarButton icon="🔤" label="Text" active={activeTool === EditorTool.TEXT} onClick={() => setActiveTool(EditorTool.TEXT)} />
        </aside>

        <div className="flex-1 flex flex-col bg-slate-950 p-4 overflow-auto scrollbar-hide">
          <div className="flex-1 flex gap-8 items-start justify-center min-h-0">
            {/* Left Column */}
            <div className="w-80 flex flex-col gap-4 sticky top-0">
               <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-xl">
                 <h2 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest">Media Lab</h2>
                 {!video ? (
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="aspect-video border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition-all group"
                   >
                     <span className="text-3xl group-hover:scale-110 transition-transform">📂</span>
                     <span className="text-xs text-slate-500 text-center">Upload raw<br/>footage</span>
                     <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                   </div>
                 ) : (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">{video.name}</span>
                       <button onClick={() => setVideo(null)} className="text-[10px] text-pink-500 font-bold uppercase">Reset</button>
                     </div>
                     <button 
                       disabled={processing.isAnalyzing}
                       onClick={runAiAnalysis}
                       className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(8,145,178,0.3)] disabled:opacity-50 transition-all uppercase tracking-tighter"
                     >
                       {processing.isAnalyzing ? 'Analyzing...' : '⚡ Sync AI SFX'}
                     </button>
                   </div>
                 )}
               </div>

               {audioProfile && (
                 <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-xl animate-in fade-in slide-in-from-left-4">
                    <h2 className="text-sm font-bold mb-4 text-cyan-500 uppercase tracking-widest">Contextual SFX</h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-lg">🎵</div>
                        <p className="text-xs font-black text-cyan-300 uppercase italic">{audioProfile.genre}</p>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {sfxSuggestions.map((s, i) => (
                          <div key={i} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all group">
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-mono text-cyan-500">{s.timestamp}</span>
                               <span className="text-[10px] font-black text-amber-500 uppercase group-hover:scale-110 transition-transform">{s.effect}</span>
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium leading-tight">Cue: {s.visualCue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                 </div>
               )}
            </div>

            {/* Middle Preview */}
            <div className="flex-none relative">
              {generatedCover ? (
                <div className="relative w-full aspect-[9/16] max-w-[400px] bg-black rounded-3xl overflow-hidden border-4 border-cyan-500 shadow-2xl animate-in zoom-in-95">
                  <img src={generatedCover} className="w-full h-full object-cover" alt="AI Generated Cover" />
                  <button 
                    onClick={() => setGeneratedCover(null)}
                    className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                  >
                    Back to Video
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-1">AI Generated Stylized Frame</p>
                    <p className="text-[10px] text-slate-300 leading-tight">Professional cinematic grade applied using Gemini 2.5 Flash Image.</p>
                  </div>
                </div>
              ) : (
                <VideoPreview 
                  videoUrl={video?.url || null} 
                  overlayText={hook} 
                  sfxSuggestions={sfxSuggestions}
                />
              )}
            </div>

            {/* Right Column */}
            <div className="w-80 flex flex-col gap-4 sticky top-0">
               {activeTool === EditorTool.AI_GEN ? (
                 <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-xl animate-in zoom-in-95 duration-200">
                    <h2 className="text-sm font-bold mb-4 text-pink-500 uppercase tracking-widest">AI Cover Magic</h2>
                    <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                      Generate a stylized cinematic cover frame using Flash Image model. High impact, low latency.
                    </p>
                    <textarea 
                      value={magicPrompt}
                      onChange={(e) => setMagicPrompt(e.target.value)}
                      placeholder="e.g. Cyberpunk aesthetic with neon glows..."
                      className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none mb-3"
                    />
                    <button 
                      disabled={processing.isGenerating || !video}
                      onClick={handleMagicGeneration}
                      className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-xl text-sm font-black shadow-lg disabled:opacity-50 transition-all uppercase tracking-tighter italic"
                    >
                      {processing.isGenerating ? 'Processing...' : '✨ Generate Style'}
                    </button>
                 </div>
               ) : (
                 <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-xl">
                    <h2 className="text-sm font-bold mb-4 text-amber-500 uppercase tracking-widest">Audio Master</h2>
                    <div className="space-y-5">
                      <MasteringControl label="Bass Punch" value={90} />
                      <MasteringControl label="SFX Presence" value={85} />
                      <div className="p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
                        <p className="text-[10px] text-cyan-400 font-bold uppercase mb-1">Smart Ducking Active</p>
                        <p className="text-[9px] text-slate-400 leading-relaxed italic">
                          Music volume automatically drops by 80% during SFX cues for maximum clarity.
                        </p>
                      </div>
                    </div>
                 </div>
               )}

               <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 shadow-xl flex-1">
                  <h2 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest">Sync Settings</h2>
                  <div className="space-y-4">
                     <EssentialToggle label="Contextual SFX" enabled={!!audioProfile} />
                     <EssentialToggle label="Auto Ducking" enabled />
                     <EssentialToggle label="AI Color Grade" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <Timeline 
        duration={video?.duration || 0} 
        suggestions={suggestions} 
        sfxSuggestions={sfxSuggestions}
        audioProfile={audioProfile}
        currentTime={0} 
      />
    </div>
  );
};

const SidebarButton: React.FC<{ icon: string, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 group w-full transition-all ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${active ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)] rotate-3' : 'bg-slate-800/50 border border-transparent group-hover:bg-slate-800'}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black tracking-widest uppercase">{label}</span>
  </button>
);

const MasteringControl: React.FC<{ label: string, value: number }> = ({ label, value }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center px-1">
      <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
      <span className="text-[10px] font-mono text-cyan-500">{value}%</span>
    </div>
    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const EssentialToggle: React.FC<{ label: string, enabled?: boolean }> = ({ label, enabled = false }) => {
  const [isOn, setIsOn] = useState(enabled);
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
      <button onClick={() => setIsOn(!isOn)} className={`w-9 h-5 rounded-full relative transition-all duration-300 ${isOn ? 'bg-cyan-500' : 'bg-slate-800'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isOn ? 'left-5 shadow-sm' : 'left-1'}`} />
      </button>
    </div>
  );
};

export default App;
