// utils/provider.ts
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { hardhat, sepolia, bscTestnet, arbitrumSepolia } from "viem/chains";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

const CHAIN_MAP = {
  31337:  hardhat,
  11155111: sepolia,
  97:     bscTestnet,
  421614: arbitrumSepolia,
} as const;

export const activeChain = CHAIN_MAP[CHAIN_ID as keyof typeof CHAIN_MAP] ?? sepolia;

export const getPublicClient = () =>
  createPublicClient({
    chain: activeChain,
    transport: http(RPC_URL ?? activeChain.rpcUrls.default.http[0]),
  });

export const getWalletClient = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return createWalletClient({
      chain: activeChain,
      transport: custom(window.ethereum as Parameters<typeof custom>[0]),
    });
  }
  return null;
};
