import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VanaStaking", function () {
    let VanaStaking, staking, vanaToken, owner, user1;
    const DAILY_RATE = 100; // 1% günlük
    const MIN_STAKE_PERIOD = 86400; // 1 gün
    const INITIAL_REWARD_POOL = ethers.parseEther("100000");

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        // Deploy mock VANA token
        const MockVanaToken = await ethers.getContractFactory("MockVanaToken");
        vanaToken = await MockVanaToken.deploy();
        await vanaToken.waitForDeployment();

        // Deploy VanaStaking
        VanaStaking = await ethers.getContractFactory("VanaStaking");
        staking = await upgrades.deployProxy(VanaStaking, [
            await vanaToken.getAddress(),
            DAILY_RATE,
            MIN_STAKE_PERIOD
        ]);
        await staking.waitForDeployment();

        // Fund reward pool
        await vanaToken.mint(owner.address, INITIAL_REWARD_POOL);
        await vanaToken.approve(await staking.getAddress(), INITIAL_REWARD_POOL);
        await staking.fundRewardPool(INITIAL_REWARD_POOL);
    });

    describe("Stats Tracking", function () {
        it("Should track global stats correctly", async function () {
            const stats = await staking.getGlobalStats();
            expect(stats.totalStaked).to.equal(0);
            expect(stats.totalRewardsPaid).to.equal(0);
            expect(stats.totalStakers).to.equal(0);
        });

        it("Should track user stats correctly", async function () {
            const stats = await staking.getUserStats(user1.address);
            expect(stats.totalClaimed).to.equal(0);
            expect(stats.activeStakes).to.equal(0);
        });
    });

    describe("Reward Pool", function () {
        it("Should handle reward pool funding correctly", async function () {
            const initialPool = await staking.rewardPool();
            const additionalFunds = ethers.parseEther("1000");

            await vanaToken.mint(owner.address, additionalFunds);
            await vanaToken.approve(await staking.getAddress(), additionalFunds);
            await staking.fundRewardPool(additionalFunds);

            expect(await staking.rewardPool()).to.equal(initialPool + additionalFunds);
        });
    });
}); 