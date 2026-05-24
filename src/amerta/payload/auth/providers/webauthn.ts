import { AuthProvider, AuthResult } from "../types";

// WebAuthn is not an OAuth provider - it uses a different flow (registration/authentication API endpoints)
export const WebAuthnProvider: AuthProvider = {
  slug: "webauthn",
  label: "WebAuthn / Passkeys",

  settingsFields: [
    {
      name: "rpName",
      label: "Relying Party Name",
      type: "text",
      admin: {
        description: "Friendly name shown during registration (e.g. Your Shop)",
      },
    },
    {
      name: "rpID",
      label: "Relying Party ID (rpId)",
      type: "text",
      admin: {
        description:
          "Registrable domain (e.g. example.com). If empty, it will be derived from request host.",
      },
    },
    {
      name: "allowedOrigins",
      label: "Allowed Origins",
      type: "array",
      fields: [{ name: "origin", type: "text" }],
      admin: {
        description:
          "Optional list of allowed origins for deriving fallback origins. Include NEXT_PUBLIC_SERVER_URL if used.",
      },
    },
    {
      name: "attestationType",
      label: "Attestation Type",
      type: "select",
      options: [
        { label: "None", value: "none" },
        { label: "Indirect", value: "indirect" },
        { label: "Direct", value: "direct" },
      ],
      defaultValue: "direct",
    },
    {
      name: "userVerification",
      label: "User Verification",
      type: "select",
      options: [
        { label: "Required", value: "required" },
        { label: "Preferred", value: "preferred" },
        { label: "Discouraged", value: "discouraged" },
      ],
      defaultValue: "preferred",
    },
    {
      name: "challengeTTLSeconds",
      label: "Challenge TTL (seconds)",
      type: "number",
      admin: {
        description:
          "Time-to-live for registration/auth challenges in seconds (default: 300)",
      },
      defaultValue: 300,
    },
  ],

  // WebAuthn doesn't use OAuth redirect flow - authentication happens via API endpoints
  generateAuthUrl: async (): Promise<AuthResult> => {
    return {
      status: "error",
      message: "WebAuthn does not use redirect-based authentication. Use the WebAuthn API endpoints instead.",
    };
  },

  // WebAuthn doesn't use OAuth callback flow - authentication happens via API endpoints
  authenticate: async (): Promise<AuthResult> => {
    return {
      status: "error",
      message: "WebAuthn authentication is handled via dedicated API endpoints, not OAuth callback.",
    };
  },
};

export default WebAuthnProvider;
