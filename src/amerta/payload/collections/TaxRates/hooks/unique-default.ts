import type { CollectionBeforeChangeHook } from "payload";

export const uniqueDefault: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  if (data.taxType === "default") {
    const { payload } = req;

    // Find existing default tax rate
    const existingDefault = await payload.find({
      collection: "tax-rate",
      where: {
        taxType: {
          equals: "default",
        },
      },
      limit: 1,
    });

    // If we found a default tax rate and it's not the current document, throw error
    if (existingDefault.docs.length > 0) {
      const existingDoc = existingDefault.docs[0]!;
      // Allow update of the same document
      if (operation === "create" || (operation === "update" && existingDoc.id !== originalDoc?.id)) {
        throw new Error("A default tax rate already exists. Please delete the existing default tax rate first or change it to specific country tax.");
      }
    }
  }

  return data;
};
