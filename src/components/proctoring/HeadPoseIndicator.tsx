import { HeadPose } from '@/types/proctoring';
import { cn } from '@/lib/utils';

interface HeadPoseIndicatorProps {
  pose: HeadPose;
  faceDetected: boolean;
}

export const HeadPoseIndicator = ({ pose, faceDetected }: HeadPoseIndicatorProps) => {
  const getPositionClass = () => {
    switch (pose) {
      case 'left':
        return 'translate-x-[-12px]';
      case 'right':
        return 'translate-x-[12px]';
      case 'down':
        return 'translate-y-[8px]';
      case 'up':
        return 'translate-y-[-8px]';
      default:
        return '';
    }
  };

  const isCenter = pose === 'center';

  return (
    <div className="card-glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Head Position</h3>
      
      <div className="flex flex-col items-center gap-4">
        {/* Face indicator circle */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <div
            className={cn(
              'absolute inset-0 rounded-full border-2 transition-all duration-300',
              !faceDetected
                ? 'border-muted-foreground opacity-30'
                : isCenter
                ? 'border-status-normal glow-normal'
                : 'border-status-warning glow-warning'
            )}
          />
          
          {/* Inner face dot */}
          <div
            className={cn(
              'absolute top-1/2 left-1/2 w-8 h-8 -mt-4 -ml-4 rounded-full transition-all duration-300',
              !faceDetected
                ? 'bg-muted-foreground opacity-30'
                : isCenter
                ? 'bg-status-normal'
                : 'bg-status-warning',
              getPositionClass()
            )}
          >
            {/* Eyes */}
            <div className="flex justify-center gap-2 pt-2">
              <div className="w-1.5 h-1.5 bg-background rounded-full" />
              <div className="w-1.5 h-1.5 bg-background rounded-full" />
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center">
          <p
            className={cn(
              'font-medium capitalize transition-all duration-300',
              !faceDetected
                ? 'text-muted-foreground'
                : isCenter
                ? 'status-normal'
                : 'status-warning'
            )}
          >
            {!faceDetected ? 'Not Detected' : pose === 'center' ? 'Looking Forward' : `Looking ${pose}`}
          </p>
          {!isCenter && faceDetected && (
            <p className="text-xs text-muted-foreground mt-1">
              Potential distraction detected
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
