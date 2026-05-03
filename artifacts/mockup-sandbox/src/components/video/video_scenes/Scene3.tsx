import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const TOPICS = [
  { name: 'Quantum Mechanics', score: 98, level: 'HIGH', color: '#f97316' },
  { name: 'Linear Algebra', score: 85, level: 'HIGH', color: '#f97316' },
  { name: 'Calculus III', score: 62, level: 'MEDIUM', color: '#4f8ef7' },
  { name: 'Basic Physics', score: 15, level: 'LOW', color: '#10b981' },
];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, transition: { duration: 0.5 } }}
    >
      <motion.h2 
        className="text-[3.5vw] font-display font-bold mb-16 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
      >
        AI Ranks Every Topic
      </motion.h2>

      <div className="flex flex-col gap-4 w-[50vw]">
        {TOPICS.map((topic, i) => (
          <motion.div 
            key={i}
            className="flex items-center justify-between bg-[#0a0a1a] border border-white/10 rounded-xl p-6"
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ delay: i * 0.2, type: 'spring', damping: 20 }}
          >
            <div className="flex items-center gap-6">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: topic.color, boxShadow: `0 0 10px ${topic.color}` }}
              />
              <span className="text-[1.8vw] font-sans font-medium">{topic.name}</span>
            </div>
            
            <div className="flex items-center gap-6">
              <motion.div 
                className="w-[15vw] h-2 bg-white/10 rounded-full overflow-hidden"
              >
                <motion.div 
                  className="h-full"
                  style={{ backgroundColor: topic.color }}
                  initial={{ width: 0 }}
                  animate={phase >= 2 ? { width: `${topic.score}%` } : { width: 0 }}
                  transition={{ delay: (i * 0.2) + 0.3, duration: 1, type: 'spring' }}
                />
              </motion.div>
              <div 
                className="px-3 py-1 rounded border text-[1vw] font-bold tracking-wider"
                style={{ color: topic.color, borderColor: topic.color }}
              >
                {topic.level}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
