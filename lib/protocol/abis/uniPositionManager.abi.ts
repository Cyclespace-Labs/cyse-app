/* Auto-extracted from artifacts/contracts/amm/UniNftManager.sol/UniPositionManager.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const uniPositionManagerAbi = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint128",
            "name": "amount0Max",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "amount1Max",
            "type": "uint128"
          }
        ],
        "internalType": "struct UniPositionManager.CollectParams",
        "name": "",
        "type": "tuple"
      }
    ],
    "name": "collect",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amount0",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount1",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
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
            "internalType": "struct UniPositionManager.PoolKey",
            "name": "poolKey",
            "type": "tuple"
          },
          {
            "internalType": "int24",
            "name": "tickLower",
            "type": "int24"
          },
          {
            "internalType": "int24",
            "name": "tickUpper",
            "type": "int24"
          },
          {
            "internalType": "uint256",
            "name": "amount0Desired",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1Desired",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount0Min",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount1Min",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
          }
        ],
        "internalType": "struct UniPositionManager.MintParams",
        "name": "",
        "type": "tuple"
      }
    ],
    "name": "mint",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint128",
        "name": "liquidity",
        "type": "uint128"
      },
      {
        "internalType": "uint256",
        "name": "amount0",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount1",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextTokenId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "positions",
    "outputs": [
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
        "internalType": "struct UniPositionManager.PoolKey",
        "name": "poolKey",
        "type": "tuple"
      },
      {
        "internalType": "int24",
        "name": "tickLower",
        "type": "int24"
      },
      {
        "internalType": "int24",
        "name": "tickUpper",
        "type": "int24"
      },
      {
        "internalType": "uint128",
        "name": "liquidity",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
