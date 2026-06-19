import { Access } from "payload";

import { checkRole } from './checkRole'
import { User } from "@/payload-types";

export const adminsOrPublished: Access = ({ req: { user } }) => {
  if (checkRole(['admin'], user as User)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
