/* Auto-extracted from artifacts/contracts/peripherals/PriceFeedTimelock.sol/PriceFeedTimelock.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const priceFeedTimelockAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_admin",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_buffer",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_tokenManager",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "action",
        "type": "bytes32"
      }
    ],
    "name": "ClearAction",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "action",
        "type": "bytes32"
      }
    ],
    "name": "SignalApprove",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "action",
        "type": "bytes32"
      }
    ],
    "name": "SignalPendingAction",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "vaultPriceFeed",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "priceFeed",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "priceDecimals",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isStrictStable",
        "type": "bool"
      }
    ],
    "name": "SignalPriceFeedSetTokenConfig",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "gov",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "action",
        "type": "bytes32"
      }
    ],
    "name": "SignalSetGov",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "fastPriceFeed",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "name": "SignalSetPriceFeedWatcher",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "target",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "action",
        "type": "bytes32"
      }
    ],
    "name": "SignalWithdrawToken",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "MAX_BUFFER",
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
        "internalType": "address",
        "name": "_target",
        "type": "address"
      }
    ],
    "name": "acceptGov",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
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
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buffer",
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
        "internalType": "bytes32",
        "name": "_action",
        "type": "bytes32"
      }
    ],
    "name": "cancelAction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isHandler",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isKeeper",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
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
    "name": "pendingActions",
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
        "internalType": "address",
        "name": "_vaultPriceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_priceDecimals",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isStrictStable",
        "type": "bool"
      }
    ],
    "name": "priceFeedSetTokenConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isAdditive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "_adjustmentBps",
        "type": "uint256"
      }
    ],
    "name": "setAdjustment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_admin",
        "type": "address"
      }
    ],
    "name": "setAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_buffer",
        "type": "uint256"
      }
    ],
    "name": "setBuffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_handler",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "setContractHandler",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_admin",
        "type": "address"
      }
    ],
    "name": "setExternalAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_gov",
        "type": "address"
      }
    ],
    "name": "setGov",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isEnabled",
        "type": "bool"
      }
    ],
    "name": "setIsAmmEnabled",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isEnabled",
        "type": "bool"
      }
    ],
    "name": "setIsSecondaryPriceEnabled",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isSpreadEnabled",
        "type": "bool"
      }
    ],
    "name": "setIsSpreadEnabled",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_keeper",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "setKeeper",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_maxPriceUpdateDelay",
        "type": "uint256"
      }
    ],
    "name": "setMaxPriceUpdateDelay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_maxStrictPriceDeviation",
        "type": "uint256"
      }
    ],
    "name": "setMaxStrictPriceDeviation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_minBlockInterval",
        "type": "uint256"
      }
    ],
    "name": "setMinBlockInterval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_priceDuration",
        "type": "uint256"
      }
    ],
    "name": "setPriceDuration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "setPriceFeedUpdater",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "setPriceFeedWatcher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_priceSampleSpace",
        "type": "uint256"
      }
    ],
    "name": "setPriceSampleSpace",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_spreadBasisPoints",
        "type": "uint256"
      }
    ],
    "name": "setSpreadBasisPoints",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_spreadBasisPointsIfChainError",
        "type": "uint256"
      }
    ],
    "name": "setSpreadBasisPointsIfChainError",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_spreadBasisPointsIfInactive",
        "type": "uint256"
      }
    ],
    "name": "setSpreadBasisPointsIfInactive",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_useV2Pricing",
        "type": "bool"
      }
    ],
    "name": "setUseV2Pricing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "signalApprove",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vaultPriceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_priceFeed",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_priceDecimals",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isStrictStable",
        "type": "bool"
      }
    ],
    "name": "signalPriceFeedSetTokenConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_gov",
        "type": "address"
      }
    ],
    "name": "signalSetGov",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "signalSetPriceFeedUpdater",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fastPriceFeed",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_isActive",
        "type": "bool"
      }
    ],
    "name": "signalSetPriceFeedWatcher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_receiver",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "signalWithdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenManager",
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
        "internalType": "address",
        "name": "_sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "transferIn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_target",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_receiver",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
