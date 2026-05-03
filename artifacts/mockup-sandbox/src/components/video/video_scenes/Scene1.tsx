import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#05050a]/40"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5 } }}
      transition={{ duration: 0.8 }}
    >
      <div className="relative text-center z-10" style={{ perspective: '1000px' }}>
        <motion.div 
          className="text-[#f97316] font-display text-[4vw] font-bold tracking-tight mb-2"
          initial={{ opacity: 0, y: 30, rotateX: -30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 30, rotateX: -30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          STOP GUESSING.
        </motion.div>
        
        <motion.div 
          className="text-white font-display text-[6vw] font-bold tracking-tighter leading-none"
          initial={{ opacity: 0, y: 30, rotateX: -30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 30, rotateX: -30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        >
          START KNOWING.
        </motion.div>
        
        <motion.div 
          className="mt-8 text-[#94a3b8] font-sans text-[1.5vw] font-medium"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          Stop wasting hours on the wrong topics.
        </motion.div>
      </div>

      <motion.div 
        className="absolute top-1/2 left-1/2 w-[30vw] h-[30vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4f8ef7]/20"
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 1 ? { scale: [1, 1.5, 2], opacity: [0.5, 0] } : { scale: 0, opacity: 0 }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
}
