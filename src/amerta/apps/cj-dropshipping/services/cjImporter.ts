import { Payload } from "payload";
import sharp from "sharp";
import { CJClient } from "./cjClient";
import {
  CJProductDetail,
  CJSettings,
  ImportProductOptions,
  CJVariant,
  CJShippingImportRule,
  CJRuleAction,
  parseCJWeight,
  resolveEffectiveProductWeight,
} from "../types";
import { getAppSettings } from "@/amerta/core/utilities/get-app-settings";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";
import { htmlToLexical } from "@/amerta/core/data/imports/import-woo-products";
import { resolveColor } from "@/amerta/core/utilities/resolve-color";

export class CJImporter {
  /**
   * Calculate store retail price from supplier unit cost (in USD) according to markup rules
   * and sales channel exchange rate (converting USD -> store currency like AED, EUR, etc.)
   */
  static calculatePrice(
    supplierCostUSD: number,
    settings?: CJSettings,
    exchangeRate: number = 1,
    shippingBufferUSD?: number
  ): { price: number; salePrice?: number } {
    const rawCostUSD = typeof supplierCostUSD === "number" ? supplierCostUSD : parseFloat(String(supplierCostUSD)) || 0;
    if (rawCostUSD <= 0) return { price: 0 };

    // Shipping rules buffer cushion (controls cost markup basis)
    let bufferUSD = 0;
    if (typeof shippingBufferUSD === "number" && shippingBufferUSD >= 0) {
      bufferUSD = shippingBufferUSD;
    } else if (settings?.enableShippingBuffer && typeof settings.shippingBufferUSD === "number" && settings.shippingBufferUSD > 0) {
      bufferUSD = settings.shippingBufferUSD;
    }

    const effectiveCostUSD = rawCostUSD + bufferUSD;

    // Convert from USD to store default currency (e.g. 1 USD = 3.67 AED)
    const rate = typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : 1;
    const costInStoreCurrency = effectiveCostUSD * rate;

    let markupType = settings?.markupType || "multiplier";
    let markupValue = settings?.markupValue ?? 2.5;

    // Rule 3: Tiered Markup for Low-Cost Products (items under threshold get higher multiplier)
    if (
      settings?.enableTieredMarkup &&
      typeof settings.tieredThresholdUSD === "number" &&
      settings.tieredThresholdUSD > 0 &&
      rawCostUSD < settings.tieredThresholdUSD
    ) {
      markupType = "multiplier";
      markupValue = typeof settings.tieredMultiplier === "number" && settings.tieredMultiplier > 0 ? settings.tieredMultiplier : 3.5;
    }

    let computedPrice = costInStoreCurrency;

    if (markupType === "multiplier") {
      computedPrice = costInStoreCurrency * markupValue;
    } else if (markupType === "percentage") {
      computedPrice = costInStoreCurrency * (1 + markupValue / 100);
    } else if (markupType === "fixed") {
      computedPrice = costInStoreCurrency + markupValue;
    }

    if (settings?.roundTo99) {
      computedPrice = Math.floor(computedPrice) + 0.99;
    } else {
      computedPrice = Math.round(computedPrice * 100) / 100;
    }

    // Rule 1: Minimum Retail Price Floor (defined in CJ USD $, converted to store currency)
    const floorUSD =
      typeof settings?.minPriceFloorUSD === "number" && settings.minPriceFloorUSD > 0
        ? settings.minPriceFloorUSD
        : typeof settings?.minPriceFloor === "number" && settings.minPriceFloor > 0
        ? settings.minPriceFloor / rate
        : 0;

    if (settings?.enablePriceFloor && floorUSD > 0) {
      let minFloorStoreCurrency = floorUSD * rate;
      if (settings?.roundTo99) {
        minFloorStoreCurrency = Math.floor(minFloorStoreCurrency) + 0.99;
      } else {
        minFloorStoreCurrency = Math.round(minFloorStoreCurrency * 100) / 100;
      }
      computedPrice = Math.max(computedPrice, minFloorStoreCurrency);
    }

    return {
      price: Math.max(0.01, computedPrice),
    };
  }

  /**
   * Evaluate a product against active Shipping & Import Rules.
   * Returns whether import is allowed, action, and block reason if any.
   */
  static evaluateShippingRules(
    product: {
      productWeight?: any;
      sellPrice?: string | number;
      variantsCount?: number;
      variants?: any[];
      weight?: any;
      weightPending?: boolean;
    },
    rules?: CJShippingImportRule[]
  ): {
    allowed: boolean;
    action: CJRuleAction;
    reason?: string;
    bufferUSD: number;
    matchedRuleName?: string;
    isWarning?: boolean;
    warningMessage?: string;
  } {
    const activeRules = Array.isArray(rules) ? rules.filter((r) => r.enabled) : [];

    // CRITICAL: Must have at least 1 rule set. If no rules set, do not allow import!
    if (activeRules.length === 0) {
      return {
        allowed: false,
        action: "block",
        reason: "No shipping rules configured. At least one active shipping rule is required to allow product imports.",
        bufferUSD: 0,
      };
    }

    const weight = resolveEffectiveProductWeight(product);
    const costUSD = typeof product.sellPrice === "number" ? product.sellPrice : parseFloat(String(product.sellPrice)) || 0;
    const variantsCount = product.variantsCount || product.variants?.length || 0;

    for (const rule of activeRules) {
      let matches = false;

      if (rule.field === "all" || rule.operator === "always") {
        matches = true;
      } else if (product.weightPending && (rule.field === "weight_not_set" || rule.field === "weight")) {
        // Weight not loaded yet (search results); weight rules run on preview/import
        matches = false;
      } else if (rule.field === "weight_not_set") {
        matches = !weight || weight <= 0;
      } else if (rule.field === "weight") {
        const threshold = Number(rule.value) || 0;
        if (rule.operator === "greater_than") matches = weight > threshold;
        else if (rule.operator === "less_than") matches = weight > 0 && weight < threshold;
        else if (rule.operator === "equals") matches = weight === threshold;
        else if (rule.operator === "is_not_set") matches = !weight || weight <= 0;
      } else if (rule.field === "cost") {
        const threshold = Number(rule.value) || 0;
        if (rule.operator === "greater_than") matches = costUSD > threshold;
        else if (rule.operator === "less_than") matches = costUSD < threshold;
        else if (rule.operator === "equals") matches = costUSD === threshold;
      } else if (rule.field === "variants_count") {
        const threshold = Number(rule.value) || 0;
        if (rule.operator === "greater_than") matches = variantsCount > threshold;
        else if (rule.operator === "less_than") matches = variantsCount < threshold;
        else if (rule.operator === "equals") matches = variantsCount === threshold;
      }

      if (matches) {
        if (rule.action === "block") {
          return {
            allowed: false,
            action: "block",
            reason: rule.name || (rule.field === "weight_not_set" ? "Weight is not set (0g)" : `Blocked by shipping rule: ${rule.name}`),
            bufferUSD: 0,
            matchedRuleName: rule.name,
          };
        }

        const buffer = typeof rule.bufferUSD === "number" && rule.bufferUSD >= 0 ? rule.bufferUSD : 0;
        return {
          allowed: true,
          action: rule.action,
          bufferUSD: buffer,
          matchedRuleName: rule.name,
          isWarning: rule.action === "warning",
          warningMessage: rule.action === "warning" ? rule.name : undefined,
        };
      }
    }

    // Default: all should be allowed if rules exist but none specifically blocked this product
    return {
      allowed: true,
      action: "allow",
      bufferUSD: 0,
      matchedRuleName: "Default (Allowed)",
    };
  }

  /**
   * Download image from CJ and create record in product-media collection, returning id and url
   */
  static async uploadMediaWithDetails(
    payload: Payload,
    url: string,
    title: string
  ): Promise<{ id: string; url: string; buffer: Buffer } | null> {
    try {
      if (!url) return null;
      const res = await fetch(url);
      if (!res.ok) return null;

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const cleanUrl = url.split("?")[0] || "";
      const ext = cleanUrl.endsWith(".png") ? ".png" : cleanUrl.endsWith(".webp") ? ".webp" : ".jpg";
      const filename = `cj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
      const mimetype = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

      const media = await payload.create({
        collection: "product-media",
        data: {
          alt: title || filename,
        },
        file: {
          data: buffer,
          name: filename,
          mimetype,
          size: buffer.length,
        },
      });

      return {
        id: media.id,
        url: (media as any).url || `/products/${filename}`,
        buffer,
      };
    } catch (err) {
      console.error(`[CJ Importer] Failed to upload image from ${url}:`, err);
      return null;
    }
  }

  /**
   * Download image from CJ and create record in product-media collection
   */
  static async uploadMedia(payload: Payload, url: string, title: string): Promise<string | null> {
    const res = await this.uploadMediaWithDetails(payload, url, title);
    return res?.id || null;
  }

  /**
   * CJ product images in display order, main image first.
   * productImageSet comes back in no particular order (often a label or size chart first). productImage is a
   * JSON-encoded array in the seller's order, and bigImage is the main image, so those lead.
   */
  static resolveImageList(cjProduct: any): string[] {
    const toList = (val: any): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val !== "string" || !val.trim()) return [];
      const str = val.trim();
      if (str.startsWith("[")) {
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return str.split(",").map((s) => s.trim());
    };
    const all = [...toList(cjProduct?.bigImage), ...toList(cjProduct?.productImage), ...toList(cjProduct?.productImageSet)];
    return Array.from(new Set(all.filter((img) => typeof img === "string" && img.startsWith("http"))));
  }

  /**
   * Share of the frame the subject covers (0-1), measured against the colour at the image edges.
   * Returns null for images that are not square (labels, size charts) or cannot be read.
   */
  static async subjectArea(buffer: Buffer): Promise<number | null> {
    try {
      const meta = await sharp(buffer).metadata();
      if (!meta.width || !meta.height || Math.abs(meta.width - meta.height) > meta.width * 0.02) return null;
      const size = 100;
      const { data } = await sharp(buffer).removeAlpha().resize(size, size, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
      const px = (x: number, y: number) => {
        const i = (y * size + x) * 3;
        return [data[i]!, data[i + 1]!, data[i + 2]!];
      };
      const edge: number[][] = [];
      for (let k = 0; k < size; k++) {
        for (let d = 0; d < 4; d++) edge.push(px(k, d), px(k, size - 1 - d), px(d, k), px(size - 1 - d, k));
      }
      const median = (vals: number[]) => vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)]!;
      const bg = [0, 1, 2].map((c) => median(edge.map((e) => e[c]!)));
      let fg = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const [r, g, b] = px(x, y);
          if (Math.abs(r! - bg[0]!) + Math.abs(g! - bg[1]!) + Math.abs(b! - bg[2]!) > 40) fg++;
        }
      }
      return fg / (size * size);
    } catch {
      return null;
    }
  }

  /**
   * Move the close-up shot (the image whose subject fills the least of the frame, e.g. pills or powder
   * without the bottle) to the second position, which storefronts show on hover. Only moves it when it
   * clearly stands out (under 60% of the median subject size), so sets of near-identical shots stay as they are.
   */
  static async moveCloseupToSecond(ids: string[], buffers: Buffer[]): Promise<string[]> {
    if (ids.length < 3) return ids;
    const areas = await Promise.all(buffers.map((b) => this.subjectArea(b)));
    const candidates = areas
      .map((area, i) => ({ area, i }))
      .filter((c): c is { area: number; i: number } => c.i > 0 && c.area !== null)
      .sort((a, b) => a.area - b.area);
    if (candidates.length < 2) return ids;
    const pick = candidates[0]!;
    const others = [...candidates.slice(1).map((c) => c.area), ...(areas[0] !== null ? [areas[0]!] : [])].sort((a, b) => a - b);
    const median = others[Math.floor(others.length / 2)]!;
    if (pick.i === 1 || pick.area >= median * 0.6) return ids;
    const rest = ids.filter((_, i) => i !== pick.i);
    return [rest[0]!, ids[pick.i]!, ...rest.slice(1)];
  }

  /**
   * Helper to slugify a string
   */
  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  /**
   * Determine target collection ID based on settings & product category
   */
  static async resolveCollection(
    payload: Payload,
    cjProduct: CJProductDetail,
    settings?: CJSettings,
    overrideCollectionId?: string,
    salesChannelId?: string,
  ): Promise<string | null> {
    // 1. If an explicit collection was passed in the import options, use that
    if (overrideCollectionId && overrideCollectionId !== "__auto__") {
      return overrideCollectionId;
    }

    // 2. If setting is "single_collection" and defaultCollectionId is configured
    if (settings?.categoryMappingMode === "single_collection" && settings?.defaultCollectionId) {
      return settings.defaultCollectionId;
    }

    // 3. Mode "auto_create" (default):
    // Get the CJ category name (categoryName or entryNameEn)
    const rawCategoryName = cjProduct.categoryName || cjProduct.entryNameEn || "";
    const leafCategoryName = rawCategoryName.includes(">")
      ? rawCategoryName.split(">").pop()!.trim()
      : rawCategoryName.trim();

    const categoryName = leafCategoryName || rawCategoryName.trim();
    if (!categoryName) {
      return settings?.defaultCollectionId || null;
    }

    // Check if a collection already exists in Amerta with matching title or slug
    const catSlug = this.slugify(categoryName);
    try {
      const existing = await payload.find({
        collection: "collections",
        where: {
          or: [
            { title: { equals: categoryName } },
            { slug: { equals: catSlug } },
          ],
        },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        return existing.docs[0]!.id;
      }

      // If it doesn't exist, create it automatically in Amerta!
      const newCollection = await payload.create({
        collection: "collections",
        data: {
          title: categoryName,
          slug: catSlug,
          _status: "published",
          salesChannels: salesChannelId ? [salesChannelId] : [],
        },
      });

      return newCollection.id;
    } catch (err) {
      console.warn(`[CJ Importer] Failed to resolve/create collection '${categoryName}':`, err);
      return settings?.defaultCollectionId || null;
    }
  }

  /**
   * Import a single product by PID from CJ Dropshipping into Amerta
   */
  static async importProduct(
    payload: Payload,
    options: ImportProductOptions,
  ): Promise<{ success: boolean; productId?: string; message?: string }> {
    const settings = (await getAppSettings("cj-dropshipping")) as CJSettings | undefined;

    // 1. Fetch complete product details from CJ
    const cjProduct: CJProductDetail = await CJClient.getProductDetails(options.pid);
    if (!cjProduct || !cjProduct.pid) {
      throw new Error(`Product not found on CJ with PID: ${options.pid}`);
    }

    // 2. Evaluate Shipping Rules (Must have at least 1 rule; controls both block/allow & shipping buffer)
    const resolvedWeight = resolveEffectiveProductWeight(cjProduct);

    const evaluation = this.evaluateShippingRules(
      {
        productWeight: resolvedWeight,
        sellPrice: cjProduct.sellPrice,
        variantsCount: cjProduct.variants?.length || 0,
        variants: cjProduct.variants,
      },
      settings?.shippingImportRules
    );

    if (!evaluation.allowed && !options.ignoreRules) {
      throw new Error(`Import blocked by Shipping Rules: ${evaluation.reason}`);
    }

    const appliedShippingBufferUSD = evaluation.bufferUSD;

    const title = options.customTitle?.trim() || cjProduct.productNameEn || cjProduct.productName;
    const baseSlug = this.slugify(title);
    const slug = `${baseSlug}-${cjProduct.pid.slice(-6).toLowerCase()}`;

    // 2. Check if product already exists in Amerta
    const existing = await payload.find({
      collection: "products",
      where: {
        or: [
          { slug: { equals: slug } },
          { sku: { equals: cjProduct.productSku } },
        ],
      },
      limit: 1,
    });

    const existingProduct = existing.docs.length > 0 ? existing.docs[0]! : null;

    const imageList = this.resolveImageList(cjProduct);

    const uniqueImages = imageList.slice(0, 10);
    let imageIds: string[] = [];
    const imageBuffers: Buffer[] = [];
    for (const imgUrl of uniqueImages) {
      const media = await this.uploadMediaWithDetails(payload, imgUrl, title);
      if (media) {
        imageIds.push(media.id);
        imageBuffers.push(media.buffer);
      }
    }
    if (settings?.closeupSecondImage) {
      imageIds = await this.moveCloseupToSecond(imageIds, imageBuffers);
    }

    // 4. Convert description to Lexical safely and import embedded images
    const rawDescription =
      cjProduct.description ||
      (cjProduct as any).descriptionHtml ||
      (cjProduct as any).productDetail ||
      (cjProduct as any).productDescription ||
      (cjProduct as any).remark ||
      (cjProduct as any).detail ||
      "";

    let lexicalDescription: any = null;
    let cleanExcerpt = "";

    if (rawDescription && typeof rawDescription === "string" && rawDescription.trim().length > 0) {
      // Generate clean plain text excerpt (up to 300 chars)
      cleanExcerpt = this.extractPlainText(rawDescription).slice(0, 300);

      // Extract all unique <img> URLs from rawDescription
      const descImgRegex = /<img\b[^>]*?\bsrc=["'](https?:\/\/[^"'\s>]+)["'][^>]*>/gi;
      const descImgUrls: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = descImgRegex.exec(rawDescription)) !== null) {
        const url = m[1];
        if (url && !descImgUrls.includes(url)) {
          descImgUrls.push(url);
        }
      }

      // Download and upload each description image into product-media
      const uploadedMediaByUrl = new Map<string, { id: string; url: string }>();
      for (const imgUrl of descImgUrls) {
        const uploaded = await this.uploadMediaWithDetails(payload, imgUrl, `${title} - Details`);
        if (uploaded) {
          uploadedMediaByUrl.set(imgUrl, uploaded);
        }
      }

      // Replace each <img> in rawDescription with a clean placeholder block referencing the media id
      let processedDescriptionHtml = rawDescription;
      if (uploadedMediaByUrl.size > 0) {
        processedDescriptionHtml = processedDescriptionHtml.replace(
          /<img\b[^>]*?\bsrc=["'](https?:\/\/[^"'\s>]+)["'][^>]*>/gi,
          (fullTag, src) => {
            const uploaded = uploadedMediaByUrl.get(src);
            if (uploaded) {
              return `</p><p>__CJ_UPLOAD_PLACEHOLDER_${uploaded.id}__</p><p>`;
            }
            return ""; // Remove un-uploaded broken images
          }
        );
      }

      // Sanitize HTML by stripping unsupported tags while preserving our upload placeholders
      const sanitizedHtml = this.sanitizeHtmlForLexical(processedDescriptionHtml);

      if (sanitizedHtml) {
        try {
          const converted = await htmlToLexical(sanitizedHtml);
          lexicalDescription = this.replacePlaceholdersWithUploadNodes(
            converted,
            uploadedMediaByUrl,
            title
          );
          lexicalDescription = this.sanitizeLexicalAst(lexicalDescription);
        } catch (err) {
          console.warn("[CJ Importer] Lexical HTML conversion fallback:", err);
        }
      }

      // If htmlToLexical failed or stripped content left no valid text, fall back to plain-text Lexical AST
      if (!lexicalDescription || !this.lexicalHasContent(lexicalDescription)) {
        lexicalDescription = this.plainTextToLexical(processedDescriptionHtml);
        if (lexicalDescription) {
          lexicalDescription = this.replacePlaceholdersWithUploadNodes(
            lexicalDescription,
            uploadedMediaByUrl,
            title
          );
          lexicalDescription = this.sanitizeLexicalAst(lexicalDescription);
        }
      }

      // Safeguard: Ensure any uploaded description images are included in the Lexical AST
      if (lexicalDescription && uploadedMediaByUrl.size > 0) {
        lexicalDescription = this.ensureUploadedImagesInLexical(
          lexicalDescription,
          uploadedMediaByUrl,
          title
        );
      }
    }

    // 5. Setup Sales Channel
    let salesChannelId = options.salesChannelId || settings?.defaultSalesChannelId;
    if (!salesChannelId) {
      const channel = await getSalesChannel();
      if (channel) salesChannelId = channel.id;
    }
    if (!salesChannelId) {
      const allChannels = await payload.find({ collection: "sales-channel", limit: 1 });
      if (allChannels.docs.length > 0) {
        salesChannelId = allChannels.docs[0]!.id;
      }
    }

    // 6. Resolve Sales Channel Currency & Exchange Rate (USD -> Store currency)
    const channelInfo = await this.getChannelExchangeRate(payload, salesChannelId);
    const exchangeRate = channelInfo.rate;

    let cjVariants = Array.isArray(cjProduct.variants) ? cjProduct.variants : [];
    if (Array.isArray(options.selectedVariantVids) && options.selectedVariantVids.length > 0) {
      cjVariants = cjVariants.filter((v) => options.selectedVariantVids!.includes(v.vid));
    }

    let minCalculatedPrice = 0;
    const variantsData: any[] = [];
    const optionCache = new Map<string, any>();
    const defaultStock = settings?.defaultStock || 100;

    if (cjVariants.length > 0) {
      for (const v of cjVariants) {
        const supplierPrice = v.variantSellPrice || v.variantStandardPrice || 0;
        const { price } = this.calculatePrice(supplierPrice, settings, exchangeRate, appliedShippingBufferUSD);

        if (minCalculatedPrice === 0 || price < minCalculatedPrice) {
          minCalculatedPrice = price;
        }

        const attrs = this.parseCJVariantAttributes(v);
        const variantObj: Record<string, any> = {};

        for (const attr of attrs) {
          const resolved = await this.resolveProductOption(payload, attr.name, attr.value, optionCache);
          variantObj[resolved.optionId] = {
            name: resolved.name,
            type: resolved.type,
            value: resolved.value,
          };
        }

        // Upload variant image if distinct
        let variantImgId: string | null = null;
        if (v.variantImage && !uniqueImages.includes(v.variantImage)) {
          variantImgId = await this.uploadMedia(payload, v.variantImage, `${title} - ${v.variantNameEn || v.variantSku}`);
        }

        const vQty = typeof v.inventory === "number" ? v.inventory : defaultStock;
        const vStockStatus = vQty > 0 ? "in_stock" : "out_of_stock";

        variantsData.push({
          variant: variantObj,
          sku: v.variantSku || `${cjProduct.productSku || cjProduct.pid}-${v.vid}`,
          price: price,
          salePrice: null,
          trackInventory: true,
          quantity: vQty,
          stockStatus: vStockStatus,
          requires_shipping: true,
          image: variantImgId || (imageIds[0] || null),
          width: v.variantWidth || undefined,
          length: v.variantLength || undefined,
          height: v.variantHeight || undefined,
          weight: parseCJWeight(v.variantWeight || v.weight || resolvedWeight) || undefined,
        });
      }
    } else {
      // Single variant / simple product
      const supplierPrice = parseFloat(cjProduct.sellPrice || "0") || 0;
      const { price } = this.calculatePrice(supplierPrice, settings, exchangeRate, appliedShippingBufferUSD);
      minCalculatedPrice = price;
    }

    const finalPrice = options.customPrice || minCalculatedPrice || 19.99;
    const publishStatus = options.publishStatus || (settings?.autoPublish ? "published" : "draft");

    // Resolve Collection / Category based on settings & options
    const targetCollectionId = await this.resolveCollection(
      payload,
      cjProduct,
      settings,
      options.collectionId || options.categoryId,
      salesChannelId,
    );

    const isVariantProduct = variantsData.length > 0;

    // 7. Create Product Document in Amerta
    const productData: any = {
      title,
      slug,
      type: isVariantProduct ? "variant" : "simple",
      sku: cjProduct.productSku || `CJ-${cjProduct.pid}`,
      price: finalPrice,
      images: imageIds,
      salesChannels: salesChannelId ? [salesChannelId] : [],
      collections: targetCollectionId ? [targetCollectionId] : [],
      _status: publishStatus,
      publishedOn: publishStatus === "published" ? new Date() : undefined,
    };

    // Only assign description if it contains valid, non-empty Lexical content
    if (lexicalDescription && this.lexicalHasContent(lexicalDescription)) {
      productData.description = lexicalDescription;
    }

    if (cleanExcerpt) {
      productData.excerpt = cleanExcerpt;
    }

    if (isVariantProduct) {
      productData.variants = variantsData;
    } else {
      productData.trackInventory = true;
      productData.quantity = defaultStock;
      productData.stockStatus = "in_stock";
      if (resolvedWeight > 0) {
        productData.weight = resolvedWeight;
      }
    }

    let finalProduct: any;
    if (existingProduct) {
      finalProduct = await payload.update({
        collection: "products",
        id: existingProduct.id,
        data: productData,
      });
    } else {
      finalProduct = await payload.create({
        collection: "products",
        data: productData,
      });
    }

    return {
      success: true,
      productId: finalProduct.id,
      message: `Successfully ${existingProduct ? "updated" : "imported"} "${title}" with ${variantsData.length} variant(s).`,
    };
  }

  /**
   * Parse variant attributes from CJ variant data (e.g. Color, Size, Style)
   */
  static parseCJVariantAttributes(v: CJVariant): Array<{ name: string; value: string }> {
    const attrs: Array<{ name: string; value: string }> = [];

    const isValid = (str: any): boolean => {
      if (str === null || str === undefined) return false;
      const s = String(str).trim();
      if (!s) return false;
      const lower = s.toLowerCase();
      return (
        lower !== "[]" &&
        lower !== "{}" &&
        lower !== "null" &&
        lower !== "undefined" &&
        lower !== '""' &&
        lower !== "''" &&
        lower !== "-" &&
        lower !== "--" &&
        lower !== "none"
      );
    };

    const inferName = (val: string, index = 0, total = 1): string => {
      if (CJImporter.isColorValue(val)) return "Color";
      if (CJImporter.isSizeValue(val)) return "Size";
      if (total === 2) {
        return index === 0 ? "Color" : "Size";
      }
      return total === 1 ? "Style" : `Option ${index + 1}`;
    };

    // 1. Try variantProperty (JSON array, object, or key:value format)
    if (v.variantProperty && typeof v.variantProperty === "string" && isValid(v.variantProperty)) {
      const trimmedProp = v.variantProperty.trim();

      if (trimmedProp.startsWith("[") || trimmedProp.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmedProp);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && typeof item === "object") {
                const name =
                  item.name || item.propertyName || item.propName || item.attrName || item.key || item.label;
                const val =
                  item.value || item.propertyValueName || item.propValue || item.attrValue || item.val;
                if (isValid(name) && isValid(val)) {
                  attrs.push({ name: String(name).trim(), value: String(val).trim() });
                } else if (isValid(val)) {
                  attrs.push({ name: inferName(String(val)), value: String(val).trim() });
                }
              } else if (typeof item === "string" && isValid(item)) {
                if (item.includes(":")) {
                  const [n, val] = item.split(":");
                  if (isValid(n) && isValid(val)) {
                    attrs.push({ name: n!.trim(), value: val!.trim() });
                  }
                } else {
                  attrs.push({ name: inferName(item), value: item.trim() });
                }
              }
            }
          } else if (parsed && typeof parsed === "object") {
            for (const [k, val] of Object.entries(parsed)) {
              if (isValid(k) && isValid(val)) {
                attrs.push({ name: k.trim(), value: String(val).trim() });
              }
            }
          }
        } catch {
          // If JSON parse fails, fall through
        }
      }

      // Check for key:value pairs (e.g. "Color:White,Size:XL")
      if (attrs.length === 0 && trimmedProp.includes(":")) {
        const pairs = trimmedProp.split(/[,;]/);
        for (const pair of pairs) {
          if (pair.includes(":")) {
            const [n, val] = pair.split(":");
            if (isValid(n) && isValid(val)) {
              attrs.push({ name: n!.trim(), value: val!.trim() });
            }
          }
        }
      }
    }

    // 2. Try variantNameEn / variantName with delimiters like " / " or " | "
    if (attrs.length === 0) {
      const rawName = v.variantNameEn || v.variantName || "";
      if (rawName && typeof rawName === "string" && isValid(rawName)) {
        const trimmedName = rawName.trim();
        if (trimmedName.includes("/") || trimmedName.includes("|")) {
          const rawParts = trimmedName.split(/[\/|]/).map((s) => s.trim()).filter(isValid);
          if (rawParts.length > 1) {
            rawParts.forEach((part, idx) => {
              if (part.includes(":")) {
                const [n, val] = part.split(":");
                if (isValid(n) && isValid(val)) {
                  attrs.push({ name: n!.trim(), value: val!.trim() });
                }
              } else {
                attrs.push({ name: inferName(part, idx, rawParts.length), value: part });
              }
            });
          }
        }
      }
    }

    // 3. Try variantKey (e.g. "Space Gray-M", "Off-White-S", "Black-XXL", "Color:White-Size:XL")
    if (attrs.length === 0 && v.variantKey && typeof v.variantKey === "string" && isValid(v.variantKey)) {
      const trimmedKey = v.variantKey.trim();

      if (trimmedKey.includes(":")) {
        const parts = trimmedKey.split(/[-;,]/);
        for (const part of parts) {
          if (part.includes(":")) {
            const [n, val] = part.split(":");
            if (isValid(n) && isValid(val)) {
              attrs.push({ name: n!.trim(), value: val!.trim() });
            }
          }
        }
      }

      if (attrs.length === 0) {
        const parts = trimmedKey.split("-").map((s) => s.trim()).filter(isValid);

        if (parts.length === 1) {
          attrs.push({ name: inferName(parts[0]!), value: parts[0]! });
        } else if (parts.length === 2) {
          const name0 = CJImporter.isColorValue(parts[0]!) ? "Color" : CJImporter.isSizeValue(parts[0]!) ? "Size" : "Color";
          const name1 = CJImporter.isSizeValue(parts[1]!) ? "Size" : CJImporter.isColorValue(parts[1]!) ? "Color" : "Size";
          attrs.push({ name: name0, value: parts[0]! });
          attrs.push({ name: name0 === name1 ? "Option 2" : name1, value: parts[1]! });
        } else if (parts.length >= 3) {
          const lastPart = parts[parts.length - 1]!;
          if (CJImporter.isSizeValue(lastPart)) {
            const firstPart = parts.slice(0, parts.length - 1).join("-");
            attrs.push({ name: "Color", value: firstPart });
            attrs.push({ name: "Size", value: lastPart });
          } else {
            parts.forEach((p, idx) => {
              attrs.push({ name: inferName(p, idx, parts.length), value: p });
            });
          }
        }
      }
    }

    // 4. Try raw variantNameEn / variantName if still empty
    if (attrs.length === 0) {
      const rawName = v.variantNameEn || v.variantName || "";
      if (rawName && typeof rawName === "string" && isValid(rawName)) {
        attrs.push({ name: inferName(rawName.trim()), value: rawName.trim() });
      }
    }

    // 5. Fallback if still empty: use SKU or VID if valid, else "Standard"
    if (attrs.length === 0) {
      const fallbackVal = isValid(v.variantSku) ? v.variantSku : isValid(v.vid) ? v.vid : "Standard";
      attrs.push({ name: "Option", value: fallbackVal });
    }

    return attrs;
  }

  /**
   * Find or create Product Option in Amerta's product-options collection
   */
  static async resolveProductOption(
    payload: Payload,
    attrName: string,
    attrValue: string,
    cache?: Map<string, any>
  ): Promise<{ optionId: string; name: string; type: string; value: string }> {
    const cleanName = attrName.trim();
    const cleanValue = attrValue.trim();

    if (!cleanValue || cleanValue === "[]" || cleanValue === "{}" || cleanValue === "null") {
      throw new Error(`Invalid attribute value "${attrValue}" for option "${attrName}"`);
    }

    const cacheKey = cleanName.toLowerCase();
    const isColor = cleanName.toLowerCase().includes("color") || cleanName.toLowerCase().includes("colour");
    const optType = isColor ? "color" : "dropdown";

    try {
      let optDoc = cache ? cache.get(cacheKey) : null;

      if (!optDoc) {
        const existing = await payload.find({
          collection: "product-options",
          where: {
            name: { equals: cleanName },
          },
          limit: 1,
        });

        if (existing.docs.length > 0) {
          optDoc = existing.docs[0]!;
          if (cache) cache.set(cacheKey, optDoc);
        }
      }

      if (optDoc) {
        const existingOptions = (optDoc.options?.map((o: any) => o.option) || []).filter(
          (o: string) => o && o !== "[]" && o !== "{}"
        );
        const existingColors = (optDoc.colors?.map((c: any) => c.label) || []).filter(
          (c: string) => c && c !== "[]" && c !== "{}"
        );

        let needsUpdate = false;
        const updatedOptions = (optDoc.options || []).filter((o: any) => o.option && o.option !== "[]");
        const updatedColors = (optDoc.colors || []).filter((c: any) => c.label && c.label !== "[]");

        if (!existingOptions.includes(cleanValue)) {
          updatedOptions.push({ option: cleanValue, label: cleanValue });
          needsUpdate = true;
        }

        if (isColor && !existingColors.includes(cleanValue)) {
          updatedColors.push({ label: cleanValue, color: resolveColor(cleanValue) });
          needsUpdate = true;
        }

        if (needsUpdate) {
          optDoc = await payload.update({
            collection: "product-options",
            id: optDoc.id,
            data: {
              options: updatedOptions,
              colors: isColor ? updatedColors : optDoc.colors,
            },
          });
          if (cache) cache.set(cacheKey, optDoc);
        }

        return {
          optionId: optDoc.id,
          name: optDoc.name,
          type: optDoc.type || optType,
          value: cleanValue,
        };
      }

      // Create new option in Amerta
      const created = await payload.create({
        collection: "product-options",
        data: {
          label: cleanName,
          name: cleanName,
          type: optType,
          showInFilter: true,
          showInSearch: true,
          options: [{ option: cleanValue, label: cleanValue }],
          colors: isColor ? [{ label: cleanValue, color: resolveColor(cleanValue) }] : undefined,
        },
      });

      if (cache) cache.set(cacheKey, created);

      return {
        optionId: created.id,
        name: created.name,
        type: created.type || optType,
        value: cleanValue,
      };
    } catch (err) {
      console.warn(`[CJ Import] Could not resolve product option ${cleanName}:`, err);
      return {
        optionId: `opt-${cleanName.toLowerCase()}`,
        name: cleanName,
        type: optType,
        value: cleanValue,
      };
    }
  }

  /**
   * Check if a string represents a common color
   */
  private static isColorValue(val: string): boolean {
    if (!val || typeof val !== "string") return false;
    const v = val.trim().toLowerCase();
    const commonColors = [
      "black", "white", "red", "blue", "green", "yellow", "gray", "grey",
      "pink", "purple", "brown", "beige", "orange", "gold", "silver",
      "coffee", "khaki", "navy", "cyan", "magenta", "maroon", "olive",
      "teal", "violet", "camel", "champagne", "apricot", "ivory",
      "space gray", "off-white", "rose gold", "sky blue", "dark blue",
      "light blue", "army green", "wine red", "multicolor", "rainbow",
      "translucent", "transparent"
    ];
    if (commonColors.includes(v)) return true;
    return commonColors.some((c) => v.includes(c));
  }

  /**
   * Check if a string represents a size, dimension, or measurement
   */
  private static isSizeValue(val: string): boolean {
    if (!val || typeof val !== "string") return false;
    const v = val.trim().toLowerCase();
    const commonSizes = [
      "xxs", "xs", "s", "m", "l", "xl", "2xl", "3xl", "4xl", "5xl", "6xl",
      "small", "medium", "large", "x-large", "xx-large",
      "one size", "onesize", "os", "single", "twin", "queen", "king",
    ];
    if (commonSizes.includes(v)) return true;
    if (/^\d+\s*([x*×]\s*\d+)+(\s*cm|\s*mm|\s*m|\s*in|\s*inch)?$/i.test(v)) return true;
    if (/^\d+(\.\d+)?\s*(cm|mm|m|in|inch|ft|g|kg|oz|lb|pcs|pack|set|yard)$/i.test(v)) return true;
    if (/^(size\s*)?[#\d]+$/i.test(v) || /^size\s+[a-z0-9]+/i.test(v)) return true;
    return false;
  }

  /**
   * Extract plain text from HTML string
   */
  private static extractPlainText(html: string): string {
    if (!html || typeof html !== "string") return "";
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<br\s*[\/]?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<\/div>/gi, " ")
      .replace(/<\/li>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Sanitize HTML for Lexical conversion:
   * Removes <img>, <picture>, <video>, <iframe>, <script>, <style> and tables
   * so Lexical doesn't create UploadNodes or unsupported nodes without IDs.
   */
  private static sanitizeHtmlForLexical(html: string): string {
    if (!html || typeof html !== "string") return "";

    let sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/<\/?picture\b[^>]*>/gi, "")
      .replace(/<source\b[^>]*>/gi, "")
      .replace(/<video\b[^<]*(?:(?!<\/video>)<[^<]*)*<\/video>/gi, "")
      .replace(/<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<embed\b[^>]*>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<\/tr>/gi, "<br/>")
      .replace(/<\/td>/gi, " ")
      .replace(/<\/th>/gi, " ")
      .replace(/<\/?table\b[^>]*>/gi, "")
      .replace(/<\/?thead\b[^>]*>/gi, "")
      .replace(/<\/?tbody\b[^>]*>/gi, "")
      .replace(/<\/?tr\b[^>]*>/gi, "")
      .replace(/<\/?td\b[^>]*>/gi, "")
      .replace(/<\/?th\b[^>]*>/gi, "")
      .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");

    return sanitized.trim();
  }

  /**
   * Generate a random 24-character hex string for Lexical node IDs
   */
  private static generateObjectId(): string {
    const chars = "abcdef0123456789";
    let id = "";
    for (let i = 0; i < 24; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  /**
   * Replace placeholder paragraphs (__CJ_UPLOAD_PLACEHOLDER_<mediaId>__) with Lexical upload nodes
   */
  private static replacePlaceholdersWithUploadNodes(
    ast: any,
    uploadedMediaByUrl: Map<string, { id: string; url: string }>,
    title: string
  ): any {
    if (!ast || typeof ast !== "object" || !ast.root || !Array.isArray(ast.root.children)) {
      return ast;
    }

    const mediaById = new Map<string, { id: string; url: string }>();
    for (const item of uploadedMediaByUrl.values()) {
      mediaById.set(item.id, item);
    }

    const processChildren = (nodes: any[]): any[] => {
      const result: any[] = [];

      for (const node of nodes) {
        if (!node) continue;

        // Check if this node is a paragraph containing a CJ upload placeholder
        let placeholderId: string | null = null;
        if (node.type === "paragraph" && Array.isArray(node.children)) {
          for (const child of node.children) {
            if (child.type === "text" && typeof child.text === "string") {
              const match = child.text.match(/__CJ_UPLOAD_PLACEHOLDER_([a-zA-Z0-9_-]+)__/);
              if (match) {
                placeholderId = match[1];
                break;
              }
            }
          }
        }

        if (placeholderId) {
          const media = mediaById.get(placeholderId);
          result.push({
            type: "upload",
            version: 2,
            id: this.generateObjectId(),
            relationTo: "product-media",
            value: placeholderId,
            fields: {
              url: media?.url || "",
              alt: `${title} - Details`,
            },
            format: "",
          });
          continue;
        }

        if (Array.isArray(node.children)) {
          result.push({
            ...node,
            children: processChildren(node.children),
          });
        } else {
          result.push(node);
        }
      }

      return result;
    };

    return {
      ...ast,
      root: {
        ...ast.root,
        children: processChildren(ast.root.children),
      },
    };
  }

  /**
   * Ensure that all uploaded images appear in the Lexical AST
   */
  private static ensureUploadedImagesInLexical(
    ast: any,
    uploadedMediaByUrl: Map<string, { id: string; url: string }>,
    title: string
  ): any {
    if (!ast || typeof ast !== "object" || !ast.root || !Array.isArray(ast.root.children)) {
      return ast;
    }

    const existingMediaIds = new Set<string>();
    const scanNodes = (nodes: any[]) => {
      for (const node of nodes) {
        if (!node) continue;
        if (node.type === "upload") {
          const id = typeof node.value === "object" ? node.value?.id : node.value;
          if (id) existingMediaIds.add(String(id));
        }
        if (Array.isArray(node.children)) {
          scanNodes(node.children);
        }
      }
    };
    scanNodes(ast.root.children);

    const missingNodes: any[] = [];
    for (const item of uploadedMediaByUrl.values()) {
      if (!existingMediaIds.has(item.id)) {
        missingNodes.push({
          type: "upload",
          version: 2,
          id: this.generateObjectId(),
          relationTo: "product-media",
          value: item.id,
          fields: {
            url: item.url,
            alt: `${title} - Details`,
          },
          format: "",
        });
      }
    }

    if (missingNodes.length > 0) {
      return {
        ...ast,
        root: {
          ...ast.root,
          children: [...ast.root.children, ...missingNodes],
        },
      };
    }

    return ast;
  }

  /**
   * Recursively sanitize a Lexical AST to strip unsupported nodes or invalid links,
   * while safely preserving valid upload nodes for product-media.
   */
  private static sanitizeLexicalAst(ast: any): any {
    if (!ast || typeof ast !== "object" || !ast.root) return null;

    const sanitizeNodes = (nodes: any[]): any[] => {
      if (!Array.isArray(nodes)) return [];
      const result: any[] = [];

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;

        // Preserve upload nodes with valid media IDs
        if (node.type === "upload") {
          const hasValidValue = Boolean(
            node.value &&
            (typeof node.value === "string" || typeof node.value === "number" || typeof node.value === "object")
          );
          if (hasValidValue && (node.relationTo === "product-media" || node.relationTo === "media")) {
            result.push({
              ...node,
              id: node.id || this.generateObjectId(),
              version: node.version || 2,
              fields: node.fields || {},
              format: node.format || "",
            });
            continue;
          }
          continue;
        }

        // Strip relationship nodes without valid doc
        if (node.type === "relationship") {
          continue;
        }

        // Clean link nodes without valid destination
        if (node.type === "link") {
          const url = node.fields?.url;
          const hasDoc = Boolean(node.fields?.doc?.value);
          if (!url && !hasDoc) {
            if (Array.isArray(node.children)) {
              result.push(...sanitizeNodes(node.children));
            }
            continue;
          }
        }

        // Recursively sanitize child nodes
        if (Array.isArray(node.children)) {
          const cleanChildren = sanitizeNodes(node.children);
          result.push({
            ...node,
            children: cleanChildren,
          });
        } else {
          result.push(node);
        }
      }

      return result;
    };

    const cleanChildren = sanitizeNodes(ast.root.children || []);

    return {
      ...ast,
      root: {
        ...ast.root,
        children: cleanChildren,
      },
    };
  }

  /**
   * Check if a Lexical AST has any meaningful content (text or upload images)
   */
  private static lexicalHasContent(ast: any): boolean {
    if (!ast || !ast.root || !Array.isArray(ast.root.children) || ast.root.children.length === 0) {
      return false;
    }

    const checkNode = (node: any): boolean => {
      if (!node) return false;
      if (node.type === "text" && typeof node.text === "string" && node.text.trim().length > 0) {
        return true;
      }
      if (node.type === "upload" && node.value) {
        return true;
      }
      if (Array.isArray(node.children)) {
        return node.children.some(checkNode);
      }
      return false;
    };

    return ast.root.children.some(checkNode);
  }

  /**
   * Convert plain text or HTML into a clean, valid Lexical AST structure
   */
  private static plainTextToLexical(rawTextOrHtml: string): any {
    if (!rawTextOrHtml || typeof rawTextOrHtml !== "string") return null;

    const plainText = rawTextOrHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .trim();

    if (!plainText) return null;

    const paragraphs = plainText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) return null;

    return {
      root: {
        type: "root",
        format: "",
        indent: 0,
        version: 1,
        children: paragraphs.map((p) => ({
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: p,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
        })),
        direction: "ltr",
      },
    };
  }

  /**
   * Retrieve the exchange rate for the default currency of a sales channel relative to USD
   */
  static async getChannelExchangeRate(
    payload: Payload,
    salesChannelId?: string
  ): Promise<{ rate: number; currencyCode: string; symbol: string }> {
    try {
      let channel: any = null;

      if (salesChannelId) {
        channel = await payload.findByID({
          collection: "sales-channel",
          id: salesChannelId,
          depth: 2,
        });
      }

      if (!channel) {
        try {
          const defaultChannel = await getSalesChannel();
          if (defaultChannel) {
            channel = defaultChannel;
          }
        } catch {
          // getSalesChannel may throw if not marked isDefault
        }
      }

      if (!channel) {
        const allChannels = await payload.find({
          collection: "sales-channel",
          limit: 1,
          depth: 2,
        });
        if (allChannels.docs.length > 0) {
          channel = allChannels.docs[0];
        }
      }

      if (channel && Array.isArray(channel.currencies)) {
        const defaultCurrObj =
          channel.currencies.find((c: any) => c.isDefault) || channel.currencies[0];

        if (defaultCurrObj) {
          let rate = defaultCurrObj.exchangeRate ? Number(defaultCurrObj.exchangeRate) : 1;
          let curr = typeof defaultCurrObj.currency === "object" ? defaultCurrObj.currency : null;

          if (!curr && defaultCurrObj.currency && typeof defaultCurrObj.currency === "string") {
            try {
              curr = await payload.findByID({
                collection: "currency",
                id: defaultCurrObj.currency,
              });
            } catch {}
          }

          const code = (curr?.code || "USD").toUpperCase();
          // If exchangeRate was left at 1 or unset for pegged currencies like AED
          if ((!rate || rate === 1) && code === "AED") {
            rate = 3.67;
          } else if ((!rate || rate === 1) && code === "SAR") {
            rate = 3.75;
          } else if ((!rate || rate === 1) && code === "QAR") {
            rate = 3.64;
          }

          return {
            rate: rate > 0 ? rate : 1,
            currencyCode: curr?.code || "USD",
            symbol: curr?.symbolNative || curr?.symbol || (code === "USD" ? "$" : curr?.code || "$"),
          };
        }
      }
    } catch (err) {
      console.warn("[CJ Importer] Could not determine sales channel exchange rate:", err);
    }

    return { rate: 1, currencyCode: "USD", symbol: "$" };
  }
}


