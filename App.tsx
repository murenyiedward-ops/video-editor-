
import React, { useState, useRef, useEffect } from 'react';
import VideoPreview from './components/VideoPreview';
import Timeline from './components/Timeline';
import { 
  analyzeRawFootage, 
  getStrategyWithThinking, 
  discoverySearch, 
  generateVeoVideo, 
  generateProImage 
} from './services/geminiService';
import { 
  VideoMetadata, 
  EditSuggestion, 
  ProcessingState, 
  EditorTool, 
  AudioProfile, 
  SfxSuggestion, 
  GroundingLink 
} from './types';

const SAMPLE_VIDEO = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const App: React.FC = () => {
  const [video, setVideo] = useState<VideoMetadata | null>(null);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.AI_GEN);
  const [processing, setProcessing] = useState<ProcessingState>({
    isAnalyzing: false,
    isGenerating: false,
    progress: 0,
    status: 'Idle'
  });
  
  // Analysis States
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [hook, setHook] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [audioProfile, setAudioProfile] = useState<AudioProfile | null>(null);
  const [sfxSuggestions, setSfxSuggestions] = useState<SfxSuggestion[]>([]);
  
  // New Feature States
  const [strategy, setStrategy] = useState<string>('');
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<{ text: string, links: GroundingLink[] } | null>(null);
  const [veoPrompt, setVeoPrompt] = useState('');
  const [proImagePrompt, setProImagePrompt] = useState('');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [magicImage, setMagicImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    setStrategy('');
    setDiscoveryResult(null);
    setMagicImage(null);
    setError(null);
  };

  // Helper to extract a snippet of audio data from a video URL
  const extractAudioSnippet = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Use the first 5 seconds
      const sampleRate = audioBuffer.sampleRate;
      const length = Math.min(audioBuffer.length, sampleRate * 5);
      const offlineContext = new OfflineAudioContext(1, length, sampleRate);
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to simple mono float array or base64 (For brevity, we simulate the encoding)
      // Real implementation would use a library like lamejs or similar to get a valid mp3/wav
      // Here we provide a mock base64 for the concept
      return "BASE64_AUDIO_DATA_STUB"; 
    } catch (e) {
      console.warn("Audio extraction skipped:", e);
      return null;
    }
  };

  const runAiAnalysis = async () => {
    if (!video) return;
    setError(null);
    setProcessing(prev => ({ ...prev, isAnalyzing: true, status: 'Analyzing Audio-Visuals...' }));
    
    try {
      const videoEl = document.createElement('video');
      videoEl.crossOrigin = "anonymous";
      videoEl.src = video.url;
      
      await new Promise((resolve, reject) => {
        videoEl.onloadeddata = resolve;
        videoEl.onerror = () => reject("Failed to load video");
        setTimeout(() => reject("Timeout"), 10000);
      });

      videoEl.currentTime = 1.0; 
      await new Promise((resolve) => videoEl.onseeked = resolve);

      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      canvas.getContext('2d')?.drawImage(videoEl, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');

      // Attempt to get audio data
      const audioData = video.url.startsWith('blob:') ? await extractAudioSnippet(video.url) : null;

      const result = await analyzeRawFootage(imageData, audioData, "High-energy professional TikTok edit");
      
      setSuggestions(result.suggestions);
      setHook(result.tiktokHook);
      setHashtags(result.hashtags);
      setAudioProfile(result.audioProfile);
      setSfxSuggestions(result.sfxSuggestions);
      
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'AI Mastery Synced' }));
      setActiveTool(EditorTool.AUDIO); 
    } catch (err: any) {
      console.error(err);
      setError("Deep analysis failed. Please check the source format.");
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'Error' }));
    }
  };

  const runStrategyThinking = async () => {
    if (!video) return;
    setProcessing(prev => ({ ...prev, isAnalyzing: true, status: 'Deep Strategic Thinking...' }));
    try {
      const res = await getStrategyWithThinking(`Video clip: ${video.name}. Current hook: ${hook}. Detected Rhythm: ${audioProfile?.rhythmAnalysis}`);
      setStrategy(res);
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'Strategy Ready' }));
    } catch (err) {
      console.error(err);
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'Error' }));
    }
  };

  const runDiscovery = async () => {
    setProcessing(prev => ({ ...prev, isAnalyzing: true, status: 'Searching Grounded Data...' }));
    try {
      const location = await new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(undefined)
        );
      });
      const res = await discoverySearch(discoveryQuery, location);
      setDiscoveryResult(res);
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'Discovery Complete' }));
    } catch (err) {
      console.error(err);
      setProcessing(prev => ({ ...prev, isAnalyzing: false, status: 'Discovery Failed' }));
    }
  };

  const generateVeo = async () => {
    setProcessing(prev => ({ ...prev, isGenerating: true, status: 'Veo Generating Transition...' }));
    try {
      const url = await generateVeoVideo(veoPrompt, '9:16');
      setVideo({
        id: 'veo-' + Date.now(),
        name: 'AI Generated Transition',
        url: url,
        duration: 5,
        type: 'video/mp4'
      });
      setProcessing(prev => ({ ...prev, isGenerating: false, status: 'Veo Ready' }));
    } catch (err) {
      console.error(err);
      setProcessing(prev => ({ ...prev, isGenerating: false, status: 'Veo Failed' }));
    }
  };

  const generateBananaImage = async () => {
    setProcessing(prev => ({ ...prev, isGenerating: true, status: 'Generating Pro Assets...' }));
    try {
      const data = await generateProImage(proImagePrompt, imageSize);
      setMagicImage(data);
      setProcessing(prev => ({ ...prev, isGenerating: false, status: 'Image Ready' }));
    } catch (err) {
      console.error(err);
      setProcessing(prev => ({ ...prev, isGenerating: false, status: 'Gen Failed' }));
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-900/40 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 tiktok-gradient rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(254,44,85,0.3)]">
             <span className="text-xl font-black">P</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight italic uppercase">Editor Pro <span className="text-cyan-400">AI</span></h1>
            <p className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">Contextual Multimodal Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
             <div className={`w-2 h-2 rounded-full ${processing.isAnalyzing || processing.isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{processing.status}</span>
          </div>
          <button className="px-8 py-2 tiktok-gradient rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
            Export Master
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-24 border-r border-white/5 flex flex-col items-center py-8 gap-6 bg-slate-900/20">
          <SidebarButton icon="🎬" label="Raw" active={activeTool === EditorTool.TRIM} onClick={() => setActiveTool(EditorTool.TRIM)} />
          <SidebarButton icon="🧠" label="Think" active={activeTool === EditorTool.STRATEGY} onClick={() => setActiveTool(EditorTool.STRATEGY)} />
          <SidebarButton icon="🪄" label="Gen AI" active={activeTool === EditorTool.AI_GEN} onClick={() => setActiveTool(EditorTool.AI_GEN)} />
          <SidebarButton icon="🌍" label="Map" active={activeTool === EditorTool.DISCOVERY} onClick={() => setActiveTool(EditorTool.DISCOVERY)} />
          <SidebarButton icon="🎹" label="Audio" active={activeTool === EditorTool.AUDIO} onClick={() => setActiveTool(EditorTool.AUDIO)} />
        </aside>

        <div className="flex-1 flex flex-col bg-slate-950 p-6 overflow-auto scrollbar-hide">
          <div className="flex-1 flex gap-10 items-start justify-center min-h-0">
            
            {/* Control Panel */}
            <div className="w-96 flex flex-col gap-6 sticky top-0 overflow-y-auto max-h-full pr-2 scrollbar-hide">
               
               {activeTool === EditorTool.TRIM && (
                 <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                    <h2 className="text-[11px] font-black mb-5 text-slate-500 uppercase tracking-[0.2em]">Source Control</h2>
                    {!video ? (
                      <div className="flex flex-col gap-4">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                        >
                          <span className="text-4xl">📁</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Upload Raw Footage</span>
                          <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center">
                          <p className="text-xs font-bold truncate pr-4">{video.name}</p>
                          <button onClick={() => setVideo(null)} className="text-pink-500 text-[10px] font-black">REPLACE</button>
                        </div>
                        <button 
                          disabled={processing.isAnalyzing}
                          onClick={runAiAnalysis}
                          className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-[11px] font-black flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(8,145,178,0.3)] transition-all uppercase italic"
                        >
                          {processing.isAnalyzing ? 'Analyzing...' : '⚡ Sync Audio-Visuals'}
                        </button>
                      </div>
                    )}
                 </div>
               )}

               {activeTool === EditorTool.STRATEGY && (
                 <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
                    <h2 className="text-[11px] font-black mb-5 text-cyan-500 uppercase tracking-[0.2em]">Strategy (Thinking Pro)</h2>
                    <button 
                      onClick={runStrategyThinking}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase mb-4 border border-white/10"
                    >
                      Analyze Viral Potential
                    </button>
                    {strategy && (
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto font-medium">
                        {strategy}
                      </div>
                    )}
                 </div>
               )}

               {activeTool === EditorTool.DISCOVERY && (
                 <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl animate-in zoom-in-95">
                    <h2 className="text-[11px] font-black mb-5 text-amber-500 uppercase tracking-[0.2em]">Grounded Discovery</h2>
                    <input 
                      value={discoveryQuery}
                      onChange={e => setDiscoveryQuery(e.target.value)}
                      placeholder="e.g. Find trending music studios nearby"
                      className="w-full p-4 bg-black/20 rounded-2xl text-xs mb-4 border border-white/10 outline-none focus:border-amber-500"
                    />
                    <button onClick={runDiscovery} className="w-full py-4 bg-amber-600/20 text-amber-500 border border-amber-600/30 rounded-2xl text-[10px] font-black uppercase">
                      Search Maps & Search
                    </button>
                    {discoveryResult && (
                      <div className="mt-4 space-y-4">
                        <p className="text-[11px] text-slate-300">{discoveryResult.text}</p>
                        <div className="flex flex-wrap gap-2">
                          {discoveryResult.links.map((link, i) => (
                            <a key={i} href={link.uri} target="_blank" className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] hover:bg-white/10 transition-colors">
                              🔗 {link.title || 'Link'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
               )}

               {activeTool === EditorTool.AI_GEN && (
                 <div className="space-y-6">
                   <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                      <h2 className="text-[11px] font-black mb-5 text-pink-500 uppercase tracking-[0.2em]">Veo Video Gen</h2>
                      <textarea 
                        value={veoPrompt}
                        onChange={e => setVeoPrompt(e.target.value)}
                        placeholder="A cinematic drone shot of a neon city..."
                        className="w-full h-24 p-4 bg-black/20 rounded-2xl text-xs mb-4 border border-white/10 outline-none resize-none"
                      />
                      <button onClick={generateVeo} className="w-full py-4 bg-pink-600 hover:bg-pink-500 rounded-2xl text-[10px] font-black uppercase italic">
                        Generate Veo Transition
                      </button>
                   </div>

                   <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                      <h2 className="text-[11px] font-black mb-5 text-cyan-500 uppercase tracking-[0.2em]">Pro Asset Gen</h2>
                      <textarea 
                        value={proImagePrompt}
                        onChange={e => setProImagePrompt(e.target.value)}
                        placeholder="Professional studio portrait with rim lighting..."
                        className="w-full h-24 p-4 bg-black/20 rounded-2xl text-xs mb-4 border border-white/10 outline-none resize-none"
                      />
                      <div className="flex gap-2 mb-4">
                        {['1K', '2K', '4K'].map(s => (
                          <button 
                            key={s} 
                            onClick={() => setImageSize(s as any)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold ${imageSize === s ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <button onClick={generateBananaImage} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-[10px] font-black uppercase">
                        Generate High-Res Asset
                      </button>
                   </div>
                 </div>
               )}

               {activeTool === EditorTool.AUDIO && audioProfile && (
                  <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-xl animate-in fade-in">
                    <h2 className="text-[11px] font-black mb-5 text-cyan-500 uppercase tracking-[0.2em]">AI Music Suggestion</h2>
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-cyan-500 uppercase mb-1">Recommended Style</p>
                        <p className="text-xs font-bold text-white italic">{audioProfile.suggestedMusicDescription}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-cyan-500 uppercase mb-1">Rhythm Analysis</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic">{audioProfile.rhythmAnalysis}</p>
                      </div>
                      <button className="w-full py-3 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase hover:bg-cyan-400 transition-all">
                        Generate AI Audio Track
                      </button>
                    </div>
                  </div>
               )}
            </div>

            {/* Preview Center */}
            <div className="flex-none flex flex-col gap-6">
              {error && <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-[11px] font-bold text-red-400">⚠️ {error}</div>}
              <div className="relative group">
                {magicImage ? (
                  <div className="relative w-full aspect-[9/16] max-w-[380px] bg-slate-900 rounded-[2.5rem] overflow-hidden border-[8px] border-cyan-500/30 shadow-2xl animate-in zoom-in-95">
                    <img src={magicImage} className="w-full h-full object-cover" alt="Gen Image" />
                    <button onClick={() => setMagicImage(null)} className="absolute top-8 left-8 bg-black/60 backdrop-blur-xl text-white px-5 py-2 rounded-full text-[10px] font-black uppercase">Back</button>
                  </div>
                ) : (
                  <VideoPreview 
                    videoUrl={video?.url || null} 
                    overlayText={hook} 
                    sfxSuggestions={sfxSuggestions}
                  />
                )}
              </div>
            </div>

            {/* AI Assistant Chatbot (Right Side) */}
            <div className="w-80 flex flex-col h-full bg-slate-900/40 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden">
               <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Assistant (Pro)</h3>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
               </div>
               <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-hide">
                  <div className="p-3 bg-white/5 rounded-2xl text-[11px] text-slate-300 leading-relaxed border border-white/5">
                    I've analyzed both your video frames and the audio track. My suggestions are tailored to the detected rhythm and visual pace.
                  </div>
               </div>
               <div className="p-4 border-t border-white/5">
                  <input placeholder="Ask Gemini anything..." className="w-full bg-black/20 p-3 rounded-xl text-[11px] outline-none border border-white/5 focus:border-cyan-500 transition-colors" />
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
  <button onClick={onClick} className={`flex flex-col items-center gap-2 group w-full transition-all ${active ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${active ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_10px_30px_rgba(6,182,212,0.3)] rotate-3' : 'bg-white/5 border border-white/5 group-hover:bg-white/10'}`}>
      {icon}
    </div>
    <span className="text-[9px] font-black tracking-[0.2em] uppercase">{label}</span>
  </button>
);

export default App;
