"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { TokenPriceData } from "@/types/trading";
import { useWallet } from "@/contexts/WalletContext";
import { useTradingActions } from "@/hooks/useTradingActions";
import { useOpenOrders } from "@/hooks/useOpenOrders";
import { useVaultPosition } from "@/hooks/useVaultPosition";
import { useAllVaultPositions, VaultPositionEntry } from "@/hooks/useAllVaultPositions";
import { useOrderKeeper } from "@/hooks/useOrderKeeper";
import { usePriceOracle } from "@/hooks/usePriceOracle";
import { usePositionHealth } from "@/hooks/usePositionHealth";
import { useVaultConfig } from "@/hooks/useVaultConfig";
import { validateOrder, validateTPSL, formatValidationErrors, validatePositionHealth } from "@/lib/validation/trading";
import { computeLivePnl } from "@/lib/formatters";
import { getTickSize } from "@/lib/tradingData";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { contracts, erc20Abi } from "@/lib/protocol/contracts";
import { useBalance, useReadContract } from "wagmi";

// Extracted components
import TradingAlerts from "./TradingAlerts";
import OracleStatusBar from "./OracleStatusBar";
import OrderTypeSelector from "./OrderTypeSelector";
import TokenSelector from "./TokenSelector";
import OrderFormInputs from "./OrderFormInputs";
import TPSLSection from "./TPSLSection";
import OrderOptionsPanel from "./OrderOptionsPanel";
import OrderSubmitButton from "./OrderSubmitButton";
import PositionManager from "./PositionManager";
import OpenOrdersPanel from "./OpenOrdersPanel";

// Token configuration for multi-token support
const TOKEN_CONFIG = {
  WETH: { address: contracts.weth.address, decimals: 18, symbol: "WETH", name: "Wrapped Ether" },
  USDC: { address: contracts.usdc.address, decimals: 6, symbol: "USDC", name: "USD Coin" },
  USDT: { address: contracts.usdt.address, decimals: 6, symbol: "USDT", name: "Tether" },
  BTC: { address: contracts.btc.address, decimals: 8, symbol: "BTC", name: "Bitcoin" },
};

type CollateralTokenKey = "WETH" | "USDC" | "USDT";
type IndexTokenKey = "WETH" | "BTC";

interface TradingPanelProps {
  symbol: string;
  tokenPriceData: TokenPriceData | null;
  indexToken?: `0x${string}`;
  collateralToken?: `0x${string}`;
  onTradeConfirmed?: () => void;
  onIndexTokenChange?: (indexToken: `0x${string}`) => void;
}

export default function TradingPanel({
  symbol,
  tokenPriceData,
  indexToken = contracts.weth.address,
  collateralToken = contracts.weth.address,
  onTradeConfirmed,
  onIndexTokenChange,
}: TradingPanelProps) {
  const { wallet, CustomConnectButton } = useWallet();

  // Token selection state
  const [selectedCollateralTokenKey, setSelectedCollateralTokenKey] = useState<CollateralTokenKey>("WETH");
  const [selectedIndexTokenKey, setSelectedIndexTokenKey] = useState<IndexTokenKey>("WETH");

  const [activeType, setActiveType] = useState("Limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [postOnly, setPostOnly] = useState(false);
  const [ioc, setIoc] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(false);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [slippageBps, setSlippageBps] = useState(30);

  // Standalone TP/SL state for existing positions
  const [tpslPositionKey, setTpslPositionKey] = useState<string | null>(null);
  const [tpslTpPrice, setTpslTpPrice] = useState("");
  const [tpslSlPrice, setTpslSlPrice] = useState("");

  // Get selected token configs
  const selectedCollateralConfig = TOKEN_CONFIG[selectedCollateralTokenKey];
  const selectedIndexConfig = TOKEN_CONFIG[selectedIndexTokenKey];

  // Use selected token addresses and decimals
  const activeCollateralToken = selectedCollateralConfig.address;
  const activeIndexToken = selectedIndexConfig.address;
  const collateralDecimals = selectedCollateralConfig.decimals;

  // Fetch balance for selected collateral token
  const isNativeCollateral = selectedCollateralTokenKey === "WETH";
  const { data: nativeBalance } = useBalance({
    address: wallet.address,
    query: { enabled: !!wallet.address && isNativeCollateral, refetchInterval: 5_000 },
  });
  const { data: erc20Balance } = useReadContract({
    address: selectedCollateralConfig.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: wallet.address ? [wallet.address] : undefined,
    query: { enabled: !!wallet.address && !isNativeCollateral, refetchInterval: 5_000 },
  });
  const collateralTokenBalance = isNativeCollateral ? nativeBalance : { value: erc20Balance as bigint | undefined, decimals: collateralDecimals };

  // Price oracle with validation
  const {
    price: oraclePrice,
    priceRaw: oraclePriceRaw,
    maxPrice: oracleMaxPrice,
    minPrice: oracleMinPrice,
    maxPriceRaw: oracleMaxPriceRaw,
    minPriceRaw: oracleMinPriceRaw,
    spread: oracleSpread,
    isValid: isOracleValid,
    isStale: isOracleStale,
    source: oracleSource,
    websocketConnected,
    calculatePriceImpact,
  } = usePriceOracle(activeIndexToken);

  const currentPrice = oraclePrice ?? tokenPriceData?.price ?? 0;
  const priceNum = parseFloat(price) || 0;
  const qtyNum = parseFloat(quantity) || 0;
  const isLong = side === "buy";

  // Read Vault configuration for max leverage and liquidation fee
  const { maxLeverage: vaultMaxLeverage, liquidationFeeUsd } = useVaultConfig();

  // Sync internal state with parent's indexToken prop
  useEffect(() => {
    // Map address to token key
    const addressToKey: Record<string, IndexTokenKey> = {
      [contracts.weth.address.toLowerCase()]: "WETH",
      [contracts.btc.address.toLowerCase()]: "BTC",
    };
    const key = addressToKey[indexToken.toLowerCase()];
    if (key && key !== selectedIndexTokenKey) {
      setSelectedIndexTokenKey(key);
    }
  }, [indexToken]);

  // Handle index token change from TokenSelector
  const handleIndexTokenChange = useCallback((tokenKey: IndexTokenKey) => {
    setSelectedIndexTokenKey(tokenKey);
    // Notify parent of the change
    if (onIndexTokenChange) {
      const address = TOKEN_CONFIG[tokenKey].address;
      onIndexTokenChange(address);
    }
  }, [onIndexTokenChange]);

  // Calculate collateral token balance in USD for display
  const collateralTokenBalanceNum = collateralTokenBalance?.value !== undefined
    ? parseFloat(formatUnits(collateralTokenBalance.value, collateralDecimals))
    : 0;
  const collateralTokenPrice = selectedCollateralTokenKey === "WETH" ? currentPrice : 1;
  const collateralTokenBalanceUsd = collateralTokenBalanceNum * collateralTokenPrice;

  const {
    txStatus,
    isPending,
    isSubmitted,
    isConfirmed,
    placeMarketOrder,
    placeLimitOrder,
    placeDecreaseOrder,
    placeTPSLOrders,
    cancelIncreaseOrder,
    cancelDecreaseOrder,
    closeMarketPosition,
    resetTxStatus,
    vaultRouterApproved,
    approveVaultRouter,
    routerApproved,
    approvePlugin,
    approveToken,
  } = useTradingActions();

  const { increaseOrders, decreaseOrders, refetch: refetchOrders } = useOpenOrders(activeIndexToken);

  useOrderKeeper({
    decreaseOrders,
    increaseOrders,
    minPrice: oracleMinPrice,
    maxPrice: oracleMaxPrice,
    enabled: wallet.connected && isOracleValid,
  });

  // Short positions require stable collateral (USDC)
  const effectiveCollateralToken = useMemo(() => {
    if (selectedCollateralTokenKey === "WETH") {
      return contracts.usdc.address;
    }
    return activeCollateralToken;
  }, [selectedCollateralTokenKey, activeCollateralToken]);

  const { position: longPosition } = useVaultPosition({ collateralToken: activeCollateralToken, indexToken: activeIndexToken, isLong: true });
  const { position: shortPosition } = useVaultPosition({ collateralToken: effectiveCollateralToken, indexToken: activeIndexToken, isLong: false });
  const { positions: allPositions, refetch: refetchPositions } = useAllVaultPositions(activeIndexToken);

  // Find orphaned decrease orders (TP/SL) that have no matching open position
  const orphanedOrders = useMemo(() => {
    return decreaseOrders.filter((order) => {
      const matchingPos = allPositions.find(p => 
        p.collateralToken.toLowerCase() === order.collateralToken.toLowerCase() &&
        p.indexToken.toLowerCase() === order.indexToken.toLowerCase() &&
        p.isLong === order.isLong
      );
      return !matchingPos || matchingPos.size === 0n;
    });
  }, [decreaseOrders, allPositions]);

  // Instant data refresh when a trade is confirmed on-chain
  useEffect(() => {
    if (isConfirmed) {
      refetchPositions();
      refetchOrders();
      onTradeConfirmed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  // Position health tracking
  const activePosition = isLong ? longPosition : shortPosition;
  const positionWithSide = activePosition ? { ...activePosition, isLong } : null;
  const { healthScore, status: healthStatus, liquidationPrice } = usePositionHealth({
    position: positionWithSide,
    currentPrice,
  });

  // Real-time validation
  const validationErrors = useMemo(() => {
    if (!wallet.connected) return [];
    return validateOrder({
      price: activeType === "Market" ? currentPrice : priceNum,
      quantity: qtyNum,
      leverage,
      side,
      orderType: activeType.toLowerCase() as "market" | "limit" | "conditional",
      availableBalance: reduceOnly ? Infinity : collateralTokenBalanceUsd,
      oraclePrice: currentPrice,
      slippageBps,
      maxLeverage: vaultMaxLeverage,
    });
  }, [wallet.connected, collateralTokenBalanceUsd, priceNum, qtyNum, leverage, side, activeType, currentPrice, slippageBps, reduceOnly, vaultMaxLeverage]);

  const reduceOnlyError = useMemo(() => {
    if (!reduceOnly) return null;
    const opposingPosition = isLong ? shortPosition : longPosition;
    if (!opposingPosition || opposingPosition.size === 0n) {
      return "Reduce Only: no opposing position to close";
    }
    return null;
  }, [reduceOnly, isLong, longPosition, shortPosition]);

  const { errors: validationErrorMessages, warnings: validationWarnings } = formatValidationErrors(validationErrors);

  // Empty-field messages are soft hints (orange), not blocking errors (red)
  const HINT_MESSAGES = new Set([
    "Price must be greater than 0",
    "Quantity must be greater than 0",
    `Minimum order size is ${0.001}`,
  ]);
  const hintMessages = validationErrorMessages.filter((m) => HINT_MESSAGES.has(m));
  const hardErrorMessages = validationErrorMessages.filter((m) => !HINT_MESSAGES.has(m));
  const hasErrors = hardErrorMessages.length > 0 || !!reduceOnlyError;

  // TP/SL validation
  const tpslErrors = useMemo(() => {
    if (!tpsl || !currentPrice) return [];
    return validateTPSL(
      tpPrice ? parseFloat(tpPrice) : null,
      slPrice ? parseFloat(slPrice) : null,
      currentPrice,
      isLong
    );
  }, [tpsl, tpPrice, slPrice, currentPrice, isLong]);

  const { errors: tpslErrorMessages } = formatValidationErrors(tpslErrors);

  const orderValue = useMemo(() => {
    const p = activeType === "Market" ? currentPrice : priceNum;
    return parseFloat((p * qtyNum).toFixed(2));
  }, [activeType, currentPrice, priceNum, qtyNum]);

  const marginRequired = useMemo(
    () => (leverage > 0 ? parseFloat((orderValue / leverage).toFixed(2)) : 0),
    [orderValue, leverage]
  );

  // Calculate price impact for large orders
  const priceImpact = useMemo(() => {
    if (orderValue <= 0) return { impact: 0, warning: null as string | null };
    return calculatePriceImpact(orderValue);
  }, [orderValue, calculatePriceImpact]);

  const estLiquidation = useMemo(() => {
    if (qtyNum <= 0 || leverage <= 0) return null;
    const p = activeType === "Market" ? currentPrice : priceNum;
    const liqDist = p / leverage;
    const ts = getTickSize(p);
    const decimals = ts > 0 ? Math.max(2, -Math.floor(Math.log10(ts))) : 2;
    return side === "buy"
      ? parseFloat((p - liqDist).toFixed(decimals))
      : parseFloat((p + liqDist).toFixed(decimals));
  }, [side, activeType, currentPrice, priceNum, qtyNum, leverage]);

  const insufficientBalance = wallet.connected && marginRequired > collateralTokenBalanceUsd;

  const notification = useMemo(() => {
    if (isConfirmed)
      return { type: "success" as const, message: `✓ Confirmed: ${txStatus.hash?.slice(0, 10)}…` };
    if (isSubmitted)
      return { type: "info" as const, message: `Tx submitted: ${txStatus.hash?.slice(0, 10)}…` };
    if (txStatus.state === "failed")
      return { type: "error" as const, message: txStatus.error ?? "Transaction failed" };
    return null;
  }, [txStatus, isSubmitted, isConfirmed]);

  const orderSigning = isPending;

  const handlePctQuantity = useCallback((pct: number) => {
    if (!wallet.connected || collateralTokenBalanceNum <= 0) return;
    const collateralTokenPrice = selectedCollateralTokenKey === "WETH" ? currentPrice : 1;
    if (collateralTokenPrice <= 0) return;
    const indexPrice = activeType === "Market" ? currentPrice : priceNum || currentPrice;
    if (indexPrice <= 0) return;
    const collateralBalanceUsd = collateralTokenBalanceNum * collateralTokenPrice;
    const positionSizeUsd = collateralBalanceUsd * (pct / 100) * leverage;
    const qty = positionSizeUsd / indexPrice;
    setQuantity(String(parseFloat(qty.toFixed(4))));
  }, [wallet.connected, collateralTokenBalanceNum, selectedCollateralTokenKey, currentPrice, activeType, priceNum, leverage]);

  const handlePlaceOrder = useCallback(async () => {
    if (qtyNum <= 0 || !wallet.address) return;
    if (!isOracleValid) {
      console.error("[handlePlaceOrder] oracle not valid — aborting");
      return;
    }

    // Auto-approve PositionManager plugin in Router if not already approved
    if (!routerApproved) {
      console.log("[handlePlaceOrder] Plugin not approved in Router, approving...");
      const approvalHash = await approvePlugin();
      if (!approvalHash) {
        console.error("[handlePlaceOrder] Failed to approve Plugin in Router");
        alert("Failed to approve Router Plugin. Please try again.");
        return;
      }
      console.log("[handlePlaceOrder] Plugin approved in Router");
    }

    // Auto-approve Router in Vault if not already approved
    if (!vaultRouterApproved) {
      console.log("[handlePlaceOrder] Router not approved in Vault, approving...");
      const approvalHash = await approveVaultRouter();
      if (!approvalHash) {
        console.error("[handlePlaceOrder] Failed to approve Router in Vault");
        alert("Failed to approve Router. Please try again.");
        return;
      }
      console.log("[handlePlaceOrder] Router approved in Vault");
    }

    // Validate we have min/max oracle prices for position health check
    if (!oracleMinPrice || !oracleMaxPrice) {
      console.error("[handlePlaceOrder] oracle min/max prices unavailable");
      return;
    }

    // qtyNum = position size in index-token units (e.g. ETH amount)
    const indexPrice = activeType === "Market" ? currentPrice : priceNum;
    const positionSizeUsd = qtyNum * indexPrice;
    const collateralUsd = positionSizeUsd / leverage;

    // For WETH collateral being swapped to index token, use index token price for collateral calculation
    // The Vault calculates collateral based on post-swap token value
    const collateralTokenPrice = selectedCollateralTokenKey === "WETH" ? indexPrice : 1;
    const collateralAmount = parseUnits((collateralUsd / collateralTokenPrice).toFixed(8), collateralDecimals);
    const sizeDelta = parseUnits(positionSizeUsd.toFixed(8), 30);

    console.log("[handlePlaceOrder] Collateral calculation:", {
      positionSizeUsd,
      leverage,
      collateralUsd,
      selectedCollateralTokenKey,
      collateralTokenPrice,
      collateralAmount: collateralAmount.toString(),
      sizeDelta: sizeDelta.toString(),
    });

    // Reduce-only logic
    const opposingPosition = isLong ? shortPosition : longPosition;
    const isReduceOnly = reduceOnly && !!opposingPosition && opposingPosition.size > 0n;

    // ERC-20 token approval (when not using native ETH market order)
    const needsTokenApproval = !(activeType === "Market" && isNativeCollateral);
    if (needsTokenApproval) {
      const spender = activeType === "Market" ? contracts.router.address : contracts.orderBook.address;
      console.log("[handlePlaceOrder] Approving collateral token for", activeType, "spender=", spender);
      const approvalHash = await approveToken(activeCollateralToken, spender, maxUint256);
      if (!approvalHash) {
        console.error("[handlePlaceOrder] Collateral token approval failed");
        alert("Failed to approve collateral token. Please try again.");
        return;
      }
      console.log("[handlePlaceOrder] Collateral token approved");
    }

    // Validate position health before submitting (only for new positions)
    if (!isReduceOnly) {
      console.log("[handlePlaceOrder] Validating position health:", {
        collateralUsd,
        sizeUsd: positionSizeUsd,
        entryPrice: currentPrice,
        isLong,
        maxPrice: oracleMaxPrice,
        minPrice: oracleMinPrice,
        maxLeverage: vaultMaxLeverage,
        liquidationFeeUsd,
      });

      const health = validatePositionHealth({
        collateralUsd,
        sizeUsd: positionSizeUsd,
        entryPrice: currentPrice,
        isLong,
        maxPrice: oracleMaxPrice,
        minPrice: oracleMinPrice,
        maxLeverage: vaultMaxLeverage,
        liquidationFeeUsd,
      });

      console.log("[handlePlaceOrder] Position health result:", health);

      if (!health.isHealthy) {
        console.error("[handlePlaceOrder] Position health check failed:", health.error);
        alert(health.error);
        return;
      }

      if (health.warning) {
        console.warn("[handlePlaceOrder] Position health warning:", health.warning);
      }
    }

    // Oracle price for acceptablePrice calculation
    const oraclePriceForOrder = parseUnits((isLong ? oracleMaxPrice : oracleMinPrice).toFixed(8), 30);

    if (activeType === "Market") {
      if (isReduceOnly) {
        // Market close of opposing position
        const closeSizeDelta = sizeDelta > opposingPosition.size ? opposingPosition.size : sizeDelta;
        const collateralDelta = 0n;
        const closeOraclePrice = !isLong ? oracleMinPrice : oracleMaxPrice;
        const closeOraclePriceRaw = closeOraclePrice
          ? parseUnits(closeOraclePrice.toFixed(8), 30)
          : oraclePriceForOrder;
        console.log("[handlePlaceOrder] Market Reduce", { isLong: !isLong, sizeDelta: closeSizeDelta.toString() });
        await closeMarketPosition({
          collateralToken: activeCollateralToken,
          indexToken: activeIndexToken,
          sizeDelta: closeSizeDelta,
          collateralDelta,
          isLong: !isLong,
          acceptablePrice: closeOraclePriceRaw,
          slippageBps: BigInt(slippageBps),
        });
      } else {
        // Market open/increase position
        console.log("[handlePlaceOrder] Market", { collateralUsd, leverage, sizeDelta: sizeDelta.toString(), oraclePriceForOrder: (isLong ? oracleMaxPrice : oracleMinPrice) });
        await placeMarketOrder({ collateralToken: activeCollateralToken, indexToken: activeIndexToken, collateralAmount, sizeDelta, isLong, acceptablePrice: oraclePriceForOrder, slippageBps: BigInt(slippageBps) });
      }
    } else {
      // Limit / Conditional
      if (priceNum <= 0) {
        console.error("[handlePlaceOrder] limit price required for", activeType);
        return;
      }
      const triggerPriceRaw = parseUnits(priceNum.toFixed(8), 30);

      if (isReduceOnly) {
        // Limit close of opposing position
        const closeSizeDelta = sizeDelta > opposingPosition.size ? opposingPosition.size : sizeDelta;
        const collateralDelta = 0n;
        const triggerAboveThreshold = !isLong ? true : false;
        console.log("[handlePlaceOrder] Limit Decrease", { isLong: !isLong, sizeDelta: closeSizeDelta.toString(), triggerPrice: triggerPriceRaw.toString(), triggerAboveThreshold });
        await placeDecreaseOrder({
          collateralToken: activeCollateralToken,
          indexToken: activeIndexToken,
          collateralDelta,
          sizeDelta: closeSizeDelta,
          isLong: !isLong,
          triggerPrice: triggerPriceRaw,
          triggerAboveThreshold,
        });
      } else {
        // Limit open/increase
        const triggerAboveThreshold = !isLong;
        console.log("[handlePlaceOrder]", activeType, { collateralUsd, leverage, sizeDelta: sizeDelta.toString(), triggerPrice: triggerPriceRaw.toString(), triggerAboveThreshold });
        await placeLimitOrder({ collateralToken: activeCollateralToken, indexToken: activeIndexToken, collateralAmount, sizeDelta, isLong, triggerPrice: triggerPriceRaw, triggerAboveThreshold });
      }
    }

    // TP/SL orders attached to the new position
    if (!isReduceOnly && tpsl && (tpPrice || slPrice)) {
      const tpPriceRaw = tpPrice ? parseUnits(parseFloat(tpPrice).toFixed(8), 30) : null;
      const slPriceRaw = slPrice ? parseUnits(parseFloat(slPrice).toFixed(8), 30) : null;
      await placeTPSLOrders({ collateralToken: activeCollateralToken, indexToken: activeIndexToken, collateralDelta: 0n, sizeDelta, isLong, tpPrice: tpPriceRaw, slPrice: slPriceRaw });
    }
  }, [activeType, currentPrice, priceNum, qtyNum, leverage, wallet.address, activeCollateralToken, activeIndexToken, isLong, placeMarketOrder, placeLimitOrder, placeDecreaseOrder, placeTPSLOrders, isOracleValid, oraclePriceRaw, slippageBps, tpsl, tpPrice, slPrice, oracleMinPrice, oracleMaxPrice, collateralDecimals, vaultRouterApproved, approveVaultRouter, routerApproved, approvePlugin, isNativeCollateral, approveToken, reduceOnly, longPosition, shortPosition]);

  const handleCancelOrphanedOrders = useCallback(async () => {
    for (const o of orphanedOrders) {
      await cancelDecreaseOrder(o.index);
    }
  }, [orphanedOrders, cancelDecreaseOrder]);

  const handleClosePosition = useCallback(async (pos: VaultPositionEntry, closePct: number) => {
    const closePercentage = closePct / 100;
    const sizeDelta = (pos.size * BigInt(Math.floor(closePercentage * 10000))) / 10000n;
    const collateralDelta = 0n;
    const closeOraclePrice = pos.isLong ? oracleMinPrice : oracleMaxPrice;
    const closeOraclePriceRaw = closeOraclePrice
      ? parseUnits(closeOraclePrice.toFixed(8), 30)
      : (pos.isLong ? (oracleMinPriceRaw ?? oraclePriceRaw ?? pos.averagePrice) : (oracleMaxPriceRaw ?? oraclePriceRaw ?? pos.averagePrice));

    // Cancel attached TP/SL BEFORE closing
    const attachedClose = decreaseOrders.filter((o) =>
      o.isLong === pos.isLong &&
      o.indexToken.toLowerCase() === activeIndexToken.toLowerCase()
    );
    if (attachedClose.length > 0) {
      console.log("[Close] cancelling", attachedClose.length, "attached decrease orders before closing");
      for (const o of attachedClose) {
        await cancelDecreaseOrder(o.index);
      }
    }

    await closeMarketPosition({
      collateralToken: pos.collateralToken,
      indexToken: activeIndexToken,
      sizeDelta,
      collateralDelta,
      isLong: pos.isLong,
      acceptablePrice: closeOraclePriceRaw,
      slippageBps: BigInt(slippageBps),
    });
  }, [activeIndexToken, decreaseOrders, cancelDecreaseOrder, closeMarketPosition, oracleMinPrice, oracleMaxPrice, oracleMinPriceRaw, oracleMaxPriceRaw, oraclePriceRaw, slippageBps]);

  const handleAddTPSL = useCallback(async (pos: VaultPositionEntry, tpPriceStr: string, slPriceStr: string) => {
    const tp = tpPriceStr ? parseFloat(tpPriceStr) : null;
    const sl = slPriceStr ? parseFloat(slPriceStr) : null;
    if (!tp && !sl) return;

    const tpErrors = validateTPSL(tp, sl, pos.avgPriceFormatted, pos.isLong);
    const { errors } = formatValidationErrors(tpErrors);
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    const tpPriceRaw = tp ? parseUnits(tp.toFixed(8), 30) : null;
    const slPriceRaw = sl ? parseUnits(sl.toFixed(8), 30) : null;

    // Cancel existing TP/SL before placing new ones
    const existing = decreaseOrders.filter((o) =>
      o.isLong === pos.isLong &&
      o.indexToken.toLowerCase() === activeIndexToken.toLowerCase()
    );
    if (existing.length > 0) {
      for (const o of existing) {
        await cancelDecreaseOrder(o.index);
      }
    }

    await placeTPSLOrders({
      collateralToken: pos.collateralToken,
      indexToken: activeIndexToken,
      collateralDelta: 0n,
      sizeDelta: pos.size,
      isLong: pos.isLong,
      tpPrice: tpPriceRaw,
      slPrice: slPriceRaw,
    });
  }, [activeIndexToken, decreaseOrders, cancelDecreaseOrder, placeTPSLOrders]);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)" }}>
      <TradingAlerts
        notification={notification}
        onDismissNotification={resetTxStatus}
        orphanedOrders={orphanedOrders}
        onCancelOrphanedOrders={handleCancelOrphanedOrders}
        orderSigning={orderSigning}
      />

      <OracleStatusBar
        oracleSource={oracleSource}
        websocketConnected={websocketConnected}
        isOracleStale={isOracleStale}
        isOracleValid={isOracleValid}
        currentPrice={currentPrice}
        oracleMinPrice={oracleMinPrice}
        oracleMaxPrice={oracleMaxPrice}
        oracleSpread={oracleSpread}
      />

      <OrderTypeSelector
        side={side}
        onSideChange={setSide}
        activeType={activeType}
        onTypeChange={setActiveType}
      />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
        <TokenSelector
          selectedCollateralTokenKey={selectedCollateralTokenKey}
          onCollateralTokenChange={setSelectedCollateralTokenKey}
          selectedIndexTokenKey={selectedIndexTokenKey}
          onIndexTokenChange={handleIndexTokenChange}
        />

        <OrderFormInputs
          isMarket={activeType === "Market"}
          price={price}
          onPriceChange={setPrice}
          quantity={quantity}
          onQuantityChange={setQuantity}
          leverage={leverage}
          onLeverageChange={setLeverage}
          currentPrice={currentPrice}
          symbol={symbol}
          walletConnected={wallet.connected}
          onPctQuantity={handlePctQuantity}
          orderValue={orderValue}
          marginRequired={marginRequired}
          insufficientBalance={insufficientBalance}
          estLiquidation={estLiquidation}
          side={side}
          priceImpact={priceImpact}
        />

        <TPSLSection
          enabled={tpsl}
          onToggle={setTpsl}
          tpPrice={tpPrice}
          onTpPriceChange={setTpPrice}
          slPrice={slPrice}
          onSlPriceChange={setSlPrice}
        />

        <OrderOptionsPanel
          walletConnected={wallet.connected}
          postOnly={postOnly}
          onPostOnlyChange={setPostOnly}
          ioc={ioc}
          onIocChange={setIoc}
          reduceOnly={reduceOnly}
          onReduceOnlyChange={setReduceOnly}
          slippageBps={slippageBps}
          onSlippageChange={setSlippageBps}
          orderSigning={orderSigning}
          hardErrorMessages={hardErrorMessages}
          hintMessages={hintMessages}
          tpslErrorMessages={tpslErrorMessages}
          validationWarnings={validationWarnings}
        />

        <OrderSubmitButton
          walletConnected={wallet.connected}
          customConnectButton={<CustomConnectButton variant="large" />}
          orderSigning={orderSigning}
          hasErrors={hasErrors}
          isOracleValid={isOracleValid}
          qtyNum={qtyNum}
          side={side}
          symbol={symbol}
          isMarket={activeType === "Market"}
          priceNum={priceNum}
          reduceOnlyError={reduceOnlyError}
          validationErrorMessages={validationErrorMessages}
          isSubmitted={isSubmitted}
          isConfirmed={isConfirmed}
          txHash={txStatus.hash}
          onSubmit={handlePlaceOrder}
          onResetTxStatus={resetTxStatus}
        />

        <PositionManager
          walletConnected={wallet.connected}
          positions={allPositions}
          decreaseOrders={decreaseOrders}
          activeIndexToken={activeIndexToken}
          currentPrice={currentPrice}
          symbol={symbol}
          orderSigning={orderSigning}
          healthScore={healthScore}
          healthStatus={healthStatus}
          liquidationPrice={liquidationPrice}
          isLong={isLong}
          slippageBps={slippageBps}
          onClosePosition={handleClosePosition}
          onCancelDecreaseOrder={cancelDecreaseOrder}
          onAddTPSL={handleAddTPSL}
        />

        <OpenOrdersPanel
          walletConnected={wallet.connected}
          increaseOrders={increaseOrders}
          decreaseOrders={decreaseOrders}
          orderSigning={orderSigning}
          onCancelIncreaseOrder={cancelIncreaseOrder}
          onCancelDecreaseOrder={cancelDecreaseOrder}
        />
      </div>
    </div>
  );
}
