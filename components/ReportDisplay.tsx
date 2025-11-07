

import React from 'react';

interface ReportDisplayProps {
  report: string | null;
  audioTranscription: string;
  onEmailReport: (reportContent: string) => void;
  isLoading: boolean;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, audioTranscription, onEmailReport, isLoading }) => {
  const fullReportContent = `--- Informe de Análisis de Vídeo ---\n\n${report}\n\n--- Transcripción de Audio en Vivo ---\n\n${audioTranscription}`;

  if (!report && !audioTranscription && !isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500 italic">
        Los informes de análisis aparecerán aquí.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Informe de Calidad Docente</h2>
      
      {isLoading && report === null && audioTranscription === "" && (
        <p className="text-gray-500 text-center">Generando informe...</p>
      )}

      {(report || audioTranscription) ? (
        <div className="prose max-w-none mb-6">
          {report && (
            <>
              <h3 className="text-lg font-medium mb-2 text-gray-700">Análisis de Vídeo</h3>
              <div
                className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-auto max-h-96"
                dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br/>') }}
              ></div>
            </>
          )}
          {audioTranscription && (
            <>
              <h3 className="text-lg font-medium mt-6 mb-2 text-gray-700">Transcripción de Audio Grabado</h3>
              <p className="bg-gray-50 p-4 rounded-md border border-gray-200 italic overflow-auto max-h-48 text-gray-700">
                {audioTranscription || "No se transcribió ningún audio."}
              </p>
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center">Todavía no se ha generado ningún informe. Analiza un vídeo o graba audio.</p>
      )}

      <div className="sticky bottom-4 w-full bg-white bg-opacity-90 py-3 flex justify-end">
        <button
          onClick={() => onEmailReport(fullReportContent)}
          className={`px-6 py-3 rounded-md font-medium text-white transition duration-200 ${
            (!report && !audioTranscription) ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-md'
          }`}
          disabled={!report && !audioTranscription}
        >
          Enviar Informe por Correo
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;