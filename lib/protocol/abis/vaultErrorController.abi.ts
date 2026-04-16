/* Auto-extracted from artifacts/contracts/vault/VaultErrorController.sol/VaultErrorController.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const vaultErrorControllerAbi = [
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
        "internalType": "contract IVault",
        "name": "_vault",
        "type": "address"
      },
      {
        "internalType": "string[]",
        "name": "_errors",
        "type": "string[]"
      }
    ],
    "name": "setErrors",
    "outputs": [],
    "stateMutability": "nonpayable",
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
  }
] as const;
