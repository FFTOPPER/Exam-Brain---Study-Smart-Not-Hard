import React from 'react';
import { motion } from 'framer-motion';

interface ThoughtBubblesProps {
  bubbles: string[];
  positions?: { x: string; y: string }[];
}

export function ThoughtBubbles({ bubbles, positions }: ThoughtBubblesProps) {
  const defaultPositions = [
    { x: '10%', y: '20%' },
    { x: '60%', y: '10%' },
    { x: '75%', y: '35%' },
    { x: '15%', y: '50%' },
  ];

  const pos = positions || defaultPositions;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {bubbles.map((text, i) => (
        <motion.div
          key={text + i}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 100, 
            damping: 10,
            delay: i * 0.2 
          }}
          className="absolute"
          style={{ 
            left: pos[i % pos.length].x, 
            top: pos[i % pos.length].y 
          }}
        >
          <div 
            className="bg-white text-black font-semibold px-4 py-2 rounded-2xl shadow-lg bubble-tail relative animate-in fade-in zoom-in duration-500"
            style={{
              animation: `float ${2 + i * 0.5}s ease-in-out infinite alternate`
            }}
          >
            {text}
          </div>
        </motion.div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-10px); }
        }
      `}} />
    </div>
  );
}
