"use server";

import { Config } from "payload";
import { getGlobal } from "@/amerta/utilities/getGlobals";
import { Settings } from "@/payload-types";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { getURL } from "@/amerta/utilities/getURL";
import { getAdminURL } from "../getAdminURL";

export async function getDefaultEmailTemplateSettings() {
  const settings: Settings = await getGlobal("settings" as keyof Config["globals"], 1);
  let content = "";
  try {
    content = convertLexicalToHTML({ data: settings.emailFooterHtml || { root: { children: [], direction: "ltr", format: "", indent: 0, type: "root", version: 1 } } });
  } catch {}

  const defaultDateFormat = settings.dateFormat || "MMM dd, yyyy";

  return {
    url: getURL("/"),
    verify_url: getURL(`/verify-email`),
    reset_password_url: getURL(`/reset-password`),
    admin_user_url: getAdminURL(`/collections/users`),
    logo: settings.emailLogo || null,
    color: settings.emailThemeColor || null,
    fromName: settings.fromName || null,
    fromEmail: settings.fromEmail || null,
    siteName: settings.siteTitle || null,
    siteDescription: settings.siteDescription || null,
    footerAddress: settings.emailFooterAddress || null,
    footerEmail: settings.emailFooterEmail || null,
    footerPhone: settings.emailFooterPhone || null,
    footerHtml: content,
    defaultDateFormat: defaultDateFormat,
    settings: settings,
  };
}
