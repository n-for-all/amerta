import { PayloadRequest } from "payload";
import postsData from "@/amerta/theme/data/posts.json";

// --- Main Import Logic ---
export const importBlogs = async (
  req: PayloadRequest,
  posts: any[], // Expecting an array
  options: {
    onProgress: (data: { progress: number; message: string; logs?: string[] }) => void;
  }
) => {
  const { payload } = req;
  const logs: string[] = [];

  const log = (msg: string) => {
    logs.push(msg);
    if (logs.length > 50) logs.shift(); 
  };

  try {
    options.onProgress({ progress: 5, message: "Validating data...", logs });

    // FIX: Filter out null/undefined items immediately
    const validPosts = Array.isArray(posts) ? posts.filter((p) => p !== null && typeof p === "object") : [];
    const totalPosts = validPosts.length;
    let processedCount = 0;

    if (totalPosts === 0) {
      log("No valid blog posts found to import.");
      options.onProgress({ progress: 100, message: "Done (No posts found)", logs });
      return;
    }

    for (const postData of validPosts) {
      processedCount++;
      const currentProgress = 10 + Math.floor((processedCount / totalPosts) * 80);

      // Safety check for title
      const title = postData.title || "Untitled Post";

      options.onProgress({
        progress: currentProgress,
        message: `Processing: ${title}`,
        logs,
      });

      // 1. Check if blog post exists by slug
      // If slug is missing, generate one from title
      const slug = postData.slug || title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

      const existingPosts = await payload.find({
        collection: "posts",
        where: {
          slug: {
            equals: slug,
          },
        },
      });

      if (existingPosts.docs.length > 0) {
        log(`Blog "${title}" already exists. Skipping.`);
        continue;
      }

      // 2. Create the Blog Post
      try {
        const postPayload = {
          ...postData,
          slug, // Ensure slug is set
          _status: "published",
          publishedAt: postData.publishedAt ? new Date(postData.publishedAt).toISOString() : new Date().toISOString(),
        };

        console.log(postPayload);

        await payload.create({
          collection: "posts",
          data: postPayload,
        });
        log(`Created blog post: "${title}"`);
      } catch (err: any) {
        console.error(err);
        log(`Error creating "${title}": ${err.message}`);
      }
    }

    options.onProgress({ progress: 100, message: "Done!", logs });
  } catch (e: any) {
    throw new Error(e.message);
  }
};

// --- API Handler ---
export const importBlogsHandler = async (req: PayloadRequest): Promise<Response> => {
  const encoder = new TextEncoder();

  // 2. Start Stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await importBlogs(req, postsData, {
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