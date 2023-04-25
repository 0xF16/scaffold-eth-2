import { expect } from "chai";
import { ethers } from "hardhat";
// import { time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { BetCollector } from "../typechain-types";
import { parseEther } from "ethers/lib/utils";

describe("BetCollector", function () {
  // We define a fixture to reuse the same setup in every test.

  let betCollector: BetCollector;
  before(async () => {
    // const timeFinishAcceptingBets: number = (await time.latest()) + 24 * 60 * 60; //24h after mined block
    // const timePriceUnveil: number = timeFinishAcceptingBets + 24 * 60 * 60; //next 24h after previous time

    const betCollectorFactory = await ethers.getContractFactory("BetCollector");
    betCollector = (await betCollectorFactory.deploy(
      /*timeFinishAcceptingBets, timePriceUnveil,*/ 2000,
    )) as BetCollector;
    await betCollector.deployed();
  });

  describe("Fundamental functions", function () {
    it("Placing bets", async function () {
      const [, participant1] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(true, { value: parseEther("1") });
      const bet = await betCollector.bets(participant1.address);
      expect(bet.active).not.false;
    });

    it("Pool size", async function () {
      const [, , participant2] = await ethers.getSigners();

      await betCollector.connect(participant2).createBet(false, { value: parseEther("2") });
      expect(await betCollector.poolSize()).to.equal(parseEther("2.7"));
    });

    it("Pick a winner", async function () {
      await betCollector.findWinner(2200);
      expect(await betCollector.greaterOrEqualWon()).to.equal(true);
    });

    it("Calculate cut", async function () {
      const [, participant1] = await ethers.getSigners();
      expect(await betCollector.calculateCut(participant1.address)).to.equal(parseEther("2.7"));
    });
  });

  describe("Prize calculations and send", async () => {
    beforeEach(async () => {
      // const timeFinishAcceptingBets: number = (await time.latest()) + 24 * 60 * 60; //24h after mined block
      // const timePriceUnveil: number = timeFinishAcceptingBets + 24 * 60 * 60; //next 24h after previous time

      const betCollectorFactory = await ethers.getContractFactory("BetCollector");
      betCollector = (await betCollectorFactory.deploy(
        /*timeFinishAcceptingBets, timePriceUnveil,*/ 2000,
      )) as BetCollector;
      await betCollector.deployed();
      const [, participant1, participant2, participant3, participant4] = await ethers.getSigners();
      await betCollector.connect(participant1).createBet(false, { value: parseEther("1") });
      await betCollector.connect(participant2).createBet(false, { value: parseEther("2") });
      await betCollector.connect(participant3).createBet(true, { value: parseEther("3") });
      await betCollector.connect(participant4).createBet(true, { value: parseEther("4") });
    });

    it("Upper bound wins", async () => {
      const [, , , participant3] = await ethers.getSigners();

      await betCollector.findWinner(2200);
      expect(await betCollector.calculateCut(participant3.address)).to.equal(parseEther("3.78"));
    });
    it("Lower bound wins", async () => {
      const [, , participant2] = await ethers.getSigners();

      await betCollector.findWinner(1800);
      expect(await betCollector.calculateCut(participant2.address)).to.equal(parseEther("5.94"));
    });
    it("All winners claim reward", async () => {
      const [, , , participant3, participant4] = await ethers.getSigners();

      await betCollector.findWinner(2200);
      await betCollector.connect(participant3).withdrawPrize();
      expect(await betCollector.connect(participant4).withdrawPrize()).to.not.be.reverted;
    });
  });
});
