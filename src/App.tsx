import React, { useState, useCallback } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Alert,
  Paper,
  Fade,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  AutoAwesome
} from '@mui/icons-material';

// Import our components
import { ImageUpload } from './components/ImageUpload';
import { EmotionSelection } from './components/EmotionSelection';
// ScriptInput component removed - using inline text input
import { ProcessingStatus } from './components/ProcessingStatus';
import { VideoResult } from './components/VideoResult';

// Import services and types
import { geminiService } from './services/geminiService';
import { faceAnimationService } from './services/faceAnimationService';
import { 
  AppState, 
  EmotionType, 
  VideoGenerationRequest,
  ProcessingStep,
  AVAILABLE_VOICES
} from './types';
import { validationUtils } from './utils';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#ec4899',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const STEPS = [
  'Upload Photo',
  'Choose Emotion', 
  'Write Script',
  'Generate Video'
];

function App() {
  const [state, setState] = useState<AppState>({
    currentStep: 0,
    uploadedImage: null,
    selectedEmotion: null,
    selectedLanguage: 'english',
    userScript: '',
    enhancedScript: '',
    isProcessing: false,
    processingSteps: [],
    generatedVideo: null,
    error: null
  });

  const [selectedVoice, setSelectedVoice] = useState<string>('auto');

  const [processingStartTime, setProcessingStartTime] = useState<Date | null>(null);

  // Handle image upload
  const handleImageUpload = useCallback((file: File | null) => {
    setState(prev => ({
      ...prev,
      uploadedImage: file,
      error: null
    }));
  }, []);

  // Handle emotion selection
  const handleEmotionSelect = useCallback((emotion: EmotionType) => {
    setState(prev => ({
      ...prev,
      selectedEmotion: emotion,
      error: null
    }));
  }, []);

  // Handle script change
  const handleScriptChange = useCallback((script: string) => {
    setState(prev => ({
      ...prev,
      userScript: script,
      error: null
    }));
  }, []);

  // Handle enhanced script change
  const handleEnhancedScriptChange = useCallback((enhancedScript: string) => {
    setState(prev => ({
      ...prev,
      enhancedScript
    }));
  }, []);

  // Handle processing steps update
  const handleProcessingStepsUpdate = useCallback((steps: ProcessingStep[]) => {
    setState(prev => ({
      ...prev,
      processingSteps: steps
    }));
  }, []);

  // Generate realistic video
  const generateVideo = useCallback(async () => {
    const { uploadedImage, selectedEmotion, userScript, enhancedScript } = state;
    
    if (!uploadedImage || !selectedEmotion || !userScript.trim()) {
      setState(prev => ({
        ...prev,
        error: 'Please complete all steps before generating the video'
      }));
      return;
    }

    // Validate script
    const validation = validationUtils.validateScript(userScript);
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        error: validation.error || 'Invalid script'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      processingSteps: []
    }));
    
    setProcessingStartTime(new Date());

    try {
      // Generate voice settings using Gemini
      const voiceSettings = await geminiService.generateEmotionalVoiceSettings(
        selectedEmotion, 
        enhancedScript || userScript
      );

      // Add selected voice to voice settings
      if (selectedVoice !== 'auto') {
        voiceSettings.voiceId = selectedVoice;
      }

      // Prepare request
      const request: VideoGenerationRequest = {
        image: uploadedImage,
        emotion: selectedEmotion,
        script: userScript,
        enhancedScript: enhancedScript || undefined,
        voiceSettings,
        language: state.selectedLanguage
      };

      // Generate the realistic video
      const result = await faceAnimationService.generateRealisticVideo(
        request,
        handleProcessingStepsUpdate
      );

      setState(prev => ({
        ...prev,
        generatedVideo: result,
        isProcessing: false,
        currentStep: 3 // Move to result step
      }));

    } catch (error) {
      console.error('Video generation failed:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to generate video'
      }));
    }
  }, [state, handleProcessingStepsUpdate, selectedVoice]);

  // Handle regenerate video
  const handleRegenerateVideo = useCallback(async () => {
    setState(prev => ({
      ...prev,
      generatedVideo: null,
      currentStep: 2 // Go back to script step
    }));
  }, []);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    const { currentStep, uploadedImage, selectedEmotion, userScript } = state;

    // Validation for each step
    switch (currentStep) {
      case 0: // Image upload
        if (!uploadedImage) {
          setState(prev => ({ ...prev, error: 'Please upload a photo first' }));
          return;
        }
        break;
      
      case 1: // Emotion selection
        if (!selectedEmotion) {
          setState(prev => ({ ...prev, error: 'Please select an emotion' }));
          return;
        }
        break;
      
      case 2: // Script input
        const validation = validationUtils.validateScript(userScript);
        if (!validation.isValid) {
          setState(prev => ({ ...prev, error: validation.error || 'Invalid script' }));
          return;
        }
        // Generate video instead of just moving to next step
        await generateVideo();
        return;
      
      default:
        break;
    }

    setState(prev => ({
      ...prev,
      currentStep: Math.min(currentStep + 1, STEPS.length - 1),
      error: null
    }));
  }, [state, generateVideo]);

  const handleBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
      error: null
    }));
  }, []);

  const canGoNext = () => {
    const { currentStep, uploadedImage, selectedEmotion, userScript } = state;
    
    switch (currentStep) {
      case 0:
        return uploadedImage !== null;
      case 1:
        return selectedEmotion !== null;
      case 2:
        return userScript.trim().length > 0 && validationUtils.validateScript(userScript).isValid;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    const { currentStep, uploadedImage, selectedEmotion, userScript, enhancedScript, 
            isProcessing, processingSteps, generatedVideo, error } = state;

    switch (currentStep) {
      case 0:
        return (
          <ImageUpload
            onImageUpload={handleImageUpload}
            uploadedImage={uploadedImage}
            isProcessing={isProcessing}
          />
        );
      
      case 1:
        return (
          <EmotionSelection
            selectedEmotion={selectedEmotion}
            onEmotionSelect={handleEmotionSelect}
            disabled={isProcessing}
          />
        );
      
      case 2:
        return (
          <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Typography variant="h5" gutterBottom align="center">
              📝 Write Your Script
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Enter the text you want your avatar to speak ({state.selectedLanguage === 'tamil' ? 'Tamil supported! தமிழில் எழுதுங்கள்' : 'English'})
            </Typography>
            
            {/* Language Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Language:</Typography>
              <ToggleButtonGroup
                value={state.selectedLanguage}
                exclusive
                onChange={(e: React.MouseEvent<HTMLElement>, newLanguage: 'english' | 'tamil' | null) => {
                  if (newLanguage) {
                    setState(prev => ({ ...prev, selectedLanguage: newLanguage }));
                  }
                }}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="english">🇺🇸 English</ToggleButton>
                <ToggleButton value="tamil">🇮🇳 தமிழ்</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Voice Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>🎤 Select Voice:</Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Voice</InputLabel>
                <Select
                  value={selectedVoice}
                  label="Voice"
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={isProcessing}
                >
                  <MenuItem value="auto">🤖 Auto-select based on emotion</MenuItem>
                  
                  {/* English Voices */}
                  <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary' }}>
                    🇺🇸 English Voices - Male
                  </Typography>
                  {AVAILABLE_VOICES.filter(v => v.language === 'english' && v.gender === 'male').map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={voice.accent || 'US'} size="small" variant="outlined" />
                        <Typography>{voice.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          - {voice.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                  
                  <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary' }}>
                    🇺🇸 English Voices - Female
                  </Typography>
                  {AVAILABLE_VOICES.filter(v => v.language === 'english' && v.gender === 'female').map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={voice.accent || 'US'} size="small" variant="outlined" />
                        <Typography>{voice.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          - {voice.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}

                  <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary' }}>
                    🇺🇸 English Voices - Neutral
                  </Typography>
                  {AVAILABLE_VOICES.filter(v => v.language === 'english' && v.gender === 'neutral').map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={voice.accent || 'US'} size="small" variant="outlined" />
                        <Typography>{voice.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          - {voice.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}

                  {/* Tamil Voices */}
                  <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', color: 'text.secondary' }}>
                    🇮🇳 தமிழ் (Tamil) Voices
                  </Typography>
                  {AVAILABLE_VOICES.filter(v => v.language === 'tamil').map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="IN" size="small" variant="outlined" />
                        <Typography>{voice.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          - {voice.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Selected Voice Info */}
              {selectedVoice !== 'auto' && (
                <Box sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="primary">
                    Selected Voice: {AVAILABLE_VOICES.find(v => v.id === selectedVoice)?.name || selectedVoice}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Script Input */}
            <TextField
              fullWidth
              multiline
              rows={6}
              label={`Enter your script (${state.selectedLanguage === 'tamil' ? 'தமிழில்' : 'in English'})`}
              placeholder={state.selectedLanguage === 'tamil' 
                ? "உங்கள் செய்தியை இங்கே தமிழில் எழுதுங்கள்..." 
                : "Enter your message here in English..."}
              value={userScript}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleScriptChange(e.target.value)}
              disabled={isProcessing}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            {/* Enhanced Script Display */}
            {enhancedScript && enhancedScript !== userScript && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  ✨ AI Enhanced Script:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={enhancedScript}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEnhancedScriptChange(e.target.value)}
                  variant="outlined"
                  disabled={isProcessing}
                  sx={{ backgroundColor: 'background.paper' }}
                />
              </Box>
            )}
          </Box>
        );
      
      case 3:
        return (
          <Box>
            {(isProcessing || processingSteps.length > 0) && (
              <ProcessingStatus
                steps={processingSteps}
                isProcessing={isProcessing}
                error={error}
                startTime={processingStartTime || undefined}
              />
            )}
            
            {generatedVideo && !isProcessing && (
              <VideoResult
                result={generatedVideo}
                emotion={selectedEmotion}
                script={userScript}
                onRegenerate={handleRegenerateVideo}
                isRegenerating={false}
              />
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}>
        <Container maxWidth="lg">
          {/* Header */}
          <Paper sx={{ p: 4, mb: 4, textAlign: 'center', background: 'rgba(255,255,255,0.95)' }}>
            <Typography variant="h4" gutterBottom sx={{ 
              background: 'linear-gradient(45deg, #6366f1, #ec4899)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}>
              <AutoAwesome />
              🧨 DYNAMITE THERAPY 🧨
            </Typography>
            <Typography variant="h6" color="text.secondary">
              🎬 AI-Powered Talking Video Generator | Tamil & English Support | Your Face, Your Voice 🎬
            </Typography>
          </Paper>

          {/* API Status Banner */}
          {process.env.REACT_APP_DID_API_KEY && process.env.REACT_APP_DID_API_KEY !== 'your_did_api_key_here' ? (
            <Alert 
              severity="success" 
              sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography variant="body2">
                🎬 <strong>DYNAMITE THERAPY Active:</strong> Your photos will be transformed into explosive talking videos.
              </Typography>
            </Alert>
          ) : (
            <Alert 
              severity="warning" 
              sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography variant="body2">
                ⚠️ <strong>API Key Missing:</strong> Add your D-ID API key to the .env file to generate explosive DYNAMITE THERAPY videos from your photos.
              </Typography>
            </Alert>
          )}

          {/* Progress Stepper */}
          {state.currentStep < 3 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Stepper activeStep={state.currentStep} alternativeLabel>
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          )}

          {/* Error Alert */}
          {state.error && (
            <Fade in>
              <Alert severity="error" sx={{ mb: 3 }}>
                {state.error}
              </Alert>
            </Fade>
          )}

          {/* Main Content */}
          <Paper sx={{ p: 4, mb: 4, minHeight: 400 }}>
            {renderStepContent()}
          </Paper>

          {/* Navigation Buttons */}
          {state.currentStep < 3 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                disabled={state.currentStep === 0 || state.isProcessing}
                variant="outlined"
                size="large"
              >
                Back
              </Button>
              
              <Button
                endIcon={state.currentStep === 2 ? <AutoAwesome /> : <ArrowForward />}
                onClick={handleNext}
                disabled={!canGoNext() || state.isProcessing}
                variant="contained"
                size="large"
              >
                {state.currentStep === 2 ? 'Generate Video' : 'Next'}
              </Button>
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
