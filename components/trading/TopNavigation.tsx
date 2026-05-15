"use client";

import { Search, Bell, Settings, Globe, X, Wallet, ChevronDown, CheckCircle2, AlertCircle, Info, Zap, Moon, Sun, Monitor, Volume2, VolumeX, Shield, HelpCircle, LogOut, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Tourney } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useWallet } from "@/contexts/WalletContext";
import { useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import { useAllPositions } from "@/hooks/useAllPositions";

const tourney = Tourney({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const navItems = [
  { label: "Perpetuals", href: "/" },
  { label: "Predictions", href: "/predictions" },
  { label: "Earn", href: "/earn" },
  { label: "Vault", href: "/vault" },
  { label: "Stats", href: "#" },
  { label: "More", href: "#", hasDropdown: true },
];

const mockNotifications = [
  { id: 1, type: "success", icon: CheckCircle2, title: "Order Filled", body: "Buy 0.5 SOL @ $86.13 filled", time: "2m ago", unread: true },
  { id: 2, type: "warning", icon: AlertCircle, title: "Liquidation Warning", body: "BTC-PERP position near liquidation", time: "14m ago", unread: true },
  { id: 3, type: "info", icon: Info, title: "Funding Rate", body: "SOL-PERP funding rate: +0.012%", time: "1h ago", unread: false },
  { id: 4, type: "success", icon: Zap, title: "Prediction Resolved", body: "SOL > $90 by Jan 31 → YES wins", time: "3h ago", unread: false },
];

const notifIconColor: Record<string, string> = {
  success: "var(--buy)",
  warning: "var(--liquidation)",
  info: "var(--primary)",
};

export default function TopNavigation() {
  const pathname = usePathname();
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const { wallet, CustomConnectButton, disconnect } = useWallet();
  const [primaryColor, setPrimaryColor] = useState("#0E76FD");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);

  // Global account equity: wallet balance (native ETH → USD) + all position unrealized PnL
  const { data: nativeBalance } = useBalance({
    address: wallet.address,
    query: { enabled: wallet.connected, refetchInterval: 10_000 },
  });
  const { data: ethPriceRaw } = useReadContract({
    ...contracts.vaultPriceFeed,
    functionName: "getPrice",
    args: [contracts.weth.address, true, true, false],
    query: { enabled: wallet.connected, refetchInterval: 10_000 },
  });
  const { positions } = useAllPositions();

  const ethPrice = ethPriceRaw ? parseFloat(formatUnits(ethPriceRaw as bigint, 30)) : 0;
  const nativeBalanceEth = nativeBalance?.value
    ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals))
    : 0;
  const [walletUsdSnapshot, setWalletUsdSnapshot] = useState<{ balance: number; usd: number }>({ balance: 0, usd: 0 });
  const hasNativeBalanceData = Boolean(nativeBalance);

  useEffect(() => {
    if (!wallet.connected) {
      if (walletUsdSnapshot.balance !== 0 || walletUsdSnapshot.usd !== 0) {
        setWalletUsdSnapshot({ balance: 0, usd: 0 });
      }
      return;
    }

    if (!hasNativeBalanceData || ethPrice <= 0) return;

    const balanceChanged = Math.abs(nativeBalanceEth - walletUsdSnapshot.balance) > 1e-7;
    const snapshotUninitialized = walletUsdSnapshot.balance === 0 && walletUsdSnapshot.usd === 0;
    if ((snapshotUninitialized || balanceChanged) && Number.isFinite(nativeBalanceEth)) {
      setWalletUsdSnapshot({ balance: nativeBalanceEth, usd: nativeBalanceEth * ethPrice });
    }
  }, [wallet.connected, hasNativeBalanceData, nativeBalanceEth, ethPrice, walletUsdSnapshot.balance, walletUsdSnapshot.usd]);

  useEffect(() => {
    if (!wallet.connected) {
      setWalletUsdSnapshot({ balance: 0, usd: 0 });
    }
  }, [wallet.connected, wallet.address]);

  const staticWalletUsd = wallet.connected ? walletUsdSnapshot.usd : 0;
  const totalPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const equity = staticWalletUsd + totalPnl;
  const showLiveDelta = Math.abs(totalPnl) >= 0.01;
  const equityTooltip = hideBalances
    ? "Balances hidden"
    : `Balance $${staticWalletUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Equity $${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const balanceLabel = hideBalances
    ? "••••"
    : `$${staticWalletUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const equityLabel = hideBalances
    ? "••••"
    : `$${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const deltaLabel = hideBalances
    ? ""
    : showLiveDelta
      ? `(Δ ${totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
      : "";
  const nativeTokenLabel = hideBalances
    ? "••••"
    : `${wallet.balance.toLocaleString("en-US", { minimumFractionDigits: 4 })} ${wallet.nativeCurrencySymbol}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const searchRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const unreadCount = mockNotifications.filter((n) => n.unread).length;

  useEffect(() => {
    const getCSSVariable = (variableName: string) => {
      if (typeof window !== "undefined") {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
      }
      return "";
    };
    const updateColors = () => setPrimaryColor(getCSSVariable("--primary") || "#0E76FD");
    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const iconBtn = (onClick: () => void, title: string, children: React.ReactNode, active?: boolean) => (
    <button
      onClick={onClick}
      title={title}
      className="relative p-1.5 rounded transition-colors"
    >
      {children}
    </button>
  );

  return (
    <header className="flex items-center justify-between h-12 px-4 shrink-0 relative z-40 bg-background border-b border-outline-variant font-sans">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-1">
        <Link href="/" className="flex items-center gap-1.5 pr-5">
          <svg width="22" height="22" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M105 76H38.8466C38.8466 76 33.5426 87.8169 32.5112 92.1876C27.8222 112.059 26.8737 128.971 29.2698 149.33C31.4799 168.107 38.6993 183 38.6993 183H101.759C101.759 183 89.4948 164.979 86.2884 155.157C81.4264 140.265 81.6222 128.124 84.3731 111.613C87.4302 93.2635 105 76 105 76Z" fill={primaryColor} />
            <path d="M125.807 21.3854C108.841 22.5059 89 33.4938 89 33.4938C89 33.4938 110.862 35.6524 122.776 41.1486C135.785 47.1503 144.604 53.1327 152.654 64.6696C159.034 73.8123 160.737 90 160.737 90H228C228 90 225.957 79.1846 219.484 68.2883C212.123 53.3962 197.111 40.3233 183.254 32.5196C164.979 22.2275 147.371 19.9612 125.807 21.3854Z" fill={primaryColor} stroke={primaryColor} />
            <path d="M125.807 235.615C108.841 234.494 89 223.506 89 223.506C89 223.506 110.862 221.348 122.776 215.851C135.785 209.85 144.604 203.867 152.654 192.33C159.034 183.188 160.737 167 160.737 167H228C228 167 225.957 177.815 219.484 188.712C212.123 203.604 197.111 216.677 183.254 224.48C164.979 234.773 147.371 237.039 125.807 235.615Z" fill={primaryColor} stroke={primaryColor} />
          </svg>
          <span className={`${tourney.className} text-md font-semibold bg-linear-to-r from-foreground to-on-surface-variant bg-clip-text text-transparent`}>
            CYCLESPACE
          </span>
        </Link>

        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-0.5 px-3 py-1.5 text-[13px] rounded transition-colors 
              text-on-surface-variant hover:text-on-surface hover:bg-surface-high dark:hover:bg-surface-container 
              ${pathname === item.href ? "bg-surface-container dark:bg-surface-low text-on-surface" : ""}`}
          >
            {item.label}
            {item.hasDropdown && <ChevronDown size={11} className="opacity-60" />}
          </Link>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">

        {/* Expandable Search */}
        <div className="flex items-center text-on-surface-muted">
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all bg-surface-low border border-outline-variant w-[260px]">
              <Search size={13} className="text-on-surface-disabled shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search markets, tokens..."
                className="flex-1 bg-transparent text-[12px] outline-none text-on-surface placeholder:text-on-surface-disabled"
                onKeyDown={(e) => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                title="Close search"
                className="p-0.5 rounded transition-colors text-on-surface-muted hover:text-on-surface"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            iconBtn(() => setSearchOpen(true), "Search (⌘K)", <Search size={15} />)
          )}
        </div>

        {iconBtn(() => {}, "Language", <Globe size={15} className="text-on-surface-muted" />)}

        {/* Theme Toggle */}
        {resolvedTheme && iconBtn(
          toggleTheme,
          resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
          resolvedTheme === "dark"
            ? <Sun size={15} className="text-on-surface-muted" />
            : <Moon size={15} className="text-on-surface-muted" />
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setSettingsOpen(false); }}
            title="Notifications"
            className="relative p-1.5 rounded transition-colors text-on-surface-muted hover:text-on-surface hover:bg-surface-high"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold bg-primary text-on-primary">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[340px] rounded-xl overflow-hidden shadow-2xl z-50 bg-surface-low border border-outline-variant">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
                <span className="text-[13px] font-semibold text-on-surface">Notifications</span>
                <button className="text-[11px] transition-colors text-primary hover:text-primary/80">Mark all read</button>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {mockNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-outline-variant/50 hover:bg-surface-container ${n.unread ? "bg-primary/[0.04]" : "bg-transparent"}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <n.icon size={14} style={{ color: notifIconColor[n.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-on-surface">{n.title}</span>
                        <span className="text-[10px] shrink-0 text-on-surface-disabled">{n.time}</span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-relaxed text-on-surface-muted">{n.body}</p>
                    </div>
                    {n.unread && <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 text-center border-t border-outline-variant/60">
                <button className="text-[11px] transition-colors text-on-surface-muted hover:text-on-surface">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => { setSettingsOpen(!settingsOpen); setNotifOpen(false); }}
            title="Settings"
            className={`p-1.5 rounded transition-colors ${settingsOpen ? "text-on-surface bg-surface-container" : "text-on-surface-muted hover:text-on-surface hover:bg-surface-high"}`}
          >
            <Settings size={15} />
          </button>

          {settingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-[260px] rounded-xl overflow-hidden shadow-2xl z-50 bg-surface-low border border-outline-variant">
              <div className="px-4 py-3 border-b border-outline-variant">
                <span className="text-[13px] font-semibold text-on-surface">Settings</span>
              </div>
              <div className="py-1">
                {/* Sound toggle */}
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {soundEnabled
                      ? <Volume2 size={14} className="text-on-surface-muted" />
                      : <VolumeX size={14} className="text-on-surface-disabled" />}
                    <span className="text-[12px] text-on-surface-variant">Trade Sounds</span>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? "Disable trade sounds" : "Enable trade sounds"}
                    className={`w-9 h-5 rounded-full relative transition-colors ${soundEnabled ? "bg-primary" : "bg-surface-high"}`}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ left: soundEnabled ? "calc(100% - 18px)" : "2px" }}
                    />
                  </button>
                </div>
                <div className="h-px mx-4 bg-outline-variant/60" />
                {[
                  { icon: Monitor, label: "Display Settings" },
                  { icon: Shield, label: "Security" },
                  { icon: HelpCircle, label: "Help & Support" },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] transition-colors text-left text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  >
                    <Icon size={14} className="text-on-surface-muted" />
                    {label}
                  </button>
                ))}
                {wallet.connected && (
                  <>
                    <div className="h-px mx-4 bg-outline-variant/60" />
                    <button
                      onClick={() => { disconnect(); setSettingsOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] transition-colors text-left text-sell hover:bg-sell/[0.06]"
                    >
                      <LogOut size={14} />
                      Disconnect Wallet
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 mx-1.5 bg-outline-variant/50" />

        {/* Wallet */}
        {!mounted ? (
          <div className="flex items-center">
            <CustomConnectButton variant="small" />
          </div>
        ) : wallet.connected ? (
          <div className="flex items-center gap-2">
            {/* Security/Network Warnings */}
            {!wallet.isCorrectNetwork && (
              <button
                onClick={() => {}}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-warning/10 text-warning"
                title="Wrong network detected"
              >
                <AlertTriangle size={10} />
                <span>Wrong Network</span>
              </button>
            )}
            {wallet.isHardwareWallet && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-buy/10 text-buy"
                title="Hardware wallet connected"
              >
                <Shield size={10} />
                <span>{wallet.walletType === "ledger" ? "Ledger" : "Trezor"}</span>
              </div>
            )}
            {wallet.isCorrectNetwork && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-primary/10 text-primary"
                title={`Connected to ${wallet.chainName}`}
              >
                <Globe size={10} />
                <span>{wallet.chainName}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHideBalances((prev) => !prev)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors bg-surface-container dark:bg-surface-low text-on-surface-muted hover:text-on-surface"
                title={hideBalances ? "Show balances" : "Hide balances"}
              >
                {hideBalances ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{hideBalances ? "Show" : "Hide"}</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-mono bg-surface-container dark:bg-surface-low text-on-surface-variant">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: wallet.isCorrectNetwork
                      ? wallet.securityLevel === "secure"
                        ? "var(--buy)"
                        : "var(--primary)"
                      : "var(--warning)",
                  }}
                />
                <div className="flex flex-col leading-tight" title={equityTooltip}>
                  <div className="flex items-center gap-2 text-[12px] text-on-surface">
                    <span
                      className={hideBalances ? "text-on-surface-muted" : totalPnl >= 0 ? "text-buy" : totalPnl < 0 ? "text-sell" : "text-on-surface-muted"}
                    >
                      Equity {equityLabel}
                      {!hideBalances && deltaLabel && <span className="ml-1">{deltaLabel}</span>}
                    </span>
                    <span className="opacity-50">|</span>
                    <span>Balance {balanceLabel}</span>
                  </div>
                </div>
                <span className="opacity-50">|</span>
                <span className="text-on-surface">{nativeTokenLabel}</span>
                <span className="opacity-50">|</span>
                <span>{hideBalances ? "••••" : wallet.shortAddress}</span>
              </div>
            </div>
            <button
              onClick={disconnect}
              title="Disconnect wallet"
              className="px-3 py-1.5 text-[12px] font-mono rounded-lg transition-colors text-on-surface-disabled bg-surface-container dark:bg-surface-low hover:text-sell hover:bg-surface-high dark:hover:bg-surface-container"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <CustomConnectButton variant="small" />
          </div>
        )}
      </div>
    </header>
  );
}
