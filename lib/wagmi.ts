import { createConfig, http, injected, fallback, unstable_connector } from "wagmi";
import { bscTestnet, sepolia, arbitrumSepolia } from "wagmi/chains";

// ─── GoChain Testnet / Hardhat local (chain ID 31337) ────────────────────────
// Native currency is GO (matching MetaMask's GoChain Testnet config).
// RPC is read from NEXT_PUBLIC_RPC_URL; falls back to GoChain public testnet.
export const goChainTestnet = {
  id: 31337,
  name: "GoChain Testnet",
  nativeCurrency: { name: "GoChain", symbol: "GO", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"] },
    public:  { http: [process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"] },
  },
  testnet: true,
} as const;

const connectorInstance = injected();

export const wagmiConfig = createConfig({
  chains: [goChainTestnet, sepolia, bscTestnet, arbitrumSepolia],
  connectors: [connectorInstance],
  transports: {
    // unstable_connector proxies ALL reads (useBalance, useReadContract, etc.)
    // through MetaMask's own provider — works regardless of which RPC MetaMask uses.
    // Falls back to HTTP if no wallet is connected (e.g. SSR / pre-connect).
    [goChainTestnet.id]: fallback([
      unstable_connector(injected),
      http(process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"),
    ]),
    [sepolia.id]:         http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://sepolia.infura.io/v3/"),
    [bscTestnet.id]:      http(process.env.BSC_TESTNET_URL    ?? "https://data-seed-prebsc-1-s1.binance.org:8545/"),
    [arbitrumSepolia.id]: http(process.env.ARBITRUM_TESTNET_URL ?? "https://sepolia-rollup.arbitrum.io/rpc"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
