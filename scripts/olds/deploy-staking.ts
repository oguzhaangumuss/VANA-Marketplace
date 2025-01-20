import { ethers, network } from "hardhat";
import { verify } from "./verify";
import { loadDeployment, saveDeployment } from "./utils";

async function main() {
    // Load existing deployment info
    const deployment = await loadDeployment(network.name);
    console.log("Loaded deployment info:", deployment);

    const [deployer] = await ethers.getSigners();
    console.log("Deploying staking contract with account:", deployer.address);

    // Configuration
    const REWARD_RATE = ethers.parseEther("0.1"); // 0.1 VANA per day
    const MIN_LOCK_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
    const EARLY_UNSTAKE_PENALTY = 1000; // 10%

    // Deploy Staking Contract
    const VanaStaking = await ethers.getContractFactory("VanaStaking");
    const staking = await VanaStaking.deploy(
        deployment.nftCollection,
        REWARD_RATE,
        MIN_LOCK_PERIOD,
        EARLY_UNSTAKE_PENALTY
    );
    await staking.waitForDeployment();
    console.log("VanaStaking deployed to:", staking.target);

    // Update deployment info
    const updatedDeployment = {
        ...deployment,
        staking: staking.target
    };
    await saveDeployment(updatedDeployment);

    // Verify if not on localhost
    if (network.name !== "localhost" && network.name !== "hardhat") {
        console.log("\nVerifying staking contract...");
        await verify(staking.target, [
            deployment.nftCollection,
            REWARD_RATE,
            MIN_LOCK_PERIOD,
            EARLY_UNSTAKE_PENALTY
        ]);
    }

    // Setup initial configuration
    const nftCollection = await ethers.getContractAt(
        "VanaNFTCollection",
        deployment.nftCollection
    );

    // Grant STAKER_ROLE to staking contract
    const STAKER_ROLE = await nftCollection.STAKER_ROLE();
    if (!(await nftCollection.hasRole(STAKER_ROLE, staking.target))) {
        await nftCollection.grantRole(STAKER_ROLE, staking.target);
        console.log("Granted STAKER_ROLE to staking contract");
    }

    console.log("\nStaking deployment completed!");
    console.log("Important addresses:");
    console.log("- NFT Collection:", deployment.nftCollection);
    console.log("- Staking Contract:", staking.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 