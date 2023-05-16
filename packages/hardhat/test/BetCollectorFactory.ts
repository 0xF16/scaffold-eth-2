import { expect } from "chai";
import { ethers } from "hardhat";
import { BetCollector, BetCollectorFactory } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
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

    await cloner.clone();

    const cloneAddress: Address = await cloner.clones(0);
    const cloneInstance: BetCollector = await ethers.getContractAt("BetCollector", cloneAddress);

    return { cloneAddress, cloneInstance, cloneFactory: cloner };
  }

  it("Clone", async () => {
    const { cloneInstance } = await loadFixture(deployTestClone);
    expect(await cloneInstance.initialize(2000)).to.not.be.reverted;
  });
  it("Clone is being pushed to the array", async () => {
    const { cloneFactory } = await loadFixture(deployTestClone);
    expect(await cloneFactory.getClonesLength()).to.be.equal(1);
  });
});
