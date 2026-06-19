import { getPayload } from "payload";
import config from "@payload-config";
import nodemailer from "nodemailer";
import { Settings } from "@/payload-types";

export const dynamicTransport = {
  name: "dynamic-payload-transport",
  version: "1.0.0",
  verify: function (callback) {
    // We cannot verify the connection yet because we haven't loaded the credentials.
    // We return success so Payload boots up without crashing.
    if (callback) {
      callback(null, true);
    }
    return Promise.resolve(true);
  },
  sendMail: async (mailData) => {
    try {
      const payload = await getPayload({ config });

      const settings: Settings = await payload.findGlobal({
        slug: "settings",
        depth: 0,
      });

      const inputData = mailData.data || mailData;

      let result;
      let formattedFrom;
      if (!settings || !settings.smtpEnabled) {
        const emailServer = process.env.EMAIL_SERVER;

        const defaultFromAddress = process.env.EMAIL_FROM || "";
        const defaultFromName = process.env.EMAIL_APP_NAME || "";
        formattedFrom = defaultFromName ? `"${defaultFromName}" <${defaultFromAddress}>` : defaultFromAddress;
        
        if (emailServer) {
          const transporter = nodemailer.createTransport(emailServer);
          result = await transporter.sendMail({ ...inputData, from: formattedFrom });
        } else {
          const transporter = nodemailer.createTransport({
            sendmail: true,
            newline: "unix",
            path: "/usr/sbin/sendmail",
          });

          result = await transporter.sendMail({ ...inputData, from: formattedFrom });
        }
      } else {
        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: Number(settings.smtpPort),
          secure: Number(settings.smtpPort) === 465,
          auth: {
            user: settings.smtpUsername,
            pass: settings.smtpPassword,
          },
        });

        formattedFrom = settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail;
        result = await transporter.sendMail({ ...inputData, from: formattedFrom });
      }


      try {
        await payload.create({
          collection: "email-logs",
          data: {
            to: typeof inputData.to === "string" ? inputData.to : Array.isArray(inputData.to) ? inputData.to.join(", ") : "",
            from: formattedFrom,
            subject: inputData.subject || "",
            html: typeof inputData.html === "string" ? inputData.html : "",
            bcc: typeof inputData.bcc === "string" ? inputData.bcc : Array.isArray(inputData.bcc) ? inputData.bcc.join(", ") : "",
            replyTo: typeof inputData.replyTo === "string" ? inputData.replyTo : Array.isArray(inputData.replyTo) ? inputData.replyTo.join(", ") : "",
          },
        });
      } catch (logError) {
        console.error("Failed to log email:", logError);
      }

      return result;
    } catch (err) {
      console.error("Dynamic Transport Error:", err);
      throw err;
    }
  },
};
