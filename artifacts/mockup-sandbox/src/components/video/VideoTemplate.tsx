import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

const SCENE_DURATIONS = {
  hook: 6000,
  upload: 7000,
  analysis: 8000,
  chart: 7000,
  plan: 8000,
  closing: 6000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05050a] text-white">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[100px] opacity-30"
          style={{ background: 'radial-gradient(circle, #4f8ef7, transparent)' }}
          animate={{
            x: ['-20%', '80%', '30%', '-20%'],
            y: ['-10%', '20%', '70%', '-10%'],
            scale: [1, 1.2, 0.8, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-20 right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }}
          animate={{
            x: ['20%', '-60%', '10%', '20%'],
            y: ['20%', '-40%', '-10%', '20%'],
            scale: [1, 1.5, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {currentScene === 0 && <Scene1 key="hook" />}
        {currentScene === 1 && <Scene2 key="upload" />}
        {currentScene === 2 && <Scene3 key="analysis" />}
        {currentScene === 3 && <Scene4 key="chart" />}
        {currentScene === 4 && <Scene5 key="plan" />}
        {currentScene === 5 && <Scene6 key="closing" />}
      </AnimatePresence>
    </div>
  );
}
