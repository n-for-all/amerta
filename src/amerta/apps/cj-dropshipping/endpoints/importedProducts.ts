import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";

export const importedProductsEndpoint: Endpoint = {
  path: "/cj-dropshipping/imported",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const url = new URL(req.url || "", "http://localhost");
      const limit = parseInt(url.searchParams.get("limit") || "100", 10);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const query = url.searchParams.get("query")?.trim() || "";

      const whereConditions: any[] = [
        { sku: { contains: "CJ" } },
        { "variants.sku": { contains: "CJ" } },
        { slug: { contains: "cj" } },
      ];

      // Query products imported from CJ
      const result = await req.payload.find({
        collection: "products",
        where: query
          ? {
              and: [
                { or: whereConditions },
                {
                  or: [
                    { title: { contains: query } },
                    { sku: { contains: query } },
                  ],
                },
              ],
            }
          : {
              or: whereConditions,
            },
        limit,
        page,
        sort: "-createdAt",
        depth: 1,
      });

      return Response.json({
        success: true,
        docs: result.docs,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
      });
    } catch (err: any) {
      console.error("[CJ Imported Products Error]:", err);
      return Response.json(
        { error: err.message || "Failed to fetch imported products." },
        { status: 500 },
      );
    }
  }),
};
