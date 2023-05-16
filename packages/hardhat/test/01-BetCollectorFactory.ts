import { expect } from "chai";
import { ethers } from "hardhat";
import { BetCollector, BetCollectorFactory, MockupOracle } from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { Address } from "hardhat-deploy/types";

async function deployTestClone() {
  const oracleFactory = await ethers.getContractFactory("MockupOracle");
  const oracle: MockupOracle = (await oracleFactory.deploy()) as MockupOracle;
  await oracle.deployed();

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

  return { cloneAddress, cloneInstance, cloneFactory: cloner, oracle };
}

describe("BetCollectorFactory", async () => {
  it("Clone", async () => {
    const { cloneInstance, oracle } = await loadFixture(deployTestClone);
    expect(await cloneInstance.initialize(2000 * 1e9, oracle.address)).to.not.be.reverted;
  });
  it("Clone is being pushed to the array", async () => {
    const { cloneFactory } = await loadFixture(deployTestClone);
    expect(await cloneFactory.getClonesLength()).to.be.equal(1);
  });
});
