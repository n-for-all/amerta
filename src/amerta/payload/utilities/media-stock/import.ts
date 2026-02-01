import { revalidatePath } from "next/cache";
import { PayloadRequest } from "payload";

export const importMediaStock = async (req: PayloadRequest) => {
  if (!req.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl, alt, collection } = await req.json!();

  try {
    const imgReq = await fetch(imageUrl);
    const arrayBuffer = await imgReq.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `${alt.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.jpg`;

    const mediaDoc = await req.payload.create({
      collection: collection || "media",
      data: {
        alt: alt,
      },
      file: {
        data: buffer,
        mimetype: "image/jpeg",
        name: filename,
        size: buffer.length,
      },
    });

    const adminRoute = req.payload.config.routes.admin;

    const path = `${adminRoute}/collections/${collection}`;
    revalidatePath(path);

    return Response.json(mediaDoc);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to import image" }, { status: 500 });
  }
};
