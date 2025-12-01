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
 * Check if user has already sent a payment transaction to treasury
 * by looking at recent transactions (simplified approach)
 */
export async function checkPaymentStatusAction({
  paymentTxHash,
}: {
  paymentTxHash: string
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
