"use client";

import { useState, useMemo, useEffect } from "react";
import { Order, Position, OrderHistoryEntry, PositionHistoryEntry, FillHistoryEntry, FundingHistoryEntry } from "@/types/trading";
import { X, Loader2, ArrowLeftRight } from "lucide-react";
import { computeLivePnl, computeLivePnlPct } from "@/lib/formatters";
import { formatDistanceToNow } from "@/lib/formatters";

const tabs = [
  "Balances",
  "Positions",
  "Open Orders",
  "Borrows",
  "TWAP",
  "Fill History",
  "Order History",
  "Position History",
  "Funding History",
];

interface BottomTabsProps {
  isAuthenticated?: boolean;
  positions?: Position[];
  orders?: Order[];
  currentPrice?: number;
  
  // History data
  orderHistory?: OrderHistoryEntry[];
  positionHistory?: PositionHistoryEntry[];
  fillHistory?: FillHistoryEntry[];
  fundingHistory?: FundingHistoryEntry[];
  fundingAvailable?: boolean;
  
  // Loading states
  isLoadingOrderHistory?: boolean;
  isLoadingPositionHistory?: boolean;
  isLoadingFillHistory?: boolean;
  isLoadingFundingHistory?: boolean;
  
  onCancelOrder?: (orderId: string) => void;
  onClosePosition?: (positionId: string) => void;
  onRefreshHistory?: () => void;
}

export default function BottomTabs({
  isAuthenticated = false,
  positions = [],
  orders = [],
  currentPrice = 0,
  
  // History data
  orderHistory = [],
  positionHistory = [],
  fillHistory = [],
  fundingHistory = [],
  fundingAvailable = true,
  
  // Loading states
  isLoadingOrderHistory = false,
  isLoadingPositionHistory = false,
  isLoadingFillHistory = false,
  isLoadingFundingHistory = false,
  
  onCancelOrder,
  onClosePosition,
  onRefreshHistory,
}: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState("Balances");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Positions tab toggles
  const [sizeMode, setSizeMode]     = useState<"usd" | "token">("usd");
  const [marginMode, setMarginMode] = useState<"usd" | "token">("usd");
  const [liqMode, setLiqMode]       = useState<"price" | "loss">("price");
  const [pnlMode, setPnlMode]       = useState<"usd" | "pct">("usd");

  // Open Orders tab toggles
  const [orderPriceMode, setOrderPriceMode] = useState<"price" | "dist">("price"); // price ↔ ±% from mark
  const [orderQtyMode, setOrderQtyMode]     = useState<"token" | "usd">("token");  // token qty ↔ USD notional

  // Fill History tab toggles
  const [fillSizeMode, setFillSizeMode] = useState<"usd" | "token">("usd"); // USD ↔ token qty
  const [fillFeeMode, setFillFeeMode]   = useState<"usd" | "pct">("usd");  // USD ↔ % of fill size

  // Order History tab toggles
  const [ohTriggerMode, setOhTriggerMode] = useState<"price" | "dist">("price"); // price ↔ ±% from mark
  const [ohSizeMode, setOhSizeMode]       = useState<"usd" | "token">("usd");    // USD ↔ token qty

  // Position History tab toggles
  const [phPriceMode, setPhPriceMode] = useState<"entry" | "both">("entry"); // entry price ↔ entry→exit
  const [phSizeMode, setPhSizeMode]   = useState<"usd" | "token">("usd");    // USD ↔ token qty
  const [phPnlMode, setPhPnlMode]     = useState<"usd" | "pct">("usd");     // USD ↔ % of size

  // Funding History tab toggles
  const [fundRateMode, setFundRateMode] = useState<"hourly" | "apr">("hourly"); // hourly % ↔ annualised APR

  const authed = mounted && isAuthenticated;

  const openOrders = orders.filter((o) => o.status === "open");
  const filledOrders = orders.filter((o) => o.status === "filled");

  const renderContent = () => {
    if (!authed) {
      return (
        <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
          <span>Connect wallet or log in to view your {activeTab.toLowerCase()}</span>
        </div>
      );
    }

    // Loading state component
    const LoadingState = () => (
      <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
        <Loader2 size={14} className="animate-spin mr-2" />
        <span>Loading {activeTab.toLowerCase()}...</span>
      </div>
    );

    if (activeTab === "Positions" && positions.length > 0) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>

                {/* Size — toggles between USD and index token qty */}
                <th className="text-right px-3 py-1.5 font-normal">
                  <button
                    onClick={() => setSizeMode(m => m === "usd" ? "token" : "usd")}
                    className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none"
                    title={sizeMode === "usd" ? "Switch to token qty" : "Switch to USD"}
                  >
                    Size
                    <span className="text-[9px] opacity-60">({sizeMode === "usd" ? "$" : "qty"})</span>
                    <ArrowLeftRight size={9} className="opacity-50" />
                  </button>
                </th>

                {/* Margin — toggles between USD and index token qty */}
                <th className="text-right px-3 py-1.5 font-normal">
                  <button
                    onClick={() => setMarginMode(m => m === "usd" ? "token" : "usd")}
                    className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none"
                    title={marginMode === "usd" ? "Switch to token qty" : "Switch to USD"}
                  >
                    Margin
                    <span className="text-[9px] opacity-60">({marginMode === "usd" ? "$" : "qty"})</span>
                    <ArrowLeftRight size={9} className="opacity-50" />
                  </button>
                </th>

                <th className="text-right px-3 py-1.5 font-normal">Entry</th>

                {/* Liq. Price — toggles between price and total loss at liq */}
                <th className="text-right px-3 py-1.5 font-normal">
                  <button
                    onClick={() => setLiqMode(m => m === "price" ? "loss" : "price")}
                    className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none"
                    title={liqMode === "price" ? "Switch to max loss" : "Switch to liq price"}
                  >
                    {liqMode === "price" ? "Liq. Price" : "Max Loss"}
                    <ArrowLeftRight size={9} className="opacity-50" />
                  </button>
                </th>

                {/* PnL — toggles between USD and % of margin */}
                <th className="text-right px-3 py-1.5 font-normal">
                  <button
                    onClick={() => setPnlMode(m => m === "usd" ? "pct" : "usd")}
                    className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none"
                    title={pnlMode === "usd" ? "Switch to % of margin" : "Switch to USD"}
                  >
                    PnL
                    <span className="text-[9px] opacity-60">({pnlMode === "usd" ? "$" : "%"})</span>
                    <ArrowLeftRight size={9} className="opacity-50" />
                  </button>
                </th>

                <th className="text-right px-3 py-1.5 font-normal"></th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {positions.map((pos) => (
                <tr
                  key={pos.id}
                  style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{pos.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: pos.side === "long" ? "var(--buy)" : "var(--sell)" }}>
                    {pos.side.toUpperCase()} {pos.leverage}x
                  </td>
                  {/* Size cell */}
                  {(() => {
                    const baseSymbol = pos.symbol.replace("-PERP", "").replace(/^W/, "");
                    const tokenQty = pos.entryPrice > 0 ? pos.quantity / pos.entryPrice : 0;
                    return (
                      <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>
                        {sizeMode === "usd"
                          ? `$${pos.quantity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${tokenQty.toFixed(4)} ${baseSymbol}`}
                      </td>
                    );
                  })()}

                  {/* Margin cell */}
                  {(() => {
                    const baseSymbol = pos.symbol.replace("-PERP", "").replace(/^W/, "");
                    const marginInToken = pos.entryPrice > 0 ? pos.margin / pos.entryPrice : 0;
                    const marginRatioPct = pos.quantity > 0 ? (pos.margin / pos.quantity) * 100 : 0;
                    return (
                      <td className="px-3 py-1.5 text-right">
                        {marginMode === "usd" ? (
                          <>
                            <span style={{ color: "var(--on-surface)" }}>${pos.margin.toFixed(2)}</span>
                            <span className="ml-1 text-[9px]" style={{ color: "var(--on-surface-disabled)" }}>({marginRatioPct.toFixed(1)}%)</span>
                          </>
                        ) : (
                          <span style={{ color: "var(--on-surface)" }}>{marginInToken.toFixed(4)} {baseSymbol}</span>
                        )}
                      </td>
                    );
                  })()}

                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>{pos.entryPrice}</td>

                  {/* Liq Price / Max Loss cell */}
                  {(() => {
                    const lossAtLiq = pos.entryPrice > 0
                      ? pos.quantity * Math.abs(pos.liquidationPrice - pos.entryPrice) / pos.entryPrice
                      : 0;
                    return (
                      <td className="px-3 py-1.5 text-right">
                        {liqMode === "price" ? (
                          <span style={{ color: "var(--liquidation)" }}>{pos.liquidationPrice.toFixed(4)}</span>
                        ) : (
                          <span style={{ color: "var(--sell)" }}>-${lossAtLiq.toFixed(2)}</span>
                        )}
                      </td>
                    );
                  })()}

                  {/* PnL cell */}
                  {(() => {
                    const livePnl = computeLivePnl(pos.quantity, pos.entryPrice, pos.side === "long", currentPrice, pos.unrealizedPnl);
                    const pnlPct = pos.margin > 0 ? (livePnl / pos.margin) * 100 : 0;
                    const pnlColor = livePnl >= 0 ? "var(--buy)" : "var(--sell)";
                    return (
                      <td className="px-3 py-1.5 text-right" style={{ color: pnlColor }}>
                        {pnlMode === "usd"
                          ? `${livePnl >= 0 ? "+" : ""}$${livePnl.toFixed(2)}`
                          : `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`}
                      </td>
                    );
                  })()}
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => onClosePosition?.(pos.id)}
                      className="text-[10px] px-2 py-0.5 rounded transition-colors"
                      style={{ border: "1px solid rgba(255,77,79,0.3)", color: "var(--sell)", background: "transparent" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,77,79,0.08)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (activeTab === "Open Orders" && openOrders.length > 0) {
      const ColToggle = ({ label, active, onClick, title }: { label: string; active: string; onClick: () => void; title: string }) => (
        <button onClick={onClick} className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none" title={title}>
          {label}<span className="text-[9px] opacity-60">({active})</span><ArrowLeftRight size={9} className="opacity-50" />
        </button>
      );
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-left px-3 py-1.5 font-normal">Type</th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <ColToggle label="Price" active={orderPriceMode === "price" ? "$" : "±%"} onClick={() => setOrderPriceMode(m => m === "price" ? "dist" : "price")} title="Toggle: limit price / distance from mark" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <ColToggle label="Qty" active={orderQtyMode === "token" ? "qty" : "$"} onClick={() => setOrderQtyMode(m => m === "token" ? "usd" : "token")} title="Toggle: token qty / USD notional" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal"></th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {openOrders.map((order) => {
                const orderPrice = order.type === "conditional" ? (order.tp ?? order.sl ?? order.price) : order.price;
                const distPct = currentPrice > 0 ? ((orderPrice - currentPrice) / currentPrice) * 100 : 0;
                const notionalUsd = order.quantity * orderPrice;
                return (
                  <tr
                    key={order.id}
                    style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{order.symbol}</td>
                    <td className="px-3 py-1.5" style={{ color: order.side === "buy" ? "var(--buy)" : "var(--sell)" }}>{order.side.toUpperCase()}</td>
                    <td className="px-3 py-1.5" style={{ color: "var(--on-surface-muted)" }}>{order.type === "conditional" ? (order.tp ? "TP" : "SL") : order.type}</td>
                    <td className="px-3 py-1.5 text-right">
                      {orderPriceMode === "price" ? (
                        <span style={{ color: "var(--on-surface)" }}>${orderPrice.toLocaleString()}</span>
                      ) : (
                        <span style={{ color: distPct >= 0 ? "var(--buy)" : "var(--sell)" }}>
                          {distPct >= 0 ? "+" : ""}{distPct.toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>
                      {orderQtyMode === "token" ? order.quantity : `$${notionalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => onCancelOrder?.(order.id)} className="p-0.5 rounded transition-colors" style={{ color: "var(--on-surface-disabled)" }} title="Cancel"
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sell)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}>
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Enhanced Fill History with real data
    if (activeTab === "Fill History") {
      if (isLoadingFillHistory) return <LoadingState />;
      if (fillHistory.length === 0 && filledOrders.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No fill history to display</span>
          </div>
        );
      }

      // Combine real fill history with local filled orders
      const allFills = [...fillHistory, ...filledOrders.map(o => ({
        id: o.id,
        orderIndex: 0,
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        executionPrice: o.price,
        sizeDelta: o.filled,
        collateralDelta: 0,
        fee: 0,
        txHash: "",
        blockNumber: 0,
        timestamp: o.createdAt,
      }))].sort((a, b) => b.timestamp - a.timestamp);

      const FillColToggle = ({ label, active, onClick, title }: { label: string; active: string; onClick: () => void; title: string }) => (
        <button onClick={onClick} className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none" title={title}>
          {label}<span className="text-[9px] opacity-60">({active})</span><ArrowLeftRight size={9} className="opacity-50" />
        </button>
      );
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-left px-3 py-1.5 font-normal">Type</th>
                <th className="text-right px-3 py-1.5 font-normal">Exec Price</th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <FillColToggle label="Size" active={fillSizeMode === "usd" ? "$" : "qty"} onClick={() => setFillSizeMode(m => m === "usd" ? "token" : "usd")} title="Toggle: USD / token qty" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <FillColToggle label="Fee" active={fillFeeMode === "usd" ? "$" : "%"} onClick={() => setFillFeeMode(m => m === "usd" ? "pct" : "usd")} title="Toggle: USD fee / % of size" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {allFills.slice(0, 50).map((fill) => {
                const tokenQty = fill.executionPrice > 0 ? fill.sizeDelta / fill.executionPrice : 0;
                const feePct = fill.sizeDelta > 0 ? (fill.fee / fill.sizeDelta) * 100 : 0;
                return (
                  <tr key={fill.id} style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                    <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{fill.symbol}</td>
                    <td className="px-3 py-1.5" style={{ color: fill.side === "buy" ? "var(--buy)" : "var(--sell)" }}>{fill.side.toUpperCase()}</td>
                    <td className="px-3 py-1.5" style={{ color: "var(--on-surface-muted)" }}>{fill.type}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>${fill.executionPrice.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>
                      {fillSizeMode === "usd" ? `$${fill.sizeDelta.toFixed(2)}` : `${tokenQty.toFixed(4)} ${fill.symbol.replace("-PERP","").replace(/^W/,"")}`}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-muted)" }}>
                      {fillFeeMode === "usd" ? `$${fill.fee.toFixed(4)}` : `${feePct.toFixed(3)}%`}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>{formatDistanceToNow(fill.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Order History Tab
    if (activeTab === "Order History") {
      if (isLoadingOrderHistory) return <LoadingState />;
      if (orderHistory.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No order history to display</span>
          </div>
        );
      }

      const OhColToggle = ({ label, active, onClick, title }: { label: string; active: string; onClick: () => void; title: string }) => (
        <button onClick={onClick} className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none" title={title}>
          {label}<span className="text-[9px] opacity-60">({active})</span><ArrowLeftRight size={9} className="opacity-50" />
        </button>
      );
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-left px-3 py-1.5 font-normal">Status</th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <OhColToggle label="Trigger" active={ohTriggerMode === "price" ? "$" : "±%"} onClick={() => setOhTriggerMode(m => m === "price" ? "dist" : "price")} title="Toggle: trigger price / distance from mark" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <OhColToggle label="Size" active={ohSizeMode === "usd" ? "$" : "qty"} onClick={() => setOhSizeMode(m => m === "usd" ? "token" : "usd")} title="Toggle: USD / token qty" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.slice(0, 50).map((order) => {
                const distPct = currentPrice > 0 ? ((order.triggerPrice - currentPrice) / currentPrice) * 100 : 0;
                const tokenQty = order.triggerPrice > 0 ? order.sizeDelta / order.triggerPrice : 0;
                const statusStyle = {
                  background: order.status === "created" ? "rgba(99,179,255,0.1)" : order.status === "cancelled" ? "rgba(255,77,79,0.1)" : "rgba(0,192,118,0.1)",
                  color: order.status === "created" ? "#63b3ff" : order.status === "cancelled" ? "var(--sell)" : "var(--buy)",
                };
                return (
                  <tr key={order.id} style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                    <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{order.symbol}</td>
                    <td className="px-3 py-1.5" style={{ color: order.side === "buy" ? "var(--buy)" : "var(--sell)" }}>{order.side.toUpperCase()}</td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px]" style={statusStyle}>{order.status.toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {ohTriggerMode === "price" ? (
                        <span style={{ color: "var(--on-surface)" }}>${order.triggerPrice.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: distPct >= 0 ? "var(--buy)" : "var(--sell)" }}>{distPct >= 0 ? "+" : ""}{distPct.toFixed(2)}%</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>
                      {ohSizeMode === "usd" ? `$${order.sizeDelta.toFixed(2)}` : `${tokenQty.toFixed(4)} ${order.symbol.replace("-PERP","").replace(/^W/,"")}`}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>{formatDistanceToNow(order.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Position History Tab
    if (activeTab === "Position History") {
      if (isLoadingPositionHistory) return <LoadingState />;
      if (positionHistory.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No position history to display</span>
          </div>
        );
      }

      const PhColToggle = ({ label, active, onClick, title }: { label: string; active: string; onClick: () => void; title: string }) => (
        <button onClick={onClick} className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none" title={title}>
          {label}<span className="text-[9px] opacity-60">({active})</span><ArrowLeftRight size={9} className="opacity-50" />
        </button>
      );
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Action</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <PhColToggle label="Price" active={phPriceMode === "entry" ? "entry" : "→exit"} onClick={() => setPhPriceMode(m => m === "entry" ? "both" : "entry")} title="Toggle: entry price / entry → exit" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <PhColToggle label="Size" active={phSizeMode === "usd" ? "$" : "qty"} onClick={() => setPhSizeMode(m => m === "usd" ? "token" : "usd")} title="Toggle: USD / token qty" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <PhColToggle label="PnL" active={phPnlMode === "usd" ? "$" : "%"} onClick={() => setPhPnlMode(m => m === "usd" ? "pct" : "usd")} title="Toggle: USD PnL / % of size" />
                </th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {positionHistory.slice(0, 50).map((pos) => {
                const tokenQty = pos.entryPrice > 0 ? pos.sizeDelta / pos.entryPrice : 0;
                const pnlPct = pos.sizeDelta > 0 && pos.pnl ? (pos.pnl / pos.sizeDelta) * 100 : null;
                const actionStyle = {
                  background: pos.action === "increase" ? "rgba(0,192,118,0.1)" : pos.action === "decrease" ? "rgba(255,171,0,0.1)" : pos.action === "close" ? "rgba(158,158,158,0.1)" : "rgba(255,77,79,0.1)",
                  color: pos.action === "increase" ? "var(--buy)" : pos.action === "decrease" ? "#ffab00" : pos.action === "close" ? "var(--on-surface-muted)" : "var(--sell)",
                };
                return (
                  <tr key={pos.id} style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                    <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{pos.symbol}</td>
                    <td className="px-3 py-1.5"><span className="px-1.5 py-0.5 rounded text-[9px]" style={actionStyle}>{pos.action.toUpperCase()}</span></td>
                    <td className="px-3 py-1.5" style={{ color: pos.side === "long" ? "var(--buy)" : "var(--sell)" }}>{pos.side.toUpperCase()}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>
                      {phPriceMode === "entry" ? (
                        `$${pos.entryPrice.toFixed(2)}`
                      ) : pos.exitPrice ? (
                        <span className="inline-flex items-center gap-1">
                          <span style={{ color: "var(--on-surface-disabled)" }}>${pos.entryPrice.toFixed(2)}</span>
                          <span style={{ color: "var(--on-surface-disabled)" }}>→</span>
                          <span style={{ color: pos.exitPrice >= pos.entryPrice ? "var(--buy)" : "var(--sell)" }}>${pos.exitPrice.toFixed(2)}</span>
                        </span>
                      ) : `$${pos.entryPrice.toFixed(2)}`}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface)" }}>
                      {phSizeMode === "usd" ? `$${pos.sizeDelta.toFixed(2)}` : `${tokenQty.toFixed(4)} ${pos.symbol.replace("-PERP","").replace(/^W/,"")}`}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: pos.pnl && pos.pnl >= 0 ? "var(--buy)" : "var(--sell)" }}>
                      {pos.pnl == null ? "—" : phPnlMode === "usd"
                        ? `${pos.pnl >= 0 ? "+" : ""}$${pos.pnl.toFixed(2)}`
                        : pnlPct != null ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>{formatDistanceToNow(pos.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Funding History Tab
    if (activeTab === "Funding History") {
      if (!fundingAvailable) {
        return (
          <div className="flex flex-col items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>Funding history not yet available</span>
            <span className="text-[10px] mt-1">Coming soon</span>
          </div>
        );
      }
      if (isLoadingFundingHistory) return <LoadingState />;
      if (fundingHistory.length === 0) {
        return (
          <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
            <span>No funding history to display</span>
          </div>
        );
      }

      const aprRate = (r: number) => (r * 24 * 365 * 100).toFixed(2); // hourly → annualised %
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
                <th className="text-left px-3 py-1.5 font-normal">Symbol</th>
                <th className="text-left px-3 py-1.5 font-normal">Side</th>
                <th className="text-right px-3 py-1.5 font-normal">
                  <button
                    onClick={() => setFundRateMode(m => m === "hourly" ? "apr" : "hourly")}
                    className="inline-flex items-center gap-1 hover:opacity-100 opacity-80 transition-opacity cursor-pointer select-none"
                    title="Toggle: hourly rate / annualised APR"
                  >
                    Rate
                    <span className="text-[9px] opacity-60">({fundRateMode === "hourly" ? "1h" : "APR"})</span>
                    <ArrowLeftRight size={9} className="opacity-50" />
                  </button>
                </th>
                <th className="text-right px-3 py-1.5 font-normal">Fee</th>
                <th className="text-right px-3 py-1.5 font-normal">Time</th>
              </tr>
            </thead>
            <tbody className="shrink-0 overflow-y-auto scrollbar-thin" style={{ maxHeight: "40vh" }}>
              {fundingHistory.slice(0, 50).map((funding) => (
                <tr key={funding.id} style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
                  <td className="px-3 py-1.5" style={{ color: "var(--on-surface)" }}>{funding.symbol}</td>
                  <td className="px-3 py-1.5" style={{ color: funding.side === "long" ? "var(--buy)" : "var(--sell)" }}>{funding.side.toUpperCase()}</td>
                  <td className="px-3 py-1.5 text-right" style={{ color: funding.fundingRate >= 0 ? "var(--buy)" : "var(--sell)" }}>
                    {fundRateMode === "hourly"
                      ? `${(funding.fundingRate * 100).toFixed(4)}% / 1h`
                      : <span>{aprRate(funding.fundingRate)}% <span className="text-[9px] opacity-60">p.a.</span></span>}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: funding.fundingFee >= 0 ? "var(--sell)" : "var(--buy)" }}>
                    {funding.fundingFee >= 0 ? "+" : ""}${Math.abs(funding.fundingFee).toFixed(4)}
                  </td>
                  <td className="px-3 py-1.5 text-right" style={{ color: "var(--on-surface-disabled)" }}>{formatDistanceToNow(funding.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-16 text-[12px]" style={{ color: "var(--on-surface-disabled)" }}>
        <span>No {activeTab.toLowerCase()} to display</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col" style={{ background: "var(--surface-container-lowest)", borderTop: "1px solid rgba(66,70,84,0.4)", borderRight: "1px solid rgba(66,70,84,0.4)", borderLeft: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Tab Header */}
      <div className="flex items-center justify-between overflow-x-auto px-2 scrollbar-hide" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-[12px] whitespace-nowrap transition-colors relative"
            style={{
              color: activeTab === tab ? "var(--on-surface)" : "var(--on-surface-disabled)",
              borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
            }}
          >
            {tab}
            {tab === "Positions" && positions.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--buy)" }}>({positions.length})</span>
            )}
            {tab === "Open Orders" && openOrders.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--tertiary)" }}>({openOrders.length})</span>
            )}
            {tab === "Order History" && orderHistory.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--tertiary)" }}>({orderHistory.length})</span>
            )}
            {tab === "Position History" && positionHistory.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--tertiary)" }}>({positionHistory.length})</span>
            )}
            {tab === "Fill History" && fillHistory.length > 0 && (
              <span className="ml-1 text-[9px]" style={{ color: "var(--buy)" }}>({fillHistory.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}
