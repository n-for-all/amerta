"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Import specific utilities for server-side conversion
import { 
  convertMarkdownToLexical, 
  editorConfigFactory,
  defaultEditorConfig 
} from "@payloadcms/richtext-lexical";
import { getAiSettings } from "@/amerta/theme/utilities/ai-translate";

export const generateContentAction = async (
  dataToUpdate: Record<string, any>, 
  fieldTypes: Record<string, string>, 
  instruction: string, 
  locale: string
) => {
  const payload = await getPayload({ config: configPromise });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });
  if (!user) throw new Error("Unauthorized");

  const { apiKey, model: modelName } = await getAiSettings();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName || "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
    You are a Content Architect.
    TASK: Rewrite content based on the instruction: "${instruction}"
    TARGET LOCALE: ${locale}
    
    INPUT DATA: ${JSON.stringify(dataToUpdate)}
    
    RULES:
    1. Return a **FLAT JSON OBJECT**. Do NOT return an Array.
    2. Keys must match the INPUT DATA keys exactly (e.g., "content", "excerpt").
    3. Values must be valid **MARKDOWN STRINGS**. 
    4. Do not generate JSON structures for Rich Text, just the Markdown string.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response
      .text()
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .trim();
    
    let generatedData = JSON.parse(responseText);

    // 🛠️ FIX 1: Handle Array response from AI
    if (Array.isArray(generatedData)) {
      // If it's an array of objects, merge them into one
      generatedData = generatedData.reduce((acc, curr) => ({ ...acc, ...curr }), {});
    }

    const finalData: Record<string, any> = {};
    const config = await configPromise;

    // Load editor config once for performance
    const editorConfig = await editorConfigFactory.default({ config });

    for (const [key, value] of Object.entries(generatedData)) {
      // 🛠️ FIX 2: Check correct key mapping
      if (fieldTypes[key] === "richText" && typeof value === "string") {
        try {
          // Server-side conversion
          const lexicalJSON = convertMarkdownToLexical({
            markdown: value,
            editorConfig: editorConfig, // Use the factory config
          });

          // Validate structure
          if (lexicalJSON && lexicalJSON.root) {
            finalData[key] = lexicalJSON;
          } else {
            console.warn(`Lexical conversion returned empty for ${key}`);
            finalData[key] = value; // Fallback
          }
        } catch (convError) {
          console.error(`Conversion failed for ${key}:`, convError);
          finalData[key] = value;
        }
      } else {
        // Standard fields (text, textarea)
        finalData[key] = value;
      }
    }

    return finalData;
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw new Error(error.message || "Failed to generate content");
  }
};