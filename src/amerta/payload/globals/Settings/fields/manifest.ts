import { colorPickerField } from "@/amerta/fields/color";
import { Field } from "payload";

export const ManifestFields: Field[] = [
  {
    name: "manifestIcon",
    type: "upload",
    label: "Manifest Icon",
    relationTo: "media",
    admin: {
      description: "PWA icon image (must be exactly 512x512 pixels, SVG/PNG/WebP only)",
    },
    validate: async (value, { req }) => {
      if (!value) return true; // Optional field

      try {
        const media = await req.payload.findByID({
          collection: "media",
          id: value,
        });

        // Check file format
        const allowedMimeTypes = ["image/svg+xml", "image/png", "image/webp"];
        if (!allowedMimeTypes.includes(media.mimeType)) {
          return "Icon must be SVG, PNG, or WebP format only";
        }

        // SVG doesn't have width/height dimensions, so skip size check for SVG
        if (media.mimeType !== "image/svg+xml") {
          if (media.width !== 512 || media.height !== 512) {
            return "Image must be exactly 512x512 pixels";
          }
        }

        return true;
      } catch (error) {
        console.error(error);
        return "Invalid image";
      }
    },
  },
  {
    name: "desktopScreenshot",
    type: "upload",
    label: "Desktop Screenshot",
    relationTo: "media",
    admin: {
      description: "Desktop PWA screenshot (must be exactly 1920x1080 pixels, landscape)",
    },
    validate: async (value, { req }) => {
      if (!value) return true; // Optional field

      try {
        const media = await req.payload.findByID({
          collection: "media",
          id: value,
        });

        if (media.width !== 1920 || media.height !== 1080) {
          return "Desktop screenshot must be exactly 1920x1080 pixels";
        }

        return true;
      } catch (error) {
        console.error(error);
        return "Invalid image";
      }
    },
  },
  {
    name: "mobileScreenshot",
    type: "upload",
    label: "Mobile Screenshot",
    relationTo: "media",
    admin: {
      description: "Mobile PWA screenshot (must be exactly 1080x1920 pixels, portrait)",
    },
    validate: async (value, { req }) => {
      if (!value) return true; // Optional field

      try {
        const media = await req.payload.findByID({
          collection: "media",
          id: value,
        });

        if (media.width !== 1080 || media.height !== 1920) {
          return "Mobile screenshot must be exactly 1080x1920 pixels";
        }

        return true;
      } catch (error) {
        console.error(error);
        return "Invalid image";
      }
    },
  },
  colorPickerField({
    name: "themeColor",
    label: "Theme Color",
    admin: {
      description: "Primary theme color for PWA (e.g., #000000)",
    },
  }),
  colorPickerField({
    name: "backgroundColor",
    label: "Background Color",
    admin: {
      description: "Background color for PWA (e.g., #ffffff)",
    },
  }),
  {
    name: "scope",
    type: "text",
    label: "PWA Scope",
    defaultValue: "/",
    admin: {
      description: "Navigation scope for the PWA (default: /)",
    },
  },
  {
    name: "lang",
    type: "text",
    label: "Language",
    defaultValue: "en",
    admin: {
      description: "Primary language for the PWA (default: en)",
    },
  },
  {
    name: "dir",
    type: "select",
    label: "Text Direction",
    defaultValue: "ltr",
    options: [
      {
        label: "Left to Right (LTR)",
        value: "ltr",
      },
      {
        label: "Right to Left (RTL)",
        value: "rtl",
      },
    ],
    admin: {
      description: "Text direction for the PWA",
    },
  },
  {
    name: "pwaId",
    type: "text",
    label: "PWA ID",
    admin: {
      description: "Unique identifier for the PWA",
    },
  },
];
