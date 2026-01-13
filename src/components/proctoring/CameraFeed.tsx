import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HeadPose, EyeGaze } from '@/types/proctoring';
import { FaceMesh, Results } from '@mediapipe/face_mesh';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  const analyzeHeadPose = useCallback((landmarks: Results['multiFaceLandmarks'][0]) => {
    const noseTip = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    const noseOffset = noseTip.x - eyeCenter;
    const verticalOffset = noseTip.y - ((leftEye.y + rightEye.y) / 2);
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
    const leftEyeLeft = landmarks[33];
    const leftEyeRight = landmarks[133];
    const leftIris = landmarks[468];
    const rightEyeLeft = landmarks[362];
    const rightEyeRight = landmarks[263];
    const rightIris = landmarks[473];

    const leftEyeCenter = (leftEyeLeft.x + leftEyeRight.x) / 2;
    const rightEyeCenter = (rightEyeLeft.x + rightEyeRight.x) / 2;
    const leftIrisPos = leftIris?.x ?? leftEyeCenter;
    const rightIrisPos = rightIris?.x ?? rightEyeCenter;

    const leftOffset = leftIrisPos - leftEyeCenter;
    const rightOffset = rightIrisPos - rightEyeCenter;
    const avgOffset = (leftOffset + rightOffset) / 2;
    const threshold = 0.015;

    if (avgOffset > threshold) return 'right' as EyeGaze;
    if (avgOffset < -threshold) return 'left' as EyeGaze;
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
    isProcessingRef.current = false;
  }, [onFaceDetected, onFaceCountChange, onHeadPoseChange, onEyeGazeChange, analyzeHeadPose, analyzeEyeGaze]);

  const startLoop = useCallback(() => {
    if (!videoRef.current || !faceMeshRef.current || !isActive) return;

    const run = async () => {
      if (!isActive) return;

      if (videoRef.current && faceMeshRef.current && !isProcessingRef.current && videoRef.current.readyState >= 2) {
        isProcessingRef.current = true;
        try {
          await faceMeshRef.current.send({ image: videoRef.current });
        } catch (e) {
          console.error("MediaPipe send error:", e);
          isProcessingRef.current = false;
        }
      }
      loopRef.current = requestAnimationFrame(run);
    };
    loopRef.current = requestAnimationFrame(run);
  }, [isActive]);

  const initialize = useCallback(async () => {
    if (!isActive) return;

    console.log('--- Phase 1: Camera Access ---');
    setIsLoading(true);
    setCameraError(null);
    setIsVideoPlaying(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });

      console.log('Stream obtained');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplaying = () => {
          console.log('Video is strictly playing now');
          setIsVideoPlaying(true);
        };
        await videoRef.current.play();
      }

      // Load FaceMesh in parallel or after stream
      if (!faceMeshRef.current) {
        console.log('--- Phase 2: AI Loading ---');
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 4,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;
        console.log('AI models loaded');
      }

      setIsLoading(false);
      startLoop();
    } catch (err: any) {
      console.error('Initalization failed:', err);
      setCameraError(err.message || "Failed to start camera.");
      setIsLoading(false);
    }
  }, [isActive, onResults, startLoop]);

  const cleanup = useCallback(() => {
    console.log('Cleaning up...');
    if (loopRef.current) cancelAnimationFrame(loopRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      initialize();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isActive, initialize, cleanup]);

  const hasMultipleFaces = faceCount > 1;

  return (
    <div className={cn(
      'card-glass rounded-xl overflow-hidden transition-all duration-300 min-h-[300px]',
      hasMultipleFaces && 'ring-2 ring-status-danger glow-danger',
      isVideoPlaying && 'ring-1 ring-status-normal/30'
    )}>
      <div className="relative aspect-video bg-black/80">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6">
            <CameraOff className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm text-center mb-4 text-red-400">{cameraError}</p>
            <Button onClick={initialize} variant="secondary" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        ) : (isLoading && !isVideoPlaying) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-4">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Setting up camera...</p>
          </div>
        ) : null}

        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500",
            isVideoPlaying ? "opacity-100" : "opacity-0"
          )}
          playsInline
          muted
          autoPlay
        />

        {/* Overlays */}
        {isVideoPlaying && (
          <>
            <div className={cn(
              'absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
              faceDetected
                ? (hasMultipleFaces ? 'bg-status-danger/20 text-status-danger border-status-danger/30' : 'bg-status-normal/20 text-status-normal border-status-normal/30')
                : 'bg-status-danger/20 text-status-danger border-status-danger/30'
            )}>
              <div className={cn('w-2 h-2 rounded-full', faceDetected ? (hasMultipleFaces ? 'bg-status-danger animate-pulse' : 'bg-status-normal animate-pulse') : 'bg-status-danger')} />
              <span>{faceDetected ? (hasMultipleFaces ? `${faceCount} Faces Detected!` : 'Face Detected') : 'No Face'}</span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs border border-white/10">
              <div className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
              <span className="text-white font-medium uppercase tracking-wider">Live Monitoring</span>
            </div>

            {hasMultipleFaces && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 px-4 py-3 bg-red-950/40 border border-status-danger/40 rounded-lg backdrop-blur-md animate-in fade-in zoom-in">
                <Users className="w-5 h-5 text-status-danger flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-status-danger">Multiple Faces Detected</p>
                  <p className="text-xs text-red-200/80">Ensure you are alone during the session.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Camera className="w-4 h-4 text-primary" />
          <span>Active Feed</span>
        </div>
        <div className="flex items-center gap-3">
          {faceDetected && (
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter', hasMultipleFaces ? 'bg-status-danger/20 text-status-danger' : 'bg-status-normal/20 text-status-normal')}>
              {faceCount} {faceCount === 1 ? 'Face' : 'Faces'}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
            {isActive ? 'System Live' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
};
