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

      if (!settings || !settings.smtpEnabled) {
        const emailServer = process.env.EMAIL_SERVER;

        const defaultFromAddress = process.env.EMAIL_FROM || "";
        const defaultFromName = process.env.EMAIL_APP_NAME || "";
        const formattedFrom = defaultFromName ? `"${defaultFromName}" <${defaultFromAddress}>` : defaultFromAddress;
        
        if (emailServer) {
          const transporter = nodemailer.createTransport(emailServer);
          const result = await transporter.sendMail({ ...inputData, from: formattedFrom });
          return result;
        }

        const transporter = nodemailer.createTransport({
          sendmail: true,
          newline: "unix",
          path: "/usr/sbin/sendmail",
        });

        const result = await transporter.sendMail({ ...inputData, from: formattedFrom });
        return result;
      }

      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: Number(settings.smtpPort),
        secure: Number(settings.smtpPort) === 465,
        auth: {
          user: settings.smtpUsername,
          pass: settings.smtpPassword,
        },
      });

      const formattedFrom = settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail;
      const result = await transporter.sendMail({ ...inputData, from: formattedFrom });

      return result;
    } catch (err) {
      console.error("Dynamic Transport Error:", err);
      throw err;
    }
  },
};
