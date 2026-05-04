/**
 * One-time setup: authorize PositionManager as a handler on ShortsTracker.
 *
 * The ShortsTracker contract uses an onlyHandler modifier that rejects
 * calls from any contract not explicitly whitelisted via setHandler().
 * Without this, executeIncreaseOrder / executeDecreaseOrder will revert
 * with "ShortsTracker: forbidden" for short positions.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/setup-shorts-tracker.ts
 *
 * Or via Hardhat (if hardhat.config is available):
 *   npx hardhat run scripts/setup-shorts-tracker.ts
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

// Hardhat default account #0 private key
const DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;

const SHORTS_TRACKER = "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E" as `0x${string}`;
const POSITION_MANAGER = "0x5067457698Fd6Fa1C6964e416b3f42713513B3dD" as `0x${string}`;

const shortsTrackerAbi = [
  {
    inputs: [
      { internalType: "address", name: "_handler", type: "address" },
      { internalType: "bool", name: "_isActive", type: "bool" },
    ],
    name: "setHandler",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "isHandler",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "gov",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function main() {
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http(RPC_URL),
  });

  const account = privateKeyToAccount(DEPLOYER_KEY);
  const walletClient = createWalletClient({
    account,
    chain: hardhat,
    transport: http(RPC_URL),
  });

  // Check current handler status
  const isAlreadyHandler = await publicClient.readContract({
    address: SHORTS_TRACKER,
    abi: shortsTrackerAbi,
    functionName: "isHandler",
    args: [POSITION_MANAGER],
  });

  console.log(`PositionManager isHandler: ${isAlreadyHandler}`);

  if (isAlreadyHandler) {
    console.log("Already configured — nothing to do.");
    return;
  }

  // Check who the governor is
  const gov = await publicClient.readContract({
    address: SHORTS_TRACKER,
    abi: shortsTrackerAbi,
    functionName: "gov",
  });
  console.log(`ShortsTracker gov: ${gov}`);
  console.log(`Deployer account: ${account.address}`);

  if (gov.toLowerCase() !== account.address.toLowerCase()) {
    console.error(`Deployer (${account.address}) is not the governor (${gov}). Cannot call setHandler.`);
    return;
  }

  console.log("Calling setHandler(PositionManager, true)...");
  const hash = await walletClient.writeContract({
    address: SHORTS_TRACKER,
    abi: shortsTrackerAbi,
    functionName: "setHandler",
    args: [POSITION_MANAGER, true],
    chain: hardhat,
  });

  console.log(`Tx submitted: ${hash}`);

  // Wait for confirmation
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Confirmed in block ${receipt.blockNumber}`);

  // Verify
  const verified = await publicClient.readContract({
    address: SHORTS_TRACKER,
    abi: shortsTrackerAbi,
    functionName: "isHandler",
    args: [POSITION_MANAGER],
  });
  console.log(`PositionManager isHandler after setup: ${verified}`);
  console.log(verified ? "✅ Setup complete!" : "❌ Setup failed!");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
