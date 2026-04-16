/* Auto-extracted from artifacts/contracts/peripherals/BalanceUpdater.sol/BalanceUpdater.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const balanceUpdaterAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_usdg",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_usdgAmount",
        "type": "uint256"
      }
    ],
    "name": "updateBalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
