import { cookies } from 'next/headers'

export const PENDING_ENS_COOKIE = 'pending-ens'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

export type PendingStatus =
  | 'committing'
  | 'waiting'
  | 'registering'
  | 'creating'
  | 'completed'
  | 'failed'

export type PendingFounder = {
  wallet: `0x${string}`
  equityBps?: number
  role?: string
}

export type PendingRegistration = {
  ensLabel: string
  ensName: string
  commitTxHash: `0x${string}`
  readyAt: number
  owner: `0x${string}`
  founders: PendingFounder[]
  threshold: number
  status: PendingStatus
  secret: `0x${string}`
  durationYears: number
  createdAt: number
  updatedAt: number
  registrationTxHash?: `0x${string}`
  companyTxHash?: `0x${string}`
  error?: string
}

function serializeCookieValue(data: PendingRegistration) {
  return JSON.stringify({
    ...data,
    threshold: Number(data.threshold),
    readyAt: Number(data.readyAt),
    durationYears: Number(data.durationYears),
    createdAt: Number(data.createdAt),
    updatedAt: Number(data.updatedAt),
  })
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  }
}

export async function setPendingRegistration(data: PendingRegistration) {
  const cookieStore = await cookies()
  cookieStore.set(PENDING_ENS_COOKIE, serializeCookieValue(data), {
    ...getCookieOptions(),
  })
}

export async function getPendingRegistration(): Promise<PendingRegistration | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(PENDING_ENS_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PendingRegistration
    return parsed
  } catch {
    cookieStore.delete(PENDING_ENS_COOKIE)
    return null
  }
}

export async function updatePendingRegistration(
  data: Partial<PendingRegistration>
) {
  const current = await getPendingRegistration()
  if (!current) return null

  const next: PendingRegistration = {
    ...current,
    ...data,
    threshold: Number(data.threshold ?? current.threshold),
    readyAt: Number(data.readyAt ?? current.readyAt),
    durationYears: Number(data.durationYears ?? current.durationYears),
    createdAt: Number(data.createdAt ?? current.createdAt),
    updatedAt: Date.now(),
  }

  await setPendingRegistration(next)
  return next
}

export async function clearPendingRegistration() {
  const cookieStore = await cookies()
  cookieStore.delete(PENDING_ENS_COOKIE)
}
