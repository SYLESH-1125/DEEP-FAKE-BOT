import React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  HourglassEmpty,
  Psychology
} from '@mui/icons-material';
import { ProcessingStep } from '../types';
import { formatUtils } from '../utils';

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  isProcessing: boolean;
  error: string | null;
  startTime?: Date;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  steps,
  isProcessing,
  error,
  startTime
}) => {
  const activeStep = steps.findIndex(step => step.status === 'processing');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgress = (completedSteps / totalSteps) * 100;
  
  const elapsedTime = startTime ? Date.now() - startTime.getTime() : 0;

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <CircularProgress size={20} />;
      default:
        return <HourglassEmpty color="disabled" />;
    }
  };

  const getStepColor = (step: ProcessingStep): 'primary' | 'success' | 'error' | 'secondary' => {
    switch (step.status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'processing':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  if (error) {
    return (
      <Fade in>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Processing Failed
          </Typography>
          {error}
        </Alert>
      </Fade>
    );
  }

  if (!isProcessing && steps.length === 0) {
    return null;
  }

  return (
    <Fade in>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            Generating Your DYNAMITE THERAPY Video
          </Typography>
          
          {isProcessing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {startTime && (
                <Chip 
                  label={`${formatUtils.formatProcessingTime(elapsedTime)}`} 
                  size="small" 
                  color="primary" 
                />
              )}
              <Chip 
                label={`${completedSteps}/${totalSteps} steps`} 
                size="small" 
              />
            </Box>
          )}
        </Box>

        {/* Overall Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(overallProgress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={overallProgress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Detailed Steps */}
        <Stepper 
          activeStep={activeStep >= 0 ? activeStep : steps.length} 
          orientation="vertical"
          sx={{
            '& .MuiStepConnector-line': {
              borderLeftWidth: 2
            }
          }}
        >
          {steps.map((step, index) => (
            <Step key={step.id} completed={step.status === 'completed'}>
              <StepLabel
                StepIconComponent={() => (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 32,
                    height: 32
                  }}>
                    {getStepIcon(step)}
                  </Box>
                )}
              >
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: step.status === 'processing' ? 'bold' : 'normal',
                    color: step.status === 'completed' ? 'success.main' : 
                           step.status === 'error' ? 'error.main' : 
                           step.status === 'processing' ? 'primary.main' : 'text.secondary'
                  }}
                >
                  {step.name}
                </Typography>
              </StepLabel>
              
              <StepContent>
                <Box sx={{ pb: 2 }}>
                  {step.status === 'processing' && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress 
                        variant={step.progress > 0 ? 'determinate' : 'indeterminate'}
                        value={step.progress}
                        color={getStepColor(step)}
                        sx={{ mb: 1 }}
                      />
                      {step.message && (
                        <Typography variant="caption" color="text.secondary">
                          {step.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  {step.status === 'completed' && (
                    <Typography variant="caption" color="success.main">
                      ✓ Completed successfully
                    </Typography>
                  )}
                  
                  {step.status === 'error' && step.message && (
                    <Typography variant="caption" color="error.main">
                      ✗ {step.message}
                    </Typography>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {/* Processing Tips */}
        {isProcessing && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
            <Typography variant="body2" color="info.main">
              <strong>🎬 What's happening:</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              • Our AI is analyzing your photo for facial features and landmarks
              <br />
              • Generating high-quality audio with emotional voice synthesis
              <br />
              • Creating explosive lip-sync and facial expressions
              <br />
              • Rendering your final DYNAMITE THERAPY video with explosive animations
            </Typography>
          </Box>
        )}
      </Paper>
    </Fade>
  );
};