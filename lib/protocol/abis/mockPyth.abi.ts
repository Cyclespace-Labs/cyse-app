/* Auto-extracted from artifacts/contracts/mock/MockPyth.sol/MockPyth.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const mockPythAbi = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "exponents",
    "outputs": [
      {
        "internalType": "int32",
        "name": "",
        "type": "int32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "id",
        "type": "bytes32"
      }
    ],
    "name": "getPrice",
    "outputs": [
      {
        "components": [
          {
            "internalType": "int64",
            "name": "price",
            "type": "int64"
          },
          {
            "internalType": "uint64",
            "name": "conf",
            "type": "uint64"
          },
          {
            "internalType": "int32",
            "name": "expo",
            "type": "int32"
          },
          {
            "internalType": "uint256",
            "name": "publishTime",
            "type": "uint256"
          }
        ],
        "internalType": "struct PythStructs.Price",
        "name": "price",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "",
        "type": "bytes[]"
      }
    ],
    "name": "getUpdateFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "feeAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
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
    "name": "prices",
    "outputs": [
      {
        "internalType": "int64",
        "name": "",
        "type": "int64"
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
    "name": "publishTimes",
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
        "name": "id",
        "type": "bytes32"
      },
      {
        "internalType": "int64",
        "name": "price",
        "type": "int64"
      },
      {
        "internalType": "int32",
        "name": "expo",
        "type": "int32"
      },
      {
        "internalType": "uint256",
        "name": "publishTime",
        "type": "uint256"
      }
    ],
    "name": "setPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "",
        "type": "bytes[]"
      }
    ],
    "name": "updatePriceFeeds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;
