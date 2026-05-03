import React from 'react';
import { motion } from 'framer-motion';

interface ThoughtBubblesProps {
  bubbles: string[];
  positions?: { x: string; y: string }[];
}

const KEYWORD_MAP: Record<string, string[]> = {
  "What should I study first?": ["study first"],
  "Am I wasting time on wrong topics?": ["wasting time"],
  "What will come in exam?": ["come in exam"],
  "Study THIS first": ["THIS first"],
  "Reading files...": ["files"],
  "Processing...": ["Processing"],
  "Almost there...": ["Almost"],
  "Analyzing patterns...": ["patterns"],
  "Finding important topics...": ["important topics"],
};

function boldKeywords(text: string): React.ReactNode {
  const keywords = KEYWORD_MAP[text] ?? [];
  if (keywords.length === 0) return text;
  
  let result: React.ReactNode = text;
  for (const kw of keywords) {
    const parts = (typeof result === 'string' ? result : text).split(kw);
    if (parts.length > 1) {
      result = (
        <>
          {parts[0]}
          <strong className="font-extrabold text-blue-700">{kw}</strong>
          {parts.slice(1).join(kw)}
        </>
      );
    }
  }
  return result;
}

export function ThoughtBubbles({ bubbles, positions }: ThoughtBubblesProps) {
  const defaultPositions = [
    { x: '8%',  y: '22%' },
    { x: '58%', y: '10%' },
    { x: '70%', y: '40%' },
    { x: '10%', y: '55%' },
  ];

  const pos = positions || defaultPositions;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {bubbles.map((text, i) => (
        <motion.div
          key={text + i}
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 120, 
            damping: 14,
            delay: i * 0.25
          }}
          className="absolute"
          style={{ 
            left: pos[i % pos.length].x, 
            top: pos[i % pos.length].y,
          }}
        >
          <div 
            className="relative bg-white text-gray-800 text-sm px-4 py-2.5 rounded-2xl shadow-xl bubble-tail max-w-[200px]"
            style={{
              animation: `float ${2.2 + i * 0.6}s ease-in-out infinite alternate`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(79,142,247,0.12)',
            }}
          >
            {boldKeywords(text)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
