import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Download,
  Share,
  Fullscreen,
  VolumeUp,
  VolumeOff,
  Refresh
} from '@mui/icons-material';
import { VideoGenerationResponse, EmotionType } from '../types';
import { videoUtils, formatUtils } from '../utils';

interface VideoResultProps {
  result: VideoGenerationResponse | null;
  emotion: EmotionType | null;
  script: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const VideoResult: React.FC<VideoResultProps> = ({
  result,
  emotion,
  script,
  onRegenerate,
  isRegenerating = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!result || result.status !== 'completed') {
    return null;
  }

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const handleDownload = () => {
    if (result.videoUrl) {
      const filename = formatUtils.generateUniqueFilename('talking-video', '_generated');
      videoUtils.downloadVideo(result.videoUrl, filename);
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleCopyLink = async () => {
    if (result.videoUrl) {
      try {
        await navigator.clipboard.writeText(result.videoUrl);
        // You could show a toast notification here
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const getVideoDescription = () => {
    if (!emotion) return 'Your DYNAMITE THERAPY video';
    
    return `A ${emotion.name.toLowerCase()} DYNAMITE THERAPY video delivering your message with explosive facial expressions and emotional voice synthesis.`;
  };

  return (
    <Fade in>
      <Box>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          🎉 Your DYNAMITE THERAPY Video is Ready!
        </Typography>

        <Card sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          {/* Video Player */}
          <Box sx={{ position: 'relative', bgcolor: 'black' }}>
            <CardMedia
              component="video"
              ref={videoRef}
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleVideoEnd}
              sx={{
                width: '100%',
                height: 'auto',
                minHeight: 300
              }}
            >
              <source src={result.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </CardMedia>

            {/* Video Controls Overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                display: 'flex',
                gap: 1
              }}
            >
              <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                <IconButton
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                  }}
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>

              <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                <IconButton
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                  }}
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeOff /> : <VolumeUp />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Fullscreen">
                <IconButton
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                  }}
                  onClick={() => setShowFullscreen(true)}
                >
                  <Fullscreen />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Video Info */}
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                DYNAMITE THERAPY Video
              </Typography>
              {emotion && (
                <Chip
                  label={`${emotion.icon} ${emotion.name}`}
                  sx={{ bgcolor: emotion.color, color: 'white' }}
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {getVideoDescription()}
            </Typography>

            {result.processingTime && (
              <Typography variant="caption" color="text.secondary">
                Generated in {formatUtils.formatProcessingTime(result.processingTime)}
              </Typography>
            )}
          </CardContent>

          {/* Action Buttons */}
          <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownload}
              sx={{ flex: 1, minWidth: 120 }}
            >
              Download
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={handleShare}
              sx={{ flex: 1, minWidth: 120 }}
            >
              Share
            </Button>
            
            {onRegenerate && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={onRegenerate}
                disabled={isRegenerating}
                sx={{ flex: 1, minWidth: 120 }}
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            )}
          </Box>
        </Card>

        {/* Quality Information */}
        <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body2">
            <strong>Video Details:</strong> This DYNAMITE THERAPY video was generated using explosive AI face animation technology.
            The lip-sync, facial expressions, and voice synthesis have been optimized for the {emotion?.name.toLowerCase()} emotion you selected.
          </Typography>
        </Alert>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
          <DialogTitle>Share Your Video</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Share your DYNAMITE THERAPY video with others:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCopyLink}
                fullWidth
              >
                Copy Video Link
              </Button>
              
              <Typography variant="caption" color="text.secondary">
                Video URL: {result.videoUrl}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Fullscreen Dialog */}
        <Dialog 
          open={showFullscreen} 
          onClose={() => setShowFullscreen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <video
              controls
              autoPlay
              style={{ width: '100%', height: 'auto' }}
            >
              <source src={result.videoUrl} type="video/mp4" />
            </video>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowFullscreen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};