
export interface VideoMetadata {
  id: string;
  name: string;
  url: string;
  duration: number;
  type: string;
}

export interface AudioProfile {
  mood: string;
  genre: string;
  bpmRange: string;
  trendingReference: string;
  suggestedMusicDescription: string;
  rhythmAnalysis: string;
}

export interface SfxSuggestion {
  timestamp: string;
  effect: string;
  reason: string;
  visualCue: string;
}

export interface EditSuggestion {
  timestamp: string;
  action: string;
  reason: string;
  overlayText?: string;
  suggestedAudio?: string;
}

export interface ProcessingState {
  isAnalyzing: boolean;
  isGenerating: boolean;
  progress: number;
  status: string;
}

export enum EditorTool {
  TRIM = 'TRIM',
  TEXT = 'TEXT',
  EFFECTS = 'EFFECTS',
  AI_GEN = 'AI_GEN',
  AUDIO = 'AUDIO',
  STRATEGY = 'STRATEGY',
  DISCOVERY = 'DISCOVERY'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GroundingLink {
  uri: string;
  title: string;
}
