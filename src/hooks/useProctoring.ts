import { useState, useCallback, useRef } from 'react';
import { ProctorState, ProctorEvent, ProctorStatus, HeadPose, EyeGaze } from '@/types/proctoring';

const LOOK_AWAY_THRESHOLD = 3000; // 3 seconds
const WARNING_THRESHOLD = 3; // 3 warnings = suspicious

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useProctoring = () => {
  const [state, setState] = useState<ProctorState>({
    status: 'normal',
    faceDetected: false,
    faceCount: 0,
    headPose: 'center',
    eyeGaze: 'center',
    warningCount: 0,
    suspicionScore: 0,
    events: [],
    isExaminerMode: false,
    lookAwayStartTime: null,
  });

  const lookAwayTimer = useRef<NodeJS.Timeout | null>(null);

  const addEvent = useCallback((
    type: ProctorEvent['type'],
    description: string,
    severity: ProctorStatus
  ) => {
    const event: ProctorEvent = {
      id: generateId(),
      timestamp: new Date(),
      type,
      description,
      severity,
    };

    setState(prev => ({
      ...prev,
      events: [event, ...prev.events].slice(0, 50), // Keep last 50 events
    }));
  }, []);

  const updateStatus = useCallback((newStatus: ProctorStatus) => {
    setState(prev => {
      if (prev.status !== newStatus) {
        return { ...prev, status: newStatus };
      }
      return prev;
    });
  }, []);

  const incrementWarning = useCallback(() => {
    setState(prev => {
      const newCount = prev.warningCount + 1;
      const newStatus = newCount >= WARNING_THRESHOLD ? 'suspicious' : 'warning';
      const newScore = Math.min(100, prev.suspicionScore + 15);

      return {
        ...prev,
        warningCount: newCount,
        status: newStatus,
        suspicionScore: newScore,
      };
    });
  }, []);

  const setFaceDetected = useCallback((detected: boolean) => {
    setState(prev => {
      if (prev.faceDetected !== detected) {
        if (!detected) {
          addEvent('face_lost', 'Face not detected - student may have left', 'warning');
        }
        return { ...prev, faceDetected: detected };
      }
      return prev;
    });
  }, [addEvent]);

  const setFaceCount = useCallback((count: number) => {
    setState(prev => {
      if (prev.faceCount !== count) {
        if (count > 1) {
          addEvent('multiple_faces', `${count} faces detected - possible assistance`, 'suspicious');
          return {
            ...prev,
            faceCount: count,
            status: 'suspicious',
            suspicionScore: Math.min(100, prev.suspicionScore + 25),
            warningCount: prev.warningCount + 1,
          };
        }
        return { ...prev, faceCount: count };
      }
      return prev;
    });
  }, [addEvent]);

  const setHeadPose = useCallback((pose: HeadPose) => {
    setState(prev => {
      if (prev.headPose !== pose) {
        const isLookingAway = pose !== 'center';
        
        if (isLookingAway && !prev.lookAwayStartTime) {
          // Start tracking look away time
          if (lookAwayTimer.current) clearTimeout(lookAwayTimer.current);
          lookAwayTimer.current = setTimeout(() => {
            addEvent('head_pose', `Looking ${pose} for more than 3 seconds`, 'warning');
            incrementWarning();
          }, LOOK_AWAY_THRESHOLD);

          return {
            ...prev,
            headPose: pose,
            lookAwayStartTime: Date.now(),
            suspicionScore: Math.min(100, prev.suspicionScore + 5),
          };
        } else if (!isLookingAway) {
          // Reset timer when looking back
          if (lookAwayTimer.current) {
            clearTimeout(lookAwayTimer.current);
            lookAwayTimer.current = null;
          }
          
          return {
            ...prev,
            headPose: pose,
            lookAwayStartTime: null,
            status: prev.warningCount < WARNING_THRESHOLD ? 'normal' : prev.status,
          };
        }

        return { ...prev, headPose: pose };
      }
      return prev;
    });
  }, [addEvent, incrementWarning]);

  const setEyeGaze = useCallback((gaze: EyeGaze) => {
    setState(prev => {
      if (prev.eyeGaze !== gaze) {
        if (gaze !== 'center') {
          return {
            ...prev,
            eyeGaze: gaze,
            suspicionScore: Math.min(100, prev.suspicionScore + 2),
          };
        }
        return { ...prev, eyeGaze: gaze };
      }
      return prev;
    });
  }, []);

  const toggleExaminerMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isExaminerMode: !prev.isExaminerMode,
    }));
  }, []);

  const resetSession = useCallback(() => {
    if (lookAwayTimer.current) {
      clearTimeout(lookAwayTimer.current);
      lookAwayTimer.current = null;
    }
    
    setState({
      status: 'normal',
      faceDetected: false,
      faceCount: 0,
      headPose: 'center',
      eyeGaze: 'center',
      warningCount: 0,
      suspicionScore: 0,
      events: [],
      isExaminerMode: false,
      lookAwayStartTime: null,
    });
  }, []);

  return {
    state,
    setFaceDetected,
    setFaceCount,
    setHeadPose,
    setEyeGaze,
    addEvent,
    updateStatus,
    incrementWarning,
    toggleExaminerMode,
    resetSession,
  };
};
