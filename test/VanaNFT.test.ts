import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract, ContractTransactionResponse } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VanaNFT", function () {
  let VanaNFT;
  let vanaNFT: Contract;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    VanaNFT = await ethers.getContractFactory("VanaNFT");
    vanaNFT = await upgrades.deployProxy(VanaNFT, [], {
      initializer: 'initialize',
    });
    await vanaNFT.waitForDeployment();
  });

  describe("Initialization", function () {
    it("Should set the right name and symbol", async function () {
      expect(await vanaNFT.name()).to.equal("VanaNFT");
      expect(await vanaNFT.symbol()).to.equal("VNFT");
    });

    it("Should set the right owner", async function () {
      expect(await vanaNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const tokenURI = "https://example.com/token/1";
      await vanaNFT.mint(addr1.address, tokenURI);
      expect(await vanaNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await vanaNFT.tokenURI(1)).to.equal(tokenURI);
    });
  });
}); 