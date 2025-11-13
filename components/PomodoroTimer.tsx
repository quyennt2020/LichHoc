import React, { useState, useEffect, useRef } from 'react';
import { HomeTask } from '../types';
import { PlayIcon, PauseIcon, ArrowUturnLeftIcon, CloseIcon, Cog6ToothIcon, VideoCameraIcon, UserIcon } from './icons';

// Define a type for the MediaPipe Vision object for better type safety.
type MediaPipeVision = {
  FaceDetector: any;
  FilesetResolver: any;
};
declare var vision: MediaPipeVision | undefined;

interface PomodoroTimerProps {
  task: HomeTask;
  onClose: () => void;
  onComplete: (taskId: string) => void;
  onOpenSettings: () => void;
  durationInMinutes?: number;
}

type DetectorStatus = 'idle' | 'initializing' | 'ready' | 'failed';

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ task, onClose, onComplete, onOpenSettings, durationInMinutes = 25 }) => {
  const durationInSeconds = durationInMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(durationInSeconds);
  const [isActive, setIsActive] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // States and refs for face detection
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [detectorStatus, setDetectorStatus] = useState<DetectorStatus>('idle');
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
  }, []);
  
  useEffect(() => {
      setTimeLeft(durationInSeconds);
  }, [durationInSeconds]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - ${task.title}`;
    
    if (timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsActive(false);
      audioRef.current?.play();
      onComplete(task.id);
      document.title = 'MySchedule';
    }

    return () => { document.title = 'MySchedule'; }
  }, [timeLeft, onComplete, task.id, task.title]);

  // --- MediaPipe Face Detection Logic ---
  // A single, unified useEffect to manage the entire camera/detection lifecycle.
  // This avoids race conditions by handling initialization and camera setup in one controlled flow.
  useEffect(() => {
    const cleanup = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsFaceDetected(false);
    };

    if (!isCameraEnabled) {
      cleanup();
      return;
    }

    const setupAndRun = async () => {
      try {
        // Step 1: Lazily initialize the detector only when first needed.
        if (!faceDetectorRef.current) {
          setDetectorStatus('initializing');
          if (typeof vision === 'undefined') {
            throw new Error("MediaPipe Vision bundle is not loaded. Cannot initialize FaceDetector.");
          }
          
          const { FaceDetector, FilesetResolver } = vision;
          const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
          const detector = await FaceDetector.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
          });
          faceDetectorRef.current = detector;
          setDetectorStatus('ready');
        }

        // Step 2: Set up the camera.
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            if (videoRef.current) videoRef.current.onloadeddata = () => resolve(true);
          });
          videoRef.current.play();
        }

        // Step 3: Start the prediction loop.
        let lastVideoTime = -1;
        const predictWebcam = () => {
          const video = videoRef.current;
          const detector = faceDetectorRef.current;
          if (!video || !detector || video.paused || video.ended) {
            animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
            return;
          }
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const result = detector.detectForVideo(video, performance.now());
            setIsFaceDetected(result.detections.length > 0);
          }
          animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
        };
        predictWebcam();
      } catch (err: any) {
        console.error("Face detection setup failed:", err);
        setDetectionError(err.message || "An unknown error occurred.");
        setDetectorStatus('failed');
        setIsCameraEnabled(false);
      }
    };

    setupAndRun();
    return cleanup;
  }, [isCameraEnabled]); // This effect depends only on the user's action to toggle the camera.

  const handleToggleCamera = () => {
    setDetectionError(null);
    setIsCameraEnabled(prev => !prev);
  };
  // --- End of Face Detection Logic ---

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(durationInSeconds);
    setIsActive(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const progress = ((durationInSeconds - timeLeft) / durationInSeconds) * 100;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed top-0 left-0 right-0 bg-light-card dark:bg-dark-card shadow-lg z-50 flex items-center justify-between p-3 sm:p-4 transform transition-transform duration-300 animate-slide-down">
      <div className="flex items-center gap-4 flex-grow min-w-0">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-light-border dark:text-dark-border"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />
            <circle
              className="text-brand-primary"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
              transform="rotate(-90 50 50)"
            />
             <text
                x="50"
                y="50"
                fontFamily="sans-serif"
                fontSize="20"
                textAnchor="middle"
                alignmentBaseline="central"
                className="fill-light-text dark:fill-dark-text font-bold"
            >
              {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
            </text>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">Focusing on:</p>
          <h3 className="text-lg sm:text-xl font-bold text-light-text dark:text-dark-text truncate" title={task.title}>{task.title}</h3>
           {isCameraEnabled && (detectorStatus === 'ready' || detectorStatus === 'initializing') && (
                <div className="flex items-center gap-2 mt-1">
                    <video ref={videoRef} autoPlay playsInline muted className="w-16 h-12 rounded-md bg-black object-cover" />
                    {detectorStatus === 'ready' && (
                        <div className="flex items-center gap-1">
                            <UserIcon className={`w-5 h-5 flex-shrink-0 transition-colors ${isFaceDetected ? 'text-green-500' : 'text-slate-500'}`} />
                            <span className={`text-sm font-semibold transition-colors ${isFaceDetected ? 'text-green-500' : 'text-slate-500'}`}>
                                {isFaceDetected ? 'Face Detected' : 'No Face Detected'}
                            </span>
                        </div>
                    )}
                </div>
            )}
            {detectorStatus === 'initializing' && isCameraEnabled && (
                 <p className="text-sm text-slate-500 mt-1">Initializing detector...</p>
            )}
            {detectionError && <p className="text-xs text-red-500 mt-1">{detectionError}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
         <button onClick={handleToggleCamera} className={`p-2 sm:p-3 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${isCameraEnabled ? 'text-brand-primary' : 'text-slate-600 dark:text-slate-300'}`} disabled={detectorStatus === 'initializing'}>
            <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
         <button onClick={onOpenSettings} className="p-2 sm:p-3 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
            <Cog6ToothIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button onClick={resetTimer} className="p-2 sm:p-3 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
            <ArrowUturnLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button onClick={toggleTimer} className="p-3 sm:p-4 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primary/90 transition-transform transform hover:scale-105">
            {isActive ? <PauseIcon className="w-6 h-6 sm:w-8 sm:h-8" /> : <PlayIcon className="w-6 h-6 sm:w-8 sm:h-8" />}
        </button>
         <button onClick={onClose} className="p-2 sm:p-3 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};

const PomodoroStyles = () => <style>{`
@keyframes slide-down {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}
.animate-slide-down {
  animation: slide-down 0.3s ease-out forwards;
}
`}</style>;


export { PomodoroTimer, PomodoroStyles };