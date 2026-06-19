import { AccessArgs, FieldAccess } from 'payload'
import { checkRole } from './checkRole'
import type { User } from '@/payload-types'

type isAdmin = FieldAccess

export const admins: isAdmin = ({ req: { user } }) => {
  return checkRole(['admin'], user as User)
}
