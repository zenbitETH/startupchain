'use server'

import { getCompanyByAddress } from '@/lib/blockchain/get-company'

export type CompanyData = {
  id: string
  companyAddress: string
  ensName: string
  creationDate: string
  founders: string[]
}

export async function getCompanyAction(
  address: string
): Promise<CompanyData | null> {
  if (!address) return null

  try {
    const company = await getCompanyByAddress(address)

    if (!company) return null

    return {
      ...company,
      creationDate: company.creationDate.toISOString(),
      founders: company.founders.map((f) => f.toString()),
    }
  } catch (error) {
    console.error('Failed to fetch company:', error)
    return null
  }
}
