import { GoogleGenAI } from "@google/genai";

// FIX: Safely initialize the GoogleGenAI client only when an API key is available.
// This prevents potential runtime errors from instantiating the client with an undefined key.
const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

export const generateSentenceSuggestion = async (context: string): Promise<string> => {
  // FIX: Check for the initialized 'ai' instance instead of the raw API key.
  if (!ai) {
    return "AI suggestion is disabled. Please configure your API key.";
  }
  
  try {
    const prompt = `You are a creative writer contributing to a collaborative, branching story. 
The story so far is: "${context}"
Write a single, compelling, and creative next sentence to continue the story. The sentence must be in Turkish and should not exceed 150 characters. Do not add any extra text or quotes around the sentence.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text.trim().replace(/^"|"$/g, ''); // Remove surrounding quotes if any
    return text || "AI could not generate a suggestion.";

  } catch (error) {
    console.error("Error generating sentence suggestion:", error);
    return "An error occurred while generating an AI suggestion.";
  }
};

export const generateBranchSummary = async (storyText: string): Promise<string> => {
    // FIX: Check for the initialized 'ai' instance instead of the raw API key.
    if (!ai) {
        return "AI summary is disabled. Please configure your API key.";
    }

    try {
        const prompt = `You are a master storyteller tasked with summarizing a story branch for a reader.
The story text is: "${storyText}"

Please provide a concise and engaging summary of this story branch in Turkish. The summary should be a single paragraph and capture the main atmosphere and key events. Do not add any extra text, titles, or quotation marks.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text.trim();
        return text || "AI could not generate a summary.";

    } catch (error) {
        console.error("Error generating branch summary:", error);
        return "An error occurred while generating an AI summary.";
    }
};

export const generateBranchTitle = async (sentenceText: string): Promise<string> => {
    // FIX: Check for the initialized 'ai' instance instead of the raw API key.
    if (!ai) {
        return `“${sentenceText.substring(0, 30)}...” ile başlayan yol`;
    }

    try {
        const prompt = `You are an expert storyteller naming chapters of a book.
Based on the following sentence, create a short, mystical, and captivating chapter title in Turkish.
The title should be between 3 and 6 words. Do not use quotation marks.

Sentence: "${sentenceText}"

Title:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text.trim().replace(/^"|"$/g, '');
        if (text && text.length > 5) {
            return text;
        } else {
            return `“${sentenceText.substring(0, 30)}...” ile başlayan yol`;
        }

    } catch (error) {
        console.error("Error generating branch title:", error);
        return `“${sentenceText.substring(0, 30)}...” ile başlayan yol`;
    }
};

export const generateSummaryTitle = async (summaryText: string): Promise<string> => {
    // FIX: Check for the initialized 'ai' instance instead of the raw API key.
    if (!ai) {
        return "Yol Özeti"; // Default title
    }

    try {
        const prompt = `You are a literary expert crafting a compelling headline for a story summary. 
Based on the summary below, write a short, mystical, and engaging title in Turkish. 
The title should be between 2 and 5 words. Do not add any extra text or quotation marks.

Summary: "${summaryText}"

Title:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text.trim().replace(/^"|"$/g, '');
        if (text && text.length > 3) {
            return text;
        } else {
            return "Yol Özeti";
        }

    } catch (error) {
        console.error("Error generating summary title:", error);
        return "Yol Özeti";
    }
};