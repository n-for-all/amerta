import type { CollectionAfterChangeHook } from 'payload'

import { revalidateCacheTags } from '@/amerta/utilities/revalidate'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req }) => {
  req.payload.logger.info(`Revalidating redirects`)
  revalidateCacheTags(['redirects'], req)

  return doc
}
