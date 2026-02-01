import { checkRole } from '@/amerta/access/checkRole'
import { getServerSideURL } from '@/amerta/utilities/getURL'
import { redirect } from 'next/navigation'

export async function GET(
  req: Request & {
    cookies: {
      get: (name: string) => {
        value: string
      }
    }
  },
): Promise<Response> {
  const token = req.cookies.get('payload-token')?.value
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')

  if (!url) {
    return new Response('No URL provided', { status: 404 })
  }

  if (!token) {
    new Response('You are not allowed to preview this page', { status: 403 })
  }

  // validate the Payload token
  const userReq = await fetch(`${getServerSideURL()}/api/users/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
  })

  const userRes = await userReq.json()

  if (!userReq.ok || !userRes?.user || !checkRole(['admin'], userRes.user)) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  redirect(url)
}
