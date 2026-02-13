/**
 * @module AI
 * @title AI Translate
 * @description This module provides high-level utilities for interacting with GeminiAI 
 * and handling multi-language translation streams within the Amerta core.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPayload } from "payload";
import configPromise from "@payload-config";

/**
 * Retrieves AI settings from the Payload CMS global settings.
 * @returns An object containing the Gemini API key and AI model name.
 * @example
 * const settings = await getAiSettings();
 */
export const getAiSettings = async () => {
  const payload = await getPayload({ config: configPromise });
  const settings = await payload.findGlobal({
    slug: "settings",
  });
  return { apiKey: settings?.geminiTranslateApiKey || "", model: settings?.aiModel || "gemini-1.5-flash-latest" };
};

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Lists available generative AI models from the Google API.
 * @returns void
 * @example
 * await listModels();
 */
async function listModels() {
  const { apiKey, model } = await getAiSettings();
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ Error:", data.error.message);
      return;
    }

    const models = data.models
      // Filter for models that support "generateContent"
      .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => m.name.replace("models/", ""));

    return models;
  } catch (err) {
    console.error("Failed to fetch models:", err);
  }
}

/**
 * Translates a plain string to the specified target language using Gemini AI.
 * @param text - The text to translate.
 * @param targetLang - The target language code (e.g., 'fr', 'de').
 * @returns The translated string.
 * @example
 * const translated = await translateString("Hello", "fr");
 */
export async function translateString(text: string, targetLang: string): Promise<string> {
  const { apiKey, model } = await getAiSettings();
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelInstance = genAI.getGenerativeModel({ model: model });

  const prompt = `Translate the following text to language "${targetLang}". Output ONLY the translated text. Text: "${text}"`;
  const result = await modelInstance.generateContent(prompt);
  return result.response.text().trim();
}



/**
 * Translates all values in a JSON object to the specified target language using Gemini AI.
 * @param items - A record object with string keys and string values to translate.
 * @param targetLocale - The target language code (e.g., 'fr', 'de').
 * @returns A promise resolving to the translated JSON object with the same structure.
 * @example
 * const translated = await batchTranslate({ greeting: "Hello", farewell: "Goodbye" }, "fr");
 */
export const batchTranslate = async (items: Record<string, string>, targetLocale: string) => {
  const prompt = `
    You are a professional translator. 
    Translate the values of the following JSON object to the "${targetLocale}" language. 
    
    RULES:
    1. Keep the keys exactly as they are.
    2. Only translate the values.
    3. Return ONLY valid, raw JSON. No markdown formatting.
    
    JSON TO TRANSLATE:
    ${JSON.stringify(items)}
  `;
  const responseRaw = await translateString(prompt, targetLocale);
  try {
    const cleanJson = responseRaw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse batch translation JSON:", responseRaw);
    return {};
  }
};


/**
 * Translates all "text" fields in a rich text JSON object to the specified target language using Gemini AI.
 * @param json - The rich text JSON object to translate.
 * @param targetLang - The target language code (e.g., 'fr', 'de').
 * @returns The translated JSON object.
 * @example
 * const translated = await translateRichTextJSON({ text: "Hello" }, "de");
 */
export async function translateRichTextJSON(json: any, targetLang: string): Promise<any> {
  const { apiKey, model } = await getAiSettings();
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelInstance = genAI.getGenerativeModel({
    model: model,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
    You are a JSON translator. 
    Translate the value of every "text" field into language "${targetLang}".
    Do NOT change structure or keys.
    Input JSON: ${JSON.stringify(json)}
  `;

  const result = await modelInstance.generateContent(prompt);
  return JSON.parse(result.response.text());
}
