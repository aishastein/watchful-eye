import { Users, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceCountIndicatorProps {
  count: number;
  faceDetected: boolean;
}

export const FaceCountIndicator = ({ count, faceDetected }: FaceCountIndicatorProps) => {
  const hasMultipleFaces = count > 1;

  return (
    <div className="card-glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Face Detection</h3>
      
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-3 rounded-lg transition-all duration-300',
            !faceDetected
              ? 'bg-muted text-muted-foreground'
              : hasMultipleFaces
              ? 'bg-status-danger/20 text-status-danger glow-danger'
              : 'bg-status-normal/20 text-status-normal'
          )}
        >
          {hasMultipleFaces ? (
            <Users size={24} />
          ) : (
            <UserCheck size={24} />
          )}
        </div>
        
        <div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-4xl font-bold font-mono transition-all duration-300',
                !faceDetected
                  ? 'text-muted-foreground'
                  : hasMultipleFaces
                  ? 'status-danger'
                  : 'status-normal'
              )}
            >
              {count}
            </span>
            <span className="text-muted-foreground">
              {count === 1 ? 'face' : 'faces'}
            </span>
          </div>
          <p className={cn(
            'text-xs mt-1 transition-all duration-300',
            hasMultipleFaces 
              ? 'text-status-danger' 
              : 'text-muted-foreground'
          )}>
            {!faceDetected
              ? 'No face in frame'
              : hasMultipleFaces
              ? 'Unauthorized person detected!'
              : 'Single person verified'}
          </p>
        </div>
      </div>

      {/* Visual face indicators */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: Math.max(count, 1) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300',
              i === 0
                ? faceDetected
                  ? 'bg-status-normal/20 border border-status-normal text-status-normal'
                  : 'bg-muted border border-muted-foreground/30 text-muted-foreground'
                : 'bg-status-danger/20 border border-status-danger text-status-danger animate-pulse'
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};
