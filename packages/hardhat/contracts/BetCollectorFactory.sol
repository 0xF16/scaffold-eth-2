//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./BetCollector.sol";

contract BetCollectorFactory is Ownable {
  event NewClone(address cloneAddress);

  address betCollectorAddress;
  address[] public clones;
  uint256 public commissionForNew;

  address internal oracleFeed;

  constructor(address _addr, uint256 _commissionForNew, address _oracleFeed) {
    betCollectorAddress = _addr;
    commissionForNew = _commissionForNew;
    oracleFeed = _oracleFeed;
  }

  function getClonesLength() public view returns (uint256) {
    return clones.length;
  }

  function clone(int256 _priceThreshold, uint256 _timeFinishAcceptingBets, uint256 _timePriceUnveil) public {
    address newClone = Clones.clone(betCollectorAddress);
    BetCollector betCollector = BetCollector(newClone);
    betCollector.initialize(_priceThreshold, oracleFeed, _timeFinishAcceptingBets, _timePriceUnveil, commissionForNew);
    clones.push(newClone);
    emit NewClone(newClone);
  }

  function setNewCommission(uint256 _commissionForNew) public onlyOwner {
    commissionForNew = _commissionForNew;
  }
}
