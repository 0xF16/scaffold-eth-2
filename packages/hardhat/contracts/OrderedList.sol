//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

// prevGame - game that comes just before a candidate
// candidateGame - game that we want to add
// nextGame - game that comes just next after a candidate

// using uint32 for indexes, as the number is as big as seconds in ~136 years (potentially, it will never be used up, as this will be per number of active games at a time)

//TODO: use SafeMath libraries

contract OrderedList {
  mapping(uint32 => uint256) public times;
  mapping(uint32 => uint256) public game_index; //pointer to the GameConfiguration index; TODO need to implement
  mapping(uint32 => uint32) _nextGame; //holds the index of a next game
  uint256 public listSize;
  uint32 constant GUARD = 1;

  error NextGameNotInitialized();
  error NextGameAlreadyExisting();
  error GamePlacedAtWrongIndex();
  error WrongParentChild();

  constructor() {
    _nextGame[GUARD] = GUARD;
  }

  function addToQueue(uint32 candidateGame, uint256 time, uint32 nextGame) public {
    // TODO: order of arguments might make contract cheaper
    if (_nextGame[nextGame] == 0) revert NextGameNotInitialized(); // has to already be initialized
    if (_nextGame[candidateGame] != 0) revert NextGameAlreadyExisting(); // it's new, hance it's empty at this stage
    if (_verifyIndex(nextGame, time) == false) revert GamePlacedAtWrongIndex();

    times[candidateGame] = time;

    _nextGame[candidateGame] = _nextGame[nextGame];
    _nextGame[nextGame] = candidateGame;

    listSize++;
  }

  function removeGame(uint32 candidateGame, uint32 nextGame) public {
    if (_nextGame[nextGame] == 0) revert NextGameNotInitialized(); // has to already be initialized
    if (_isPrevGame(nextGame, candidateGame) == false) revert WrongParentChild();
    _nextGame[nextGame] = _nextGame[candidateGame];
    _nextGame[candidateGame] = 0;
    // times[game] = 0; //TODO: Probably to remove
    listSize--;
  }

  function getTop(uint256 k) public view returns (uint256[] memory) {
    require(k <= listSize);
    uint256[] memory gamesList = new uint256[](k);
    uint32 currentGame = _nextGame[GUARD];
    for (uint256 i = 0; i < k; ++i) {
      gamesList[i] = currentGame;
      currentGame = _nextGame[currentGame];
    }
    return gamesList;
  }

  function getTopTimes(uint256 k) public view returns (uint256[] memory) {
    require(k <= listSize);
    uint256[] memory timeList = new uint256[](k);
    uint32 currentGame = _nextGame[GUARD];
    for (uint256 i = 0; i < k; ++i) {
      timeList[i] = times[currentGame];
      currentGame = _nextGame[currentGame];
    }
    return timeList;
  }

  function _verifyIndex(uint32 nextGame, uint256 newTime) internal view returns (bool) {
    return
      (nextGame == GUARD || times[nextGame] <= newTime) &&
      (newTime <= times[_nextGame[nextGame]] || _nextGame[nextGame] == GUARD);
    // (nextGame == GUARD || times[nextGame] >= newTime) &&
    // (candidateGame == GUARD || times[candidateGame] >= newTime) &&
    // ((prevGame == GUARD && listSize <= 3) || times[prevGame] <= newTime);
  }

  function _isPrevGame(uint32 nextGame, uint32 candidateGame) internal view returns (bool) {
    return _nextGame[nextGame] == candidateGame;
  }
}
