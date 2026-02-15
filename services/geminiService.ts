
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EditSuggestion, AudioProfile, SfxSuggestion, ChatMessage, GroundingLink } from "../types";

const ensureArray = (val: any) => Array.isArray(val) ? val : [];

/**
 * Strategy analysis using Gemini 3 Pro with Thinking Mode.
 */
export const getStrategyWithThinking = async (description: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Develop a comprehensive viral strategy for a TikTok video described as: ${description}. Analyze trends, hook potential, and retention tactics.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });
  return response.text || "No strategy generated.";
};

/**
 * Discovery using Google Search and Maps Grounding.
 */
export const discoverySearch = async (query: string, location?: { lat: number; lng: number }): Promise<{ text: string, links: GroundingLink[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [
        { googleSearch: {} },
        { googleMaps: {} }
      ],
      ...(location ? {
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.lat,
              longitude: location.lng
            }
          }
        }
      } : {})
    },
  });

  const links: GroundingLink[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  chunks.forEach((chunk: any) => {
    if (chunk.web) links.push({ uri: chunk.web.uri, title: chunk.web.title });
    if (chunk.maps) links.push({ uri: chunk.maps.uri, title: chunk.maps.title });
  });

  return { text: response.text || "", links };
};

/**
 * Multimodal Raw Footage Analysis.
 * Analyzes visual cues and audio track to suggest edits and AI-generated music.
 */
export const analyzeRawFootage = async (
  imageData: string, 
  audioData: string | null,
  description: string
): Promise<{ 
  suggestions: EditSuggestion[], 
  tiktokHook: string, 
  hashtags: string[],
  audioProfile: AudioProfile,
  sfxSuggestions: SfxSuggestion[]
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const parts: any[] = [
      { inlineData: { data: imageData.split(',')[1], mimeType: 'image/jpeg' } },
      { text: `Analyze this raw video footage for a professional TikTok edit.
               Description: ${description}.
               
               TASK:
               1. Analyze visual cues (movement, energy, lighting).
               2. Analyze the provided audio track for rhythm, BPM, and mood.
               3. Suggest a viral TikTok hook and hashtags.
               4. Map specific SFX cues to visual movements.
               5. Suggest a relevant AI-GENERATED music prompt that would enhance this specific footage.
               
               Return strictly JSON.` }
    ];

    if (audioData) {
      parts.push({ inlineData: { data: audioData, mimeType: 'audio/mp3' } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tiktokHook: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            audioProfile: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                genre: { type: Type.STRING },
                bpmRange: { type: Type.STRING },
                trendingReference: { type: Type.STRING },
                suggestedMusicDescription: { type: Type.STRING },
                rhythmAnalysis: { type: Type.STRING }
              },
              required: ['mood', 'genre', 'bpmRange', 'trendingReference', 'suggestedMusicDescription', 'rhythmAnalysis']
            },
            sfxSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  effect: { type: Type.STRING },
                  visualCue: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ['timestamp', 'effect', 'visualCue', 'reason']
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  action: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  overlayText: { type: Type.STRING }
                },
                required: ['timestamp', 'action', 'reason']
              }
            }
          },
          required: ['tiktokHook', 'hashtags', 'suggestions', 'audioProfile', 'sfxSuggestions']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    return {
      tiktokHook: data.tiktokHook || "Viral Moment Found!",
      hashtags: ensureArray(data.hashtags),
      suggestions: ensureArray(data.suggestions),
      audioProfile: data.audioProfile || { 
        mood: 'Energetic', 
        genre: 'Phonk', 
        bpmRange: '120-130', 
        trendingReference: 'Viral Beats',
        suggestedMusicDescription: 'Fast-paced rhythmic bass music',
        rhythmAnalysis: 'Highly syncopated with a clear 4/4 pulse'
      },
      sfxSuggestions: ensureArray(data.sfxSuggestions)
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', imageBase64?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    ...(imageBase64 ? {
      image: {
        imageBytes: imageBase64.split(',')[1],
        mimeType: 'image/png'
      }
    } : {}),
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResp.blob();
  return URL.createObjectURL(blob);
};

export const generateProImage = async (prompt: string, size: '1K' | '2K' | '4K') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "9:16",
        imageSize: size
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
