import { AuthProvider } from "../types";
import { Apple, generateState } from "arctic";
import jwt from "jsonwebtoken";

export const AppleProvider: AuthProvider = {
  slug: "apple",
  label: "Apple",
  settingsFields: [
    { name: "clientId", type: "text", required: true, label: "Service ID (Client ID)" },
    { name: "teamId", type: "text", required: true, label: "Team ID" },
    { name: "keyId", type: "text", required: true, label: "Key ID" },
    {
      name: "privateKey",
      type: "textarea",
      required: true,
      label: "Private Key (.p8 content)",
    },
  ],

  generateAuthUrl: async ({ settings, redirectUri }) => {
    const apple = new Apple(settings.clientId, settings.teamId, settings.keyId, settings.privateKey, redirectUri);
    const state = generateState();

    const url = await apple.createAuthorizationURL(state, ["name", "email"]);

    return {
      status: "redirect",
      url: url.toString(),
      cookiesToSet: [{ name: "apple_oauth_state", value: state, options: { httpOnly: true, maxAge: 600 } }],
    };
  },

  authenticate: async ({ settings, searchParams, cookies, redirectUri }) => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = cookies.get("apple_oauth_state");

    if (!code || !state || !storedState || state !== storedState) {
      return { status: "error", message: "Invalid state or code" };
    }

    try {
      const apple = new Apple(settings.clientId, settings.teamId, settings.keyId, settings.privateKey, redirectUri);

      const tokens = await apple.validateAuthorizationCode(code);

      // Apple User info is inside the ID Token (JWT)
      const idToken = tokens.idToken;
      const decoded: any = jwt.decode(idToken);

      // Note: Apple ONLY sends the name on the very first login.
      // Subsequent logins only contain the email and sub (ID).
      // You should handle this in your Payload logic (update name only if present).

      return {
        status: "success",
        user: {
          id: decoded.sub,
          email: decoded.email,
          name: undefined, // Often undefined on re-login
        },
      };
    } catch (error) {
      console.error(error);
      return { status: "error", message: "Apple authentication failed" };
    }
  },
};
