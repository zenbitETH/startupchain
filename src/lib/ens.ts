import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

// Create a public client for ENS resolution on mainnet
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

export interface ENSAvailabilityResult {
  available: boolean
  address?: string
  error?: string
}

/**
 * Check if an ENS name is available for registration
 * @param name - The ENS name to check (without .eth suffix)
 * @returns Promise with availability status
 */
export async function checkEnsAvailability(name: string): Promise<ENSAvailabilityResult> {
  try {
    // Normalize the ENS name (adds .eth suffix if not present)
    const normalizedName = name.endsWith('.eth') ? normalize(name) : normalize(`${name}.eth`)
    
    // Try to get the address associated with this ENS name
    const address = await publicClient.getEnsAddress({
      name: normalizedName,
    })

    // If address exists, the name is taken
    if (address) {
      return {
        available: false,
        address,
      }
    }

    // If no address, the name is available
    return {
      available: true,
    }
  } catch (error) {
    console.error('Error checking ENS availability:', error)
    
    // Handle specific errors
    if (error instanceof Error) {
      // If it's a resolution error, the name might be available
      if (error.message.includes('resolver') || error.message.includes('not found')) {
        return {
          available: true,
        }
      }
      
      return {
        available: false,
        error: error.message,
      }
    }

    return {
      available: false,
      error: 'Unknown error occurred while checking ENS availability',
    }
  }
}

/**
 * Validate ENS name format
 * @param name - The name to validate
 * @returns boolean indicating if the name format is valid
 */
export function isValidEnsName(name: string): boolean {
  // Basic validation rules for ENS names
  const nameToCheck = name.replace('.eth', '')
  
  // Must be at least 3 characters
  if (nameToCheck.length < 3) return false
  
  // Must not be longer than 63 characters
  if (nameToCheck.length > 63) return false
  
  // Must contain only letters, numbers, and hyphens
  const validPattern = /^[a-z0-9-]+$/
  if (!validPattern.test(nameToCheck.toLowerCase())) return false
  
  // Must not start or end with hyphen
  if (nameToCheck.startsWith('-') || nameToCheck.endsWith('-')) return false
  
  return true
}

/**
 * Get estimated cost for ENS registration (in ETH)
 * @param name - The ENS name
 * @param years - Number of years to register for
 * @returns Estimated cost in ETH
 */
export function getEstimatedEnsRegistrationCost(name: string, years: number = 1): number {
  const nameLength = name.replace('.eth', '').length
  
  // Approximate pricing based on ENS pricing model
  if (nameLength === 3) return 0.1 * years // 3-letter names
  if (nameLength === 4) return 0.05 * years // 4-letter names
  return 0.005 * years // 5+ letter names
}