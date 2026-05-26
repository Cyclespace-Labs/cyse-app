/** Maps known Vault / Router / OrderBook revert strings to user-friendly copy. */
const KNOWN_ERRORS: Record<string, { title: string; description: string }> = {
  // ── Vault: collateral & fees ──────────────────────────────────────────────
  "Vault: insufficient collateral for fees": {
    title: "Collateral Too Small for Fees",
    description:
      "Your collateral doesn't cover the opening fee. Increase your collateral amount or reduce leverage.",
  },
  "Vault: fees exceed collateral": {
    title: "Fees Exceed Collateral",
    description:
      "Accumulated fees have exceeded your remaining collateral. Add margin or close the position.",
  },
  "Vault: liquidation fees exceed collateral": {
    title: "Below Minimum Collateral",
    description:
      "Your collateral is below the liquidation fee threshold. Add more margin or reduce your position size.",
  },
  "Vault: losses exceed collateral": {
    title: "Losses Exceed Collateral",
    description:
      "Unrealized losses exceed your available collateral. This position would be instantly liquidated.",
  },

  // ── Vault: leverage & size ────────────────────────────────────────────────
  "Vault: maxLeverage exceeded": {
    title: "Leverage Limit Exceeded",
    description:
      "This position exceeds the vault's maximum leverage. Reduce your leverage or increase collateral.",
  },
  "Vault: _size must be more than _collateral": {
    title: "Invalid Position Size",
    description: "Position size must be greater than collateral (leverage > 1×).",
  },

  // ── Vault: tokens ─────────────────────────────────────────────────────────
  "Vault: mismatched tokens": {
    title: "Token Mismatch",
    description:
      "Collateral token and index token are mismatched for this direction. Refresh the page and try again.",
  },
  "Vault: _token not whitelisted": {
    title: "Token Not Supported",
    description: "This token is not whitelisted in the vault.",
  },
  "Vault: _token not a stable token": {
    title: "Non-Stable Collateral for Short",
    description: "Short positions require a stable coin (USDC / USDT) as collateral.",
  },
  "Vault: _collateralToken must be a stable token": {
    title: "Non-Stable Collateral for Short",
    description: "Short positions require a stable coin (USDC / USDT) as collateral.",
  },
  "Vault: _collateralToken must not be a stable token": {
    title: "Stable Collateral for Long",
    description: "Long positions cannot use a stable coin as collateral.",
  },

  // ── Vault: liquidity ──────────────────────────────────────────────────────
  "Vault: reserve exceeds pool": {
    title: "Insufficient Pool Liquidity",
    description:
      "Not enough liquidity in the pool for this position size. Try a smaller amount or come back later.",
  },
  "Vault: poolAmount < buffer": {
    title: "Pool Buffer Limit Reached",
    description:
      "This trade would bring the pool below its safety buffer. Reduce position size.",
  },
  "Vault: max USDG exceeded": {
    title: "Pool Capacity Full",
    description: "This token has reached its maximum USDG capacity in the vault.",
  },

  // ── Vault: misc ───────────────────────────────────────────────────────────
  "Vault: forbidden": {
    title: "Action Forbidden",
    description:
      "You are not authorized to perform this action. Ensure your wallet is connected correctly.",
  },
  "Vault: invalid _averagePrice": {
    title: "Invalid Average Price",
    description: "The position average price is invalid. This is likely an oracle issue.",
  },

  // ── Router ────────────────────────────────────────────────────────────────
  "Router: mark price higher than limit": {
    title: "Price Above Your Limit (Long)",
    description:
      "Current mark price is above your acceptable price. Increase slippage tolerance or wait for a better price.",
  },
  "Router: mark price lower than limit": {
    title: "Price Below Your Limit (Short)",
    description:
      "Current mark price is below your acceptable price. Increase slippage tolerance or wait for a better price.",
  },
  "Router: invalid _path.length": {
    title: "Invalid Token Path",
    description: "Internal token swap path is invalid. Refresh the page and try again.",
  },
  "Router: invalid _path": {
    title: "Invalid Token Path",
    description: "Internal token swap path is invalid. Refresh the page and try again.",
  },
  "Router: invalid _amountIn": {
    title: "Invalid Amount",
    description: "The input amount is zero or invalid.",
  },
  "Router: forbidden": {
    title: "Router Not Approved",
    description:
      "The Router is not approved in the Vault. Refresh the page to re-approve.",
  },

  // ── OrderBook ─────────────────────────────────────────────────────────────
  "OrderBook: insufficient execution fee": {
    title: "Execution Fee Too Low",
    description:
      "The execution fee attached to this limit order is too low. Refresh and try again.",
  },
  "OrderBook: non-existent order": {
    title: "Order No Longer Exists",
    description:
      "This order was already executed or cancelled. Refresh your order list.",
  },
  "OrderBook: forbidden": {
    title: "Not Your Order",
    description: "You can only cancel your own orders.",
  },
};

export interface ParsedContractError {
  title: string;
  description: string;
  raw: string;
}

/**
 * Converts a raw contract error (Viem ContractFunctionExecutionError or plain Error)
 * into a structured, user-friendly {title, description}.
 */
export function parseContractError(err: unknown): ParsedContractError {
  const raw = err instanceof Error ? err.message : String(err);

  // ── 1. User rejected the transaction in wallet ──────────────────────────
  if (/user rejected|user denied|denied transaction/i.test(raw)) {
    return {
      title: "Transaction Rejected",
      description: "You rejected the transaction in your wallet.",
      raw,
    };
  }

  // ── 2. Extract the inner revert reason (handles both gas estimation and revert) ──
  const revertMatch = raw.match(/reverted with reason string '([^']+)'/);
  if (revertMatch) {
    const reason = revertMatch[1];
    const known = KNOWN_ERRORS[reason];
    if (known) return { ...known, raw };
    return { title: "Transaction Reverted", description: reason, raw };
  }

  // ── 3. Custom error selector ─────────────────────────────────────────────
  const customErrorMatch = raw.match(/reverted with custom error '([^'(]+)/);
  if (customErrorMatch) {
    return {
      title: "Contract Error",
      description: `Contract error: ${customErrorMatch[1].trim()}`,
      raw,
    };
  }

  // ── 4. Gas estimation wraps the real error — recurse into the inner message ──
  if (/cannot estimate gas/i.test(raw)) {
    const innerRevert = raw.match(/reverted with reason string '([^']+)'/);
    if (innerRevert) {
      const reason = innerRevert[1];
      const known = KNOWN_ERRORS[reason];
      if (known) return { ...known, raw };
      return { title: "Transaction Would Fail", description: reason, raw };
    }
    return {
      title: "Transaction Would Fail",
      description:
        "The transaction cannot be estimated — it will revert. Check your inputs and try again.",
      raw,
    };
  }

  // ── 5. ERC-20 allowance ───────────────────────────────────────────────────
  if (/insufficient allowance/i.test(raw)) {
    return {
      title: "Approval Required",
      description:
        "Token allowance is insufficient. Approve the token for the Router and retry.",
      raw,
    };
  }

  // ── 6. ERC-20 balance ─────────────────────────────────────────────────────
  if (/insufficient balance|transfer amount exceeds balance/i.test(raw)) {
    return {
      title: "Insufficient Balance",
      description: "Your wallet balance is too low for this transaction.",
      raw,
    };
  }

  // ── 7. Network / RPC ──────────────────────────────────────────────────────
  if (/network|timeout|connection refused|fetch failed/i.test(raw)) {
    return {
      title: "Network Error",
      description: "Connection to the blockchain failed. Check your network and try again.",
      raw,
    };
  }

  // ── 8. Fallback: first line of message, truncated ────────────────────────
  const firstLine = raw.split("\n")[0]?.slice(0, 140) ?? raw;
  return { title: "Transaction Failed", description: firstLine, raw };
}
