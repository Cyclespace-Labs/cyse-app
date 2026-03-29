"use client";

import { Vault } from "@/types/vault";
import Sparkline from "./Sparkline";
import { Info } from "lucide-react";
import Link from "next/link";

interface VaultTableProps {
  title: string;
  description: string;
  vaults: Vault[];
}

const formatTvl = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}m`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}k`;
  return `$${val.toFixed(2)}`;
};

export default function VaultTable({ title, description, vaults }: VaultTableProps) {
  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1c1c28]">
        <h2 className="text-white text-[16px] font-semibold">{title}</h2>
        <p className="text-[#5a5a6a] text-[12px] font-mono mt-1">{description}</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1c1c28] text-[10px] font-mono text-[#5a5a6a] uppercase tracking-wider">
            <th className="text-left px-5 py-3 font-normal">VAULT</th>
            <th className="text-left px-3 py-3 font-normal">
              TVL (SUPPLY) <span className="text-[#5a5a6a]">↓</span>
            </th>
            <th className="text-left px-3 py-3 font-normal">BALANCE</th>
            <th className="text-left px-3 py-3 font-normal">
              FEE APY <Info size={9} className="inline ml-0.5 text-[#5a5a6a]" />
            </th>
            <th className="text-left px-3 py-3 font-normal">
              ANN. PERFORMANCE <Info size={9} className="inline ml-0.5 text-[#5a5a6a]" />
            </th>
            <th className="text-left px-3 py-3 font-normal">
              SNAPSHOT <Info size={9} className="inline ml-0.5 text-[#5a5a6a]" />
            </th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {vaults.map((vault) => (
            <tr
              key={vault.id}
              className="border-b border-[#1c1c28] last:border-b-0 hover:bg-[#12121a] transition-colors"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {vault.assets.map((asset, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-[#0b0b0e]"
                        style={{ backgroundColor: asset.color, zIndex: vault.assets.length - i }}
                      >
                        {asset.logo}
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="text-white text-[13px] font-mono font-medium">
                      {vault.name}
                    </span>
                    <span className="text-[#5a5a6a] text-[11px] font-mono ml-1.5">
                      [{vault.pairLabel}]
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex flex-col">
                  <span className="text-white text-[12px] font-mono">{formatTvl(vault.tvl)}</span>
                  <span className="text-[#5a5a6a] text-[10px] font-mono">({vault.tvlSupply})</span>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <span className="text-[#5a5a6a] text-[12px] font-mono">
                  {vault.balance !== null ? formatTvl(vault.balance) : "-"}
                </span>
              </td>
              <td className="px-3 py-3.5">
                <span className="text-white text-[12px] font-mono">{vault.feeApy.toFixed(2)}%</span>
              </td>
              <td className="px-3 py-3.5">
                <span
                  className={`text-[12px] font-mono ${
                    vault.annualPerformance >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                  }`}
                >
                  {vault.annualPerformance.toFixed(2)}%
                </span>
              </td>
              <td className="px-3 py-3.5">
                <Sparkline data={vault.sparklineData} width={100} height={28} />
              </td>
              <td className="px-3 py-3.5">
                <Link
                  href={`/vault/${vault.id}`}
                  className="text-[#0E76FD] text-[11px] font-mono hover:underline"
                >
                  Details ›
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
