/* Auto-extracted from artifacts/contracts/amm/UniFactory.sol/UniPoolManager.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const uniPoolManagerAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint24",
        "name": "",
        "type": "uint24"
      }
    ],
    "name": "getPoolId",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "poolId",
        "type": "bytes32"
      }
    ],
    "name": "getSlot0",
    "outputs": [
      {
        "components": [
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
        "internalType": "struct UniPoolManager.Slot0",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "currency0",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "currency1",
            "type": "address"
          },
          {
            "internalType": "uint24",
            "name": "fee",
            "type": "uint24"
          },
          {
            "internalType": "int24",
            "name": "tickSpacing",
            "type": "int24"
          },
          {
            "internalType": "address",
            "name": "hooks",
            "type": "address"
          }
        ],
        "internalType": "struct UniPoolManager.PoolKey",
        "name": "key",
        "type": "tuple"
      },
      {
        "internalType": "uint160",
        "name": "sqrtPriceX96",
        "type": "uint160"
      }
    ],
    "name": "initialize",
    "outputs": [
      {
        "internalType": "int24",
        "name": "tick",
        "type": "int24"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "pools",
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
  }
] as const;
