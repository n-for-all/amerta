import { PayloadHandler } from "payload";
import { checkRole } from "@/amerta/access/checkRole";

export const withGuard = (handler: PayloadHandler): PayloadHandler => {
  return async (req) => {
    if (!req.user || !checkRole(["admin"], req.user)) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    return handler(req);
  };
};