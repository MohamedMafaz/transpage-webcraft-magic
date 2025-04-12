
import { GEMINI_API_KEY, GEMINI_API_URL } from '@/lib/constants';

// Extract text content from HTML with tag context
export const extractTextFromHtml = (html: string): Array<{text: string, path: string}> => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Remove scripts and styles
  const scripts = tempDiv.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());
  
  // Get text nodes with their paths
  const textNodes: Array<{text: string, path: string}> = [];
  
  // Function to recursively process DOM nodes and capture text
  const processNode = (node: Node, path: string = '') => {
    // Process element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      const newPath = path ? `${path} > ${tagName}` : tagName;
      
      // Skip hidden elements
      if (window.getComputedStyle(element).display === 'none' || 
          window.getComputedStyle(element).visibility === 'hidden') {
        return;
      }
      
      // Process child nodes
      Array.from(node.childNodes).forEach(child => {
        processNode(child, newPath);
      });
    } 
    // Process text nodes
    else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text && text.length > 1 && !/^\d+$/.test(text) && !/^[\s\n\r\t]+$/.test(text)) {
        const parentElement = node.parentElement;
        if (parentElement && !parentElement.closest('script, style')) {
          textNodes.push({
            text,
            path: path
          });
        }
      }
    }
  };
  
  // Start processing from the root
  processNode(tempDiv);
  
  return textNodes;
};

// Create a unique identifier for each text node for replacement
export const prepareHtmlForTranslation = (html: string): {
  preparedHtml: string,
  textMap: Map<string, {text: string, path: string}>
} => {
  const textNodes = extractTextFromHtml(html);
  const textMap = new Map<string, {text: string, path: string}>();
  let preparedHtml = html;
  
  // Create placeholders for each text node
  textNodes.forEach((node, index) => {
    const placeholder = `__TRANSLATE_PLACEHOLDER_${index}__`;
    textMap.set(placeholder, node);
    
    // Escape special characters for regex replacement
    const escapedText = node.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(>\\s*|\\s+)(${escapedText})(\\s*<|\\s+)`, 'g');
    preparedHtml = preparedHtml.replace(regex, `$1${placeholder}$3`);
  });
  
  return { preparedHtml, textMap };
};

// Translate text using Google Gemini API
export const translateText = async (
  text: string,
  targetLanguage: string,
  modelId: string = 'gemini-2.0-flash'
): Promise<string> => {
  try {
    // Create a clear and explicit translation prompt
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

// Group texts for efficient translation
export const groupTextsForTranslation = (
  textMap: Map<string, {text: string, path: string}>
): Array<{
  chunk: string,
  placeholders: string[]
}> => {
  const chunks: Array<{
    chunk: string,
    placeholders: string[]
  }> = [];
  
  let currentChunk = '';
  let currentPlaceholders: string[] = [];
  
  // Iterate through all texts and group them into chunks
  for (const [placeholder, node] of textMap.entries()) {
    // If adding this text would exceed our chunk size, add current chunk to results
    if (currentChunk.length + node.text.length > 450) { // Smaller size to ensure we stay under limits
      if (currentChunk.length > 0) {
        chunks.push({
          chunk: currentChunk,
          placeholders: [...currentPlaceholders]
        });
      }
      currentChunk = node.text;
      currentPlaceholders = [placeholder];
    } else {
      // Add to current chunk with a delimiter
      if (currentChunk.length > 0) {
        currentChunk += '\n---\n';
      }
      currentChunk += node.text;
      currentPlaceholders.push(placeholder);
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push({
      chunk: currentChunk,
      placeholders: [...currentPlaceholders]
    });
  }
  
  return chunks;
};

// Replace placeholders with translated text
export const replacePlaceholdersWithTranslations = (
  html: string,
  textMap: Map<string, {text: string, path: string}>,
  translatedTexts: Map<string, string>
): string => {
  let result = html;
  
  // Replace each placeholder with its translation
  for (const [placeholder, translation] of translatedTexts.entries()) {
    const regex = new RegExp(placeholder, 'g');
    result = result.replace(regex, translation);
  }
  
  return result;
};

// Main function to handle the entire translation process
export const translateHtmlContent = async (
  html: string,
  targetLanguage: string,
  modelId: string = 'gemini-2.0-flash',
  onProgress?: (progress: number, stage: string) => void
): Promise<string> => {
  try {
    // Step 1: Prepare HTML and extract text
    onProgress?.(10, 'Analyzing page content');
    const { preparedHtml, textMap } = prepareHtmlForTranslation(html);
    
    // If no text found, return original HTML
    if (textMap.size === 0) {
      return html;
    }
    
    // Step 2: Group texts for efficient translation
    const textChunks = groupTextsForTranslation(textMap);
    
    // Step 3: Translate each chunk
    const translatedTexts = new Map<string, string>();
    let completedChunks = 0;
    
    for (const chunk of textChunks) {
      onProgress?.(
        10 + Math.floor((completedChunks / textChunks.length) * 80),
        `Translating content (${completedChunks + 1}/${textChunks.length})`
      );
      
      // Translate the chunk
      const translatedChunk = await translateText(chunk.chunk, targetLanguage, modelId);
      
      // If the chunk contained multiple texts (separated by \n---\n)
      if (chunk.placeholders.length > 1) {
        const translatedParts = translatedChunk.split('\n---\n');
        
        // Map each translated part to its placeholder
        // If parts don't match (which can happen), use what we have
        chunk.placeholders.forEach((placeholder, index) => {
          if (index < translatedParts.length) {
            translatedTexts.set(placeholder, translatedParts[index]);
          } else {
            // Use original text if translation is missing
            translatedTexts.set(placeholder, textMap.get(placeholder)?.text || '');
          }
        });
      } else if (chunk.placeholders.length === 1) {
        // Single text in this chunk
        translatedTexts.set(chunk.placeholders[0], translatedChunk);
      }
      
      completedChunks++;
    }
    
    // Step 4: Replace placeholders with translations
    onProgress?.(90, 'Finalizing translation');
    const translatedHtml = replacePlaceholdersWithTranslations(preparedHtml, textMap, translatedTexts);
    
    onProgress?.(100, 'Translation complete');
    return translatedHtml;
  } catch (error) {
    console.error('HTML translation error:', error);
    throw new Error(error instanceof Error ? error.message : 'Translation failed');
  }
};

// Legacy functions for backward compatibility
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
