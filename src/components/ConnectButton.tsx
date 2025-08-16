import { Button, Profile, mq } from '@ensdomains/thorin'
import { usePrivy } from '@privy-io/react-auth'
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
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { address, isConnected } = useAccount()
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
      <StyledButton shape="rounded" onClick={login}>
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
          onClick: logout,
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
