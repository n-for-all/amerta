"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { revalidatePath } from "next/cache";
import { LocaleCode } from "@/amerta/localization/locales";
import { batchTranslate, translateString } from "@/amerta/theme/utilities/ai-translate";

const MAX_BATCH_SIZE = 30;
const MAX_CHAR_COUNT = 3000;

/**
 * Generates translation previews for specified documents in a collection.
 * Batches documents by size limits to optimize API usage, translates specified fields,
 * and returns previews organized by document with original and translated text.
 * @param collectionSlug - The slug of the Payload collection to translate.
 * @param ids - Array of document IDs to translate.
 * @param targetLocale - The target language code (e.g., 'fr', 'de').
 * @param sourceLocale - The source language code (default: 'en').
 * @returns An object containing success status and array of preview objects with original and translated fields.
 * @example
 * const result = await generateTranslationPreviews('products', ['doc1', 'doc2'], 'fr');
 */
export async function generateTranslationPreviews(collectionSlug: string, ids: string[], targetLocale: string, sourceLocale: string = "en") {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: collectionSlug as any,
    where: { id: { in: ids } },
    locale: sourceLocale as LocaleCode,
    depth: 0,
    limit: 100,
  });

  const fieldsToTranslate = ["title", "description", "content", "value"];

  let currentBatch: Record<string, string> = {};
  let currentBatchCharCount = 0;
  let currentBatchItemCount = 0;

  const batches: Record<string, string>[] = [];
  const fieldMap: Map<string, { docId: string; fieldKey: string; original: string }> = new Map();

  for (const doc of docs) {
    for (const field of fieldsToTranslate) {
      const originalValue = (doc as any)[field];

      if (typeof originalValue === "string" && originalValue.trim() !== "") {
        const uniqueKey = `${doc.id}__${field}`;

        if (currentBatchItemCount >= MAX_BATCH_SIZE || currentBatchCharCount + originalValue.length > MAX_CHAR_COUNT) {
          batches.push(currentBatch);
          currentBatch = {};
          currentBatchCharCount = 0;
          currentBatchItemCount = 0;
        }

        currentBatch[uniqueKey] = originalValue;
        currentBatchCharCount += originalValue.length;
        currentBatchItemCount++;

        fieldMap.set(uniqueKey, { docId: doc.id as string, fieldKey: field, original: originalValue });
      }
    }
  }

  if (Object.keys(currentBatch).length > 0) {
    batches.push(currentBatch);
  }

  const batchResults = await Promise.all(batches.map((batch) => batchTranslate(batch, targetLocale)));

  const fullTranslationMap = Object.assign({}, ...batchResults);

  const previews: any[] = [];

  const docLookup: Record<string, any> = {};

  docs.forEach((doc) => {
    docLookup[doc.id] = {
      id: doc.id,
      title: (doc as any).title || `Doc ${doc.id}`,
      fields: [],
    };
  });

  for (const [uniqueKey, meta] of fieldMap.entries()) {
    const translatedText = fullTranslationMap[uniqueKey];

    if (translatedText) {
      docLookup[meta.docId].fields.push({
        key: meta.fieldKey,
        original: meta.original,
        translated: translatedText,
      });
    }
  }

  for (const id in docLookup) {
    if (docLookup[id].fields.length > 0) {
      previews.push(docLookup[id]);
    }
  }

  return { success: true, previews };
}

/**
 * Applies approved translations to documents in a Payload collection.
 * Updates specified fields with their translated values and revalidates the collection path.
 * @param collectionSlug - The slug of the Payload collection to update.
 * @param approvedData - Array of objects containing document IDs and field translations to apply.
 * @param targetLocale - The target language code for the translations.
 * @returns An object containing success status and the count of updated documents, or error message if failed.
 * @example
 * const result = await applyTranslations('products', [{ id: 'doc1', fields: [...] }], 'fr');
 */
export async function applyTranslations(collectionSlug: string, approvedData: any[], targetLocale: string) {
  const payload = await getPayload({ config });

  try {
    let count = 0;

    const updatePromises = approvedData.map(async (item) => {
      const updateData = item.fields.reduce((acc: any, field: any) => {
        acc[field.key] = field.translated;
        return acc;
      }, {});

      await payload.update({
        collection: collectionSlug as any,
        id: item.id,
        data: updateData,
        locale: targetLocale as LocaleCode,
      });
      count++;
    });

    await Promise.all(updatePromises);

    revalidatePath(`/admin/collections/${collectionSlug}`);
    return { success: true, count };
  } catch (error) {
    console.error("Bulk update failed:", error);
    return { success: false, error: "Failed to save translations" };
  }
}
