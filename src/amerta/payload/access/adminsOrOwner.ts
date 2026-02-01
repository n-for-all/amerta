import { Access, AccessArgs } from "payload";
import { checkRole } from "./checkRole";
import type { User } from "@/payload-types";

export const adminsOrOwner: Access = ({ req }: AccessArgs<User>) => {
  if (checkRole(["admin"], req.user)) {
    return true;
  }

  if(!req.user) {
    return false;
  }

  return {
    customer: {
      equals: req.user.id,
    },
  };
};
