/**
 * @module Collections/Users/Hooks
 * @title Resolve Duplicate Purchases
 * @description This hook ensures that duplicate purchases are removed from the user's purchase list.
 */


import { FieldHook } from 'payload'

import type { User } from '@/payload-types'

export const resolveDuplicatePurchases: FieldHook<User> = async ({ value, operation }) => {
  if ((operation === 'create' || operation === 'update') && value) {
    return Array.from(
      new Set(
        value?.map(purchase => (typeof purchase === 'object' ? purchase.id : purchase)) || [],
      ),
    )
  }

  return
}
