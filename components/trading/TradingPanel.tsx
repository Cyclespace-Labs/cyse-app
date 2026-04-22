"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronDown, Loader2, X, AlertTriangle, Shield } from "lucide-react";
import { useReadContract } from "wagmi";
import { TokenPriceData } from "@/types/trading";
import { getTickSize } from "@/lib/tradingData";
import { useWallet } from "@/contexts/WalletContext";
import { useTradingActions } from "@/hooks/useTradingActions";
import { useOpenOrders } from "@/hooks/useOpenOrders";
import { useVaultPosition } from "@/hooks/useVaultPosition";
import { usePriceOracle } from "@/hooks/usePriceOracle";
import { usePositionHealth } from "@/hooks/usePositionHealth";
import { validateOrder, validateTPSL, formatValidationErrors } from "@/lib/validation/trading";
import { parseUnits, formatUnits } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import SlippageSelector from "./SlippageSelector";
import LiquidationGauge from "./LiquidationGauge";

const orderTypes = ["Limit", "Market", "Conditional"];
const pctButtons = [25, 50, 75, 100];

interface TradingPanelProps {
  symbol: string;
  tokenPriceData: TokenPriceData | null;
  indexToken?: `0x${string}`;
  collateralToken?: `0x${string}`;
}

export default function TradingPanel({
  symbol,
  tokenPriceData,
  indexToken = contracts.weth.address,
  collateralToken = contracts.weth.address,
}: TradingPanelProps) {
  const { wallet, CustomConnectButton } = useWallet();

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
  const [slippageBps, setSlippageBps] = useState(30); // 0.3% default

  // Price oracle with validation
  const {
    price: oraclePrice,
    priceRaw: oraclePriceRaw,
    maxPrice: oracleMaxPrice,
    minPrice: oracleMinPrice,
    spread: oracleSpread,
    isValid: isOracleValid,
    isStale: isOracleStale,
    source: oracleSource,
    websocketConnected,
    validatePrice,
    calculatePriceImpact,
  } = usePriceOracle(indexToken);

  // Fetch on-chain price from VaultPriceFeed for closing positions (same source contract uses)
  const { data: vaultPriceRaw } = useReadContract({
    ...contracts.vaultPriceFeed,
    functionName: "getPrice",
    args: [indexToken, true, true, false],
    query: { refetchInterval: 5_000 },
  });

  const currentPrice = oraclePrice ?? tokenPriceData?.price ?? 0;
  const priceNum = parseFloat(price) || 0;
  const qtyNum = parseFloat(quantity) || 0;
  const isLong = side === "buy";

  const {
    txStatus,
    isPending,
    isSubmitted,
    isConfirmed,
    placeMarketOrder,
    placeLimitOrder,
    placeTPSLOrders,
    cancelIncreaseOrder,
    cancelDecreaseOrder,
    closeMarketPosition,
    resetTxStatus,
  } = useTradingActions();

  const { increaseOrders, decreaseOrders } = useOpenOrders(indexToken);

  const { position: longPosition } = useVaultPosition({ collateralToken, indexToken, isLong: true });
  const { position: shortPosition } = useVaultPosition({ collateralToken, indexToken, isLong: false });

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
      price: priceNum,
      quantity: qtyNum,
      leverage,
      side,
      orderType: activeType.toLowerCase() as "market" | "limit" | "conditional",
      availableBalance: wallet.balance,
      oraclePrice: currentPrice,
      slippageBps,
    });
  }, [wallet.connected, wallet.balance, priceNum, qtyNum, leverage, side, activeType, currentPrice, slippageBps]);

  const { errors: validationErrorMessages, warnings: validationWarnings } = formatValidationErrors(validationErrors);
  const hasErrors = validationErrorMessages.length > 0;

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
    if (orderValue <= 0) return { impact: 0, warning: null };
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

  const insufficientBalance = wallet.connected && marginRequired > wallet.balance;

  const notification = useMemo(() => {
    if (isConfirmed)
      return { type: "success" as const, message: `✓ Confirmed: ${txStatus.hash?.slice(0, 10)}…` };
    if (isSubmitted)
      return { type: "info" as const, message: `Tx submitted: ${txStatus.hash?.slice(0, 10)}…` };
    if (txStatus.state === "failed")
      return { type: "error" as const, message: txStatus.error ?? "Transaction failed" };
    return null;
  }, [txStatus, isSubmitted, isConfirmed]);

  // Only block UI during wallet-signing phase; submitted/confirmed don't lock the panel
  const orderSigning = isPending;

  const handlePctQuantity = (pct: number) => {
    if (!wallet.connected || wallet.balance <= 0) return;
    const p = activeType === "Market" ? currentPrice : priceNum || currentPrice;
    if (p <= 0) return;
    setQuantity(String(parseFloat(((wallet.balance * leverage * pct) / 100 / p).toFixed(4))));
  };

  const handlePlaceOrder = useCallback(async () => {
    if (qtyNum <= 0 || !wallet.address) return;
    if (!isOracleValid) {
      console.error("[handlePlaceOrder] oracle not valid — aborting");
      return;
    }

    const collateralAmount = parseUnits(qtyNum.toFixed(8), 18); // ETH collateral (18 dec)

    // Oracle price for market orders — must come from VaultPriceFeed
    const oraclePriceForOrder = oraclePriceRaw ?? parseUnits(currentPrice.toFixed(8), 30);

    const BASIS_POINTS      = 10000n;
    const slippageBpsBigInt = BigInt(slippageBps);

    // acceptablePrice: worst price the user will accept (market slippage bounds)
    const acceptablePrice = isLong
      ? (oraclePriceForOrder * (BASIS_POINTS + slippageBpsBigInt)) / BASIS_POINTS
      : (oraclePriceForOrder * (BASIS_POINTS - slippageBpsBigInt)) / BASIS_POINTS;

    if (activeType === "Market") {
      // sizeDelta = collateral USD * leverage = (qty * oracle_price * leverage)
      const sizeDelta = parseUnits((currentPrice * qtyNum * leverage).toFixed(8), 30);
      console.log("[handlePlaceOrder] Market", { currentPrice, qtyNum, leverage, sizeDelta: sizeDelta.toString(), acceptablePrice: acceptablePrice.toString() });
      await placeMarketOrder({ collateralToken, indexToken, collateralAmount, sizeDelta, isLong, acceptablePrice });
    } else {
      // Limit / Conditional: triggerPrice = user's entered limit price (NOT oracle price)
      if (priceNum <= 0) {
        console.error("[handlePlaceOrder] limit price required for", activeType);
        return;
      }
      const triggerPriceRaw = parseUnits(priceNum.toFixed(8), 30);
      const sizeDelta        = parseUnits((priceNum * qtyNum * leverage).toFixed(8), 30);
      // triggerAboveThreshold:
      //   Long  limit: execute when oracle price ≤ triggerPrice (price dropped to your buy level) → false
      //   Short limit: execute when oracle price ≥ triggerPrice (price rose to your sell level) → true
      const triggerAboveThreshold = !isLong;
      console.log("[handlePlaceOrder]", activeType, { priceNum, qtyNum, leverage, sizeDelta: sizeDelta.toString(), triggerPrice: triggerPriceRaw.toString(), triggerAboveThreshold });
      await placeLimitOrder({ collateralToken, indexToken, collateralAmount, sizeDelta, isLong, triggerPrice: triggerPriceRaw, triggerAboveThreshold });
    }

    // TP/SL orders attached to the position
    if (tpsl && (tpPrice || slPrice)) {
      const sizeDeltaForTPSL = parseUnits(
        ((activeType === "Market" ? currentPrice : priceNum) * qtyNum * leverage).toFixed(8), 30
      );
      const tpPriceRaw = tpPrice ? parseUnits(parseFloat(tpPrice).toFixed(8), 30) : null;
      const slPriceRaw = slPrice ? parseUnits(parseFloat(slPrice).toFixed(8), 30) : null;
      await placeTPSLOrders({ collateralToken, indexToken, collateralDelta: collateralAmount, sizeDelta: sizeDeltaForTPSL, isLong, tpPrice: tpPriceRaw, slPrice: slPriceRaw });
    }
  }, [activeType, currentPrice, priceNum, qtyNum, leverage, wallet.address, collateralToken, indexToken, isLong, placeMarketOrder, placeLimitOrder, placeTPSLOrders, isOracleValid, oraclePriceRaw, slippageBps, tpsl, tpPrice, slPrice]);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)" }}>
      {/* Notification */}
      {notification && (
        <div
          className="px-3 py-2 text-[11px] font-mono flex items-center justify-between"
          style={{
            background: notification.type === "success"
              ? "rgba(0,192,118,0.1)"
              : notification.type === "info"
              ? "rgba(99,179,255,0.1)"
              : "rgba(255,77,79,0.1)",
            color: notification.type === "success"
              ? "var(--buy)"
              : notification.type === "info"
              ? "#63b3ff"
              : "var(--sell)",
          }}
        >
          <span className="truncate">{notification.message}</span>
          <button onClick={resetTxStatus} className="ml-2 opacity-60 hover:opacity-100 shrink-0"><X size={10} /></button>
        </div>
      )}

      {/* Oracle Status — Pyth SSE / Vault indicator */}
      <div
        className="px-3 py-1 flex items-center justify-between text-[10px]"
        style={{ borderBottom: "1px solid rgba(66,70,84,0.3)" }}
      >
        <div className="flex items-center gap-1.5" style={{ color: "var(--on-surface-disabled)" }}>
          <Shield size={9} style={{ color: isOracleValid ? "var(--buy)" : "var(--sell)" }} />
          <span>
            {oracleSource === "pyth" ? "PYTH" : oracleSource.toUpperCase()}
            {websocketConnected ? " · 1s" : isOracleStale ? " · Stale" : ""}
          </span>
          {oracleSpread > 0 && (
            <span className="font-mono text-[9px]" style={{ color: "var(--on-surface-disabled)", opacity: 0.7 }}>
              spread ${oracleSpread.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {oracleMinPrice !== null && oracleMaxPrice !== null && (
            <span className="font-mono text-[9px]" style={{ color: "var(--on-surface-disabled)", opacity: 0.6 }}>
              {oracleMinPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}–{oracleMaxPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          )}
          <span
            className="font-mono text-[10px]"
            style={{ color: isOracleValid ? "var(--on-surface-muted)" : "var(--sell)" }}
          >
            {currentPrice > 0 ? `$${currentPrice.toLocaleString("en-US", { maximumFractionDigits: 4 })}` : "—"}
          </span>
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <div className="flex" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        <button
          onClick={() => setSide("buy")}
          className="flex-1 py-2.5 text-[13px] font-semibold transition-colors"
          style={{
            color: side === "buy" ? "var(--buy)" : "var(--on-surface-disabled)",
            borderBottom: side === "buy" ? "2px solid var(--buy)" : "2px solid transparent",
          }}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className="flex-1 py-2.5 text-[13px] font-semibold transition-colors"
          style={{
            color: side === "sell" ? "var(--sell)" : "var(--on-surface-disabled)",
            borderBottom: side === "sell" ? "2px solid var(--sell)" : "2px solid transparent",
          }}
        >
          Sell / Short
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {orderTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className="px-2.5 py-1 text-[11px] rounded transition-colors"
            style={{
              color: activeType === type ? "var(--on-surface)" : "var(--on-surface-disabled)",
              background: activeType === type ? "var(--surface-container-high)" : "transparent",
            }}
          >
            {type}
          </button>
        ))}
        <ChevronDown size={12} className="ml-auto" style={{ color: "var(--on-surface-disabled)" }} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
        {/* Available Equity */}
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: "var(--on-surface-disabled)" }}>Available Equity</span>
          <span style={{ color: "var(--on-surface)" }}>
            {wallet.connected ? `${wallet.balance.toLocaleString("en-US", { minimumFractionDigits: 4 })} ${wallet.nativeCurrencySymbol}` : "—"}
          </span>
        </div>

        {/* Limit Price Input */}
        {activeType !== "Market" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="price-input" className="text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>Limit Price</label>
              <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>USD</span>
            </div>
            <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
              <input
                id="price-input"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
                className="flex-1 bg-transparent text-sm outline-none font-mono"
                style={{ color: "var(--on-surface)" }}
              />
              <button
                onClick={() => setPrice(currentPrice > 0 ? currentPrice.toFixed(2) : "")}
                className="text-[10px] px-1.5 py-0.5 rounded transition-colors ml-2 shrink-0"
                style={{ color: "var(--on-surface-muted)", background: "var(--surface-container-high)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)")}
              >
                Mark
              </button>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label htmlFor="qty-input" className="text-[11px] mb-1 block" style={{ color: "var(--on-surface-disabled)" }}>Quantity</label>
          <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
            <input
              id="qty-input"
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-sm outline-none font-mono"
              style={{ color: "var(--on-surface)" }}
            />
            <span className="text-[11px] ml-2" style={{ color: "var(--on-surface-disabled)" }}>{symbol}</span>
          </div>
          {wallet.connected && (
            <div className="flex items-center gap-1 mt-1.5">
              {pctButtons.map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePctQuantity(pct)}
                  className="flex-1 py-1 text-[10px] font-mono rounded transition-colors"
                  style={{ background: "var(--surface-container-high)", color: "var(--on-surface-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-bright)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"; (e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)"; }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Leverage Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="leverage-slider" className="text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>Leverage</label>
            <span className="text-[11px] font-mono" style={{ color: "var(--on-surface)" }}>{leverage}x</span>
          </div>
          <input
            id="leverage-slider"
            type="range"
            min={1}
            max={50}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            {[1, 5, 10, 20, 50].map((l) => (
              <button
                key={l}
                onClick={() => setLeverage(l)}
                className="text-[10px] font-mono transition-colors"
                style={{ color: leverage === l ? "var(--on-surface)" : "var(--on-surface-disabled)" }}
              >
                {l}x
              </button>
            ))}
          </div>
        </div>

        {/* Order Value */}
        <div>
          <span className="text-[11px] mb-1 block" style={{ color: "var(--on-surface-disabled)" }}>Order Value</span>
          <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container-low)" }}>
            <span className="text-sm font-mono" style={{ color: "var(--on-surface)" }}>
              {orderValue > 0 ? `$${orderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
            </span>
          </div>
        </div>

        {/* Price Impact */}
        {orderValue > 0 && priceImpact.impact > 0.1 && (
          <div>
            <span className="text-[11px] mb-1 block" style={{ color: "var(--on-surface-disabled)" }}>Price Impact</span>
            <div className="flex items-center rounded px-3 py-2" style={{ background: priceImpact.impact > 1 ? "rgba(255,77,79,0.1)" : "rgba(255,165,0,0.05)" }}>
              <span className="text-sm font-mono" style={{ color: priceImpact.impact > 1 ? "var(--sell)" : "#FFA500" }}>
                {priceImpact.impact.toFixed(2)}%
              </span>
              {priceImpact.warning && (
                <span className="ml-2 text-[10px]" style={{ color: priceImpact.impact > 1 ? "var(--sell)" : "#FFA500" }}>
                  {priceImpact.warning}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Margin Required & Est. Liquidation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Margin Required</span>
            <span style={{ color: insufficientBalance ? "var(--sell)" : "var(--on-surface)" }}>
              {marginRequired > 0 ? `$${marginRequired.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--on-surface-disabled)" }}>Est. Liquidation Price</span>
            <span style={{ color: "var(--on-surface)" }}>{estLiquidation !== null ? estLiquidation : "—"}</span>
          </div>
        </div>

        {/* TP/SL */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={tpsl}
            onChange={(e) => setTpsl(e.target.checked)}
            className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
          />
          <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>TP/SL</span>
        </label>

        {tpsl && (
          <div className="space-y-2">
            <div>
              <label htmlFor="tp-input" className="text-[10px] mb-1 block" style={{ color: "var(--buy)" }}>Take Profit</label>
              <div className="flex items-center rounded px-3 py-1.5" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
                <input
                  id="tp-input"
                  type="text"
                  value={tpPrice}
                  onChange={(e) => setTpPrice(e.target.value)}
                  placeholder="TP Price"
                  className="flex-1 bg-transparent text-sm outline-none font-mono"
                  style={{ color: "var(--on-surface)" }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="sl-input" className="text-[10px] mb-1 block" style={{ color: "var(--sell)" }}>Stop Loss</label>
              <div className="flex items-center rounded px-3 py-1.5" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
                <input
                  id="sl-input"
                  type="text"
                  value={slPrice}
                  onChange={(e) => setSlPrice(e.target.value)}
                  placeholder="SL Price"
                  className="flex-1 bg-transparent text-sm outline-none font-mono"
                  style={{ color: "var(--on-surface)" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {(validationErrorMessages.length > 0 || validationWarnings.length > 0 || tpslErrorMessages.length > 0) && (
          <div className="space-y-1">
            {validationErrorMessages.map((err, i) => (
              <div key={`err-${i}`} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--sell)" }}>
                <AlertTriangle size={10} />
                <span>{err}</span>
              </div>
            ))}
            {tpslErrorMessages.map((err, i) => (
              <div key={`tpsl-err-${i}`} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--sell)" }}>
                <AlertTriangle size={10} />
                <span>{err}</span>
              </div>
            ))}
            {validationWarnings.map((warn, i) => (
              <div key={`warn-${i}`} className="flex items-center gap-1.5 text-[10px]" style={{ color: "#FFA500" }}>
                <AlertTriangle size={10} />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {!wallet.connected ? (
          <div className="space-y-2 pt-1">
            <CustomConnectButton variant="large" />
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={handlePlaceOrder}
              disabled={orderSigning || hasErrors || !isOracleValid || qtyNum <= 0}
              className="w-full py-2.5 text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
              style={{
                background: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0
                  ? "var(--surface-container-high)"
                  : side === "buy"
                  ? "linear-gradient(135deg, var(--buy) 0%, var(--buy-bright) 100%)"
                  : "linear-gradient(135deg, var(--sell) 0%, var(--sell-bright) 100%)",
                color: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0
                  ? "var(--on-surface-disabled)"
                  : side === "buy" ? "#000" : "var(--on-primary)",
                cursor: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0 ? "not-allowed" : "pointer",
                boxShadow: orderSigning || hasErrors || !isOracleValid || qtyNum <= 0
                  ? "none"
                  : side === "buy"
                  ? "0 0 16px 2px rgba(0,192,118,0.25)"
                  : "0 0 16px 2px rgba(255,77,79,0.25)",
              }}
            >
              {orderSigning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Signing…
                </>
              ) : !isOracleValid ? (
                "Oracle Unavailable"
              ) : hasErrors ? (
                "Fix Errors to Trade"
              ) : (
                `${side === "buy" ? "Buy / Long" : "Sell / Short"} ${symbol}`
              )}
            </button>

            {/* Non-blocking on-chain status — visible while tx is submitted/confirmed */}
            {(isSubmitted || isConfirmed) && txStatus.hash && (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] font-mono"
                style={{
                  background: isConfirmed ? "rgba(0,192,118,0.08)" : "rgba(99,179,255,0.06)",
                  border: `1px solid ${isConfirmed ? "rgba(0,192,118,0.2)" : "rgba(99,179,255,0.15)"}`,
                }}
              >
                {isConfirmed ? (
                  <span style={{ color: "var(--buy)" }}>✓</span>
                ) : (
                  <Loader2 size={10} className="animate-spin shrink-0" style={{ color: "#63b3ff" }} />
                )}
                <span style={{ color: isConfirmed ? "var(--buy)" : "#63b3ff" }}>
                  {isConfirmed ? "Confirmed" : "Confirming…"}
                </span>
                <span className="truncate" style={{ color: "var(--on-surface-disabled)" }}>
                  {txStatus.hash.slice(0, 8)}…{txStatus.hash.slice(-6)}
                </span>
                <button onClick={resetTxStatus} className="ml-auto opacity-50 hover:opacity-100 shrink-0">
                  <X size={9} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Order Options */}
        {wallet.connected && (
          <div className="pt-1 space-y-2" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
            <SlippageSelector value={slippageBps} onChange={setSlippageBps} disabled={orderSigning} />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={postOnly} onChange={(e) => setPostOnly(e.target.checked)} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Post Only</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={ioc} onChange={(e) => setIoc(e.target.checked)} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>IOC</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={reduceOnly} onChange={(e) => setReduceOnly(e.target.checked)} />
                <span className="text-[11px]" style={{ color: "var(--on-surface-variant)" }}>Reduce Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Active Positions (on-chain) */}
        {wallet.connected && (longPosition || shortPosition) && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
            <span className="text-[11px] mb-2 block" style={{ color: "var(--on-surface-disabled)" }}>Active Positions</span>
            {([longPosition ? { ...longPosition, isLong: true } : null, shortPosition ? { ...shortPosition, isLong: false } : null] as const)
              .filter(Boolean)
              .map((pos) => {
                if (!pos) return null;
                // Calculate live PnL using current oracle price
                const priceDiff = pos.isLong ? currentPrice - pos.avgPriceFormatted : pos.avgPriceFormatted - currentPrice;
                const livePnl = priceDiff * pos.sizeUsd;
                const livePnlPct = pos.collateralUsd > 0 ? (livePnl / pos.collateralUsd) * 100 : 0;
                const pnlColor = livePnl >= 0 ? "var(--buy)" : "var(--sell)";
                return (
                  <div key={pos.isLong ? "long" : "short"} className="rounded p-2.5 mb-2" style={{ background: "var(--surface-container-low)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono font-medium" style={{ color: pos.isLong ? "var(--buy)" : "var(--sell)" }}>
                        {pos.isLong ? "LONG" : "SHORT"} {symbol}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>
                        ${pos.sizeUsd.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span style={{ color: "var(--on-surface-disabled)" }}>Entry</span>
                      <span className="font-mono" style={{ color: "var(--on-surface)" }}>{pos.avgPriceFormatted.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span style={{ color: "var(--on-surface-disabled)" }}>Liq. Price</span>
                      <span className="font-mono" style={{ color: "var(--liquidation)" }}>{pos.liquidationPrice.toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-2">
                      <span style={{ color: "var(--on-surface-disabled)" }}>Unrealized PnL</span>
                      <span className="font-mono" style={{ color: pnlColor }}>
                        {livePnl >= 0 ? "+" : ""}${livePnl.toFixed(2)} ({livePnlPct.toFixed(2)}%)
                      </span>
                    </div>

                    {/* Position Health Gauge */}
                    {pos.isLong === isLong && (
                      <div className="mb-2">
                        <LiquidationGauge
                          healthScore={healthScore}
                          status={healthStatus}
                          liquidationPrice={liquidationPrice}
                          currentPrice={currentPrice}
                          isLong={pos.isLong}
                        />
                      </div>
                    )}

                    <button
                      onClick={() =>
                        closeMarketPosition({
                          collateralToken,
                          indexToken,
                          sizeDelta: pos.size,
                          collateralDelta: pos.collateral,
                          isLong: pos.isLong,
                          // Use VaultPriceFeed on-chain price for closing (same source contract uses)
                          acceptablePrice: vaultPriceRaw || oraclePriceRaw || parseUnits(currentPrice.toFixed(8), 30),
                        })
                      }
                      disabled={orderSigning}
                      className="w-full py-1.5 text-[11px] font-mono rounded transition-colors"
                      style={{ border: "1px solid rgba(255,77,79,0.3)", color: "var(--sell)", background: "transparent" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,77,79,0.08)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      Close Position
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {/* Open Orders (on-chain) */}
        {wallet.connected && (increaseOrders.length > 0 || decreaseOrders.length > 0) && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
            <span className="text-[11px] mb-2 block" style={{ color: "var(--on-surface-disabled)" }}>Open Orders</span>
            {increaseOrders.map((order) => (
              <div key={`inc-${order.index}`} className="flex items-center justify-between rounded p-2 mb-1.5" style={{ background: "var(--surface-container-low)" }}>
                <div>
                  <span className="text-[10px] font-mono font-medium" style={{ color: order.isLong ? "var(--buy)" : "var(--sell)" }}>
                    {order.isLong ? "BUY" : "SELL"} @ {parseFloat(formatUnits(order.triggerPrice, 30)).toFixed(4)}
                  </span>
                  <span className="text-[9px] ml-2" style={{ color: "var(--on-surface-disabled)" }}>Limit</span>
                </div>
                <button
                  onClick={() => cancelIncreaseOrder(order.index)}
                  disabled={orderSigning}
                  className="p-1 rounded transition-colors"
                  style={{ color: "var(--on-surface-disabled)" }}
                  title="Cancel order"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sell)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {decreaseOrders.map((order) => (
              <div key={`dec-${order.index}`} className="flex items-center justify-between rounded p-2 mb-1.5" style={{ background: "var(--surface-container-low)" }}>
                <div>
                  <span className="text-[10px] font-mono font-medium" style={{ color: "var(--sell)" }}>
                    CLOSE @ {parseFloat(formatUnits(order.triggerPrice, 30)).toFixed(4)}
                  </span>
                  <span className="text-[9px] ml-2" style={{ color: "var(--on-surface-disabled)" }}>TP/SL</span>
                </div>
                <button
                  onClick={() => cancelDecreaseOrder(order.index)}
                  disabled={orderSigning}
                  className="p-1 rounded transition-colors"
                  style={{ color: "var(--on-surface-disabled)" }}
                  title="Cancel order"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sell)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
