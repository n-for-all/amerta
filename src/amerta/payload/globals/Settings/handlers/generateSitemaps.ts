import { PayloadHandler } from "payload";
import { checkRole } from "@/amerta/access/checkRole";
import { User } from "@/payload-types";
import { revalidatePath } from "next/cache";

export const generateSitemapsHandler: PayloadHandler = async (req) => {
  if (!req.user || !checkRole(["admin"], req.user as User)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Revalidate the native Next.js sitemap route
    revalidatePath("/sitemap.xml");
    revalidatePath("/sitemap.xml", "page");
    revalidatePath("/", "layout");
    
    return Response.json({ success: true, message: "Sitemap revalidation triggered successfully!" });
  } catch (error: any) {
    console.error("Sitemap revalidation error:", error);
    return Response.json({ error: "Failed to trigger sitemap revalidation", details: error.message }, { status: 500 });
  }
};
