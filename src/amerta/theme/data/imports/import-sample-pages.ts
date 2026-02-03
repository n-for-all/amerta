import { PayloadRequest } from "payload";
import pagesData from "@/amerta/theme/data/pages.json";

export const importPages = async (
  req: PayloadRequest,
  pages: any[], // The array of page objects you pasted
  options: {
    onProgress: (data: { progress: number; message: string; logs?: string[] }) => void;
  }
) => {
  const { payload } = req;
  const logs: string[] = [];

  const log = (msg: string) => {
    logs.push(msg);
    if (logs.length > 50) logs.shift(); // Keep logs clean
  };

  try {
    options.onProgress({ progress: 5, message: "Validating data...", logs });

    const totalPages = pages.length;
    let processedCount = 0;

    for (const pageData of pages) {
      processedCount++;
      const currentProgress = 10 + Math.floor((processedCount / totalPages) * 80);

      options.onProgress({
        progress: currentProgress,
        message: `Processing: ${pageData.title}`,
        logs,
      });

      // 1. Check if page exists by slug
      const existingPages = await payload.find({
        collection: "pages",
        where: {
          slug: {
            equals: pageData.slug,
          },
        },
      });

      if (existingPages.docs.length > 0) {
        log(`Page "${pageData.title}" (/${pageData.slug}) already exists. Skipping.`);
        continue;
      }

      // 2. Create the Page
      // We explicitly remove _status to let Payload handle it (though usually it defaults to draft)
      // or set it to 'published' if desired.
      try {
        await payload.create({
          collection: "pages",
          data: {
            ...pageData,
            _status: "published", // Force publish for sample data
          },
        });
        log(`Created page: "${pageData.title}"`);
      } catch (err: any) {
        console.error(err);
        log(`Error creating "${pageData.title}": ${err.message}`);
      }
    }

    options.onProgress({ progress: 100, message: "Done!", logs });
  } catch (e: any) {
    throw new Error(e.message);
  }
};

// --- API Handler ---
export const importPagesHandler = async (req: PayloadRequest): Promise<Response> => {
  const encoder = new TextEncoder();
  // 2. Start Stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await importPages(req, pagesData, {
          onProgress: (data) => {
            const jsonString = JSON.stringify(data);
            controller.enqueue(encoder.encode(jsonString + "\n"));
          },
        });

        // Done signal
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