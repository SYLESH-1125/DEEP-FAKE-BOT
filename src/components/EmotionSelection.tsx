import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Fade,
  alpha
} from '@mui/material';
import { EmotionType, EMOTIONS } from '../types';

interface EmotionSelectionProps {
  selectedEmotion: EmotionType | null;
  onEmotionSelect: (emotion: EmotionType) => void;
  disabled?: boolean;
}

export const EmotionSelection: React.FC<EmotionSelectionProps> = ({
  selectedEmotion,
  onEmotionSelect,
  disabled = false
}) => {

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        Choose Your Emotional Style
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 2, 
        maxWidth: 800, 
        mx: 'auto' 
      }}>
        {EMOTIONS.map((emotion, index) => (
          <Box key={emotion.id}>
            <Fade in timeout={300 + index * 100}>
              <Card
                sx={{
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  border: '2px solid',
                  borderColor: selectedEmotion?.id === emotion.id 
                    ? emotion.color 
                    : 'transparent',
                  bgcolor: selectedEmotion?.id === emotion.id 
                    ? alpha(emotion.color, 0.1) 
                    : 'background.paper',
                  transform: selectedEmotion?.id === emotion.id 
                    ? 'scale(1.05)' 
                    : 'scale(1)',
                  '&:hover': disabled ? {} : {
                    transform: 'scale(1.03)',
                    boxShadow: `0 4px 20px ${alpha(emotion.color, 0.3)}`,
                    borderColor: alpha(emotion.color, 0.5)
                  },
                  opacity: disabled ? 0.6 : 1
                }}
                onClick={() => !disabled && onEmotionSelect(emotion)}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box
                    sx={{
                      fontSize: '2.5rem',
                      mb: 1,
                      display: 'block',
                      filter: selectedEmotion?.id === emotion.id 
                        ? 'none' 
                        : 'grayscale(0.3)'
                    }}
                  >
                    {emotion.icon}
                  </Box>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: selectedEmotion?.id === emotion.id 
                        ? emotion.color 
                        : 'text.primary',
                      mb: 1
                    }}
                  >
                    {emotion.name}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.8rem',
                      lineHeight: 1.3,
                      minHeight: '2.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {emotion.description}
                  </Typography>

                  {selectedEmotion?.id === emotion.id && (
                    <Chip
                      label="Selected"
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: emotion.color,
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Fade>
          </Box>
        ))}
      </Box>

      {selectedEmotion && (
        <Fade in>
          <Box 
            sx={{ 
              mt: 3, 
              p: 3, 
              borderRadius: 2,
              bgcolor: alpha(selectedEmotion.color, 0.1),
              border: `1px solid ${alpha(selectedEmotion.color, 0.3)}`,
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" sx={{ color: selectedEmotion.color, mb: 1 }}>
              {selectedEmotion.icon} {selectedEmotion.name} Selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your video will be generated with a <strong>{selectedEmotion.name.toLowerCase()}</strong> emotional tone.
              The AI will adjust facial expressions, voice modulation, and delivery style to match this emotion.
            </Typography>
          </Box>
        </Fade>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          <strong>💡 Pro Tip:</strong> Choose the emotion that best matches the message you want to convey.
          The AI will automatically adjust facial expressions and voice tone to create a more authentic delivery.
        </Typography>
      </Box>
    </Box>
  );
};