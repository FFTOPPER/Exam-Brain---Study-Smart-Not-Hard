import { useEffect, useState } from 'react';

declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const sceneKeys = Object.keys(durations);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let isCancelled = false;

    if (currentScene === 0) {
      window.startRecording?.();
    }

    const currentDuration = durations[sceneKeys[currentScene]];

    timeout = setTimeout(() => {
      if (isCancelled) return;

      if (currentScene === sceneKeys.length - 1) {
        window.stopRecording?.();
        setCurrentScene(0); // loop
      } else {
        setCurrentScene((prev) => prev + 1);
      }
    }, currentDuration);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [currentScene, durations, sceneKeys]);

  return { currentScene };
}
