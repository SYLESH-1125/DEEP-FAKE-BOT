import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AutoAwesome,
  VolumeUp,
  ExpandLess,
  ExpandMore,
  CheckCircle
} from '@mui/icons-material';

// Import services and types
import { geminiService } from '../services/geminiService';
import { EmotionType } from '../types';
import { validationUtils } from '../utils';

interface ScriptInputProps {
  script: string;
  onScriptChange: (script: string) => void;
  enhancedScript: string;
  onEnhancedScriptChange: (script: string) => void;
  selectedEmotion: EmotionType | null;
  disabled?: boolean;
}

export const ScriptInput: React.FC<ScriptInputProps> = ({
  script,
  onScriptChange,
  enhancedScript,
  onEnhancedScriptChange,
  selectedEmotion,
  disabled = false
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState('');
  const [showEnhanced, setShowEnhanced] = useState(false);

  // Script validation
  const scriptValidation = validationUtils.validateScript(script);
  const characterCount = script.length;
  const wordCount = script.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Check if enhancement is possible
  const canEnhance = selectedEmotion && script.trim().length >= 10 && scriptValidation.isValid && !disabled;

  useEffect(() => {
    if (enhancedScript) {
      setShowEnhanced(true);
    }
  }, [enhancedScript]);

  const handleEnhanceScript = useCallback(async () => {
    if (!selectedEmotion || !script.trim()) return;

    setIsEnhancing(true);
    setEnhancementError('');

    try {
      const enhanced = await geminiService.enhanceScript(script, selectedEmotion);
      onEnhancedScriptChange(enhanced);
      setShowEnhanced(true);
    } catch (error) {
      setEnhancementError(error instanceof Error ? error.message : 'Failed to enhance script');
    } finally {
      setIsEnhancing(false);
    }
  }, [script, selectedEmotion, onEnhancedScriptChange]);

  const handleUseEnhanced = () => {
    onScriptChange(enhancedScript);
    setShowEnhanced(false);
    onEnhancedScriptChange('');
  };

  const handlePreviewSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        Write Your Message
      </Typography>

      <Paper sx={{ p: 3 }}>
        <TextField
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          placeholder="Enter the message you want your avatar to speak..."
          value={script}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onScriptChange(e.target.value)}
          disabled={disabled}
          error={!scriptValidation.isValid}
          helperText={scriptValidation.error}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1.1rem',
              lineHeight: 1.6
            }
          }}
        />

        {/* Stats and Actions Bar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mt: 2,
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${characterCount}/2000 characters`} 
              size="small" 
              color={characterCount > 2000 ? 'error' : 'default'}
            />
            <Chip 
              label={`${wordCount} words`} 
              size="small" 
            />
            {selectedEmotion && (
              <Chip 
                label={`${selectedEmotion.icon} ${selectedEmotion.name}`} 
                size="small" 
                sx={{ bgcolor: selectedEmotion.color, color: 'white' }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {script.trim() && (
              <Tooltip title="Preview speech">
                <IconButton 
                  size="small" 
                  onClick={handlePreviewSpeech}
                  disabled={disabled}
                >
                  <VolumeUp />
                </IconButton>
              </Tooltip>
            )}
            
            <Button
              variant="outlined"
              startIcon={isEnhancing ? <CircularProgress size={16} /> : <AutoAwesome />}
              onClick={handleEnhanceScript}
              disabled={!canEnhance || isEnhancing}
              size="small"
            >
              {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
            </Button>
          </Box>
        </Box>

        {enhancementError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {enhancementError.includes('API') 
              ? 'AI enhancement unavailable - using basic enhancement instead.' 
              : enhancementError}
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleEnhanceScript}
              sx={{ ml: 1 }}
            >
              TRY AGAIN
            </Button>
          </Alert>
        )}

        <Collapse in={showEnhanced && enhancedScript.length > 0}>
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome color="primary" />
                AI Enhanced Version
              </Typography>
              
              <IconButton 
                size="small" 
                onClick={() => setShowEnhanced(!showEnhanced)}
              >
                {showEnhanced ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontStyle: 'italic', 
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {enhancedScript}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Enhanced for {selectedEmotion?.name.toLowerCase()} delivery
                </Typography>
                
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={handleUseEnhanced}
                >
                  Use Enhanced
                </Button>
              </Box>
            </Paper>
          </Box>
        </Collapse>
      </Paper>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          <strong>💡 Writing Tips:</strong> Keep it conversational and natural. 
          The AI will automatically adjust tone and emphasis based on your selected emotion.
        </Typography>
      </Box>
    </Box>
  );
};