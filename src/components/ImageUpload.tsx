import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Fade,
  IconButton,
  Card,
  CardMedia
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { imageUtils, formatUtils } from '../utils';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  uploadedImage: File | null;
  isProcessing?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  uploadedImage,
  isProcessing = false
}) => {
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setIsValidating(true);

    try {
      // Validate image
      imageUtils.validateImage(file);

      // Check for face detection (simplified)
      const hasFace = await imageUtils.detectFaceInImage(file);
      if (!hasFace) {
        setError('Please upload a clear photo with a visible face. Make sure the face is well-lit and facing the camera.');
        setIsValidating(false);
        return;
      }

      // Resize image if needed
      const resizedFile = await imageUtils.resizeImage(file);

      // Generate preview
      const previewUrl = await imageUtils.fileToBase64(resizedFile);
      setPreview(previewUrl);

      // Call parent handler
      onImageUpload(resizedFile);
      setIsValidating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setIsValidating(false);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleRemoveImage = () => {
    setPreview('');
    setError('');
    onImageUpload(null as any);
  };

  const handleRetry = () => {
    setError('');
    setPreview('');
  };

  if (uploadedImage && preview) {
    return (
      <Fade in>
        <Card sx={{ maxWidth: 400, mx: 'auto' }}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="300"
              image={preview}
              alt="Uploaded photo"
              sx={{ objectFit: 'cover' }}
            />
            {!isProcessing && (
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                }}
                onClick={handleRemoveImage}
              >
                <Delete />
              </IconButton>
            )}
            {isProcessing && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <CircularProgress color="primary" />
                <Typography color="white" variant="body2" sx={{ mt: 1 }}>
                  Processing...
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" fontSize="small" />
              <Typography variant="body2" color="success.main">
                Photo uploaded successfully
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {uploadedImage.name} • {formatUtils.formatFileSize(uploadedImage.size)}
            </Typography>
          </Box>
        </Card>
      </Fade>
    );
  }

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Try Again
            </Button>
          }
          icon={<ErrorIcon />}
        >
          {error}
        </Alert>
      )}

      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'primary.50' : 'background.paper',
          cursor: isValidating || isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50'
          }
        }}
      >
        <input {...getInputProps()} />
        
        {isValidating ? (
          <Box>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing your photo...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Checking image quality and face detection
            </Typography>
          </Box>
        ) : (
          <Box>
            <CloudUpload 
              sx={{ 
                fontSize: 48, 
                color: isDragActive ? 'primary.main' : 'grey.400',
                mb: 2 
              }} 
            />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop your photo here' : 'Upload Your Photo'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Drag and drop your photo here, or click to select
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Supports: JPEG, PNG, WebP • Max size: 10MB
            </Typography>
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              disabled={isValidating || isProcessing}
            >
              Choose Photo
            </Button>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
        <Typography variant="body2" color="info.main">
          <strong>Tips for best results:</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          • Use a clear, high-resolution photo
          <br />
          • Ensure good lighting on the face
          <br />
          • Face should be looking towards the camera
          <br />
          • Avoid sunglasses or face coverings
        </Typography>
      </Box>
    </Box>
  );
};