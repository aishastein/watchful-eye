import { ProctorStatus } from '@/types/proctoring';
import { Shield, AlertTriangle, XOctagon, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: ProctorStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  normal: {
    icon: CheckCircle,
    label: 'Normal',
    className: 'status-normal border-status-normal glow-normal',
    bgClass: 'bg-status-normal/10',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'status-warning border-status-warning glow-warning pulse-warning',
    bgClass: 'bg-status-warning/10',
  },
  suspicious: {
    icon: XOctagon,
    label: 'Suspicious',
    className: 'status-danger border-status-danger glow-danger pulse-danger',
    bgClass: 'bg-status-danger/10',
  },
};

const sizeConfig = {
  sm: { container: 'px-3 py-1.5', icon: 16, text: 'text-sm' },
  md: { container: 'px-4 py-2', icon: 20, text: 'text-base' },
  lg: { container: 'px-6 py-3', icon: 24, text: 'text-lg' },
};

export const StatusIndicator = ({ status, size = 'md' }: StatusIndicatorProps) => {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-2 font-medium transition-all duration-300',
        config.className,
        config.bgClass,
        sizes.container,
        sizes.text
      )}
    >
      <Icon size={sizes.icon} />
      <span>{config.label}</span>
    </div>
  );
};
