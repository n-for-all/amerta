import type { Payload } from "payload";
import { revalidateTag } from "next/cache";
import { getServerSideURL } from "./getURL";

export const revalidate = async (args: { collection: string; slug: string; payload: Payload }): Promise<void> => {
  const { collection, slug, payload } = args;

  try {
    const res = await fetch(`${getServerSideURL()}/next/revalidate?secret=${process.env.REVALIDATION_KEY}&collection=${collection}&slug=${slug}`);

    if (res.ok) {
      payload.logger.info(`Revalidated page '${slug}' in collection '${collection}'`);
    } else {
      payload.logger.error(`Error revalidating page '${slug}' in collection '${collection}': ${res}`);
    }
  } catch (err: unknown) {
    payload.logger.error(`Error hitting revalidate route for page '${slug}' in collection '${collection}': ${err}`);
  }
};

/** Signature for /next/revalidate?tags=…, derived from PAYLOAD_SECRET so no extra env var is needed. */
export const revalidationToken = async (tags: string) => {
  const { createHmac } = await import("crypto");
  return createHmac("sha256", process.env.PAYLOAD_SECRET || "").update(`revalidate:${tags}`).digest("hex");
};

/**
 * Expire cached data (unstable_cache tags) after a change. Use this in hooks instead of calling revalidateTag directly.
 *
 * Changes made through the MCP connection run while its response is being streamed, after Next.js has already
 * processed this request's revalidations, so revalidateTag alone is silently dropped there. For those requests the
 * tags are also expired from a separate request to /next/revalidate.
 */
export const revalidateCacheTags = (tags: string[], req?: { payloadAPI?: string } | null) => {
  try {
    for (const tag of tags) revalidateTag(tag, { expire: 0 });
  } catch (err) {
    // Outside a Next.js request (e.g. `payload run` scripts) there is no cache to expire
    if (req?.payloadAPI !== "MCP") console.warn(`[revalidate] ${tags.join(",")}: ${(err as Error)?.message}`);
  }
  if (req?.payloadAPI === "MCP") {
    const list = tags.join(",");
    // Small delay so the change is committed before the cached data is rebuilt
    setTimeout(async () => {
      try {
        const res = await fetch(`${getServerSideURL()}/next/revalidate?tags=${encodeURIComponent(list)}&token=${await revalidationToken(list)}`, { cache: "no-store" });
        if (!res.ok) console.error(`[revalidate] ${list}: HTTP ${res.status}`);
      } catch (err) {
        console.error(`[revalidate] ${list}:`, err);
      }
    }, 500);
  }
};
