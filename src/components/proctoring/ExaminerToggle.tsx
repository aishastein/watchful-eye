import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExaminerToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export const ExaminerToggle = ({ isEnabled, onToggle }: ExaminerToggleProps) => {
  return (
    <Button
      onClick={onToggle}
      variant={isEnabled ? 'default' : 'secondary'}
      className={cn(
        'gap-2 transition-all duration-300',
        isEnabled && 'bg-primary hover:bg-primary/90'
      )}
    >
      {isEnabled ? (
        <>
          <Eye className="w-4 h-4" />
          Examiner View ON
        </>
      ) : (
        <>
          <EyeOff className="w-4 h-4" />
          Examiner View OFF
        </>
      )}
    </Button>
  );
};
