import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { mcpPlugin } from "@payloadcms/plugin-mcp";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { withAmerta } from "./amerta/config";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

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
        collections: {
          // Catalog
          products: { enabled: { find: true, create: true, update: true }, description: "Store products" },
          categories: { enabled: { find: true, create: true, update: true } },
          collections: { enabled: { find: true, create: true, update: true }, description: "Product collections" },
          "product-brands": { enabled: { find: true, create: true, update: true } },
          "product-tags": { enabled: { find: true, create: true, update: true } },
          "product-options": { enabled: { find: true, create: true, update: true } },
          "product-reviews": { enabled: { find: true, update: true } },
          // Content
          pages: { enabled: { find: true, create: true, update: true } },
          posts: { enabled: { find: true, create: true, update: true }, description: "Blog posts" },
          tags: { enabled: { find: true, create: true, update: true }, description: "Blog tags" },
          menu: { enabled: { find: true, update: true } },
          media: { enabled: { find: true } },
          translations: { enabled: { find: true, update: true } },
          "email-templates": { enabled: { find: true, update: true } },
          // Commerce
          orders: { enabled: { find: true, update: true } },
          customers: { enabled: { find: true, update: true } },
          coupons: { enabled: { find: true, create: true, update: true } },
          "cart-rules": { enabled: { find: true, create: true, update: true } },
          shipping: { enabled: { find: true, update: true } },
        },
        globals: {
          settings: { enabled: true },
          "ecommerce-settings": { enabled: true },
          header: { enabled: true },
          footer: { enabled: true },
        },
      }),
    ],
  }),
);
