"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useMemo,
  useState,
} from "react";
import {
  useAccount,
  useDisconnect,
  useBalance,
  useReadContract,
  useChainId,
  useChains,
} from "wagmi";
import { formatUnits } from "viem";
import { contracts } from "@/lib/protocol/contracts";
import { useIdleTimer } from "@/hooks/useIdleTimer";
import { CustomConnectButton } from "@/components/CustomConnectButton";

// All supported chain IDs (GoChain Testnet + testnets)
const SUPPORTED_CHAIN_IDS = [31337, 11155111, 97, 421614];
const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "31337");

export type WalletType = "metamask" | "ledger" | "trezor" | "walletconnect" | "coinbase" | "injected" | "unknown";
export type SecurityLevel = "secure" | "standard" | "unsafe";

export interface WalletState {
  connected: boolean;
  address: `0x${string}` | undefined;
  shortAddress: string;
  balance: number;
  equity: number;
  nativeCurrencySymbol: string;
  cyseBalance: number;
  stakedCyse: number;
  pendingRewards: number;
  // Security fields
  walletType: WalletType;
  securityLevel: SecurityLevel;
  isHardwareWallet: boolean;
  chainId: number | null;
  isCorrectNetwork: boolean;
  chainName: string;
}

export interface SecurityState {
  sessionExpiry: number | null;
  lastActivity: number;
  isIdleWarning: boolean;
  idleTimeRemaining: number;
}

interface WalletContextType {
  wallet: WalletState;
  security: SecurityState;
  CustomConnectButton: typeof CustomConnectButton;
  disconnect: () => void;
  updateBalance: (delta: number) => void;
  // Security actions
  resetIdleTimer: () => void;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Detect wallet type from connector
function detectWalletType(connectorId: string): WalletType {
  const id = connectorId.toLowerCase();
  if (id.includes("ledger")) return "ledger";
  if (id.includes("trezor")) return "trezor";
  if (id.includes("walletconnect")) return "walletconnect";
  if (id.includes("coinbase")) return "coinbase";
  if (id.includes("metamask")) return "metamask";
  if (id.includes("injected")) return "injected";
  return "unknown";
}

// Determine security level based on wallet type
function getSecurityLevel(walletType: WalletType): SecurityLevel {
  switch (walletType) {
    case "ledger":
    case "trezor":
      return "secure";
    case "walletconnect":
    case "metamask":
    case "coinbase":
      return "standard";
    case "injected":
    case "unknown":
    default:
      return "standard";
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Resolve the active chain's native currency symbol (GO, ETH, BNB, etc.)
  const activeChain = chains.find((c) => c.id === chainId);
  const nativeCurrencySymbol = activeChain?.nativeCurrency?.symbol ?? "ETH";

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: !!address, refetchInterval: 5_000 },
  });

  const { data: cyseBalanceRaw } = useReadContract({
    ...contracts.cyse,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Detect wallet type
  const walletType = useMemo(() => {
    if (connector?.id) {
      return detectWalletType(connector.id);
    }
    return "unknown";
  }, [connector]);

  const isHardwareWallet = walletType === "ledger" || walletType === "trezor";
  const securityLevel = getSecurityLevel(walletType);
  const isCorrectNetwork = chainId ? SUPPORTED_CHAIN_IDS.includes(chainId) : false;

  const shortAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const balanceNum = ethBalance
    ? parseFloat(formatUnits(ethBalance.value, ethBalance.decimals))
    : 0;

  const cyseBalance = cyseBalanceRaw
    ? parseFloat(formatUnits(cyseBalanceRaw as bigint, 18))
    : 0;

  // Idle timer for session security
  const { isWarning: isIdleWarning, timeRemaining: idleTimeRemaining, reset: resetIdleTimer } =
    useIdleTimer({
      timeout: 30 * 60 * 1000, // 30 minutes
      action: "disconnect",
      onTimeout: () => {
        wagmiDisconnect();
      },
      onWarning: () => {
        console.warn("Wallet session expiring soon...");
      },
      warningDuration: 60 * 1000, // 1 minute warning
      disabled: !isConnected,
    });

  const wallet: WalletState = {
    connected: isConnected,
    address,
    shortAddress,
    balance: parseFloat(balanceNum.toFixed(4)),
    equity: parseFloat(balanceNum.toFixed(4)),
    nativeCurrencySymbol,
    cyseBalance: parseFloat(cyseBalance.toFixed(4)),
    stakedCyse: 0,
    pendingRewards: 0,
    // Security fields
    walletType,
    securityLevel,
    isHardwareWallet,
    chainId: chainId ?? null,
    isCorrectNetwork,
    chainName: activeChain?.name ?? "Unknown",
  };

  const security: SecurityState = {
    sessionExpiry: isConnected ? Date.now() + 30 * 60 * 1000 : null,
    lastActivity: Date.now(),
    isIdleWarning,
    idleTimeRemaining,
  };

  const connect = useCallback(
    () => {
      // RainbowKit handles connection via ConnectButton
    },
    []
  );

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const updateBalance = useCallback((_delta: number) => {
    // balance is read live from chain — local delta is a no-op
  }, []);

  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${DEFAULT_CHAIN_ID.toString(16)}` }],
      });
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        security,
        CustomConnectButton,
        disconnect,
        updateBalance,
        resetIdleTimer,
        switchNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}
