import {
  EarnOpportunity,
  InfoCard,
  FAQItem,
  YieldNetwork,
  ExchangeOption,
  PortfolioStats,
} from "@/types/earn";

export const portfolioStats: PortfolioStats = {
  totalInvestmentValue: 0,
  totalEarned: 0,
  totalPendingRewards: 0,
  buybackAccrued: 48281,
  buybackToken: "CYSE",
};

export const recommendedOpportunities: EarnOpportunity[] = [
  {
    id: "rec-gmx",
    title: "CYSE",
    subtitle: "Accumulating",
    type: "GMX",
    logo: "C",
    color: "#0E76FD",
    apy: 0,
    apyLabel: "Accumulating",
    network: "Arbitrum",
  },
  {
    id: "rec-glv-1",
    title: "GLV",
    subtitle: "USDC→USDC",
    type: "GLV",
    logo: "G",
    color: "#6366f1",
    apy: 0.12,
    apyLabel: "0.12% Performance APY",
    network: "Ethereum",
  },
  {
    id: "rec-gm-eth",
    title: "ETH/USD",
    subtitle: "USDC+USDC",
    type: "GM",
    logo: "E",
    color: "#627eea",
    apy: 0.0,
    apyLabel: "0.00% Performance APY",
    network: "Ethereum",
  },
  {
    id: "rec-gm-vvv",
    title: "VVV/USD",
    subtitle: "WETH+USDC",
    type: "GM",
    logo: "V",
    color: "#f59e0b",
    apy: 71.22,
    apyLabel: "71.22% Performance APY",
    network: "Arbitrum",
  },
  {
    id: "rec-gm-btc",
    title: "BTC/USD",
    subtitle: "USDC+USDC",
    type: "GM",
    logo: "₿",
    color: "#f7931a",
    apy: 0.0,
    apyLabel: "0.00% Performance APY",
    network: "Ethereum",
  },
  {
    id: "rec-gm-pengu",
    title: "PENGU/USD",
    subtitle: "BTC+USDC",
    type: "GM",
    logo: "P",
    color: "#06b6d4",
    apy: 36.12,
    apyLabel: "36.12% Performance APY",
    network: "Arbitrum",
  },
];

export const infoCards: InfoCard[] = [
  {
    id: "info-gmx",
    type: "GMX",
    title: "What is CYSE?",
    badge: "Governance",
    badgeColor: "#0E76FD",
    description:
      "The CYSE token serves as the governance token of the Cyclespace protocol. 27% of platform revenue accumulates in the Treasury for CYSE buybacks. Stakers earn rewards based on staking power (duration × amount), distributed when CYSE reaches $90.",
    readMoreUrl: "#",
    bullets: [
      "Accumulate CYSE rewards by staking",
      "27% of protocol fees fund Treasury buybacks — rewards distributed at $90",
      "Receive voting power and participate in governance",
    ],
    ctaLabel: "Buy CYSE",
  },
  {
    id: "info-glv",
    type: "GLV",
    title: "What is GLV?",
    badge: "Passive management",
    badgeColor: "#6366f1",
    description:
      "GLV (CYSE Liquidity Vault) holds various GM tokens, giving you diversified exposure to Cyclespace's markets. The vault auto-rebalances to high-demand markets, unlocking higher potential yield compared to isolated pools.",
    readMoreUrl: "#",
    bullets: [
      "Get optimized exposure to the highest-utilized pools",
      "No active management required",
      "Earn fees from leverage trading, swaps, and spreads",
      "All earnings auto-compound",
      "Great for passive users",
    ],
    ctaLabel: "Buy GLV",
  },
  {
    id: "info-gm",
    type: "GM",
    title: "What is GM?",
    badge: "Active management",
    badgeColor: "#f59e0b",
    description:
      "GM tokens represent shares in a liquidity pool for a single Cyclespace market. Buy GM to provide liquidity and earn fees from leverage trading, swaps, and market-making activity on that specific market. All rewards are auto-compounded.",
    readMoreUrl: "#",
    bullets: [
      "Provide isolated liquidity per market",
      "Become a market maker",
      "Requires more active management than GLV",
      "All earnings auto-compound",
    ],
    ctaLabel: "Buy GM",
  },
];

export const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "Where do CYSE staking rewards come from?",
    answer:
      "CYSE staking rewards come from 27% of all protocol fees collected across the platform. These fees accumulate in the Treasury and are used for CYSE buybacks, which are distributed to stakers based on their staking power.",
  },
  {
    id: "faq-2",
    question: "What's the difference between GLV and GM?",
    answer:
      "GLV (Liquidity Vault) provides diversified exposure across multiple GM pools and auto-rebalances for you. GM tokens represent shares in a single market's liquidity pool. GLV is passive, GM requires more active management but can offer higher targeted yields.",
  },
  {
    id: "faq-3",
    question: "Can I unstake anytime?",
    answer:
      "Yes, you can unstake your CYSE tokens at any time. However, there is a cooldown period before unstaked tokens become available for withdrawal. Staking power accumulates over time, so early unstaking may reduce earned rewards.",
  },
  {
    id: "faq-4",
    question: "What networks are supported?",
    answer:
      "Cyclespace currently supports Arbitrum, Avalanche, and MegaETH networks. Each network may have different pools and yield opportunities available.",
  },
];

export const yieldLandscape: YieldNetwork[] = [
  {
    network: "Arbitrum",
    color: "#2d6af6",
    assets: [
      { name: "CYSE", type: "GMX", apy: null, apyLabel: "Accumulating" },
      { name: "GLV", type: "GLV", apy: 14.54, apyLabel: "14.54% APY" },
      { name: "GM", type: "GM", apy: 162.97, apyLabel: "162.97% APY" },
    ],
  },
  {
    network: "Avalanche",
    color: "#e84142",
    assets: [
      { name: "CYSE", type: "GMX", apy: null, apyLabel: "Accumulating" },
      { name: "GLV", type: "GLV", apy: 7.93, apyLabel: "7.93% APY" },
      { name: "GM", type: "GM", apy: 13.18, apyLabel: "13.18% APY" },
    ],
  },
  {
    network: "MegaETH",
    color: "#627eea",
    assets: [
      { name: "CYSE", type: "GMX", apy: null, apyLabel: "N/A" },
      { name: "GLV", type: "GLV", apy: 0.16, apyLabel: "0.16% APY" },
      { name: "GM", type: "GM", apy: 0.37, apyLabel: "0.37% APY" },
    ],
  },
];

export const exchangeOptions: ExchangeOption[] = [
  { id: "direct", name: "Buy CYSE directly", logo: "C", color: "#0E76FD" },
  { id: "uniswap", name: "Uniswap", logo: "U", color: "#ff007a" },
  { id: "1inch", name: "1inch", logo: "1", color: "#1b314f" },
  { id: "matcha", name: "Matcha", logo: "M", color: "#00c076" },
  { id: "binance", name: "Binance", logo: "B", color: "#f3ba2f" },
  { id: "bybit", name: "Bybit", logo: "D", color: "#f7a600" },
  { id: "bitget", name: "Bitget", logo: "B", color: "#00c076" },
  { id: "transak", name: "Transak", logo: "T", color: "#0064ff" },
];
