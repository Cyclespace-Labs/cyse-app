/* Auto-extracted from artifacts/contracts/peripherals/EsCyseBatchSender.sol/EsCyseBatchSender.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const esCyseBatchSenderAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_esCyse",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
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
    "name": "esCyse",
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
        "internalType": "contract IVester",
        "name": "_vester",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_minRatio",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "_accounts",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_amounts",
        "type": "uint256[]"
      }
    ],
    "name": "send",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
