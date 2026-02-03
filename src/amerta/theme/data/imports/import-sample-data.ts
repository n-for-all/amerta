import { PayloadRequest } from "payload";
import { importWooProductsJSON } from "@/amerta/theme/data/imports/import-woo-products";
import productsArray from "@/amerta/theme/data/products.json";

export const importSampleDataHandler = async (req: PayloadRequest): Promise<Response> => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!Array.isArray(productsArray)) {
          throw new Error("JSON root must be an Array []");
        }

        await importWooProductsJSON(req, productsArray, {
          signal: req.signal,

          onProgress: (data) => {
            const jsonString = JSON.stringify(data);
            controller.enqueue(encoder.encode(jsonString + "\n"));
          },
        });

        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
        controller.close();
      } catch (error: any) {
        const errorJson = JSON.stringify({ error: error.message });
        controller.enqueue(encoder.encode(errorJson + "\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
};
