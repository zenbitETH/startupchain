// ! Archived 2025-11-20
import { Button, Profile, mq } from '@ensdomains/thorin'
import { useWalletAuth } from '@/hooks/use-wallet-auth'
import styled, { css } from 'styled-components'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { mainnet } from 'wagmi/chains'

const StyledButton = styled(Button)`
  ${({ theme }) => css`
    width: fit-content;

    ${mq.xs.min(css`
      min-width: ${theme.space['45']};
    `)}
  `}
`

export function ConnectButton() {
  const { ready, authenticated, user, connect, disconnect } = useWalletAuth()
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  if (!ready) {
    return (
      <div
        aria-hidden={true}
        style={{
          opacity: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <StyledButton shape="rounded">Connect</StyledButton>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <StyledButton shape="rounded" onClick={connect}>
        Connect
      </StyledButton>
    )
  }

  // Check if we're on an unsupported chain
  const supportedChains = [1, 11155111, 8453, 84532] // mainnet, sepolia, base, baseSepolia
  const isUnsupportedChain = !supportedChains.includes(chainId)

  if (isUnsupportedChain) {
    return (
      <StyledButton
        shape="rounded"
        colorStyle="redPrimary"
        onClick={() => switchChain({ chainId: mainnet.id })}
      >
        Wrong network
      </StyledButton>
    )
  }

  const userAddress = address || user?.wallet?.address

  if (!userAddress) {
    return null
  }

  return (
    <Profile
      address={userAddress}
      dropdownItems={[
        {
          label: 'Copy Address',
          color: 'text',
          onClick: () => userAddress && copyToClipBoard(userAddress),
        },
        {
          label: 'Disconnect',
          color: 'red',
          onClick: disconnect,
        },
      ]}
    />
  )
}

const copyToClipBoard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}
