/* Auto-extracted from artifacts/contracts/staking/RewardRouterV2.sol/RewardRouterV2.json */
/* Do not edit manually — re-run scripts/extract-abis.mjs */

export const rewardRouterAbi = [
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "StakeCylp",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "StakeCyse",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "UnstakeCylp",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "UnstakeCyse",
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
    "name": "acceptGov",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_sender",
        "type": "address"
      }
    ],
    "name": "acceptTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_accounts",
        "type": "address[]"
      }
    ],
    "name": "batchCompoundForAccounts",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "_accounts",
        "type": "address[]"
      }
    ],
    "name": "batchRestakeForAccounts",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
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
    "name": "batchStakeCyseForAccounts",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bnCyse",
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
    "name": "bonusCyseTracker",
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
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimEsCyse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "compound",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cylp",
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
    "name": "cylpManager",
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
    "name": "cylpVester",
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
    "name": "cyse",
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
    "name": "cyseVester",
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
    "inputs": [],
    "name": "extendedCyseTracker",
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
    "name": "externalHandler",
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
    "name": "feeCylpTracker",
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
    "name": "feeCyseTracker",
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
    "name": "govToken",
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
        "internalType": "bool",
        "name": "_shouldClaimCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldStakeCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldClaimEsCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldStakeEsCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldStakeMultiplierPoints",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldClaimWeth",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldConvertWethToEth",
        "type": "bool"
      }
    ],
    "name": "handleRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_cyseReceiver",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "_shouldClaimCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldStakeCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldClaimEsCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldStakeEsCyse",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldStakeMultiplierPoints",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldClaimWeth",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_shouldConvertWethToEth",
        "type": "bool"
      }
    ],
    "name": "handleRewardsV2",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "inRestakingMode",
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
    "inputs": [],
    "name": "inStrictTransferMode",
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
        "components": [
          {
            "internalType": "address",
            "name": "weth",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "cyse",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "esCyse",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "bnCyse",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "cylp",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "stakedCyseTracker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "bonusCyseTracker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "extendedCyseTracker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "feeCyseTracker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "feeCylpTracker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "stakedCylpTracker",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "cylpManager",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "cyseVester",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "cylpVester",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "externalHandler",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "govToken",
            "type": "address"
          }
        ],
        "internalType": "struct RewardRouterV2.InitializeParams",
        "name": "_initializeParams",
        "type": "tuple"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isInitialized",
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
        "internalType": "address[]",
        "name": "externalCallTargets",
        "type": "address[]"
      },
      {
        "internalType": "bytes[]",
        "name": "externalCallDataList",
        "type": "bytes[]"
      },
      {
        "internalType": "address[]",
        "name": "refundTokens",
        "type": "address[]"
      },
      {
        "internalType": "address[]",
        "name": "refundReceivers",
        "type": "address[]"
      }
    ],
    "name": "makeExternalCalls",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxBoostBasisPoints",
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
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minUsdg",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minCylp",
        "type": "uint256"
      }
    ],
    "name": "mintAndStakeCylp",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_minUsdg",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minCylp",
        "type": "uint256"
      }
    ],
    "name": "mintAndStakeCylpETH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "data",
        "type": "bytes[]"
      }
    ],
    "name": "multicall",
    "outputs": [
      {
        "internalType": "bytes[]",
        "name": "results",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "nonpayable",
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
        "name": "",
        "type": "address"
      }
    ],
    "name": "pendingReceivers",
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
        "name": "_govToken",
        "type": "address"
      }
    ],
    "name": "setGovToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_inRestakingMode",
        "type": "bool"
      }
    ],
    "name": "setInRestakingMode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_inStrictTransferMode",
        "type": "bool"
      }
    ],
    "name": "setInStrictTransferMode",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_maxBoostBasisPoints",
        "type": "uint256"
      }
    ],
    "name": "setMaxBoostBasisPoints",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum RewardRouterV2.VotingPowerType",
        "name": "_votingPowerType",
        "type": "uint8"
      }
    ],
    "name": "setVotingPowerType",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_receiver",
        "type": "address"
      }
    ],
    "name": "signalTransfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "stakeCyse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "stakeEsCyse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakedCylpTracker",
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
    "name": "stakedCyseTracker",
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
        "name": "_tokenOut",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_cylpAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minOut",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_receiver",
        "type": "address"
      }
    ],
    "name": "unstakeAndRedeemCylp",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_cylpAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minOut",
        "type": "uint256"
      },
      {
        "internalType": "address payable",
        "name": "_receiver",
        "type": "address"
      }
    ],
    "name": "unstakeAndRedeemCylpETH",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "unstakeCyse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "unstakeEsCyse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "votingPowerType",
    "outputs": [
      {
        "internalType": "enum RewardRouterV2.VotingPowerType",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "weth",
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
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;
