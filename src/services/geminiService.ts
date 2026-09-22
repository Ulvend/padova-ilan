import { GoogleGenAI } from '@google/genai';
import { Language } from '../types';

// Retrieve Gemini API Key from Vite environment
const getApiKey = (): string => {
  const env = (import.meta as any).env || {};
  return (
    env.VITE_GEMINI_API_KEY ||
    env.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') ||
    ''
  );
};

let genAIClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }
  return genAIClient;
}

const LANGUAGE_LABELS: Record<Language, string> = {
  tr: 'Turkish',
  it: 'Italian',
  en: 'English',
  de: 'German',
  ru: 'Russian',
  hi: 'Hindi',
};

/**
 * Translates student messages and listing texts using Google Gemini AI (gemini-3.8-flash).
 * Eliminates third-party rate limits (like MyMemory's 500-word daily IP block).
 * Returns translated text, or null if API key is not configured or request fails.
 */
export async function translateWithGemini(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  const fromLabel = LANGUAGE_LABELS[sourceLang] || sourceLang;
  const toLabel = LANGUAGE_LABELS[targetLang] || targetLang;

  const prompt = `You are an expert real-time translator specializing in university student accommodation, tenancy contracts (Canone Concordato, Subentro), and daily student dialogue in Padova, Italy.

Translate the following text from ${fromLabel} to ${toLabel}.
Rules:
- Provide ONLY the direct, natural translation without introductory remarks, explanations, quotes, or notes.
- Preserve informal student tone, contract terminology, address details, and emojis.
- Keep proper nouns like Padova, Portello, Policlinico, Prato della Valle unchanged.

Text to translate:
"${text}"`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const output = response.text?.trim();
    if (output && output.length > 0) {
      // Strip surrounding quotes if the model wrapped output in quotes
      const clean = output.replace(/^["']|["']$/g, '').trim();
      return clean;
    }
    return null;
  } catch (error) {
    console.warn('Gemini translation error (falling back to local glossary):', error);
    return null;
  }
}

/**
 * Generates an AI compatibility summary between a student and a flatmate/listing using Gemini.
 */
export async function generateCompatibilityInsight(
  studentFaculty: string,
  listingDistrict: string,
  flatmates: string[]
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `In 2 short sentences, provide a friendly Padova student roommate compatibility analysis for a student in ${studentFaculty} moving to ${listingDistrict} living with ${flatmates.join(', ')}. Keep it encouraging and practical in Turkish.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || null;
  } catch (e) {
    return null;
  }
}
