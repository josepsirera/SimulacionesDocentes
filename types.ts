
export interface AnalysisReport {
  videoAnalysis: string;
  audioTranscription: string;
}

export interface LiveCallbacks {
  onopen: () => void;
  onmessage: (message: any) => void;
  onerror: (e: ErrorEvent) => void;
  onclose: (e: CloseEvent) => void;
}
