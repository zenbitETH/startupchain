"use server"

import { getOwner, getPrice } from "@ensdomains/ensjs/public"
import { addEnsContracts } from "@ensdomains/ensjs"
import { formatEther } from "viem"
import { createPublicClient, http } from "viem"
import { normalize } from "viem/ens"
import { mainnet, sepolia } from "viem/chains"

import { isValidEnsName } from "../../../../lib/ens.js"

const chainId = process.env.NEXT_PUBLIC_CHAIN_ID === "1" ? 1 : 11155111
const baseChain = chainId === 1 ? mainnet : sepolia
const ensChain = addEnsContracts(baseChain)

function resolveRpcUrl() {
  const alchemyKey = process.env.ALCHEMY_API_KEY?.trim()
  if (!alchemyKey) {
    return ensChain.rpcUrls.default.http[0]
  }

  if (alchemyKey.startsWith("http")) {
    return alchemyKey
  }

  const host =
    chainId === 1 ? "https://eth-mainnet.g.alchemy.com/v2/" : "https://eth-sepolia.g.alchemy.com/v2/"
  return `${host}${alchemyKey}`
}

const publicClient = createPublicClient({
  chain: ensChain,
  transport: http(resolveRpcUrl()),
})

export async function checkEnsAvailabilityAction(name: string) {
  if (!isValidEnsName(name)) {
    return { name, available: false, address: null as string | null }
  }

  const normalized = normalize(name.endsWith(".eth") ? name : `${name}.eth`)
  const address = await publicClient.getEnsAddress({ name: normalized })

  return {
    name: normalized,
    available: !address,
    address: address ?? null,
  }
}

export async function getEnsRegistrationCostAction(name: string, durationYears = 1) {
  if (!isValidEnsName(name)) {
    throw new Error("Invalid ENS name")
  }

  const normalized = normalize(name.endsWith(".eth") ? name : `${name}.eth`)
  const duration = Math.max(1, durationYears) * 365 * 24 * 60 * 60

  const priceData = await getPrice(publicClient, {
    nameOrNames: normalized,
    duration,
  })

  const total = priceData.base + priceData.premium
  const withBuffer = (total * BigInt(102)) / BigInt(100)

  return {
    name: normalized,
    costWei: withBuffer.toString(),
    costEth: formatEther(withBuffer),
  }
}

export async function getEnsOwnerAction(name: string) {
  if (!isValidEnsName(name)) {
    return { name, owner: null as string | null }
  }

  const normalized = normalize(name.endsWith(".eth") ? name : `${name}.eth`)
  const result = await getOwner(publicClient, { name: normalized })

  const owner =
    result?.owner && result.owner !== "0x0000000000000000000000000000000000000000"
      ? result.owner
      : null

  return { name: normalized, owner }
}
