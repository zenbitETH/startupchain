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
