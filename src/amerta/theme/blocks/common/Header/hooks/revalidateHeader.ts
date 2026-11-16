import { revalidateCacheTags } from "@/amerta/utilities/revalidate";
import { GlobalAfterChangeHook } from "payload";


export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!req.context.disableRevalidate) {
    req.payload.logger.info(`Revalidating header`);

    revalidateCacheTags(["global_header"], req);
  }

  return doc;
};
