/**
 * Extracts ABI arrays from Hardhat artifact JSON files and writes typed ABI files
 * to lib/protocol/abis/. Run with: node scripts/extract-abis.mjs
 *
 * Source of truth: artifacts/contracts/**\/*.json (Solidity-compiled, never edit manually)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ARTIFACTS = path.join(ROOT, "artifacts", "contracts");
const OUT = path.join(ROOT, "lib", "protocol", "abis");

function readArtifact(relPath) {
  const full = path.join(ARTIFACTS, relPath);
  const json = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!Array.isArray(json.abi)) throw new Error(`No abi array in ${relPath}`);
  return json.abi;
}

function writeAbi(outFile, exportName, sourceFile, abi) {
  const header = `/* Auto-extracted from artifacts/contracts/${sourceFile} */\n/* Do not edit manually — re-run scripts/extract-abis.mjs */\n\n`;
  const body = JSON.stringify(abi, null, 2);
  const content = `${header}export const ${exportName} = ${body} as const;\n`;
  fs.writeFileSync(path.join(OUT, outFile), content, "utf8");
}

// artifact path → { out, export }
const targets = [
  // ─── Core trading ──────────────────────────────────────────────────────────
  { src: "vault/Vault.sol/Vault.json",                                    out: "vault.abi.ts",                    export: "vaultAbi" },
  { src: "router/Router.sol/Router.json",                                 out: "router.abi.ts",                   export: "routerAbi" },
  { src: "orderbook/OrderBook.sol/OrderBook.json",                        out: "orderBook.abi.ts",                export: "orderBookAbi" },
  { src: "orderbook/OrderBookReader.sol/OrderBookReader.json",            out: "orderBookReader.abi.ts",          export: "orderBookReaderAbi" },
  { src: "vault/VaultPriceFeed.sol/VaultPriceFeed.json",                  out: "vaultPriceFeed.abi.ts",           export: "vaultPriceFeedAbi" },
  { src: "peripherals/VaultReader.sol/VaultReader.json",                  out: "vaultReader.abi.ts",              export: "vaultReaderAbi" },
  { src: "vault/VaultUtils.sol/VaultUtils.json",                          out: "vaultUtils.abi.ts",               export: "vaultUtilsAbi" },
  { src: "position/PositionManager.sol/PositionManager.json",             out: "positionManager.abi.ts",          export: "positionManagerAbi" },
  { src: "position/PositionRouter.sol/PositionRouter.json",               out: "positionRouter.abi.ts",           export: "positionRouterAbi" },
  { src: "position/PositionUtils.sol/PositionUtils.json",                 out: "positionUtils.abi.ts",            export: "positionUtilsAbi" },
  { src: "vault/ShortsTracker.sol/ShortsTracker.json",                    out: "shortsTracker.abi.ts",            export: "shortsTrackerAbi" },
  { src: "oracle/FastPriceFeed.sol/FastPriceFeed.json",                   out: "fastPriceFeed.abi.ts",            export: "fastPriceFeedAbi" },
  { src: "oracle/FastPriceEvents.sol/FastPriceEvents.json",               out: "fastPriceEvents.abi.ts",          export: "fastPriceEventsAbi" },
  { src: "oracle/PriceFeed.sol/PriceFeed.json",                           out: "priceFeed.abi.ts",                export: "priceFeedAbi" },

  // ─── Tokens ────────────────────────────────────────────────────────────────
  { src: "tokens/WETH.sol/WETH.json",                                     out: "weth.abi.ts",                     export: "wethAbi" },
  { src: "tokens/FaucetToken.sol/FaucetToken.json",                       out: "btc.abi.ts",                      export: "btcAbi" },
  { src: "tokens/FaucetToken.sol/FaucetToken.json",                       out: "usdc.abi.ts",                     export: "usdcAbi" },
  { src: "tokens/FaucetToken.sol/FaucetToken.json",                       out: "usdt.abi.ts",                     export: "usdtAbi" },
  { src: "cyse/CYSE.sol/CYSE.json",                                       out: "cyse.abi.ts",                     export: "cyseAbi" },
  { src: "cyse/EsCYSE.sol/EsCYSE.json",                                   out: "escyse.abi.ts",                   export: "escyseAbi" },
  { src: "cyse/CyseIou.sol/CyseIou.json",                                 out: "cyseIou.abi.ts",                  export: "cyseIouAbi" },
  { src: "cyse/CYLP.sol/CYLP.json",                                       out: "cylp.abi.ts",                     export: "cylpAbi" },
  { src: "tokens/USDG.sol/USDG.json",                                     out: "usdg.abi.ts",                     export: "usdgAbi" },
  { src: "tokens/YieldToken.sol/YieldToken.json",                         out: "yieldToken.abi.ts",               export: "yieldTokenAbi" },
  { src: "tokens/MintableBaseToken.sol/MintableBaseToken.json",           out: "bonusCyse.abi.ts",                export: "bonusCyseAbi" },
  { src: "staking/StakedCylp.sol/StakedCylp.json",                       out: "stakedCylp.abi.ts",               export: "stakedCylpAbi" },
  { src: "libraries/token/ERC20.sol/ERC20.json",                          out: "erc20.abi.ts",                    export: "erc20Abi" },

  // ─── CYLP Manager ──────────────────────────────────────────────────────────
  { src: "vault/CylpManager.sol/CylpManager.json",                        out: "cylpManager.abi.ts",              export: "cylpManagerAbi" },
  { src: "staking/CylpBalance.sol/CylpBalance.json",                      out: "cylpBalance.abi.ts",              export: "cylpBalanceAbi" },

  // ─── Staking & Rewards ─────────────────────────────────────────────────────
  { src: "staking/RewardRouterV2.sol/RewardRouterV2.json",                out: "rewardRouter.abi.ts",             export: "rewardRouterAbi" },
  { src: "staking/StakeManager.sol/StakeManager.json",                    out: "stakeManager.abi.ts",             export: "stakeManagerAbi" },
  { src: "staking/RewardTracker.sol/RewardTracker.json",                  out: "rewardTracker.abi.ts",            export: "rewardTrackerAbi" },
  { src: "staking/RewardDistributor.sol/RewardDistributor.json",          out: "stakedCyseDistributor.abi.ts",    export: "stakedCyseDistributorAbi" },
  { src: "staking/BonusDistributor.sol/BonusDistributor.json",            out: "bonusCyseDistributor.abi.ts",     export: "bonusCyseDistributorAbi" },
  { src: "staking/RewardDistributor.sol/RewardDistributor.json",          out: "feeCyseDistributor.abi.ts",       export: "feeCyseDistributorAbi" },
  { src: "staking/RewardDistributor.sol/RewardDistributor.json",          out: "feeCylpDistributor.abi.ts",       export: "feeCylpDistributorAbi" },
  { src: "staking/RewardDistributor.sol/RewardDistributor.json",          out: "stakedCylpDistributor.abi.ts",    export: "stakedCylpDistributorAbi" },
  { src: "staking/Vester.sol/Vester.json",                                out: "cyseVester.abi.ts",               export: "cyseVesterAbi" },
  { src: "staking/Vester.sol/Vester.json",                                out: "cylpVester.abi.ts",               export: "cylpVesterAbi" },
  { src: "staking/VesterCap.sol/VesterCap.json",                          out: "vesterCap.abi.ts",                export: "vesterCapAbi" },

  // ─── Yield & Distribution ──────────────────────────────────────────────────
  { src: "tokens/TimeDistributor.sol/TimeDistributor.json",               out: "timeDistributor.abi.ts",          export: "timeDistributorAbi" },
  { src: "tokens/YieldTracker.sol/YieldTracker.json",                     out: "yieldTracker.abi.ts",             export: "yieldTrackerAbi" },

  // ─── Governance & Timelock ─────────────────────────────────────────────────
  { src: "peripherals/Timelock.sol/Timelock.json",                        out: "timelock.abi.ts",                 export: "timelockAbi" },
  { src: "peripherals/CyseTimelock.sol/CyseTimelock.json",                out: "cyseTimelock.abi.ts",             export: "cyseTimelockAbi" },
  { src: "peripherals/PriceFeedTimelock.sol/PriceFeedTimelock.json",      out: "priceFeedTimelock.abi.ts",        export: "priceFeedTimelockAbi" },
  { src: "peripherals/ShortsTrackerTimelock.sol/ShortsTrackerTimelock.json", out: "shortsTrackerTimelock.abi.ts", export: "shortsTrackerTimelockAbi" },

  // ─── Utility ───────────────────────────────────────────────────────────────
  { src: "vault/VaultErrorController.sol/VaultErrorController.json",      out: "vaultErrorController.abi.ts",     export: "vaultErrorControllerAbi" },
  { src: "access/TokenManager.sol/TokenManager.json",                     out: "tokenManager.abi.ts",             export: "tokenManagerAbi" },
  { src: "referrals/ReferralStorage.sol/ReferralStorage.json",            out: "referralStorage.abi.ts",          export: "referralStorageAbi" },
  { src: "referrals/ReferralReader.sol/ReferralReader.json",              out: "referralReader.abi.ts",           export: "referralReaderAbi" },
  { src: "peripherals/Reader.sol/Reader.json",                            out: "reader.abi.ts",                   export: "readerAbi" },
  { src: "peripherals/RewardReader.sol/RewardReader.json",                out: "rewardReader.abi.ts",             export: "rewardReaderAbi" },
  { src: "peripherals/PositionRouterReader.sol/PositionRouterReader.json",out: "positionRouterReader.abi.ts",     export: "positionRouterReaderAbi" },
  { src: "peripherals/BalanceUpdater.sol/BalanceUpdater.json",            out: "balanceUpdater.abi.ts",           export: "balanceUpdaterAbi" },
  { src: "peripherals/BatchSender.sol/BatchSender.json",                  out: "batchSender.abi.ts",              export: "batchSenderAbi" },
  { src: "peripherals/EsCyseBatchSender.sol/EsCyseBatchSender.json",      out: "esCyseBatchSender.abi.ts",        export: "esCyseBatchSenderAbi" },

  // ─── DEX & AMM ────────────────────────────────────────────────────────────
  { src: "amm/PancakeFactory.sol/PancakeFactory.json",                    out: "pancakeFactory.abi.ts",           export: "pancakeFactoryAbi" },
  { src: "amm/PancakeRouter.sol/PancakeRouter.json",                      out: "pancakeRouter.abi.ts",            export: "pancakeRouterAbi" },
  { src: "amm/UniFactory.sol/UniPoolManager.json",                        out: "uniPoolManager.abi.ts",           export: "uniPoolManagerAbi" },
  { src: "amm/UniPool.sol/UniPool.json",                                  out: "uniPool.abi.ts",                  export: "uniPoolAbi" },
  { src: "amm/UniNftManager.sol/UniPositionManager.json",                 out: "uniPositionManager.abi.ts",       export: "uniPositionManagerAbi" },

  // ─── Bridge & Floor ───────────────────────────────────────────────────────
  { src: "tokens/Bridge.sol/Bridge.json",                                 out: "bridge.abi.ts",                   export: "bridgeAbi" },
  { src: "cyse/CyseFloor.sol/CyseFloor.json",                             out: "cyseFloor.abi.ts",                export: "cyseFloorAbi" },
];

let ok = 0;
let fail = 0;

for (const { src, out, export: exportName } of targets) {
  try {
    const abi = readArtifact(src);
    writeAbi(out, exportName, src, abi);
    console.log(`✓  ${out}  (${abi.length} entries)`);
    ok++;
  } catch (e) {
    console.error(`✗  ${out}: ${e.message}`);
    fail++;
  }
}

console.log(`\n${ok} generated, ${fail} failed.`);
