// Polymarket API Configuration
// Based on https://docs.polymarket.com/api-reference/introduction

export const POLYMARKET_CONFIG = {
  // API Base URLs
  GAMMA_API_BASE: 'https://gamma-api.polymarket.com',
  DATA_API_BASE: 'https://data-api.polymarket.com',
  CLOB_API_BASE: 'https://clob.polymarket.com',

  // Chain Configuration
  CHAIN_ID: 137, // Polygon mainnet
  CHAIN_NAME: 'polygon',

  // Caching Configuration (in seconds)
  CACHE_TTL: {
    EVENTS: 300, // 5 minutes
    MARKETS: 120, // 2 minutes
    MARKET_DETAIL: 30, // 30 seconds
    HOLDERS: 60, // 1 minute
    OPEN_INTEREST: 60, // 1 minute
    LIVE_VOLUME: 30, // 30 seconds
    ORDERBOOK: 10, // 10 seconds for real-time feel
  },

  // Pagination
  DEFAULT_LIMIT: 100,
  MAX_PAGES: 5,

  // Crypto filtering
  CRYPTO_TAG_SLUG: 'crypto',

  // Signature Types
  SIGNATURE_TYPES: {
    EOA: 0, // Standard Ethereum wallet (MetaMask)
    POLY_PROXY: 1, // Polymarket proxy wallet (Magic Link)
    GNOSIS_SAFE: 2, // Gnosis Safe multisig proxy wallet
  },

  // WebSocket Configuration
  WEBSOCKET: {
    RECONNECT_INTERVAL: 5000, // 5 seconds
    MAX_RECONNECT_ATTEMPTS: 10,
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
  },
} as const;

// Environment variable validation
export function validateEnvVars(): void {
  const required = [
    'POLYMARKET_PRIVATE_KEY',
    'POLYMARKET_API_KEY',
    'POLYMARKET_API_SECRET',
    'POLYMARKET_API_PASSPHRASE',
    'POLYMARKET_FUNDER_ADDRESS',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Missing Polymarket environment variables: ${missing.join(', ')}`);
    console.warn('Trading functionality will not work without these variables.');
  }
}

// Get environment variables with fallbacks
export const getPolyEnv = () => ({
  privateKey: process.env.POLYMARKET_PRIVATE_KEY,
  apiKey: process.env.POLYMARKET_API_KEY,
  apiSecret: process.env.POLYMARKET_API_SECRET,
  passphrase: process.env.POLYMARKET_API_PASSPHRASE,
  funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS,
});
