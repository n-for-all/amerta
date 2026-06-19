/**
 * @module Collections/Orders/Access
 * @title Admins or Ordered By Access
 * @description This access control allows admins to access all orders and customers to access their own orders.
 */

import type { Access } from 'payload'

import { checkRole } from '@/amerta/access/checkRole'
import { User } from '@/payload-types'

export const adminsOrOrderedBy: Access = ({ req: { user } }) => {
  if (checkRole(['admin'], user as User)) {
    return true
  }

  return {
    orderedBy: {
      equals: user?.id,
    },
  }
}
