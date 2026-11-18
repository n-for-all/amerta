import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { CJImporter } from "../services/cjImporter";

export const importProductEndpoint: Endpoint = {
  path: "/cj-dropshipping/import",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const body = req.json ? await req.json() : req.body;
      const { pid, pids, customTitle, customPrice, salesChannelId, categoryId, collectionId, publishStatus, selectedVariantVids } = body || {};
      const ignoreRules = body?.ignoreRules === true;

      if (!pid && (!Array.isArray(pids) || pids.length === 0)) {
        return Response.json({ error: "Please provide a 'pid' or 'pids' array to import." }, { status: 400 });
      }

      // Single Product Import
      if (pid) {
        const result = await CJImporter.importProduct(req.payload, {
          pid,
          customTitle,
          customPrice,
          salesChannelId,
          categoryId,
          collectionId,
          publishStatus,
          selectedVariantVids,
          ignoreRules,
        });

        return Response.json(result);
      }

      // Batch Import
      const results: any[] = [];
      const errors: string[] = [];

      for (const singlePid of pids) {
        try {
          const res = await CJImporter.importProduct(req.payload, {
            pid: singlePid,
            salesChannelId,
            categoryId,
            collectionId,
            publishStatus,
            ignoreRules,
          });
          results.push({ pid: singlePid, ...res });
        } catch (err: any) {
          errors.push(`PID ${singlePid}: ${err.message}`);
        }
      }

      return Response.json({
        success: results.length > 0,
        importedCount: results.length,
        failedCount: errors.length,
        results,
        errors,
      });
    } catch (err: any) {
      console.error("[CJ Import Endpoint Error]:", err);
      return Response.json(
        {
          error: err.message || "Failed to import product from CJ Dropshipping.",
        },
        { status: 400 },
      );
    }
  }),
};
