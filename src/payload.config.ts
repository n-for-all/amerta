import { mongooseAdapter } from "@payloadcms/db-mongodb";
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
    }),
    sharp,
    plugins: [],
  }),
);
