import React, { useState } from "react";
import { useLocation } from "wouter";
import { Student3D } from "@/components/Student3D";
import { ThoughtBubbles } from "@/components/ThoughtBubbles";
import { UploadArea } from "@/components/UploadArea";
import { useAppState } from "@/hooks/use-app-state";
import type { UploadResult } from "@workspace/api-client-react";
import { useAnalyzeTopics } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const DEFAULT_BUBBLES = [
  "What should I study first?",
  "Am I wasting time on wrong topics?",
  "What will come in exam?",
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { setAnalysisData } = useAppState();
  const { toast } = useToast();
  
  const [bubbles, setBubbles] = useState(DEFAULT_BUBBLES);
  const [isThinking, setIsThinking] = useState(false);

  const analyzeMutation = useAnalyzeTopics();

  const handleAnalyze = async (files: File[], planDays: 2 | 5) => {
    setIsThinking(true);
    setBubbles(["Reading files...", "Processing...", "Almost there..."]);
    
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      
      const uploadRes = await fetch(`${import.meta.env.BASE_URL}api/upload`, { 
        method: 'POST', 
        body: formData 
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      
      const uploadData: UploadResult = await uploadRes.json();
      setBubbles(["Analyzing patterns...", "Finding important topics..."]);

      analyzeMutation.mutate({
        data: { sessionId: uploadData.sessionId, planDays }
      }, {
        onSuccess: (data) => {
          setAnalysisData(data);
          setLocation("/results");
        },
        onError: () => {
          toast({
            title: "Analysis Failed",
            description: "Could not analyze the papers. Please try again.",
            variant: "destructive"
          });
          setIsThinking(false);
          setBubbles(DEFAULT_BUBBLES);
        }
      });
      
    } catch {
      toast({
        title: "Upload Failed",
        description: "Could not upload the papers.",
        variant: "destructive"
      });
      setIsThinking(false);
      setBubbles(DEFAULT_BUBBLES);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden relative">

      {/* Fixed Glass Navbar */}
      <header className="fixed top-0 left-0 w-full z-30 glass-navbar px-6 py-3 flex items-center justify-between">
        {/* Left — brand */}
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight glow-text-blue leading-tight">Exam Brain</span>
          <span className="text-[10px] text-muted-foreground leading-tight tracking-wide">Study Smart, Not Hard</span>
        </div>

        {/* Center — AI pulse */}
        <div className="hidden md:flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full bg-primary ai-pulse-dot"
          />
          <span className="text-xs text-muted-foreground">AI Ready</span>
        </div>

        {/* Right — placeholder nav actions (functional on results page) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:block px-3 py-1.5 rounded-lg border border-primary/20 text-primary/60">Upload Papers ↓</span>
        </div>
      </header>

      {/* Hero title */}
      <div className="relative z-10 text-center pt-32 pb-4 px-4">
        <motion.h1
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-extrabold tracking-tight glow-text-white"
          style={{ background: "linear-gradient(135deg, #93c5fd 0%, #c4b5fd 60%, #f9a8d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          Inside Your Exam Mind
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-3 text-sm md:text-base text-muted-foreground max-w-md mx-auto"
        >
          We read your question papers and tell you exactly what to study
        </motion.p>
      </div>

      {/* Main Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative">
        
        {/* 3D Scene */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <Student3D isThinking={isThinking} />
        </div>

        {/* Thought Bubbles */}
        <ThoughtBubbles bubbles={bubbles} />

        {/* Student label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-[220px] left-1/2 -translate-x-1/2 z-20 text-xs text-muted-foreground/60 tracking-widest uppercase"
        >
          Your Study Assistant
        </motion.div>

        {/* Upload area */}
        <div className="absolute bottom-10 left-0 w-full z-20 px-4">
          <UploadArea onAnalyze={handleAnalyze} isAnalyzing={isThinking} />
        </div>
      </main>

      {/* Footer */}
      <div className="relative z-10 text-center py-3">
        <p className="text-xs text-muted-foreground/40 tracking-wide">
          Built for students who want to study smart, not hard
        </p>
      </div>
    </div>
  );
}
