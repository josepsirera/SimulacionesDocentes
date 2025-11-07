
import { GoogleGenAI, LiveSession, Modality } from "@google/genai";
import { LiveCallbacks } from "../types";

// Helper function to initialize GoogleGenAI.
// It's created just-in-time for each API call to ensure it uses the latest API_KEY.
const getGeminiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Analyzes teaching quality based on a YouTube URL concept.
 * Note: Direct client-side YouTube video content processing is not feasible due to CORS and API limitations.
 * This function simulates video analysis by prompting Gemini with a conceptual description.
 * @param youtubeUrl The YouTube video URL for conceptual analysis.
 * @returns A promise that resolves to the generated teaching quality report text.
 */
export const analyzeTeachingVideo = async (youtubeUrl: string): Promise<string> => {
  const ai = getGeminiClient();
  const prompt = `Analiza la calidad de la enseñanza de un profesor basándote en el contenido conceptual de una clase o simulación docente. Se supone que el vídeo proviene de esta URL de YouTube: ${youtubeUrl}.
    Considera los siguientes aspectos y proporciona un informe detallado y constructivo:
    1. Claridad de la Explicación: ¿Es el contenido fácil de entender? ¿Se simplifican los temas complejos de manera efectiva?
    2. Compromiso con la Audiencia: ¿Qué tan bien el profesor mantiene la atención de la audiencia? ¿Se utilizan elementos interactivos o preguntas retóricas?
    3. Confianza y Presencia: ¿El profesor parece seguro y con autoridad? ¿Cómo es su lenguaje corporal y su tono?
    4. Uso de Ayudas Visuales (si aplica según el contexto): ¿Se utilizan los elementos visuales de manera efectiva para mejorar la comprensión?
    5. Estilo General de Presentación: ¿Cuál es el flujo general, el ritmo y la estructura de la lección?
    
    Estructura el informe con un resumen, seguido de puntos detallados para cada aspecto, y concluye con recomendaciones accionables.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using gemini-2.5-pro for complex text tasks
      contents: prompt,
      config: {
        systemInstruction: "Eres un experto revisor educativo que proporciona retroalimentación constructiva sobre la calidad de la enseñanza.",
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing teaching video:", error);
    throw new Error(`Failed to analyze video: ${(error as Error).message}`);
  }
};

/**
 * Establishes a live audio transcription session with the Gemini Live API.
 * @param callbacks An object containing onopen, onmessage, onerror, and onclose callbacks for the session.
 * @returns A promise that resolves to the LiveSession object.
 */
export const connectLiveAudioTranscription = async (callbacks: LiveCallbacks): Promise<LiveSession> => {
  const ai = getGeminiClient();
  try {
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025', // Using the specified model for live audio
      callbacks: callbacks,
      config: {
        responseModalities: [Modality.AUDIO], // Must be an array with a single `Modality.AUDIO` element.
        inputAudioTranscription: {}, // Enable transcription for user input audio.
      },
    });
    return sessionPromise;
  } catch (error) {
    console.error("Error connecting to live audio transcription:", error);
    throw new Error(`Failed to connect to audio transcription service: ${(error as Error).message}`);
  }
};