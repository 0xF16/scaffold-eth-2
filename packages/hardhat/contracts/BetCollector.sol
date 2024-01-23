//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract BetCollector {
  AggregatorV3Interface internal priceFeed;

  event WinnerKnown(bool winnerUpperBound);
  event GameCreated(
    uint256 betId,
    uint256 betCreatedTime,
    uint256 stopAcceptingBetsTime,
    uint256 pickWinnerTime,
    int128 referencePrice
  );
  event BetPlaced(uint256 betId, address player, uint256 moneyBet, bool lowerBoundOrEqual);

  error BetsImmutable();
  error WinnerNotKnown();
  error WinnerAlreadyKnown();
  error AddressNotInWinningPool();
  error AddressNotPlaying();
  error AddressAlreadyClaimed();
  error ErrorWithPayment();
  error AddressAlreadyPlacedBet();
  error WinnerTimeThresholdNotReached();
  error BetCannotBeZero();
  error LowerPoolIsZero();
  error ElementOutOfBond(); //TODO: Make it more meantingful
  error BettingClosed();

  error OracleRoundNotFinished();

  uint16 public commissionReference; //max 65k, increment of 0.0015%

  struct Bet {
    address player;
    uint256 moneyBet;
    bool lowerPoolOrEqual;
    bool prizePaid;
  }

  struct GameConfiguration {
    uint16 commission; //max 65k, increment of 0.0015%
    bool winningSideKnown;
    bool lowerBoundWon;
    int128 referencePrice;
    // time variables
    uint64 betCreatedTime;
    uint64 stopAcceptingBetsTime;
    uint64 pickWinnerTime;
    // prizes
    uint256 prizeBalance;
    uint256 lowerPoolBalance;
    //helpers
    bool active;
  }

  GameConfiguration[] public games;
  // Bet[] public bets; //placed bets one after another
  mapping(bytes32 => Bet) userGameBets; //key = hash of betId and an address, value = index in the participant list

  //TODO: add a variable to store next bet to decide on

  //Contract needs to be deployed per asset that bet's are going to be placed
  constructor(address _oracleFeed) {
    priceFeed = AggregatorV3Interface(_oracleFeed);
    commissionReference = 5;
  }

  function createBet(int128 _referencePrice, uint64 _stopAcceptingBetsTime, uint64 _pickWinnerTime) public {
    games.push(
      GameConfiguration({
        commission: commissionReference,
        referencePrice: _referencePrice,
        betCreatedTime: uint64(block.timestamp),
        stopAcceptingBetsTime: _stopAcceptingBetsTime,
        pickWinnerTime: _pickWinnerTime,
        active: true,
        winningSideKnown: false,
        lowerBoundWon: false,
        prizeBalance: 0,
        lowerPoolBalance: 0
      })
    );
    emit GameCreated(games.length - 1, block.timestamp, _stopAcceptingBetsTime, _pickWinnerTime, _referencePrice);
    //TODO: add it to the right place in the list of those to query for a winner next
  }

  //TODO: add setCommissionReference function

  function placeBet(uint256 _gameId, bool _lowerBoundOrEqual) public payable {
    if (games[_gameId].stopAcceptingBetsTime < block.timestamp) revert BettingClosed();
    if (msg.value == 0) revert BetCannotBeZero();
    Bet memory bet = userGameBets[keccak256(abi.encode(msg.sender, _gameId))]; //generates a bet hash unique per player and a gameId
    if (bet.player != address(0)) revert AddressAlreadyPlacedBet();

    bet = Bet({player: msg.sender, moneyBet: msg.value, lowerPoolOrEqual: _lowerBoundOrEqual, prizePaid: false});
    userGameBets[keccak256(abi.encode(msg.sender, _gameId))] = bet;

    games[_gameId].prizeBalance += msg.value;
    if (_lowerBoundOrEqual == true) games[_gameId].lowerPoolBalance += msg.value;

    emit BetPlaced(_gameId, msg.sender, msg.value, _lowerBoundOrEqual);
  }

  function findWinner(uint256 _gameId) public {
    //TODO: check if reading the variable from betConfigurations each time is better than querying the object
    if (block.timestamp < games[_gameId].pickWinnerTime) revert WinnerTimeThresholdNotReached();
    if (games[_gameId].winningSideKnown == true) revert WinnerAlreadyKnown();
    (, int price, , uint timeStamp, ) = priceFeed.latestRoundData(); //uint80 roundID, int price, uint startedAt, uint timeStamp, uint80 answeredInRound
    if (timeStamp == 0) revert OracleRoundNotFinished(); //what is this for? Is it needed?
    if (price <= games[_gameId].referencePrice) {
      games[_gameId].lowerBoundWon = true;
    }
    games[_gameId].winningSideKnown = true;
    emit WinnerKnown(games[_gameId].lowerBoundWon);
  }

  function withdrawPrize(uint256 _gameId) public {
    if (games[_gameId].winningSideKnown == false) revert WinnerNotKnown();
    Bet memory bet = userGameBets[keccak256(abi.encode(msg.sender, _gameId))];
    if (bet.player == address(0)) revert AddressNotPlaying();
    if (
      (games[_gameId].lowerBoundWon == false && bet.lowerPoolOrEqual == true) ||
      (games[_gameId].lowerBoundWon == true && bet.lowerPoolOrEqual == false)
    ) revert AddressNotInWinningPool();
    if (bet.prizePaid == true) revert AddressAlreadyClaimed();

    (bool success, ) = msg.sender.call{value: calculatePayout(msg.sender, 0)}("");
    if (success == false) revert ErrorWithPayment();
  }

  function poolSize(uint256 _gameId) public view returns (uint256) {
    return games[_gameId].prizeBalance;
  }

  function calculatePayout(address _addr, uint256 _gameId) public view returns (uint256) {
    // console.log(betConfigurations.length);
    if (0 > _gameId || _gameId > games.length - 1) revert ElementOutOfBond(); //TODO: code it better
    Bet memory bet = userGameBets[keccak256(abi.encode(_addr, _gameId))];
    GameConfiguration memory gameParameters = games[_gameId];
    if (bet.player == address(0)) revert AddressNotPlaying();
    if (gameParameters.lowerPoolBalance == 0) revert LowerPoolIsZero(); //TODO: write it better
    if (bet.lowerPoolOrEqual == true) {
      return
        (((poolSize(_gameId) * bet.moneyBet * 100) / gameParameters.lowerPoolBalance) * (100 - commissionReference)) /
        10_000;
    } else {
      return
        (((poolSize(_gameId) * bet.moneyBet * 100) / (poolSize(_gameId) - gameParameters.lowerPoolBalance)) *
          (100 - commissionReference)) / 10_000;
    }
  }

  //TODO: add a function for the owner of the project to withdraw fees
  //TODO: variable fee (closer to the end of bet collection the higher the fee)
  //TODO: send a fee to one address
}
