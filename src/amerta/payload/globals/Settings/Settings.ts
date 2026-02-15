import { revalidatePath, revalidateTag } from "next/cache";
import { GlobalConfig } from "payload";
import { SEOFields } from "./fields/seo";
import { EmailFields } from "./fields/emails";
import { GeneralFields } from "./fields/general";
import { LocalizationFields } from "./fields/localization";
import { NotificationsFields } from "./fields/notifications";
import { GTagFields } from "./fields/gtag";
import { ManifestFields } from "./fields/manifest";
import { SocialMediaFields } from "./fields/social-media";
import { AIFields } from "./fields/ai";
import { admins } from "@/amerta/access/admins";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: {
    singular: "General",
    plural: "General",
  },
  admin: {
    group: "Settings",
  },
  typescript: {
    interface: "Settings",
  },
  access: {
    update: admins,    
    read: () => true,
  },
  hooks: {
    afterChange: [
      async () => {
        revalidatePath("/(.*)", "layout");
        revalidatePath("/manifest.webmanifest");
        revalidatePath("/manifest.json");
        revalidateTag("global_settings", "max");
        revalidateTag("layout", "max");
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "General",
          fields: GeneralFields,
        },
        {
          label: "SEO",
          fields: SEOFields,
        },
        {
          label: "Emails",
          fields: EmailFields,
        },
        {
          label: "Localization",
          fields: LocalizationFields,
        },
        {
          label: "Notifications",
          fields: NotificationsFields,
        },
        {
          label: "Social Media",
          fields: SocialMediaFields,
        },
        {
          label: "AI Settings",
          fields: AIFields,
        },
        {
          label: "Google GTag",
          fields: GTagFields,
        },
        {
          label: "Manifest",
          fields: ManifestFields,
        },
      ],
    },
  ],
};
