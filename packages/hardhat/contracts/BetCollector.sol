//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

contract BetCollector {
  AggregatorV3Interface internal priceFeed;

  error AlreadyInitialized();
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
  uint256 public commission;
  bool initialized;

  bool public winnerUpperBound;
  bool public winnerKnown;

  //wariables used to monitor how much reward pools and how much is left in the pool
  uint256 public poolLower;
  uint256 public poolUpper;

  struct Bet {
    uint256 moneyBet;
    bool moreOrEqual;
    bool active;
    bool prizePaid;
  }

  mapping(address => Bet) public bets;

  modifier beforBettingDeadline() {
    if (block.timestamp > timeFinishAcceptingBets) revert BetsImmutable();
    _;
  }

  // constructor() // uint256 _timeFinishAcceptingBets,
  // // uint256 _timePriceUnveil,
  // // uint256 _priceThreshold /*, address _oracleFeed*/
  // {
  // timeFinishAcceptingBets = _timeFinishAcceptingBets;
  // timePriceUnveil = _timePriceUnveil;
  // priceThreshold = _priceThreshold;
  // oracleFeed = _oracleFeed;
  // }

  function initialize(uint256 _priceThreshold) public {
    if (initialized) revert AlreadyInitialized();
    priceThreshold = _priceThreshold;
    initialized = true;
    commission = 10; //percent
  }

  function createBet(bool _greaterOrEqual) public payable {
    if (bets[msg.sender].active == true) revert AddressAlreadyPlacedBet();
    if (_greaterOrEqual) {
      poolUpper += msg.value;
    } else {
      poolLower += msg.value;
    }
    bets[msg.sender] = Bet(msg.value, _greaterOrEqual, true, false);
  }

  //TODO: constrain so it could be called after specific time
  function findWinner(uint256 currentPrice) public {
    if (winnerKnown == true) revert WinnerAlreadyKnown();
    if (currentPrice >= priceThreshold) {
      winnerUpperBound = true;
    }
    winnerKnown = true;
  }

  function withdrawPrize() public {
    if (winnerKnown == false) revert WinnerNotKnown();
    if (
      (winnerUpperBound == false && bets[msg.sender].moreOrEqual == true) ||
      (winnerUpperBound == true && bets[msg.sender].moreOrEqual == false)
    ) revert AddressNotInWinningPool();
    if (bets[msg.sender].prizePaid == true) revert AddressAlreadyClaimed();

    (bool success, ) = msg.sender.call{value: calculatePayout(msg.sender)}("");
    if (success == false) revert ErrorWithPayment();
  }

  function poolSize() public view returns (uint256) {
    return poolLower + poolUpper;
  }

  function calculatePayout(address addr) public view returns (uint256) {
    if (bets[addr].moreOrEqual == true) {
      return ((poolSize() * ((bets[addr].moneyBet * 100) / poolUpper)) * ((100 - commission))) / 10_000;
    } else if (bets[addr].moreOrEqual == false) {
      return ((poolSize() * ((bets[addr].moneyBet * 100) / poolLower)) * ((100 - commission))) / 10_000;
    }
    revert AddressNotPlaying();
  }
}
