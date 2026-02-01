import { Access, AccessArgs } from "payload";
import type { User } from "@/payload-types";

export const customerOrAnonymous: Access = ({ req }: AccessArgs<User>) => {
  if (req.user?.collection === "users") return false;

  if (req.user?.collection === "customers") {
    return {
      customer: {
        equals: req.user.id,
      },
    };
  }

  return true;
};
