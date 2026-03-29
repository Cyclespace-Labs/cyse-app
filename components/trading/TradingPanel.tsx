"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Loader2, X, Wallet } from "lucide-react";
import { Order, Position, TokenPriceData } from "@/types/trading";
import { getBestBidAsk, getTickSize } from "@/lib/tradingData";
import { useWallet } from "@/contexts/WalletContext";

const orderTypes = ["Limit", "Market", "Conditional"];
const pctButtons = [25, 50, 75, 100];

interface TradingPanelProps {
  symbol: string;
  tokenPriceData: TokenPriceData | null;
  activePositions: Position[];
  openOrders: Order[];
  orderPending: boolean;
  lastNotification: { type: "success" | "error"; message: string } | null;
  onPlaceOrder: (params: {
    side: "buy" | "sell";
    type: "limit" | "market" | "conditional";
    price: number;
    quantity: number;
    leverage: number;
    tp?: number;
    sl?: number;
  }) => void;
  onCancelOrder: (orderId: string) => void;
  onClosePosition: (positionId: string) => void;
}

export default function TradingPanel({
  symbol,
  tokenPriceData,
  activePositions,
  openOrders,
  orderPending,
  lastNotification,
  onPlaceOrder,
  onCancelOrder,
  onClosePosition,
}: TradingPanelProps) {
  const { wallet, connect } = useWallet();
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

  const currentPrice = tokenPriceData?.price ?? 0;
  const tickSize = getTickSize(currentPrice);
  const priceNum = parseFloat(price) || 0;
  const qtyNum = parseFloat(quantity) || 0;

  const orderValue = useMemo(() => {
    const p = activeType === "Market" ? currentPrice : priceNum;
    return parseFloat((p * qtyNum).toFixed(2));
  }, [activeType, currentPrice, priceNum, qtyNum]);

  const marginRequired = useMemo(() => {
    return leverage > 0 ? parseFloat((orderValue / leverage).toFixed(2)) : 0;
  }, [orderValue, leverage]);

  const estLiquidation = useMemo(() => {
    if (qtyNum <= 0 || leverage <= 0) return null;
    const p = activeType === "Market" ? currentPrice : priceNum;
    const liqDist = p / leverage;
    return side === "buy"
      ? parseFloat((p - liqDist).toFixed(Math.max(2, -Math.floor(Math.log10(tickSize)))))
      : parseFloat((p + liqDist).toFixed(Math.max(2, -Math.floor(Math.log10(tickSize)))));
  }, [side, activeType, currentPrice, priceNum, qtyNum, leverage, tickSize]);

  const insufficientBalance = wallet.connected && marginRequired > wallet.balance;

  const handleMid = () => {
    const { mid } = getBestBidAsk(symbol);
    setPrice(String(mid));
  };

  const handleBBO = () => {
    const { bid, ask } = getBestBidAsk(symbol);
    setPrice(String(side === "buy" ? bid : ask));
  };

  const handleTickUp = () => {
    const current = parseFloat(price) || currentPrice;
    setPrice(String(parseFloat((current + tickSize).toFixed(Math.max(2, -Math.floor(Math.log10(tickSize)))))));
  };

  const handleTickDown = () => {
    const current = parseFloat(price) || currentPrice;
    const next = current - tickSize;
    if (next > 0) setPrice(String(parseFloat(next.toFixed(Math.max(2, -Math.floor(Math.log10(tickSize)))))));
  };

  const handlePctQuantity = (pct: number) => {
    if (!wallet.connected || wallet.balance <= 0) return;
    const p = activeType === "Market" ? currentPrice : (priceNum || currentPrice);
    if (p <= 0) return;
    const maxQty = (wallet.balance * leverage * (pct / 100)) / p;
    setQuantity(String(parseFloat(maxQty.toFixed(4))));
  };

  const handlePlaceOrder = () => {
    const p = activeType === "Market" ? currentPrice : priceNum;
    if (p <= 0 || qtyNum <= 0) return;
    onPlaceOrder({
      side,
      type: activeType.toLowerCase() as "limit" | "market" | "conditional",
      price: p,
      quantity: qtyNum,
      leverage,
      tp: tpsl && tpPrice ? parseFloat(tpPrice) : undefined,
      sl: tpsl && slPrice ? parseFloat(slPrice) : undefined,
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--surface-container-lowest)", color: "var(--on-surface)" }}>
      {/* Notification */}
      {lastNotification && (
        <div
          className="px-3 py-2 text-[11px] font-mono"
          style={{
            background: lastNotification.type === "success" ? "rgba(0,192,118,0.1)" : "rgba(255,77,79,0.1)",
            color: lastNotification.type === "success" ? "var(--buy)" : "var(--sell)",
          }}
        >
          {lastNotification.message}
        </div>
      )}

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
            {wallet.connected ? `$${wallet.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
          </span>
        </div>

        {/* Price Input */}
        {activeType !== "Market" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="price-input" className="text-[11px]" style={{ color: "var(--on-surface-disabled)" }}>Price</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMid}
                  className="px-1.5 py-0.5 text-[10px] rounded transition-colors"
                  style={{ color: "var(--on-surface-muted)", background: "transparent" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface)"; (e.currentTarget as HTMLElement).style.background = "var(--surface-container-high)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  Mid
                </button>
                <button
                  onClick={handleBBO}
                  className="px-1.5 py-0.5 text-[10px] rounded transition-colors"
                  style={{ color: "var(--tertiary)", background: "rgba(255,182,143,0.1)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,182,143,0.2)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,182,143,0.1)")}
                >
                  BBO
                </button>
              </div>
            </div>
            <div className="flex items-center rounded px-3 py-2" style={{ background: "var(--surface-container-low)", borderBottom: "2px solid var(--outline-variant)" }}>
              <input
                id="price-input"
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={String(currentPrice)}
                className="flex-1 bg-transparent text-sm outline-none font-mono"
                style={{ color: "var(--on-surface)" }}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTickDown}
                  className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors"
                  style={{ color: "var(--on-surface-muted)", background: "var(--surface-container-high)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)")}
                >
                  −
                </button>
                <button
                  onClick={handleTickUp}
                  className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors"
                  style={{ color: "var(--on-surface-muted)", background: "var(--surface-container-high)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-muted)")}
                >
                  +
                </button>
              </div>
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
          {/* Percentage buttons */}
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

        {/* Action Buttons */}
        {!wallet.connected ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={connect}
              className="w-full py-2.5 text-[13px] font-semibold rounded btn-primary-gradient flex items-center justify-center gap-2"
            >
              <Wallet size={14} />
              Connect Wallet to Trade
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={handlePlaceOrder}
              disabled={orderPending || insufficientBalance || qtyNum <= 0}
              className="w-full py-2.5 text-[13px] font-semibold rounded transition-colors flex items-center justify-center gap-2"
            style={{
              background: orderPending || insufficientBalance || qtyNum <= 0
                ? "var(--surface-container-high)"
                : side === "buy"
                ? "linear-gradient(135deg, var(--buy) 0%, var(--buy-bright) 100%)"
                : "linear-gradient(135deg, var(--sell) 0%, var(--sell-bright) 100%)",
              color: orderPending || insufficientBalance || qtyNum <= 0
                ? "var(--on-surface-disabled)"
                : side === "buy" ? "#000" : "var(--on-primary)",
              cursor: orderPending || insufficientBalance || qtyNum <= 0 ? "not-allowed" : "pointer",
              boxShadow: orderPending || insufficientBalance || qtyNum <= 0
                ? "none"
                : side === "buy"
                ? "0 0 16px 2px rgba(0,192,118,0.25)"
                : "0 0 16px 2px rgba(255,77,79,0.25)",
            }}
            >
              {orderPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Placing Order...
                </>
              ) : insufficientBalance ? (
                "Insufficient Balance"
              ) : (
                `${side === "buy" ? "Buy / Long" : "Sell / Short"} ${symbol}`
              )}
            </button>
          </div>
        )}

        {/* Order Options */}
        {wallet.connected && (
          <div className="flex items-center gap-3 pt-1" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
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
        )}

        {/* Active Positions */}
        {wallet.connected && activePositions.length > 0 && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
            <span className="text-[11px] mb-2 block" style={{ color: "var(--on-surface-disabled)" }}>Active Positions</span>
            {activePositions.map((pos) => (
              <div key={pos.id} className="rounded p-2.5 mb-2" style={{ background: "var(--surface-container-low)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-medium" style={{ color: pos.side === "long" ? "var(--buy)" : "var(--sell)" }}>
                    {pos.side.toUpperCase()} {pos.quantity} {pos.symbol}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>{pos.leverage}x</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span style={{ color: "var(--on-surface-disabled)" }}>Entry</span>
                  <span className="font-mono" style={{ color: "var(--on-surface)" }}>{pos.entryPrice}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span style={{ color: "var(--on-surface-disabled)" }}>Liq. Price</span>
                  <span className="font-mono" style={{ color: "var(--liquidation)" }}>{pos.liquidationPrice}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-2">
                  <span style={{ color: "var(--on-surface-disabled)" }}>Unrealized PnL</span>
                  <span className="font-mono" style={{ color: pos.unrealizedPnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
                    {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPct.toFixed(2)}%)
                  </span>
                </div>
                <button
                  onClick={() => onClosePosition(pos.id)}
                  className="w-full py-1.5 text-[11px] font-mono rounded transition-colors"
                  style={{ border: "1px solid rgba(255,77,79,0.3)", color: "var(--sell)", background: "transparent" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,77,79,0.08)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  Close Position
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Open Orders */}
        {wallet.connected && openOrders.length > 0 && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(66,70,84,0.4)" }}>
            <span className="text-[11px] mb-2 block" style={{ color: "var(--on-surface-disabled)" }}>Open Orders</span>
            {openOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded p-2 mb-1.5" style={{ background: "var(--surface-container-low)" }}>
                <div>
                  <span className="text-[10px] font-mono font-medium" style={{ color: order.side === "buy" ? "var(--buy)" : "var(--sell)" }}>
                    {order.side.toUpperCase()} {order.quantity} @ {order.price}
                  </span>
                  <span className="text-[9px] ml-2" style={{ color: "var(--on-surface-disabled)" }}>{order.type}</span>
                </div>
                <button
                  onClick={() => onCancelOrder(order.id)}
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

        {/* Logout button */}
      </div>
    </div>
  );
}
