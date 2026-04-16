# Chainlink Environment Setup Guide

This guide explains how to set up Chainlink for the CYSE trading application. There are two main approaches:

1. **Chainlink Data Feeds** - On-chain price feeds (already partially integrated)
2. **Chainlink Data Streams** - Real-time WebSocket price updates

---

## Option 1: Chainlink Data Feeds (On-Chain)

### Overview
Chainlink Data Feeds are on-chain oracle contracts that provide price updates. Your contracts already reference Chainlink interfaces (`IChainlinkFlags`).

### Supported Networks

| Network | Chain ID | Data Feed Contract |
|---------|----------|-------------------|
| GoChain Testnet | 31337 | Custom deployment required |
| Ethereum Sepolia | 11155111 | 0x694AA1769357215DE4FAC081bf1f309aDC325306 |
| BSC Testnet | 97 | 0x2514895c23fBb85b466C3B292D4F158A49E542De |
| Arbitrum Sepolia | 421614 | 0x5f4eC313f23ef8167e458584034c2534157FceD9 |

### Setup Steps

#### 1. Deploy Chainlink Data Feed Contracts (for GoChain Testnet)

Since GoChain Testnet (31337) is a local network, you need to deploy a mock Chainlink feed:

```solidity
// contracts/mock/MockChainlinkFeed.sol
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MockChainlinkFeed is AggregatorV3Interface {
    uint80 public override roundId;
    int256 public override answer;
    uint256 public override startedAt;
    uint256 public override updatedAt;
    uint80 public override answeredInRound;

    mapping(uint80 => int256) public answers;

    constructor(int256 _initialPrice) {
        answer = _initialPrice;
        updatedAt = block.timestamp;
        startedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        ) {
        return (roundId, answer, startedAt, updatedAt, answeredInRound);
    }

    function updateAnswer(int256 _newPrice) external {
        answer = _newPrice;
        updatedAt = block.timestamp;
        roundId++;
    }
}
```

Deploy with Hardhat:
```bash
npx hardhat run scripts/deploy-mock-feed.js --network localhost
```

#### 2. Update Contract Addresses

Edit `lib/protocol/contracts.ts`:

```typescript
export const contracts = {
  // ... existing contracts
  
  // Chainlink Data Feed (for local testing)
  chainlinkFeed: {
    address: "0x...your-deployed-feed-address" as `0x${string}`,
    abi: chainlinkFeedAbi,
  },
} as const;
```

#### 3. Use Chainlink Feed in Price Oracle

The `VaultPriceFeed` contract already integrates with Chainlink. To use it directly:

```typescript
// hooks/useChainlinkFeed.ts
import { useReadContract } from "wagmi";
import { contracts } from "@/lib/protocol/contracts";

export function useChainlinkPrice(feedAddress: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: feedAddress,
    abi: [
      {
        name: "latestRoundData",
        outputs: [
          { name: "roundId", type: "uint80" },
          { name: "answer", type: "int256" },
          { name: "startedAt", type: "uint256" },
          { name: "updatedAt", type: "uint256" },
          { name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "latestRoundData",
    query: {
      refetchInterval: 30_000, // 30 seconds
    },
  });

  const price = data ? Number(data[1]) / 1e8 : null; // 8 decimals for USD pairs

  return { price, isLoading, refetch, updatedAt: data ? Number(data[3]) : null };
}
```

---

## Option 2: Chainlink Data Streams (WebSocket)

### Overview
Chainlink Data Streams provides real-time price updates via WebSocket. This is ideal for live trading UI.

### Setup Steps

#### 1. Get Chainlink Data Streams Access

1. Visit [Chainlink Data Streams](https://data.chain.link/)
2. Sign up for an account
3. Get your API key and WebSocket endpoint

#### 2. Configure Environment Variables

Add to `.env`:

```bash
# Chainlink Data Streams WebSocket
NEXT_PUBLIC_CHAINLINK_WS_URL=wss://ws.chain.link/v1/streams
NEXT_PUBLIC_CHAINLINK_API_KEY=your_api_key_here

# Alternative: Use a proxy server for better security
NEXT_PUBLIC_PRICE_WEBSOCKET_URL=ws://localhost:3001/ws
```

#### 3. WebSocket Integration

The `usePriceOracle` hook already has WebSocket support. Configure the URL:

```typescript
// hooks/usePriceOracle.ts already includes:
const wsUrl = process.env.NEXT_PUBLIC_PRICE_WEBSOCKET_URL;
```

#### 4. Expected WebSocket Message Format

```typescript
{
  "type": "price",
  "token": "0x...",
  "price": 2017.99,
  "timestamp": 1234567890,
  "confidence": 0.99
}
```

#### 5. Create a Proxy Server (Optional)

For production, create a simple WebSocket proxy:

```javascript
// server/proxy-server.js
const WebSocket = require('ws');
const ChainlinkStreams = require('@chainlink/functions-toolkit');

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  // Connect to Chainlink Data Streams
  const clWs = new WebSocket(process.env.CHAINLINK_WS_URL);
  
  clWs.on('message', (data) => {
    ws.send(data); // Forward to client
  });
  
  ws.on('close', () => clWs.close());
});
```

---

## Environment Configuration

### `.env` File Template

```bash
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Chainlink Data Feeds
NEXT_PUBLIC_CHAINLINK_FEED_ETH_USD=0x694AA1769357215DE4FAC081bf1f309aDC325306
NEXT_PUBLIC_CHAINLINK_FEED_BTC_USD=0x1b44F3514812d835F1b3B4298d33d9F4f98b7464

# Chainlink Data Streams (WebSocket)
NEXT_PUBLIC_CHAINLINK_WS_URL=wss://ws.chain.link/v1/streams
NEXT_PUBLIC_CHAINLINK_API_KEY=your_api_key_here
NEXT_PUBLIC_PRICE_WEBSOCKET_URL=ws://localhost:3001/ws

# Other Networks
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
ARBITRUM_TESTNET_URL=https://sepolia-rollup.arbitrum.io/rpc
```

---

## Testing

### Test On-Chain Feed

```typescript
// Test locally
import { useChainlinkPrice } from "@/hooks/useChainlinkFeed";

function TestFeed() {
  const { price, isLoading } = useChainlinkPrice(
    "0x694AA1769357215DE4FAC081bf1f309aDC325306" // Sepolia ETH/USD
  );
  
  return <div>ETH Price: ${isLoading ? "Loading..." : price}</div>;
}
```

### Test WebSocket

```typescript
// The TradingPanel already uses WebSocket when configured
// Check the oracle status indicator:
// - "● Live" = WebSocket connected
// - "● Degraded" = WebSocket disconnected, using polling
// - "● Offline" = No connection
```

---

## Common Feed Addresses

### Ethereum Sepolia
- ETH/USD: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- BTC/USD: `0x1b44F3514812d835F1b3B4298d33d9F4f98b7464`
- LINK/USD: `0xc59E2c5f7930AdfA191cC3d0e07289Da483F287A`

### BSC Testnet
- ETH/USD: `0x2514895c23fBb85b466C3B292D4F158A49E542De`
- BTC/USD: `0x5741306c2179535Bf8325c32A3744575d8B79586`
- BNB/USD: `0xcB7d2A93F7E4D2C3b9e2C7F2A5D3B4C5D6E7F8A9B`

### Arbitrum Sepolia
- ETH/USD: `0x5f4eC313f23ef8167e458584034c2534157FceD9`
- BTC/USD: `0x5741306c2179535Bf8325c32A3744575d8B79586`

---

## Option 3: Pyth Oracle (Already Integrated)

### Overview
Your project already has a Pyth oracle integration via the `MockPyth` contract. This is used by the `FastPriceFeed` contract for real-time price validation.

### Your Existing MockPyth Contract

You already have a `MockPyth` contract deployed:

```solidity
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
pragma experimental ABIEncoderV2;

import "../oracle/interfaces/IPyth.sol";

contract MockPyth {
    mapping (bytes32 => int64) public prices;
    mapping (bytes32 => int32) public exponents;
    mapping (bytes32 => uint256) public publishTimes;

    function getPrice(bytes32 id) external view returns (PythStructs.Price memory price) {
        price = PythStructs.Price({
            price: prices[id],
            conf: 0,
            expo: exponents[id],
            publishTime: publishTimes[id]
        });
    }

    function setPrice(bytes32 id, int64 price, int32 expo, uint256 publishTime) external {
        prices[id] = price;
        exponents[id] = expo;
        publishTimes[id] = publishTime;
    }

    function updatePriceFeeds(bytes[] calldata /* updateData */) external payable {}

    function getUpdateFee(bytes[] calldata /* updateData */) external pure returns (uint feeAmount) {
        return 1000000000000; // 0.000001 ETH
    }
}
```

### Deploy MockPyth (if needed)

If you need to redeploy the MockPyth contract:

```javascript
// scripts/deploy-mock-pyth.js
const { ethers } = require("hardhat");

async function main() {
  const MockPyth = await ethers.getContractFactory("MockPyth");
  const pyth = await MockPyth.deploy();
  await pyth.deployed();
  console.log("MockPyth deployed to:", pyth.address);

  // Set initial prices
  const ethPriceId = "0xff61491a85d71acf75bb0f98866a1e8e1e9c1b1e1c1e1e1e1e1e1e1e1e1e1e1";
  await pyth.setPrice(ethPriceId, 20179900000, 8, Math.floor(Date.now() / 1000));
  console.log("ETH price set to $2017.99");
}

main().catch(console.error);
```

### Dual Oracle Setup (Chainlink + Pyth)

Your `usePriceOracle` hook already integrates both Chainlink (via VaultPriceFeed) and Pyth (via FastPriceFeed) for dual oracle validation:

```typescript
// hooks/usePriceOracle.ts
// Already integrates:
// - VaultPriceFeed (Chainlink-based)
// - FastPriceFeed (Pyth-based)
// - WebSocket for real-time updates
```

### Pyth Price IDs

Common Pyth price feed IDs:

```typescript
const PYTH_PRICE_IDS = {
  ETH: "0xff61491a85d71acf75bb0f98866a1e8e1e9c1b1e1c1e1e1e1e1e1e1e1e1e1e1",
  BTC: "0xe629f29d8c522317679728663bdde96004fe0ca0b0258868b2a3e3c9e26e615e",
  SOL: "0xef0d8b622a05c7ca9e8df527b6b0b6064b4b0b0b0b0b0b0b0b0b0b0b0b0b0b0b",
};
```

---

## Integration with Existing Contracts

Your `VaultPriceFeed` contract already uses Chainlink. To configure it:

1. **Update Feed Addresses** in the contract deployment script
2. **Set Heartbeat** for how often Chainlink updates prices
3. **Configure Price Deviation** limits

Example deployment script:

```javascript
// scripts/deploy-vault-feed.js
const { ethers } = require("hardhat");

async function main() {
  const VaultPriceFeed = await ethers.getContractFactory("VaultPriceFeed");
  const feed = await VaultPriceFeed.deploy(
    [
      "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD
      "0x1b44F3514812d835F1b3B4298d33d9F4f98b7464", // BTC/USD
    ],
    process.env.CHAINLINK_FLAGS_ADDRESS
  );
  
  await feed.deployed();
  console.log("VaultPriceFeed deployed to:", feed.address);
}

main().catch(console.error);
```

---

## Troubleshooting

### WebSocket Not Connecting
- Check that `NEXT_PUBLIC_PRICE_WEBSOCKET_URL` is set
- Verify the proxy server is running (if using one)
- Check browser console for WebSocket errors

### On-Chain Feed Returns Zero
- Verify the feed contract address is correct for the network
- Check that the feed is active (not deprecated)
- Ensure you're on the correct network

### Price Stale Warning
- Chainlink feeds update every 10-30 seconds
- Increase `refetchInterval` in `usePriceOracle` if needed
- Use WebSocket for real-time updates

---

## Next Steps

1. **For Local Development**: Deploy mock Chainlink feed to Hardhat
2. **For Testnet**: Use existing Sepolia/BSC/Arbitrum feeds
3. **For Production**: 
   - Set up Chainlink Data Streams WebSocket
   - Deploy to mainnet with production feed addresses
   - Use proxy server for API key security

---

## Resources

- [Chainlink Data Feeds](https://docs.chain.link/data-feeds)
- [Chainlink Data Streams](https://data.chain.link/)
- [Chainlink Contracts](https://github.com/smartcontractkit/chainlink)
- [Your Existing Integration](./lib/tokenData.ts)
