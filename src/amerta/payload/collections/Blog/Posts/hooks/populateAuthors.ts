/**
 * @module Collections/Blog/Posts/Hooks
 * @title Populate Authors Hook
 * @description This hook populates the authors field for blog posts, ensuring that user data is protected while still providing necessary information for display. The hook is triggered after a blog post document is read and populates the authors field with user data, hidden from the admin UI.
 */

import { User } from '@/payload-types'
import type { CollectionAfterReadHook } from 'payload'


// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.authors) {
    const authorDocs: User[] = []

    for (const author of doc.authors) {
      const authorDoc = await payload.findByID({
        id: typeof author === 'object' ? author?.id : author,
        collection: 'users',
        depth: 0,
        req,
      })

      if (authorDoc) {
        authorDocs.push(authorDoc)
      }
    }

    doc.populatedAuthors = authorDocs.map((authorDoc) => ({
      id: authorDoc.id,
      name: authorDoc.name,
    }))
  }

  return doc
}
