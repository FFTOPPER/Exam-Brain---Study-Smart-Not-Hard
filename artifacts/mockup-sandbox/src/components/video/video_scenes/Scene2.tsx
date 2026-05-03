import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 4000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50, transition: { duration: 0.5 } }}
    >
      <div className="w-full max-w-[60vw] flex flex-col items-center">
        <motion.h2 
          className="text-[4vw] font-display font-bold mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        >
          Drop Your Past Papers
        </motion.h2>

        <motion.div 
          className="w-full aspect-[2/1] border-2 border-dashed border-[#4f8ef7]/40 rounded-2xl bg-[#0a0a1a] flex flex-col items-center justify-center relative overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={phase >= 2 ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          {/* Drag state effect */}
          <motion.div 
            className="absolute inset-0 bg-[#4f8ef7]/10"
            initial={{ opacity: 0 }}
            animate={phase >= 3 && phase < 4 ? { opacity: 1 } : { opacity: 0 }}
          />

          <motion.div
            animate={phase >= 3 ? { y: -20, scale: 1.1, color: '#4f8ef7' } : { y: 0, scale: 1, color: '#94a3b8' }}
          >
            <Upload size={64} />
          </motion.div>
          
          <motion.p 
            className="mt-6 text-[#94a3b8] text-[1.5vw] font-sans"
            animate={phase >= 3 ? { opacity: 0 } : { opacity: 1 }}
          >
            Drag and drop PDF files here
          </motion.p>

          {/* Falling Document */}
          {phase >= 3 && (
            <motion.div 
              className="absolute top-[-100%] bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/20"
              initial={{ y: 0, rotate: -10, opacity: 1 }}
              animate={phase >= 4 ? { y: 200, rotate: 0, opacity: 0, scale: 0.8 } : { y: 150, rotate: 5, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring' }}
            >
              <FileText size={48} className="text-white" />
            </motion.div>
          )}

          {/* Processing state */}
          {phase >= 4 && (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a1a]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-[10vw] h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#4f8ef7]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'linear' }}
                />
              </div>
              <p className="mt-4 text-[#4f8ef7] font-mono text-[1vw]">ANALYZING SYLLABUS...</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
