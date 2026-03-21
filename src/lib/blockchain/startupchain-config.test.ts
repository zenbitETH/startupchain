import { isAddress } from 'viem'
import { describe, expect, it } from 'vitest'
import { mainnet, sepolia } from 'wagmi/chains'

import { getEnsControllerAddress } from './startupchain-config'

describe('getEnsControllerAddress', () => {
  it('returns valid ETHRegistrarController addresses for supported chains', () => {
    expect(getEnsControllerAddress(sepolia.id)).toBe(
      '0xfb3cE5D01e0f33f41DbB39035dB9745962F1f968'
    )
    expect(getEnsControllerAddress(mainnet.id)).toBe(
      '0x59E16fcCd424Cc24e280Be16E11Bcd56fb0CE547'
    )

    expect(isAddress(getEnsControllerAddress(sepolia.id))).toBe(true)
    expect(isAddress(getEnsControllerAddress(mainnet.id))).toBe(true)
  })
})
