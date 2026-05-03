import React, { createContext, useContext, useState } from 'react';
import type { AnalysisResult } from '@workspace/api-client-react';

interface AppState {
  analysisData: AnalysisResult | null;
  setAnalysisData: (data: AnalysisResult | null) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);

  return (
    <AppStateContext.Provider value={{ analysisData, setAnalysisData }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
