import { Facebook, generateState } from "arctic";
import { AuthProvider } from "../types";

export const FacebookProvider: AuthProvider = {
  slug: "facebook",
  label: "Facebook",
  settingsFields: [
    { name: "clientId", type: "text", required: true, label: "App ID" },
    { name: "clientSecret", type: "text", required: true, label: "App Secret" },
  ],

  generateAuthUrl: async ({ settings, redirectUri }) => {
    const facebook = new Facebook(settings.clientId, settings.clientSecret, redirectUri);
    const state = generateState();

    const url = await facebook.createAuthorizationURL(state, ["public_profile", "email"]);

    return {
      status: "redirect",
      url: url.toString(),
      cookiesToSet: [{ name: "facebook_oauth_state", value: state, options: { httpOnly: true, maxAge: 600 } }],
    };
  },

  authenticate: async ({ settings, searchParams, cookies, redirectUri }) => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = cookies.get("facebook_oauth_state");

    if (!code || !state || !storedState || state !== storedState) {
      return { status: "error", message: "Invalid state or code" };
    }

    try {
      const facebook = new Facebook(settings.clientId, settings.clientSecret, redirectUri);
      const tokens = await facebook.validateAuthorizationCode(code);

      // Fetch Profile from Graph API
      const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokens.accessToken}`);
      const user = await response.json();

      return {
        status: "success",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.picture?.data?.url,
        },
      };
    } catch (error) {
      console.error(error);
      return { status: "error", message: "Facebook authentication failed" };
    }
  },
};
