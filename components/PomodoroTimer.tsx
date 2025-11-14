import React, { useState, useEffect, useRef } from 'react';
import { HomeTask } from '../types';
import { PlayIcon, PauseIcon, ArrowUturnLeftIcon, CloseIcon, Cog6ToothIcon, VideoCameraIcon, UserIcon } from './icons';

// The MediaPipe library is now loaded as a standard module via the importmap in index.html.
// This removes the need for complex, manual script loading logic.
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

interface PomodoroTimerProps {
  task: HomeTask;
  onClose: () => void;
  onComplete: (taskId: string) => void;
  onOpenSettings: () => void;
  durationInMinutes?: number;
}

type DetectorStatus = 'idle' | 'initializing' | 'ready' | 'failed';

const AUTO_PAUSE_THRESHOLD_MS = 5000; // 5 seconds

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

  // States for auto-pause feature
  const [wasAutoPaused, setWasAutoPaused] = useState(false);
  const awayTimerRef = useRef<number | null>(null);


  useEffect(() => {
    audioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
  }, []);
  
  useEffect(() => {
      setTimeLeft(durationInSeconds);
  }, [durationInSeconds]);

  // This useEffect is dedicated to cleaning up resources when the component unmounts.
  useEffect(() => {
    return () => {
      // Ensure all camera tracks are stopped when the timer is closed.
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      // Also cancel any pending animation frame to prevent memory leaks.
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, []); // The empty dependency array ensures this cleanup runs only once when the component unmounts.

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
      
      // Explicitly disable the camera to trigger its cleanup logic before the component unmounts.
      if (isCameraEnabled) {
        setIsCameraEnabled(false);
      }
      
      onComplete(task.id);
      document.title = 'MySchedule';
    }

    return () => { document.title = 'MySchedule'; }
  }, [timeLeft, onComplete, task.id, task.title, isCameraEnabled]);
  
  // A single, unified useEffect to manage the entire camera/detection lifecycle.
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
        // STEP 1: Lazily initialize the detector only when first needed.
        // The script is now loaded via ESM, so no dynamic loading logic is needed here.
        if (!faceDetectorRef.current) {
          setDetectorStatus('initializing');
          
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

        // STEP 2: Set up the camera.
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            if (videoRef.current) videoRef.current.onloadeddata = () => resolve(true);
          });
          videoRef.current.play();
        }

        // STEP 3: Start the prediction loop.
        let lastVideoTime = -1;
        const predictWebcam = () => {
            const video = videoRef.current;
            const detector = faceDetectorRef.current;

            // The detector or video element may not be ready yet.
            if (!detector || !video) {
                animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
                return;
            }

            // If the video is paused, attempt to play it. This can happen if the browser
            // pauses video playback for performance reasons (e.g., after a manual pause/resume).
            // We'll continue the loop on the next frame.
            if (video.paused) {
                video.play().catch(e => {
                    // This error can happen during cleanup when the video source is removed.
                    // Only log it if the video source is still expected to be present.
                    if (videoRef.current && videoRef.current.srcObject) {
                        console.error("Error attempting to play video in detection loop:", e);
                    }
                });
                animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
                return;
            }

            // If the video has ended, there's nothing to detect.
            if (video.ended) {
                animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
                return;
            }
            
            // Only run detection if the video frame has updated and has valid dimensions.
            // This prevents the MediaPipe error: "roi->width > 0 && roi->height > 0".
            if (video.videoWidth > 0 && video.videoHeight > 0 && video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                const result = detector.detectForVideo(video, performance.now());
                setIsFaceDetected(result.detections.length > 0);
            }
            
            // Continue the loop.
            animationFrameIdRef.current = requestAnimationFrame(predictWebcam);
        };
        predictWebcam();
      } catch (err: any) {
        console.error("Face detection setup failed:", err);
        // This new error message is more generic to cover failures in loading the WASM or model files.
        setDetectionError("Face detector setup failed. This might be due to a network issue, ad-blocker, or an unsupported browser/device.");
        setDetectorStatus('failed');
        setIsCameraEnabled(false);
      }
    };

    setupAndRun();
    return cleanup;
  }, [isCameraEnabled]);

  // useEffect for Auto-Pause and Auto-Resume logic
  useEffect(() => {
    // Conditions where auto-pause should NOT be active
    if (!isCameraEnabled || !isActive || detectorStatus !== 'ready') {
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
      return;
    }

    if (!isFaceDetected) {
      // Face is NOT detected, start the away timer if it isn't already running
      if (!awayTimerRef.current) {
        awayTimerRef.current = window.setTimeout(() => {
          setIsActive(false);
          setWasAutoPaused(true);
        }, AUTO_PAUSE_THRESHOLD_MS);
      }
    } else {
      // Face IS detected
      // 1. Clear any pending away timer
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
      // 2. If the timer was auto-paused, resume it
      if (wasAutoPaused) {
        setIsActive(true);
        setWasAutoPaused(false);
      }
    }

    // Cleanup the timeout if the component re-renders or dependencies change
    return () => {
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
    };
  }, [isFaceDetected, isActive, isCameraEnabled, wasAutoPaused, detectorStatus]);


  const handleToggleCamera = () => {
    setDetectionError(null);
    setIsCameraEnabled(prev => !prev);
  };

  const handleCloseClick = () => {
    // 1. Stop the timer interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 2. Stop the camera and cleanup face detection resources
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraEnabled(false); // Update internal state
    setIsFaceDetected(false);

    // 3. Call the parent's onClose handler
    onClose();
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    // If the user manually interacts, disable the auto-resume flag.
    setWasAutoPaused(false);
  };
  
  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(durationInSeconds);
    setIsActive(false);
    // Also reset the auto-pause state.
    setWasAutoPaused(false);
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
           {wasAutoPaused && !isActive && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 animate-pulse">
                Timer auto-paused. Face not detected.
              </p>
            )}
           {isCameraEnabled && (detectorStatus === 'ready' || detectorStatus === 'initializing') && !wasAutoPaused && (
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
         <button onClick={handleCloseClick} className="p-2 sm:p-3 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
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