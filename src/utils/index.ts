// Utility functions for image processing and file handling

export const imageUtils = {
  // Validate if uploaded file is a valid image
  validateImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
    }

    if (file.size > maxSize) {
      throw new Error('Image file size must be less than 10MB');
    }

    return true;
  },

  // Convert file to base64 for preview
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  // Resize image if needed (for optimization)
  async resizeImage(file: File, maxWidth: number = 1024, maxHeight: number = 1024): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file); // Return original if resize fails
          }
        }, file.type, 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // Check if image has a clear face
  async detectFaceInImage(file: File): Promise<boolean> {
    // This is a simplified version - in production, you'd use a face detection API
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Simple heuristic - check image dimensions and quality
        const isGoodSize = img.width >= 200 && img.height >= 200;
        const aspectRatio = img.width / img.height;
        const isPortrait = aspectRatio >= 0.5 && aspectRatio <= 2.0;
        
        resolve(isGoodSize && isPortrait);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  }
};

export const videoUtils = {
  // Generate thumbnail from video
  generateVideoThumbnail(videoUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Capture at 1 second
      };

      video.onseeked = () => {
        ctx?.drawImage(video, 0, 0);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };

      video.onerror = reject;
      video.src = videoUrl;
      video.load();
    });
  },

  // Download generated video
  downloadVideo(videoUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const audioUtils = {
  // Convert text to speech using Web Speech API (basic implementation)
  textToSpeech(text: string, voiceSettings: any): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply voice settings
      utterance.pitch = voiceSettings.pitch || 1.0;
      utterance.rate = voiceSettings.speed || 1.0;
      utterance.volume = 1.0;

      // Find appropriate voice
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voiceSettings.gender === 'female' ? voice.name.toLowerCase().includes('female') : true)
      ) || voices[0];
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        // In a real implementation, we'd capture the audio and return a URL
        // For now, we'll return a mock URL
        resolve('data:audio/wav;base64,mock_tts_audio');
      };

      utterance.onerror = reject;
      speechSynthesis.speak(utterance);
    });
  }
};

export const formatUtils = {
  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format processing time
  formatProcessingTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  },

  // Generate unique filename
  generateUniqueFilename(originalName: string, suffix: string = ''): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    return `${nameWithoutExt}${suffix}_${timestamp}.${extension}`;
  }
};

export const validationUtils = {
  // Validate script input
  validateScript(script: string): { isValid: boolean; error?: string } {
    if (!script.trim()) {
      return { isValid: false, error: 'Please enter a script for your video' };
    }

    if (script.length < 10) {
      return { isValid: false, error: 'Script must be at least 10 characters long' };
    }

    if (script.length > 2000) {
      return { isValid: false, error: 'Script must be less than 2000 characters' };
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ['explicit_word1', 'explicit_word2']; // Add actual words
    const hasInappropriateContent = inappropriateWords.some(word => 
      script.toLowerCase().includes(word.toLowerCase())
    );

    if (hasInappropriateContent) {
      return { isValid: false, error: 'Please use appropriate language in your script' };
    }

    return { isValid: true };
  },

  // Validate API key format
  validateApiKey(apiKey: string): boolean {
    // Basic validation for Gemini API key format
    return Boolean(apiKey && apiKey.length > 20 && apiKey.startsWith('AI'));
  }
};