import { expect } from "chai";
import { ethers } from "hardhat";
import { BetCollector, BetCollectorFactory, MockupOracle } from "../typechain-types";
import { parseEther } from "ethers/lib/utils";
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
  await cloneInstance.initialize(2000 * 1e9, oracle.address);

  return { cloneAddress, cloneInstance, cloneFactory: cloner, oracle };
}

async function createBets(cloneInstance: BetCollector) {
  const [, participant1, participant2, participant3, participant4] = await ethers.getSigners();
  await cloneInstance.connect(participant1).createBet(false, { value: parseEther("7") });
  await cloneInstance.connect(participant2).createBet(false, { value: parseEther("3") });
  await cloneInstance.connect(participant3).createBet(true, { value: parseEther("6") });
  await cloneInstance.connect(participant4).createBet(true, { value: parseEther("4") });
}

describe("BetCollector", async function () {
  describe("Fundamental functions", function () {
    it("Placing bets", async function () {
      const { cloneInstance } = await loadFixture(deployTestClone);
      const [, participant1] = await ethers.getSigners();

      await cloneInstance.connect(participant1).createBet(true, { value: parseEther("1") });
      const bet = await cloneInstance.bets(participant1.address);
      expect(bet.active).not.false;
    });

    it("Pool size", async function () {
      const { cloneInstance } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await cloneInstance.connect(participant1).createBet(true, { value: parseEther("1") });
      await cloneInstance.connect(participant2).createBet(false, { value: parseEther("2") });

      expect(await cloneInstance.poolSize()).to.equal(parseEther("3"));
    });

    it("Pick a winner", async function () {
      const { cloneInstance, oracle } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();
      await cloneInstance.connect(participant1).createBet(true, { value: parseEther("1") });
      await cloneInstance.connect(participant2).createBet(false, { value: parseEther("2") });

      await oracle.setPrice(2200 * 1e9);

      await cloneInstance.findWinner();
      expect(await cloneInstance.winnerUpperBound()).to.equal(true);
    });

    it("Calculate payout", async function () {
      const { cloneInstance, oracle } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();
      await await cloneInstance.connect(participant1).createBet(true, { value: parseEther("1") });
      await cloneInstance.connect(participant2).createBet(false, { value: parseEther("2") });

      await oracle.setPrice(2200 * 1e9);

      await cloneInstance.findWinner();
      expect(await cloneInstance.calculatePayout(participant1.address)).to.equal(parseEther("2.7"));
    });
  });

  describe("Prize calculations and send prizes", async () => {
    it("Upper bound wins", async () => {
      const { cloneInstance, oracle } = await loadFixture(deployTestClone);
      const [, , , participant3] = await ethers.getSigners();

      await createBets(cloneInstance);

      await oracle.setPrice(2200 * 1e9);

      await cloneInstance.findWinner();
      expect(await cloneInstance.calculatePayout(participant3.address)).to.equal(parseEther("10.8"));
    });
    it("Lower bound wins", async () => {
      const { cloneInstance, oracle } = await loadFixture(deployTestClone);
      const [, , participant2] = await ethers.getSigners();

      await createBets(cloneInstance);

      await oracle.setPrice(2200 * 1e9);

      await cloneInstance.findWinner();
      expect(await cloneInstance.calculatePayout(participant2.address)).to.equal(parseEther("5.4"));
    });
    it("All winners claim reward", async () => {
      const { cloneInstance, oracle } = await loadFixture(deployTestClone);
      const [, , , participant3, participant4] = await ethers.getSigners();

      await createBets(cloneInstance);

      await oracle.setPrice(2200 * 1e9);

      await cloneInstance.findWinner();
      await cloneInstance.connect(participant3).withdrawPrize();
      expect(await cloneInstance.connect(participant4).withdrawPrize()).to.not.be.reverted;
    });
  });
});
