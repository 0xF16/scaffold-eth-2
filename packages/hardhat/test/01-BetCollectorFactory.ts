import { expect } from "chai";
import { ethers } from "hardhat";
import { BetCollector, BetCollectorFactory, MockupOracle } from "../typechain-types";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { Address } from "hardhat-deploy/types";

let timeFinishAcceptingBets: number;
let timePriceUnveil: number;

async function deployTestClone() {
  timeFinishAcceptingBets = (await time.latest()) + 24 * 60 * 60; //24h after mined block
  timePriceUnveil = timeFinishAcceptingBets + 24 * 60 * 60; //next 24h after previous time
  const oracleFactory = await ethers.getContractFactory("MockupOracle");
  const oracle: MockupOracle = (await oracleFactory.deploy()) as MockupOracle;
  await oracle.deployed();

  const betCollectorFactory = await ethers.getContractFactory("BetCollector");
  const betCollector: BetCollector = (await betCollectorFactory.deploy()) as BetCollector;
  await betCollector.deployed();

  const betCollectorCloneFactory = await ethers.getContractFactory("BetCollectorFactory");
  const cloner: BetCollectorFactory = (await betCollectorCloneFactory.deploy(
    betCollector.address,
    10,
    oracle.address,
  )) as BetCollectorFactory;
  await cloner.deployed();

  await cloner.clone(2000 * 1e9, timeFinishAcceptingBets, timePriceUnveil);

  const cloneAddress: Address = await cloner.clones(0);
  const cloneInstance: BetCollector = await ethers.getContractAt("BetCollector", cloneAddress);

  return { cloneAddress, cloneInstance, cloneFactory: cloner, oracle };
}

describe("BetCollectorFactory", async () => {
  it("Clone is being pushed to the array", async () => {
    const { cloneFactory } = await loadFixture(deployTestClone);
    expect(await cloneFactory.getClonesLength()).to.be.equal(1);
  });
  it("Set commission at constructor", async () => {
    const { cloneFactory } = await loadFixture(deployTestClone);
    expect(await cloneFactory.commissionForNew()).to.be.equal(10);
  });
  it("Set new commission", async () => {
    const { cloneFactory } = await loadFixture(deployTestClone);
    await cloneFactory.setNewCommission(20);
    expect(await cloneFactory.commissionForNew()).to.be.equal(20);
  });
});
