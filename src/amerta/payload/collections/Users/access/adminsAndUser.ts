/**
 * @module Collections/Users/Access
 * @title Admins and User Access
 * @description This access control ensures that only admins or the user themselves can perform certain actions.
 */

import { Access } from 'payload'
import { checkRole } from '@/amerta/access/checkRole'
import { User } from '@/payload-types'

const adminsAndUser: Access = ({ req: { user } }) => {
  if (user) {
    if (checkRole(['admin'], user as User)) {
      return true
    }

    return {
      id: {
        equals: user.id,
      },
    }
  }

  return false
}

export default adminsAndUser
