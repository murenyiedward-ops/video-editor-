
import { GoogleGenAI, Type } from "@google/genai";
import { EditSuggestion, AudioProfile, SfxSuggestion } from "../types";

export const analyzeRawFootage = async (
  imageData: string, 
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: imageData.split(',')[1], mimeType: 'image/jpeg' } },
          { text: `Analyze this raw video footage frame for a high-end TikTok/Reels edit. 
                   The user description: ${description}. 
                   
                   TASK 1: Visual Cue Analysis
                   Detect fast pans (Whoosh), sudden object appearances (Pop/Ding), rapid cuts (Snap), or impactful movements (Thud/Boom).
                   
                   TASK 2: SFX Contextualization
                   Suggest SFX that are contextually relevant. 
                   - Fast movement? 'CineWhoosh'
                   - Quick cut or text pop? 'ModernPop'
                   - Sparkle or highlight? 'GlimmerChime'
                   - Heavy drop? 'SubBoom'
                   
                   TASK 3: TikTok Editorial
                   Provide a viral hook, hashtags, and a sequence of recommended edit actions.
                   
                   Return strictly JSON.` }
        ]
      },
      config: {
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
                trendingReference: { type: Type.STRING }
              },
              required: ['mood', 'genre', 'bpmRange', 'trendingReference']
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

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateAiCover = async (prompt: string, baseImage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/jpeg' } },
          { text: `Create a stylized, cinematic TikTok cover frame based on this image. Theme: ${prompt}. Make it pop with professional lighting and color grading.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
