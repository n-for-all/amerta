/**
 * @module Collections/Blog/Posts/Hooks
 * @title Revalidate Hook
 * @description This hook revalidates the post page when a post is published, updated, or deleted, ensuring that users see the most up-to-date information when viewing post pages. The hook is triggered after a change is made to a post document and checks if the document's status is "published" before calling the revalidation function.
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'
import { revalidateCacheTags } from '@/amerta/utilities/revalidate'
import { Post } from '@/payload-types'



export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req,
}) => {
  if (!req.context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      req.payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateCacheTags(['posts-sitemap'], req)
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      req.payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateCacheTags(['posts-sitemap'], req)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req }) => {
  if (!req.context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    revalidatePath(path)
    revalidateCacheTags(['posts-sitemap'], req)
  }

  return doc
}
