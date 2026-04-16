/* Auto-extracted from artifacts/contracts/peripherals/ShortsTrackerTimelock.sol/ShortsTrackerTimelock.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const shortsTrackerTimelockAbi = [
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
        "internalType": "uint256",
        "name": "_averagePriceUpdateDelay",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxAveragePriceChange",
        "type": "uint256"
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
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldAveragePrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newAveragePrice",
        "type": "uint256"
      }
    ],
    "name": "GlobalShortAveragePriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "admin",
        "type": "address"
      }
    ],
    "name": "SetAdmin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "averagePriceUpdateDelay",
        "type": "uint256"
      }
    ],
    "name": "SetAveragePriceUpdateDelay",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "handler",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isHandler",
        "type": "bool"
      }
    ],
    "name": "SetContractHandler",
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
      }
    ],
    "name": "SetGov",
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
        "internalType": "bool",
        "name": "isGlobalShortDataReady",
        "type": "bool"
      }
    ],
    "name": "SetIsGlobalShortDataReady",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxAveragePriceChange",
        "type": "uint256"
      }
    ],
    "name": "SetMaxAveragePriceChange",
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
        "name": "admin",
        "type": "address"
      }
    ],
    "name": "SignalSetAdmin",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "averagePriceUpdateDelay",
        "type": "uint256"
      }
    ],
    "name": "SignalSetAveragePriceUpdateDelay",
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
        "name": "target",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "handler",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "action",
        "type": "bytes32"
      }
    ],
    "name": "SignalSetHandler",
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
        "internalType": "bool",
        "name": "isGlobalShortDataReady",
        "type": "bool"
      }
    ],
    "name": "SignalSetIsGlobalShortDataReady",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "maxAveragePriceChange",
        "type": "uint256"
      }
    ],
    "name": "SignalSetMaxAveragePriceChange",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BASIS_POINTS_DIVISOR",
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
    "inputs": [],
    "name": "averagePriceUpdateDelay",
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
        "internalType": "contract IShortsTracker",
        "name": "_shortsTracker",
        "type": "address"
      }
    ],
    "name": "disableIsGlobalShortDataReady",
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
    "name": "lastUpdated",
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
    "inputs": [],
    "name": "maxAveragePriceChange",
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
        "name": "_averagePriceUpdateDelay",
        "type": "uint256"
      }
    ],
    "name": "setAveragePriceUpdateDelay",
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
        "internalType": "contract IShortsTracker",
        "name": "_shortsTracker",
        "type": "address"
      },
      {
        "internalType": "address[]",
        "name": "_tokens",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_averagePrices",
        "type": "uint256[]"
      }
    ],
    "name": "setGlobalShortAveragePrices",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_shortsTracker",
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
        "name": "_target",
        "type": "address"
      },
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
    "name": "setHandler",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IShortsTracker",
        "name": "_shortsTracker",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_value",
        "type": "bool"
      }
    ],
    "name": "setIsGlobalShortDataReady",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_maxAveragePriceChange",
        "type": "uint256"
      }
    ],
    "name": "setMaxAveragePriceChange",
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
    "name": "signalSetAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_averagePriceUpdateDelay",
        "type": "uint256"
      }
    ],
    "name": "signalSetAveragePriceUpdateDelay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_shortsTracker",
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
        "name": "_target",
        "type": "address"
      },
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
    "name": "signalSetHandler",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IShortsTracker",
        "name": "_shortsTracker",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_value",
        "type": "bool"
      }
    ],
    "name": "signalSetIsGlobalShortDataReady",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_maxAveragePriceChange",
        "type": "uint256"
      }
    ],
    "name": "signalSetMaxAveragePriceChange",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
