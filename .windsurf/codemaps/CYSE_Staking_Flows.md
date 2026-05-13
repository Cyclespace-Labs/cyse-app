# CYSE Staking — Key Flows (Contract Traces)
> Companion to CYSE_Staking_Contracts.md · 2026-05-13

## Flow 1: Stake CYSE (4-tier chain)
```
stakeCyse(amount)
  → _stakeCyse(msg.sender, msg.sender, cyse, amount)  [line 489]
    → stakedCyseTracker.stakeForAccount(funder, account, cyse, amount)
      → RewardTracker._stake: transferFrom CYSE → updateRewards → stakedAmounts+=amount → mint receipt
    → bonusCyseTracker.stakeForAccount(account, account, stakedCyseTracker, amount)
      → stakes stakedCyseTracker receipt tokens
    → extendedCyseTracker.stakeForAccount(account, account, bonusCyseTracker, amount)
      → stakes bonusCyseTracker receipt tokens
    → feeCyseTracker.stakeForAccount(account, account, extendedCyseTracker, amount)
      → stakes extendedCyseTracker receipt tokens
    → _syncVotingPower(account)
```
**Frontend needs:** approve CYSE to stakedCyseTracker, then call stakeCyse(amount)

## Flow 2: Unstake CYSE (reverse + bnCYSE burn)
```
unstakeCyse(amount)
  → _restakeForAccount(msg.sender)  [line 624]
    → if inRestakingMode: migrate bonusCyseTracker from feeCyseTracker → extendedCyseTracker
  → _unstakeCyse(msg.sender, cyse, amount, true)  [line 537]
    → feeCyseTracker.unstakeForAccount(account, extendedCyseTracker, amount, account)
    → extendedCyseTracker.unstakeForAccount(account, bonusCyseTracker, amount, account)
    → bonusCyseTracker.unstakeForAccount(account, stakedCyseTracker, amount, account)
    → stakedCyseTracker.unstakeForAccount(account, cyse, amount, account)
      → RewardTracker._unstake: updateRewards → stakedAmounts-=amount → burn receipt → transfer CYSE back
    → if reduceBnCyse:
      → claim bnCYSE from bonusCyseTracker
      → burn proportional staked bnCYSE: stakedBnCyse × amount / balance
      → burn proportional wallet bnCYSE: bnCyseBalance × amount / balance
    → _syncVotingPower(account)
```
**Frontend needs:** call unstakeCyse(amount), no approval needed

## Flow 3: Add CYLP Liquidity (ETH path)
```
mintAndStakeCylpETH(minUsdg, minCylp) {value: eth}
  → WETH.deposit(eth)
  → WETH.approve(cylpManager, eth)
  → _mintAndStakeCylp(this, weth, eth, minUsdg, minCylp)  [line 606]
    → CylpManager.addLiquidityForAccount(this, user, weth, eth, minUsdg, minCylp)
      → Vault.buyUSDG(weth, eth) → mint USDG
      → calculate CYLP share → mint CYLP to user
    → feeCylpTracker.stakeForAccount(user, user, cylp, cylpAmount)
    → stakedCylpTracker.stakeForAccount(user, user, feeCylpTracker, cylpAmount)
```
**Frontend needs:** send ETH, no pre-approval (router handles WETH approval)

## Flow 4: Add CYLP Liquidity (ERC-20 path)
```
mintAndStakeCylp(token, amount, minUsdg, minCylp)
  → _mintAndStakeCylp(msg.sender, token, amount, minUsdg, minCylp)  [line 606]
    → CylpManager.addLiquidityForAccount(user, user, token, amount, minUsdg, minCylp)
      → IERC20(token).safeTransferFrom(user, cylpManager, amount)
      → Vault.buyUSDG(token, amount) → mint USDG
      → calculate CYLP share → mint CYLP to user
    → feeCylpTracker.stakeForAccount(user, user, cylp, cylpAmount)
    → stakedCylpTracker.stakeForAccount(user, user, feeCylpTracker, cylpAmount)
```
**Frontend needs:** approve token to CylpManager, then call mintAndStakeCylp

## Flow 5: Remove CYLP Liquidity (ETH path)
```
unstakeAndRedeemCylpETH(cylpAmount, minOut, receiver)
  → _unstakeAndRedeemCylp(weth, cylpAmount, minOut, this)  [line 614]
    → stakedCylpTracker.unstakeForAccount(user, feeCylpTracker, cylpAmount, user)
    → feeCylpTracker.unstakeForAccount(user, cylp, cylpAmount, user)
    → CylpManager.removeLiquidityForAccount(user, weth, cylpAmount, minOut, this)
      → Vault.sellUSDG(weth, usdgAmount) → withdraw WETH
      → burn CYLP
    → WETH.withdraw(amountOut)
    → receiver.sendValue(amountOut)
```
**Frontend needs:** call unstakeAndRedeemCylpETH, no approval needed

## Flow 6: Compound
```
compound()
  → _compound(msg.sender)  [line 471]
    → _claimCyseFees(account, account)
      → extendedCyseTracker.claimForAccount(account, account) → returns CYSE
    → if CYSE > 0: _stakeCyse(account, account, cyse, cyseAmount)
    → _claim(stakedCyseTracker, stakedCylpTracker, account, account) → returns esCYSE
    → if esCYSE > 0: _stakeCyse(account, account, esCyse, esCyseAmount)
    → _restakeForAccount(account)  [migrate bonusCyseTracker if inRestakingMode]
    → _stakeBnCyse(account)  [stake bnCYSE up to boost cap]
    → _syncVotingPower(account)
```
**Frontend needs:** call compound(), no approval needed

## Flow 7: handleRewards (Flexible Claim/Stake)
```
handleRewards(claimCYSE, stakeCYSE, claimEsCYSE, stakeEsCYSE, stakeMultiplier, claimWeth, convertWethToEth)
  [line 279]
  → if claimCYSE:
    → _claimVestedCyse(account, account) → CyseVester.claim + CylpVester.claim
    → _claimCyseFees(account, account) → extendedCyseTracker.claim
  → if stakeCYSE && cyseAmount > 0: _stakeCyse(account, account, cyse, cyseAmount)
  → if claimEsCYSE: _claim(stakedCyseTracker, stakedCylpTracker, account, account)
  → if stakeEsCYSE && esCyseAmount > 0: _stakeCyse(account, account, esCyse, esCyseAmount)
  → if stakeMultiplier:
    → _restakeForAccount(account)
    → _stakeBnCyse(account)
  → if claimWeth:
    → if convertWethToEth: claim WETH to router → unwrap → send ETH
    → else: _claim(feeCyseTracker, feeCylpTracker, account, account)
  → _syncVotingPower(account)
```
**Frontend needs:** call handleRewards with 7 bools

## Flow 8: Vester Deposit (esCYSE → CYSE)
```
CyseVester.deposit(amount)
  → _deposit(msg.sender, amount)  [line 299]
    → _updateVesting(account)  [move vested portion to claimable]
    → IERC20(esToken).safeTransferFrom(account, this, amount)
    → _mint(account, amount)  [increase vester balance]
    → if hasPairToken:
      → nextPairAmount = getPairAmount(account, balances[account])
      → if nextPairAmount > current: transferFrom pairToken diff → _mintPair
    → require(getTotalVested <= getMaxVestableAmount)
```
**Frontend needs:** approve esCYSE to CyseVester + approve pairToken (feeCyseTracker) to CyseVester, then call deposit

## Flow 9: Vester Claim
```
CyseVester.claim()
  → _claim(msg.sender, msg.sender)  [line 355]
    → _updateVesting(account)
      → vested = totalVested × timeDiff / vestingDuration
      → burn esCYSE from vester balance → add to cumulativeClaimAmounts
    → amount = claimable(account) = cumulativeClaimAmounts - claimedAmounts
    → claimedAmounts += amount
    → IERC20(claimableToken).safeTransfer(receiver, amount)  [sends CYSE]
```
**Frontend needs:** call claim(), no approval needed

## Flow 10: Vester Withdraw (Cancel Vesting)
```
CyseVester.withdraw()
  → _claim(account, account)  [claim any vested CYSE]
  → if hasPairToken: _burnPair → transfer pairToken back
  → transfer unvested esCYSE back
  → _burn vester balance
  → delete cumulativeClaimAmounts, claimedAmounts, lastVestingTimes
```
**Frontend needs:** call withdraw(), no approval needed

## Flow 11: Account Transfer (Signal + Accept)
```
Sender: signalTransfer(receiver)
  → _validateNotVesting(sender)
  → _validateReceiver(receiver)  [18 zero-history checks]
  → if inStrictTransferMode: require feeCyseTracker allowance >= stakedAmount
  → pendingReceivers[sender] = receiver

Receiver: acceptTransfer(sender)
  → _validateNotVesting(sender)
  → require pendingReceivers[sender] == receiver
  → _validateReceiver(receiver)
  → _compound(sender)  [claim + restake all sender rewards]
  → migrate staked CYSE: unstake sender → stake receiver
  → migrate staked esCYSE: unstake sender → stake receiver
  → migrate staked bnCYSE: acceptTransferRestake
  → transfer esCYSE balance: transferFrom sender → receiver
  → transfer bnCYSE balance: burn sender → mint receiver
  → migrate staked CYLP: acceptTransferRestake
  → CyseVester.transferStakeValues(sender, receiver)
  → CylpVester.transferStakeValues(sender, receiver)
  → _syncVotingPower(sender) + _syncVotingPower(receiver)
```
**Frontend needs:** sender calls signalTransfer(receiver), receiver calls acceptTransfer(sender)

## RewardTracker._updateRewards Detail [line 273]
```
_updateRewards(account)
  → blockReward = distributor.distribute()  [mint new rewards]
  → if supply > 0 && blockReward > 0:
    → cumulativeRewardPerToken += blockReward × PRECISION / supply
  → if account != address(0):
    → accountReward = stakedAmount × (newCPT - previousCPT) / PRECISION
    → claimableReward[account] += accountReward
    → previousCumulatedRewardPerToken[account] = newCPT
    → if claimable > 0 && staked > 0:
      → averageStakedAmounts = weighted average of old avg and current stake
      → cumulativeRewards += accountReward
```

## RewardTracker.claimable Detail [line 163]
```
claimable(account)
  → stakedAmount = stakedAmounts[account]
  → if stakedAmount == 0: return claimableReward[account]
  → pendingRewards = distributor.pendingRewards() × PRECISION
  → nextCPT = cumulativeRewardPerToken + pendingRewards / totalSupply
  → return claimableReward[account] + stakedAmount × (nextCPT - previousCPT) / PRECISION
```

## Vester.getMaxVestableAmount Detail [line 167]
```
getMaxVestableAmount(account)
  → max = transferredCumulativeRewards + bonusRewards
  → if hasRewardTracker: max += rewardTracker.cumulativeRewards(account)
  → if max < cumulativeRewardDeductions: return 0
  → return max - cumulativeRewardDeductions
```
This is the cap on how much esCYSE can be deposited for vesting. It grows as the user earns more esCYSE rewards (cumulativeRewards) and bnCYSE conversions (bonusRewards).
