"use client";

import { Search, Bell, Settings, Globe } from "lucide-react";
import { Tourney } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const tourney = Tourney({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const navItems = [
  { label: "Perpetuals", href: "/trading" },
  { label: "Predictions", href: "/predictions" },
  { label: "Earn", href: "/earn" },
  { label: "Vault", href: "/vault" },
  { label: "Stats", href: "#" },
  { label: "More", href: "#", hasDropdown: true },
];

export default function TopNavigation() {
  const pathname = usePathname();
  const [primaryColor, setPrimaryColor] = useState("#0E76FD");
  const [secondaryColor, setSecondaryColor] = useState("#0E76FD");

  useEffect(() => {
    const getCSSVariable = (variableName: string) => {
      if (typeof window !== "undefined") {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        return computedStyle.getPropertyValue(variableName).trim();
      }
      return "";
    };

    const updateColors = () => {
      const primary = getCSSVariable("--primary");
      const secondary = getCSSVariable("--secondary");
      setPrimaryColor(primary || "#0E76FD");
      setSecondaryColor(secondary || "#0E76FD");
    };

    updateColors();

    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header className="flex items-center justify-between h-12 px-4 bg-[#0b0b0e] border-b border-[#1c1c28]">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-1">
        {/* Backpack Logo */}
            <Link href="/" className="flex items-center justify-start space-x-1 md:space-x-2 pr-5">
              <div className="p-0 rounded-lg transition-all duration-100 font-sans">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 256 256"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="dark:hidden h-5 w-5 md:h-5 md:w-5"
                >
                  <path
                    d="M105 76H38.8466C38.8466 76 33.5426 87.8169 32.5112 92.1876C27.8222 112.059 26.8737 128.971 29.2698 149.33C31.4799 168.107 38.6993 183 38.6993 183H101.759C101.759 183 89.4948 164.979 86.2884 155.157C81.4264 140.265 81.6222 128.124 84.3731 111.613C87.4302 93.2635 105 76 105 76Z"
                    fill={primaryColor}
                  />
                  <path
                    d="M125.807 21.3854C108.841 22.5059 89 33.4938 89 33.4938C89 33.4938 110.862 35.6524 122.776 41.1486C135.785 47.1503 144.604 53.1327 152.654 64.6696C159.034 73.8123 160.737 90 160.737 90H228C228 90 225.957 79.1846 219.484 68.2883C212.123 53.3962 197.111 40.3233 183.254 32.5196C164.979 22.2275 147.371 19.9612 125.807 21.3854Z"
                    fill={primaryColor}
                    stroke={primaryColor}
                  />
                  <path
                    d="M125.807 235.615C108.841 234.494 89 223.506 89 223.506C89 223.506 110.862 221.348 122.776 215.851C135.785 209.85 144.604 203.867 152.654 192.33C159.034 183.188 160.737 167 160.737 167H228C228 167 225.957 177.815 219.484 188.712C212.123 203.604 197.111 216.677 183.254 224.48C164.979 234.773 147.371 237.039 125.807 235.615Z"
                    fill={primaryColor}
                    stroke={primaryColor}
                  />
                </svg>
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 256 256"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="hidden dark:block h-5 w-5 md:h-5 md:w-5"
                >
                  <path
                    d="M105 76H38.8466C38.8466 76 33.5426 87.8169 32.5112 92.1876C27.8222 112.059 26.8737 128.971 29.2698 149.33C31.4799 168.107 38.6993 183 38.6993 183H101.759C101.759 183 89.4948 164.979 86.2884 155.157C81.4264 140.265 81.6222 128.124 84.3731 111.613C87.4302 93.2635 105 76 105 76Z"
                    fill={secondaryColor}
                  />
                  <path
                    d="M125.807 21.3854C108.841 22.5059 89 33.4938 89 33.4938C89 33.4938 110.862 35.6524 122.776 41.1486C135.785 47.1503 144.604 53.1327 152.654 64.6696C159.034 73.8123 160.737 90 160.737 90H228C228 90 225.957 79.1846 219.484 68.2883C212.123 53.3962 197.111 40.3233 183.254 32.5196C164.979 22.2275 147.371 19.9612 125.807 21.3854Z"
                    fill={secondaryColor}
                    stroke={secondaryColor}
                  />
                  <path
                    d="M125.807 235.615C108.841 234.494 89 223.506 89 223.506C89 223.506 110.862 221.348 122.776 215.851C135.785 209.85 144.604 203.867 152.654 192.33C159.034 183.188 160.737 167 160.737 167H228C228 167 225.957 177.815 219.484 188.712C212.123 203.604 197.111 216.677 183.254 224.48C164.979 234.773 147.371 237.039 125.807 235.615Z"
                    fill={secondaryColor}
                    stroke={secondaryColor}
                  />
                </svg>
              </div>
              <span
                className={`${tourney.className} antialiased text-md sm:text-md md:text-md font-semibold bg-black dark:bg-white text-transparent bg-clip-text`}
              >
                CYCLESPACE
              </span>
            </Link>

        {/* Nav Items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`px-3 py-1.5 text-[13px] rounded transition-colors ${
                isActive
                  ? "text-white bg-[#1c1c28]"
                  : "text-[#8a8a9a] hover:text-white hover:bg-[#1c1c28]/50"
              }`}
            >
              {item.label}
              {item.hasDropdown && (
                <span className="ml-1 text-[10px]">▾</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button title="Search" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Search size={16} />
        </button>
        <button title="Language" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Globe size={16} />
        </button>
        <button title="Notifications" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Bell size={16} />
        </button>
        <button title="Settings" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Settings size={16} />
        </button>
        <button className="ml-2 px-4 py-1.5 text-[13px] text-white border border-[#2a2a3a] rounded hover:bg-[#1c1c28] transition-colors">
          Log in
        </button>
        <button className="px-4 py-1.5 text-[13px] text-black bg-white rounded font-medium hover:bg-gray-200 transition-colors">
          Sign up
        </button>
      </div>
    </header>
  );
}
