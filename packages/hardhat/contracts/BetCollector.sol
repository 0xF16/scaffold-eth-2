//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract BetCollector {
  AggregatorV3Interface internal priceFeed;

  error BetsImmutable();
  error WinnerNotKnown();
  error WinnerAlreadyKnown();
  error AddressNotInWinningPool();
  error AddressNotPlaying();
  error AddressAlreadyClaimed();
  error ErrorWithPayment();
  error AddressAlreadyPlacedBet();

  uint256 timeFinishAcceptingBets;
  uint256 timePriceUnveil;
  uint256 public priceThreshold;
  // address oracleFeed;
  uint256 public commission = 10; //percent

  address[] lowerBet;
  address[] greaterOrEqualBet;

  bool public greaterOrEqualWon;
  bool public winnerKnown;

  //wariables used to monitor how much reward pools and how much is left in the pool
  uint256 public lowerPool;
  uint256 public upperPool;

  //populated after a we know a winner (helpers to calculate the rewards)
  uint256 lowerPoolMax;
  uint256 upperPoolMax;

  struct Bet {
    uint256 moneyBet;
    bool moreOrEqual;
    bool active;
    bool prizePaid;
  }

  mapping(address => Bet) public bets;
  address[] betOwners;

  mapping(address => bool) public paidOut;

  modifier beforBettingDeadline() {
    if (block.timestamp > timeFinishAcceptingBets) revert BetsImmutable();
    _;
  }

  constructor(
    // uint256 _timeFinishAcceptingBets,
    // uint256 _timePriceUnveil,
    uint256 _priceThreshold /*, address _oracleFeed*/
  ) {
    // timeFinishAcceptingBets = _timeFinishAcceptingBets;
    // timePriceUnveil = _timePriceUnveil;
    priceThreshold = _priceThreshold;
    // oracleFeed = _oracleFeed;
  }

  function createBet(bool _greaterOrEqual) public payable {
    if (bets[msg.sender].active == true) revert AddressAlreadyPlacedBet();
    uint256 poolIncrease = (msg.value * (100 - commission) * 100) / 10_000; //we multiply by 100 because we want to operate on bips
    if (_greaterOrEqual) {
      greaterOrEqualBet.push(msg.sender);
      upperPool += poolIncrease;
    } else {
      lowerBet.push(msg.sender);
      lowerPool += poolIncrease;
    }
    bets[msg.sender] = Bet(poolIncrease, _greaterOrEqual, true, false);
  }

  //TODO: constrain so it could be called after specific time
  function findWinner(uint256 currentPrice) public {
    if (winnerKnown == true) revert WinnerAlreadyKnown();
    if (currentPrice >= priceThreshold) {
      greaterOrEqualWon = true;
    }
    winnerKnown = true;

    lowerPoolMax = lowerPool;
    upperPoolMax = upperPool;
  }

  function withdrawPrize() public {
    if (winnerKnown == false) revert WinnerNotKnown();
    if (
      (greaterOrEqualWon == false && bets[msg.sender].moreOrEqual == true) ||
      (greaterOrEqualWon == true && bets[msg.sender].moreOrEqual == false)
    ) revert AddressNotInWinningPool();
    if (bets[msg.sender].prizePaid == true) revert AddressAlreadyClaimed();

    (bool success, ) = msg.sender.call{value: calculateCut(msg.sender)}("");
    if (success == false) revert ErrorWithPayment();
  }

  function poolSize() public view returns (uint256) {
    return lowerPool + upperPool;
  }

  function calculateCut(address addr) public view returns (uint256) {
    if (bets[addr].moreOrEqual == true) {
      return ((((bets[addr].moneyBet * 100) / upperPoolMax) * poolSize()) / 100);
    } else if (bets[addr].moreOrEqual == false) {
      return ((((bets[addr].moneyBet * 100) / lowerPoolMax) * poolSize()) / 100);
    }
    revert AddressNotPlaying();
  }
}
