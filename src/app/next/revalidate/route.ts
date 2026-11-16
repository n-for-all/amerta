import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { revalidationToken } from '@/amerta/utilities/revalidate'

export async function GET(request: NextRequest): Promise<Response> {
  const collection = request.nextUrl.searchParams.get('collection')
  const slug = request.nextUrl.searchParams.get('slug')
  const secret = request.nextUrl.searchParams.get('secret')
  const tags = request.nextUrl.searchParams.get('tags')
  const token = request.nextUrl.searchParams.get('token')

  // Signed tag list (see revalidateCacheTags): used for changes made through the MCP connection
  if (tags && token) {
    const expected = await revalidationToken(tags)
    if (!process.env.PAYLOAD_SECRET || token.length !== expected.length || token !== expected) {
      return new Response('Invalid request', { status: 400 })
    }
    const list = tags.split(',').filter(Boolean).slice(0, 20)
    for (const tag of list) revalidateTag(tag, { expire: 0 })
    return NextResponse.json({ revalidated: list, now: Date.now() })
  }

  if (
    !secret ||
    secret !== process.env.NEXT_PRIVATE_REVALIDATION_KEY ||
    typeof collection !== 'string' ||
    typeof slug !== 'string'
  ) {
    // Do not indicate that the revalidation key is incorrect in the response
    // This will protect this API route from being exploited
    return new Response('Invalid request', { status: 400 })
  }

  if (typeof collection === 'string' && typeof slug === 'string') {
    revalidateTag(`${collection}_${slug}`, { expire: 0 })
    return NextResponse.json({ revalidated: true, now: Date.now() })
  }

  return NextResponse.json({ revalidated: false, now: Date.now() })
}
