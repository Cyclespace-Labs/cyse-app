/* Auto-extracted from artifacts/contracts/peripherals/VaultReader.sol/VaultReader.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const vaultReaderAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_positionManager",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_weth",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_usdgAmount",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "_tokens",
        "type": "address[]"
      }
    ],
    "name": "getVaultTokenInfoV3",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_positionManager",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_weth",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_usdgAmount",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "_tokens",
        "type": "address[]"
      }
    ],
    "name": "getVaultTokenInfoV4",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
