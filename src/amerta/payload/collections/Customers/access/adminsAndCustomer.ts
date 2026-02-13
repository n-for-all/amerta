/**
 * @module Collections/Customers/Access
 * @title Admins and Customer Access
 * @description This access control allows admins to access all customer data and customers to access their own data.
 */

import { checkRole } from "@/amerta/access/checkRole";
import type { Access } from "payload";

const adminsAndCustomer: Access = ({ req }) => {
  if (checkRole(["admin"], req.user)) {
    return true;
  }

  if (req.user) {
    return {
      id: {
        equals: req.user.id,
      },
    };
  }

  return false;
};

export default adminsAndCustomer;
