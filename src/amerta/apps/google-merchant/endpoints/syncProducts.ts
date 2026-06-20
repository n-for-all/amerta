import { Endpoint } from "payload";
import { ProductInputsServiceClient } from "@google-shopping/products";
import { getLinkUrl, getServerSideURL } from "@/amerta/utilities/getURL";
import { getProductsBy } from "@/amerta/theme/utilities/get-product-by";
import { getAllSalesChannels } from "@/amerta/theme/utilities/get-all-sales-channels";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { getLocales } from "@/amerta/theme/utilities/get-locales";
import { getAppSettings } from "@/amerta/theme/utilities/get-app-settings";
import { getCountryById } from "@/amerta/theme/utilities/get-countries";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import striptags from "striptags";

export const syncProductsEndpoint: Endpoint = {
    path: "/google-merchant/sync",
    method: "post",
    handler: async (req) => {
        try {
            if (!req.user) {
                return Response.json({ error: "Unauthorized" }, { status: 401 });
            }

            const config = await getAppSettings("google-merchant");

            if (!config || !config.merchantId || !config.serviceAccountJson) {
                return Response.json({ error: "Google Merchant is not configured." }, { status: 400 });
            }

            if (!config.dataSourceId) {
                return Response.json({ error: "No Data Source selected. Please select a Data Source ID and save." }, { status: 400 });
            }
            if (!config.salesChannelId) {
                return Response.json({ error: "No Sales Channel selected. Please configure it in the Google Merchant Settings." }, { status: 400 });
            }
            if (!config.targetCountryId) {
                return Response.json({ error: "No Target Country selected. Please configure it in the Google Merchant Settings." }, { status: 400 });
            }

            let credentials;
            try {
                credentials = JSON.parse(config.serviceAccountJson);
            } catch (e) {
                return Response.json({ error: "Invalid Service Account JSON" }, { status: 400 });
            }

            const allSalesChannels = await getAllSalesChannels();
            const salesChannel = allSalesChannels.find((sc: any) => sc.id === config.salesChannelId);

            if (!salesChannel) {
                return Response.json({ error: "Invalid Sales Channel selected." }, { status: 400 });
            }

            let storeCurrency: string | null | undefined;
            try {
                const currency = getDefaultCurrency(salesChannel as any);
                storeCurrency = typeof currency === 'string' ? currency : currency.code;
            } catch (e: any) {
                return Response.json({ error: `Sales Channel Error: ${e.message}` }, { status: 400 });
            }

            if (!storeCurrency) {
                return Response.json({ error: `Sales Channel currency object has no code.` }, { status: 400 });
            }

            storeCurrency = storeCurrency.toUpperCase();

            const targetCountry = await getCountryById(config.targetCountryId);
            if (!targetCountry || !targetCountry.iso_2) {
                return Response.json({ error: "Invalid Target Country selected or missing ISO 2 code." }, { status: 400 });
            }
            const feedLabel = targetCountry.iso_2.toUpperCase();

            console.log(`[Google Merchant Sync] Using strict currency: ${storeCurrency} and feedLabel: ${feedLabel} from Sales Channel: ${salesChannel.name}`);

            const { docs: products } = await getProductsBy({
                locale: "all",
                limit: 1000,
                whereQuery: {
                    _status: { equals: "published" },
                    salesChannels: { in: [config.salesChannelId] },
                }
            }) as any;

            const locales = await getLocales();

            if (!products || products.length === 0) {
                return Response.json({ count: 0, message: "No published products found in this Sales Channel to sync." });
            }

            console.log(`[Google Merchant Sync] Total published products fetched from DB for channel: ${products.length}`);

            const client = new ProductInputsServiceClient({
                credentials,
            });

            let successCount = 0;
            let errors: any[] = [];

            const resolveImageUrl = (url?: string) => {
                if (!url) return undefined;
                if (url.startsWith('http')) return url;
                return getServerSideURL() + (url.startsWith('/') ? '' : '/') + url;
            };

            const getLocalizedValue = (field: any, locale: string, fallbackLocale: string = 'en') => {
                if (!field || typeof field !== 'object') return field;
                if (Array.isArray(field)) return field;

                // If it's a media or meta object (not localized wrapper)
                if ('url' in field || 'filename' in field || 'title' in field || 'description' in field || 'mimeType' in field) {
                    return field;
                }

                const val = field[locale];
                const fallbackVal = field[fallbackLocale];

                const isUnpopulated = (typeof val === 'string' && typeof fallbackVal === 'object' && fallbackVal !== null) || 
                                      (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && Array.isArray(fallbackVal) && fallbackVal.length > 0 && typeof fallbackVal[0] === 'object');

                if (val === undefined || val === null || (Array.isArray(val) && val.length === 0) || isUnpopulated) {
                    return fallbackVal !== undefined ? fallbackVal : field;
                }
                return val;
            };

            const lexicalToText = (lexicalDoc: any): string => {
                if (!lexicalDoc || !lexicalDoc.root || !lexicalDoc.root.children) {
                    return "";
                }
                try {
                    return convertLexicalToHTML({ data: lexicalDoc });
                } catch (err) {
                    console.error("Failed to convert lexical to text:", err);
                    return "";
                }
            };

            for (const product of products) {
                for (const locale of locales) {
                    try {
                        const title = getLocalizedValue(product.title, locale);
                        
                        // Extract rich text from product.description
                        const localeDescription = getLocalizedValue(product.description, locale);
                        let extractedDescription = "";
                        if (localeDescription && typeof localeDescription === 'object' && localeDescription.root) {
                            extractedDescription = lexicalToText(localeDescription);
                        }

                        const localeMeta = getLocalizedValue(product.meta, locale);
                        const metaDesc = localeMeta?.description;
                        
                        const description = extractedDescription || metaDesc || title;

                        if (!title) {
                            console.log(`[Google Merchant Sync] Skipping product ${product.id} for locale ${locale} because title is empty`);
                            continue;
                        }

                        const link = getLinkUrl({ type: 'reference', reference: { relationTo: 'products', value: product as any }, locale });

                        const localeImages = getLocalizedValue(product.images, locale);

                        const allProductImages = (localeImages && Array.isArray(localeImages))
                            ? localeImages.map((img: any) => {
                                const media = getLocalizedValue(img, locale);
                                return media && typeof media === 'object' ? resolveImageUrl(media.url) : undefined;
                            }).filter(Boolean) as string[]
                            : [];

                        let productImageUrl: string | undefined = undefined;
                        let additionalImageLinks: string[] | undefined = undefined;

                        if (localeMeta?.image && typeof localeMeta.image === 'object' && localeMeta.image.url) {
                            productImageUrl = resolveImageUrl(localeMeta.image.url);
                            additionalImageLinks = allProductImages.length > 0 ? allProductImages : undefined;
                        } else if (allProductImages.length > 0) {
                            productImageUrl = allProductImages[0];
                            additionalImageLinks = allProductImages.length > 1 ? allProductImages.slice(1) : undefined;
                        }

                        if (product.type === "variant" && product.variants && product.variants.length > 0) {
                            for (let i = 0; i < product.variants.length; i++) {
                                const variant = product.variants[i]!;
                                const variantOfferId = variant.sku || `${product.id}-${i}-${locale}`;
                                const variantTitleOptions = variant.variant ? Object.values(variant.variant).map((v: any) => v.value).join(" ") : "";
                                const variantTitle = variantTitleOptions ? `${title} - ${variantTitleOptions}` : title;

                                let variantImageUrl = productImageUrl;
                                const variantLocaleImage = getLocalizedValue(variant.image, locale);

                                if (variantLocaleImage && typeof variantLocaleImage === 'object' && variantLocaleImage.url) {
                                    variantImageUrl = resolveImageUrl(variantLocaleImage.url);
                                } else if (variant.image && variant.image['en'] && typeof variant.image['en'] === 'object' && variant.image['en'].url) {
                                    variantImageUrl = resolveImageUrl(variant.image['en'].url);
                                }

                                const priceValue = variant.price?.toString();
                                const salePriceValue = variant.salePrice?.toString();

                                if (!priceValue) {
                                    console.log(`[Google Merchant Sync] Skipping variant ${variantOfferId} because it lacks a price.`);
                                    continue;
                                }

                                const productInput = {
                                    channel: 'ONLINE',
                                    contentLanguage: locale,
                                    feedLabel: feedLabel,
                                    offerId: variantOfferId,
                                    productAttributes: {
                                        title: variantTitle,
                                        description: description,
                                        link: link,
                                        imageLink: variantImageUrl,
                                        additionalImageLinks: additionalImageLinks,
                                        itemGroupId: product.id.toString(),
                                        price: {
                                            amountMicros: Math.round(parseFloat(priceValue) * 1000000),
                                            currencyCode: storeCurrency,
                                        },
                                        salePrice: salePriceValue ? {
                                            amountMicros: Math.round(parseFloat(salePriceValue) * 1000000),
                                            currencyCode: storeCurrency,
                                        } : undefined,
                                        availability: (variant.stockStatus === 'in_stock' || (variant.trackInventory && (variant.quantity || 0) > 0)) ? "IN_STOCK" as const : "OUT_OF_STOCK" as const,
                                        condition: "NEW" as const,
                                    },
                                };

                                await client.insertProductInput({
                                    parent: `accounts/${config.merchantId}`,
                                    dataSource: `accounts/${config.merchantId}/dataSources/${config.dataSourceId}`,
                                    productInput,
                                });
                                successCount++;
                            }
                        } else {
                            const simpleOfferId = product.sku || `${product.id}-${locale}`;
                            const priceValue = product.price?.toString();
                            const salePriceValue = product.salePrice?.toString();

                            if (!priceValue) {
                                console.log(`[Google Merchant Sync] Skipping simple product ${simpleOfferId} because it lacks a price.`);
                                continue;
                            }

                            const productInput = {
                                channel: 'ONLINE',
                                contentLanguage: locale,
                                feedLabel: feedLabel,
                                offerId: simpleOfferId,
                                productAttributes: {
                                    title: title,
                                    description: description,
                                    link: link,
                                    imageLink: productImageUrl,
                                    additionalImageLinks: additionalImageLinks,
                                    price: {
                                        amountMicros: Math.round(parseFloat(priceValue) * 1000000),
                                        currencyCode: storeCurrency,
                                    },
                                    salePrice: salePriceValue ? {
                                        amountMicros: Math.round(parseFloat(salePriceValue) * 1000000),
                                        currencyCode: storeCurrency,
                                    } : undefined,
                                    availability: (product.stockStatus === 'in_stock' || (product.trackInventory && (product.quantity || 0) > 0)) ? "IN_STOCK" as const : "OUT_OF_STOCK" as const,
                                    condition: "NEW" as const,
                                },
                            };

                            await client.insertProductInput({
                                parent: `accounts/${config.merchantId}`,
                                dataSource: `accounts/${config.merchantId}/dataSources/${config.dataSourceId}`,
                                productInput,
                            });
                            successCount++;
                        }
                    } catch (err: any) {
                        console.error(`Failed to sync product ${product.id} for locale ${locale}:`, err);
                        errors.push(`Product ${product.id} (${locale}): ${err.message}`);
                    }
                }
            }

            if (errors.length > 0) {
                return Response.json({
                    count: successCount,
                    error: `Synced ${successCount} products, but ${errors.length} failed.`,
                    details: errors
                }, { status: 207 });
            }

            return Response.json({ count: successCount, message: "Sync successful" });
        } catch (error: any) {
            console.error("Error syncing Google Merchant products:", error);
            return Response.json({ error: error.message || "Failed to sync products" }, { status: 500 });
        }
    },
};
