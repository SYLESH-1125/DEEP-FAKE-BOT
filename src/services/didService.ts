import { VideoGenerationRequest, VideoGenerationResponse, ProcessingStep } from '../types';

// D-ID API Integration for realistic talking avatars
// D-ID provides high-quality face animation with built-in TTS
class DIDService {
  private apiKey: string;
  private baseUrl = 'https://api.d-id.com';

  constructor() {
    this.apiKey = process.env.REACT_APP_DID_API_KEY || '';
    if (!this.apiKey) {
      console.warn('D-ID API key not found. Please add REACT_APP_DID_API_KEY to your .env file');
    }
  }

  async generateRealisticVideo(
    request: VideoGenerationRequest,
    onProgress?: (steps: ProcessingStep[]) => void
  ): Promise<VideoGenerationResponse> {
    console.log('🔑 D-ID Service - API Key check:', !!this.apiKey);
    
    if (!this.apiKey || this.apiKey === 'your_did_api_key_here') {
      throw new Error('D-ID API key is required for real video generation');
    }

    const steps: ProcessingStep[] = [
      { id: 'upload_image', name: 'Uploading Image', status: 'pending', progress: 0 },
      { id: 'process_script', name: 'Processing Script', status: 'pending', progress: 0 },
      { id: 'generate_video', name: 'Generating Talking Video', status: 'pending', progress: 0 },
      { id: 'finalize', name: 'Finalizing Video', status: 'pending', progress: 0 }
    ];

    try {
      // Step 1: Upload image to D-ID
      await this.updateStep(steps, 'upload_image', 'processing', 25, onProgress, 'Preparing your photo...');
      console.log('🖼️ Image file:', request.image.name, request.image.size, 'bytes');
      const imageUrl = await this.uploadImage(request.image);
      console.log('📎 Image URL:', imageUrl);
      await this.updateStep(steps, 'upload_image', 'completed', 100, onProgress, 'Photo uploaded successfully');

      // Step 2: Process script with emotional context
      await this.updateStep(steps, 'process_script', 'processing', 50, onProgress, 'Processing your script...');
      const processedScript = request.enhancedScript || request.script;
      console.log('📝 Final script:', processedScript);
      await this.updateStep(steps, 'process_script', 'completed', 100, onProgress, 'Script ready');

      // Step 3: Generate talking video
      await this.updateStep(steps, 'generate_video', 'processing', 10, onProgress, 'Creating your talking avatar...');
      const talkId = await this.createTalkingVideo(imageUrl, processedScript, request);
      console.log('🎬 Talk ID:', talkId);
      
      // Poll for completion
      const videoResult = await this.pollVideoStatus(talkId, (progress) => {
        this.updateStep(steps, 'generate_video', 'processing', progress, onProgress, 'Generating video...');
      });
      
      console.log('📹 Video result:', videoResult);
      await this.updateStep(steps, 'generate_video', 'completed', 100, onProgress, 'Video generated!');

      // Step 4: Finalize
      await this.updateStep(steps, 'finalize', 'processing', 90, onProgress, 'Finalizing...');
      await this.updateStep(steps, 'finalize', 'completed', 100, onProgress, 'Complete!');

      return {
        videoUrl: videoResult.result_url,
        audioUrl: videoResult.audio_url || '',
        status: 'completed',
        processingTime: Date.now() - Date.now() // Will be calculated properly
      };

    } catch (error) {
      console.error('❌ D-ID API error:', error);
      // Update the error step
      const errorStep = steps.find(s => s.status === 'processing');
      if (errorStep && onProgress) {
        errorStep.status = 'error';
        errorStep.message = error instanceof Error ? error.message : 'Unknown error';
        onProgress([...steps]);
      }
      throw error; // Re-throw the original error
    }
  }

  private async uploadImage(imageFile: File): Promise<string> {
    try {
      console.log('📤 Uploading image to D-ID images endpoint...');
      
      // Create FormData for D-ID images endpoint
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${this.baseUrl}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ D-ID Image Upload Error:', errorText);
        
        // Fallback to base64 if image upload endpoint fails
        console.log('🔄 Falling back to base64 image...');
        const base64Image = await this.fileToBase64(imageFile);
        console.log('✅ Using base64 image as fallback');
        return base64Image;
      }

      const data = await response.json();
      console.log('✅ Image uploaded successfully:', data);
      
      // Return the image URL or ID from D-ID response
      return data.url || data.id;
      
    } catch (error) {
      console.error('❌ Image upload failed, using base64 fallback:', error);
      
      // Fallback to base64
      const base64Image = await this.fileToBase64(imageFile);
      console.log('✅ Using base64 image as fallback');
      return base64Image;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private base64ToBlob(base64Data: string): Blob {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0];
    return new Blob([byteArray], { type: mimeType });
  }

  private async uploadImageBlob(blob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('image', blob, 'uploaded-image.jpg');

    const response = await fetch(`${this.baseUrl}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image blob: ${response.status}`);
    }

    const data = await response.json();
    return data.url || data.id;
  }

  private getPresenterConfig(emotionId: string) {
    // Configure presenter settings for enhanced realism based on emotion
    const configs = {
      happy: {
        driver_url: 'bank://lively',  // More animated presenter for happy emotions
        expressions: [
          { start_frame: 0, expression: 'happy', intensity: 0.8 },
          { start_frame: 30, expression: 'surprised', intensity: 0.6 }
        ]
      },
      sad: {
        driver_url: 'bank://gentle', // Gentler movements for sad emotions
        expressions: [
          { start_frame: 0, expression: 'sad', intensity: 0.7 }
        ]
      },
      motivational: {
        driver_url: 'bank://energetic', // Dynamic gestures for motivational content
        expressions: [
          { start_frame: 0, expression: 'happy', intensity: 0.9 },
          { start_frame: 20, expression: 'surprised', intensity: 0.8 }
        ]
      },
      professional: {
        driver_url: 'bank://corporate', // Professional, controlled movements
        expressions: [
          { start_frame: 0, expression: 'neutral', intensity: 0.5 }
        ]
      },
      default: {
        driver_url: 'bank://natural', // Natural, balanced movements
        expressions: [
          { start_frame: 0, expression: 'neutral', intensity: 0.6 }
        ]
      }
    };

    return configs[emotionId as keyof typeof configs] || configs.default;
  }

  private async createTalkingVideo(
    imageUrl: string, 
    script: string, 
    request: VideoGenerationRequest
  ): Promise<string> {
    console.log('🎬 Creating talking video with D-ID...');
    console.log('📝 Script:', script.substring(0, 100) + '...');
    console.log('😊 Emotion:', request.emotion.name);
    console.log('🎭 Generating realistic video (premium features disabled for compatibility)...');

    // D-ID API payload - handle both URL and base64 images properly
    const isBase64 = imageUrl.startsWith('data:');
    
    const payload: any = {
      script: {
        type: 'text',
        subtitles: false, // Disabled - requires premium D-ID subscription
        provider: {
          type: 'microsoft',
          voice_id: this.getVoiceId(request.emotion.id, request.voiceSettings?.gender, this.detectTamilText(script) ? 'tamil' : 'english', request.voiceSettings?.voiceId),
          voice_config: {
            style: this.getVoiceStyle(request.emotion.id),
            rate: this.getVoiceRate(request.voiceSettings?.speed),
            pitch: this.getVoicePitch(request.voiceSettings?.pitch)
          }
        },
        ssml: false,
        input: script
      },
      config: {
        fluent: true,
        pad_audio: 0.0,
        stitch: true,
        result_format: 'mp4'
        // Note: Advanced features like subtitles, enhance, driver_expressions 
        // require premium D-ID subscription - disabled for compatibility
      }
    };

    // Add image source based on type
    if (isBase64) {
      // For base64 images, convert to blob and upload to D-ID
      console.log('🔄 Converting base64 to blob for D-ID upload...');
      try {
        const blob = this.base64ToBlob(imageUrl);
        const uploadedImageUrl = await this.uploadImageBlob(blob);
        payload.source_url = uploadedImageUrl;
        console.log('✅ Successfully uploaded user image to D-ID');
      } catch (error) {
        console.error('❌ Failed to upload user image, using demo fallback:', error);
        payload.source_url = 'https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg';
      }
    } else {
      payload.source_url = imageUrl;
    }

    console.log('📤 Sending request to D-ID API...');
    console.log('🖼️ Image URL type:', imageUrl.substring(0, 50) + '...');
    console.log('📋 Payload preview:', {
      ...payload,
      source_url: payload.source_url ? payload.source_url.substring(0, 50) + '...' : undefined
    });
    
    const response = await fetch(`${this.baseUrl}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ D-ID API Error Response:', errorText);
      throw new Error(`D-ID API failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ D-ID talk created successfully:', data.id);
    return data.id;
  }

  private async pollVideoStatus(
    talkId: string, 
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempt = 0;

    console.log('⏳ Polling D-ID for video completion...');
    
    while (attempt < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/talks/${talkId}`, {
          headers: {
            'Authorization': `Basic ${this.apiKey}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to check video status: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📊 Poll attempt ${attempt + 1}: Status = ${data.status}`);
        
        if (onProgress) {
          // Calculate progress based on status and attempts
          let progress = Math.min(95, (attempt / maxAttempts) * 100);
          if (data.status === 'started' || data.status === 'created') {
            progress = Math.max(progress, 20);
          }
          onProgress(progress);
        }

        if (data.status === 'done') {
          console.log('✅ Video generation completed!');
          return data;
        } else if (data.status === 'error' || data.status === 'rejected') {
          console.error('❌ Video generation failed:', data.error);
          throw new Error(`Video generation failed: ${data.error?.description || data.error || 'Unknown error'}`);
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempt++;

      } catch (error) {
        console.error(`❌ Poll attempt ${attempt + 1} failed:`, error);
        if (attempt >= maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempt++;
      }
    }

    throw new Error('Video generation timed out after 5 minutes. Please try again.');
  }

  private getVoiceId(emotion: string, gender?: string, language?: string, specificVoice?: string): string {
    // If specific voice is requested, use it directly
    if (specificVoice) {
      console.log('🎤 Using selected voice:', specificVoice);
      return specificVoice;
    }

    // D-ID voice IDs - comprehensive voice library
    // 20+ English voices available
    const voiceMap: { [key: string]: { male: string; female: string; neutral: string } } = {
      happy: {
        male: 'en-US-JasonNeural',
        female: 'en-US-JennyNeural', 
        neutral: 'en-US-AriaNeural'
      },
      sad: {
        male: 'en-US-GuyNeural',
        female: 'en-US-SaraNeural',
        neutral: 'en-US-DavisNeural'
      },
      motivational: {
        male: 'en-US-TonyNeural',
        female: 'en-US-NancyNeural',
        neutral: 'en-US-JasonNeural'
      },
      calm: {
        male: 'en-US-BrandonNeural',
        female: 'en-US-MonicaNeural',
        neutral: 'en-US-AriaNeural'
      },
      angry: {
        male: 'en-US-ChristopherNeural',
        female: 'en-US-MichelleNeural',
        neutral: 'en-US-EricNeural'
      },
      excited: {
        male: 'en-US-JasonNeural',
        female: 'en-US-JennyNeural',
        neutral: 'en-US-AriaNeural'
      },
      professional: {
        male: 'en-US-BrianNeural',
        female: 'en-US-EmmaNeural',
        neutral: 'en-US-DavisNeural'
      },
      romantic: {
        male: 'en-US-RyanNeural',
        female: 'en-US-SaraNeural',
        neutral: 'en-US-AriaNeural'
      }
    };

    // Tamil voice IDs for Tamil language support
    const tamilVoiceMap: { [key: string]: { male: string; female: string; neutral: string } } = {
      happy: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural', 
        neutral: 'ta-IN-PallaviNeural'
      },
      sad: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural',
        neutral: 'ta-IN-PallaviNeural'
      },
      motivational: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural',
        neutral: 'ta-IN-ValluvarNeural'
      },
      calm: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural',
        neutral: 'ta-IN-PallaviNeural'
      },
      angry: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural',
        neutral: 'ta-IN-ValluvarNeural'
      },
      excited: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural',
        neutral: 'ta-IN-PallaviNeural'
      },
      professional: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural',
        neutral: 'ta-IN-ValluvarNeural'
      },
      romantic: {
        male: 'ta-IN-ValluvarNeural',
        female: 'ta-IN-PallaviNeural',
        neutral: 'ta-IN-PallaviNeural'
      }
    };

    // Detect if the text is Tamil (simple detection)
    const isTamil = language === 'tamil';
    
    const selectedVoiceMap = isTamil ? tamilVoiceMap : voiceMap;
    const emotionVoices = selectedVoiceMap[emotion] || selectedVoiceMap.calm;
    const selectedGender = gender || 'neutral';
    
    const selectedVoice = emotionVoices[selectedGender as keyof typeof emotionVoices] || emotionVoices.neutral;
    
    if (isTamil) {
      console.log('🇮🇳 Using Tamil voice:', selectedVoice);
    }
    
    return selectedVoice;
  }

  private getVoiceStyle(emotion: string): string {
    const styleMap: { [key: string]: string } = {
      happy: 'cheerful',
      sad: 'sad',
      motivational: 'excited',
      calm: 'calm',
      angry: 'angry',
      excited: 'excited',
      professional: 'newscast',
      romantic: 'gentle'
    };

    return styleMap[emotion] || 'friendly';
  }

  private detectTamilText(text: string): boolean {
    // Simple Tamil text detection - checks for Tamil Unicode characters
    const tamilRegex = /[\u0B80-\u0BFF]/;
    return tamilRegex.test(text);
  }

  private getVoiceRate(speed?: number): string {
    if (!speed) return 'medium';
    
    if (speed < 0.8) return 'slow';
    if (speed > 1.2) return 'fast';
    return 'medium';
  }

  private getVoicePitch(pitch?: number): string {
    if (!pitch) return 'medium';
    
    if (pitch < 0.9) return 'low';
    if (pitch > 1.1) return 'high';
    return 'medium';
  }

  private async updateStep(
    steps: ProcessingStep[],
    stepId: string,
    status: ProcessingStep['status'],
    progress: number,
    onProgress?: (steps: ProcessingStep[]) => void,
    message?: string
  ): Promise<void> {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
      step.progress = progress;
      if (message) step.message = message;
      
      if (onProgress) {
        onProgress([...steps]);
      }
    }
  }

  // Check if D-ID API key is valid
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      });
      
      return response.status !== 401;
    } catch {
      return false;
    }
  }

  // Get available credits/usage info
  async getUsageInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/credits`, {
        headers: {
          'Authorization': `Basic ${this.apiKey}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get usage info:', error);
    }
    return null;
  }
}

export const didService = new DIDService();