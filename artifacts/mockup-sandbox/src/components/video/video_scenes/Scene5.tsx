import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const DAYS = [
  { day: 1, hours: 3, goal: 'Deep dive — High Priority', topics: ['Quantum Mechanics', 'Linear Algebra'], color: '#f97316' },
  { day: 2, hours: 2.5, goal: 'Reinforce — Medium Priority', topics: ['Calculus III', 'Electromagnetism'], color: '#4f8ef7' },
  { day: 3, hours: 2, goal: 'Review & Practice', topics: ['Past Paper Q&A', 'Mock Test'], color: '#8b5cf6' },
];

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className="text-[3.5vw] font-display font-bold mb-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
      >
        Your Personal Study Plan
      </motion.h2>

      <div className="flex flex-col gap-4 w-[55vw]">
        {DAYS.map((day, i) => (
          <motion.div
            key={i}
            className="relative flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-[#0a0a1a]"
            initial={{ opacity: 0, x: -60 }}
            animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
            transition={{ delay: i * 0.22, type: 'spring', damping: 22, stiffness: 160 }}
          >
            {/* Left accent bar */}
            <motion.div
              className="w-1 flex-shrink-0"
              initial={{ scaleY: 0 }}
              animate={phase >= 2 ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ delay: i * 0.22 + 0.2, duration: 0.4 }}
              style={{ backgroundColor: day.color, transformOrigin: 'top' }}
            />

            <div className="flex-1 flex items-center px-5 py-4 gap-6">
              {/* Day badge */}
              <div className="flex-shrink-0 text-center">
                <div className="text-[0.8vw] text-white/40 uppercase tracking-widest font-sans">Day</div>
                <div className="text-[2.5vw] font-display font-black leading-none" style={{ color: day.color }}>{day.day}</div>
                <div className="text-[0.75vw] text-white/40 mt-0.5">{day.hours}h</div>
              </div>

              <div className="w-px h-10 bg-white/10 flex-shrink-0" />

              {/* Goal */}
              <div className="flex-1 min-w-0">
                <div className="text-[1.2vw] font-sans font-semibold text-white/90 mb-2">{day.goal}</div>
                <div className="flex flex-wrap gap-2">
                  {day.topics.map((t, ti) => (
                    <motion.span
                      key={ti}
                      className="text-[0.85vw] px-2.5 py-1 rounded-md border font-sans"
                      style={{ color: day.color, borderColor: `${day.color}40`, backgroundColor: `${day.color}12` }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                      transition={{ delay: i * 0.22 + 0.4 + ti * 0.1 }}
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Hours bar */}
              <div className="flex-shrink-0 w-[10vw]">
                <div className="flex justify-between text-[0.7vw] text-white/40 mb-1 font-sans">
                  <span>Progress</span><span>{day.hours}h</span>
                </div>
                <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: day.color }}
                    initial={{ width: 0 }}
                    animate={phase >= 2 ? { width: `${(day.hours / 3) * 100}%` } : { width: 0 }}
                    transition={{ delay: i * 0.22 + 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
