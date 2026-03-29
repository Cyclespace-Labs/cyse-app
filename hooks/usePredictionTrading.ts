"use client";

import { useState, useCallback } from "react";

export interface PredictionTradingState {
  side: "buy" | "sell";
  selectedOption: number;
  orderType: "market" | "limit";
  amount: string;
}

export function usePredictionTrading(initialState?: Partial<PredictionTradingState>) {
  const [side, setSide] = useState<"buy" | "sell">(initialState?.side || "buy");
  const [selectedOption, setSelectedOption] = useState<number>(initialState?.selectedOption || 0);
  const [orderType, setOrderType] = useState<"market" | "limit">(initialState?.orderType || "market");
  const [amount, setAmount] = useState<string>(initialState?.amount || "0");

  const reset = useCallback(() => {
    setSide("buy");
    setSelectedOption(0);
    setOrderType("market");
    setAmount("0");
  }, []);

  const updateFromParams = useCallback((params: URLSearchParams) => {
    const sideParam = params.get("side");
    const optionParam = params.get("option");
    
    if (sideParam === "buy" || sideParam === "sell") {
      setSide(sideParam);
    }
    
    if (optionParam !== null) {
      const optionIndex = parseInt(optionParam, 10);
      if (!isNaN(optionIndex) && optionIndex >= 0) {
        setSelectedOption(optionIndex);
      }
    }
  }, []);

  return {
    side,
    setSide,
    selectedOption,
    setSelectedOption,
    orderType,
    setOrderType,
    amount,
    setAmount,
    reset,
    updateFromParams,
  };
}
