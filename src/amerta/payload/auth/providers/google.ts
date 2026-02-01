import { AuthProvider } from "../types";
import { Google, generateState, generateCodeVerifier } from "arctic";

export const GoogleProvider: AuthProvider = {
  slug: "google",
  label: "Google",

  // Payload Admin Fields
  settingsFields: [
    {
      name: "clientId",
      type: "text",
      required: true,
    },
    {
      name: "clientSecret",
      type: "text",
      required: true,
      admin: {
        description: "From Google Cloud Console",
      },
    },
  ],

  // Step 1: Create the Redirect URL
  generateAuthUrl: async ({ settings, redirectUri }) => {
    // Initialize Arctic with settings from Payload DB
    const google = new Google(settings.clientId, settings.clientSecret, redirectUri);

    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = await google.createAuthorizationURL(state, codeVerifier, ["profile", "email"]);

    return {
      status: "redirect",
      url: url.toString(),
      cookiesToSet: [
        { name: "google_oauth_state", value: state, options: { httpOnly: true, maxAge: 600 } },
        { name: "google_code_verifier", value: codeVerifier, options: { httpOnly: true, maxAge: 600 } },
      ],
    };
  },

  // Step 2: Validate User
  authenticate: async ({ settings, searchParams, cookies, redirectUri }) => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = cookies.get("google_oauth_state");
    const storedVerifier = cookies.get("google_code_verifier");

    // Validation
    if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
      return { status: "error", message: "Invalid state or code" };
    }

    try {
      const google = new Google(settings.clientId, settings.clientSecret, redirectUri);
      const tokens = await google.validateAuthorizationCode(code, storedVerifier);

      // Fetch User Profile
      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const googleUser = await response.json();

      return {
        status: "success",
        user: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          id: googleUser.sub,
        },
      };
    } catch (error) {
      console.error(error);
      return { status: "error", message: "Failed to verify Google account" };
    }
  },
};
