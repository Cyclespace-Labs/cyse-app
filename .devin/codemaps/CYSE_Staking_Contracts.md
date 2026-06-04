# CYSE Staking — Architecture & Contracts
> 15 Solidity files · 2026-05-13

## Architecture
```
User → RewardRouterV2
  → 4-Tier CYSE: stakedCyseTracker → bonusCyseTracker → extendedCyseTracker → feeCyseTracker
  → 2-Tier CYLP: feeCylpTracker → stakedCylpTracker
  → CyseVester / CylpVester (esCYSE → CYSE, 1yr linear vest)
```

## Contracts

### RewardRouterV2.sol (712L) — Main Entry Point
- `stakeCyse`(197) / `stakeEsCyse`(201) → `_stakeCyse`(489): 4-tier chain + syncVotingPower
- `unstakeCyse`(205) / `unstakeEsCyse`(211) → `_unstakeCyse`(537): reverse 4-tier + proportional bnCYSE burn
- `mintAndStakeCylp`(217) / `mintAndStakeCylpETH`(227) → `_mintAndStakeCylp`(606): CylpManager.addLiquidity → feeCylpTracker → stakedCylpTracker
- `unstakeAndRedeemCylp`(240) / `unstakeAndRedeemCylpETH`(248) → `_unstakeAndRedeemCylp`(614): reverse 2-tier → CylpManager.removeLiquidity
- `claim`(260): esCYSE + CYSE fees + WETH; `claimEsCyse`(266); `claimFees`(270)
- `compound`(275) → `_compound`(471): claim CYSE fees → stake CYSE → claim esCYSE → stake esCYSE → restake → stakeBnCyse → syncVoting
- `handleRewards`(279): 7 bool flags (claimCYSE, stakeCYSE, claimEsCYSE, stakeEsCYSE, stakeMultiplier, claimWeth, convertWethToEth)
- `handleRewardsV2`(328): like handleRewards + custom CYSE receiver
- `signalTransfer`(387) / `acceptTransfer`(401): compound sender → migrate all positions → sync voting both
- `_stakeBnCyse`(505): capped by `maxBoostBasisPoints × baseStakedAmount`
- `_restakeForAccount`(624): migrate bonusCyseTracker from feeCyseTracker → extendedCyseTracker (handles vester-locked tokens)
- `_syncVotingPower`(572): mint/burn govToken per votingPowerType (None/BaseStaked/BaseAndBonus)
- `_validateReceiver`(675): 18 checks ensuring receiver has zero staking history

### RewardRouter.sol (271L) — V1 Router
- 3-tier CYSE only (no extendedCyseTracker, no vesting, no transfers, no voting)

### RewardTracker.sol (308L) — Staking Ledger (ERC20 receipt tokens)
- `_stake`(238): transferFrom depositToken → updateRewards → increment stakedAmounts + depositBalances → mint receipt
- `_unstake`(253): updateRewards → decrement → burn receipt → transfer depositToken back
- `_updateRewards`(273): distributor.distribute() → update cumulativeRewardPerToken → per-user claimable + averageStakedAmounts
- `claimable`(163): stakedAmount × (pendingRewards/supply) + stored claimable
- `averageStakedAmounts`(300): time-weighted average for vesting (PRECISION = 1e30)

### RewardDistributor.sol (82L) — Linear Reward Stream
- `pendingRewards`(57): `tokensPerInterval × timeDiff`
- `distribute`(66): transfer rewardToken to tracker (capped by balance)
- `setTokensPerInterval`(50): admin-only, triggers tracker.updateRewards first

### BonusDistributor.sol (93L) — bnCYSE Multiplier Stream
- `pendingRewards`(66): `timeDiff × supply × bonusMultiplierBP / 10000 / 365days`
- `distribute`(77): transfer bnCYSE to bonusCyseTracker
- `tokensPerInterval`(61): `supply × multiplier / 10000 / 365days`

### Vester.sol (368L) — esCYSE → CYSE Vesting
- `deposit`(75) → `_deposit`(299): transfer esCYSE → mint vester balance → lock pair tokens → enforce maxVestable cap
- `_updateVesting`(324): vested = `totalVested × timeDiff / vestingDuration` → burn esCYSE → move to cumulativeClaimAmounts
- `claim`(84) → `_claim`(355): updateVesting → transfer claimableToken (CYSE)
- `withdraw`(98): claim + return unvested esCYSE + return pair tokens
- `getMaxVestableAmount`(167): transferredCumulativeRewards + bonusRewards + cumulativeRewards - deductions
- `getPairAmount`(203): `esAmount × combinedAvgStaked / maxVestable`
- `transferStakeValues`(124): migrate staking history between accounts
- Vester tokens are **non-transferrable** (transfer/approve/transferFrom all revert)

### VesterCap.sol (119L) — bnCYSE → esCYSE Conversion
- `_updateBnCyseForAccount`(73): totalBnCYSE = staked + claimable + balance → mint esCYSE = totalBnCYSE / conversionDivisor → increase vester bonusRewards → unstake excess bnCYSE above boost cap

### CylpBalance.sol (68L) — CYLP Transfer Wrapper
- `_transfer`(56): enforces cooldown → unstake from stakedCylpTracker → transfer via feeCylpTracker

### StakedCylp.sol (101L) — Transferable Staked CYLP
- `_transfer`(85): enforces cooldown → unstake sender from both trackers → stake for receiver
- `balanceOf`(68): returns feeCylpTracker.depositBalances (not stakedCylpTracker)

### StakeManager.sol (18L) — Gov-Only Stake Proxy
- `stakeForAccount`: gov-only wrapper for RewardTracker.stakeForAccount

## Interfaces
| Interface | Key Functions |
|---|---|
| IRewardDistributor | rewardToken(), tokensPerInterval(), pendingRewards(), distribute() |
| IRewardTracker | depositBalances(), stakedAmounts(), stakeForAccount(), unstakeForAccount(), claimForAccount(), claimable(), averageStakedAmounts(), cumulativeRewards() |
| IRewardRouterV2 | cylp(), feeCylpTracker(), stakedCylpTracker() |
| IVester | claimForAccount(), claimable(), pairAmounts(), getMaxVestableAmount(), transferStakeValues(), bonusRewards(), transferredAverageStakedAmounts(), transferredCumulativeRewards() |
| IExternalHandler | makeExternalCalls(targets, dataList, refundTokens, refundReceivers) |

## Distributor → Tracker Mapping
| Tracker | Distributor | Reward Token |
|---|---|---|
| stakedCyseTracker | RewardDistributor | esCYSE |
| bonusCyseTracker | BonusDistributor | bnCYSE |
| extendedCyseTracker | RewardDistributor | CYSE (fees) |
| feeCyseTracker | RewardDistributor | WETH |
| stakedCylpTracker | RewardDistributor | esCYSE |
| feeCylpTracker | RewardDistributor | WETH |
