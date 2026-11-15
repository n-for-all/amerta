import { getServerSideURL } from "./getURL";

export const getAdminSideURL = () => {
  return getServerSideURL() + "/" + trimSlashes(process.env.PAYLOAD_ADMIN_ROUTE || "admin");
};

export const getAdminPath = () => {
  return trimSlashes(process.env.PAYLOAD_ADMIN_ROUTE || "admin");
};

const trimSlashes = (str: string) => str.replace(/^\/+|\/+$/g, "");

export const getAdminURL = (path: string): string => {
  const pathParts: string[] = [getAdminSideURL()];
  pathParts.push(trimSlashes(path || ""));
  return pathParts.filter(Boolean).join("/");
};

export const getAdminApiURL = (path: string): string => {
  const pathParts: string[] = [getServerSideURL(), "api"];
  pathParts.push(trimSlashes(getAdminPath()));
  pathParts.push(trimSlashes(path || ""));
  return pathParts.filter(Boolean).join("/");
};

/**
 * Relative admin path (e.g. "/admin/globals/apps") for links rendered inside the admin.
 * Same-origin, so it works on any host/port regardless of NEXT_PUBLIC_SERVER_URL.
 * Use getAdminURL() only where an absolute URL is required (e.g. emails).
 */
export const getAdminRelativeURL = (path: string): string => {
  return "/" + [getAdminPath(), trimSlashes(path || "")].filter(Boolean).join("/");
};
