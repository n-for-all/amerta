import { revalidateTag } from "next/cache";
import { AfterChangeHook } from "node_modules/payload/dist/globals/config/types";

export const revalidateHeader: AfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`);

    revalidateTag("global_header", "max");
  }

  return doc;
};
