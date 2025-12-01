"use server"

import { addEnsContracts } from "@ensdomains/ensjs"
import { getOwner, getPrice } from "@ensdomains/ensjs/public"
import { commitName, registerName } from "@ensdomains/ensjs/wallet"
import { randomBytes } from "node:crypto"
import { Address, formatEther, isAddress } from "viem"
import { createPublicClient, http } from "viem"
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
import { startupChainAbi } from "../../../../lib/blockchain/startupchain-abi"
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
import {
  predictSafeAddress,
  estimateSafeDeploymentGas,
} from "../../../../lib/blockchain/safe-factory"

import {
  normalizeEnsInput,
  ZERO_ADDRESS,
  toFounderStructs,
  validateThreshold,
  toCookieFounders,
  toContractFounders,
  type BackendFounderInput,
} from "./lib"

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

const LOG_PREFIX = '[SERVER:actions]'

export async function checkEnsAvailabilityAction(name: string) {
  console.log(LOG_PREFIX, 'checkEnsAvailabilityAction called', { name })
  if (!isValidEnsName(name)) {
    return { name, available: false, address: null as string | null }
  }

  const { fullName } = normalizeEnsInput(name)
  const result = await getOwner(ensPublicClient, { name: fullName })
  const owner = result?.owner
  const available = !owner || owner === ZERO_ADDRESS

  return {
    name: fullName,
    available,
    address: owner ?? null,
  }
}

export async function getEnsRegistrationCostAction(name: string, durationYears = 1, founderCount = 1) {
  console.log(LOG_PREFIX, 'getEnsRegistrationCostAction called', { name, durationYears, founderCount })
  if (!isValidEnsName(name)) {
    throw new Error("Invalid ENS name")
  }

  const { fullName } = normalizeEnsInput(name)
  const duration = Math.max(1, durationYears) * 365 * 24 * 60 * 60

  const priceData = await getPrice(ensPublicClient, {
    nameOrNames: fullName,
    duration,
  })

  const ensTotal = priceData.base + priceData.premium
  const ensWithBuffer = (ensTotal * BigInt(102)) / BigInt(100)

  // Estimate Safe deployment gas
  const safeGasEstimate = await estimateSafeDeploymentGas(Math.max(1, founderCount))

  // Service fee is 25% of ENS cost
  const serviceFeeWei = (ensWithBuffer * BigInt(2500)) / BigInt(10000)

  // Total = ENS + Safe gas + Service fee
  const totalWei = ensWithBuffer + safeGasEstimate + serviceFeeWei

  return {
    name: fullName,
    costWei: ensWithBuffer.toString(),
    costEth: formatEther(ensWithBuffer),
    safeGasWei: safeGasEstimate.toString(),
    safeGasEth: formatEther(safeGasEstimate),
    serviceFeeWei: serviceFeeWei.toString(),
    serviceFeeEth: formatEther(serviceFeeWei),
    totalWei: totalWei.toString(),
    totalEth: formatEther(totalWei),
  }
}

export async function getEnsOwnerAction(name: string) {
  if (!isValidEnsName(name)) {
    return { name, owner: null as string | null }
  }

  const { fullName } = normalizeEnsInput(name)
  const result = await getOwner(ensPublicClient, { name: fullName })

  const owner =
    result?.owner && result.owner !== ZERO_ADDRESS
      ? result.owner
      : null

  return { name: fullName, owner }
}

type PendingRecord = PendingRegistration
export type EnsRegistrationRecord = PendingRegistration

export async function commitEnsRegistrationAction({
  ensName,
  founders,
  threshold,
  durationYears = 1,
  reverseRecord = false,
  paymentTxHash,
}: {
  ensName: string
  founders: BackendFounderInput[]
  threshold: number
  durationYears?: number
  reverseRecord?: boolean
  paymentTxHash?: string
}) {
  console.log(LOG_PREFIX, '=== commitEnsRegistrationAction START ===')
  console.log(LOG_PREFIX, 'Input:', { ensName, founders, threshold, durationYears, paymentTxHash })
  const { label, fullName } = normalizeEnsInput(ensName)
  console.log(LOG_PREFIX, 'Normalized:', { label, fullName })
  const founderStructs = toFounderStructs(founders)
  validateThreshold(threshold, founderStructs.length)

  // Get founder wallet addresses for Safe
  const founderAddresses = founderStructs.map((f) => f.wallet)

  // Predict Safe address before deployment
  console.log(LOG_PREFIX, 'Predicting Safe address for founders:', founderAddresses)
  const predictedSafeAddress = await predictSafeAddress({
    owners: founderAddresses,
    chainId: STARTUPCHAIN_CHAIN_ID,
    threshold,
  })
  console.log(LOG_PREFIX, 'Predicted Safe address:', predictedSafeAddress)

  const existingOwner = await getEnsOwnerAction(label)
  console.log(LOG_PREFIX, 'Existing ENS owner:', existingOwner)
  const isAlreadyOwner =
    existingOwner.owner &&
    existingOwner.owner !== ZERO_ADDRESS &&
    existingOwner.owner.toLowerCase() === predictedSafeAddress.toLowerCase()

  if (existingOwner.owner && existingOwner.owner !== ZERO_ADDRESS && !isAlreadyOwner) {
    throw new Error(`ENS name "${label}.eth" is already registered`)
  }

  const years = Math.max(1, Math.floor(durationYears))
  const durationInSeconds = years * 365 * 24 * 60 * 60
  const secret = `0x${randomBytes(32).toString("hex")}` as `0x${string}`

  let commitTxHash: `0x${string}` = "0x0000000000000000000000000000000000000000000000000000000000000000"
  const startedAt = Date.now()
  let readyAt = startedAt

  if (!isAlreadyOwner) {
    console.log(LOG_PREFIX, 'ENS not owned by Safe, proceeding with commitment')
    const registrationParams = {
      name: fullName,
      owner: predictedSafeAddress, // ENS will be registered to Safe address
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

    console.log(LOG_PREFIX, 'Sending commit transaction...')
    commitTxHash = await startupChainWalletClient.sendTransaction({
      to: commitTxData.to as Address,
      data: commitTxData.data as `0x${string}`,
      value: txValue ? BigInt(txValue) : undefined,
      account: startupChainAccount,
      chain: startupChainChain,
    })
    console.log(LOG_PREFIX, 'Commit tx hash:', commitTxHash)

    console.log(LOG_PREFIX, 'Waiting for commit tx receipt...')
    await startupChainPublicClient.waitForTransactionReceipt({
      hash: commitTxHash,
    })
    console.log(LOG_PREFIX, 'Commit tx confirmed!')

    readyAt = Date.now() + 61_000
  } else {
    console.log(LOG_PREFIX, 'ENS already owned by Safe, skipping commitment')
  }

  const record: PendingRecord = {
    ensLabel: label,
    ensName: `${label}.eth`,
    owner: predictedSafeAddress, // Safe address will own the ENS
    founders: toCookieFounders(founderStructs),
    threshold,
    durationYears: years,
    secret,
    commitTxHash,
    readyAt,
    createdAt: startedAt,
    updatedAt: startedAt,
    status: "waiting",
    safeAddress: predictedSafeAddress, // Store predicted Safe address
  }

  await setPendingRegistration(record)
  console.log(LOG_PREFIX, 'Pending registration saved')

  const result = {
    ensName: record.ensName,
    owner: predictedSafeAddress,
    safeAddress: predictedSafeAddress,
    commitTxHash,
    readyAt,
    status: record.status,
  }
  console.log(LOG_PREFIX, '=== commitEnsRegistrationAction COMPLETE ===', result)
  return result
}

export async function finalizeEnsRegistrationAction({ ensName }: { ensName: string }) {
  console.log(LOG_PREFIX, '=== finalizeEnsRegistrationAction START ===')
  console.log(LOG_PREFIX, 'Input ensName:', ensName)
  const { label, fullName } = normalizeEnsInput(ensName)
  console.log(LOG_PREFIX, 'Normalized:', { label, fullName })
  const pending = await getPendingRegistration()
  console.log(LOG_PREFIX, 'Pending registration:', pending)
  if (!pending || pending.ensLabel !== label) {
    console.log(LOG_PREFIX, 'ERROR: No pending registration found')
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

  // Check if company already exists
  const safeAddress = pending.safeAddress ?? pending.owner
  try {
    const existing = await startupChainPublicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: "getCompanyByAddress",
      args: [safeAddress],
    })
    if (existing && existing[0] > 0n) {
      const updatedExisting: PendingRecord = {
        ...pending,
        status: "completed",
        safeAddress,
        updatedAt: Date.now(),
      }
      return finishAndClear(updatedExisting)
    }
  } catch {
    // Continue with registration flow
  }

  const years = Math.max(1, pending.durationYears)
  const { costWei, serviceFeeWei } = await getEnsRegistrationCostAction(label, years, pending.founders.length)
  const registrationCostWei = BigInt(costWei)
  const serviceFee = BigInt(serviceFeeWei)

  let safeDeploymentTxHash = pending.safeDeploymentTxHash
  let registrationTxHash = pending.registrationTxHash
  let companyTxHash = pending.companyTxHash
  let deployedSafeAddress = pending.safeAddress ?? pending.owner

  try {
    // STEP 1: Deploy Safe (if not already deployed)
    console.log(LOG_PREFIX, 'STEP 1: Checking Safe deployment at:', deployedSafeAddress)
    // Check if Safe is already deployed by checking code at address
    const safeCode = await startupChainPublicClient.getCode({ address: deployedSafeAddress })
    const isSafeDeployed = safeCode && safeCode !== "0x"
    console.log(LOG_PREFIX, 'Safe deployed?', isSafeDeployed)

    if (!isSafeDeployed && !safeDeploymentTxHash) {
      console.log(LOG_PREFIX, 'Deploying Safe...')
      await updatePendingRegistration({ status: "deploying-safe", error: undefined })

      // Deploy Safe using Safe SDK
      const { deploySafe } = await import("../../../../lib/blockchain/safe-factory.js")
      const founderAddresses = pending.founders.map((f) => f.wallet)

      const safeResult = await deploySafe({
        owners: founderAddresses,
        chainId: STARTUPCHAIN_CHAIN_ID,
        walletClient: startupChainWalletClient,
        publicClient: startupChainPublicClient,
        threshold: pending.threshold,
      })
      console.log(LOG_PREFIX, 'Safe deployed!', safeResult)

      deployedSafeAddress = safeResult.safeAddress
      safeDeploymentTxHash = safeResult.deploymentTxHash as `0x${string}`

      await updatePendingRegistration({
        safeAddress: deployedSafeAddress,
        safeDeploymentTxHash,
      })
    }

    // STEP 2: Register ENS to Safe address
    console.log(LOG_PREFIX, 'STEP 2: Registering ENS to Safe')
    const currentOwner = await getEnsOwnerAction(label)
    console.log(LOG_PREFIX, 'Current ENS owner:', currentOwner)
    const isAlreadyOwner =
      currentOwner.owner &&
      currentOwner.owner.toLowerCase() === deployedSafeAddress.toLowerCase()
    console.log(LOG_PREFIX, 'Already owner?', isAlreadyOwner)

    if (!isAlreadyOwner) {
      console.log(LOG_PREFIX, 'Registering ENS name...')
      await updatePendingRegistration({ status: "registering", error: undefined })

      const registrationParams = {
        name: fullName,
        owner: deployedSafeAddress,
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

      const registerTxData = registerName.makeFunctionData(
        startupChainWalletClient,
        {
          ...registrationParams,
          value: registrationCostWei,
        }
      )

      console.log(LOG_PREFIX, 'Sending ENS registration tx with value:', registrationCostWei.toString())
      registrationTxHash = await startupChainWalletClient.sendTransaction({
        to: registerTxData.to as Address,
        data: registerTxData.data as `0x${string}`,
        value: registrationCostWei,
        account: startupChainAccount,
        chain: startupChainChain,
      })
      console.log(LOG_PREFIX, 'ENS registration tx hash:', registrationTxHash)

      await updatePendingRegistration({
        registrationTxHash,
      })

      console.log(LOG_PREFIX, 'Waiting for ENS registration receipt...')
      await startupChainPublicClient.waitForTransactionReceipt({
        hash: registrationTxHash,
      })
      console.log(LOG_PREFIX, 'ENS registration confirmed!')
    } else if (!registrationTxHash) {
      registrationTxHash = pending.commitTxHash
    }

    // STEP 3: Record company on StartupChain contract using recordCompany()
    console.log(LOG_PREFIX, 'STEP 3: Recording company on StartupChain contract')
    await updatePendingRegistration({
      status: "creating",
      registrationTxHash,
      safeAddress: deployedSafeAddress,
      error: undefined,
    })

    console.log(LOG_PREFIX, 'Calling recordCompany with:', {
      label,
      safeAddress: deployedSafeAddress,
      foundersCount: pending.founders.length,
      threshold: pending.threshold,
      serviceFee: serviceFee.toString(),
    })
    // Use recordCompany instead of registerCompany (no ENS registration in contract)
    companyTxHash = await startupChainWalletClient.writeContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: "recordCompany",
      args: [label, deployedSafeAddress, toContractFounders(pending.founders), BigInt(pending.threshold)],
      value: serviceFee, // Service fee goes to contract
      chain: startupChainChain,
      account: startupChainAccount,
    })

    console.log(LOG_PREFIX, 'Company tx hash:', companyTxHash)
    await updatePendingRegistration({ companyTxHash })

    console.log(LOG_PREFIX, 'Waiting for company tx receipt...')
    await startupChainPublicClient.waitForTransactionReceipt({
      hash: companyTxHash,
    })
    console.log(LOG_PREFIX, 'Company registration confirmed!')
  } catch (err) {
    console.log(LOG_PREFIX, 'ERROR in finalizeEnsRegistrationAction:', err)
    const message =
      err instanceof Error ? err.message : "Failed to finalize ENS registration"

    const alreadyRegistered =
      message.includes("Company already registered") ||
      message.includes("ENS name already taken")

    if (alreadyRegistered) {
      const resolvedRegistrationTx =
        registrationTxHash ?? pending.registrationTxHash ?? pending.commitTxHash
      const resolvedCompanyTx = companyTxHash ?? pending.companyTxHash
      const completed: PendingRecord = {
        ...pending,
        status: "completed",
        safeAddress: deployedSafeAddress,
        safeDeploymentTxHash,
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
    safeAddress: deployedSafeAddress,
    safeDeploymentTxHash,
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
 * Validate that ENS is registered to the expected owner
 * Used to verify ENS registration before company registration
 */
export async function validateEnsOwnershipAction(ensName: string, expectedOwner: string) {
  const { fullName } = normalizeEnsInput(ensName)

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

// Re-export payment actions for backward compatibility
export {
  getTreasuryAddressAction,
  verifyPrepaymentAction,
  checkPaymentStatusAction,
} from "./payment-actions"

