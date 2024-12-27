import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying VanaStaking with account:", deployer.address);

    const VANA_TOKEN = "0x..."; // Vana token adresi
    const DAILY_RATE = 100; // 1% günlük
    const MIN_STAKE_PERIOD = 86400; // 1 gün

    const VanaStaking = await ethers.getContractFactory("VanaStaking");
    const staking = await upgrades.deployProxy(VanaStaking, [
        VANA_TOKEN,
        DAILY_RATE,
        MIN_STAKE_PERIOD
    ]);

    await staking.waitForDeployment();
    console.log("VanaStaking deployed to:", await staking.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 