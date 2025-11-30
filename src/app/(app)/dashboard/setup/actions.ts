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

import {
  clearPendingRegistration,
  getPendingRegistration,
  setPendingRegistration,
  updatePendingRegistration,
  type PendingRegistration,
} from "../../../../lib/auth/pending-registration"
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

function toCookieFounders(founders: FounderStruct[]) {
  return founders.map((founder) => ({
    wallet: founder.wallet,
    equityBps: Number(founder.equityBps),
    role: founder.role,
  }))
}

function toContractFounders(founders: PendingRecord["founders"]): FounderStruct[] {
  return founders.map((founder) => ({
    wallet: founder.wallet,
    equityBps: BigInt(founder.equityBps ?? 0),
    role: founder.role ?? "",
  }))
}

type PendingRecord = PendingRegistration
export type EnsRegistrationRecord = PendingRegistration

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
  const startedAt = Date.now()
  let readyAt = startedAt

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

  const record: PendingRecord = {
    ensLabel: label,
    ensName: `${label}.eth`,
    owner,
    founders: toCookieFounders(founderStructs),
    threshold,
    durationYears: years,
    secret,
    commitTxHash,
    readyAt,
    createdAt: startedAt,
    updatedAt: startedAt,
    status: "waiting",
  }

  await setPendingRegistration(record)

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
  const pending = await getPendingRegistration()
  if (!pending || pending.ensLabel !== label) {
    throw new Error("No pending ENS registration found")
  }

  if (pending.status === "completed") {
    await clearPendingRegistration()
    return pending
  }

  if (Date.now() < pending.readyAt) {
    throw new Error("Commitment window not ready yet")
  }

  if (!pending.secret) {
    throw new Error("Missing ENS commitment secret")
  }

  const contractAddress = getStartupChainAddress(STARTUPCHAIN_CHAIN_ID)
  if (contractAddress === ZERO_ADDRESS) {
    throw new Error("StartupChain contract address is not configured")
  }

  const markFailed = async (message: string) => {
    await updatePendingRegistration({
      status: "failed",
      error: message,
    })
  }

  const finishAndClear = async (record: PendingRecord) => {
    try {
      await clearPendingRegistration()
    } finally {
      try {
        revalidatePath("/dashboard")
      } catch {
        // Ignore when revalidatePath is unavailable (e.g., unit tests)
      }
    }
    return record
  }

  try {
    const existing = await startupChainPublicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: "getCompanyByAddress",
      args: [pending.owner],
    })
    if (existing) {
      const updatedExisting: PendingRecord = {
        ...pending,
        status: "completed",
        updatedAt: Date.now(),
      }
      return finishAndClear(updatedExisting)
    }
  } catch {
    // Continue with registration flow
  }

  const years = Math.max(1, pending.durationYears)
  const { costWei } = await getEnsRegistrationCostAction(label, years)
  const registrationCostWei = BigInt(costWei)

  const registrationParams = {
    name: fullName,
    owner: pending.owner,
    duration: years * 365 * 24 * 60 * 60,
    secret: pending.secret,
    resolverAddress: getEnsResolverAddress(STARTUPCHAIN_CHAIN_ID),
    records: undefined,
    reverseRecord: false,
    fuses: {
      named: [],
      unnamed: [],
    },
  }

  let registrationTxHash = pending.registrationTxHash
  let companyTxHash = pending.companyTxHash

  try {
    const currentOwner = await getEnsOwnerAction(label)
    const isAlreadyOwner =
      currentOwner.owner &&
      currentOwner.owner.toLowerCase() === pending.owner.toLowerCase()

    if (!isAlreadyOwner) {
      await updatePendingRegistration({ status: "registering", error: undefined })

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

      await updatePendingRegistration({
        registrationTxHash,
      })

      await startupChainPublicClient.waitForTransactionReceipt({
        hash: registrationTxHash,
      })
    } else if (!registrationTxHash) {
      registrationTxHash = pending.commitTxHash
    }

    await updatePendingRegistration({
      status: "creating",
      registrationTxHash,
      error: undefined,
    })

    companyTxHash = await startupChainWalletClient.writeContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: "registerCompany",
      args: [label, pending.owner, toContractFounders(pending.founders), BigInt(pending.threshold)],
      chain: startupChainChain,
      account: startupChainAccount,
    })

    await updatePendingRegistration({ companyTxHash })

    await startupChainPublicClient.waitForTransactionReceipt({
      hash: companyTxHash,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to finalize ENS registration"

    const alreadyRegistered =
      message.includes("Company already registered") ||
      message.includes("ENS name already registered")

    if (alreadyRegistered) {
      const resolvedRegistrationTx =
        registrationTxHash ?? pending.registrationTxHash ?? pending.commitTxHash
      const resolvedCompanyTx = companyTxHash ?? pending.companyTxHash
      const completed: PendingRecord = {
        ...pending,
        status: "completed",
        registrationTxHash: resolvedRegistrationTx,
        companyTxHash: resolvedCompanyTx,
        updatedAt: Date.now(),
      }
      await setPendingRegistration(completed)
      return finishAndClear(completed)
    }

    await markFailed(message)
    throw err
  }

  const completed: PendingRecord = {
    ...pending,
    status: "completed",
    registrationTxHash:
      registrationTxHash ?? pending.registrationTxHash ?? pending.commitTxHash,
    companyTxHash: companyTxHash ?? pending.companyTxHash,
    updatedAt: Date.now(),
  }

  await setPendingRegistration(completed)
  return finishAndClear(completed)
}

export async function getEnsRegistrationStatusAction(ensName: string) {
  const { label } = normalizeEnsInput(ensName)
  const pending = await getPendingRegistration()
  if (!pending) return null
  return pending.ensLabel === label ? pending : null
}

export async function getEnsRegistrationStatusByOwnerAction(owner: string) {
  if (!isAddress(owner)) return null
  const pending = await getPendingRegistration()
  if (!pending) return null
  return pending.owner.toLowerCase() === owner.toLowerCase() ? pending : null
}

export async function clearEnsRegistrationAction(ensName: string) {
  const { label } = normalizeEnsInput(ensName)
  const pending = await getPendingRegistration()
  if (!pending || pending.ensLabel !== label) {
    return { cleared: false }
  }
  await clearPendingRegistration()
  return { cleared: true }
}

/**
 * Register company on StartupChain contract only (no ENS registration)
 * Used when user has already registered ENS themselves via client-side transaction
 *
 * Note: In the user-pays flow, the user calls the contract directly with service fee.
 * This action is kept as a fallback for server-side registration if needed.
 */
export async function registerCompanyOnlyAction({
  ensName,
  ownerAddress,
  founders,
  threshold,
}: {
  ensName: string
  ownerAddress: string
  founders: BackendFounderInput[]
  threshold: number
}) {
  const { label } = normalizeEnsInput(ensName)
  const owner = resolveSafeAddress(ownerAddress)
  const founderStructs = toFounderStructs(founders)
  validateThreshold(threshold, founderStructs.length)

  const contractAddress = getStartupChainAddress(STARTUPCHAIN_CHAIN_ID)
  if (contractAddress === ZERO_ADDRESS) {
    throw new Error("StartupChain contract address is not configured")
  }

  // Check if company already exists
  try {
    const existing = await startupChainPublicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: "getCompanyByAddress",
      args: [owner],
    })
    if (existing && existing[0] > 0n) {
      return {
        success: true,
        alreadyExists: true,
        companyId: existing[0].toString(),
        ensName: `${label}.eth`,
      }
    }
  } catch {
    // Company doesn't exist, proceed with registration
  }

  // Register company (no value sent - user pays service fee directly to contract)
  const companyTxHash = await startupChainWalletClient.writeContract({
    address: contractAddress,
    abi: startupChainAbi,
    functionName: "registerCompany",
    args: [label, owner, founderStructs, BigInt(threshold)],
    chain: startupChainChain,
    account: startupChainAccount,
  })

  await startupChainPublicClient.waitForTransactionReceipt({
    hash: companyTxHash,
  })

  revalidatePath("/dashboard")

  return {
    success: true,
    alreadyExists: false,
    companyTxHash,
    ensName: `${label}.eth`,
  }
}

/**
 * Validate that ENS is registered to the expected owner
 * Used to verify ENS registration before company registration
 */
export async function validateEnsOwnershipAction(ensName: string, expectedOwner: string) {
  const { label, fullName } = normalizeEnsInput(ensName)

  const result = await getOwner(ensPublicClient, { name: fullName })
  const owner = result?.owner

  const isOwner = owner && owner.toLowerCase() === expectedOwner.toLowerCase()

  return {
    ensName: fullName,
    owner: owner ?? null,
    expectedOwner,
    isValid: isOwner,
  }
}

