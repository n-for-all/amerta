import { PayloadRequest } from "payload";

export const searchMediaStock = async (req: PayloadRequest) => {
  if (!req.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const query = req.query.q;
  const page = req.query.page || 1;
  const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=20&client_id=${UNSPLASH_KEY}`);
    const data = await response.json();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch from Unsplash" }, { status: 500 });
  }
};
