"use server";

import { translateRichTextJSON, translateString } from "@/amerta/theme/utilities/ai-translate";

export async function translateFieldsAction(fields: Record<string, any>, targetLang = "ar") {
  const results: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;

    // Handle Rich Text (JSON)
    if (typeof value === "object" && value.root) {
      results[key] = await translateRichTextJSON(value, targetLang);
    }
    // Handle Standard Text
    else if (typeof value === "string") {
      results[key] = await translateString(value, targetLang);
    }
  }

  return results;
}
