import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const BRAIN_PATHS = [
  "M55 20 C35 20 18 35 18 55 C18 72 30 85 47 88 L47 92 L63 92 L63 88 C80 85 92 72 92 55 C92 35 75 20 55 20 Z",
  "M42 45 C42 38 48 33 55 33 C62 33 68 38 68 45",
  "M38 58 C38 58 45 65 55 65 C65 65 72 58 72 58",
];

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const letters = 'EXAM BRAIN'.split('');

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.4 } }}
      transition={{ duration: 0.8 }}
    >
      {/* Radial glow burst */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.2) 0%, transparent 70%)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 1 ? { scale: [0, 1.5, 1], opacity: [0, 0.8, 0.4] } : { scale: 0, opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Brain SVG icon */}
      <motion.div
        initial={{ scale: 0, rotate: -15, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, rotate: 0, opacity: 1 } : { scale: 0, rotate: -15, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="mb-6 relative"
      >
        <svg width="6vw" height="6vw" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f8ef7" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <motion.path
            d={BRAIN_PATHS[0]}
            stroke="url(#brainGrad)" strokeWidth="2.5" fill="rgba(79,142,247,0.12)"
            pathLength={1}
            initial={{ pathLength: 0 }} animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
          <motion.path
            d={BRAIN_PATHS[1]}
            stroke="url(#brainGrad)" strokeWidth="2" strokeLinecap="round" fill="none"
            pathLength={1}
            initial={{ pathLength: 0 }} animate={phase >= 2 ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <motion.path
            d={BRAIN_PATHS[2]}
            stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" fill="none"
            pathLength={1}
            initial={{ pathLength: 0 }} animate={phase >= 2 ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
          />
          {/* Pulse dots */}
          {[{ cx: 55, cy: 55 }, { cx: 40, cy: 48 }, { cx: 70, cy: 48 }].map((dot, i) => (
            <motion.circle
              key={i}
              cx={dot.cx} cy={dot.cy} r="2.5"
              fill="#4f8ef7"
              initial={{ opacity: 0, scale: 0 }}
              animate={phase >= 2 ? { opacity: [0, 1, 0.6], scale: [0, 1.3, 1] } : { opacity: 0, scale: 0 }}
              transition={{ delay: 0.6 + i * 0.12, type: 'spring', stiffness: 300, damping: 15 }}
            />
          ))}
        </svg>

        {/* Orbiting ring */}
        <motion.div
          className="absolute inset-[-0.5vw] rounded-full border border-[#4f8ef7]/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute -top-1 left-1/2 w-2 h-2 -translate-x-1/2 rounded-full bg-[#4f8ef7]" />
        </motion.div>
      </motion.div>

      {/* Title — per-character stagger */}
      <div className="flex items-center justify-center gap-[0.2vw] mb-3" style={{ perspective: '1000px' }}>
        {letters.map((char, i) => (
          <motion.span
            key={i}
            className="font-display font-black text-[6vw] leading-none tracking-tight"
            style={{
              color: char === ' ' ? 'transparent' : 'white',
              display: 'inline-block',
              width: char === ' ' ? '1.5vw' : undefined,
              textShadow: '0 0 40px rgba(79,142,247,0.4)',
            }}
            initial={{ opacity: 0, y: 40, rotateX: -45 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: -45 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: phase >= 2 ? 0.05 * i : 0 }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>

      {/* Tagline */}
      <motion.p
        className="text-[1.8vw] font-sans tracking-[0.25em] uppercase"
        style={{ color: '#4f8ef7' }}
        initial={{ opacity: 0, letterSpacing: '0.6em' }}
        animate={phase >= 3 ? { opacity: 1, letterSpacing: '0.25em' } : { opacity: 0, letterSpacing: '0.6em' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        Study Smart, Not Hard
      </motion.p>

      {/* Divider line */}
      <motion.div
        className="mt-6 h-px bg-gradient-to-r from-transparent via-[#4f8ef7]/60 to-transparent"
        initial={{ width: 0, opacity: 0 }}
        animate={phase >= 3 ? { width: '30vw', opacity: 1 } : { width: 0, opacity: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      />

      {/* Sub-tagline */}
      <motion.p
        className="mt-4 text-[1vw] text-white/30 font-sans tracking-wider"
        initial={{ opacity: 0 }}
        animate={phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        AI-powered exam analysis · Topic ranking · Smart study plans
      </motion.p>
    </motion.div>
  );
}
