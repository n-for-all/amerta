import { getURL } from "@/amerta/utilities/getURL";
import { sendVerificationEmail } from "@/amerta/utilities/emails/sendVerificationEmail";
import crypto from "crypto";

export const verifyEmail = async (req) => {
  const { email, triggerVerification } = req.json ? await req.json() : {};

  if (!triggerVerification || !email) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const result = await req.payload.find({
      collection: "customers",
      where: {
        email: { equals: email },
      },
    });

    const user = result.docs[0];

    if (!user) {
      return Response.json({ message: "If an account exists, a verification email has been sent." });
    }

    if (user._verified) {
      return Response.json({ message: "If an account exists, a verification email has been sent." });
    }

    const verificationToken = crypto.randomBytes(20).toString("hex");

    await req.payload.update({
      collection: "customers",
      id: user.id,
      data: {
        _verificationToken: verificationToken,
      },
    });

    const defaultLocale = (req.payload.config.localization as { defaultLocale: string })?.defaultLocale || "en";

    const locale = req.locale || defaultLocale;
    const verifyUrl = getURL(`/verify-email?token=${verificationToken}`, locale);

    await sendVerificationEmail(user, verifyUrl);

    return Response.json({ message: "If an account exists, a verification email has been sent." });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
