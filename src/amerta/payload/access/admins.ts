

import { FieldAccessArgs } from 'node_modules/payload/dist/fields/config/types'
import { checkRole } from './checkRole'
import type { User } from '@/payload-types'

type isAdmin = (args: FieldAccessArgs<any, User>) => boolean

export const admins: isAdmin = ({ req: { user } }) => {
  return checkRole(['admin'], user)
}
