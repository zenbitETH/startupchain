export const startupChainAbi = [
  {
    type: 'event',
    name: 'CompanyRegistered',
    inputs: [
      { name: 'companyId', type: 'uint256', indexed: true },
      { name: 'companyAddress', type: 'address', indexed: true },
      { name: 'ensName', type: 'string', indexed: false },
      { name: 'creationDate', type: 'uint256', indexed: false },
      { name: 'founders', type: 'address[]', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'registerCompany',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_ensName', type: 'string' },
      { name: '_owner', type: 'address' },
      { name: '_founders', type: 'address[]' },
      { name: '_duration', type: 'uint256' },
      { name: '_secret', type: 'bytes32' },
      { name: '_resolver', type: 'address' },
      { name: '_data', type: 'bytes[]' },
      { name: '_reverseRecord', type: 'bool' },
      { name: '_ownerControlledFuses', type: 'uint16' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCompanyByAddress',
    stateMutability: 'view',
    inputs: [{ name: '_address', type: 'address' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'companyAddress', type: 'address' },
      { name: 'ensName', type: 'string' },
      { name: 'creationDate', type: 'uint256' },
      { name: 'founders', type: 'address[]' },
    ],
  },
] as const
