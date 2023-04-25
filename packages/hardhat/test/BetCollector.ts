import { expect } from "chai";
import { ethers } from "hardhat";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { BetCollector } from "../typechain-types";
import { BigNumber } from "ethers";

describe("BetCollector", function () {
  // We define a fixture to reuse the same setup in every test.

  let betCollector: BetCollector;
  before(async () => {
    await mine();

    const timeFinishAcceptingBets: number = (await time.latest()) + 24 * 60 * 60; //24h after mined block
    const timePriceUnveil: number = timeFinishAcceptingBets + 24 * 60 * 60; //next 24h after previous time

    // const [owner, participant1, participant2] = await ethers.getSigners();
    const betCollectorFactory = await ethers.getContractFactory("BetCollector");
    betCollector = (await betCollectorFactory.deploy(timeFinishAcceptingBets, timePriceUnveil, 2000)) as BetCollector;
    await betCollector.deployed();
  });

  describe("Fundamental functions", function () {
    it("Placing bets", async function () {
      const [, participant1] = await ethers.getSigners();

      await betCollector.connect(participant1).createBet(true, { value: 1 });
      const bet = await betCollector.bets(participant1.address);
      expect(bet.active).not.false;
    });

    it("Pool size", async function () {
      const [, , participant2] = await ethers.getSigners();

      await betCollector.connect(participant2).createBet(false, { value: 2 });
      expect(await betCollector.poolSize()).to.be.equal(ethers.utils.parseEther("2.7"));
    });

    it("Pick a winner", async function () {
      await betCollector.findWinner(2200);
      expect(await betCollector.greaterOrEqualWon()).to.be.equal(true);
    });

    it("Calculate cut", async function () {
      const [, participant1] = await ethers.getSigners();
      expect(await betCollector.calculateCut(participant1.address)).to.be.equal(ethers.utils.parseEther("2.7"));
    });
  });

  describe("Prize calculations", async () => {
    beforeEach(async () => {
      const timeFinishAcceptingBets: number = (await time.latest()) + 24 * 60 * 60; //24h after mined block
      const timePriceUnveil: number = timeFinishAcceptingBets + 24 * 60 * 60; //next 24h after previous time

      // const [owner, participant1, participant2] = await ethers.getSigners();
      const betCollectorFactory = await ethers.getContractFactory("BetCollector");
      betCollector = (await betCollectorFactory.deploy(timeFinishAcceptingBets, timePriceUnveil, 2000)) as BetCollector;
      await betCollector.deployed();
      const [, participant1, participant2, participant3, participant4] = await ethers.getSigners();
      await betCollector.connect(participant1).createBet(false, { value: 1 });
      await betCollector.connect(participant2).createBet(false, { value: 2 });
      await betCollector.connect(participant3).createBet(true, { value: 3 });
      await betCollector.connect(participant4).createBet(true, { value: 4 });
    });

    it("Upper bound wins", async () => {
      const [, , , , participant4] = await ethers.getSigners();

      const exponent: BigNumber = BigNumber.from(1).mul(10).pow(18);

      await betCollector.findWinner(2200);
      expect(await betCollector.calculateCut(participant4.address)).to.be.equal(
        BigNumber.from(10) //all money sent to the pool
          .mul(4) //bet
          .mul(9)
          .div(10) //commission
          .mul(exponent)
          .div(7), //money in winning pool,
      );
    });
    it("Lower bound wins", async () => {
      const [, , participant2] = await ethers.getSigners();

      const exponent: BigNumber = BigNumber.from(1).mul(10).pow(18);

      await betCollector.findWinner(1800);
      expect(await betCollector.calculateCut(participant2.address)).to.be.equal(
        BigNumber.from(10) //all money sent to the pool
          .mul(2) //bet
          .mul(9)
          .div(10) //commission
          .mul(exponent)
          .div(3), //money in winning pool
      );
    });
  });
});
