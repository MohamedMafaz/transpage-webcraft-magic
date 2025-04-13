
export const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Define available languages for translation
export const LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' }
];

// Define available translation models
export const TRANSLATION_MODELS = [
  { id: 'gemini-pro', name: 'Gemini Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
];

export const DEFAULT_MODEL = 'gemini-pro';
