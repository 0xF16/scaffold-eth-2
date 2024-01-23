import { expect } from "chai";
import { ethers } from "hardhat";
import { BetCollector, MockupOracle } from "../typechain-types";
import { parseEther } from "ethers/lib/utils";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

let timeFinishAcceptingBets: number;
let timePriceUnveil: number;

async function deployTestClone() {
  timeFinishAcceptingBets = (await time.latest()) + 24 * 60 * 60; //24h after mined block
  timePriceUnveil = timeFinishAcceptingBets + 24 * 60 * 60; //next 24h after previous time
  const oracleFactory = await ethers.getContractFactory("MockupOracle");
  const oracle: MockupOracle = (await oracleFactory.deploy()) as MockupOracle;
  await oracle.deployed();

  const betCollectorFactory = await ethers.getContractFactory("BetCollector");
  const betCollector: BetCollector = (await betCollectorFactory.deploy(oracle.address)) as BetCollector;
  await betCollector.deployed();

  return { betCollector, oracle };
}

async function createBets(betCollector: BetCollector) {
  const [, participant1, participant2, participant3, participant4] = await ethers.getSigners();
  await betCollector.connect(participant1).placeBet(0, false, { value: parseEther("7") });
  await betCollector.connect(participant2).placeBet(0, false, { value: parseEther("3") });
  await betCollector.connect(participant3).placeBet(0, true, { value: parseEther("6") });
  await betCollector.connect(participant4).placeBet(0, true, { value: parseEther("4") });
}

describe("BetCollector", async function () {
  describe("Fundamental functions", function () {
    it("Creating bets", async function () {
      const { betCollector } = await loadFixture(deployTestClone);
      const [, participant1] = await ethers.getSigners();

      await expect(
        betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil),
      ).to.emit(betCollector, "GameCreated");
    });
    it("Placing bets", async function () {
      const { betCollector } = await loadFixture(deployTestClone);
      const [, participant1] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await expect(betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") })).to.emit(
        betCollector,
        "BetPlaced",
      );
    });

    it("Pool size", async function () {
      const { betCollector } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") });
      await betCollector.connect(participant2).placeBet(0, false, { value: parseEther("2") });

      expect(await betCollector.poolSize(0)).to.equal(parseEther("3"));
    });

    it("Pick a winner", async function () {
      const { betCollector, oracle } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") });
      await betCollector.connect(participant2).placeBet(0, false, { value: parseEther("2") });

      await oracle.setPrice(2000 * 1e9);
      await time.increaseTo(timePriceUnveil);

      await expect(betCollector.findWinner(0)).to.emit(betCollector, "WinnerKnown").withArgs(true);
    });

    it("Calculate payout lower baund", async function () {
      const { betCollector, oracle } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") });
      await betCollector.connect(participant2).placeBet(0, false, { value: parseEther("2") });

      await oracle.setPrice(2000 * 1e9);
      await time.increaseTo(timePriceUnveil);

      await betCollector.findWinner(0);

      expect(await betCollector.calculatePayout(participant1.address, 0)).to.equal(parseEther("2.85"));
    });

    it("Calculate payout upper baund", async function () {
      const { betCollector, oracle } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") });
      await betCollector.connect(participant2).placeBet(0, false, { value: parseEther("2") });

      await oracle.setPrice(2400 * 1e9);
      await time.increaseTo(timePriceUnveil);

      await betCollector.findWinner(0);

      expect(await betCollector.calculatePayout(participant1.address, 0)).to.equal(parseEther("2.85"));
    });
    // it("Old commission values for contract before new setNewCommission is executed", async () => {
    //   const { cloneFactory, cloneInstance } = await loadFixture(deployTestClone);
    //   await cloneFactory.setNewCommission(20);
    //   await cloneFactory.clone(2000 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
    //   expect(await cloneInstance.commission()).to.be.equal(10);
    // });
    // it("New commission value from the factory contract for new contracts", async () => {
    //   const { cloneFactory } = await loadFixture(deployTestClone);
    //   await cloneFactory.setNewCommission(20);
    //   await cloneFactory.clone(2000 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
    //   const newCloneAddress: Address = await cloneFactory.clones(1); //at 0 it was the address created by the fixture, so we need to take the second
    //   const newClone: BetCollector = await ethers.getContractAt("BetCollector", newCloneAddress);
    //   expect(await newClone.commission()).to.be.equal(20);
    // });
    it("Cannot place bets after the deadline", async () => {
      const { betCollector } = await loadFixture(deployTestClone);
      const [, participant1] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);

      await time.increaseTo(timeFinishAcceptingBets);

      await expect(
        betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") }),
      ).to.revertedWithCustomError(betCollector, "BettingClosed");
    });
    it("Throw error when a winnning side is chosen too early", async () => {
      const { betCollector } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);

      await betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") });
      await betCollector.connect(participant2).placeBet(0, false, { value: parseEther("2") });

      await time.increaseTo(timePriceUnveil - 60);

      await expect(betCollector.findWinner(0)).to.revertedWithCustomError(
        betCollector,
        "WinnerTimeThresholdNotReached",
      );
    });
    it("Winnning side is chosen after threshold reached", async () => {
      const { betCollector } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);

      await betCollector.connect(participant1).placeBet(0, true, { value: parseEther("1") });
      await betCollector.connect(participant2).placeBet(0, false, { value: parseEther("2") });

      await time.increaseTo(timePriceUnveil);

      expect(await betCollector.findWinner(0)).to.be.ok;
    });
  });

  describe("Prize calculations and send prizes", async () => {
    it("Lower bound wins", async () => {
      const { betCollector, oracle } = await loadFixture(deployTestClone);
      const [, participant1, , participant3] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await createBets(betCollector);

      await oracle.setPrice(2000 * 1e9);
      await time.increaseTo(timePriceUnveil);

      await betCollector.findWinner(0);
      expect(await betCollector.calculatePayout(participant3.address, 0)).to.equal(parseEther("11.4"));
    });
    it("Upper bound wins", async () => {
      const { betCollector, oracle } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await createBets(betCollector);

      await oracle.setPrice(2400 * 1e9);
      await time.increaseTo(timePriceUnveil);

      await betCollector.findWinner(0);
      expect(await betCollector.calculatePayout(participant2.address, 0)).to.equal(parseEther("5.7"));
    });
    it("All winners claim reward", async () => {
      const { betCollector, oracle } = await loadFixture(deployTestClone);
      const [, , , participant3, participant4] = await ethers.getSigners();

      await betCollector.connect(participant3).createBet(2200 * 1e9, timeFinishAcceptingBets, timePriceUnveil);
      await createBets(betCollector);

      await oracle.setPrice(2000 * 1e9);
      await time.increaseTo(timePriceUnveil + 60);

      await betCollector.findWinner(0);
      await betCollector.connect(participant3).withdrawPrize(0);
      expect(await betCollector.connect(participant4).withdrawPrize(0)).to.not.be.reverted;
    });
  });
});
