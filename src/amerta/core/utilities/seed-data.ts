import { Payload } from "payload";
import currencies from "../data/currencies.json";
import countries from "../data/countries.json";
import emailTemplates from "../data/email-templates.json";
import { EmailTemplate, ProductOption } from "@/payload-types";

export const importBaseData = async (payload: Payload) => {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    log(`Importing ${currencies.length} currencies...`);
    let currCount = 0;
    for (const currency of currencies) {
      const existing = await payload.find({
        collection: "currency",
        where: { code: { equals: currency.code } },
        limit: 1,
      });

      if (existing.totalDocs === 0) {
        await payload.create({
          collection: "currency",
          data: {
            code: currency.code,
            symbol: currency.symbol,
            symbolNative: currency.symbol_native,
            decimalDigits: currency.decimal_digits,
            rounding: currency.rounding,
            name: currency.name,
            enabled: "1", // Enable all initially so they show in dropdown
          },
        });
        currCount++;
      }
    }
    log(`Imported ${currCount} new currencies.`);

    // 2. Countries
    log(`Importing ${countries.length} countries...`);
    let countryCount = 0;
    for (const country of countries) {
      const existing = await payload.find({
        collection: "country",
        where: { iso_3: { equals: country.iso_3 } },
        limit: 1,
      });

      if (existing.totalDocs === 0) {
        await payload.create({
          collection: "country",
          data: {
            name: country.name,
            iso_2: country.iso_2,
            iso_3: country.iso_3,
            num_code: country.num_code,
            display_name: country.display_name,
            active: country.active ? "1" : "0",
          },
        });
        countryCount++;
      }
    }
    log(`Imported ${countryCount} new countries.`);

    // 3. Email Templates
    log(`Importing ${emailTemplates.length} email templates...`);
    let emailTemplateCount = 0;
    for (const emailTemplate of emailTemplates) {
      const existing = await payload.find({
        collection: "email-templates",
        where: { type: { equals: emailTemplate.type } },
        limit: 1,
      });

      if (existing.totalDocs === 0) {
        await payload.create({
          collection: "email-templates",
          data: {
            body: emailTemplate.body,
            subject: emailTemplate.subject,
            type: emailTemplate.type as EmailTemplate["type"],
          },
        });
        emailTemplateCount++;
      }
    }
    log(`Imported ${emailTemplateCount} new email templates.`);
    return { success: true, logs };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const createStoreData = async (payload: Payload, currencyCode: string) => {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(msg);

  try {
    const existingStore = await payload.find({ collection: "store", limit: 1 });
    if (existingStore.totalDocs > 0) return { success: true, logs: ["Store already exists."] };

    log(`Configuring Store with Default Currency: ${currencyCode}`);

    // 1. Get Selected Currency ID
    const targetCurr = await payload.find({
      collection: "currency",
      where: { code: { equals: currencyCode.toLowerCase() } },
    });

    if (targetCurr.totalDocs === 0) throw new Error("Selected currency not found in DB.");

    // 2. Create Defaults
    const channel = await payload.create({
      collection: "sales-channel",
      data: {
        name: "Default Sales Channel",
        enabled: "1",
        currencies: [{ currency: targetCurr.docs[0]!.id, isDefault: true }],
        isDefault: true,
      },
    });
    log("Created Sales Channel.");

    await payload.create({
      collection: "store",
      data: {
        name: "Default Store",
        defaultSalesChannelId: channel.id,
        enabled: "1",
      },
    });
    log("Created Store.");

    // 3. Create Product Options (Optional)
    const productOptions = await payload.find({
      collection: "product-options",
    });
    if (productOptions && productOptions.docs && productOptions.docs.length > 0) {
      log("Default Product Options already exist");
      return { success: true, logs };
    }

    const data: Omit<ProductOption, "id" | "createdAt" | "updatedAt"> = {
      label: "Color",
      name: "color",
      type: "color",
      showInFilter: true,
      showInSearch: true,
      colors: [
        { label: "Red", color: "#FF0000" },
        { label: "Green", color: "#00FF00" },
        { label: "Blue", color: "#0000FF" },
        { label: "Yellow", color: "#FFFF00" },
        { label: "Cyan", color: "#00FFFF" },
        { label: "Magenta", color: "#FF00FF" },
        { label: "Black", color: "#000000" },
        { label: "White", color: "#FFFFFF" },
        { label: "Gray", color: "#808080" },
        { label: "Orange", color: "#FFA500" },
        { label: "Purple", color: "#800080" },
        { label: "Pink", color: "#FFC0CB" },
      ],
    };

    const colorOption = await payload.create({
      collection: "product-options",
      overrideAccess: true,
      data,
    });
    log("Added Color Option: " + colorOption.id);
    const dataSize: Omit<ProductOption, "id" | "createdAt" | "updatedAt"> = {
      label: "Size",
      name: "size",
      type: "radio",
      showInFilter: true,
      showInSearch: true,
      options: [
        { label: "Extra Small", option: "XS" },
        { label: "Small", option: "S" },
        { label: "Medium", option: "M" },
        { label: "Large", option: "L" },
        { label: "Extra Large", option: "XL" },
        { label: "2X Large", option: "2XL" },
        { label: "3X Large", option: "3XL" },
      ],
    };

    await payload.create({
      collection: "product-options",
      overrideAccess: true,
      data: dataSize,
    });
    log("Created Product Options.");

    return { success: true, logs };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
