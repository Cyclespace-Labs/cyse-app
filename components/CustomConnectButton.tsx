"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, Loader2, ExternalLink, X } from "lucide-react";

interface CustomConnectButtonProps {
  variant?: "default" | "large" | "small";
}

export function CustomConnectButton({ variant = "default" }: CustomConnectButtonProps) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                // Not connected - show connect button with previous design
                if (variant === "large") {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="w-full py-2.5 text-[13px] font-semibold rounded-2xl btn-primary-gradient flex items-center justify-center gap-2"
                    >
                      <Wallet size={14} />
                      Connect Wallet to Trade
                    </button>
                  );
                }
                if (variant === "small") {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold rounded-xl btn-primary-gradient"
                    >
                      <Wallet size={14} />
                      Connect Wallet
                    </button>
                  );
                }
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-mono font-semibold rounded-xl btn-primary-gradient"
                  >
                    <Wallet size={15} />
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                // Wrong network
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-semibold rounded-lg bg-red-500/20 text-red-500 border border-red-500/50"
                  >
                    <X size={14} />
                    Wrong Network
                  </button>
                );
              }

              // Connected - show account info with previous design style
              return (
                <div className="flex items-center gap-2">
                  {/* Chain button */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors text-[12px]"
                    style={{
                      color: "var(--on-surface-variant)",
                      background: "var(--surface-container)",
                    }}
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? "Chain icon"}
                        src={chain.iconUrl}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span className="hidden sm:inline">{chain.name}</span>
                  </button>

                  {/* Account button */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors text-[12px] font-mono"
                    style={{
                      color: "var(--on-surface)",
                      background: "var(--surface-container-high)",
                    }}
                  >
                    <span>{account.displayName}</span>
                    {account.displayBalance && (
                      <span style={{ color: "var(--on-surface-variant)" }}>
                        ({account.displayBalance})
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
