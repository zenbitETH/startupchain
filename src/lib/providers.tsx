"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  Locale,
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { useLocale } from "next-intl";
import { WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "My vibe coding evm starter",
  projectId: process.env.WALLET_CONNECT_PROJECT_ID ?? "",
  chains: [mainnet],
  ssr: true,
});

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const locale = useLocale();

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider modalSize="compact" locale={locale as Locale}>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
};