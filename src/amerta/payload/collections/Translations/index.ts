/**
 * @module Collections/Translations
 * @title Translations Collection
 * @description This module defines the collections related to the translations functionality in Amerta, including translation keys, values, domains, and related handlers.
 */

import { revalidateCacheTags } from "@/amerta/utilities/revalidate";
import type { CollectionConfig } from "payload";

export const Translations: CollectionConfig = {
  slug: "translations",
  admin: {
    useAsTitle: "key",
    defaultColumns: ["key", "value", "domain"],
    group: "Settings",
    components: {
      edit: {
        beforeDocumentControls: ["@/amerta/fields/translate/AITranslateButton#AITranslateButton"],
      },
      beforeListTable: [
        '@/amerta/fields/translate/AIBulkTranslateButton#AIBulkTranslateButton'
      ]
    },
  },
  hooks: {
    afterChange: [
      ({ context, req }) => {
        // Missing keys are recorded while a page renders, where Next.js doesn't allow revalidation (they pass
        // disableRevalidation); the new key only holds the English text, so the cached dictionary is still right.
        if (context?.disableRevalidation) return;
        // Expire at once: with "max" the old dictionary kept being served, because its background refresh on dynamic pages never finished.
        revalidateCacheTags(["translations"], req);
      },
    ],
    afterDelete: [
      ({ req }) => {
        revalidateCacheTags(["translations"], req);
      },
    ],
  },
  access: {
    read: () => true, // Publicly readable
  },
  fields: [
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The unique ID used in code (e.g., "footer_copyright")',
      },
    },
    {
      name: "value",
      type: "textarea",
      localized: true,
      required: false,
    },
    {
      name: "domain",
      type: "text",
      required: false,
      admin: {
        description: 'The domain or context for the translation (e.g., "theme", "default")',
      },
      defaultValue: "default",
    },
  ],
};
