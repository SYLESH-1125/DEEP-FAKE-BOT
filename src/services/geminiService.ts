import { GoogleGenerativeAI } from '@google/generative-ai';
import { EmotionType, VoiceSettings } from '../types';

// Add your Gemini API key here
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key-here';

class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here') {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      console.log('🤖 Gemini API initialized successfully');
    } else {
      console.log('⚠️ Gemini API key not configured - using basic enhancement');
      // Still initialize but it will fail gracefully and use fallback
      this.genAI = new GoogleGenerativeAI('demo-key');
    }
  }

  async enhanceScript(originalScript: string, emotion: EmotionType): Promise<string> {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.log('Gemini API key not configured, returning original script');
        return originalScript; // Return original if no API key
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        You are an expert script writer specializing in emotional expression for realistic talking videos.
        
        Original script: "${originalScript}"
        Target emotion: ${emotion.name} (${emotion.description})
        
        Please enhance this script to make it more emotionally expressive for a ${emotion.name.toLowerCase()} delivery.
        
        Guidelines:
        - Maintain the core message but enhance emotional impact
        - Add appropriate pauses, emphasis, and emotional inflection markers
        - Keep it natural and realistic for human speech
        - Add subtle emotional cues that work well with facial animation
        - Length should be similar to original (don't make it much longer)
        - Use punctuation and capitalization to indicate emphasis
        - Add [pause] markers where natural pauses would enhance emotion
        
        Return only the enhanced script, nothing else.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const enhancedScript = response.text();

      return enhancedScript.trim();
    } catch (error) {
      console.error('Error enhancing script with Gemini:', error);
      // Return enhanced version using simple rules instead of throwing error
      console.log('Creating basic enhancement due to API error');
      return this.createBasicEnhancement(originalScript, emotion);
    }
  }

  // Fallback enhancement when API fails
  private createBasicEnhancement(script: string, emotion: EmotionType): string {
    let enhanced = script;

    // Add emotional markers based on emotion type
    switch (emotion.id) {
      case 'happy':
        enhanced = enhanced.replace(/\./g, '! ').replace(/\?/g, '?! ');
        break;
      case 'sad':
        enhanced = enhanced.replace(/\./g, '... ');
        break;
      case 'motivational':
        enhanced = enhanced.toUpperCase().replace(/\./g, '! ');
        break;
      case 'calm':
        enhanced = enhanced.replace(/\./g, '. [pause] ');
        break;
      case 'angry':
        enhanced = enhanced.toUpperCase().replace(/\./g, '! ');
        break;
      case 'excited':
        enhanced = enhanced.replace(/\./g, '!! ').replace(/\?/g, '?! ');
        break;
      case 'professional':
        // Keep professional tone clean
        break;
      case 'romantic':
        enhanced = enhanced.replace(/\./g, '... ');
        break;
    }

    return enhanced;
  }

  async generateEmotionalVoiceSettings(emotion: EmotionType, script: string): Promise<VoiceSettings> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Based on the emotion "${emotion.name}" and the script content, suggest optimal voice settings for text-to-speech.
        
        Emotion: ${emotion.name} (${emotion.description})
        Script: "${script}"
        
        Please analyze and return voice settings in this exact JSON format:
        {
          "pitch": [number between 0.5 and 2.0, where 1.0 is normal],
          "speed": [number between 0.5 and 2.0, where 1.0 is normal],
          "emotion": "${emotion.name.toLowerCase()}",
          "gender": "[male/female/neutral based on what works best for this emotion]"
        }
        
        Guidelines:
        - Happy/Excited: higher pitch, faster speed
        - Sad: lower pitch, slower speed  
        - Motivational: confident pitch, dynamic speed
        - Calm: steady pitch, moderate speed
        - Angry: intense pitch, varied speed
        - Professional: clear pitch, measured speed
        - Romantic: warm pitch, gentle speed
        
        Return only the JSON object, nothing else.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const settingsText = response.text().trim();
      
      // Parse the JSON response
      const settings = JSON.parse(settingsText);
      
      return {
        pitch: Math.max(0.5, Math.min(2.0, settings.pitch || 1.0)),
        speed: Math.max(0.5, Math.min(2.0, settings.speed || 1.0)),
        emotion: settings.emotion || emotion.name.toLowerCase(),
        gender: settings.gender || 'neutral'
      };
    } catch (error) {
      console.error('Error generating voice settings:', error);
      // Return default settings based on emotion
      return this.getDefaultVoiceSettings(emotion);
    }
  }

  private getDefaultVoiceSettings(emotion: EmotionType): VoiceSettings {
    const defaults: { [key: string]: VoiceSettings } = {
      happy: { pitch: 1.2, speed: 1.1, emotion: 'happy', gender: 'neutral' },
      sad: { pitch: 0.8, speed: 0.9, emotion: 'sad', gender: 'neutral' },
      motivational: { pitch: 1.1, speed: 1.0, emotion: 'motivational', gender: 'neutral' },
      calm: { pitch: 1.0, speed: 0.95, emotion: 'calm', gender: 'neutral' },
      angry: { pitch: 1.3, speed: 1.2, emotion: 'angry', gender: 'neutral' },
      excited: { pitch: 1.4, speed: 1.3, emotion: 'excited', gender: 'neutral' },
      professional: { pitch: 1.0, speed: 1.0, emotion: 'professional', gender: 'neutral' },
      romantic: { pitch: 0.9, speed: 0.9, emotion: 'romantic', gender: 'neutral' }
    };

    return defaults[emotion.id] || { pitch: 1.0, speed: 1.0, emotion: 'neutral', gender: 'neutral' };
  }

  async generateVideoDescription(script: string, emotion: EmotionType): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Create a concise description for a realistic talking video with the following details:
        
        Script: "${script}"
        Emotion: ${emotion.name} (${emotion.description})
        
        Generate a brief, professional description (2-3 sentences) that describes what viewers will see in this talking video.
        Focus on the emotional tone and message delivery style.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating video description:', error);
      return `A ${emotion.name.toLowerCase()} talking video delivering your message with authentic emotional expression.`;
    }
  }
}

export const geminiService = new GeminiService();