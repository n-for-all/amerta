import { getPayload } from "payload";
import config from "@payload-config";
import nodemailer from "nodemailer";
import { Settings } from "@/payload-types";

const buildLogData = (inputData: any, formattedFrom: string, status: "sent" | "failed", error?: string) => ({
  to: typeof inputData.to === "string" ? inputData.to : Array.isArray(inputData.to) ? inputData.to.join(", ") : "",
  from: formattedFrom,
  subject: inputData.subject || "",
  html: typeof inputData.html === "string" ? inputData.html : "",
  bcc: typeof inputData.bcc === "string" ? inputData.bcc : Array.isArray(inputData.bcc) ? inputData.bcc.join(", ") : "",
  replyTo: typeof inputData.replyTo === "string" ? inputData.replyTo : Array.isArray(inputData.replyTo) ? inputData.replyTo.join(", ") : "",
  status,
  ...(error ? { error } : {}),
});

export const dynamicTransport = {
  name: "dynamic-payload-transport",
  version: "1.0.0",
  verify: function (callback) {
    if (callback) callback(null, true);
    return Promise.resolve(true);
  },
  sendMail: async (mailData) => {
    const payload = await getPayload({ config });

    const settings: Settings = await payload.findGlobal({ slug: "settings", depth: 0 });
    const inputData = mailData.data || mailData;

    let formattedFrom = "";
    let result;
    let sendError: string | undefined;

    try {
      if (!settings || !settings.smtpEnabled) {
        const emailServer = process.env.EMAIL_SERVER;
        const defaultFromAddress = process.env.EMAIL_FROM || "";
        const defaultFromName = process.env.EMAIL_APP_NAME || "";
        formattedFrom = defaultFromName ? `"${defaultFromName}" <${defaultFromAddress}>` : defaultFromAddress;

        const transporter = emailServer
          ? nodemailer.createTransport(emailServer)
          : nodemailer.createTransport({ sendmail: true, newline: "unix", path: "/usr/sbin/sendmail" });

        result = await transporter.sendMail({ ...inputData, from: formattedFrom });
      } else {
        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: Number(settings.smtpPort),
          secure: Number(settings.smtpPort) === 465,
          auth: { user: settings.smtpUsername, pass: settings.smtpPassword },
        });

        formattedFrom = settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail || "";
        result = await transporter.sendMail({ ...inputData, from: formattedFrom });
      }
    } catch (err: any) {
      sendError = err?.message || String(err);
      console.error("Dynamic Transport Error:", err);
    }

    // Always log — success or failure
    try {
      await payload.create({
        collection: "email-logs",
        overrideAccess: true,
        data: buildLogData(inputData, formattedFrom, sendError ? "failed" : "sent", sendError),
      });
    } catch (logError) {
      console.error("Failed to save email log:", logError);
    }

    if (sendError) {
      // Re-throw for test emails so test endpoints/UI can surface the exact error to the admin
      const isTestEmail =
        inputData.subject === "Test Email from Payload" ||
        inputData.headers?.["x-throw-error"] === "true";

      if (isTestEmail) {
        throw new Error(sendError);
      }

      // Return a failure result so transactional app flows (like checkout) are not aborted by SMTP outages
      return {
        messageId: null,
        error: sendError,
        rejected: Array.isArray(inputData.to) ? inputData.to : [inputData.to],
      };
    }
    return result;
  },
};
