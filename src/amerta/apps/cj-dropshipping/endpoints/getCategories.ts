import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { CJClient } from "../services/cjClient";

export const getCategoriesEndpoint: Endpoint = {
  path: "/cj-dropshipping/categories",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const categories = await CJClient.getCategories();
      return Response.json({
        success: true,
        categories,
      });
    } catch (err: any) {
      return Response.json(
        {
          error: err.message || "Failed to fetch CJ categories.",
        },
        { status: 400 },
      );
    }
  }),
};
