import { expect } from "chai";
import { ethers } from "hardhat";
import { OrderedList } from "../typechain-types";

describe("OrderedList", async function () {
  describe("Fundamentals", function () {
    let olFactory;
    let ol: OrderedList;
    before(async function () {
      olFactory = await ethers.getContractFactory("OrderedList");
      ol = (await olFactory.deploy()) as OrderedList;
      await ol.deployed();
    });
    it("Add single item to a list", async function () {
      await ol.addToQueue(2, 10, 1);
      expect(await ol.listSize()).to.equal(1);
    });
    it("Append sooner time at the end of the index", async function () {
      await ol.addToQueue(3, 2, 1);
      expect(await ol.listSize()).to.equal(2);
    });
    it("Cannot add an entry with a lower time in a wrong place", async () => {
      await expect(ol.addToQueue(4, 5, 2)).to.be.revertedWithCustomError(ol, "GamePlacedAtWrongIndex");
    });
    it("Remove the item", async () => {
      await ol.addToQueue(4, 5, 3);
      // console.log(await ol.getTopTimes(await ol.listSize()));
      await ol.removeGame(4, 3);
      expect(await ol.listSize()).to.be.equal(2);
    });
    it("Try to remove the item (but fail, because of giving wrong child)", async () => {
      await ol.addToQueue(4, 5, 3);
      await expect(ol.removeGame(3, 4)).to.be.revertedWithCustomError(ol, "WrongParentChild");
    });
  });
});
