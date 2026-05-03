import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileType, CheckCircle2, Loader2 } from 'lucide-react';

interface UploadAreaProps {
  onAnalyze: (files: File[], planDays: 2 | 5) => void;
  isAnalyzing: boolean;
}

export function UploadArea({ onAnalyze, isAnalyzing }: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [planDays, setPlanDays] = useState<2 | 5>(2);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${dragActive ? 'border-primary bg-primary/10 glow-blue' : 'border-muted-foreground/30 bg-card'}
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />
        
        {files.length === 0 ? (
          <div className="space-y-2 pointer-events-none">
            <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop your past papers here</p>
            <p className="text-xs text-muted-foreground">Supports PDF and Images</p>
          </div>
        ) : (
          <div className="space-y-4">
            <CheckCircle2 className="w-10 h-10 mx-auto text-green-500" />
            <p className="text-sm font-medium">{files.length} files ready</p>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center text-xs bg-muted px-2 py-1 rounded-md">
                  <FileType className="w-3 h-3 mr-1" />
                  <span className="truncate max-w-[100px]">{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-center bg-muted/50 p-1 rounded-lg">
            <button 
              onClick={() => setPlanDays(2)}
              className={`flex-1 text-sm py-1.5 rounded-md transition-all ${planDays === 2 ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              2-Day Plan
            </button>
            <button 
              onClick={() => setPlanDays(5)}
              className={`flex-1 text-sm py-1.5 rounded-md transition-all ${planDays === 5 ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              5-Day Plan
            </button>
          </div>
          
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-blue h-12"
            onClick={() => onAnalyze(files, planDays)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Reading your mind...
              </>
            ) : (
              'Analyze My Papers →'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
