import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { RegistrationParameters } from "@ensdomains/ensjs/utils"
import { commitName, registerName } from "@ensdomains/ensjs/wallet"
import { Address, createWalletClient, custom, formatEther } from "viem"

import {
  checkEnsAvailabilityAction,
  getEnsOwnerAction,
  getEnsRegistrationCostAction,
} from "@/app/(app)/dashboard/setup/actions"
import { isValidEnsName } from "@/lib/ens"
import { usePrivy, useWallets } from "@/lib/privy"
import { mainnetWithEns, sepoliaWithEns } from "@/lib/web3"

const isDevelopment = process.env.NODE_ENV === "development"
const currentChain = isDevelopment ? sepoliaWithEns : mainnetWithEns
const COMMIT_WAIT_SECONDS = 61

export interface ENSRegistrationParams {
  name: string
  durationYears: number
  reverseRecord?: boolean
  owner?: Address
}

type CommitmentState = {
  hash: string
  secret: `0x${string}`
  name: string
  owner: Address
}

export function useEnsRegistration() {
  const { user, authenticated } = usePrivy()
  const { wallets } = useWallets()

  const [commitment, setCommitment] = useState<CommitmentState | null>(null)
  const [registerReadyAt, setRegisterReadyAt] = useState<number | null>(null)
  const [commitmentCountdown, setCommitmentCountdown] = useState<number | null>(null)
  const [isCommitting, setIsCommitting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const countdownInterval = useRef<number | null>(null)

  useEffect(() => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current)
      countdownInterval.current = null
    }

    if (!registerReadyAt) {
      setCommitmentCountdown(null)
      return
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((registerReadyAt - Date.now()) / 1000))
      setCommitmentCountdown(remaining)
      if (remaining <= 0 && countdownInterval.current) {
        clearInterval(countdownInterval.current)
        countdownInterval.current = null
      }
    }

    updateCountdown()
    const id = window.setInterval(updateCountdown, 1000)
    countdownInterval.current = id

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current)
        countdownInterval.current = null
      }
    }
  }, [registerReadyAt])

  const getEmbeddedWallet = useCallback(() => {
    return wallets.find(
      (w) => w.walletClientType === "privy" && w.connectorType === "embedded"
    )
  }, [wallets])

  const getSmartWallet = useCallback(() => {
    if (!user) return null

    const smartWallet = user.linkedAccounts?.find(
      (account) => account.type === "smart_wallet"
    )

    if (smartWallet && "address" in smartWallet && smartWallet.address) {
      return {
        address: smartWallet.address as Address,
        smartWalletType:
          ("smartWalletType" in smartWallet
            ? smartWallet.smartWalletType
            : "safe") || "safe",
      }
    }

    return null
  }, [user])

  const checkAvailability = useCallback(async (name: string): Promise<boolean> => {
    const result = await checkEnsAvailabilityAction(name)
    return result.available
  }, [])

  const getRegistrationCost = useCallback(
    async (name: string, durationYears = 1) => {
      const result = await getEnsRegistrationCostAction(name, durationYears)
      return {
        costWei: BigInt(result.costWei),
        costEth: result.costEth,
      }
    },
    []
  )

  const checkWalletBalance = useCallback(
    async (name: string): Promise<{
      balance: string
      hasEnough: boolean
      cost: bigint
    }> => {
      const embeddedWallet = getEmbeddedWallet()

      if (!embeddedWallet) {
        throw new Error("No wallet found")
      }

      const { costWei } = await getRegistrationCost(name, 1)

      await embeddedWallet.switchChain(currentChain.id)
      const provider = await embeddedWallet.getEthereumProvider()

      const balance = await provider.request({
        method: "eth_getBalance",
        params: [embeddedWallet.address, "latest"],
      })

      const balanceWei = BigInt(balance as string)
      const hasEnough = balanceWei >= costWei

      return {
        balance: formatEther(balanceWei),
        hasEnough,
        cost: costWei,
      }
    },
    [getEmbeddedWallet, getRegistrationCost]
  )

  const makeCommitment = useCallback(
    async (params: ENSRegistrationParams): Promise<string> => {
      if (!authenticated || !user) {
        throw new Error("User must be authenticated")
      }

      if (!isValidEnsName(params.name)) {
        throw new Error("Invalid ENS name format")
      }

      const embeddedWallet = getEmbeddedWallet()
      if (!embeddedWallet) {
        throw new Error("Embedded wallet not found")
      }

      setIsCommitting(true)
      setError(null)

      try {
        const available = await checkAvailability(params.name)
        if (!available) {
          throw new Error(`ENS name "${params.name}" is not available for registration`)
        }

        const balanceCheck = await checkWalletBalance(params.name)
        if (!balanceCheck.hasEnough) {
          throw new Error(
            `Insufficient balance. Need ${formatEther(balanceCheck.cost)} ETH to register.`
          )
        }

        const ownerAddress = params.owner || (embeddedWallet.address as Address)
        const secret = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")}` as `0x${string}`

        const normalizedName = params.name.endsWith(".eth")
          ? params.name
          : `${params.name}.eth`
        const duration = params.durationYears * 365 * 24 * 60 * 60

        const registrationParams: RegistrationParameters = {
          name: normalizedName,
          owner: ownerAddress,
          duration,
          secret,
          resolverAddress: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
          records: undefined,
          reverseRecord: params.reverseRecord || false,
          fuses: {
            named: [],
            unnamed: [],
          },
        }

        await embeddedWallet.switchChain(currentChain.id)
        const provider = await embeddedWallet.getEthereumProvider()

        const walletClient = createWalletClient({
          account: embeddedWallet.address as Address,
          chain: currentChain,
          transport: custom(provider),
        })

        const commitTxData = commitName.makeFunctionData(walletClient, registrationParams)

        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [commitTxData],
        })

        setCommitment({
          hash: txHash as string,
          secret,
          name: normalizedName,
          owner: ownerAddress,
        })

        setRegisterReadyAt(Date.now() + COMMIT_WAIT_SECONDS * 1000)

        return txHash as string
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to make commitment"
        setError(message)
        throw err
      } finally {
        setIsCommitting(false)
      }
    },
    [authenticated, user, getEmbeddedWallet, checkAvailability, checkWalletBalance]
  )

  const waitForRegisterWindow = useCallback(async () => {
    if (!registerReadyAt) {
      throw new Error("No commitment found")
    }

    const waitMs = Math.max(0, registerReadyAt - Date.now())
    if (waitMs === 0) return

    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }, [registerReadyAt])

  const register = useCallback(
    async (params: ENSRegistrationParams): Promise<string> => {
      if (!authenticated || !user) {
        throw new Error("User must be authenticated")
      }

      if (!commitment) {
        throw new Error("No commitment found. Please make a commitment first.")
      }

      if (registerReadyAt && Date.now() < registerReadyAt) {
        throw new Error("Commitment window is not ready yet.")
      }

      const embeddedWallet = getEmbeddedWallet()
      if (!embeddedWallet) {
        throw new Error("Embedded wallet not found")
      }

      setIsRegistering(true)
      setError(null)

      try {
        const duration = params.durationYears * 365 * 24 * 60 * 60
        const { costWei } = await getRegistrationCost(commitment.name, params.durationYears)

        const registrationParams: RegistrationParameters = {
          name: commitment.name,
          owner: commitment.owner,
          duration,
          secret: commitment.secret,
          resolverAddress: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
          records: undefined,
          reverseRecord: params.reverseRecord || false,
          fuses: {
            named: [],
            unnamed: [],
          },
        }

        await embeddedWallet.switchChain(currentChain.id)
        const provider = await embeddedWallet.getEthereumProvider()

        const walletClient = createWalletClient({
          account: embeddedWallet.address as Address,
          chain: currentChain,
          transport: custom(provider),
        })

        const registerTxData = registerName.makeFunctionData(walletClient, {
          ...registrationParams,
          value: costWei,
        })

        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [registerTxData],
        })

        setCommitment(null)
        setRegisterReadyAt(null)
        setCommitmentCountdown(null)

        return txHash as string
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to register ENS name"
        setError(message)
        throw err
      } finally {
        setIsRegistering(false)
      }
    },
    [authenticated, user, commitment, registerReadyAt, getEmbeddedWallet, getRegistrationCost]
  )

  const checkNameRegistration = useCallback(
    async (
      name: string
    ): Promise<{
      isRegistered: boolean
      owner?: string
    }> => {
      const result = await getEnsOwnerAction(name)
      return {
        isRegistered: Boolean(result.owner),
        owner: result.owner ?? undefined,
      }
    },
    []
  )

  const embeddedWallet = getEmbeddedWallet()

  const canRegister = useMemo(
    () => registerReadyAt !== null && Date.now() >= registerReadyAt,
    [registerReadyAt]
  )

  return {
    checkAvailability,
    checkNameRegistration,
    getRegistrationCost,
    checkWalletBalance,
    makeCommitment,
    waitForRegisterWindow,
    register,
    commitment,
    commitmentCountdown,
    isCommitting,
    isRegistering,
    error,
    ownerAddress: embeddedWallet?.address || null,
    hasSmartWallet: Boolean(getSmartWallet()),
    canRegister,
  }
}
