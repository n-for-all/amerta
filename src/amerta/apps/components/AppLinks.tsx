import React from "react";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { availableApps } from "../index";
import { getNavPrefs } from "@/amerta/components/Imports/getNavPrefs";
import { AppsNav } from "./AppsNav";

export const AppLinks = async ({ req }) => {
  const payload = await getPayload({ config: configPromise });

  let activeApps: string[] = [];
  try {
    const settings = await payload.findGlobal({
      slug: "apps",
      depth: 0,
    });
    if (settings && settings.activeApps) {
      activeApps = settings.activeApps as string[];
    }
  } catch (error) {
    // Global might not be created yet, ignore
  }

  const appsToRender = activeApps && activeApps.length > 0
    ? availableApps
        .filter((app) => activeApps.includes(app.slug) && app.adminNavigation)
        .map((app) => ({
          slug: app.slug,
          adminNavigation: app.adminNavigation,
        }))
    : [];

  const navPreferences = req ? await getNavPrefs(req) : null;

  return <AppsNav navPreferences={navPreferences} appsToRender={appsToRender} />;
};

export default AppLinks;
