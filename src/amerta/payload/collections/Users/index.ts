/**
 * @module Collections/Users
 * @title Users Collection
 * @description This module defines the collections related to the users functionality in Amerta, including user details, roles, and related handlers.
 */

import type { CollectionConfig } from "payload";

import { admins } from "@/amerta/access/admins";
import { anyone } from "@/amerta/access/anyone";
import adminsAndUser from "./access/adminsAndUser";
import { checkRole } from "@/amerta/access/checkRole";
import { ensureFirstUserIsAdmin } from "./hooks/ensureFirstUserIsAdmin";
import { loginAfterCreate } from "./hooks/loginAfterCreate";
import validateBeforeChange from "./hooks/validateBeforeChange";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email"],
    group: "Settings",
  },
  access: {
    read: adminsAndUser,
    create: anyone,
    update: adminsAndUser,
    delete: admins,
    admin: ({ req: { user } }) => checkRole(["admin"], user),
  },
  hooks: {
    beforeChange: [validateBeforeChange],
    afterChange: [loginAfterCreate],
  },
  auth: true,
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["user"],
      options: [
        {
          label: "admin",
          value: "admin",
        },
        {
          label: "user",
          value: "user",
        },
      ],
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      access: {
        read: admins,
        create: admins,
        update: admins,
      },
    },
    {
      name: "skipSync",
      label: "Skip Sync",
      type: "checkbox",
      admin: {
        position: "sidebar",
        readOnly: true,
        hidden: true,
      },
    },
  ],
  endpoints: [
    {
      path: "/me",
      method: "get",
      handler: async (req) => {
        if (req.user && checkRole(["admin"], req.user)) {
          return NextResponse.json({ user: req.user });
        } else {
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
      },
    },
  ],
  timestamps: true,
};

export default Users;
