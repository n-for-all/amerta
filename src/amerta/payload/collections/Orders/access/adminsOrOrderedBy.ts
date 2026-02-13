/**
 * @module Collections/Orders/Access
 * @title Admins or Ordered By Access
 * @description This access control allows admins to access all orders and customers to access their own orders.
 */

import type { Access } from 'payload'

import { checkRole } from '@/amerta/access/checkRole'

export const adminsOrOrderedBy: Access = ({ req: { user } }) => {
  if (checkRole(['admin'], user)) {
    return true
  }

  return {
    orderedBy: {
      equals: user?.id,
    },
  }
}
