//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./BetCollector.sol";

contract BetCollectorFactory {
  event NewClone(address cloneAddress);
  address betCollector;

  address[] public clones;

  constructor(address _addr) {
    betCollector = _addr;
  }

  function getClonesLength() public view returns (uint256) {
    return clones.length;
  }

  function clone() public {
    address newClone = Clones.clone(betCollector);
    clones.push(newClone);
    emit NewClone(newClone);
  }
}
