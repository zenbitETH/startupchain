import { formatEther } from 'viem'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatEth(wei: string | bigint | number): string {
  try {
    const weiVal = BigInt(wei)
    const eth = formatEther(weiVal)
    // Show up to 6 decimal places, trim trailing zeros
    const formatted = parseFloat(eth).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    })

    // If the value is 0, return 0.000 ETH
    if (formatted === '0') {
      return '0.000 ETH'
    }

    return `${formatted} ETH`
  } catch (e) {
    return '0.000 ETH'
  }
}
