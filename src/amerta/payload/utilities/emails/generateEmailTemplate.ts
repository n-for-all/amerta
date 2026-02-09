"use server";

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getDefaultEmailTemplateSettings } from "./getDefaultEmailTemplateSettings";
import nunjucks from "nunjucks";
import { format } from "date-fns";
import { ADMIN_EMAILS, CUSTOMER_EMAILS } from "@/amerta/collections/EmailTemplates";
import { Customer, User } from "@/payload-types";

type CustomerEmail = typeof CUSTOMER_EMAILS[number];
export async function generateEmailTemplate(name: CustomerEmail) {
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

  const templateDoc = emailTemplateQuery.docs[0]!;

  const getTemplate = async ({ props }: { props?: Record<string, any> }) => {
    const mergedContext = {
      ...defaultTemplateSettings,
      ...props,
    };

    const subject = nunjucks.renderString(templateDoc.subject, mergedContext);
    const html = nunjucks.renderString(templateDoc.body, mergedContext);

    return { subject, html };
  };

  const sendTemplate = async ({ customer, props }: { customer: Customer; props?: Record<string, any> }) => {
    const mergedContext = {
      ...defaultTemplateSettings,
      ...props,
    };

    const subject = nunjucks.renderString(templateDoc.subject, mergedContext);
    const html = nunjucks.renderString(templateDoc.body, mergedContext);
    const to = ADMIN_EMAILS.includes(name as typeof ADMIN_EMAILS[number]) ? ((templateDoc.staffRecipients || []) as User[]).map((r: User) => r.email).join(",") || "" : customer.hasAccount === "1" ? customer.email : customer.contact_email || "";

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
