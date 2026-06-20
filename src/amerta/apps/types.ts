import { Config } from "payload";

export interface AmertaApp {
  /** The human-readable name of the app */
  name: string;
  /** Unique identifier for the app (e.g., 'google-merchant') */
  slug: string;
  /** Short description of what the app does */
  description: string;
  /** Version string */
  version: string;
  /** Navigation details to inject a link in the Payload admin sidebar */
  adminNavigation?: {
    /** The text to display in the menu */
    label: string;
    /** The path to navigate to (e.g., '/admin/google-merchant') */
    path: string;
  };
  /** Optional: Modify the Payload config dynamically (Note: limited dynamically at runtime without server restart) */
  extendConfig?: (config: Config) => Config;
}
