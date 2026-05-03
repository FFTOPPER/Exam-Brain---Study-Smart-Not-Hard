import { motion } from "framer-motion";

interface Student3DProps {
  isThinking?: boolean;
}

export function Student3D({ isThinking = false }: Student3DProps) {
  const speed = isThinking ? 0.6 : 1.4;
  const glowColor = isThinking ? "#8b5cf6" : "#4f8ef7";

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Ambient glow rings */}
      <motion.div
        className="absolute rounded-full border border-blue-500/10"
        style={{ width: 340, height: 340, boxShadow: `0 0 60px 20px ${glowColor}18` }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: speed * 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full border border-purple-500/10"
        style={{ width: 260, height: 260 }}
        animate={{ scale: [1.04, 1, 1.04], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: speed * 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background: i % 2 === 0 ? "#4f8ef7" : "#8b5cf6",
            left: `${20 + (i * 37 + 11) % 60}%`,
            top: `${15 + (i * 43 + 7) % 55}%`,
            boxShadow: `0 0 8px 2px ${i % 2 === 0 ? "#4f8ef788" : "#8b5cf688"}`,
          }}
          animate={{
            y: [0, -18 - i * 3, 0],
            opacity: [0.3, 0.9, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: speed * (1.5 + i * 0.3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.25,
          }}
        />
      ))}

      {/* SVG Student Character */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: speed * 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "relative", zIndex: 10 }}
      >
        <svg
          width="200"
          height="240"
          viewBox="0 0 200 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="headGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={isThinking ? "#c4b5fd" : "#93c5fd"} />
              <stop offset="60%" stopColor={isThinking ? "#8b5cf6" : "#4f8ef7"} />
              <stop offset="100%" stopColor={isThinking ? "#5b21b6" : "#1d4ed8"} />
            </radialGradient>
            <radialGradient id="bodyGrad" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1e2a4a" />
              <stop offset="100%" stopColor="#0d1226" />
            </radialGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Floor shadow */}
          <ellipse cx="100" cy="228" rx="55" ry="8" fill={glowColor} opacity="0.15" />

          {/* Legs (crossed, sitting) */}
          <path
            d="M65 170 Q55 185 45 195 Q60 200 80 195 Q90 185 85 170 Z"
            fill="#0d1226" stroke="#1e3a5f" strokeWidth="1"
          />
          <path
            d="M135 170 Q145 185 155 195 Q140 200 120 195 Q110 185 115 170 Z"
            fill="#0d1226" stroke="#1e3a5f" strokeWidth="1"
          />
          {/* Feet */}
          <ellipse cx="62" cy="196" rx="18" ry="8" fill="#0a0f1e" stroke="#1e3a5f" strokeWidth="1" />
          <ellipse cx="138" cy="196" rx="18" ry="8" fill="#0a0f1e" stroke="#1e3a5f" strokeWidth="1" />

          {/* Body */}
          <rect x="68" y="115" width="64" height="60" rx="12" fill="url(#bodyGrad)" stroke="#1e3a5f" strokeWidth="1.5" />

          {/* Shirt detail — glowing stripe */}
          <rect x="68" y="115" width="64" height="6" rx="4" fill={glowColor} opacity="0.4" />

          {/* Arms */}
          {/* Left arm resting on knee */}
          <path
            d="M70 130 Q52 145 50 168 Q58 170 65 168 Q68 148 75 135 Z"
            fill="#0d1226" stroke="#1e3a5f" strokeWidth="1"
          />
          {/* Right arm with hand on chin (thinking) */}
          <path
            d="M130 130 Q148 145 150 160 Q142 162 138 160 Q135 148 125 135 Z"
            fill="#0d1226" stroke="#1e3a5f" strokeWidth="1"
          />
          {/* Hand on chin */}
          <ellipse cx="143" cy="104" rx="9" ry="7" fill="#0d1226" stroke="#1e3a5f" strokeWidth="1" />

          {/* Neck */}
          <rect x="93" y="108" width="14" height="12" rx="4" fill="#0d1226" />

          {/* Head */}
          <motion.g
            animate={{ rotate: isThinking ? [-3, 3, -3] : [-1, 1, -1] }}
            transition={{ duration: speed, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "100px 80px" }}
          >
            <circle cx="100" cy="80" r="34" fill="url(#headGlow)" filter="url(#glow)" />
            {/* Face highlight */}
            <ellipse cx="90" cy="68" rx="8" ry="6" fill="white" opacity="0.12" />

            {/* Eyes */}
            <motion.g
              animate={{ scaleY: isThinking ? [1, 0.1, 1] : [1, 0.15, 1] }}
              transition={{
                duration: isThinking ? 0.5 : 3,
                repeat: Infinity,
                repeatDelay: isThinking ? 1 : 4,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "100px 76px" }}
            >
              <ellipse cx="88" cy="76" rx="5" ry="5.5" fill="#0a0f1e" />
              <ellipse cx="112" cy="76" rx="5" ry="5.5" fill="#0a0f1e" />
              {/* Eye shine */}
              <circle cx="90" cy="74" r="1.5" fill="white" />
              <circle cx="114" cy="74" r="1.5" fill="white" />
            </motion.g>

            {/* Thinking brow furrow */}
            {isThinking && (
              <>
                <path d="M83 69 Q88 66 93 69" stroke="#0a0f1e" strokeWidth="2" strokeLinecap="round" />
                <path d="M107 69 Q112 66 117 69" stroke="#0a0f1e" strokeWidth="2" strokeLinecap="round" />
              </>
            )}

            {/* Mouth */}
            {isThinking ? (
              <path d="M91 90 Q100 87 109 90" stroke="#0a0f1e" strokeWidth="2" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M91 90 Q100 95 109 90" stroke="#0a0f1e" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}

            {/* Hair */}
            <path
              d="M66 72 Q68 46 100 44 Q132 44 134 72 Q120 56 100 58 Q80 56 66 72 Z"
              fill="#0a0f1e"
            />
            {/* Hair highlight */}
            <path d="M85 50 Q100 46 115 50" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>

          {/* Floating books */}
          <motion.g
            animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            style={{ transformOrigin: "35px 185px" }}
          >
            <rect x="18" y="178" width="34" height="22" rx="3" fill="#1e2a4a" stroke="#4f8ef744" strokeWidth="1" />
            <rect x="18" y="178" width="4" height="22" rx="2" fill="#4f8ef7" opacity="0.6" />
            <line x1="26" y1="183" x2="48" y2="183" stroke="#4f8ef733" strokeWidth="1.5" />
            <line x1="26" y1="187" x2="44" y2="187" stroke="#4f8ef733" strokeWidth="1.5" />
            <line x1="26" y1="191" x2="46" y2="191" stroke="#4f8ef733" strokeWidth="1.5" />
          </motion.g>

          <motion.g
            animate={{ y: [0, -5, 0], rotate: [2, -2, 2] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
            style={{ transformOrigin: "162px 175px" }}
          >
            <rect x="145" y="168" width="34" height="22" rx="3" fill="#1e1a3a" stroke="#8b5cf644" strokeWidth="1" />
            <rect x="145" y="168" width="4" height="22" rx="2" fill="#8b5cf6" opacity="0.6" />
            <line x1="153" y1="173" x2="175" y2="173" stroke="#8b5cf633" strokeWidth="1.5" />
            <line x1="153" y1="177" x2="171" y2="177" stroke="#8b5cf633" strokeWidth="1.5" />
            <line x1="153" y1="181" x2="173" y2="181" stroke="#8b5cf633" strokeWidth="1.5" />
          </motion.g>

          {/* Thinking dots when isThinking */}
          {isThinking && (
            <g filter="url(#strongGlow)">
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={i}
                  cx={112 + i * 10}
                  cy={60}
                  r={3}
                  fill={glowColor}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </g>
          )}
        </svg>
      </motion.div>

      {/* Ground glow */}
      <motion.div
        className="absolute bottom-[60px] rounded-full"
        style={{
          width: 130,
          height: 20,
          background: `radial-gradient(ellipse, ${glowColor}44 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], scaleX: [1, 1.1, 1] }}
        transition={{ duration: speed * 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
