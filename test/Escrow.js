// import {
//   time,
//   loadFixture,
// } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";
const { ethers } = require("hardhat");
const { expect } = require("chai");
const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

describe("Escrow", function () {

  let buyer, seller, lender, inspector;
  let realEstate, escrow;
  beforeEach(async function () {
    
    [buyer, seller, inspector, lender] = await ethers.getSigners();
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();
    console.log(realEstate.target);
    let transaction = await realEstate.connect(seller).mint(
      "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
    );
    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.target,
      seller.address,
      inspector.address,
      lender.address
    );

    transaction = await realEstate.connect(seller).approve(escrow.target, 1);
    await transaction.wait();
    transaction = await escrow.connect(seller).listing(1, buyer, tokens(10), tokens(5));
    await transaction.wait();
  });

  describe("Deployment", async function () {
    it('returns NFT address', async() => {
      const result = await escrow.nftAddress();
      expect(result).to.equal(realEstate.target);

    })
    it('returns seller address', async() => {
      const result = await escrow.seller();
      expect(result).to.equal(seller.address);
    })
    it('returns inspector address', async() => {
      const result = await escrow.inspector();
      expect(result).to.equal(inspector.address);
    })
    it('returns lender address', async() => {
      const result = await escrow.lender();
      expect(result).to.equal(lender.address);
    })
  });

  describe("Listing", async function () {
    it("returns if listed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.equal(true);
    })
      
    it("returns purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.equal(tokens(10));
    });

    it("return escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.equal(tokens(5));
    });
  });

  describe("Approvals", async function() {
    
    it("deposit escrow", async ()=>{
      let transaction = await escrow.connect(buyer).escrowPayment(1, {value: tokens(5)});
      await transaction.wait();
      const result = await escrow.getBalance();
      expect(result).to.equal(tokens(5));
    });

    it("returns inspector status", async ()=>{
      let transaction = await escrow.connect(buyer).escrowPayment(1, {value: tokens(5)});
      await transaction.wait();
      transaction = await escrow.inspectorApproval(1, true);
      await transaction.wait();
      const result = await escrow.inspectionStatus(1);
      expect(result).to.equal(true);
    })

    it("returns approval status", async ()=>{
      let transaction = await escrow.connect(buyer).escrowPayment(1, {value: tokens(5)});
      await transaction.wait();
      transaction = await escrow.connect(buyer).getApproval(1, true);
      await transaction.wait();
      transaction = await escrow.connect(seller).getApproval(1, true);
      await transaction.wait();
      transaction = await escrow.connect(lender).getApproval(1, true);
      await transaction.wait();

      expect(await escrow.approvalStatus(1, buyer.address)).to.equal(true);
      expect(await escrow.approvalStatus(1, seller.address)).to.equal(true);
      expect(await escrow.approvalStatus(1, lender.address)).to.equal(true);
    })
  })

  describe("Final transfers", async function() {
    
    beforeEach(async function() {
      let transaction = await escrow.connect(buyer).escrowPayment(1, {value: tokens(5)});
      await transaction.wait();
      transaction = await escrow.inspectorApproval(1, true);
      await transaction.wait();
      transaction = await escrow.connect(buyer).getApproval(1, true);
      await transaction.wait();
      transaction = await escrow.connect(seller).getApproval(1, true);
      await transaction.wait();
      transaction = await escrow.connect(lender).getApproval(1, true);
      await transaction.wait();
      transaction = await lender.sendTransaction({to: escrow.target, value: tokens(5)});
      await transaction.wait();
      transaction = await escrow.connect(seller).finalizeTransaction(1);
      await transaction.wait();
    });

    t('Updates ownership', async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
  })

  it('Updates balance', async () => {
      expect(await escrow.getBalance()).to.be.equal(0)
  })

  });
});
