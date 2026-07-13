"use server"

import { isAddress } from "viem"

import {
  publicClient as startupChainPublicClient,
  TREASURY_ADDRESS,
} from "../../../../lib/blockchain/startupchain-client"
import { STARTUPCHAIN_CHAIN_ID } from "../../../../lib/blockchain/startupchain-config"

/**
 * Get the treasury address where users should send prepayments
 */
export async function getTreasuryAddressAction() {
  return {
    address: TREASURY_ADDRESS,
    chainId: STARTUPCHAIN_CHAIN_ID,
  }
}

/**
 * Verify that user has sent payment to treasury
 * Checks treasury balance and compares with required amount
 */
export async function verifyPrepaymentAction({
  userAddress,
  requiredAmountWei,
}: {
  userAddress: string
  requiredAmountWei: string
}) {
  if (!isAddress(userAddress)) {
    throw new Error("Invalid user address")
  }

  const required = BigInt(requiredAmountWei)

  // Get treasury balance
  const treasuryBalance = await startupChainPublicClient.getBalance({
    address: TREASURY_ADDRESS,
  })

  // For simplicity, we check if treasury has enough to cover the registration
  // In production, you'd track individual payments per user/registration
  const hasSufficientFunds = treasuryBalance >= required

  return {
    treasuryAddress: TREASURY_ADDRESS,
    treasuryBalance: treasuryBalance.toString(),
    requiredAmount: required.toString(),
    hasSufficientFunds,
  }
}

/**
 * Verify a treasury prepayment transaction.
 *
 * SECURITY: verifies that the transaction
 * 1. exists and was successful,
 * 2. was sent TO the treasury address,
 * 3. has value >= the minimum required (if specified),
 * 4. (#7 — payment binding) was sent FROM one of the registration's founder wallets, so a stranger's
 *    payment can't be cited and a payment can't be replayed across registrations whose founder set does
 *    not include the original payer, and
 * 5. (optional) carries the expected per-registration commitment in its calldata (`expectedCommitment`),
 *    which — once the client sends it — binds one payment to exactly one (user, ENS) registration.
 *
 * NOTE (#7 residual): true single-use (one payment ⇒ at most one registration) additionally requires
 * either a persisted consumed-tx set or moving the fee on-chain into `recordCompany`'s msg.value. This
 * repo has no server-side store yet; the founder binding above closes the cross-user/cross-registration
 * replay vector, and `expectedCommitment` closes cross-ENS reuse when the client adopts it. Tracked as a
 * follow-up.
 */
export async function checkPaymentStatusAction({
  paymentTxHash,
  minValueWei,
  allowedFrom,
  expectedCommitment,
}: {
  paymentTxHash: string
  minValueWei?: string
  /** Founder wallet addresses; the payment must originate from one of them. */
  allowedFrom?: string[]
  /** 0x-hex the payment tx `input` must equal (per-registration commitment). Enforced only if set. */
  expectedCommitment?: string
}) {
  if (!paymentTxHash || !paymentTxHash.startsWith("0x")) {
    return { confirmed: false, error: "Invalid transaction hash" }
  }

  try {
    const receipt = await startupChainPublicClient.getTransactionReceipt({
      hash: paymentTxHash as `0x${string}`,
    })

    if (!receipt) {
      return { confirmed: false, pending: true }
    }

    // Check if transaction was successful and sent to treasury
    const tx = await startupChainPublicClient.getTransaction({
      hash: paymentTxHash as `0x${string}`,
    })

    const isToTreasury = tx.to?.toLowerCase() === TREASURY_ADDRESS.toLowerCase()
    const isSuccessful = receipt.status === "success"

    // SECURITY: Verify minimum payment amount if specified
    if (minValueWei) {
      const minValue = BigInt(minValueWei)
      if (tx.value < minValue) {
        return {
          confirmed: false,
          error: `Insufficient payment: received ${tx.value.toString()}, required ${minValueWei}`,
        }
      }
    }

    // SECURITY (#7): bind the payment to a founder of this registration.
    if (allowedFrom && allowedFrom.length > 0) {
      const from = tx.from?.toLowerCase()
      const isFromFounder = allowedFrom.some((a) => a.toLowerCase() === from)
      if (!isFromFounder) {
        return {
          confirmed: false,
          error: "Payment must be sent from a founder wallet of this registration",
        }
      }
    }

    // SECURITY (#7, optional): bind the payment to this specific registration via a commitment.
    if (expectedCommitment) {
      if ((tx.input ?? "0x").toLowerCase() !== expectedCommitment.toLowerCase()) {
        return {
          confirmed: false,
          error: "Payment commitment does not match this registration",
        }
      }
    }

    return {
      confirmed: isSuccessful && isToTreasury,
      pending: false,
      txHash: paymentTxHash,
      value: tx.value.toString(),
      from: tx.from,
      to: tx.to,
    }
  } catch {
    return { confirmed: false, error: "Transaction not found" }
  }
}
