import { ethers, network } from "hardhat";
import { verify } from "./verify";
import { loadDeployment } from "./utils";

async function main() {
    if (network.name === "hardhat" || network.name === "localhost") {
        throw new Error("This script is for testnet/mainnet verification");
    }

    // Load deployment info
    const deployment = await loadDeployment(network.name);
    console.log(`Verifying contracts on ${network.name}...`);

    // Configuration used in deployment
    const PLATFORM_FEE = 250; // 2.5%
    const MAX_SUPPLY = 10000;
    const BASE_URI = "https://api.vana.org/metadata/";
    const HIDDEN_URI = "ipfs://hidden-metadata/";
    const MERKLE_ROOT = ethers.ZeroHash;
    const ROYALTY_FEE = 250; // 2.5%

    // Verify NFT Collection
    console.log("\nVerifying VanaNFTCollection...");
    await verify(deployment.nftCollection, [
        "Vana NFT",
        "VANA",
        MAX_SUPPLY,
        BASE_URI,
        HIDDEN_URI,
        MERKLE_ROOT,
        deployment.deployer, // Using saved deployer address
        ROYALTY_FEE
    ]);

    // Verify Marketplace
    console.log("\nVerifying VanaMarketplace...");
    await verify(deployment.marketplace, [PLATFORM_FEE]);

    console.log("\nVerification completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 