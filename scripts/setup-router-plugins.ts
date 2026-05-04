/**
 * One-time setup: register PositionManager and OrderBook as plugins on the Router.
 *
 * The Router uses a plugins mapping to authorize which contracts can call
 * pluginIncreasePosition / pluginDecreasePosition / pluginTransfer.
 * Without this, executeIncreaseOrder / executeDecreaseOrder will revert
 * because the PositionManager can't call router.pluginIncreasePosition().
 *
 * Usage:
 *   npx tsx scripts/setup-router-plugins.ts
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

const DEPLOYER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`;

const ROUTER = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318" as `0x${string}`;
const POSITION_MANAGER = "0x5067457698Fd6Fa1C6964e416b3f42713513B3dD" as `0x${string}`;
const ORDER_BOOK = "0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff" as `0x${string}`;

const routerAbi = [
  {
    inputs: [{ internalType: "address", name: "_plugin", type: "address" }],
    name: "addPlugin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "plugins",
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

  const publicClient = createPublicClient({ chain: hardhat, transport: http(RPC_URL) });
  const account = privateKeyToAccount(DEPLOYER_KEY);
  const walletClient = createWalletClient({ account, chain: hardhat, transport: http(RPC_URL) });

  const gov = await publicClient.readContract({ address: ROUTER, abi: routerAbi, functionName: "gov" });
  console.log(`Router gov: ${gov}`);
  console.log(`Deployer: ${account.address}`);

  if (gov.toLowerCase() !== account.address.toLowerCase()) {
    console.error("Deployer is not the governor — cannot add plugins.");
    return;
  }

  for (const [label, pluginAddr] of [["PositionManager", POSITION_MANAGER], ["OrderBook", ORDER_BOOK]] as const) {
    const isPlugin = await publicClient.readContract({ address: ROUTER, abi: routerAbi, functionName: "plugins", args: [pluginAddr] });
    console.log(`${label} is plugin: ${isPlugin}`);

    if (!isPlugin) {
      console.log(`Adding ${label} as plugin...`);
      const hash = await walletClient.writeContract({
        address: ROUTER,
        abi: routerAbi,
        functionName: "addPlugin",
        args: [pluginAddr],
        chain: hardhat,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ ${label} added (${hash})`);
    }
  }

  // Verify
  const pmOk = await publicClient.readContract({ address: ROUTER, abi: routerAbi, functionName: "plugins", args: [POSITION_MANAGER] });
  const obOk = await publicClient.readContract({ address: ROUTER, abi: routerAbi, functionName: "plugins", args: [ORDER_BOOK] });
  console.log(`\nFinal: PositionManager=${pmOk}, OrderBook=${obOk}`);
  console.log(pmOk && obOk ? "✅ Setup complete!" : "❌ Setup failed!");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
