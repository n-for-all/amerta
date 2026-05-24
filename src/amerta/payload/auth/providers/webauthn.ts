import type { AuthProvider } from "../types";

export const WebAuthnProvider: AuthProvider = {
  slug: "webauthn",
  label: "WebAuthn / Passkeys",

  settingsFields: [
    {
      name: "enabled",
      label: "Enable Passkeys",
      type: "checkbox",
      defaultValue: true,
    },
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
};

export default WebAuthnProvider;
