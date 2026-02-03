import { slugify } from "@/amerta/utilities/slugify";
import { XMLParser } from "fast-xml-parser";
import { Payload } from "payload";
import { htmlToLexical } from "./import-woo-products";
import { Post } from "@/payload-types";
import sharp from "sharp";

export const formatSlug = (val: string): string => {
  const slugifier = new slugify();
  return slugifier.generate(val).toLowerCase();
};

function firstAvailable(obj: any, keys: string[]) {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
      const v = obj[k];
      if (v !== undefined && v !== null) return v;
    }
  }
  return undefined;
}

function extractStringField(item: any, possibilities: string[]) {
  const v = firstAvailable(item, possibilities);
  if (Array.isArray(v) && v.length === 1) return typeof v[0] === "object" ? "" : String(v[0]);
  if (typeof v === "object" && v && ("#text" in v || "__cdata" in v)) {
    return (v["__cdata"] ?? v["#text"] ?? "").toString();
  }
  return v != null ? String(v) : "";
}

async function parseWpXml(xmlRaw: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: true,
    trimValues: false,
    cdataPropName: "__cdata",
  });

  const parsed = parser.parse(xmlRaw);

  const items = parsed?.rss?.channel?.item || parsed?.channel?.item || (Array.isArray(parsed) ? parsed : []) || [];

  return Array.isArray(items) ? items : [items];
}

async function downloadAndProcessImage(imageUrl: string): Promise<Buffer> {
  const res = await fetch(imageUrl);
  const buffer = await res.arrayBuffer();
  const resized = await sharp(Buffer.from(buffer)).resize(800, 600, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
  return resized;
}

async function seedPostsFromWpXml({ payloadInstance, xmlContent }: { payloadInstance: any; xmlContent: string }) {
  const items = await parseWpXml(xmlContent);
  const logs: string[] = [];
  const logger = (msg: string) => {
    logs.push(msg);
  };
  logger(`Parsed ${items.length} items from XML`);

  let imported = 0;
  let skipped = 0;
  let imageUpdated = 0;

  const attachmentMap = new Map<string, string>();
  const categoryMap = new Map<string, string>();
  const tagMap = new Map<string, string>();
  const uniqueCats = new Set<string>();
  const uniqueTags = new Set<string>();

  items.forEach((item: any) => {
    const postType = extractStringField(item, ["post_type", "wp:post_type"]);
    if (postType === "attachment") {
      const id = getVal(item, "post_id");
      const url = getVal(item, "attachment_url");
      if (id && url) attachmentMap.set(id.toString(), url);
    }

    item.category?.forEach((cat: any) => {
      const domain = cat["@_domain"];
      const catName = getVal(cat);
      if (!domain || domain === "category") {
        uniqueCats.add(catName);
      } else if (domain === "post_tag") {
        uniqueTags.add(catName);
      }
    });
  });

  for (const catName of uniqueCats) {
    const slug = formatSlug(catName);
    try {
      const existing = await payloadInstance.find({ collection: "categories", where: { slug: { equals: slug } } });
      if (existing.docs.length > 0) {
        categoryMap.set(catName, existing.docs[0].id);
      } else {
        const newCat = await payloadInstance.create({
          collection: "categories",
          data: { title: catName, slug, _status: "published" },
        });
        categoryMap.set(catName, newCat.id);
        logger(`Created Category: ${catName}`);
      }
    } catch {}
  }

  for (const tagName of uniqueTags) {
    const slug = formatSlug(tagName);
    try {
      const existing = await payloadInstance.find({ collection: "tags", where: { slug: { equals: slug } } });
      if (existing.docs.length > 0) {
        tagMap.set(tagName, existing.docs[0].id);
      } else {
        const newTag = await payloadInstance.create({
          collection: "tags",
          data: { title: tagName, slug, _status: "published" },
        });
        tagMap.set(tagName, newTag.id);
        logger(`Created Tag: ${tagName}`);
      }
    } catch (e) {
        console.error(e);
    }
  }

  for (const rawItem of items) {
    const postType = extractStringField(rawItem, ["post_type", "wp:post_type"]);
    if (postType !== "post") {
      skipped++;
      continue;
    }

    const wpPostId = firstAvailable(rawItem, ["post_id", "wp:post_id", "post_id"]) || firstAvailable(rawItem, ["post_id", "wp:post_id", "wp_post_id"]);

    const title = extractStringField(rawItem, ["title"]);
    const slugFromExport = extractStringField(rawItem, ["post_name", "wp:post_name", "post_name"]);
    let html = rawItem["encoded"] ? rawItem["encoded"][0]?.__cdata : "";
    html = html.replace(/<a[^>]*>.*?<\/a>/gi, "");
    html = html.replace(/<img[^>]*>/gi, "");
    html = html.replace(/\[([^\s\]]+)[^\]]*\](.*?)\[\/\1\]/gi, "");
    html = html.replace(/\\r\\n/g, "");

    const content: any = rawItem["encoded"] ? await htmlToLexical(html) : undefined;

    const excerpt = extractStringField(rawItem, ["excerpt", "excerpt:encoded", "comment", "summary"]);

    let finalExcerpt = excerpt;

    const match = html.match(/<p[^>]*>(.*?)<\/p>/i);
    if (match) {
      finalExcerpt = match[1].replace(/<[^>]*>/g, "").trim();
    }

    if (!finalExcerpt) {
      const textContent = html.replace(/<[^>]*>/g, "").trim();
      finalExcerpt = textContent.substring(0, 200);
    }

    const pubDate = firstAvailable(rawItem, ["pubDate", "wp:post_date", "post_date", "published"]) || undefined;

    let slug = (slugFromExport || "").trim();
    if (!slug) {
      slug = formatSlug((title || `post-${wpPostId || Date.now()}`).replace(/[^\w\s-]/g, "").toLowerCase());
    } else {
      slug = formatSlug(slug.replace(/[^\w\s-]/g, "").toLowerCase());
    }

    const catIds: string[] = [];
    const tagIds: string[] = [];
    rawItem.category?.forEach((cat: any) => {
      const domain = cat["@_domain"];
      const catName = getVal(cat);
      if (!domain || domain === "category") {
        const id = categoryMap.get(catName);
        if (id) catIds.push(id);
      } else if (domain === "post_tag") {
        const id = tagMap.get(catName);
        if (id) tagIds.push(id);
      }
    });

    const postData: Omit<Post, "id" | "createdAt" | "updatedAt"> = {
      title: title || `Untitled post ${wpPostId || Date.now()}`,
      slug,
      excerpt: finalExcerpt || undefined,
      categories: catIds,
      tags: tagIds,
      content: content || undefined,
      _status: "published",
      publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
      heroImage: undefined,
      meta: {
        title: title,
        description: finalExcerpt,
      },
    };

    try {
      const existingWithImage = await payloadInstance.find({
        collection: "posts",
        where: { title: { equals: title } },
        limit: 1,
      });

      logger(`Processing post: ${title} (wpPostId=${wpPostId})` + existingWithImage.docs.length + " image:" + (existingWithImage.docs.length ? !!existingWithImage.docs[0].heroImage : null));

      if (existingWithImage.docs.length > 0 && existingWithImage.docs[0].heroImage) {
        logger(`Post already has image: ${title}`);
        skipped++;
        continue;
      }

      const existing = existingWithImage;

      let created;
      let needsUpdate = false;
      if (existing.docs.length > 0) {
        created = existing.docs[0];

        const existingTags = created.tags || [];
        const existingCats = created.categories || [];
        if (tagIds.length > 0 && existingTags.length === 0) needsUpdate = true;
        if (catIds.length > 0 && existingCats.length === 0) needsUpdate = true;

        if (!created.heroImage) {
          imageUpdated++;
        }
      } else {
        created = await payloadInstance.create({
          collection: "posts",
          data: postData,
          req: { context: { disableRevalidate: true } },
        });
        imported++;
        logger(`Imported post: ${title} (id=${created?.id || created?._id || "n/a"}, wpPostId=${wpPostId})`);
      }

      if (needsUpdate && created) {
        const updateData: any = {};
        if (tagIds.length > 0 && (!created.tags || created.tags.length === 0)) {
          updateData.tags = tagIds;
        }
        if (catIds.length > 0 && (!created.categories || created.categories.length === 0)) {
          updateData.categories = catIds;
        }

        if (Object.keys(updateData).length > 0) {
          await payloadInstance.update({
            collection: "posts",
            id: created.id,
            data: updateData,
            req: { context: { disableRevalidate: true } },
          });
          logger(`Updated post "${title}" with missing tags/categories`);
        }
      }
      if (!created) {
        continue;
      }

      if (!created.heroImage) {
        try {
          let imageUrl: string | null = null;

          const thumbMeta = Array.isArray(rawItem.postmeta) ? rawItem.postmeta.find((m: any) => getVal(m.meta_key) === "_thumbnail_id") : undefined;
          if (thumbMeta) {
            const thumbId = getVal(thumbMeta.meta_value);
            if (thumbId) imageUrl = attachmentMap.get(thumbId.toString()) || null;
          }

          if (imageUrl) {
            logger(`Found image URL for "${title}": ${imageUrl}`);
            const processedImage = await downloadAndProcessImage(imageUrl);
            logger(`Processed image for "${title}", size: ${processedImage.length} bytes`);
            const media = await payloadInstance.create({
              collection: "media",
              data: { alt: title },
              file: {
                data: processedImage,
                name: `${slug}.jpg`,
                mimetype: "image/jpeg",
              },
            });
            logger(`Created media for "${title}", media ID: ${media.id}`);
            await payloadInstance.update({
              collection: "posts",
              id: created.id,
              data: { heroImage: media.id, meta: { image: media.id } },
              req: { context: { disableRevalidate: true } },
            });
            logger(`Updated post "${title}" with heroImage: ${media.id}`);

            await new Promise((r) => setTimeout(r, 2000));
          } else {
            logger(`No image URL found for "${title}", skipping`);
          }
        } catch (imgErr) {
          logger(`Failed to add image for "${title}":` + (imgErr as Error).message);
        }
      }
    } catch (err) {
      console.error(`Failed to process post "${title}"`, err);
      logger(`Failed to process post "${title}": ` + (err as Error).message);
    }
  }

  logger(`Import complete — imported: ${imported}, updated: ${imageUpdated}, skipped: ${skipped}`);
  return logs;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
async function downloadImage(payload: Payload, postId: string | number, url: string, slug: string, logger: any) {
  try {
    logger(`   -> Downloading img: ${url}`);
    const res = await fetch(url);
    if (!res.ok) return;

    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = url.split(".").pop()?.split("?")[0] || "jpg";

    const media = await payload.create({
      collection: "media",
      data: { alt: slug },
      file: {
        data: buffer,
        name: `${slug}-hero.${ext}`,
        mimetype: `image/${ext === "png" ? "png" : "jpeg"}`,
        size: buffer.length,
      },
    });

    await payload.update({
      collection: "posts",
      id: postId,
      data: { heroImage: media.id, meta: { image: media.id } },
    });
  } catch (e) {
    console.error(e);
    logger(`   -> Image failed.`);
  }
}

function getVal(node: any, key?: string): string {
  if (key && node) node = node[key];
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.__cdata) return node.__cdata;
  if (node["#text"]) return node["#text"];
  return String(node);
}

export const importWpXmlHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const xmlContent = buffer.toString("utf-8");

    const logs = await seedPostsFromWpXml({
      payloadInstance: req.payload,
      xmlContent,
    });

    return Response.json({ success: true, logs });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
