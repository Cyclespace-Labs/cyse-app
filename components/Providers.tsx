"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useChainId, usePublicClient } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { runProtocolStartupSanityCheck } from "@/lib/protocol/contracts";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

function ProtocolSanityGate({ children }: { children: ReactNode }) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [sanityError, setSanityError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient) return;

    let cancelled = false;

    async function validate() {
      try {
        await runProtocolStartupSanityCheck(publicClient);
        if (!cancelled) {
          setSanityError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSanityError((error as Error).message);
        }
      }
    }

    validate();

    return () => {
      cancelled = true;
    };
  }, [publicClient, chainId]);

  if (sanityError) {
    return (
      <div className="m-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
        Startup contract sanity-check failed: {sanityError}
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ProtocolSanityGate>{children}</ProtocolSanityGate>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
