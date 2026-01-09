import { ProctorEvent } from '@/types/proctoring';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, User, AlertTriangle, Activity, Users, Volume2 } from 'lucide-react';

interface EventLogProps {
  events: ProctorEvent[];
}

const eventIcons = {
  face_lost: User,
  head_pose: Activity,
  eye_gaze: Eye,
  warning: AlertTriangle,
  status_change: Activity,
  multiple_faces: Users,
  audio_detected: Volume2,
};

const severityClasses = {
  normal: 'border-l-status-normal bg-status-normal/5',
  warning: 'border-l-status-warning bg-status-warning/5',
  suspicious: 'border-l-status-danger bg-status-danger/5',
};

export const EventLog = ({ events }: EventLogProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="card-glass rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Event Log</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {events.length} events
        </span>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Activity className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No events recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const Icon = eventIcons[event.type];
              return (
                <div
                  key={event.id}
                  className={cn(
                    'border-l-2 pl-3 py-2 rounded-r-lg animate-slide-in',
                    severityClasses[event.severity]
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
