"use server";

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getDefaultEmailTemplateSettings } from "./getDefaultEmailTemplateSettings";
import nunjucks from "nunjucks";
import { User } from "@/payload-types";
import { format } from "date-fns";

export async function generateAdminEmailTemplate(name: string) {
  const payload = await getPayload({ config: configPromise });

  const defaultTemplateSettings = await getDefaultEmailTemplateSettings();

  const emailTemplateQuery = await payload.find({
    collection: "email-templates",
    where: {
      type: {
        equals: name,
      },
      enabled: { equals: true },
    },
    limit: 1,
  });

  if (emailTemplateQuery.totalDocs === 0) {
    throw new Error(`Email template with name "${name}" not found or not enabled.`);
  }

  const templateDoc = emailTemplateQuery.docs[0]!;

  if (!templateDoc.staffRecipients || (templateDoc.staffRecipients as User[]).length === 0) {
    throw new Error(`No staff recipients defined for admin email template "${name}".`);
  }

  if (nunjucks && nunjucks.configure) {
    const env = nunjucks.configure({ autoescape: true });

    // Add the 'date' filter
    env.addFilter("date", function (str, formatStr) {
      if (!str) return "";
      try {
        const date = new Date(str);
        return format(date, formatStr || defaultTemplateSettings.defaultDateFormat || "MMM dd, yyyy");
      } catch {
        return str;
      }
    });
  }

  const getTemplate = async ({ props }: { props?: Record<string, any> }) => {
    const to = ((templateDoc.staffRecipients || []) as User[]).map((user) => user.email).join(", ");
    const mergedContext = {
      ...defaultTemplateSettings,
      ...props,
    };

    const subject = nunjucks.renderString(templateDoc.subject, mergedContext);
    const html = nunjucks.renderString(templateDoc.body, mergedContext);

    return { to, subject, html };
  };

  const sendTemplate = async ({ props }: { props?: Record<string, any> }) => {
    const mergedContext = {
      ...defaultTemplateSettings,
      ...props,
    };

    const to = ((templateDoc.staffRecipients || []) as User[]).map((user) => user.email).join(", ");

    const subject = nunjucks.renderString(templateDoc.subject, mergedContext);
    const html = nunjucks.renderString(templateDoc.body, mergedContext);

    try {
      const emailResult = await payload.sendEmail({
        to,
        from: defaultTemplateSettings.fromEmail,
        replyTo: defaultTemplateSettings.fromEmail,
        bcc: templateDoc.bccAddress || undefined,
        subject,
        html,
      });

      return emailResult;
    } catch (error) {
      console.error(`Failed to send email "${name}":`, error);
      throw error;
    }
  };

  return { sendTemplate, getTemplate };
}
