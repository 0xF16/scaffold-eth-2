import { expect } from "chai";
import { ethers } from "hardhat";
import { time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { BetCollector } from "../typechain-types";

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
      await betCollector.findWinner(1800);
      expect(await betCollector.greaterOrEqualWon()).to.be.equal(false);
    });
  });
});
