import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HeadPose, EyeGaze } from '@/types/proctoring';

interface CameraFeedProps {
  onFaceDetected: (detected: boolean) => void;
  onHeadPoseChange: (pose: HeadPose) => void;
  onEyeGazeChange: (gaze: EyeGaze) => void;
  faceDetected: boolean;
  isActive: boolean;
}

export const CameraFeed = ({
  onFaceDetected,
  onHeadPoseChange,
  onEyeGazeChange,
  faceDetected,
  isActive,
}: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsLoading(false);
        onFaceDetected(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please grant permission.');
      setIsLoading(false);
    }
  }, [onFaceDetected]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    onFaceDetected(false);
  }, [onFaceDetected]);

  // Simple face detection simulation using canvas brightness analysis
  const analyzeFeed = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(analyzeFeed);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Get image data for center region (face detection simulation)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const regionSize = 100;

    try {
      const imageData = ctx.getImageData(
        centerX - regionSize / 2,
        centerY - regionSize / 2,
        regionSize,
        regionSize
      );

      // Calculate brightness in different regions for head pose estimation
      const leftRegion = ctx.getImageData(0, centerY - 50, 100, 100);
      const rightRegion = ctx.getImageData(canvas.width - 100, centerY - 50, 100, 100);
      
      const getBrightness = (data: ImageData) => {
        let sum = 0;
        for (let i = 0; i < data.data.length; i += 4) {
          sum += (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3;
        }
        return sum / (data.data.length / 4);
      };

      const centerBrightness = getBrightness(imageData);
      const leftBrightness = getBrightness(leftRegion);
      const rightBrightness = getBrightness(rightRegion);

      // Simple heuristic: if center is significantly different, face might be present
      const facePresent = centerBrightness > 30 && centerBrightness < 220;
      onFaceDetected(facePresent);

      if (facePresent) {
        // Estimate head pose based on brightness distribution
        const diff = leftBrightness - rightBrightness;
        if (Math.abs(diff) > 20) {
          onHeadPoseChange(diff > 0 ? 'left' : 'right');
        } else {
          onHeadPoseChange('center');
        }

        // Eye gaze (simplified - would need proper ML in production)
        onEyeGazeChange('center');
      }
    } catch (e) {
      // Canvas might be tainted if video source is cross-origin
    }

    animationRef.current = requestAnimationFrame(analyzeFeed);
  }, [isActive, onFaceDetected, onHeadPoseChange, onEyeGazeChange]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  useEffect(() => {
    if (isActive && !isLoading && !cameraError) {
      analyzeFeed();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isLoading, cameraError, analyzeFeed]);

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-background/50">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6">
            <CameraOff className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm text-center mb-4">{cameraError}</p>
            <Button
              onClick={startCamera}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-12 h-12 mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Initializing camera...</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover transform scale-x-[-1]"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Status overlay */}
            <div
              className={cn(
                'absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
                faceDetected
                  ? 'bg-status-normal/20 text-status-normal border border-status-normal/30'
                  : 'bg-status-danger/20 text-status-danger border border-status-danger/30'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  faceDetected ? 'bg-status-normal animate-pulse' : 'bg-status-danger'
                )}
              />
              {faceDetected ? 'Face Detected' : 'No Face'}
            </div>

            {/* Recording indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-background/80 rounded-full text-sm">
              <div className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
              <span className="text-foreground">Recording</span>
            </div>
          </>
        )}
      </div>

      {/* Camera info bar */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Camera className="w-4 h-4" />
          <span>Front Camera</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {isActive ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
};
