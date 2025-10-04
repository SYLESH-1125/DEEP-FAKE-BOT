export interface EmotionType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface VideoGenerationRequest {
  image: File;
  emotion: EmotionType;
  script: string;
  enhancedScript?: string;
  voiceSettings?: VoiceSettings;
  language?: 'english' | 'tamil';
}

export interface VoiceSettings {
  pitch: number;
  speed: number;
  emotion: string;
  gender: 'male' | 'female' | 'neutral';
  language?: 'english' | 'tamil';
  voiceId?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: 'english' | 'tamil';
  description: string;
  accent?: string;
}

export interface VideoGenerationResponse {
  videoUrl: string;
  audioUrl: string;
  status: 'processing' | 'completed' | 'error';
  processingTime?: number;
}

export interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export interface AppState {
  currentStep: number;
  uploadedImage: File | null;
  selectedEmotion: EmotionType | null;
  selectedLanguage: 'english' | 'tamil';
  userScript: string;
  enhancedScript: string;
  isProcessing: boolean;
  processingSteps: ProcessingStep[];
  generatedVideo: VideoGenerationResponse | null;
  error: string | null;
}

export const EMOTIONS: EmotionType[] = [
  {
    id: 'happy',
    name: 'Happy',
    description: 'Joyful and upbeat expression',
    color: '#FFD700',
    icon: '😊'
  },
  {
    id: 'sad',
    name: 'Sad',
    description: 'Melancholy and thoughtful',
    color: '#6495ED',
    icon: '😢'
  },
  {
    id: 'motivational',
    name: 'Motivational',
    description: 'Inspiring and energetic',
    color: '#FF6347',
    icon: '💪'
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Peaceful and serene',
    color: '#98FB98',
    icon: '😌'
  },
  {
    id: 'angry',
    name: 'Angry',
    description: 'Intense and passionate',
    color: '#DC143C',
    icon: '😠'
  },
  {
    id: 'excited',
    name: 'Excited',
    description: 'Enthusiastic and energetic',
    color: '#FF1493',
    icon: '🤩'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Confident and authoritative',
    color: '#4169E1',
    icon: '👔'
  },
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Warm and affectionate',
    color: '#FF69B4',
    icon: '💕'
  }
];

export const SUPPORTED_LANGUAGES = [
  {
    id: 'english',
    name: 'English',
    flag: '🇺🇸',
    description: 'English language with various regional voices'
  },
  {
    id: 'tamil',
    name: 'தமிழ் (Tamil)',
    flag: '🇮🇳',
    description: 'Tamil language with native voices'
  }
] as const;

export const AVAILABLE_VOICES: VoiceOption[] = [
  // English Voices - Male
  { id: 'en-US-JasonNeural', name: 'Jason', gender: 'male', language: 'english', description: 'Confident American male', accent: 'US' },
  { id: 'en-US-TonyNeural', name: 'Tony', gender: 'male', language: 'english', description: 'Energetic American male', accent: 'US' },
  { id: 'en-US-GuyNeural', name: 'Guy', gender: 'male', language: 'english', description: 'Warm American male', accent: 'US' },
  { id: 'en-US-BrianNeural', name: 'Brian', gender: 'male', language: 'english', description: 'Professional American male', accent: 'US' },
  { id: 'en-US-ChristopherNeural', name: 'Christopher', gender: 'male', language: 'english', description: 'Authoritative American male', accent: 'US' },
  { id: 'en-US-EricNeural', name: 'Eric', gender: 'male', language: 'english', description: 'Calm American male', accent: 'US' },
  { id: 'en-US-RyanNeural', name: 'Ryan', gender: 'male', language: 'english', description: 'Young American male', accent: 'US' },
  { id: 'en-US-BrandonNeural', name: 'Brandon', gender: 'male', language: 'english', description: 'Friendly American male', accent: 'US' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (British)', gender: 'male', language: 'english', description: 'British male', accent: 'UK' },
  { id: 'en-AU-WilliamNeural', name: 'William', gender: 'male', language: 'english', description: 'Australian male', accent: 'AU' },

  // English Voices - Female  
  { id: 'en-US-JennyNeural', name: 'Jenny', gender: 'female', language: 'english', description: 'Cheerful American female', accent: 'US' },
  { id: 'en-US-AriaNeural', name: 'Aria', gender: 'female', language: 'english', description: 'Professional American female', accent: 'US' },
  { id: 'en-US-SaraNeural', name: 'Sara', gender: 'female', language: 'english', description: 'Gentle American female', accent: 'US' },
  { id: 'en-US-EmmaNeural', name: 'Emma', gender: 'female', language: 'english', description: 'Business American female', accent: 'US' },
  { id: 'en-US-MichelleNeural', name: 'Michelle', gender: 'female', language: 'english', description: 'Confident American female', accent: 'US' },
  { id: 'en-US-NancyNeural', name: 'Nancy', gender: 'female', language: 'english', description: 'Motivational American female', accent: 'US' },
  { id: 'en-US-MonicaNeural', name: 'Monica', gender: 'female', language: 'english', description: 'Calm American female', accent: 'US' },
  { id: 'en-US-DavisNeural', name: 'Davis', gender: 'neutral', language: 'english', description: 'Neutral American voice', accent: 'US' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (British)', gender: 'female', language: 'english', description: 'British female', accent: 'UK' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha', gender: 'female', language: 'english', description: 'Australian female', accent: 'AU' },

  // Tamil Voices
  { id: 'ta-IN-ValluvarNeural', name: 'வள்ளுவர் (Valluvar)', gender: 'male', language: 'tamil', description: 'Tamil male voice' },
  { id: 'ta-IN-PallaviNeural', name: 'பல்லவி (Pallavi)', gender: 'female', language: 'tamil', description: 'Tamil female voice' },

  // Additional International English
  { id: 'en-CA-LiamNeural', name: 'Liam (Canadian)', gender: 'male', language: 'english', description: 'Canadian male', accent: 'CA' },
  { id: 'en-CA-ClaraNeural', name: 'Clara (Canadian)', gender: 'female', language: 'english', description: 'Canadian female', accent: 'CA' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian)', gender: 'female', language: 'english', description: 'Indian English female', accent: 'IN' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat (Indian)', gender: 'male', language: 'english', description: 'Indian English male', accent: 'IN' }
];