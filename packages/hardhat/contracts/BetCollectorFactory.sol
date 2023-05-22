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

  constructor(address _addr, uint256 _commissionForNew) {
    betCollectorAddress = _addr;
    commissionForNew = _commissionForNew;
  }

  function getClonesLength() public view returns (uint256) {
    return clones.length;
  }

  function clone() public {
    address newClone = Clones.clone(betCollectorAddress);
    BetCollector betCollector = BetCollector(newClone);
    betCollector.setCommission(commissionForNew);
    clones.push(newClone);
    emit NewClone(newClone);
  }

  function setNewCommission(uint256 _commissionForNew) public onlyOwner {
    commissionForNew = _commissionForNew;
  }
}
