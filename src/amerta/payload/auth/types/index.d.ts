import { Field, PayloadRequest } from "payload";
export type AuthResult =
  | {
      status: "success";
      user: {
        email: string;
        name?: string;
        avatar?: string;
        id?: string;
      };
      tokens?: { accessToken?: string; idToken?: string };
    }
  | {
      status: "redirect";
      url: string;
      cookiesToSet?: {
        name: string;
        value: string;
        options?: { secure?: boolean; httpOnly?: boolean; maxAge?: number };
      }[];
    }
  | {
      status: "error";
      message: string;
    };

export interface AuthProvider {
  slug: string;
  label: string;

  settingsFields: Field[];

  generateAuthUrl: (args: { req: PayloadRequest; settings: any; redirectUri: string }) => Promise<AuthResult>;

  authenticate: (args: { req: PayloadRequest; settings: any; searchParams: URLSearchParams; cookies: Map<string, string>; redirectUri: string }) => Promise<AuthResult>;
}
