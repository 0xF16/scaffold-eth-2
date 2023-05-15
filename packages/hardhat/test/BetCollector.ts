import { expect } from "chai";
import { ethers } from "hardhat";
import { BetCollector, BetCollectorFactory } from "../typechain-types";
import { parseEther } from "ethers/lib/utils";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ContractReceipt, ContractTransaction } from "ethers";
import { Address } from "hardhat-deploy/types";

describe("BetCollector", async function () {
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

    let cloneAddress: Address = ethers.constants.AddressZero;
    let cloneInstance: BetCollector;

    if (recipt.events != null) {
      const newClone = recipt.events.find(v => v.event == "NewClone");
      if (newClone && newClone.args) {
        cloneAddress = newClone.args.cloneAddress;
        cloneInstance = await ethers.getContractAt("BetCollector", cloneAddress);
        await cloneInstance.initialize(2000);
      }
    }

    return { cloneAddress, cloneInstance, cloneFactory: cloner };
  }

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
      const { cloneInstance } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();
      await cloneInstance.connect(participant1).createBet(true, { value: parseEther("1") });
      await cloneInstance.connect(participant2).createBet(false, { value: parseEther("2") });

      await cloneInstance.findWinner(2200);
      expect(await cloneInstance.winnerUpperBound()).to.equal(true);
    });

    it("Calculate payout", async function () {
      const { cloneInstance } = await loadFixture(deployTestClone);
      const [, participant1, participant2] = await ethers.getSigners();
      await await cloneInstance.connect(participant1).createBet(true, { value: parseEther("1") });
      await cloneInstance.connect(participant2).createBet(false, { value: parseEther("2") });

      await cloneInstance.findWinner(2200);
      expect(await cloneInstance.calculatePayout(participant1.address)).to.equal(parseEther("2.7"));
    });
  });

  describe("Prize calculations and send prizes", async () => {
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

      let cloneAddress: Address = ethers.constants.AddressZero;
      let cloneInstance: BetCollector;

      if (recipt.events != null) {
        const newClone = recipt.events.find(v => v.event == "NewClone");
        if (newClone && newClone.args) {
          cloneAddress = newClone.args.cloneAddress;
          cloneInstance = await ethers.getContractAt("BetCollector", cloneAddress);
          await cloneInstance.initialize(2000);

          const [, participant1, participant2, participant3, participant4] = await ethers.getSigners();
          await cloneInstance.connect(participant1).createBet(false, { value: parseEther("7") });
          await cloneInstance.connect(participant2).createBet(false, { value: parseEther("3") });
          await cloneInstance.connect(participant3).createBet(true, { value: parseEther("6") });
          await cloneInstance.connect(participant4).createBet(true, { value: parseEther("4") });
        }
      }

      return { cloneAddress, cloneInstance, cloneFactory: cloner };
    }

    it("Upper bound wins", async () => {
      const { cloneInstance } = await loadFixture(deployTestClone);
      const [, , , participant3] = await ethers.getSigners();

      await cloneInstance.findWinner(2200);
      expect(await cloneInstance.calculatePayout(participant3.address)).to.equal(parseEther("10.8"));
    });
    it("Lower bound wins", async () => {
      const { cloneInstance } = await loadFixture(deployTestClone);
      const [, , participant2] = await ethers.getSigners();

      await cloneInstance.findWinner(1800);
      expect(await cloneInstance.calculatePayout(participant2.address)).to.equal(parseEther("5.4"));
    });
    it("All winners claim reward", async () => {
      const { cloneInstance } = await loadFixture(deployTestClone);
      const [, , , participant3, participant4] = await ethers.getSigners();

      await cloneInstance.findWinner(2200);
      await cloneInstance.connect(participant3).withdrawPrize();
      expect(await cloneInstance.connect(participant4).withdrawPrize()).to.not.be.reverted;
    });
  });
});
