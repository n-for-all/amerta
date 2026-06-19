import { PayloadHandler } from "payload";
import { checkRole } from "@/amerta/access/checkRole";
import { User } from "@/payload-types";

export const withGuard = (handler: PayloadHandler): PayloadHandler => {
  return async (req) => {
    if (!req.user || !checkRole(["admin"], req.user as User)) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    return handler(req);
  };
};