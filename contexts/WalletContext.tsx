"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface WalletState {
  connected: boolean;
  address: string;
  shortAddress: string;
  balance: number;
  equity: number;
  cyseBalance: number;
  stakedCyse: number;
  pendingRewards: number;
}

interface WalletContextType {
  wallet: WalletState;
  connect: () => void;
  disconnect: () => void;
  updateBalance: (delta: number) => void;
}

const DISCONNECTED: WalletState = {
  connected: false,
  address: "",
  shortAddress: "",
  balance: 0,
  equity: 0,
  cyseBalance: 0,
  stakedCyse: 0,
  pendingRewards: 0,
};

const MOCK_WALLET: WalletState = {
  connected: true,
  address: "0x7a3b...9f2e",
  shortAddress: "0x7a3b...9f2e",
  balance: 10000,
  equity: 10000,
  cyseBalance: 4820,
  stakedCyse: 2400,
  pendingRewards: 127.54,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(DISCONNECTED);

  const connect = useCallback(() => {
    setWallet(MOCK_WALLET);
  }, []);

  const disconnect = useCallback(() => {
    setWallet(DISCONNECTED);
  }, []);

  const updateBalance = useCallback((delta: number) => {
    setWallet((prev) => ({
      ...prev,
      balance: parseFloat((prev.balance + delta).toFixed(2)),
      equity: parseFloat((prev.equity + delta).toFixed(2)),
    }));
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, connect, disconnect, updateBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
