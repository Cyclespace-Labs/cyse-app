/* Auto-extracted from artifacts/contracts/referrals/ReferralReader.sol/ReferralReader.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const referralReaderAbi = [
  {
    "inputs": [
      {
        "internalType": "contract IReferralStorage",
        "name": "_referralStorage",
        "type": "address"
      },
      {
        "internalType": "bytes32[]",
        "name": "_codes",
        "type": "bytes32[]"
      }
    ],
    "name": "getCodeOwners",
    "outputs": [
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
