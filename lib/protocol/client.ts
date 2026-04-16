/**
 * Shared viem public client configured from environment variables.
 * Used by all API routes — never hardcode chain/RPC here.
 */
import { createPublicClient, http } from "viem";
import { hardhat, sepolia, bscTestnet, arbitrumSepolia } from "viem/chains";
import addresses from "@/protocol/addresses.json";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

const CHAIN_MAP = {
  31337:  hardhat,
  11155111: sepolia,
  97:     bscTestnet,
  421614: arbitrumSepolia,
} as const;

export const chain = CHAIN_MAP[CHAIN_ID as keyof typeof CHAIN_MAP] ?? hardhat;

export const publicClient = createPublicClient({
  chain,
  transport: http(RPC_URL ?? chain.rpcUrls.default.http[0]),
});

// Address lookup — all testnets share the localhost deployment for now
const NETWORK_MAP: Record<number, keyof typeof addresses> = {
  31337:  "localhost",
  11155111: "localhost",
  97:     "localhost",
  421614: "localhost",
};

export const addr = addresses[NETWORK_MAP[CHAIN_ID] ?? "localhost"] as Record<string, string>;
