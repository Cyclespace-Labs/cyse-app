/* Auto-extracted from artifacts/contracts/peripherals/PositionRouterReader.sol/PositionRouterReader.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const positionRouterReaderAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_positionRouter",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_endIndex",
        "type": "uint256"
      }
    ],
    "name": "getTransferTokenOfIncreasePositionRequests",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
