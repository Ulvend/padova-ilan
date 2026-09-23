import { supabase } from '../lib/supabase';
import { Language } from '../types';

// Gemini, bir Supabase Edge Function (gemini-proxy) üzerinden çağrılır: API anahtarı
// tarayıcıya hiç gönderilmez, yalnızca Edge Function ortam değişkeni olarak saklanır.
let disabled = false;

async function callProxy(body: Record<string, unknown>): Promise<string | null> {
  if (disabled) return null;
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', { body });
    if (error) {
      console.warn('Gemini proxy isteği başarısız (yerel sözlüğe düşülüyor):', error);
      if (/not found|404/i.test(error.message || '')) disabled = true;
      return null;
    }
    const text = (data as { text?: string } | null)?.text?.trim();
    return text || null;
  } catch (error) {
    console.warn('Gemini proxy isteği başarısız (yerel sözlüğe düşülüyor):', error);
    return null;
  }
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
 * Translates student messages and listing texts using Gemini.
 * Returns translated text, or null if the proxy is not available or the request fails.
 */
export async function translateWithGemini(
  text: string,
  sourceLang: Language,
  targetLang: Language
): Promise<string | null> {
  const output = await callProxy({
    action: 'translate',
    text,
    sourceLang: LANGUAGE_LABELS[sourceLang] || sourceLang,
    targetLang: LANGUAGE_LABELS[targetLang] || targetLang,
  });
  // Strip surrounding quotes if the model wrapped output in quotes
  return output ? output.replace(/^["']|["']$/g, '').trim() : null;
}

/**
 * Generates an AI compatibility summary between a student and a flatmate/listing using Gemini.
 */
export async function generateCompatibilityInsight(
  studentFaculty: string,
  listingDistrict: string,
  flatmates: string[]
): Promise<string | null> {
  return callProxy({
    action: 'compatibility',
    studentFaculty,
    listingDistrict,
    flatmates,
  });
}
