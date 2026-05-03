import React, { useState } from "react";
import { useLocation } from "wouter";
import { Student3D } from "@/components/Student3D";
import { ThoughtBubbles } from "@/components/ThoughtBubbles";
import { UploadArea } from "@/components/UploadArea";
import { useAppState } from "@/hooks/use-app-state";
import type { UploadResult } from "@workspace/api-client-react";
import { useAnalyzeTopics } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

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
      // 1. Upload files
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      
      const uploadRes = await fetch(`${import.meta.env.BASE_URL}api/upload`, { 
        method: 'POST', 
        body: formData 
      });
      
      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadData: UploadResult = await uploadRes.json();
      
      setBubbles(["Analyzing patterns...", "Finding important topics..."]);

      // 2. Analyze topics
      analyzeMutation.mutate({
        data: {
          sessionId: uploadData.sessionId,
          planDays: planDays
        }
      }, {
        onSuccess: (data) => {
          setAnalysisData(data);
          setLocation("/results");
        },
        onError: (err) => {
          toast({
            title: "Analysis Failed",
            description: "Could not analyze the papers. Please try again.",
            variant: "destructive"
          });
          setIsThinking(false);
          setBubbles(DEFAULT_BUBBLES);
        }
      });
      
    } catch (err) {
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
    <div className="min-h-screen w-full flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center glow-blue text-white font-bold">
            EB
          </div>
          <span className="text-xl font-bold tracking-tight glow-text-blue">Exam Brain</span>
        </div>
      </header>

      {/* Main Stage */}
      <main className="flex-1 flex flex-col items-center justify-center relative pt-20 pb-10">
        
        {/* 3D Scene */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
           <Student3D isThinking={isThinking} />
        </div>

        {/* Thought Bubbles Overlay */}
        <ThoughtBubbles bubbles={bubbles} />

        {/* Bottom Upload Area */}
        <div className="absolute bottom-10 left-0 w-full z-20 px-4">
          <UploadArea onAnalyze={handleAnalyze} isAnalyzing={isThinking} />
        </div>
      </main>
    </div>
  );
}
