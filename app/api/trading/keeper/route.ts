/**
 * POST /api/trading/keeper
 *
 * Server-side order executor. Signs and submits executeDecreaseOrder /
 * executeIncreaseOrder transactions using a dedicated keeper wallet
 * (KEEPER_PRIVATE_KEY env var) — no browser wallet approval required.
 *
 * The keeper wallet receives the execution fee set by the order creator,
 * making the keeper self-funding as long as fees cover gas.
 *
 * Required env var:
 *   KEEPER_PRIVATE_KEY — 0x-prefixed private key of the keeper wallet
 *
 * The keeper wallet needs a small ETH balance to cover gas for the first
 * execution before the execution fees start flowing back.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chain, publicClient, addr } from "@/lib/protocol/client";
import { orderBookAbi } from "@/lib/protocol/abis/orderBook.abi";

const ORDER_BOOK = addr["OrderBook"] as `0x${string}`;

export async function POST(req: NextRequest) {
  const KEEPER_KEY = process.env.KEEPER_PRIVATE_KEY;

  if (!KEEPER_KEY) {
    return NextResponse.json(
      { error: "Keeper not configured — add KEEPER_PRIVATE_KEY to .env.local" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderType, account, orderIndex } = body as {
    orderType: string;
    account: string;
    orderIndex: number;
  };

  if (!["decrease", "increase"].includes(orderType)) {
    return NextResponse.json({ error: "orderType must be 'decrease' or 'increase'" }, { status: 400 });
  }
  if (!account || !isAddress(account)) {
    return NextResponse.json({ error: "account must be a valid address" }, { status: 400 });
  }
  if (typeof orderIndex !== "number" || orderIndex < 0) {
    return NextResponse.json({ error: "orderIndex must be a non-negative number" }, { status: 400 });
  }

  try {
    const privateKey = (KEEPER_KEY.startsWith("0x") ? KEEPER_KEY : `0x${KEEPER_KEY}`) as `0x${string}`;
    const keeperAccount = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
      account: keeperAccount,
      chain,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL ?? chain.rpcUrls.default.http[0]),
    });

    const execArgs = [account as `0x${string}`, BigInt(orderIndex), keeperAccount.address] as const;

    console.log(
      `[Keeper] execute${orderType === "decrease" ? "Decrease" : "Increase"}Order — account=${account} index=${orderIndex} keeper=${keeperAccount.address}`
    );

    let hash: `0x${string}`;
    if (orderType === "decrease") {
      const { request } = await publicClient.simulateContract({
        address: ORDER_BOOK,
        abi: orderBookAbi,
        functionName: "executeDecreaseOrder",
        args: execArgs,
        account: keeperAccount,
      });
      hash = await walletClient.writeContract(request);
    } else {
      const { request } = await publicClient.simulateContract({
        address: ORDER_BOOK,
        abi: orderBookAbi,
        functionName: "executeIncreaseOrder",
        args: execArgs,
        account: keeperAccount,
      });
      hash = await walletClient.writeContract(request);
    }
    console.log(`[Keeper] Submitted hash=${hash}`);

    return NextResponse.json({ hash, keeper: keeperAccount.address });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Keeper execution failed";
    console.error("[Keeper] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
