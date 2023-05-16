//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract MockupOracle is AggregatorV3Interface {
  int256 price;
  uint256 startedRoundAt = 1;
  uint256 updatedRoundAt = 1;

  function decimals() external view override returns (uint8) {}

  function description() external view override returns (string memory) {}

  function version() external view override returns (uint256) {}

  function getRoundData(
    uint80 _roundId
  )
    external
    view
    override
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
  {}

  function latestRoundData()
    external
    view
    override
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
  {
    return (uint80(1), price, startedRoundAt, updatedRoundAt, uint80(1));
  }

  function setPrice(int256 _price) public {
    price = _price;
  }

  function updateDates(uint256 _startedAt, uint256 _updatedAt) public {
    startedRoundAt = _startedAt;
    updatedRoundAt = _updatedAt;
  }
}
