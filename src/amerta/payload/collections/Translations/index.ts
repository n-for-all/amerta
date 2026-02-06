import { revalidateTag } from "next/cache";
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
      () => {
        revalidateTag("translations", "max");
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
