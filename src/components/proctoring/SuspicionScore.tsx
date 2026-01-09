import { cn } from '@/lib/utils';

interface SuspicionScoreProps {
  score: number;
}

export const SuspicionScore = ({ score }: SuspicionScoreProps) => {
  const getScoreColor = () => {
    if (score < 30) return 'status-normal';
    if (score < 60) return 'status-warning';
    return 'status-danger';
  };

  const getGlowClass = () => {
    if (score < 30) return 'glow-normal';
    if (score < 60) return 'glow-warning';
    return 'glow-danger';
  };

  const getBgClass = () => {
    if (score < 30) return 'bg-status-normal';
    if (score < 60) return 'bg-status-warning';
    return 'bg-status-danger';
  };

  return (
    <div className="card-glass rounded-xl p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Suspicion Score</h3>
      
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'text-5xl font-bold font-mono transition-all duration-500',
            getScoreColor()
          )}
        >
          {score}
        </div>
        <div className="flex-1">
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                getBgClass(),
                getGlowClass()
              )}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
