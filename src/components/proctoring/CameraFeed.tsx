import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Users, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HeadPose, EyeGaze } from '@/types/proctoring';
import { FaceMesh, Results, NormalizedLandmarkList } from '@mediapipe/face_mesh';

// Face mesh connections for drawing the mesh lines
const FACEMESH_TESSELATION = [
  [127, 34], [34, 139], [139, 127], [11, 0], [0, 37], [37, 11], [232, 231], [231, 120], [120, 232],
  [72, 37], [37, 39], [39, 72], [128, 121], [121, 47], [47, 128], [232, 121], [121, 128], [128, 232],
  [104, 69], [69, 67], [67, 104], [175, 171], [171, 148], [148, 175], [118, 50], [50, 101], [101, 118],
  [73, 39], [39, 40], [40, 73], [9, 151], [151, 108], [108, 9], [48, 115], [115, 131], [131, 48],
  [194, 204], [204, 211], [211, 194], [74, 40], [40, 185], [185, 74], [80, 42], [42, 183], [183, 80],
  [40, 92], [92, 186], [186, 40], [230, 229], [229, 118], [118, 230], [202, 212], [212, 214], [214, 202],
  [83, 18], [18, 17], [17, 83], [76, 61], [61, 146], [146, 76], [160, 29], [29, 30], [30, 160],
  [56, 157], [157, 173], [173, 56], [106, 204], [204, 194], [194, 106], [135, 214], [214, 192], [192, 135],
  [203, 165], [165, 98], [98, 203], [21, 71], [71, 68], [68, 21], [51, 45], [45, 4], [4, 51],
  [144, 24], [24, 23], [23, 144], [77, 146], [146, 91], [91, 77], [205, 50], [50, 187], [187, 205],
  [201, 200], [200, 18], [18, 201], [91, 106], [106, 182], [182, 91], [90, 91], [91, 181], [181, 90],
  [85, 84], [84, 17], [17, 85], [206, 203], [203, 36], [36, 206], [148, 171], [171, 140], [140, 148],
  [92, 40], [40, 39], [39, 92], [193, 189], [189, 244], [244, 193], [159, 158], [158, 28], [28, 159],
  [247, 246], [246, 161], [161, 247], [236, 3], [3, 196], [196, 236], [54, 68], [68, 104], [104, 54],
  [193, 168], [168, 8], [8, 193], [117, 228], [228, 31], [31, 117], [189, 193], [193, 55], [55, 189],
  [98, 97], [97, 99], [99, 98], [126, 47], [47, 100], [100, 126], [166, 79], [79, 218], [218, 166],
  [155, 154], [154, 26], [26, 155], [209, 49], [49, 131], [131, 209], [135, 136], [136, 150], [150, 135],
  [47, 126], [126, 217], [217, 47], [223, 52], [52, 53], [53, 223], [45, 51], [51, 134], [134, 45],
  [211, 170], [170, 140], [140, 211], [67, 69], [69, 108], [108, 67], [43, 106], [106, 91], [91, 43],
  [230, 119], [119, 120], [120, 230], [226, 130], [130, 247], [247, 226], [63, 53], [53, 52], [52, 63],
  [238, 20], [20, 242], [242, 238], [46, 70], [70, 156], [156, 46], [78, 62], [62, 96], [96, 78]
];

// Eye contour indices for highlighting
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
const LIPS_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const FACE_OVAL_INDICES = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [landmarks, setLandmarks] = useState<NormalizedLandmarkList | null>(null);
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
      const faceLandmarks = results.multiFaceLandmarks[0];
      setLandmarks(faceLandmarks);
      const headPose = analyzeHeadPose(faceLandmarks);
      const eyeGaze = analyzeEyeGaze(faceLandmarks);
      onHeadPoseChange(headPose);
      onEyeGazeChange(eyeGaze);
    } else {
      setLandmarks(null);
    }
    isProcessingRef.current = false;
  }, [onFaceDetected, onFaceCountChange, onHeadPoseChange, onEyeGazeChange, analyzeHeadPose, analyzeEyeGaze]);

  // Draw landmarks on canvas
  const drawLandmarks = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !landmarks || !showLandmarks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face mesh tesselation
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.15)';
    ctx.lineWidth = 0.5;
    FACEMESH_TESSELATION.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo((1 - startPoint.x) * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo((1 - endPoint.x) * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw face oval
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    FACE_OVAL_INDICES.forEach((index, i) => {
      const point = landmarks[index];
      if (point) {
        const x = (1 - point.x) * canvas.width;
        const y = point.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();

    // Key landmark points
    const keyPoints = [1, 33, 263, 61, 291, 199];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    keyPoints.forEach(index => {
      const point = landmarks[index];
      if (point) {
        ctx.beginPath();
        ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [landmarks, showLandmarks]);

  useEffect(() => {
    if (landmarks && showLandmarks) {
      requestAnimationFrame(drawLandmarks);
    }
  }, [landmarks, showLandmarks, drawLandmarks]);

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
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } }
      });

      console.log('Stream obtained');
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onplaying = () => {
          setIsVideoPlaying(true);
        };
        await videoRef.current.play();
      }

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
    setLandmarks(null);
  }, []);

  useEffect(() => {
    if (isActive) initialize();
    else cleanup();
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

        {/* Face mesh canvas overlay */}
        {isVideoPlaying && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        )}

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

            <div className="absolute top-4 right-4 flex items-center gap-3">
              <button
                onClick={() => setShowLandmarks(!showLandmarks)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300',
                  showLandmarks ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-black/40 text-white/60 border border-white/10'
                )}
              >
                <Eye className="w-3 h-3" /> {showLandmarks ? 'Mesh On' : 'Mesh Off'}
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] border border-white/10">
                <div className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
                <span className="text-white font-bold uppercase tracking-wider">Live Monitoring</span>
              </div>
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
