import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { mcpPlugin } from "@payloadcms/plugin-mcp";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { z } from "zod/v3"; // the MCP plugin expects zod v3 schemas
import { withAmerta } from "./amerta/config";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

type MCPTool = NonNullable<NonNullable<Parameters<typeof mcpPlugin>[0]["mcp"]>["tools"]>[number];

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = /^(image\/|video\/|application\/pdf$)/;

/** Content type from a file's first bytes, for the common formats (undefined = unknown, e.g. SVG or video). */
const sniffMime = (data: Buffer): string | undefined => {
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.subarray(0, 6).toString("latin1").startsWith("GIF8")) return "image/gif";
  if (data.subarray(0, 4).toString("latin1") === "RIFF" && data.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (data.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (data.subarray(4, 12).toString("latin1") === "ftypavif") return "image/avif";
  return undefined;
};

/**
 * MCP tool: upload a file into `media` or `product-media` (the plugin's own create tool can't take files).
 * The file comes from a public https `url`, or directly as `base64` (for files that only exist on the
 * caller's machine). With `replaceId` it replaces the file of an existing document instead, keeping its id,
 * so everything that uses that image (products, pages, posts) shows the new file.
 */
const uploadMediaTool: MCPTool = {
  name: "uploadMedia",
  description:
    "Upload an image/video/PDF into `media` (site/blog) or `product-media` (product images), from a public https `url` or as `base64` file contents (max 25 MB). Returns the document id to use in products.images, posts, pages, etc. Pass `replaceId` to replace the file of an existing document instead (same id, so everything using it updates).",
  // Cast: zod v3 types from zod@4 vs the plugin's bundled zod@3.25 are runtime-compatible but too deep for tsc to compare
  parameters: {
    url: z.string().url().optional().describe("Public https URL of the file (or use base64)"),
    base64: z.string().optional().describe("File contents, base64-encoded (a data: URL prefix is allowed). Use instead of url for local files."),
    mimeType: z.string().optional().describe("Content type for base64 uploads, e.g. image/png (detected from the file for PNG/JPEG/GIF/WebP/AVIF/PDF)"),
    collection: z.enum(["media", "product-media"]).describe("media = site/blog media, product-media = product images"),
    replaceId: z.string().optional().describe("Id of an existing document in `collection` whose file should be replaced"),
    alt: z.string().optional().describe("Alt text (recommended for SEO/accessibility)"),
    title: z.string().optional(),
    filename: z.string().optional().describe("File name, e.g. kopi-luwak-50g.jpg (required for base64 uploads)"),
  } as unknown as MCPTool["parameters"],
  handler: async (args, req) => {
    const { url, base64, mimeType, collection, replaceId, alt, title, filename } = args as {
      url?: string;
      base64?: string;
      mimeType?: string;
      collection: "media" | "product-media";
      replaceId?: string;
      alt?: string;
      title?: string;
      filename?: string;
    };
    const fail = (msg: string) => ({ content: [{ type: "text" as const, text: `uploadMedia failed: ${msg}` }] });
    try {
      if (!url === !base64) return fail("pass exactly one of url or base64");
      let data: Buffer;
      let mimetype: string;
      let name: string;

      if (base64) {
        if (!filename) return fail("filename is required for base64 uploads");
        const match = /^data:([^;,]+)?(?:;[^,]*)?,(.*)$/s.exec(base64);
        const encoded = (match ? match[2]! : base64).replace(/\s+/g, "");
        if (encoded.length > Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 4) return fail("file is larger than 25 MB");
        data = Buffer.from(encoded, "base64");
        if (!data.length) return fail("base64 is empty or invalid");
        const sniffed = sniffMime(data);
        const declared = (mimeType || match?.[1] || "").trim().toLowerCase();
        if (sniffed && declared && declared !== sniffed && !(declared === "image/jpg" && sniffed === "image/jpeg")) return fail(`the file is ${sniffed}, not ${declared}`);
        mimetype = sniffed || declared;
        if (!mimetype) return fail("could not detect the file type; pass mimeType");
        name = filename;
      } else {
        const target = new URL(url!);
        // Only fetch public https URLs (no internal hosts) to avoid server-side request forgery
        if (target.protocol !== "https:") return fail("only https URLs are allowed");
        if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$)/i.test(target.hostname)) return fail("private/internal hosts are not allowed");

        const res = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(30000) });
        if (!res.ok) return fail(`download returned HTTP ${res.status}`);
        mimetype = (res.headers.get("content-type") || "").split(";")[0]!.trim();
        data = Buffer.from(await res.arrayBuffer());
        const ext = mimetype.split("/")[1]?.replace("jpeg", "jpg").replace("svg+xml", "svg") || "bin";
        const fromUrl = decodeURIComponent(target.pathname.split("/").pop() || "").replace(/[^\w.-]+/g, "-");
        name = filename || (fromUrl.includes(".") ? fromUrl : `${fromUrl || "upload"}.${ext}`);
      }

      if (!ALLOWED_MIME.test(mimetype)) return fail(`unsupported content type "${mimetype}"`);
      if (data.length > MAX_UPLOAD_BYTES) return fail("file is larger than 25 MB");
      name = name.replace(/[/\\]+/g, "-").slice(0, 120);

      const file = { data, mimetype, name, size: data.length };
      const fields = { ...(alt && { alt }), ...(title && { title }) };
      // Custom MCP tools don't receive the API key's user (built-in tools do), so collection access
      // can't be evaluated here. Authorization is the API key's "uploadMedia" permission, which the
      // plugin checks before this handler can run.
      const doc = replaceId
        ? await req.payload.update({ collection, id: replaceId, data: fields, file, req, overrideAccess: true, overwriteExistingFiles: true })
        : await req.payload.create({ collection, data: fields, file, req, overrideAccess: true });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: doc.id, collection, replaced: !!replaceId, filename: (doc as any).filename, url: (doc as any).url, alt: (doc as any).alt ?? null }) }] };
    } catch (err: any) {
      return fail(err?.message || String(err));
    }
  },
};

/**
 * MCP tool: replace the blocks `layout` of a page, post or product.
 * The plugin's built-in update tools can't accept block fields: they turn every block type into "any object",
 * so the "exactly one block type must match" check always fails. Payload still validates every block on save.
 */
const updateLayoutTool: MCPTool = {
  name: "updateLayout",
  description:
    "Replace the blocks `layout` of a page, post or product. Pass the full array of blocks (each with its `blockType`); relationship/upload fields take ids. Use the normal update tools for every other field.",
  parameters: {
    collection: z.enum(["pages", "posts", "products"]),
    id: z.string().describe("Document id"),
    layout: z.array(z.record(z.string(), z.any())).describe("Full list of blocks, e.g. [{ blockType: 'klStory', title: '...' }]"),
    locale: z.string().optional().describe("Locale for localized fields inside the blocks, e.g. en or ar (default: the default locale)"),
    publish: z.boolean().optional().describe("true = save and publish; false/omitted = save as a draft"),
  } as unknown as MCPTool["parameters"],
  handler: async (args, req) => {
    const { collection, id, layout, locale, publish } = args as { collection: "pages" | "posts" | "products"; id: string; layout: Record<string, unknown>[]; locale?: string; publish?: boolean };
    try {
      const doc = await req.payload.update({
        collection,
        id,
        data: { layout, ...(publish && { _status: "published" }) } as any,
        draft: !publish,
        ...(locale && { locale: locale as any }),
        req,
        // Same as uploadMedia: custom tools don't receive the API key's user; the key's
        // "updateLayout" permission (checked by the plugin) is the authorization.
        overrideAccess: true,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: doc.id, collection, blocks: ((doc as any).layout || []).map((b: any) => b.blockType), _status: (doc as any)._status }) }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `updateLayout failed: ${err?.data?.errors ? JSON.stringify(err.data.errors) : err?.message || String(err)}` }] };
    }
  },
};

/**
 * MCP tool: find & replace text inside a page, post or product without resending the whole document.
 * Works on rich text (every text node, at any depth), the excerpt and the SEO title/description.
 * Exact, case-sensitive matches only; nothing is saved when no replacement matches.
 */
export const replaceTextTool: MCPTool = {
  name: "replaceText",
  description:
    "Find & replace exact text in a page, post or product (one locale): rich text content, excerpt and SEO title/description. Returns how many times each replacement matched. Set dryRun to preview without saving.",
  parameters: {
    collection: z.enum(["pages", "posts", "products"]),
    id: z.string().describe("Document id"),
    locale: z.string().describe("Locale to edit, e.g. en or ar"),
    replacements: z.array(z.object({ find: z.string().min(1), replace: z.string() })).min(1).describe("Applied in order, every occurrence"),
    dryRun: z.boolean().optional().describe("true = only count matches, don't save"),
  } as unknown as MCPTool["parameters"],
  handler: async (args, req) => {
    const { collection, id, locale, replacements, dryRun } = args as { collection: "pages" | "posts" | "products"; id: string; locale: string; replacements: { find: string; replace: string }[]; dryRun?: boolean };
    try {
      const doc: any = await req.payload.findByID({ collection, id, locale: locale as any, fallbackLocale: false as any, depth: 0, req, overrideAccess: true });
      const counts = replacements.map(() => 0);
      const swap = (text: string) =>
        replacements.reduce((t, r, i) => {
          const parts = t.split(r.find);
          counts[i] = (counts[i] ?? 0) + parts.length - 1;
          return parts.join(r.replace);
        }, text);
      // Rich text: rewrite every lexical text node
      const walk = (node: any): any => {
        if (Array.isArray(node)) return node.map(walk);
        if (!node || typeof node !== "object") return node;
        const out: any = {};
        for (const [k, v] of Object.entries(node)) out[k] = k === "text" && typeof v === "string" ? swap(v) : walk(v);
        return out;
      };
      const data: Record<string, any> = {};
      for (const field of ["content", "description"]) {
        if (doc[field] && typeof doc[field] === "object" && doc[field].root) data[field] = walk(doc[field]);
      }
      if (typeof doc.excerpt === "string") data.excerpt = swap(doc.excerpt);
      if (doc.meta && typeof doc.meta === "object") {
        data.meta = { ...doc.meta };
        if (typeof doc.meta.title === "string") data.meta.title = swap(doc.meta.title);
        if (typeof doc.meta.description === "string") data.meta.description = swap(doc.meta.description);
      }
      const total = counts.reduce((a, b) => a + b, 0);
      if (!dryRun && total > 0) {
        // Keep the slug as it is (some collections regenerate it from the title on save)
        await req.payload.update({ collection, id, locale: locale as any, data: { ...data, ...(doc.slug && { slug: doc.slug }) }, req, overrideAccess: true });
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({ id, collection, locale, saved: !dryRun && total > 0, matches: replacements.map((r, i) => ({ find: r.find, count: counts[i] })) }) }] };
    } catch (err: any) {
      return { content: [{ type: "text" as const, text: `replaceText failed: ${err?.data?.errors ? JSON.stringify(err.data.errors) : err?.message || String(err)}` }] };
    }
  },
};

export default buildConfig(
  withAmerta({
    telemetry: false,
    debug: process.env.NODE_ENV !== "production",
    admin: {
      suppressHydrationWarning: true,
      importMap: {
        baseDir: path.resolve(dirname),
      },
      autoLogin: {
        prefillOnly: true,
      },
    },
    routes: {
      admin: process.env.PAYLOAD_ADMIN_ROUTE || "/admin",
    },
    collections: [],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || "",
    typescript: {
      outputFile: path.resolve(dirname, "payload-types.ts"),
    },
    db: mongooseAdapter({
      url: process.env.DATABASE_URL || "",
      connectOptions: {
        maxPoolSize: 50, // Default is usually 5 or 10. Bump this up.
        minPoolSize: 10,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 30000,
      },
    }),
    sharp,
    plugins: [
      mcpPlugin({
        // Delete is intentionally not exposed anywhere; payment-method and integrations (API keys/secrets) are not exposed.
        collections: {
          // Catalog
          products: { enabled: { find: true, create: true, update: true }, description: "Store products. Images go in `images` (ids from product-media, upload with uploadMedia). Set _status: 'published' to publish." },
          "product-media": { enabled: { find: true, update: true }, description: "Product images. Upload new ones with the uploadMedia tool (collection: product-media)." },
          collections: { enabled: { find: true, create: true, update: true }, description: "Product collections (shop categories)" },
          "product-brands": { enabled: { find: true, create: true, update: true } },
          "product-tags": { enabled: { find: true, create: true, update: true } },
          "product-options": { enabled: { find: true, create: true, update: true }, description: "Variant options (e.g. size, weight)" },
          "product-reviews": { enabled: { find: true, create: true, update: true } },
          // Content
          pages: { enabled: { find: true, create: true, update: true } },
          posts: { enabled: { find: true, create: true, update: true }, description: "Blog posts. Set _status: 'published' to publish." },
          categories: { enabled: { find: true, create: true, update: true }, description: "Blog categories" },
          tags: { enabled: { find: true, create: true, update: true }, description: "Blog tags" },
          media: { enabled: { find: true, update: true }, description: "Site media (pages, blog). Upload new files with the uploadMedia tool (collection: media)." },
          menu: { enabled: { find: true, create: true, update: true } },
          translations: { enabled: { find: true, create: true, update: true } },
          "email-templates": { enabled: { find: true, update: true } },
          // Commerce
          orders: { enabled: { find: true, update: true } },
          customers: { enabled: { find: true, update: true } },
          coupons: { enabled: { find: true, create: true, update: true } },
          "cart-rules": { enabled: { find: true, create: true, update: true } },
          shipping: { enabled: { find: true, create: true, update: true } },
          currency: { enabled: { find: true, update: true } },
          country: { enabled: { find: true, update: true } },
          "tax-rate": { enabled: { find: true, create: true, update: true } },
          "sales-channel": { enabled: { find: true } },
        },
        globals: {
          settings: { enabled: true },
          "ecommerce-settings": { enabled: true },
          header: { enabled: true },
          footer: { enabled: true },
          apps: { enabled: true, description: "Active apps (activeApps) and their settings (appSettings), e.g. loyalty" },
        },
        mcp: {
          tools: [
            uploadMediaTool,
            updateLayoutTool,
            replaceTextTool,
          ],
        },
      }),
    ],
  }),
);
