import { GlobalConfig } from "payload";
import { availableApps } from "./index";

export const AppSettings: GlobalConfig = {
  slug: "apps",
  label: "Settings",
  admin: {
    group: false,
    description: "Manage installed apps and features.",
    components: {
      elements: {
        beforeDocumentControls: ["@/amerta/apps/components/ReloadOnSave#ReloadOnSave"],
      },
    },
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: "activeApps",
      type: "select",
      hasMany: true,
      label: "Active Apps",
      admin: {
        description: "Select which apps should be active.",
      },
      options: availableApps.map((app) => ({
        label: app.name,
        value: app.slug,
      })),
    },
    {
      name: "appSettings",
      type: "json",
      label: "App Settings Store",
      admin: {
        description: "Internal JSON store for all app configurations. (Key = App Slug, Value = App Settings)",
      },
    },
  ],
};
