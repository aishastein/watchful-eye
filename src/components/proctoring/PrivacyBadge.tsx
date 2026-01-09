import { Shield, WifiOff, Eye, Database } from 'lucide-react';

export const PrivacyBadge = () => {
  const features = [
    { icon: WifiOff, label: 'Works Offline', description: 'No internet required' },
    { icon: Eye, label: 'No Video Upload', description: 'Processed locally' },
    { icon: Database, label: 'No Face Storage', description: 'Only logs saved' },
  ];

  return (
    <div className="card-glass rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">Privacy First</h3>
          <p className="text-xs text-muted-foreground">Your data stays on your device</p>
        </div>
      </div>

      <div className="space-y-3">
        {features.map(({ icon: Icon, label, description }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="p-1.5 bg-muted rounded">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
