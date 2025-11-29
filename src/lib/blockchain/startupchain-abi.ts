// Founder struct type for TypeScript
export type FounderStruct = {
  wallet: `0x${string}`
  equityBps: bigint
  role: string
}

/**
 * StartupChainSimple ABI - Simplified company registry
 * Contract: 0xE610acB5a74e65a1E0f234320954C12D67ec0b66 (Sepolia)
 * This contract stores company data only - ENS registration is handled separately
 */
export const startupChainAbi = [
  // Events
  {
    type: 'event',
    name: 'CompanyRegistered',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'ownerAddress', type: 'address', indexed: true },
      { name: 'ensName', type: 'string', indexed: false },
      { name: 'creationDate', type: 'uint256', indexed: false },
      { name: 'threshold', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CompanyTransferred',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'FeeCollected',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'recipient', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'FeeRecipientUpdated',
    inputs: [
      { name: 'oldRecipient', type: 'address', indexed: true },
      { name: 'newRecipient', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'FoundersSet',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'wallets', type: 'address[]', indexed: false },
      { name: 'equityBps', type: 'uint256[]', indexed: false },
      { name: 'roles', type: 'string[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ThresholdUpdated',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'oldThreshold', type: 'uint256', indexed: false },
      { name: 'newThreshold', type: 'uint256', indexed: false },
    ],
  },

  // Functions - Registration
  {
    type: 'function',
    name: 'registerCompany',
    stateMutability: 'payable',
    inputs: [
      { name: '_ensName', type: 'string' },
      { name: '_ownerAddress', type: 'address' },
      {
        name: '_founders',
        type: 'tuple[]',
        components: [
          { name: 'wallet', type: 'address' },
          { name: 'equityBps', type: 'uint256' },
          { name: 'role', type: 'string' },
        ],
      },
      { name: '_threshold', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // Functions - Getters
  {
    type: 'function',
    name: 'getCompany',
    stateMutability: 'view',
    inputs: [{ name: '_companyId', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'ownerAddress', type: 'address' },
      { name: 'ensName', type: 'string' },
      { name: 'creationDate', type: 'uint256' },
      { name: 'threshold', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getCompanyByAddress',
    stateMutability: 'view',
    inputs: [{ name: '_address', type: 'address' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'ownerAddress', type: 'address' },
      { name: 'ensName', type: 'string' },
      { name: 'creationDate', type: 'uint256' },
      { name: 'threshold', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getCompanyByENS',
    stateMutability: 'view',
    inputs: [{ name: '_ensName', type: 'string' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'ownerAddress', type: 'address' },
      { name: 'ensName', type: 'string' },
      { name: 'creationDate', type: 'uint256' },
      { name: 'threshold', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getCompanyFounders',
    stateMutability: 'view',
    inputs: [{ name: '_companyId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'wallet', type: 'address' },
          { name: 'equityBps', type: 'uint256' },
          { name: 'role', type: 'string' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getTotalCompanies',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // Functions - Updates
  {
    type: 'function',
    name: 'transferCompany',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_companyId', type: 'uint256' },
      { name: '_newOwner', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'updateThreshold',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_companyId', type: 'uint256' },
      { name: '_newThreshold', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'updateFounders',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_companyId', type: 'uint256' },
      {
        name: '_founders',
        type: 'tuple[]',
        components: [
          { name: 'wallet', type: 'address' },
          { name: 'equityBps', type: 'uint256' },
          { name: 'role', type: 'string' },
        ],
      },
    ],
    outputs: [],
  },

  // Functions - Admin
  {
    type: 'function',
    name: 'setFeeRecipient',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_newRecipient', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'transferOwnership',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_newOwner', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },

  // Functions - Fee calculation
  {
    type: 'function',
    name: 'calculateFee',
    stateMutability: 'pure',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // Constants
  {
    type: 'function',
    name: 'SERVICE_FEE_BPS',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'BPS_DENOMINATOR',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'feeRecipient',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },

  // Mappings
  {
    type: 'function',
    name: 'addressToCompanyId',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'ensNameToCompanyId',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // Storage mappings (for direct access)
  {
    type: 'function',
    name: 'companies',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'ownerAddress', type: 'address' },
      { name: 'ensName', type: 'string' },
      { name: 'creationDate', type: 'uint256' },
      { name: 'threshold', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'companyFounders',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'uint256' },
    ],
    outputs: [
      { name: 'wallet', type: 'address' },
      { name: 'equityBps', type: 'uint256' },
      { name: 'role', type: 'string' },
    ],
  },

  // Receive function
  { type: 'receive', stateMutability: 'payable' },
] as const
