export type ProctorStatus = 'normal' | 'warning' | 'suspicious';

export type HeadPose = 'center' | 'left' | 'right' | 'down' | 'up';

export type EyeGaze = 'center' | 'left' | 'right';

export interface ProctorEvent {
  id: string;
  timestamp: Date;
  type: 'face_lost' | 'head_pose' | 'eye_gaze' | 'warning' | 'status_change' | 'multiple_faces' | 'audio_detected';
  description: string;
  severity: ProctorStatus;
}

export interface ProctorState {
  status: ProctorStatus;
  faceDetected: boolean;
  faceCount: number;
  headPose: HeadPose;
  eyeGaze: EyeGaze;
  warningCount: number;
  suspicionScore: number;
  events: ProctorEvent[];
  isExaminerMode: boolean;
  lookAwayStartTime: number | null;
  audioLevel: number;
  isAudioDetected: boolean;
}

export interface FaceLandmarks {
  nose: { x: number; y: number };
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  chin: { x: number; y: number };
  spectacles: {x:number; y:number};
}
