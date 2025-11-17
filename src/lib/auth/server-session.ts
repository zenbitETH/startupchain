import { InvalidAuthTokenError, verifyAuthToken } from '@privy-io/node'

type ServerSession = {
  userId: string
  walletAddress?: string
  expiresAt: Date
}

type ReqType = {
  headers?: Headers
  cookies?: { get: (k: string) => { value?: string } | undefined }
}

function getToken(req: {
  headers?: Headers
  cookies?: { get: (k: string) => { value?: string } | undefined }
}) {
  console.log('object')
  const fromCookie = req.cookies?.get?.('privy-token')?.value
  if (fromCookie) return fromCookie.trim()

  const auth =
    req.headers?.get('authorization') || req.headers?.get('Authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return null
}

export async function getServerSession(
  req: ReqType
): Promise<ServerSession | null> {
  console.log('object')
  const token = getToken(req)
  if (
    !token ||
    !process.env.NEXT_PUBLIC_PRIVY_APP_ID ||
    !process.env.PRIVY_VERIFICATION_KEY
  ) {
    return null
  }

  try {
    const verified = await verifyAuthToken({
      auth_token: token,
      app_id: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      verification_key: process.env.PRIVY_VERIFICATION_KEY,
    })

    console.log('verified:\n', verified)

    return {
      userId: verified.user_id,
      walletAddress: undefined,
      expiresAt: new Date(verified.expiration * 1000),
    }
  } catch (err) {
    if (err instanceof InvalidAuthTokenError) return null
    throw err
  }
}
