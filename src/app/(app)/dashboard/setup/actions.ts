'use server'

import { addEnsContracts } from '@ensdomains/ensjs'
import { getOwner, getPrice } from '@ensdomains/ensjs/public'
import { commitName, registerName } from '@ensdomains/ensjs/wallet'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'node:crypto'
import { Address, formatEther, isAddress } from 'viem'
import { createPublicClient, http } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

import {
  type PendingRegistration,
  clearPendingRegistration,
  getPendingRegistration,
  setPendingRegistration,
  updatePendingRegistration,
} from '../../../../lib/auth/pending-registration'
import {
  estimateSafeDeploymentGas,
  predictSafeAddress,
} from '../../../../lib/blockchain/safe-factory'
import { startupChainAbi } from '../../../../lib/blockchain/startupchain-abi'
import {
  startupChainAccount,
  startupChainChain,
  publicClient as startupChainPublicClient,
  walletClient as startupChainWalletClient,
} from '../../../../lib/blockchain/startupchain-client'
import {
  STARTUPCHAIN_CHAIN_ID,
  getEnsResolverAddress,
  getStartupChainAddress,
} from '../../../../lib/blockchain/startupchain-config'
import { isValidEnsName } from '../../../../lib/ens.js'
import {
  type BackendFounderInput,
  ZERO_ADDRESS,
  normalizeEnsInput,
  toContractFounders,
  toCookieFounders,
  toFounderStructs,
  validateThreshold,
} from './lib'

const chainId = process.env.NEXT_PUBLIC_CHAIN_ID === '1' ? 1 : 11155111
const baseChain = chainId === 1 ? mainnet : sepolia
const ensChain = addEnsContracts(baseChain)

function resolveRpcUrl() {
  const alchemyKey = process.env.ALCHEMY_API_KEY?.trim()
  if (!alchemyKey) {
    return ensChain.rpcUrls.default.http[0]
  }

  if (alchemyKey.startsWith('http')) {
    return alchemyKey
  }

  const host =
    chainId === 1
      ? 'https://eth-mainnet.g.alchemy.com/v2/'
      : 'https://eth-sepolia.g.alchemy.com/v2/'
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

export async function getEnsRegistrationCostAction(
  name: string,
  durationYears = 1,
  founderCount = 1
) {
  console.log(LOG_PREFIX, 'getEnsRegistrationCostAction called', {
    name,
    durationYears,
    founderCount,
  })
  if (!isValidEnsName(name)) {
    throw new Error('Invalid ENS name')
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
  const safeGasEstimate = await estimateSafeDeploymentGas(
    Math.max(1, founderCount)
  )

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
    result?.owner && result.owner !== ZERO_ADDRESS ? result.owner : null

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
  console.log(LOG_PREFIX, 'Input:', {
    ensName,
    founders,
    threshold,
    durationYears,
    paymentTxHash,
  })
  console.log(
    LOG_PREFIX,
    'Founder wallet addresses received:',
    founders.map((f) => f.wallet)
  )
  const { label, fullName } = normalizeEnsInput(ensName)
  console.log(LOG_PREFIX, 'Normalized:', { label, fullName })
  const founderStructs = toFounderStructs(founders)
  validateThreshold(threshold, founderStructs.length)

  // Get founder wallet addresses for Safe
  const founderAddresses = founderStructs.map((f) => f.wallet)

  // Generate unique saltNonce for this company - ensures different Safe address per company
  // Using ENS label + timestamp for uniqueness
  const saltNonce = `${label}-${Date.now()}`
  console.log(LOG_PREFIX, 'Generated saltNonce for unique Safe:', saltNonce)

  // Predict Safe address before deployment
  console.log(
    LOG_PREFIX,
    'Predicting Safe address for founders:',
    founderAddresses
  )
  const predictedSafeAddress = await predictSafeAddress({
    owners: founderAddresses,
    chainId: STARTUPCHAIN_CHAIN_ID,
    threshold,
    saltNonce,
  })
  console.log(LOG_PREFIX, 'Predicted Safe address:', predictedSafeAddress)

  const existingOwner = await getEnsOwnerAction(label)
  console.log(LOG_PREFIX, 'Existing ENS owner:', existingOwner)
  const isAlreadyOwner =
    existingOwner.owner &&
    existingOwner.owner !== ZERO_ADDRESS &&
    existingOwner.owner.toLowerCase() === predictedSafeAddress.toLowerCase()

  if (
    existingOwner.owner &&
    existingOwner.owner !== ZERO_ADDRESS &&
    !isAlreadyOwner
  ) {
    throw new Error(`ENS name "${label}.eth" is already registered`)
  }

  const years = Math.max(1, Math.floor(durationYears))
  const durationInSeconds = years * 365 * 24 * 60 * 60
  const secret = `0x${randomBytes(32).toString('hex')}` as `0x${string}`

  let commitTxHash: `0x${string}` =
    '0x0000000000000000000000000000000000000000000000000000000000000000'
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
    status: 'waiting',
    safeAddress: predictedSafeAddress, // Store predicted Safe address
    saltNonce, // Store salt for use during Safe deployment
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
  console.log(
    LOG_PREFIX,
    '=== commitEnsRegistrationAction COMPLETE ===',
    result
  )
  return result
}

export async function finalizeEnsRegistrationAction({
  ensName,
}: {
  ensName: string
}) {
  console.log(LOG_PREFIX, '=== finalizeEnsRegistrationAction START ===')
  console.log(LOG_PREFIX, 'Input ensName:', ensName)
  const { label, fullName } = normalizeEnsInput(ensName)
  console.log(LOG_PREFIX, 'Normalized:', { label, fullName })
  const pending = await getPendingRegistration()
  console.log(LOG_PREFIX, 'Pending registration:', pending)
  if (!pending || pending.ensLabel !== label) {
    console.log(LOG_PREFIX, 'ERROR: No pending registration found')
    throw new Error('No pending ENS registration found')
  }

  if (pending.status === 'completed') {
    await clearPendingRegistration()
    return pending
  }

  if (Date.now() < pending.readyAt) {
    throw new Error('Commitment window not ready yet')
  }

  if (!pending.secret) {
    throw new Error('Missing ENS commitment secret')
  }

  const contractAddress = getStartupChainAddress(STARTUPCHAIN_CHAIN_ID)
  if (contractAddress === ZERO_ADDRESS) {
    throw new Error('StartupChain contract address is not configured')
  }

  const markFailed = async (message: string) => {
    await updatePendingRegistration({
      status: 'failed',
      error: message,
    })
  }

  const finishAndClear = async (record: PendingRecord) => {
    try {
      await clearPendingRegistration()
    } finally {
      try {
        revalidatePath('/dashboard')
      } catch {
        // Ignore when revalidatePath is unavailable (e.g., unit tests)
      }
    }
    return record
  }

  // Check if THIS ENS NAME is already registered as a company
  // Note: We check by ENS name, not by Safe address, because:
  // - Same founders can create multiple companies with different ENS names
  // - Each company gets its own Safe (via saltNonce)
  console.log(
    LOG_PREFIX,
    'Checking if ENS name already registered as company:',
    label
  )
  try {
    const existingByEns = await startupChainPublicClient.readContract({
      address: contractAddress,
      abi: startupChainAbi,
      functionName: 'getCompanyByENS',
      args: [label],
    })
    if (existingByEns && existingByEns[0] > 0n) {
      console.log(
        LOG_PREFIX,
        'Company already exists for this ENS name:',
        existingByEns
      )
      const updatedExisting: PendingRecord = {
        ...pending,
        status: 'completed',
        safeAddress: existingByEns[1] as `0x${string}`, // Use the actual Safe address from contract
        updatedAt: Date.now(),
      }
      return finishAndClear(updatedExisting)
    }
    console.log(
      LOG_PREFIX,
      'ENS name not yet registered as company, proceeding...'
    )
  } catch (err) {
    // Company doesn't exist yet - continue with registration flow
    console.log(
      LOG_PREFIX,
      'getCompanyByENS check:',
      err instanceof Error ? err.message : 'not found, continuing'
    )
  }

  const years = Math.max(1, pending.durationYears)
  const { costWei, serviceFeeWei } = await getEnsRegistrationCostAction(
    label,
    years,
    pending.founders.length
  )
  const registrationCostWei = BigInt(costWei)
  const serviceFee = BigInt(serviceFeeWei)

  let safeDeploymentTxHash = pending.safeDeploymentTxHash
  let registrationTxHash = pending.registrationTxHash
  let companyTxHash = pending.companyTxHash
  let deployedSafeAddress = pending.safeAddress ?? pending.owner

  try {
    // STEP 1: Deploy Safe (if not already deployed)
    console.log(
      LOG_PREFIX,
      'STEP 1: Checking Safe deployment at:',
      deployedSafeAddress
    )
    // Check if Safe is already deployed by checking code at address
    const safeCode = await startupChainPublicClient.getCode({
      address: deployedSafeAddress,
    })
    const isSafeDeployed = safeCode && safeCode !== '0x'
    console.log(LOG_PREFIX, 'Safe deployed?', isSafeDeployed)

    if (!isSafeDeployed && !safeDeploymentTxHash) {
      console.log(LOG_PREFIX, 'Deploying Safe...')
      await updatePendingRegistration({
        status: 'deploying-safe',
        error: undefined,
      })

      // Deploy Safe using Safe SDK
      const { deploySafe } =
        await import('../../../../lib/blockchain/safe-factory.js')
      const founderAddresses = pending.founders.map((f) => f.wallet)

      const safeResult = await deploySafe({
        owners: founderAddresses,
        chainId: STARTUPCHAIN_CHAIN_ID,
        walletClient: startupChainWalletClient,
        publicClient: startupChainPublicClient,
        threshold: pending.threshold,
        saltNonce: pending.saltNonce, // Use same salt as prediction for correct address
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
      await updatePendingRegistration({
        status: 'registering',
        error: undefined,
      })

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

      console.log(
        LOG_PREFIX,
        'Sending ENS registration tx with value:',
        registrationCostWei.toString()
      )
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

      // Verify ENS registration on-chain
      console.log(LOG_PREFIX, 'Verifying ENS ownership on-chain...')
      const verifiedOwner = await getEnsOwnerAction(label)
      console.log(
        LOG_PREFIX,
        'Verified ENS owner after registration:',
        verifiedOwner
      )
      if (
        !verifiedOwner.owner ||
        verifiedOwner.owner.toLowerCase() !== deployedSafeAddress.toLowerCase()
      ) {
        console.log(LOG_PREFIX, 'WARNING: ENS ownership verification failed!')
        console.log(LOG_PREFIX, '  Expected owner:', deployedSafeAddress)
        console.log(LOG_PREFIX, '  Actual owner:', verifiedOwner.owner)
        throw new Error(
          `ENS registration verification failed. Expected owner ${deployedSafeAddress}, got ${verifiedOwner.owner}`
        )
      }
      console.log(LOG_PREFIX, 'ENS ownership verified successfully!')
    } else if (!registrationTxHash) {
      registrationTxHash = pending.commitTxHash
    }

    // STEP 3: Record company on StartupChain contract using recordCompany()
    console.log(
      LOG_PREFIX,
      'STEP 3: Recording company on StartupChain contract'
    )
    await updatePendingRegistration({
      status: 'creating',
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
      functionName: 'recordCompany',
      args: [
        label,
        deployedSafeAddress,
        toContractFounders(pending.founders),
        BigInt(pending.threshold),
      ],
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
      err instanceof Error ? err.message : 'Failed to finalize ENS registration'

    const alreadyRegistered =
      message.includes('Company already registered') ||
      message.includes('ENS name already taken')

    if (alreadyRegistered) {
      const resolvedRegistrationTx =
        registrationTxHash ?? pending.registrationTxHash ?? pending.commitTxHash
      const resolvedCompanyTx = companyTxHash ?? pending.companyTxHash
      const completed: PendingRecord = {
        ...pending,
        status: 'completed',
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
    status: 'completed',
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

export async function getEnsRegistrationStatusByOwnerAction(owner: string) {
  if (!isAddress(owner)) return null
  const pending = await getPendingRegistration()
  if (!pending) return null
  return pending.owner.toLowerCase() === owner.toLowerCase() ? pending : null
}
