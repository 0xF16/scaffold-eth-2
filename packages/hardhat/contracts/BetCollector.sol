//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract BetCollector {
  AggregatorV3Interface internal priceFeed;

  error BetsImmutable();
  error WinnerNotKnown();
  error AddressNotInWinningPool();
  error AddressNotPlaying();

  uint256 timeFinishAcceptingBets;
  uint256 timePriceUnveil;
  uint256 priceThreshold;
  // address oracleFeed;
  uint256 commision = (10 * 1e18) / 100; //percent
  uint256 public poolSize;

  address[] lowerBet;
  address[] greaterOrEqualBet;

  bool greaterOrEqualWon;
  bool winnerKnown;

  uint256 lowerPool;
  uint256 upperPool;

  struct Bet {
    uint256 moneyBet;
    bool moreOrEqual;
    bool active;
    // uint256 timeBetPlaced;
    // bool active;
  }

  mapping(address => Bet) public bets;
  address[] betOwners;

  mapping(address => bool) public paidOut;

  modifier beforBettingDeadline() {
    if (block.timestamp > timeFinishAcceptingBets) revert BetsImmutable();
    _;
  }

  constructor(
    uint256 _timeFinishAcceptingBets,
    uint256 _timePriceUnveil,
    uint256 _priceThreshold /*, address _oracleFeed*/
  ) {
    timeFinishAcceptingBets = _timeFinishAcceptingBets;
    timePriceUnveil = _timePriceUnveil;
    priceThreshold = _priceThreshold;
    // oracleFeed = _oracleFeed;
  }

  function createBet(bool _greaterOrEqual) public payable beforBettingDeadline {
    uint256 poolIncrease = (msg.value * 10_000 * 1e18 - commision * 10_000) / 10_000; //we multiply by 10_000 because we want to operate on bips
    if (_greaterOrEqual) {
      greaterOrEqualBet.push(msg.sender);
      upperPool += poolIncrease;
    } else {
      lowerBet.push(msg.sender);
      lowerPool += poolIncrease;
    }
    poolSize += poolIncrease;
    bets[msg.sender] = Bet(poolIncrease, _greaterOrEqual, true);
  }

  function findWinner(uint256 currentPrice) public {
    if (currentPrice >= priceThreshold) {
      greaterOrEqualWon = true;
    }
    winnerKnown = true;
  }

  function withdrawPrize() public {
    if (winnerKnown == false) revert WinnerNotKnown();
    if (
      (greaterOrEqualWon == false && bets[msg.sender].moreOrEqual == true) ||
      (greaterOrEqualWon == true && bets[msg.sender].moreOrEqual == false)
    ) revert AddressNotInWinningPool();
  }
}
