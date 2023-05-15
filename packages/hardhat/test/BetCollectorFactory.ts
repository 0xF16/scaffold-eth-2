import { expect } from "chai";
import { ethers } from "hardhat";
import { BetCollector, BetCollectorFactory } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ContractReceipt, ContractTransaction } from "ethers";
import { Address } from "hardhat-deploy/types";

describe("BetCollectorFactory", async () => {
  async function deployTestClone() {
    const betCollectorFactory = await ethers.getContractFactory("BetCollector");
    const betCollector: BetCollector = (await betCollectorFactory.deploy()) as BetCollector;
    await betCollector.deployed();

    const betCollectorCloneFactory = await ethers.getContractFactory("BetCollectorFactory");
    const cloner: BetCollectorFactory = (await betCollectorCloneFactory.deploy(
      betCollector.address,
    )) as BetCollectorFactory;
    await cloner.deployed();

    const clone: ContractTransaction = await cloner.clone();
    const recipt: ContractReceipt = await clone.wait();

    let cloneAddress: Address;
    let cloneInstance: BetCollector;

    if (recipt.events != null) {
      const newClone = recipt.events.find(v => v.event == "NewClone");
      if (newClone && newClone.args) {
        cloneAddress = newClone.args.cloneAddress;
        cloneInstance = await ethers.getContractAt("BetCollector", cloneAddress);
      }
    }

    return { cloneAddress, cloneInstance, cloneFactory: cloner };
  }

  it("Clone", async () => {
    const { cloneInstance } = await loadFixture(deployTestClone);
    expect(await cloneInstance.initialize(2000)).to.not.be.reverted;
  });
});
