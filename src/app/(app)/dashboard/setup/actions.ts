"use server"

import { addEnsContracts } from "@ensdomains/ensjs"
import { getOwner, getPrice } from "@ensdomains/ensjs/public"
import { commitName, registerName } from "@ensdomains/ensjs/wallet"
import { randomBytes } from "node:crypto"
import { Address, formatEther, isAddress } from "viem"
import { createPublicClient, http } from "viem"
import { normalize } from "viem/ens"
import { mainnet, sepolia } from "viem/chains"
import { revalidatePath } from "next/cache"

import { isValidEnsName } from "../../../../lib/ens.js"
import { startupChainAbi, type FounderStruct } from "../../../../lib/blockchain/startupchain-abi"
import {
  STARTUPCHAIN_CHAIN_ID,
  getEnsResolverAddress,
  getStartupChainAddress,
} from "../../../../lib/blockchain/startupchain-config"
import {
  publicClient as startupChainPublicClient,
  startupChainAccount,
  startupChainChain,
  walletClient as startupChainWalletClient,
} from "../../../../lib/blockchain/startupchain-client"
import { redisDel, redisGet, redisSet } from "../../../../lib/redis/upstash"

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

const ensPublicClient = createPublicClient({
  chain: ensChain,
  transport: http(resolveRpcUrl()),
})

export async function checkEnsAvailabilityAction(name: string) {
  if (!isValidEnsName(name)) {
    return { name, available: false, address: null as string | null }
  }

  const normalized = normalize(name.endsWith(".eth") ? name : `${name}.eth`)
  const result = await getOwner(ensPublicClient, { name: normalized })
  const owner = result?.owner
  const available = !owner || owner === "0x0000000000000000000000000000000000000000"

  return {
    name: normalized,
    available,
    address: owner ?? null,
  }
}

export async function getEnsRegistrationCostAction(name: string, durationYears = 1) {
  if (!isValidEnsName(name)) {
    throw new Error("Invalid ENS name")
  }

  const normalized = normalize(name.endsWith(".eth") ? name : `${name}.eth`)
  const duration = Math.max(1, durationYears) * 365 * 24 * 60 * 60

  const priceData = await getPrice(ensPublicClient, {
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
  const result = await getOwner(ensPublicClient, { name: normalized })

  const owner =
    result?.owner && result.owner !== "0x0000000000000000000000000000000000000000"
      ? result.owner
      : null

  return { name: normalized, owner }
}

type BackendFounderInput = {
  wallet: string
  equityPercent: number
  role?: string
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

function normalizeEnsInput(name: string) {
  const trimmed = name.trim().toLowerCase()
  const label = trimmed.endsWith(".eth") ? trimmed.slice(0, -4) : trimmed

  if (!isValidEnsName(label)) {
    throw new Error("Invalid ENS name")
  }

  return {
    label,
    fullName: normalize(`${label}.eth`),
  }
}

function toFounderStructs(founders: BackendFounderInput[]): FounderStruct[] {
  if (founders.length === 0) {
    throw new Error("At least one founder required")
  }

  const structs = founders.map((founder) => {
    if (!isAddress(founder.wallet)) {
      throw new Error(`Invalid founder address: ${founder.wallet}`)
    }

    const equityPercent = Number.isFinite(founder.equityPercent)
      ? founder.equityPercent
      : 0

    if (equityPercent < 0) {
      throw new Error("Equity percentage cannot be negative")
    }

    return {
      wallet: founder.wallet as Address,
      equityBps: BigInt(Math.round(equityPercent * 100)),
      role: founder.role ?? "",
    }
  })

  const totalEquityBps = structs.reduce(
    (sum, founder) => sum + founder.equityBps,
    0n
  )

  if (totalEquityBps > 10_000n) {
    throw new Error("Total equity cannot exceed 100%")
  }

  return structs
}

function validateThreshold(threshold: number, founderCount: number) {
  if (!Number.isFinite(threshold) || threshold <= 0) {
    throw new Error("Threshold must be greater than zero")
  }

  if (threshold > founderCount) {
    throw new Error("Threshold cannot exceed number of founders")
  }
}

function resolveSafeAddress(address: string): `0x${string}` {
  if (!isAddress(address)) {
    throw new Error("Invalid Safe address")
  }
  return address as `0x${string}`
}

export type EnsRegistrationRecord = {
  ensLabel: string
  ensName: string
  owner: `0x${string}`
  founders: FounderStruct[]
  threshold: number
  durationYears: number
  secret: `0x${string}`
  commitTxHash: `0x${string}`
  registrationTxHash?: `0x${string}`
  companyTxHash?: `0x${string}`
  readyAt: number
  createdAt: number
  updatedAt: number
  status: "committed" | "registered"
}

function getRedisKey(label: string) {
  return `ens-reg:${label}`
}
function getOwnerRedisKey(owner: string) {
  return `ens-reg-owner:${owner.toLowerCase()}`
}

export async function commitEnsRegistrationAction({
  ensName,
  safeAddress,
  founders,
  threshold,
  durationYears = 1,
  reverseRecord = false,
}: {
  ensName: string
  safeAddress: string
  founders: BackendFounderInput[]
  threshold: number
  durationYears?: number
  reverseRecord?: boolean
}) {
  const { label, fullName } = normalizeEnsInput(ensName)
  const owner = resolveSafeAddress(safeAddress)
  const founderStructs = toFounderStructs(founders)
  validateThreshold(threshold, founderStructs.length)

  const existingOwner = await getEnsOwnerAction(label)
  const isAlreadyOwner =
    existingOwner.owner &&
    existingOwner.owner !== ZERO_ADDRESS &&
    existingOwner.owner.toLowerCase() === owner.toLowerCase()

  if (existingOwner.owner && existingOwner.owner !== ZERO_ADDRESS && !isAlreadyOwner) {
    throw new Error(`ENS name "${label}.eth" is already registered`)
  }

  const years = Math.max(1, Math.floor(durationYears))
  const { costWei } = await getEnsRegistrationCostAction(label, years)
  const registrationCostWei = BigInt(costWei)

  const durationInSeconds = years * 365 * 24 * 60 * 60
  const secret = `0x${randomBytes(32).toString("hex")}` as `0x${string}`

  let commitTxHash: `0x${string}` = "0x0000000000000000000000000000000000000000000000000000000000000000"
  let readyAt = Date.now()

  if (!isAlreadyOwner) {
    const registrationParams = {
      name: fullName,
      owner,
      duration: durationInSeconds,
      secret,
      resolverAddress: getEnsResolverAddress(STARTUPCHAIN_CHAIN_ID),
      records: undefined,
      reverseRecord,
      fuses: {
        named: [],
        unnamed: [],
      },
    }

    const commitTxData = commitName.makeFunctionData(
      startupChainWalletClient,
      registrationParams
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txValue = (commitTxData as any).value

    commitTxHash = await startupChainWalletClient.sendTransaction({
      to: commitTxData.to as Address,
      data: commitTxData.data as `0x${string}`,
      value: txValue ? BigInt(txValue) : undefined,
      account: startupChainAccount,
      chain: startupChainChain,
    })

    await startupChainPublicClient.waitForTransactionReceipt({
      hash: commitTxHash,
    })

    readyAt = Date.now() + 61_000
  }
  const record: EnsRegistrationRecord = {
    ensLabel: label,
    ensName: `${label}.eth`,
    owner,
    founders: founderStructs,
    threshold,
    durationYears: years,
    secret,
    commitTxHash,
    readyAt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "committed",
  }

  await Promise.all([
    redisSet(getRedisKey(label), {
      ...record,
      founders: record.founders.map((f) => ({
        ...f,
        equityBps: Number(f.equityBps),
      })),
    }),
    redisSet(getOwnerRedisKey(owner), {
      ...record,
      founders: record.founders.map((f) => ({
        ...f,
        equityBps: Number(f.equityBps),
      })),
    }),
  ])

  return {
    ensName: record.ensName,
    owner,
    commitTxHash,
    readyAt,
    status: record.status,
  }
}

export async function finalizeEnsRegistrationAction({ ensName }: { ensName: string }) {
  const { label, fullName } = normalizeEnsInput(ensName)
  let record = await redisGet<EnsRegistrationRecord>(getRedisKey(label))
  if (!record && isAddress(ensName)) {
    record = await redisGet<EnsRegistrationRecord>(
      getOwnerRedisKey(ensName as `0x${string}`)
    )
  }

  if (!record) {
    throw new Error("No pending ENS registration found")
  }

  if (record.status === "registered" && record.companyTxHash) {
    return record
  }

  if (Date.now() < record.readyAt) {
    throw new Error("Commitment window not ready yet")
  }

  const years = Math.max(1, record.durationYears)
  const { costWei } = await getEnsRegistrationCostAction(label, years)
  const registrationCostWei = BigInt(costWei)

  const registrationParams = {
    name: fullName,
    owner: record.owner,
    duration: years * 365 * 24 * 60 * 60,
    secret: record.secret,
    resolverAddress: getEnsResolverAddress(STARTUPCHAIN_CHAIN_ID),
    records: undefined,
    reverseRecord: false,
    fuses: {
      named: [],
      unnamed: [],
    },
  }

  const contractAddress = getStartupChainAddress(STARTUPCHAIN_CHAIN_ID)
  if (contractAddress === ZERO_ADDRESS) {
    throw new Error("StartupChain contract address is not configured")
  }

  // If the owner or ENS is already registered, treat as success and persist status
  try {
    const existing = await startupChainPublicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: "getCompanyByAddress",
      args: [record.owner],
    })
    if (existing) {
      const updatedExisting: EnsRegistrationRecord = {
        ...record,
        status: "registered",
        updatedAt: Date.now(),
      }
      await Promise.all([
        redisSet(getRedisKey(label), {
          ...updatedExisting,
          founders: updatedExisting.founders.map((f) => ({
            ...f,
            equityBps: Number(f.equityBps),
          })),
        }),
        redisSet(getOwnerRedisKey(record.owner), {
          ...updatedExisting,
          founders: updatedExisting.founders.map((f) => ({
            ...f,
            equityBps: Number(f.equityBps),
          })),
        }),
      ])
      try {
        revalidatePath("/dashboard")
      } catch {
        // ignore revalidation error
      }
      return updatedExisting
    }
  } catch {
    // ignore and proceed to register
  }

  let registrationTxHash: `0x${string}` | undefined

  // Check if already registered to the correct owner
  const currentOwner = await getEnsOwnerAction(label)
  const isAlreadyOwner =
    currentOwner.owner &&
    currentOwner.owner.toLowerCase() === record.owner.toLowerCase()

  if (!isAlreadyOwner) {
    const registerTxData = registerName.makeFunctionData(
      startupChainWalletClient,
      {
        ...registrationParams,
        value: registrationCostWei,
      }
    )

    registrationTxHash = await startupChainWalletClient.sendTransaction({
      to: registerTxData.to as Address,
      data: registerTxData.data as `0x${string}`,
      value: registrationCostWei,
      account: startupChainAccount,
      chain: startupChainChain,
    })

    await startupChainPublicClient.waitForTransactionReceipt({
      hash: registrationTxHash,
    })
  } else {
    registrationTxHash = record.commitTxHash // Reuse commit hash as placeholder
  }

  let companyTxHash: `0x${string}`
  try {
    // Ensure equityBps is BigInt for the contract call
    const foundersArg = record.founders.map((f) => ({
      wallet: f.wallet,
      equityBps: BigInt(f.equityBps),
      role: f.role,
    }))

    companyTxHash = await startupChainWalletClient.writeContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: "registerCompany",
      args: [label, record.owner, foundersArg, BigInt(record.threshold)],
      chain: startupChainChain,
      account: startupChainAccount,
    })

    await startupChainPublicClient.waitForTransactionReceipt({
      hash: companyTxHash,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    const already =
      message.includes("Company already registered") ||
      message.includes("ENS name already registered")

    if (already) {
      // Treat as success if on-chain state already exists
      const updatedExisting: EnsRegistrationRecord = {
        ...record,
        status: "registered",
        updatedAt: Date.now(),
      }
      await Promise.all([
        redisSet(getRedisKey(label), {
          ...updatedExisting,
          founders: updatedExisting.founders.map((f) => ({
            ...f,
            equityBps: Number(f.equityBps),
          })),
        }),
        redisSet(getOwnerRedisKey(record.owner), {
          ...updatedExisting,
          founders: updatedExisting.founders.map((f) => ({
            ...f,
            equityBps: Number(f.equityBps),
          })),
        }),
      ])
      try {
        revalidatePath("/dashboard")
      } catch {
        // ignore revalidation error
      }
      return updatedExisting
    }

    throw err
  }

  const updated: EnsRegistrationRecord = {
    ...record,
    registrationTxHash,
    companyTxHash,
    status: "registered",
    updatedAt: Date.now(),
  }

  await Promise.all([
    redisSet(getRedisKey(label), {
      ...updated,
      founders: updated.founders.map((f) => ({
        ...f,
        equityBps: Number(f.equityBps),
      })),
    }),
    redisSet(getOwnerRedisKey(record.owner), {
      ...updated,
      founders: updated.founders.map((f) => ({
        ...f,
        equityBps: Number(f.equityBps),
      })),
    }),
  ])
  try {
    revalidatePath("/dashboard")
  } catch {
    // ignore when revalidatePath is unavailable (e.g., during unit tests)
  }

  return updated
}

export async function getEnsRegistrationStatusAction(ensName: string) {
  const { label } = normalizeEnsInput(ensName)
  return redisGet<EnsRegistrationRecord>(getRedisKey(label))
}

export async function getEnsRegistrationStatusByOwnerAction(owner: string) {
  if (!isAddress(owner)) return null
  return redisGet<EnsRegistrationRecord>(
    getOwnerRedisKey(owner as `0x${string}`)
  )
}

export async function clearEnsRegistrationAction(ensName: string) {
  const { label } = normalizeEnsInput(ensName)
  const record = await redisGet<EnsRegistrationRecord>(getRedisKey(label))
  await Promise.all([
    redisDel(getRedisKey(label)),
    record?.owner ? redisDel(getOwnerRedisKey(record.owner)) : Promise.resolve(),
  ])
  return { cleared: true }
}
