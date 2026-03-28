"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Loader2, X } from "lucide-react";
import { Order, Position, TradingUser, TokenPriceData } from "@/types/trading";
import { getBestBidAsk, getTickSize } from "@/lib/tradingData";

const orderTypes = ["Limit", "Market", "Conditional"];
const pctButtons = [25, 50, 75, 100];

interface TradingPanelProps {
  user: TradingUser;
  symbol: string;
  tokenPriceData: TokenPriceData | null;
  activePositions: Position[];
  openOrders: Order[];
  orderPending: boolean;
  lastNotification: { type: "success" | "error"; message: string } | null;
  onLogin: () => void;
  onLogout: () => void;
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
  user,
  symbol,
  tokenPriceData,
  activePositions,
  openOrders,
  orderPending,
  lastNotification,
  onLogin,
  onLogout,
  onPlaceOrder,
  onCancelOrder,
  onClosePosition,
}: TradingPanelProps) {
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

  const insufficientBalance = user.isAuthenticated && marginRequired > user.balance;

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
    if (!user.isAuthenticated || user.balance <= 0) return;
    const p = activeType === "Market" ? currentPrice : (priceNum || currentPrice);
    if (p <= 0) return;
    const maxQty = (user.balance * leverage * (pct / 100)) / p;
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
    <div className="flex flex-col h-full bg-[#0b0b0e] text-white">
      {/* Notification */}
      {lastNotification && (
        <div
          className={`px-3 py-2 text-[11px] font-mono ${
            lastNotification.type === "success"
              ? "bg-[#00c076]/10 text-[#00c076]"
              : "bg-[#ff4d4f]/10 text-[#ff4d4f]"
          }`}
        >
          {lastNotification.message}
        </div>
      )}

      {/* Buy/Sell Toggle */}
      <div className="flex border-b border-[#1c1c28]">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
            side === "buy"
              ? "text-[#00c076] border-b-2 border-[#00c076]"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
            side === "sell"
              ? "text-[#ff4d4f] border-b-2 border-[#ff4d4f]"
              : "text-[#5a5a6a] hover:text-[#8a8a9a]"
          }`}
        >
          Sell / Short
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1c1c28]">
        {orderTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
              activeType === type
                ? "text-white bg-[#1c1c28]"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {type}
          </button>
        ))}
        <ChevronDown size={12} className="text-[#5a5a6a] ml-auto" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
        {/* Available Equity */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#5a5a6a]">Available Equity</span>
          <span className="text-white">
            {user.isAuthenticated ? `$${user.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
          </span>
        </div>

        {/* Price Input */}
        {activeType !== "Market" && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="price-input" className="text-[11px] text-[#5a5a6a]">Price</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMid}
                  className="px-1.5 py-0.5 text-[10px] rounded text-[#5a5a6a] hover:text-white hover:bg-[#1c1c28] transition-colors"
                >
                  Mid
                </button>
                <button
                  onClick={handleBBO}
                  className="px-1.5 py-0.5 text-[10px] rounded text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors"
                >
                  BBO
                </button>
              </div>
            </div>
            <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2">
              <input
                id="price-input"
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={String(currentPrice)}
                className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={handleTickDown}
                  className="w-5 h-5 flex items-center justify-center text-[#5a5a6a] hover:text-white bg-[#1c1c28] rounded text-xs"
                >
                  −
                </button>
                <button
                  onClick={handleTickUp}
                  className="w-5 h-5 flex items-center justify-center text-[#5a5a6a] hover:text-white bg-[#1c1c28] rounded text-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label htmlFor="qty-input" className="text-[11px] text-[#5a5a6a] mb-1 block">Quantity</label>
          <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2">
            <input
              id="qty-input"
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
            />
            <span className="text-[#5a5a6a] text-[11px] ml-2">{symbol}</span>
          </div>
          {/* Percentage buttons */}
          {user.isAuthenticated && (
            <div className="flex items-center gap-1 mt-1.5">
              {pctButtons.map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePctQuantity(pct)}
                  className="flex-1 py-1 text-[10px] font-mono bg-[#1c1c28] text-[#5a5a6a] rounded hover:bg-[#2a2a3a] hover:text-white transition-colors"
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
            <label htmlFor="leverage-slider" className="text-[11px] text-[#5a5a6a]">Leverage</label>
            <span className="text-[11px] text-white font-mono">{leverage}x</span>
          </div>
          <input
            id="leverage-slider"
            type="range"
            min={1}
            max={50}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full h-1 bg-[#1c1c28] rounded-full appearance-none cursor-pointer accent-[#00c076]"
          />
          <div className="flex justify-between mt-1">
            {[1, 5, 10, 20, 50].map((l) => (
              <button
                key={l}
                onClick={() => setLeverage(l)}
                className={`text-[10px] font-mono transition-colors ${
                  leverage === l ? "text-white" : "text-[#5a5a6a] hover:text-[#8a8a9a]"
                }`}
              >
                {l}x
              </button>
            ))}
          </div>
        </div>

        {/* Order Value */}
        <div>
          <span className="text-[11px] text-[#5a5a6a] mb-1 block">Order Value</span>
          <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2">
            <span className="text-white text-sm font-mono">
              {orderValue > 0 ? `$${orderValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
            </span>
          </div>
        </div>

        {/* Margin Required & Est. Liquidation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5a5a6a]">Margin Required</span>
            <span className={insufficientBalance ? "text-[#ff4d4f]" : "text-white"}>
              {marginRequired > 0 ? `$${marginRequired.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#5a5a6a]">Est. Liquidation Price</span>
            <span className="text-white">{estLiquidation !== null ? estLiquidation : "—"}</span>
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
          <span className="text-[11px] text-[#8a8a9a]">TP/SL</span>
        </label>

        {tpsl && (
          <div className="space-y-2">
            <div>
              <label htmlFor="tp-input" className="text-[10px] text-[#00c076] mb-1 block">Take Profit</label>
              <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-1.5">
                <input
                  id="tp-input"
                  type="text"
                  value={tpPrice}
                  onChange={(e) => setTpPrice(e.target.value)}
                  placeholder="TP Price"
                  className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label htmlFor="sl-input" className="text-[10px] text-[#ff4d4f] mb-1 block">Stop Loss</label>
              <div className="flex items-center bg-[#12121a] border border-[#1c1c28] rounded px-3 py-1.5">
                <input
                  id="sl-input"
                  type="text"
                  value={slPrice}
                  onChange={(e) => setSlPrice(e.target.value)}
                  placeholder="SL Price"
                  className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!user.isAuthenticated ? (
          <div className="space-y-2 pt-1">
            <button
              onClick={onLogin}
              className="w-full py-2.5 bg-white text-black text-[13px] font-medium rounded hover:bg-gray-200 transition-colors"
            >
              Sign up to trade
            </button>
            <button
              onClick={onLogin}
              className="w-full py-2.5 border border-[#2a2a3a] text-white text-[13px] rounded hover:bg-[#1c1c28] transition-colors"
            >
              Log in to trade
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={handlePlaceOrder}
              disabled={orderPending || insufficientBalance || qtyNum <= 0}
              className={`w-full py-2.5 text-[13px] font-medium rounded transition-colors flex items-center justify-center gap-2 ${
                orderPending || insufficientBalance || qtyNum <= 0
                  ? "bg-[#1c1c28] text-[#5a5a6a] cursor-not-allowed"
                  : side === "buy"
                  ? "bg-[#00c076] text-black hover:bg-[#00d884]"
                  : "bg-[#ff4d4f] text-white hover:bg-[#ff6b6d]"
              }`}
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
        {user.isAuthenticated && (
          <div className="flex items-center gap-3 pt-1 border-t border-[#1c1c28]">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={postOnly}
                onChange={(e) => setPostOnly(e.target.checked)}
                className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
              />
              <span className="text-[11px] text-[#8a8a9a]">Post Only</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={ioc}
                onChange={(e) => setIoc(e.target.checked)}
                className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
              />
              <span className="text-[11px] text-[#8a8a9a]">IOC</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reduceOnly}
                onChange={(e) => setReduceOnly(e.target.checked)}
                className="w-3 h-3 rounded border-[#2a2a3a] bg-[#12121a] accent-[#00c076]"
              />
              <span className="text-[11px] text-[#8a8a9a]">Reduce Only</span>
            </label>
          </div>
        )}

        {/* Active Positions */}
        {user.isAuthenticated && activePositions.length > 0 && (
          <div className="pt-2 border-t border-[#1c1c28]">
            <span className="text-[11px] text-[#5a5a6a] mb-2 block">Active Positions</span>
            {activePositions.map((pos) => (
              <div key={pos.id} className="bg-[#12121a] rounded p-2.5 mb-2 border border-[#1c1c28]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[11px] font-mono font-medium ${pos.side === "long" ? "text-[#00c076]" : "text-[#ff4d4f]"}`}>
                    {pos.side.toUpperCase()} {pos.quantity} {pos.symbol}
                  </span>
                  <span className="text-[10px] text-[#5a5a6a]">{pos.leverage}x</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-[#5a5a6a]">Entry</span>
                  <span className="text-white font-mono">{pos.entryPrice}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-[#5a5a6a]">Liq. Price</span>
                  <span className="text-[#ff6b35] font-mono">{pos.liquidationPrice}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-2">
                  <span className="text-[#5a5a6a]">Unrealized PnL</span>
                  <span className={`font-mono ${pos.unrealizedPnl >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"}`}>
                    {pos.unrealizedPnl >= 0 ? "+" : ""}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPct.toFixed(2)}%)
                  </span>
                </div>
                <button
                  onClick={() => onClosePosition(pos.id)}
                  className="w-full py-1.5 text-[11px] font-mono border border-[#ff4d4f]/30 text-[#ff4d4f] rounded hover:bg-[#ff4d4f]/10 transition-colors"
                >
                  Close Position
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Open Orders */}
        {user.isAuthenticated && openOrders.length > 0 && (
          <div className="pt-2 border-t border-[#1c1c28]">
            <span className="text-[11px] text-[#5a5a6a] mb-2 block">Open Orders</span>
            {openOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between bg-[#12121a] rounded p-2 mb-1.5 border border-[#1c1c28]">
                <div>
                  <span className={`text-[10px] font-mono font-medium ${order.side === "buy" ? "text-[#00c076]" : "text-[#ff4d4f]"}`}>
                    {order.side.toUpperCase()} {order.quantity} @ {order.price}
                  </span>
                  <span className="text-[9px] text-[#5a5a6a] ml-2">{order.type}</span>
                </div>
                <button
                  onClick={() => onCancelOrder(order.id)}
                  className="p-1 text-[#5a5a6a] hover:text-[#ff4d4f] transition-colors"
                  title="Cancel order"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Logout button */}
        {user.isAuthenticated && (
          <div className="pt-2 border-t border-[#1c1c28]">
            <button
              onClick={onLogout}
              className="w-full py-2 text-[11px] text-[#5a5a6a] hover:text-white border border-[#1c1c28] rounded hover:bg-[#1c1c28] transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
