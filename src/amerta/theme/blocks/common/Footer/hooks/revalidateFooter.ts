import type { GlobalAfterChangeHook } from 'payload'

import { revalidateCacheTags } from '@/amerta/utilities/revalidate'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req }) => {
  if (!req.context.disableRevalidate) {
    req.payload.logger.info(`Revalidating footer`)

    revalidateCacheTags(['global_footer'], req)
  }

  return doc
}
