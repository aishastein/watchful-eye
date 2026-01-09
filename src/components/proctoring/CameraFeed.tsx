import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HeadPose, EyeGaze } from '@/types/proctoring';
import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

interface CameraFeedProps {
  onFaceDetected: (detected: boolean) => void;
  onFaceCountChange: (count: number) => void;
  onHeadPoseChange: (pose: HeadPose) => void;
  onEyeGazeChange: (gaze: EyeGaze) => void;
  faceDetected: boolean;
  faceCount: number;
  isActive: boolean;
}

export const CameraFeed = ({
  onFaceDetected,
  onFaceCountChange,
  onHeadPoseChange,
  onEyeGazeChange,
  faceDetected,
  faceCount,
  isActive,
}: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);

  const analyzeHeadPose = useCallback((landmarks: Results['multiFaceLandmarks'][0]) => {
    // Key landmarks for head pose estimation
    const noseTip = landmarks[1];      // Nose tip
    const leftEye = landmarks[33];     // Left eye inner corner
    const rightEye = landmarks[263];   // Right eye inner corner
    const chin = landmarks[152];       // Chin

    // Calculate horizontal head rotation based on nose position relative to eyes
    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    const noseOffset = noseTip.x - eyeCenter;

    // Calculate vertical head rotation
    const verticalOffset = noseTip.y - ((leftEye.y + rightEye.y) / 2);

    // Thresholds for pose detection
    const horizontalThreshold = 0.03;
    const verticalThreshold = 0.05;

    let pose: HeadPose = 'center';
    
    if (Math.abs(noseOffset) > horizontalThreshold) {
      pose = noseOffset > 0 ? 'right' : 'left';
    } else if (verticalOffset > verticalThreshold + 0.1) {
      pose = 'down';
    } else if (verticalOffset < verticalThreshold - 0.02) {
      pose = 'up';
    }

    return pose;
  }, []);

  const analyzeEyeGaze = useCallback((landmarks: Results['multiFaceLandmarks'][0]) => {
    // Left eye landmarks
    const leftEyeLeft = landmarks[33];
    const leftEyeRight = landmarks[133];
    const leftIris = landmarks[468]; // Left iris center (if available)

    // Right eye landmarks  
    const rightEyeLeft = landmarks[362];
    const rightEyeRight = landmarks[263];
    const rightIris = landmarks[473]; // Right iris center (if available)

    // Calculate eye center and iris position
    const leftEyeCenter = (leftEyeLeft.x + leftEyeRight.x) / 2;
    const rightEyeCenter = (rightEyeLeft.x + rightEyeRight.x) / 2;

    // Use iris position if available, otherwise estimate from landmarks
    const leftIrisPos = leftIris?.x ?? leftEyeCenter;
    const rightIrisPos = rightIris?.x ?? rightEyeCenter;

    const leftOffset = leftIrisPos - leftEyeCenter;
    const rightOffset = rightIrisPos - rightEyeCenter;
    const avgOffset = (leftOffset + rightOffset) / 2;

    const threshold = 0.015;

    if (avgOffset > threshold) {
      return 'right' as EyeGaze;
    } else if (avgOffset < -threshold) {
      return 'left' as EyeGaze;
    }
    return 'center' as EyeGaze;
  }, []);

  const onResults = useCallback((results: Results) => {
    const faceCount = results.multiFaceLandmarks?.length ?? 0;
    const detected = faceCount > 0;

    onFaceDetected(detected);
    onFaceCountChange(faceCount);

    if (detected && results.multiFaceLandmarks[0]) {
      const landmarks = results.multiFaceLandmarks[0];
      const headPose = analyzeHeadPose(landmarks);
      const eyeGaze = analyzeEyeGaze(landmarks);
      
      onHeadPoseChange(headPose);
      onEyeGazeChange(eyeGaze);
    }
  }, [onFaceDetected, onFaceCountChange, onHeadPoseChange, onEyeGazeChange, analyzeHeadPose, analyzeEyeGaze]);

  const initializeFaceMesh = useCallback(async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    setCameraError(null);

    try {
      // Initialize FaceMesh
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 4,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onResults);
      faceMeshRef.current = faceMesh;

      // Initialize camera
      const camera = new MediaPipeCamera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      await camera.start();
      setIsLoading(false);
    } catch (err) {
      console.error('Camera/FaceMesh error:', err);
      setCameraError('Unable to access camera or initialize face detection. Please grant permission.');
      setIsLoading(false);
    }
  }, [onResults]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    setIsLoading(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      initializeFaceMesh();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, initializeFaceMesh, stopCamera]);

  const hasMultipleFaces = faceCount > 1;

  return (
    <div className={cn(
      'card-glass rounded-xl overflow-hidden transition-all duration-300',
      hasMultipleFaces && 'ring-2 ring-status-danger glow-danger'
    )}>
      <div className="relative aspect-video bg-background/50">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6">
            <CameraOff className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm text-center mb-4">{cameraError}</p>
            <Button
              onClick={initializeFaceMesh}
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
            <p className="text-sm">Initializing face detection...</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover transform scale-x-[-1]"
              playsInline
              muted
            />
            
            {/* Face status overlay */}
            <div
              className={cn(
                'absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
                faceDetected
                  ? hasMultipleFaces
                    ? 'bg-status-danger/20 text-status-danger border border-status-danger/30'
                    : 'bg-status-normal/20 text-status-normal border border-status-normal/30'
                  : 'bg-status-danger/20 text-status-danger border border-status-danger/30'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  faceDetected
                    ? hasMultipleFaces
                      ? 'bg-status-danger animate-pulse'
                      : 'bg-status-normal animate-pulse'
                    : 'bg-status-danger'
                )}
              />
              {faceDetected 
                ? hasMultipleFaces 
                  ? `${faceCount} Faces Detected!` 
                  : 'Face Detected'
                : 'No Face'}
            </div>

            {/* Multiple faces warning */}
            {hasMultipleFaces && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 px-4 py-3 bg-status-danger/20 border border-status-danger/40 rounded-lg backdrop-blur-sm animate-fade-in">
                <Users className="w-5 h-5 text-status-danger flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-status-danger">Multiple Faces Detected</p>
                  <p className="text-xs text-status-danger/80">Possible unauthorized assistance detected</p>
                </div>
              </div>
            )}

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
        <div className="flex items-center gap-3">
          {faceCount > 0 && (
            <span className={cn(
              'text-xs font-mono px-2 py-0.5 rounded',
              hasMultipleFaces 
                ? 'bg-status-danger/20 text-status-danger' 
                : 'bg-muted text-muted-foreground'
            )}>
              {faceCount} {faceCount === 1 ? 'face' : 'faces'}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            {isActive ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
};
