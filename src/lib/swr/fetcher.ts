export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const errorData = await res.json()
      message = errorData.error || message
    } catch (parseError) {}

    throw new Error(message)
  }

  return res.json()
}
