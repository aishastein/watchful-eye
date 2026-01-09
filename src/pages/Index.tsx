import { useState } from 'react';
import { useProctoring } from '@/hooks/useProctoring';
import { CameraFeed } from '@/components/proctoring/CameraFeed';
import { StatusIndicator } from '@/components/proctoring/StatusIndicator';
import { SuspicionScore } from '@/components/proctoring/SuspicionScore';
import { WarningCounter } from '@/components/proctoring/WarningCounter';
import { HeadPoseIndicator } from '@/components/proctoring/HeadPoseIndicator';
import { EventLog } from '@/components/proctoring/EventLog';
import { PrivacyBadge } from '@/components/proctoring/PrivacyBadge';
import { ExaminerToggle } from '@/components/proctoring/ExaminerToggle';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Shield } from 'lucide-react';

const Index = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const {
    state,
    setFaceDetected,
    setHeadPose,
    setEyeGaze,
    toggleExaminerMode,
    resetSession,
    addEvent,
  } = useProctoring();

  const handleStartSession = () => {
    setIsSessionActive(true);
    addEvent('status_change', 'Proctoring session started', 'normal');
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    addEvent('status_change', 'Proctoring session ended', 'normal');
  };

  const handleReset = () => {
    setIsSessionActive(false);
    resetSession();
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ProctorAI</h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Exam Monitoring System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExaminerToggle
              isEnabled={state.isExaminerMode}
              onToggle={toggleExaminerMode}
            />
            <StatusIndicator status={state.status} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Camera & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera Feed */}
            <CameraFeed
              onFaceDetected={setFaceDetected}
              onHeadPoseChange={setHeadPose}
              onEyeGazeChange={setEyeGaze}
              faceDetected={state.faceDetected}
              isActive={isSessionActive}
            />

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-3">
              {!isSessionActive ? (
                <Button
                  onClick={handleStartSession}
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Play className="w-5 h-5" />
                  Start Session
                </Button>
              ) : (
                <Button
                  onClick={handleStopSession}
                  size="lg"
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="w-5 h-5" />
                  Stop Session
                </Button>
              )}
              <Button
                onClick={handleReset}
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SuspicionScore score={state.suspicionScore} />
              <WarningCounter count={state.warningCount} />
            </div>
          </div>

          {/* Right Column - Status & Logs */}
          <div className="space-y-6">
            {/* Head Pose Indicator */}
            <HeadPoseIndicator
              pose={state.headPose}
              faceDetected={state.faceDetected}
            />

            {/* Event Log */}
            <EventLog events={state.events} />

            {/* Privacy Badge */}
            <PrivacyBadge />
          </div>
        </div>

        {/* Examiner Mode Panel */}
        {state.isExaminerMode && (
          <div className="mt-8 card-glass rounded-xl p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Examiner Dashboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Current Status</p>
                <StatusIndicator status={state.status} size="lg" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Session Metrics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold font-mono text-foreground">
                      {state.events.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Events</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-mono text-foreground">
                      {state.warningCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Warnings</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Detection Status</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Face Detection</span>
                    <span className={state.faceDetected ? 'status-normal' : 'status-danger'}>
                      {state.faceDetected ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Head Pose</span>
                    <span className="text-foreground capitalize">{state.headPose}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Eye Gaze</span>
                    <span className="text-foreground capitalize">{state.eyeGaze}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          ProctorAI — Privacy-First Exam Monitoring • No video uploaded • All processing done locally
        </p>
      </footer>
    </div>
  );
};

export default Index;
