import { PayloadRequest } from "payload";
import jwt from "jsonwebtoken";
import { CUSTOMER_AUTH_TOKEN } from "@/amerta/constants";
import { cookies } from "next/headers";

export const getMeHandler = async (req: PayloadRequest) => {
  try {
    let token: string | null = null;
    const cookieHeader = await cookies();
    if (cookieHeader) {
      token = cookieHeader.get(CUSTOMER_AUTH_TOKEN)?.value || null;
    }

    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, req.payload.secret) as { id: string; collection: string };
      userId = decoded.id;
    } catch (err) {
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
