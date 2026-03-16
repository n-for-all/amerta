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
  generateAuthUrl: async ({ settings, redirectUri, locale }) => {
    // Initialize Arctic with settings from Payload DB
    const google = new Google(settings.clientId, settings.clientSecret, redirectUri);

    const codeVerifier = generateCodeVerifier();
    // 1. Generate the random part for CSRF protection
    const randomValue = generateState();

    // 2. Combine it with your locale (and any other metadata)
    const statePayload = {
      token: randomValue,
      locale: locale || "en", // default to 'en'
    };

    const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");
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
  // Step 2: Validate User
  authenticate: async ({ settings, searchParams, cookies, redirectUri }) => {
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is your Base64 string
    const storedState = cookies.get("google_oauth_state");
    const storedVerifier = cookies.get("google_code_verifier");

    // 1. Basic Validation
    if (!code || !state || !storedState || !storedVerifier || state !== storedState) {
      return { status: "error", message: "Invalid state or code" };
    }

    // 2. Extract Dynamic Data from State
    let locale = "en"; // Default
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64url").toString());
      locale = decodedState.locale;
    } catch (e) {
      console.error("Failed to decode state metadata", e);
    }

    try {
      const google = new Google(settings.clientId, settings.clientSecret, redirectUri);
      const tokens = await google.validateAuthorizationCode(code, storedVerifier);

      const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      });
      const googleUser = await response.json();

      return {
        status: "success",
        locale: locale, // Pass the locale back up to your router
        user: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          id: googleUser.sub,
          // PRO TIP: Save the tokens here if you need to post to social media later!
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    } catch (error) {
      console.error(error);
      return { status: "error", message: "Failed to verify Google account" };
    }
  },
};
