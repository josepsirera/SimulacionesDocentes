

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface YoutubeInputProps {
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  error: string | null;
}

const YoutubeInput: React.FC<YoutubeInputProps> = ({ youtubeUrl, setYoutubeUrl, onAnalyze, isLoading, error }) => {
  const isValidUrl = (url: string) => {
    // Basic regex for YouTube URLs, not exhaustive but covers common formats
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const handleAnalyzeClick = () => {
    if (isValidUrl(youtubeUrl)) {
      onAnalyze();
    } else {
      alert('Por favor, introduce una URL válida de YouTube.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Análisis de Calidad Docente de Vídeo</h2>
      <p className="text-gray-600 mb-4">
        Introduce la URL de un vídeo de YouTube que contenga una simulación docente o una clase.
        La aplicación analizará conceptualmente la calidad de la enseñanza y generará un informe de retroalimentación.
        <br/>
        <em className="text-sm text-gray-500">
          (Nota: Debido a la seguridad del navegador y las limitaciones de la API de YouTube, el procesamiento directo del contenido del vídeo para el análisis no es posible en el lado del cliente. El análisis se basa en una solicitud conceptual derivada de la URL.)
        </em>
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="url"
          placeholder="Ej: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          disabled={isLoading}
        />
        <button
          onClick={handleAnalyzeClick}
          className={`px-6 py-3 rounded-md font-medium transition duration-200 ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Analizando...' : 'Analizar Vídeo'}
        </button>
      </div>
      {isLoading && <LoadingSpinner />}
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
};

export default YoutubeInput;