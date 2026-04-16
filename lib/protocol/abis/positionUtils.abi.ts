/* Auto-extracted from artifacts/contracts/position/PositionUtils.sol/PositionUtils.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const positionUtilsAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "collateralDelta",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "prevLeverage",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nextLeverage",
        "type": "uint256"
      }
    ],
    "name": "LeverageDecreased",
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
  }
] as const;
