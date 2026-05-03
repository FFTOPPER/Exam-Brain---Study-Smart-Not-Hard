import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const SEGMENTS = [
  { label: 'Short Answer', pct: 32, color: '#4f8ef7', start: 0 },
  { label: 'Essay / Long', pct: 28, color: '#8b5cf6', start: 32 },
  { label: 'MCQ', pct: 25, color: '#f97316', start: 60 },
  { label: 'Numerical', pct: 15, color: '#22d3ee', start: 85 },
];

const R = 38;
const CIRC = 2 * Math.PI * R;
const CX = 55;
const CY = 55;

function ArcSegment({ pct, color, startPct, delay }: { pct: number; color: string; startPct: number; delay: number }) {
  const offset = CIRC - (pct / 100) * CIRC;
  const rotation = (startPct / 100) * 360 - 90;
  return (
    <motion.circle
      cx={CX} cy={CY} r={R}
      fill="none"
      stroke={color}
      strokeWidth="14"
      strokeLinecap="butt"
      strokeDasharray={CIRC}
      initial={{ strokeDashoffset: CIRC }}
      animate={{ strokeDashoffset: offset }}
      transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${rotation}deg)` }}
    />
  );
}

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 40, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className="text-[3.5vw] font-display font-bold mb-10 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
      >
        Know What's Coming
      </motion.h2>

      <div className="flex items-center gap-[5vw]">
        {/* Donut chart */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.2 }}
        >
          <svg width="20vw" height="20vw" viewBox="0 0 110 110">
            {/* track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
            {phase >= 2 && SEGMENTS.map((s, i) => (
              <ArcSegment key={i} pct={s.pct} color={s.color} startPct={s.start} delay={0.3 + i * 0.18} />
            ))}
            {/* center label */}
            <text x={CX} y={CY - 5} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Inter, sans-serif">QUESTION</text>
            <text x={CX} y={CY + 6} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Inter, sans-serif">TYPES</text>
          </svg>
        </motion.div>

        {/* Legend */}
        <div className="flex flex-col gap-4">
          {SEGMENTS.map((s, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 30 }}
              animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ delay: 0.5 + i * 0.15, type: 'spring', damping: 20 }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }} />
              <span className="text-[1.4vw] font-sans text-white/80 w-[14vw]">{s.label}</span>
              <motion.span
                className="text-[1.4vw] font-bold"
                style={{ color: s.color }}
                initial={{ opacity: 0 }}
                animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.8 + i * 0.15 }}
              >
                {s.pct}%
              </motion.span>
            </motion.div>
          ))}
          <motion.p
            className="text-[0.9vw] text-white/35 mt-2"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.5 }}
          >
            Detected from past paper patterns
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
