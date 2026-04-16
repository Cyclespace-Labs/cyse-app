/* Auto-extracted from artifacts/contracts/amm/UniPool.sol/UniPool.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const uniPoolAbi = [
  {
    "inputs": [
      {
        "internalType": "int24",
        "name": "_tickSpacing",
        "type": "int24"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "getLiquidity",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "",
        "type": "uint128"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32[]",
        "name": "",
        "type": "uint32[]"
      }
    ],
    "name": "observe",
    "outputs": [
      {
        "internalType": "int56[]",
        "name": "tickCumulatives",
        "type": "int56[]"
      },
      {
        "internalType": "uint160[]",
        "name": "secondsPerLiquidityCumulativeX128s",
        "type": "uint160[]"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      {
        "internalType": "uint160",
        "name": "sqrtPriceX96",
        "type": "uint160"
      },
      {
        "internalType": "int24",
        "name": "tick",
        "type": "int24"
      },
      {
        "internalType": "uint16",
        "name": "protocolFee",
        "type": "uint16"
      },
      {
        "internalType": "uint24",
        "name": "lpFee",
        "type": "uint24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tickSpacing",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tickSpacingValue",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
