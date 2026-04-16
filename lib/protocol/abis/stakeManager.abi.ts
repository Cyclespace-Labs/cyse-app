/* Auto-extracted from artifacts/contracts/staking/StakeManager.sol/StakeManager.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const stakeManagerAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "prevGov",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newGov",
        "type": "address"
      }
    ],
    "name": "SetGov",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "acceptGov",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gov",
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
    "name": "pendingGov",
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
        "name": "_rewardTracker",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_account",
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
    "name": "stakeForAccount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
