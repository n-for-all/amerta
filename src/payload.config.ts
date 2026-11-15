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

/** MCP tool: upload a file from a public URL into `media` or `product-media` (the plugin's own create tool can't take files). */
const uploadMediaTool: MCPTool = {
  name: "uploadMedia",
  description:
    "Upload an image/video/PDF from a public https URL into `media` (site/blog) or `product-media` (product images). Returns the new document id to use in products.images, posts, pages, etc.",
  // Cast: zod v3 types from zod@4 vs the plugin's bundled zod@3.25 are runtime-compatible but too deep for tsc to compare
  parameters: {
    url: z.string().url().describe("Public https URL of the file"),
    collection: z.enum(["media", "product-media"]).describe("media = site/blog media, product-media = product images"),
    alt: z.string().optional().describe("Alt text (recommended for SEO/accessibility)"),
    title: z.string().optional(),
    filename: z.string().optional().describe("Optional file name, e.g. kopi-luwak-50g.jpg"),
  } as unknown as MCPTool["parameters"],
  handler: async (args, req) => {
    const { url, collection, alt, title, filename } = args as { url: string; collection: "media" | "product-media"; alt?: string; title?: string; filename?: string };
    const fail = (msg: string) => ({ content: [{ type: "text" as const, text: `uploadMedia failed: ${msg}` }] });
    try {
      const target = new URL(url);
      // Only fetch public https URLs (no internal hosts) to avoid server-side request forgery
      if (target.protocol !== "https:") return fail("only https URLs are allowed");
      if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$)/i.test(target.hostname)) return fail("private/internal hosts are not allowed");

      const res = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(30000) });
      if (!res.ok) return fail(`download returned HTTP ${res.status}`);
      const mimetype = (res.headers.get("content-type") || "").split(";")[0]!.trim();
      if (!/^(image\/|video\/|application\/pdf$)/.test(mimetype)) return fail(`unsupported content type "${mimetype}"`);
      const data = Buffer.from(await res.arrayBuffer());
      if (data.length > 25 * 1024 * 1024) return fail("file is larger than 25 MB");

      const ext = mimetype.split("/")[1]?.replace("jpeg", "jpg").replace("svg+xml", "svg") || "bin";
      const fromUrl = decodeURIComponent(target.pathname.split("/").pop() || "").replace(/[^\w.-]+/g, "-");
      const name = (filename || (fromUrl.includes(".") ? fromUrl : `${fromUrl || "upload"}.${ext}`)).slice(0, 120);

      const doc = await req.payload.create({
        collection,
        data: { ...(alt && { alt }), ...(title && { title }) },
        file: { data, mimetype, name, size: data.length },
        req,
        // Custom MCP tools don't receive the API key's user (built-in tools do), so collection access
        // can't be evaluated here. Authorization is the API key's "uploadMedia" permission, which the
        // plugin checks before this handler can run.
        overrideAccess: true,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: doc.id, collection, filename: (doc as any).filename, url: (doc as any).url, alt: (doc as any).alt ?? null }) }] };
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
          ],
        },
      }),
    ],
  }),
);
