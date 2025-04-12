
import { OPENROUTER_API_KEY, OPENROUTER_API_URL } from '@/lib/constants';

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
  
  // Group text into chunks of ~1000 characters
  const chunks: string[] = [];
  let currentChunk = '';
  
  textNodes.forEach(text => {
    if (currentChunk.length + text.length > 1000) {
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

// Translate text using OpenRouter API
export const translateText = async (
  text: string,
  targetLanguage: string,
  modelId: string = 'gpt-3.5-turbo'
): Promise<string> => {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'WordPress Translation App'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text into ${targetLanguage}. 
                      Preserve the tone, style and formatting of the original text. 
                      Only respond with the translated text, without any explanations, notes, or additional content.`
          },
          {
            role: 'user',
            content: text
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Translation API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
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
