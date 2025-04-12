
import { GEMINI_API_KEY, GEMINI_API_URL } from '@/lib/constants';

// Extract text content from HTML
export const extractTextFromHtml = (html: string): string[] => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove scripts and styles
  const scripts = tempDiv.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());
  
  // Get text nodes
  const textNodes: string[] = [];
  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent?.trim();
    // Skip empty text or very short pieces
    if (text && text.length > 2 && !/^\d+$/.test(text)) {
      // Store the path to the node
      const parentElement = node.parentElement;
      if (parentElement && !parentElement.closest('script, style')) {
        textNodes.push(text);
      }
    }
  }
  
  // Group text into chunks of ~500 characters (Gemini has smaller token limits)
  const chunks: string[] = [];
  let currentChunk = '';
  
  textNodes.forEach(text => {
    if (currentChunk.length + text.length > 500) {
      chunks.push(currentChunk);
      currentChunk = text;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + text;
    }
  });
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

// Translate text using Google Gemini API
export const translateText = async (
  text: string,
  targetLanguage: string,
  modelId: string = 'gemini-2.0-flash'
): Promise<string> => {
  try {
    // Ensure the API understands the language code
    const prompt = `Translate the following text into ${targetLanguage} language. Preserve the tone, style and formatting of the original text. Only return the translated text without any explanations or additional content:\n\n${text}`;
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Translation API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract the translated text from Gemini response
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response format from translation API');
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Translation failed');
  }
};

// Replace text in HTML
export const replaceTextInHtml = (html: string, originalTexts: string[], translatedTexts: string[]): string => {
  let result = html;
  
  // Create a mapping for faster lookup
  const translations = new Map<string, string>();
  originalTexts.forEach((text, i) => {
    if (translatedTexts[i]) {
      translations.set(text, translatedTexts[i]);
    }
  });
  
  // Sort texts by length (descending) to replace longer texts first
  const sortedOriginalTexts = [...originalTexts].sort((a, b) => b.length - a.length);
  
  // Replace each text
  for (const text of sortedOriginalTexts) {
    const translation = translations.get(text);
    if (translation) {
      // Escape special regex characters in the text
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(>\\s*|\\s+)${escapedText}(\\s*<|\\s+)`, 'g');
      result = result.replace(regex, `$1${translation}$2`);
    }
  }
  
  return result;
};
