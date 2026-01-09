import { useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface AudioMonitorProps {
  isActive: boolean;
  audioLevel: number;
  isAudioDetected: boolean;
  onAudioLevelChange: (level: number) => void;
  onAudioDetected: (detected: boolean, level: number) => void;
}

const AUDIO_THRESHOLD = 25; // Audio level threshold to trigger detection

export const AudioMonitor = ({
  isActive,
  audioLevel,
  isAudioDetected,
  onAudioLevelChange,
  onAudioDetected,
}: AudioMonitorProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isActive) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);

    onAudioLevelChange(normalizedLevel);

    // Detect sustained audio above threshold
    if (normalizedLevel > AUDIO_THRESHOLD) {
      if (!detectionTimeoutRef.current) {
        detectionTimeoutRef.current = setTimeout(() => {
          onAudioDetected(true, normalizedLevel);
          detectionTimeoutRef.current = null;
        }, 1500); // 1.5 second sustained audio triggers detection
      }
    } else {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }
      if (normalizedLevel < AUDIO_THRESHOLD * 0.5) {
        onAudioDetected(false, normalizedLevel);
      }
    }

    animationRef.current = requestAnimationFrame(analyzeAudio);
  }, [isActive, onAudioLevelChange, onAudioDetected]);

  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Keep noise for detection
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      animationRef.current = requestAnimationFrame(analyzeAudio);
    } catch (err) {
      console.error('Audio monitoring error:', err);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    onAudioLevelChange(0);
  };

  useEffect(() => {
    if (isActive) {
      startAudioMonitoring();
    } else {
      stopAudioMonitoring();
    }

    return () => {
      stopAudioMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const getStatusColor = () => {
    if (!isActive) return 'text-muted-foreground';
    if (isAudioDetected) return 'text-status-danger';
    if (audioLevel > AUDIO_THRESHOLD * 0.7) return 'text-status-warning';
    return 'text-status-normal';
  };

  const getProgressColor = () => {
    if (isAudioDetected) return 'bg-status-danger';
    if (audioLevel > AUDIO_THRESHOLD * 0.7) return 'bg-status-warning';
    return 'bg-status-normal';
  };

  return (
    <div className={cn(
      'card-glass rounded-xl p-4 transition-all duration-300',
      isAudioDetected && 'ring-2 ring-status-danger glow-danger'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Mic className={cn('w-5 h-5', getStatusColor())} />
          ) : (
            <MicOff className="w-5 h-5 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-foreground">Audio Monitor</h3>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium',
          isAudioDetected
            ? 'bg-status-danger/20 text-status-danger'
            : isActive
              ? 'bg-status-normal/20 text-status-normal'
              : 'bg-muted text-muted-foreground'
        )}>
          {isActive ? (
            isAudioDetected ? (
              <>
                <Volume2 className="w-3 h-3 animate-pulse" />
                Noise Detected
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-status-normal animate-pulse" />
                Monitoring
              </>
            )
          ) : (
            'Inactive'
          )}
        </div>
      </div>

      {/* Audio Level Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Audio Level</span>
          <span className="font-mono">{Math.round(audioLevel)}%</span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'absolute inset-y-0 left-0 transition-all duration-100 rounded-full',
              getProgressColor()
            )}
            style={{ width: `${audioLevel}%` }}
          />
          {/* Threshold indicator */}
          <div
            className="absolute inset-y-0 w-0.5 bg-status-warning/50"
            style={{ left: `${AUDIO_THRESHOLD}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Threshold: {AUDIO_THRESHOLD}%
        </p>
      </div>

      {/* Alert message */}
      {isAudioDetected && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-status-danger/10 border border-status-danger/30 rounded-lg animate-fade-in">
          <Volume2 className="w-4 h-4 text-status-danger flex-shrink-0" />
          <p className="text-xs text-status-danger">
            Background noise or talking detected
          </p>
        </div>
      )}
    </div>
  );
};
