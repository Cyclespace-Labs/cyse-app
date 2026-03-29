"use client";

import { useState } from "react";
import { Vault } from "@/types/vault";
import { PoolFilter } from "@/types/vault";
import Sparkline from "./Sparkline";
import { Info, Search, Star } from "lucide-react";
import Link from "next/link";

interface PoolTableProps {
  pools: Vault[];
  filters: PoolFilter[];
}

const formatTvl = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}m`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}k`;
  return `$${val.toFixed(2)}`;
};

export default function PoolTable({ pools, filters }: PoolTableProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = pools.filter((pool) => {
    const matchesSearch =
      search === "" ||
      pool.name.toLowerCase().includes(search.toLowerCase()) ||
      pool.pairLabel.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "favorites" && favorites.has(pool.id)) ||
      pool.category.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1c1c28]">
        <h2 className="text-white text-[16px] font-semibold">GM pools</h2>
        <p className="text-[#5a5a6a] text-[12px] font-mono mt-1">
          Pools that provide liquidity to specific Cyclespace markets. Supports single-asset and native asset options.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c28]">
        <div className="flex items-center gap-2 bg-[#12121a] border border-[#1c1c28] rounded px-3 py-1.5 w-[220px]">
          <Search size={13} className="text-[#5a5a6a] shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pools"
            className="flex-1 bg-transparent text-white text-[12px] font-mono outline-none placeholder:text-[#5a5a6a]"
          />
        </div>
        <div className="flex items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                activeFilter === f.value
                  ? "bg-[#1c1c28] text-white"
                  : "text-[#5a5a6a] hover:text-[#8a8a9a] hover:bg-[#1c1c28]/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#1c1c28] text-[10px] font-mono text-[#5a5a6a] uppercase tracking-wider">
            <th className="text-left px-5 py-3 font-normal">POOL</th>
            <th className="text-left px-3 py-3 font-normal">
              TVL (SUPPLY) <span className="text-[#5a5a6a]">↓</span>
            </th>
            <th className="text-left px-3 py-3 font-normal">
              BALANCE <span className="text-[#5a5a6a]">↓</span>
            </th>
            <th className="text-left px-3 py-3 font-normal">
              FEE APY <Info size={9} className="inline ml-0.5" /> <span className="text-[#5a5a6a]">↓</span>
            </th>
            <th className="text-left px-3 py-3 font-normal">
              ANN. PERFORMANCE <Info size={9} className="inline ml-0.5" /> <span className="text-[#5a5a6a]">↓</span>
            </th>
            <th className="text-left px-3 py-3 font-normal">
              SNAPSHOT <Info size={9} className="inline ml-0.5" />
            </th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((pool) => (
            <tr
              key={pool.id}
              className="border-b border-[#1c1c28] last:border-b-0 hover:bg-[#12121a] transition-colors"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleFavorite(pool.id)}
                    title="Toggle favorite"
                    className="shrink-0"
                  >
                    <Star
                      size={14}
                      className={
                        favorites.has(pool.id)
                          ? "text-[#f59e0b] fill-[#f59e0b]"
                          : "text-[#2a2a3a] hover:text-[#5a5a6a]"
                      }
                    />
                  </button>
                  <div className="flex -space-x-2">
                    {pool.assets.map((asset, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-[#0b0b0e]"
                        style={{ backgroundColor: asset.color, zIndex: pool.assets.length - i }}
                      >
                        {asset.logo}
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className="text-white text-[13px] font-mono font-medium">
                      {pool.name}
                    </span>
                    <span className="text-[#5a5a6a] text-[11px] font-mono ml-1.5">
                      [{pool.pairLabel}]
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex flex-col">
                  <span className="text-white text-[12px] font-mono">{formatTvl(pool.tvl)}</span>
                  <span className="text-[#5a5a6a] text-[10px] font-mono">({pool.tvlSupply})</span>
                </div>
              </td>
              <td className="px-3 py-3.5">
                <span className="text-[#5a5a6a] text-[12px] font-mono">
                  {pool.balance !== null ? formatTvl(pool.balance) : "-"}
                </span>
              </td>
              <td className="px-3 py-3.5">
                <span className="text-white text-[12px] font-mono">{pool.feeApy.toFixed(2)}%</span>
              </td>
              <td className="px-3 py-3.5">
                <span
                  className={`text-[12px] font-mono ${
                    pool.annualPerformance >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                  }`}
                >
                  {pool.annualPerformance.toFixed(2)}%
                </span>
              </td>
              <td className="px-3 py-3.5">
                <Sparkline data={pool.sparklineData} width={100} height={28} />
              </td>
              <td className="px-3 py-3.5">
                <Link
                  href={`/vault/${pool.id}`}
                  className="text-[#0E76FD] text-[11px] font-mono hover:underline"
                >
                  Details ›
                </Link>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-10 text-[#5a5a6a] text-[13px] font-mono">
                No pools match your search
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
