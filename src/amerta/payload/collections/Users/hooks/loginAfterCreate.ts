/**
 * @module Collections/Users/Hooks
 * @title Login After Create
 * @description This hook logs in the user immediately after they are created.
 */

import { CollectionAfterChangeHook } from "payload";

export const loginAfterCreate: CollectionAfterChangeHook = async ({ doc, req, req: { payload, body = {} }, operation }: { doc: any; req: any; operation: "create" | "update" | "delete" }) => {
  if (operation === "create" && !req.user) {
    const { email, password } = body;

    if (email && password) {
      const { user, token } = await payload.login({
        collection: "users",
        data: { email, password },
        req,
      });

      return {
        ...doc,
        token,
        user,
      };
    }
  }

  return doc;
};
