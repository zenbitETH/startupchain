export type SafeApiConfigurationErrorCode = 'SAFE_API_KEY_MISSING'

export type SafeApiKitConfigResolved = {
  chainId: bigint
  apiKey: string
}

export class SafeApiConfigurationError extends Error {
  code: SafeApiConfigurationErrorCode

  constructor(code: SafeApiConfigurationErrorCode, message: string) {
    super(message)
    this.name = 'SafeApiConfigurationError'
    this.code = code
  }
}

export function isSafeApiConfigurationError(
  error: unknown,
): error is SafeApiConfigurationError {
  return error instanceof SafeApiConfigurationError
}

export function getSafeApiKitConfig(chainId: number): SafeApiKitConfigResolved {
  const apiKey = process.env.SAFE_API_KEY?.trim()
  if (!apiKey) {
    throw new SafeApiConfigurationError(
      'SAFE_API_KEY_MISSING',
      'Safe proposal service is not configured',
    )
  }

  return {
    chainId: BigInt(chainId),
    apiKey,
  }
}
