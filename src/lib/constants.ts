
// Available translation languages
export const LANGUAGES = [
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" },
  { code: "tr", name: "Turkish" },
  { code: "hi", name: "Hindi" }
];

// Google Gemini API key and endpoint
export const GEMINI_API_KEY = "AIzaSyDRBXKTbljwOicXxt6TQyfGURrciqZ8Jy8";
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Translation models
export const TRANSLATION_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini Flash" }
];

// Default model to use for translation
export const DEFAULT_MODEL = "gemini-2.0-flash";
