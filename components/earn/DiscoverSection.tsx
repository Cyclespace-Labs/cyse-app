"use client";

import { useState } from "react";
import { InfoCard as InfoCardType, FAQItem, YieldNetwork } from "@/types/earn";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

interface DiscoverSectionProps {
  infoCards: InfoCardType[];
  faqItems: FAQItem[];
  yieldLandscape: YieldNetwork[];
  onBuyClick?: (type: string) => void;
}

export default function DiscoverSection({
  infoCards,
  faqItems,
  yieldLandscape,
  onBuyClick,
}: DiscoverSectionProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="px-5 py-4 space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Three product cards */}
        <div className="col-span-3 grid grid-cols-3 gap-4">
          {infoCards.map((card) => (
            <div
              key={card.id}
              className="bg-[#12121a] border border-[#1c1c28] rounded-lg p-5 flex flex-col"
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[16px] font-bold"
                  style={{ backgroundColor: card.badgeColor + "25" }}
                >
                  {card.type === "GMX" ? "△" : card.type === "GLV" ? "◎" : "◉"}
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: card.badgeColor + "20",
                    color: card.badgeColor,
                  }}
                >
                  {card.badge}
                </span>
              </div>

              <h3 className="text-white text-[14px] font-semibold mb-2">{card.title}</h3>
              <p className="text-[#8a8a9a] text-[11px] font-mono leading-relaxed mb-3 flex-1">
                {card.description}
              </p>

              <a
                href={card.readMoreUrl}
                className="text-[#0E76FD] text-[11px] font-mono flex items-center gap-1 mb-4 hover:underline"
              >
                Read more <ExternalLink size={10} />
              </a>

              <ul className="space-y-1.5 mb-4">
                {card.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] font-mono text-[#8a8a9a]">
                    <span className="text-[#0E76FD] mt-0.5">●</span>
                    {b}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onBuyClick?.(card.type)}
                className="w-full py-2.5 text-[13px] font-mono font-semibold bg-[#0E76FD] text-white rounded hover:bg-[#2d8afd] transition-colors"
              >
                {card.ctaLabel}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-[#12121a] border border-[#1c1c28] rounded-lg p-4">
          <h3 className="text-white text-[13px] font-semibold mb-3">FAQ</h3>
          <div className="space-y-0">
            {faqItems.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className="border-b border-[#1c1c28] last:border-b-0">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between py-3 text-left group"
                  >
                    <span className="text-[#c0c0c0] text-[11px] font-mono group-hover:text-white transition-colors pr-2">
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronDown size={13} className="text-[#5a5a6a] shrink-0" />
                    ) : (
                      <ChevronRight size={13} className="text-[#5a5a6a] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="text-[#8a8a9a] text-[11px] font-mono leading-relaxed pb-3">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Yield Landscape */}
      <div>
        <h2 className="text-white text-[15px] font-semibold mb-4">Current yield landscape</h2>
        <div className="grid grid-cols-3 gap-4">
          {yieldLandscape.map((network) => (
            <div
              key={network.network}
              className="bg-[#12121a] border border-[#1c1c28] rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: network.color }}
                />
                <span className="text-white text-[13px] font-mono font-semibold">
                  {network.network}
                </span>
              </div>
              <div className="space-y-2">
                {network.assets.map((asset) => (
                  <div
                    key={asset.name}
                    className="flex items-center justify-between py-1.5 border-b border-[#1c1c28] last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: network.color }}
                      >
                        △
                      </span>
                      <span className="text-white text-[12px] font-mono">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[12px] font-mono font-medium ${
                          asset.apy && asset.apy > 0 ? "text-[#00c076]" : "text-[#5a5a6a]"
                        }`}
                      >
                        {asset.apyLabel}
                      </span>
                      {asset.apy !== null && (
                        <ChevronRight size={11} className="text-[#5a5a6a]" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
