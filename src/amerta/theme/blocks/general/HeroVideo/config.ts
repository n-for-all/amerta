import { colorPickerField } from "@/amerta/fields/color";
import { link } from "@/amerta/fields/link/link";
import type { Block } from "payload";

export const ThemeShopHeroVideoBlock: Block = {
  slug: "themeShopHeroVideo",
  interfaceName: "ThemeShopHeroVideoBlock",
  labels: {
    singular: "Theme Shop Hero Video",
    plural: "Theme Shop Hero Videos",
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "alignment",
          label: "Text Alignment",
          type: "select",
          defaultValue: "left",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
        {
          name: "direction",
          label: "Direction",
          type: "select",
          defaultValue: "right",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      ],
    },
    {
      name: "spacing",
      label: "Button Spacing",
      type: "select",
      defaultValue: "gap-2",
      options: [
        { label: "None", value: "gap-0" },
        { label: "Small", value: "gap-1" },
        { label: "Medium", value: "gap-2" },
        { label: "Large", value: "gap-3" },
        { label: "X Large", value: "gap-4" },
        { label: "XX Large", value: "gap-5" },
        { label: "XXX Large", value: "gap-6" },
        { label: "4X Large", value: "gap-7" },
        { label: "5X Large", value: "gap-8" },
        { label: "6X Large", value: "gap-9" },
        { label: "7X Large", value: "gap-10" },
      ],
    },
    {
      type: "collapsible",
      label: "Background",
      fields: [
        {
          name: "blur",
          label: "Background Blur (px)",
          type: "number",
          defaultValue: 25,
          min: 0,
          max: 100,
        },
        {
          type: "row",
          fields: [
            {
              name: "bgVideoType",
              label: "Background Video Source",
              type: "radio",
              defaultValue: "upload",
              options: [
                { label: "Upload File", value: "upload" },
                { label: "External URL", value: "url" },
              ],
            },
          ],
        },
        {
          name: "bgVideo",
          label: "Background Video (Priority Over Image)",
          type: "upload",
          relationTo: "media",
          admin: {
            condition: (_, siblingData) => siblingData.bgVideoType === "upload",
          },
        },
        {
          name: "bgVideoUrl",
          label: "Background Video URL",
          type: "text",
          admin: {
            condition: (_, siblingData) => siblingData.bgVideoType === "url",
            description: "Direct link to .mp4 file recommended.",
          },
        },
        // -----------------------------
        {
          name: "bgImage",
          label: "Background Image",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "bgOverlay",
          label: "Background Overlay Color",
          type: "select",
          defaultValue: "after:bg-black/50",
          options: [
            { label: "Transparent", value: "after:bg-transparent" },
            { label: "Black 5%", value: "after:bg-black/5" },
            { label: "Black 10%", value: "after:bg-black/10" },
            { label: "Black 15%", value: "after:bg-black/15" },
            { label: "Black 20%", value: "after:bg-black/20" },
            { label: "Black 25%", value: "after:bg-black/25" },
            { label: "Black 30%", value: "after:bg-black/30" },
            { label: "Black 35%", value: "after:bg-black/35" },
            { label: "Black 40%", value: "after:bg-black/40" },
            { label: "Black 45%", value: "after:bg-black/45" },
            { label: "Black 50%", value: "after:bg-black/50" },
            { label: "Black 55%", value: "after:bg-black/55" },
            { label: "Black 60%", value: "after:bg-black/60" },
            { label: "Black 65%", value: "after:bg-black/65" },
            { label: "Black 70%", value: "after:bg-black/70" },
            { label: "Black 75%", value: "after:bg-black/75" },
            { label: "Black 80%", value: "after:bg-black/80" },
            { label: "Black 85%", value: "after:bg-black/85" },
            { label: "Black 90%", value: "after:bg-black/90" },
            { label: "Black 95%", value: "after:bg-black/95" },
            { label: "Black 100%", value: "after:bg-black" },
            { label: "White 5%", value: "after:bg-white/5" },
            { label: "White 10%", value: "after:bg-white/10" },
            { label: "White 15%", value: "after:bg-white/15" },
            { label: "White 20%", value: "after:bg-white/20" },
            { label: "White 25%", value: "after:bg-white/25" },
            { label: "White 30%", value: "after:bg-white/30" },
            { label: "White 35%", value: "after:bg-white/35" },
            { label: "White 40%", value: "after:bg-white/40" },
            { label: "White 45%", value: "after:bg-white/45" },
            { label: "White 50%", value: "after:bg-white/50" },
            { label: "White 55%", value: "after:bg-white/55" },
            { label: "White 60%", value: "after:bg-white/60" },
            { label: "White 65%", value: "after:bg-white/65" },
            { label: "White 70%", value: "after:bg-white/70" },
            { label: "White 75%", value: "after:bg-white/75" },
            { label: "White 80%", value: "after:bg-white/80" },
            { label: "White 85%", value: "after:bg-white/85" },
            { label: "White 90%", value: "after:bg-white/90" },
            { label: "White 95%", value: "after:bg-white/95" },
            { label: "White 100%", value: "after:bg-white" },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Foreground",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "videoType",
              label: "Main Video Source",
              type: "radio",
              defaultValue: "upload",
              options: [
                { label: "Upload File", value: "upload" },
                { label: "External URL", value: "url" },
              ],
            },
          ],
        },
        {
          name: "video",
          label: "Video (Priority Over Image)",
          type: "upload",
          relationTo: "media",
          admin: {
            condition: (_, siblingData) => siblingData.videoType === "upload",
          },
        },
        {
          name: "videoUrl",
          label: "Video URL",
          type: "text",
          admin: {
            condition: (_, siblingData) => siblingData.videoType === "url",
          },
        },
        // -----------------------------
        {
          name: "image",
          label: "Image",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
    {
      name: "blocks",
      label: "Blocks",
      type: "blocks",
      blocks: [
        {
          slug: "text",
          labels: { singular: "Text", plural: "Texts" },
          fields: [
            { name: "text", label: "Text", type: "text", defaultValue: "Sample Text", localized: true },
            {
              type: "row",
              fields: [
                {
                  name: "fontWeight",
                  label: "Font Weight",
                  type: "select",
                  defaultValue: "font-normal",
                  options: [
                    { label: "N", value: "font-normal" },
                    { label: "M", value: "font-medium" },
                    { label: "B", value: "font-bold" },
                    { label: "B+", value: "font-extrabold" },
                    { label: "B++", value: "font-black" },
                  ],
                },
                {
                  name: "fontSize",
                  label: "Font Size",
                  type: "select",
                  defaultValue: "text-base",
                  options: [
                    { label: "XL", value: "text-2xl" },
                    { label: "L", value: "text-xl" },
                    { label: "M", value: "text-lg" },
                    { label: "N", value: "text-base" },
                    { label: "S", value: "text-sm" },
                  ],
                },
              ],
            },
            {
              name: "leading",
              label: "Leading (Line Height)",
              type: "select",
              defaultValue: "leading-normal",
              options: [
                { label: "8", value: "leading-relaxed" },
                { label: "6", value: "leading-normal" },
                { label: "4", value: "leading-snug" },
                { label: "2", value: "leading-tight" },
                { label: "0", value: "leading-none" },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "marginTop",
                  label: "Margin Top",
                  type: "select",
                  defaultValue: "md:mt-1",
                  options: [
                    { label: "0", value: "" },
                    { label: "1", value: "md:mt-1" },
                    { label: "2", value: "mt-1 md:mt-2" },
                    { label: "4", value: "mt-2 md:mt-4" },
                    { label: "6", value: "mt-3 md:mt-6" },
                  ],
                },
                {
                  name: "marginBottom",
                  label: "Margin Bottom",
                  type: "select",
                  defaultValue: "md:mb-1",
                  options: [
                    { label: "0", value: "" },
                    { label: "1", value: "md:mb-1" },
                    { label: "2", value: "mb-1 md:mb-2" },
                    { label: "4", value: "mb-2 md:mb-4" },
                    { label: "6", value: "mb-3 md:mb-6" },
                  ],
                },
              ],
            },
          ],
        },
        {
          slug: "heading",
          labels: { singular: "Heading", plural: "Headings" },
          fields: [
            { name: "text", label: "Title", type: "text", defaultValue: "Sample Title", localized: true },
            {
              name: "type",
              label: "Type",
              type: "select",
              defaultValue: "h1",
              options: ["h1", "h2", "h3", "h4", "h5", "h6"].map((t) => ({ label: t.toUpperCase(), value: t })),
            },
            {
              type: "row",
              fields: [
                colorPickerField({
                  name: "textColor",
                  label: "Text Color",
                  defaultValue: "#ffffff",
                  admin: {
                    description: "Choose a color for this text",
                  },
                }),
                { name: "strokeText", label: "Stroke Text", type: "checkbox", defaultValue: true },
                colorPickerField({
                  name: "strokeColor",
                  label: "Stroke Color",
                  defaultValue: "#ffffff",
                  admin: {
                    description: "Choose a color for this stroke",
                  },
                }),
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "fontWeight",
                  label: "Font Weight",
                  type: "select",
                  defaultValue: "font-medium",
                  options: [
                    { label: "N", value: "font-normal" },
                    { label: "M", value: "font-medium" },
                    { label: "B", value: "font-bold" },
                    { label: "B+", value: "font-extrabold" },
                    { label: "B++", value: "font-black" },
                  ],
                },
                {
                  name: "fontSize",
                  label: "Font Size",
                  type: "select",
                  defaultValue: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl",
                  options: [
                    { label: "XXL", value: "text-3xl sm:text-4xl md:text-5xl lg:text-6xl" },
                    { label: "XL", value: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl" },
                    { label: "L", value: "text-xl sm:text-2xl md:text-3xl lg:text-4xl" },
                    { label: "M", value: "text-lg sm:text-xl md:text-2xl lg:text-3xl" },
                    { label: "N", value: "text-base sm:text-lg md:text-xl lg:text-2xl" },
                  ],
                },
              ],
            },
            {
              name: "leading",
              label: "Leading (Line Height)",
              type: "select",
              defaultValue: "leading-normal",
              options: [
                { label: "8", value: "leading-relaxed" },
                { label: "6", value: "leading-normal" },
                { label: "4", value: "leading-snug" },
                { label: "2", value: "leading-tight" },
                { label: "0", value: "leading-none" },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "marginTop",
                  label: "Margin Top",
                  type: "select",
                  defaultValue: "md:mt-1",
                  options: [
                    { label: "0", value: "" },
                    { label: "1", value: "md:mt-1" },
                    { label: "2", value: "mt-1 md:mt-2" },
                    { label: "4", value: "mt-2 md:mt-4" },
                    { label: "6", value: "mt-3 md:mt-6" },
                  ],
                },
                {
                  name: "marginBottom",
                  label: "Margin Bottom",
                  type: "select",
                  defaultValue: "md:mb-1",
                  options: [
                    { label: "0", value: "" },
                    { label: "1", value: "md:mb-1" },
                    { label: "2", value: "mb-1 md:mb-2" },
                    { label: "4", value: "mb-2 md:mb-4" },
                    { label: "6", value: "mb-3 md:mb-6" },
                  ],
                },
              ],
            },
          ],
        },
        {
          slug: "buttons",
          labels: { singular: "Button", plural: "Buttons" },
          fields: [
            {
              ...link({
                appearances: ["default", "destructive", "ghost", "outline", "link", "secondary"],
                required: false,
                overrides: {
                  name: "link",
                  label: "Link",
                },
              }),
            },
            {
              name: "casing",
              label: "Case",
              type: "select",
              defaultValue: "",
              options: [
                { label: "Default", value: "" },
                { label: "Uppercase", value: "uppercase" },
                { label: "Lowercase", value: "lowercase" },
                { label: "Capitalize", value: "capitalize" },
              ],
            }
          ],
        },
      ],
    },
  ],
};
