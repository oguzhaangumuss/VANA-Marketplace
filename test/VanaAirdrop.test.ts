import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VanaAirdrop", function () {
    let VanaAirdrop, airdrop, vanaToken, owner, user1, user2;
    const AIRDROP_AMOUNT = ethers.parseEther("100");
    const TOTAL_SUPPLY = ethers.parseEther("10000");

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy mock VANA token
        const MockVanaToken = await ethers.getContractFactory("MockVanaToken");
        vanaToken = await MockVanaToken.deploy();
        await vanaToken.waitForDeployment();

        // Deploy VanaAirdrop
        VanaAirdrop = await ethers.getContractFactory("VanaAirdrop");
        const startTime = await time.latest();
        const endTime = startTime + 86400; // 1 gün

        airdrop = await upgrades.deployProxy(VanaAirdrop, [
            await vanaToken.getAddress(),
            AIRDROP_AMOUNT,
            startTime,
            endTime,
            TOTAL_SUPPLY
        ]);
        await airdrop.waitForDeployment();

        // Fund airdrop contract
        await vanaToken.mint(await airdrop.getAddress(), TOTAL_SUPPLY);
    });

    describe("Claiming", function () {
        beforeEach(async function () {
            // Whitelist user1
            await airdrop.updateWhitelist([user1.address], true);
        });

        it("Should allow whitelisted users to claim", async function () {
            await airdrop.connect(user1).claim();
            
            const balance = await vanaToken.balanceOf(user1.address);
            expect(balance).to.equal(AIRDROP_AMOUNT);
        });

        it("Should not allow double claims", async function () {
            await airdrop.connect(user1).claim();
            await expect(
                airdrop.connect(user1).claim()
            ).to.be.revertedWith("Not eligible");
        });

        it("Should not allow non-whitelisted users to claim", async function () {
            await expect(
                airdrop.connect(user2).claim()
            ).to.be.revertedWith("Not eligible");
        });
    });
}); 