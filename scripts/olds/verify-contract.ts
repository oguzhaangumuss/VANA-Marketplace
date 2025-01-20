import { ethers, network } from "hardhat";
import { verify } from "./verify";
import { loadDeployment } from "./utils";

async function main() {
    // Get contract address from command line
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is required");
    }

    // Load deployment info
    const deployment = await loadDeployment(network.name);
    console.log(`Verifying contract on ${network.name}...`);

    // Determine contract type and arguments
    let constructorArgs: any[] = [];
    
    if (contractAddress.toLowerCase() === deployment.nftCollection?.toLowerCase()) {
        console.log("Verifying NFT Collection contract...");
        constructorArgs = [
            "Vana NFT",
            "VANA",
            10000, // MAX_SUPPLY
            "https://api.vana.org/metadata/",
            "ipfs://hidden-metadata/",
            ethers.ZeroHash,
            deployment.deployer,
            250 // ROYALTY_FEE
        ];
    } else if (contractAddress.toLowerCase() === deployment.marketplace?.toLowerCase()) {
        console.log("Verifying Marketplace contract...");
        constructorArgs = [250]; // PLATFORM_FEE
    } else if (contractAddress.toLowerCase() === deployment.staking?.toLowerCase()) {
        console.log("Verifying Staking contract...");
        constructorArgs = [
            deployment.nftCollection,
            ethers.parseEther("0.1"), // REWARD_RATE
            7 * 24 * 60 * 60, // MIN_LOCK_PERIOD
            1000 // EARLY_UNSTAKE_PENALTY
        ];
    } else {
        throw new Error("Unknown contract address");
    }

    // Verify contract
    await verify(contractAddress, constructorArgs);
    console.log("Verification completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 