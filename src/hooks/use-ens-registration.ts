import { useCallback, useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Address, formatEther, createWalletClient, custom } from 'viem'
import { useConfig } from 'wagmi'
import { isValidEnsName } from '@/lib/ens'
import { sepoliaWithEns, mainnetWithEns } from '@/lib/web3'

// ENS.js imports - same as ens-register-test
import { getPrice, getOwner, getResolver } from '@ensdomains/ensjs/public'
import { commitName, registerName } from '@ensdomains/ensjs/wallet'
import { RegistrationParameters } from '@ensdomains/ensjs/utils'

// Buffer calculation for gas estimation (from ens-register-test)
// 102% of price as buffer for fluctuations (same as ens-register-test)
function calculateValueWithBuffer(value: bigint): bigint {
  return (value * BigInt(102)) / BigInt(100)
}

// Get current environment
const isDevelopment = process.env.NODE_ENV === 'development'
const currentChain = isDevelopment ? sepoliaWithEns : mainnetWithEns

export interface ENSRegistrationParams {
  name: string
  durationYears: number
  reverseRecord?: boolean
}

export function useEnsRegistration() {
  const { user, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commitment, setCommitment] = useState<{
    hash: string
    secret: string
    name: string
    owner: Address
    timestamp: number
  } | null>(null)

  const config = useConfig()
  const publicClient = config.getClient({ chainId: currentChain.id })

  // Get embedded wallet for signing
  const getEmbeddedWallet = useCallback(() => {
    return wallets.find(w =>
      w.walletClientType === 'privy' &&
      w.connectorType === 'embedded'
    )
  }, [wallets])

  // Get smart wallet from user's linked accounts
  const getSmartWallet = useCallback(() => {
    if (!user) return null

    const smartWallet = user.linkedAccounts?.find(
      account => account.type === 'smart_wallet'
    )

    if (smartWallet && 'address' in smartWallet && smartWallet.address) {
      return {
        address: smartWallet.address as Address,
        smartWalletType: ('smartWalletType' in smartWallet ? smartWallet.smartWalletType : 'safe') || 'safe'
      }
    }

    return null
  }, [user])

  // Check if ENS name is actually registered (post-registration verification)
  const checkNameRegistration = useCallback(async (name: string): Promise<{isRegistered: boolean, owner?: string}> => {
    if (!publicClient) throw new Error('Public client not available')

    try {
      const normalizedName = name.endsWith('.eth') ? name : `${name}.eth`
      console.log('🔍 Checking registration status for:', normalizedName)
      
      // Try to get owner using ensjs
      try {
        const ownerResult = await getOwner(publicClient, { name: normalizedName })
        console.log('📋 Owner result:', ownerResult)
        
        if (ownerResult && ownerResult.owner && ownerResult.owner !== '0x0000000000000000000000000000000000000000') {
          console.log('✅ Name is registered to owner:', ownerResult.owner)
          
          // Try to get resolver too
          try {
            const resolverResult = await getResolver(publicClient, { name: normalizedName })
            console.log('📋 Resolver result:', resolverResult)
          } catch (resolverError) {
            console.log('⚠️ No resolver found:', resolverError)
          }
          
          return { isRegistered: true, owner: ownerResult.owner }
        }
      } catch (ownerError) {
        console.log('⚠️ Could not get owner:', ownerError)
      }
      
      console.log('❌ Name is not registered')
      return { isRegistered: false }
    } catch (err) {
      console.error('Failed to check registration:', err)
      throw err
    }
  }, [publicClient])

  // Check if ENS name is available
  const checkAvailability = useCallback(async (name: string): Promise<boolean> => {
    if (!publicClient) throw new Error('Public client not available')

    try {
      // Normalize name (ensure .eth suffix)
      const normalizedName = name.endsWith('.eth') ? name : `${name}.eth`
      
      // Use ensjs getPrice to check if name exists (throws if unavailable)
      try {
        await getPrice(publicClient, {
          nameOrNames: normalizedName,
          duration: 31536000 // 1 year in seconds
        })
        return true // If getPrice succeeds, name is available for registration
      } catch (err: any) {
        if (err.message?.includes('NameNotAvailable') || err.message?.includes('unavailable')) {
          return false
        }
        throw err // Re-throw if it's a different error
      }
    } catch (err) {
      console.error('Failed to check availability:', err)
      throw err
    }
  }, [publicClient])

  // Get registration cost using ensjs
  const getRegistrationCost = useCallback(async (name: string, durationYears: number): Promise<{ costEth: string, costWei: bigint }> => {
    if (!publicClient) throw new Error('Public client not available')

    try {
      // Normalize name and calculate duration
      const normalizedName = name.endsWith('.eth') ? name : `${name}.eth`
      const duration = durationYears * 365 * 24 * 60 * 60 // years to seconds

      const priceData = await getPrice(publicClient, {
        nameOrNames: normalizedName,
        duration
      })

      const totalCost = priceData.base + priceData.premium
      const valueWithBuffer = calculateValueWithBuffer(totalCost)

      return {
        costEth: formatEther(valueWithBuffer),
        costWei: valueWithBuffer
      }
    } catch (err) {
      console.error('Failed to get registration cost:', err)
      throw err
    }
  }, [publicClient])

  // Check wallet balance
  const checkWalletBalance = useCallback(async (): Promise<{ balance: string, hasEnough: boolean, cost: bigint }> => {
    const embeddedWallet = getEmbeddedWallet()
    const smartWallet = getSmartWallet()

    if (!embeddedWallet) {
      throw new Error('No wallet found')
    }

    // Always check embedded wallet balance since it pays for transactions
    const walletAddress = embeddedWallet.address
    if (!walletAddress) {
      throw new Error('No wallet address found')
    }

    try {
      await embeddedWallet.switchChain(currentChain.id)
      const provider = await embeddedWallet.getEthereumProvider()

      // Get balance
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      })

      // Get approximate cost (for a typical 10-character name, 1 year)
      const { costWei } = await getRegistrationCost('samplename', 1)

      const balanceWei = BigInt(balance as string)
      const hasEnough = balanceWei >= costWei

      return {
        balance: formatEther(balanceWei),
        hasEnough,
        cost: costWei
      }
    } catch (err) {
      console.error('Failed to check wallet balance:', err)
      throw err
    }
  }, [getEmbeddedWallet, getSmartWallet, getRegistrationCost])

  // Step 1: Make commitment using ensjs
  const makeCommitment = useCallback(async (params: ENSRegistrationParams): Promise<string> => {
    if (!authenticated || !user) {
      throw new Error('User must be authenticated')
    }

    if (!publicClient) {
      throw new Error('Public client not available')
    }

    const embeddedWallet = getEmbeddedWallet()
    if (!embeddedWallet) {
      throw new Error('Embedded wallet not found')
    }

    // Validate ENS name format
    if (!isValidEnsName(params.name)) {
      throw new Error('Invalid ENS name format. Name must be 3-63 characters, contain only letters, numbers, and hyphens, and not start/end with hyphens.')
    }

    setIsCommitting(true)
    setError(null)

    try {
      // Get actual cost for this specific name first
      const { costEth, costWei } = await getRegistrationCost(params.name, params.durationYears)
      console.log('💰 Actual registration cost for', params.name + ':', costEth, 'ETH')
      
      // Check wallet balance against actual cost
      console.log('💰 Checking embedded wallet balance (this wallet pays for ENS registration)...')
      const { balance, hasEnough } = await checkWalletBalance()
      console.log('💰 Balance check:', {
        embeddedWallet: embeddedWallet.address,
        balance: `${balance} ETH`,
        cost: `${costEth} ETH`,
        hasEnough
      })

      if (!hasEnough) {
        throw new Error(`Insufficient balance. You need ${costEth} ETH but only have ${balance} ETH. Get Sepolia ETH from: https://sepoliafaucet.com/`)
      }

      // For testing, register directly to embedded wallet (simpler flow)
      // Later we can register to smart wallet if needed
      const ownerAddress = embeddedWallet.address as Address
      console.log('🎯 Registering to wallet address:', ownerAddress)

      console.log('🔐 Making ENS commitment for:', {
        name: params.name,
        owner: ownerAddress,
        duration: params.durationYears,
        walletType: 'Embedded Wallet', // Simplified for testing
      })

      // Generate secret for commitment
      const secret = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}` as `0x${string}`

      // Normalize ENS name
      const normalizedName = params.name.endsWith('.eth') ? params.name : `${params.name}.eth`
      const duration = params.durationYears * 365 * 24 * 60 * 60 // years to seconds

      console.log(`✅ ENS name "${normalizedName}" - proceeding with commitment`)

      // Create registration parameters using ensjs format
      const registrationParams: RegistrationParameters = {
        name: normalizedName,
        owner: ownerAddress,
        duration,
        secret,
        resolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD', // Sepolia ENS Public Resolver (from ens-register-test)
        records: undefined,
        reverseRecord: params.reverseRecord || false,
        fuses: {
          named: [],
          unnamed: []
        }
      }

      // Switch to current chain and create wallet client
      await embeddedWallet.switchChain(currentChain.id)
      const provider = await embeddedWallet.getEthereumProvider()
      
      const walletClient = createWalletClient({
        account: embeddedWallet.address as Address,
        chain: currentChain,
        transport: custom(provider)
      })

      // Use ensjs commitName makeFunctionData
      console.log('🔐 Creating commit transaction with params:', registrationParams)
      const commitTxData = commitName.makeFunctionData(walletClient, registrationParams)
      
      console.log('📨 Sending commit transaction...')
      
      // Add timeout to prevent infinite hanging
      const txPromise = provider.request({
        method: 'eth_sendTransaction',
        params: [commitTxData]
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout after 30 seconds')), 30000)
      )
      
      const txHash = await Promise.race([txPromise, timeoutPromise])
      console.log('📨 Commit transaction hash received:', txHash)
      console.log('🔗 View commit transaction: https://sepolia.etherscan.io/tx/' + txHash)
      console.log('🗓️ Commit transaction details:')
      console.log('  - To:', '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72')
      console.log('  - From:', embeddedWallet.address)
      console.log('  - Name:', normalizedName)
      console.log('  - Owner:', ownerAddress)
      console.log('  - Secret:', secret)

      console.log('✅ Commitment transaction sent:', txHash)
      console.log(`🔍 View on Sepolia Etherscan: https://sepolia.etherscan.io/tx/${txHash}`)
      
      // Don't wait for confirmation to avoid blocking UI
      console.log('⏳ Commitment transaction submitted, not waiting for confirmation to avoid blocking UI')
      console.log('🔗 Transaction will be confirmed in background')

      // Store commitment data in both state AND localStorage for persistence
      const commitmentData = {
        hash: txHash as string,
        secret: secret,
        name: normalizedName,
        owner: ownerAddress,
        timestamp: Date.now(),
      }
      
      setCommitment(commitmentData)
      
      // ALSO store in localStorage to survive React state resets
      localStorage.setItem('ens-commitment-' + normalizedName, JSON.stringify(commitmentData))
      console.log('💾 Commitment stored in localStorage as backup:', commitmentData)
      
      return txHash as string

    } catch (err) {
      console.error('❌ Commitment failed with error:', err)
      const message = err instanceof Error ? err.message : 'Failed to make commitment'
      console.error('❌ Error message:', message)
      setError(message)
      throw err
    } finally {
      setIsCommitting(false)
    }
  }, [authenticated, user, publicClient, getEmbeddedWallet, checkWalletBalance, getRegistrationCost])

  // Step 2: Register ENS name using ensjs
  const register = useCallback(async (params: ENSRegistrationParams): Promise<string> => {
    if (!authenticated || !user) {
      throw new Error('User must be authenticated')
    }

    console.log('🔍 DEBUG: Checking commitment state...')
    console.log('  - Commitment exists:', !!commitment)
    console.log('  - Commitment data:', commitment)
    console.log('  - Current time:', Date.now())
    console.log('  - Time since commit:', commitment ? Date.now() - commitment.timestamp : 'N/A')

    let activeCommitment = commitment
    
    // If state commitment is lost, try to recover from localStorage
    if (!activeCommitment) {
      console.log('⚠️ State commitment lost, checking localStorage...')
      const normalizedName = params.name.endsWith('.eth') ? params.name : `${params.name}.eth`
      const stored = localStorage.getItem('ens-commitment-' + normalizedName)
      if (stored) {
        try {
          activeCommitment = JSON.parse(stored)
          console.log('✅ Recovered commitment from localStorage:', activeCommitment)
          setCommitment(activeCommitment) // Restore to state
        } catch (err) {
          console.error('❌ Failed to parse stored commitment:', err)
        }
      }
    }

    if (!activeCommitment) {
      console.error('❌ REGISTRATION FAILED: No commitment found in state OR localStorage!')
      console.error('This is why registration transactions never get sent.')
      throw new Error('No commitment found. Please make commitment first.')
    }
    
    console.log('✅ Using commitment:', activeCommitment)

    // Check if enough time has passed (minimum 1 minute on testnets)
    const timeSinceCommit = Date.now() - activeCommitment.timestamp
    if (timeSinceCommit < 60 * 1000) {
      throw new Error(`Please wait ${Math.ceil((60 * 1000 - timeSinceCommit) / 1000)} more seconds before registering`)
    }

    const embeddedWallet = getEmbeddedWallet()
    if (!embeddedWallet) {
      throw new Error('Embedded wallet not found')
    }

    if (!publicClient) {
      throw new Error('Public client not available')
    }

    setIsRegistering(true)
    setError(null)

    try {
      console.log('📝 Registering ENS name:', {
        name: params.name,
        owner: activeCommitment.owner,
        duration: params.durationYears,
      })

      const duration = params.durationYears * 365 * 24 * 60 * 60

      // Get exact registration cost for this name
      const { costEth, costWei } = await getRegistrationCost(params.name, params.durationYears)
      console.log('💰 Final registration cost:', {
        name: activeCommitment.name,
        duration: `${params.durationYears} year(s)`,
        cost: `${costEth} ETH`
      })

      // Create registration parameters using ensjs format
      const registrationParams: RegistrationParameters = {
        name: activeCommitment.name,
        owner: activeCommitment.owner,
        duration,
        secret: activeCommitment.secret as `0x${string}`,
        resolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD', // Sepolia ENS Public Resolver (from ens-register-test)
        records: undefined,
        reverseRecord: params.reverseRecord || false,
        fuses: {
          named: [],
          unnamed: []
        }
      }

      // Switch to current chain and create wallet client
      await embeddedWallet.switchChain(currentChain.id)
      const provider = await embeddedWallet.getEthereumProvider()
      
      const walletClient = createWalletClient({
        account: embeddedWallet.address as Address,
        chain: currentChain,
        transport: custom(provider)
      })

      // Use ensjs registerName makeFunctionData with proper value buffer
      const valueWithBuffer = calculateValueWithBuffer(costWei)
      const registerParams = {
        ...registrationParams,
        value: valueWithBuffer
      }
      console.log('📝 Creating registration transaction with params:', registerParams)
      const registerTxData = registerName.makeFunctionData(walletClient, registerParams)
      
      console.log('📨 Sending registration transaction...')
      
      // Add timeout to prevent infinite hanging
      const txPromise = provider.request({
        method: 'eth_sendTransaction',
        params: [registerTxData]
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timeout after 30 seconds')), 30000)
      )
      
      const txHash = await Promise.race([txPromise, timeoutPromise])
      console.log('📨 Registration transaction hash received:', txHash)
      console.log('🔗 View registration transaction: https://sepolia.etherscan.io/tx/' + txHash)
      console.log('🗓️ Registration transaction details:')
      console.log('  - To:', '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72')
      console.log('  - From:', embeddedWallet.address)
      console.log('  - Name:', activeCommitment.name)
      console.log('  - Owner:', activeCommitment.owner)
      console.log('  - Value:', formatEther(valueWithBuffer), 'ETH')
      console.log('  - Duration:', params.durationYears, 'year(s)')
      console.log('  - Resolver:', '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD')

      console.log('🎉 ENS registration transaction sent:', txHash)
      console.log(`🔍 View on Sepolia Etherscan: https://sepolia.etherscan.io/tx/${txHash}`)
      
      // Don't wait for confirmation to avoid blocking UI
      console.log('⏳ Registration transaction submitted, not waiting for confirmation to avoid blocking UI')
      console.log('🔗 Transaction will be confirmed in background')
      
      console.log(`✅ ${activeCommitment.name} registered to ${activeCommitment.owner}`)
      
      // Wait a moment then check if registration actually worked
      console.log('🔍 Waiting 10 seconds then checking registration status...')
      setTimeout(async () => {
        try {
          const registrationStatus = await checkNameRegistration(params.name)
          if (registrationStatus.isRegistered) {
            console.log('✅ VERIFICATION SUCCESS: Name is registered to:', registrationStatus.owner)
            console.log('🎉 You can now check your name at: https://sepolia.app.ens.domains/' + (activeCommitment?.name || params.name + '.eth'))
          } else {
            console.log('❌ VERIFICATION FAILED: Name is not showing as registered')
            console.log('🔗 Check transactions manually:')
            console.log('  - Commitment: https://sepolia.etherscan.io/tx/' + (activeCommitment?.hash || 'unknown'))
            console.log('  - Registration: https://sepolia.etherscan.io/tx/' + txHash)
          }
        } catch (verifyError) {
          console.error('⚠️ Verification check failed:', verifyError)
        }
      }, 10000)

      // Clear commitment after successful registration
      setCommitment(null)
      
      // Also clear from localStorage
      localStorage.removeItem('ens-commitment-' + activeCommitment.name)
      console.log('📋 Cleared commitment from localStorage')

      return txHash as string

    } catch (err) {
      console.error('❌ Registration failed with error:', err)
      const message = err instanceof Error ? err.message : 'Failed to register ENS name'
      console.error('❌ Error message:', message)
      setError(message)
      throw err
    } finally {
      setIsRegistering(false)
    }
  }, [authenticated, user, commitment, publicClient, getEmbeddedWallet, getRegistrationCost, checkNameRegistration])

  const embeddedWallet = getEmbeddedWallet()

  return {
    checkAvailability,
    checkNameRegistration,
    getRegistrationCost,
    checkWalletBalance,
    makeCommitment,
    register,
    commitment,
    isCommitting,
    isRegistering,
    error,
    ownerAddress: embeddedWallet?.address || null,
    hasSmartWallet: false, // Simplified for testing
    canRegister: !!commitment && (Date.now() - commitment.timestamp) >= 60 * 1000,
    // Debug helpers
    debugCurrentState: () => {
      console.log('🔍 Current ENS Registration State:')
      console.log('  - Embedded Wallet:', embeddedWallet?.address)
      console.log('  - Commitment:', commitment)
      console.log('  - Can Register:', !!commitment && (Date.now() - commitment.timestamp) >= 60 * 1000)
      console.log('  - Is Committing:', isCommitting)
      console.log('  - Is Registering:', isRegistering)
      console.log('  - Error:', error)
      console.log('  - Registrar Controller:', '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72')
      console.log('  - Public Resolver:', '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD')
    }
  }
}