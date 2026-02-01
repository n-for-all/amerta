import { PayloadRequest } from "payload";
import jwt from "jsonwebtoken";

export const getMeHandler = async (req: PayloadRequest) => {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("JWT ", "").trim() : null;

    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, req.payload.secret) as { id: string; collection: string };
      userId = decoded.id;
    } catch (err) {
      console.error("Invalid token:", err);
      return Response.json({ message: "Invalid Token" }, { status: 403 });
    }

    const customer = await req.payload.findByID({
      collection: "customers",
      id: userId,
      depth: 2,
    });

    if (!customer) {
      return Response.json({ message: "Customer not found" }, { status: 404 });
    }

    return Response.json({ customer });
  } catch (error: any) {
    console.error("Error fetching customer data:", error);
    return Response.json({ message: "Error fetching customer data", error: error.message }, { status: 500 });
  }
};
