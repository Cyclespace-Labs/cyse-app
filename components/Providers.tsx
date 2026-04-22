"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, useChainId, usePublicClient } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import { runProtocolStartupSanityCheck } from "@/lib/protocol/contracts";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";

const queryClient = new QueryClient();

function ProtocolSanityGate({ children }: { children: ReactNode }) {
  const publicClient = usePublicClient();
  const chainId = useChainId();

  useEffect(() => {
    if (!publicClient) return;

    let cancelled = false;

    async function validate() {
      try {
        await runProtocolStartupSanityCheck(publicClient);
      } catch (error) {
        if (!cancelled) {
          toast.error("Startup contract sanity-check failed", {
            description: (error as Error).message,
            duration: Infinity,
            closeButton: true,
          });
        }
      }
    }

    validate();

    return () => {
      cancelled = true;
    };
  }, [publicClient, chainId]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ProtocolSanityGate>{children}</ProtocolSanityGate>
          <Toaster position="bottom-right" richColors theme="dark" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
