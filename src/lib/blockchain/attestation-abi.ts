/**
 * AttestationModule ABI
 * Contract for creating EAS attestations for company events
 */
export const attestationModuleAbi = [
  // Constructor
  {
    type: 'constructor',
    inputs: [
      { name: '_eas', type: 'address', internalType: 'address' },
      {
        name: '_startupChainRegistry',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },

  // State variables (view)
  {
    type: 'function',
    name: 'eas',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IEAS' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'startupChainRegistry',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'companyFormationSchema',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'governanceDecisionSchema',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'financialTransactionSchema',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'milestoneAchievementSchema',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'membershipChangeSchema',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'contractDeploymentSchema',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },

  // Schema setters
  {
    type: 'function',
    name: 'setCompanyFormationSchema',
    inputs: [{ name: '_schema', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setGovernanceDecisionSchema',
    inputs: [{ name: '_schema', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setFinancialTransactionSchema',
    inputs: [{ name: '_schema', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setMilestoneAchievementSchema',
    inputs: [{ name: '_schema', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setMembershipChangeSchema',
    inputs: [{ name: '_schema', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setContractDeploymentSchema',
    inputs: [{ name: '_schema', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Attestation creation functions
  {
    type: 'function',
    name: 'createAttestation',
    inputs: [
      { name: '_companyId', type: 'uint256', internalType: 'uint256' },
      {
        name: '_attestationType',
        type: 'uint8',
        internalType: 'enum AttestationModule.AttestationType',
      },
      { name: '_description', type: 'string', internalType: 'string' },
      { name: '_data', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'attestCompanyFormation',
    inputs: [
      { name: '_companyId', type: 'uint256', internalType: 'uint256' },
      { name: '_companyName', type: 'string', internalType: 'string' },
      { name: '_founders', type: 'address[]', internalType: 'address[]' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'attestGovernanceDecision',
    inputs: [
      { name: '_companyId', type: 'uint256', internalType: 'uint256' },
      { name: '_proposalId', type: 'uint256', internalType: 'uint256' },
      { name: '_decision', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'attestFinancialTransaction',
    inputs: [
      { name: '_companyId', type: 'uint256', internalType: 'uint256' },
      { name: '_description', type: 'string', internalType: 'string' },
      { name: '_amount', type: 'uint256', internalType: 'uint256' },
      { name: '_recipient', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'attestMilestone',
    inputs: [
      { name: '_companyId', type: 'uint256', internalType: 'uint256' },
      { name: '_milestone', type: 'string', internalType: 'string' },
      { name: '_evidence', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'attestMembershipChange',
    inputs: [
      { name: '_companyId', type: 'uint256', internalType: 'uint256' },
      { name: '_member', type: 'address', internalType: 'address' },
      { name: '_added', type: 'bool', internalType: 'bool' },
      { name: '_role', type: 'string', internalType: 'string' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },

  // Revocation
  {
    type: 'function',
    name: 'revokeAttestation',
    inputs: [{ name: '_uid', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // View functions
  {
    type: 'function',
    name: 'getAttestation',
    inputs: [{ name: '_uid', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'uid', type: 'bytes32', internalType: 'bytes32' },
      { name: 'companyId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'attestationType',
        type: 'uint8',
        internalType: 'enum AttestationModule.AttestationType',
      },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'attester', type: 'address', internalType: 'address' },
      { name: 'revoked', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getCompanyAttestations',
    inputs: [{ name: '_companyId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32[]', internalType: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAttestationCount',
    inputs: [
      { name: '_companyId', type: 'uint256', internalType: 'uint256' },
      {
        name: '_attestationType',
        type: 'uint8',
        internalType: 'enum AttestationModule.AttestationType',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'attestations',
    inputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'uid', type: 'bytes32', internalType: 'bytes32' },
      { name: 'companyId', type: 'uint256', internalType: 'uint256' },
      {
        name: 'attestationType',
        type: 'uint8',
        internalType: 'enum AttestationModule.AttestationType',
      },
      { name: 'description', type: 'string', internalType: 'string' },
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
      { name: 'attester', type: 'address', internalType: 'address' },
      { name: 'revoked', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'companyAttestations',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      { name: '', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'attestationCounts',
    inputs: [
      { name: '', type: 'uint256', internalType: 'uint256' },
      {
        name: '',
        type: 'uint8',
        internalType: 'enum AttestationModule.AttestationType',
      },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },

  // Events
  {
    type: 'event',
    name: 'AttestationCreated',
    inputs: [
      { name: 'uid', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      {
        name: 'companyId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'attestationType',
        type: 'uint8',
        indexed: false,
        internalType: 'enum AttestationModule.AttestationType',
      },
      {
        name: 'attester',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'description',
        type: 'string',
        indexed: false,
        internalType: 'string',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'AttestationRevoked',
    inputs: [
      { name: 'uid', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      {
        name: 'companyId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'revoker',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'SchemaRegistered',
    inputs: [
      {
        name: 'attestationType',
        type: 'uint8',
        indexed: false,
        internalType: 'enum AttestationModule.AttestationType',
      },
      {
        name: 'schema',
        type: 'bytes32',
        indexed: false,
        internalType: 'bytes32',
      },
    ],
    anonymous: false,
  },
] as const

/**
 * Attestation types matching the contract enum
 */
export const AttestationType = {
  CompanyFormation: 0,
  GovernanceDecision: 1,
  FinancialTransaction: 2,
  MilestoneAchievement: 3,
  MembershipChange: 4,
  ContractDeployment: 5,
  Custom: 6,
} as const

export type AttestationType =
  (typeof AttestationType)[keyof typeof AttestationType]

/**
 * Human-readable attestation type names
 */
export const ATTESTATION_TYPE_NAMES: Record<AttestationType, string> = {
  [AttestationType.CompanyFormation]: 'Company Formation',
  [AttestationType.GovernanceDecision]: 'Governance Decision',
  [AttestationType.FinancialTransaction]: 'Financial Transaction',
  [AttestationType.MilestoneAchievement]: 'Milestone Achievement',
  [AttestationType.MembershipChange]: 'Membership Change',
  [AttestationType.ContractDeployment]: 'Contract Deployment',
  [AttestationType.Custom]: 'Custom',
}
