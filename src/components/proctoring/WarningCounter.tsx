import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarningCounterProps {
  count: number;
  threshold?: number;
}

export const WarningCounter = ({ count, threshold = 3 }: WarningCounterProps) => {
  const isNearThreshold = count >= threshold - 1;
  const isOverThreshold = count >= threshold;

  return (
    <div className="card-glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Warnings</h3>
      
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-3 rounded-lg transition-all duration-300',
            isOverThreshold
              ? 'bg-status-danger/20 text-status-danger'
              : isNearThreshold
              ? 'bg-status-warning/20 text-status-warning'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <AlertTriangle size={24} />
        </div>
        
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'text-4xl font-bold font-mono transition-all duration-300',
                isOverThreshold
                  ? 'status-danger'
                  : isNearThreshold
                  ? 'status-warning'
                  : 'text-foreground'
              )}
            >
              {count}
            </span>
            <span className="text-muted-foreground text-lg">/ {threshold}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isOverThreshold
              ? 'Threshold exceeded!'
              : isNearThreshold
              ? 'One more triggers flag'
              : 'Before suspicious flag'}
          </p>
        </div>
      </div>
    </div>
  );
};
