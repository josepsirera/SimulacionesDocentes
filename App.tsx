

import React, { useState, useCallback } from 'react';
import YoutubeInput from './components/YoutubeInput';
import ReportDisplay from './components/ReportDisplay';
import MicrophoneTranscription from './components/MicrophoneTranscription';
import ErrorMessage from './components/ErrorMessage';
import { analyzeTeachingVideo } from './services/geminiService';

const App: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [videoAnalysisReport, setVideoAnalysisReport] = useState<string | null>(null);
  const [microphoneTranscription, setMicrophoneTranscription] = useState<string>('');
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState<boolean>(false);
  const [videoAnalysisError, setVideoAnalysisError] = useState<string | null>(null);

  const handleAnalyzeVideo = useCallback(async () => {
    if (!youtubeUrl) {
      setVideoAnalysisError('Por favor, introduce una URL de YouTube.');
      return;
    }
    setVideoAnalysisError(null);
    setIsAnalyzingVideo(true);
    setVideoAnalysisReport(null); // Clear previous report

    try {
      const report = await analyzeTeachingVideo(youtubeUrl);
      setVideoAnalysisReport(report);
    } catch (error) {
      console.error('Failed to analyze video:', error);
      setVideoAnalysisError(`Error al generar el análisis del vídeo: ${(error as Error).message}`);
    } finally {
      setIsAnalyzingVideo(false);
    }
  }, [youtubeUrl]);

  const handleTranscriptionUpdate = useCallback((transcription: string) => {
    setMicrophoneTranscription(transcription);
  }, []);

  const handleEmailReport = useCallback((fullReportContent: string) => {
    const subject = encodeURIComponent("Informe de Calidad Docente del Analizador de Calidad Docente");
    const body = encodeURIComponent(fullReportContent);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl text-center py-6 mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow-lg">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Analizador de Calidad Docente
        </h1>
        <p className="mt-2 text-lg opacity-90">
          Obtén retroalimentación perspicaz sobre la eficacia de la enseñanza
        </p>
      </header>

      <main className="w-full max-w-4xl space-y-6">
        <YoutubeInput
          youtubeUrl={youtubeUrl}
          setYoutubeUrl={setYoutubeUrl}
          onAnalyze={handleAnalyzeVideo}
          isLoading={isAnalyzingVideo}
          error={videoAnalysisError}
        />

        <MicrophoneTranscription
          onTranscriptionUpdate={handleTranscriptionUpdate}
          initialText={microphoneTranscription}
        />

        <ReportDisplay
          report={videoAnalysisReport}
          audioTranscription={microphoneTranscription}
          onEmailReport={handleEmailReport}
          isLoading={isAnalyzingVideo}
        />
      </main>

      <footer className="w-full max-w-4xl text-center text-gray-500 text-sm mt-8 py-4 border-t border-gray-200">
        Desarrollado con la API de Google Gemini
      </footer>
    </div>
  );
};

export default App;