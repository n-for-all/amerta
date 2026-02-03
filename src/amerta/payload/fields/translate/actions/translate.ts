"use server";

import { translateRichTextJSON, translateString } from "@/amerta/theme/utilities/ai-translate";
import { headers } from "next/headers";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { checkRole } from "@/amerta/access/checkRole";


export async function translateFieldsAction(fields: Record<string, any>, targetLang = "ar") {
      const payload = await getPayload({ config: configPromise });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || !checkRole(["admin"], user)) {
    throw new Error("Unauthorized: You must be logged in to use AI features.");
  }

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
