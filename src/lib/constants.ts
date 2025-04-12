
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

// OpenRouter API key and endpoint
export const OPENROUTER_API_KEY = "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";
export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Translation models
export const TRANSLATION_MODELS = [
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "mistral-7b-instruct", name: "Mistral 7B" },
  { id: "llama-3-8b-instruct", name: "Llama 3 8B" }
];

// Default model to use for translation
export const DEFAULT_MODEL = "gpt-3.5-turbo";
