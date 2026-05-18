import addresses from "@/protocol/addresses.json";
import { isAddress, type PublicClient } from "viem";
import { vaultAbi } from "./abis/vault.abi";
import { routerAbi } from "./abis/router.abi";
import { orderBookAbi } from "./abis/orderBook.abi";
import { orderBookReaderAbi } from "./abis/orderBookReader.abi";
import { vaultPriceFeedAbi } from "./abis/vaultPriceFeed.abi";
import { vaultReaderAbi } from "./abis/vaultReader.abi";
import { vaultUtilsAbi } from "./abis/vaultUtils.abi";
import { erc20Abi } from "./abis/erc20.abi";
import { wethAbi } from "./abis/weth.abi";
import { cyseAbi } from "./abis/cyse.abi";
import { cylpAbi } from "./abis/cylp.abi";
import { usdgAbi } from "./abis/usdg.abi";
import { positionManagerAbi } from "./abis/positionManager.abi";
import { cylpManagerAbi } from "./abis/cylpManager.abi";
import { shortsTrackerAbi } from "./abis/shortsTracker.abi";
import { fastPriceFeedAbi } from "./abis/fastPriceFeed.abi";
import { rewardRouterAbi } from "./abis/rewardRouter.abi";
import { rewardTrackerAbi } from "./abis/rewardTracker.abi";
import { positionRouterAbi } from "./abis/positionRouter.abi";
import { positionUtilsAbi } from "./abis/positionUtils.abi";
import { fastPriceEventsAbi } from "./abis/fastPriceEvents.abi";
import { btcAbi } from "./abis/btc.abi";
import { usdcAbi } from "./abis/usdc.abi";
import { usdtAbi } from "./abis/usdt.abi";
import { escyseAbi } from "./abis/escyse.abi";
import { cyseIouAbi } from "./abis/cyseIou.abi";
import { yieldTokenAbi } from "./abis/yieldToken.abi";
import { bonusCyseAbi } from "./abis/bonusCyse.abi";
import { stakedCylpAbi } from "./abis/stakedCylp.abi";
import { cylpBalanceAbi } from "./abis/cylpBalance.abi";
import { stakeManagerAbi } from "./abis/stakeManager.abi";
import { stakedCyseDistributorAbi } from "./abis/stakedCyseDistributor.abi";
import { bonusCyseDistributorAbi } from "./abis/bonusCyseDistributor.abi";
import { feeCyseDistributorAbi } from "./abis/feeCyseDistributor.abi";
import { feeCylpDistributorAbi } from "./abis/feeCylpDistributor.abi";
import { stakedCylpDistributorAbi } from "./abis/stakedCylpDistributor.abi";
import { cyseVesterAbi } from "./abis/cyseVester.abi";
import { cylpVesterAbi } from "./abis/cylpVester.abi";
import { vesterCapAbi } from "./abis/vesterCap.abi";
import { timeDistributorAbi } from "./abis/timeDistributor.abi";
import { yieldTrackerAbi } from "./abis/yieldTracker.abi";
import { timelockAbi } from "./abis/timelock.abi";
import { cyseTimelockAbi } from "./abis/cyseTimelock.abi";
import { priceFeedTimelockAbi } from "./abis/priceFeedTimelock.abi";
import { shortsTrackerTimelockAbi } from "./abis/shortsTrackerTimelock.abi";
import { vaultErrorControllerAbi } from "./abis/vaultErrorController.abi";
import { tokenManagerAbi } from "./abis/tokenManager.abi";
import { referralStorageAbi } from "./abis/referralStorage.abi";
import { referralReaderAbi } from "./abis/referralReader.abi";
import { readerAbi } from "./abis/reader.abi";
import { rewardReaderAbi } from "./abis/rewardReader.abi";
import { positionRouterReaderAbi } from "./abis/positionRouterReader.abi";
import { balanceUpdaterAbi } from "./abis/balanceUpdater.abi";
import { batchSenderAbi } from "./abis/batchSender.abi";
import { esCyseBatchSenderAbi } from "./abis/esCyseBatchSender.abi";
import { pancakeFactoryAbi } from "./abis/pancakeFactory.abi";
import { pancakeRouterAbi } from "./abis/pancakeRouter.abi";
import { uniPoolManagerAbi } from "./abis/uniPoolManager.abi";
import { uniPoolAbi } from "./abis/uniPool.abi";
import { uniPositionManagerAbi } from "./abis/uniPositionManager.abi";
import { bridgeAbi } from "./abis/bridge.abi";
import { cyseFloorAbi } from "./abis/cyseFloor.abi";
import { mockPythAbi } from "./abis/mockPyth.abi";

export const PRICE_PRECISION = BigInt("1000000000000000000000000000000"); // 10^30
export const BASIS_POINTS_DIVISOR = BigInt(10000);
export const FUNDING_RATE_PRECISION = BigInt(1000000);

type NetworkKey = keyof typeof addresses;

function getNetwork(): NetworkKey {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337";
  const map: Record<string, NetworkKey> = {
    "31337": "localhost", // GO Testnet uses localhost addresses for now
    "11155111": "localhost", // Sepolia uses localhost addresses for now
    "97": "localhost", // BSC Testnet uses localhost addresses for now
    "421614": "localhost", // Arbitrum Sepolia uses localhost addresses for now
  };
  return map[chainId] ?? "localhost";
}

const network = getNetwork();
const addr = addresses[network] as Record<string, string>;

/** Returns the on-chain address for a deployed contract, or null if not yet deployed. */
function contractAddress(name: string): `0x${string}` | null {
  const a = addr[name];
  return a ? (a as `0x${string}`) : null;
}

/** Returns address or throws — use for contracts that MUST be present. */
function requiredAddress(name: string): `0x${string}` {
  const a = contractAddress(name);
  if (!a) throw new Error(`Contract address not found for: ${name} on network: ${network}`);
  return a;
}

// ─── Deployed contracts (42 total from addresses.json) ─────────────────────────
export const contracts = {
  // Core trading contracts
  vault:            { address: requiredAddress("Vault"),            abi: vaultAbi },
  router:           { address: requiredAddress("Router"),           abi: routerAbi },
  orderBook:        { address: requiredAddress("OrderBook"),        abi: orderBookAbi },
  orderBookReader:  { address: requiredAddress("OrderBookReader"),  abi: orderBookReaderAbi },
  vaultPriceFeed:   { address: requiredAddress("VaultPriceFeed"),   abi: vaultPriceFeedAbi },
  vaultReader:      { address: requiredAddress("VaultReader"),      abi: vaultReaderAbi },
  vaultUtils:       { address: requiredAddress("VaultUtils"),       abi: vaultUtilsAbi },
  positionManager:  { address: requiredAddress("PositionManager"),  abi: positionManagerAbi },
  positionRouter:   { address: requiredAddress("PositionRouter"),   abi: positionRouterAbi },
  positionUtils:    { address: requiredAddress("PositionUtils"),    abi: positionUtilsAbi },
  shortsTracker:    { address: requiredAddress("ShortsTracker"),    abi: shortsTrackerAbi },
  fastPriceFeed:    { address: requiredAddress("FastPriceFeed"),    abi: fastPriceFeedAbi },
  fastPriceEvents:  { address: requiredAddress("FastPriceEvents"),  abi: fastPriceEventsAbi },

  // Tokens
  weth:             { address: requiredAddress("WETH"),             abi: wethAbi },
  btc:              { address: requiredAddress("BTC"),              abi: btcAbi },
  usdc:             { address: requiredAddress("USDC"),             abi: usdcAbi },
  usdt:             { address: requiredAddress("USDT"),             abi: usdtAbi },
  cyse:             { address: requiredAddress("CYSE"),             abi: cyseAbi },
  escyse:           { address: requiredAddress("EsCYSE"),           abi: escyseAbi },
  cyseIou:          { address: requiredAddress("CyseIou"),          abi: cyseIouAbi },
  cylp:             { address: requiredAddress("CYLP"),             abi: cylpAbi },
  usdg:             { address: requiredAddress("USDG"),             abi: usdgAbi },
  yieldToken:       { address: requiredAddress("YieldToken"),       abi: yieldTokenAbi },
  bonusCyse:        { address: requiredAddress("BonusCyse"),        abi: bonusCyseAbi },
  stakedCylp:       { address: requiredAddress("StakedCylp"),       abi: stakedCylpAbi },

  // CYLP Manager
  cylpManager:      { address: requiredAddress("CylpManager"),      abi: cylpManagerAbi },
  cylpBalance:      { address: requiredAddress("CylpBalance"),      abi: cylpBalanceAbi },

  // Staking & Rewards
  rewardRouter:     { address: requiredAddress("RewardRouter"),     abi: rewardRouterAbi },
  stakeManager:     { address: requiredAddress("StakeManager"),     abi: stakeManagerAbi },
  stakedCyseTracker: { address: requiredAddress("StakedCyseTracker"), abi: rewardTrackerAbi },
  stakedCyseDistributor: { address: requiredAddress("StakedCyseDistributor"), abi: stakedCyseDistributorAbi },
  bonusCyseTracker: { address: requiredAddress("BonusCyseTracker"), abi: rewardTrackerAbi },
  bonusCyseDistributor: { address: requiredAddress("BonusCyseDistributor"), abi: bonusCyseDistributorAbi },
  feeCyseTracker:   { address: requiredAddress("FeeCyseTracker"),   abi: rewardTrackerAbi },
  feeCyseDistributor: { address: requiredAddress("FeeCyseDistributor"), abi: feeCyseDistributorAbi },
  feeCylpTracker:   { address: requiredAddress("FeeCylpTracker"),   abi: rewardTrackerAbi },
  feeCylpDistributor: { address: requiredAddress("FeeCylpDistributor"), abi: feeCylpDistributorAbi },
  stakedCylpTracker: { address: requiredAddress("StakedCylpTracker"), abi: rewardTrackerAbi },
  stakedCylpDistributor: { address: requiredAddress("StakedCylpDistributor"), abi: stakedCylpDistributorAbi },
  cyseVester:       { address: requiredAddress("CyseVester"),       abi: cyseVesterAbi },
  cylpVester:       { address: requiredAddress("CylpVester"),       abi: cylpVesterAbi },
  vester:           { address: requiredAddress("CyseVester"),       abi: cyseVesterAbi },
  vesterCap:        { address: requiredAddress("VesterCap"),        abi: vesterCapAbi },

  // Yield & Distribution
  timeDistributor:  { address: requiredAddress("TimeDistributor"),  abi: timeDistributorAbi },
  yieldTracker:     { address: requiredAddress("YieldTracker"),     abi: yieldTrackerAbi },

  // Governance & Timelock
  timelock:         { address: requiredAddress("Timelock"),         abi: timelockAbi },
  cyseTimelock:     { address: requiredAddress("CyseTimelock"),     abi: cyseTimelockAbi },
  priceFeedTimelock: { address: requiredAddress("PriceFeedTimelock"), abi: priceFeedTimelockAbi },
  shortsTrackerTimelock: { address: requiredAddress("ShortsTrackerTimelock"), abi: shortsTrackerTimelockAbi },

  // Utility Contracts
  vaultErrorController: { address: requiredAddress("VaultErrorController"), abi: vaultErrorControllerAbi },
  tokenManager:     { address: requiredAddress("TokenManager"),     abi: tokenManagerAbi },
  referralStorage:  { address: requiredAddress("ReferralStorage"),  abi: referralStorageAbi },
  referralReader:   { address: requiredAddress("ReferralReader"),   abi: referralReaderAbi },
  reader:           { address: requiredAddress("Reader"),           abi: readerAbi },
  rewardReader:     { address: requiredAddress("RewardReader"),     abi: rewardReaderAbi },
  positionRouterReader: { address: requiredAddress("PositionRouterReader"), abi: positionRouterReaderAbi },
  balanceUpdater:   { address: requiredAddress("BalanceUpdater"),   abi: balanceUpdaterAbi },
  batchSender:      { address: requiredAddress("BatchSender"),      abi: batchSenderAbi },
  esCyseBatchSender: { address: requiredAddress("EsCyseBatchSender"), abi: esCyseBatchSenderAbi },

  // DEX & AMM
  pancakeFactory:   { address: requiredAddress("PancakeFactory"),   abi: pancakeFactoryAbi },
  pancakeRouter:    { address: requiredAddress("PancakeRouter"),    abi: pancakeRouterAbi },
  uniPoolManager:   { address: requiredAddress("UniPoolManager"),   abi: uniPoolManagerAbi },
  uniPool:          { address: requiredAddress("UniPool"),          abi: uniPoolAbi },
  uniPositionManager: { address: requiredAddress("UniPositionManager"), abi: uniPositionManagerAbi },

  // Bridge & Floor
  bridge:           { address: requiredAddress("Bridge"),           abi: bridgeAbi },
  cyseFloor:        { address: requiredAddress("CyseFloor"),        abi: cyseFloorAbi },

  // Oracle
  mockPyth:         { address: requiredAddress("MockPyth"),         abi: mockPythAbi },
} as const;

// ─── Note: All 42 contracts from addresses.json are now included ─────────────
// All ABIs have been extracted from TypeChain factory files using scripts/extract-abis.mjs

export type ContractName = keyof typeof contracts;

// ─── Token / index maps ────────────────────────────────────────────────────────
export const INDEX_TOKENS: Record<string, `0x${string}`> = {
  WETH: requiredAddress("WETH"),
  ETH:  requiredAddress("WETH"),
  BTC:  requiredAddress("BTC"),
};

export const COLLATERAL_TOKENS: Record<string, `0x${string}`> = {
  WETH: requiredAddress("WETH"),
  ETH:  requiredAddress("WETH"),
  USDG: requiredAddress("USDG"),
  USDC: requiredAddress("USDC"),
  USDT: requiredAddress("USDT"),
  BTC:  requiredAddress("BTC"),
};

/** Generic ERC-20 ABI for any token approval / balance reads */
export { erc20Abi };

// ─── Token address to symbol mapping ─────────────────────────────────────────
const TOKEN_SYMBOLS: Record<string, string> = {
  [requiredAddress("WETH")]: "ETH",
  [requiredAddress("BTC")]: "BTC",
  [requiredAddress("USDC")]: "USDC",
  [requiredAddress("USDT")]: "USDT",
  [requiredAddress("USDG")]: "USDG",
  [requiredAddress("CYSE")]: "CYSE",
  [requiredAddress("CYLP")]: "CYLP",
  [requiredAddress("EsCYSE")]: "esCYSE",
};

/** Get token symbol from address (case-insensitive) */
export function getTokenSymbol(address: `0x${string}`): string | null {
  const normalized = address.toLowerCase();
  for (const [addr, symbol] of Object.entries(TOKEN_SYMBOLS)) {
    if (addr.toLowerCase() === normalized) {
      return symbol;
    }
  }
  return null;
}

export async function runProtocolStartupSanityCheck(publicClient: PublicClient) {
  const critical = {
    vault: requiredAddress("Vault"),
    vaultPriceFeed: requiredAddress("VaultPriceFeed"),
    fastPriceFeed: requiredAddress("FastPriceFeed"),
    usdg: requiredAddress("USDG"),
    router: requiredAddress("Router"),
    orderBook: requiredAddress("OrderBook"),
  };

  for (const [label, address] of Object.entries(critical)) {
    if (!isAddress(address)) {
      throw new Error(`Invalid ${label} address format: ${address}`);
    }

    const bytecode = await publicClient.getBytecode({ address });
    if (!bytecode || bytecode === "0x") {
      throw new Error(`${label} is not a deployed contract at ${address}`);
    }
  }

  const [vaultPriceFeedOnChain, vaultUsdgOnChain, vaultRouterOnChain] = await Promise.all([
    publicClient.readContract({
      address: critical.vault,
      abi: vaultAbi,
      functionName: "priceFeed",
    }),
    publicClient.readContract({
      address: critical.vault,
      abi: vaultAbi,
      functionName: "usdg",
    }),
    publicClient.readContract({
      address: critical.vault,
      abi: vaultAbi,
      functionName: "router",
    }),
  ]);

  if (vaultPriceFeedOnChain.toLowerCase() !== critical.vaultPriceFeed.toLowerCase()) {
    throw new Error(
      `Vault.priceFeed() mismatch. expected=${critical.vaultPriceFeed}, got=${vaultPriceFeedOnChain}`,
    );
  }

  if (vaultUsdgOnChain.toLowerCase() !== critical.usdg.toLowerCase()) {
    throw new Error(`Vault.usdg() mismatch. expected=${critical.usdg}, got=${vaultUsdgOnChain}`);
  }

  if (vaultRouterOnChain.toLowerCase() !== critical.router.toLowerCase()) {
    throw new Error(`Vault.router() mismatch. expected=${critical.router}, got=${vaultRouterOnChain}`);
  }

  const secondaryPriceFeedOnChain = await publicClient.readContract({
    address: critical.vaultPriceFeed,
    abi: vaultPriceFeedAbi,
    functionName: "secondaryPriceFeed",
  });

  if (secondaryPriceFeedOnChain.toLowerCase() !== critical.fastPriceFeed.toLowerCase()) {
    throw new Error(
      `VaultPriceFeed.secondaryPriceFeed() mismatch. expected=${critical.fastPriceFeed}, got=${secondaryPriceFeedOnChain}`,
    );
  }

  const fastPriceFeedVaultOnChain = await publicClient.readContract({
    address: critical.fastPriceFeed,
    abi: fastPriceFeedAbi,
    functionName: "vaultPriceFeed",
  });

  if (fastPriceFeedVaultOnChain.toLowerCase() !== critical.vaultPriceFeed.toLowerCase()) {
    throw new Error(
      `FastPriceFeed.vaultPriceFeed() mismatch. expected=${critical.vaultPriceFeed}, got=${fastPriceFeedVaultOnChain}`,
    );
  }

  const [orderBookVaultOnChain, orderBookRouterOnChain, orderBookUsdgOnChain] = await Promise.all([
    publicClient.readContract({
      address: critical.orderBook,
      abi: orderBookAbi,
      functionName: "vault",
    }),
    publicClient.readContract({
      address: critical.orderBook,
      abi: orderBookAbi,
      functionName: "router",
    }),
    publicClient.readContract({
      address: critical.orderBook,
      abi: orderBookAbi,
      functionName: "usdg",
    }),
  ]);

  if (orderBookVaultOnChain.toLowerCase() !== critical.vault.toLowerCase()) {
    throw new Error(
      `OrderBook.vault() mismatch. expected=${critical.vault}, got=${orderBookVaultOnChain}`,
    );
  }

  if (orderBookRouterOnChain.toLowerCase() !== critical.router.toLowerCase()) {
    throw new Error(
      `OrderBook.router() mismatch. expected=${critical.router}, got=${orderBookRouterOnChain}`,
    );
  }

  if (orderBookUsdgOnChain.toLowerCase() !== critical.usdg.toLowerCase()) {
    throw new Error(
      `OrderBook.usdg() mismatch. expected=${critical.usdg}, got=${orderBookUsdgOnChain}`,
    );
  }
}
