import { ethers, network } from "hardhat";
import { verify } from "./verify";
import { saveDeployment, setupRoles } from "./utils";

async function main() {
    if (network.name === "hardhat") {
        throw new Error("This script is for testnet deployment");
    }

    // Configuration
    const PLATFORM_FEE = 250; // 2.5%
    const MAX_SUPPLY = 10000;
    const BASE_URI = "https://api.vana.org/metadata/";
    const HIDDEN_URI = "ipfs://hidden-metadata/";
    const MERKLE_ROOT = ethers.ZeroHash; // Will be updated later
    const ROYALTY_FEE = 250; // 2.5%

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy NFT Collection
    const VanaNFTCollection = await ethers.getContractFactory("VanaNFTCollection");
    const nftCollection = await VanaNFTCollection.deploy(
        "Vana NFT",
        "VANA",
        MAX_SUPPLY,
        BASE_URI,
        HIDDEN_URI,
        MERKLE_ROOT,
        deployer.address,
        ROYALTY_FEE
    );
    await nftCollection.waitForDeployment();
    console.log("VanaNFTCollection deployed to:", nftCollection.target);

    // Deploy Marketplace
    const VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");
    const marketplace = await VanaMarketplace.deploy(PLATFORM_FEE);
    await marketplace.waitForDeployment();
    console.log("VanaMarketplace deployed to:", marketplace.target);

    // Setup roles and permissions
    await setupRoles(
        nftCollection.target,
        marketplace.target,
        [deployer.address]
    );

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        nftCollection: nftCollection.target,
        marketplace: marketplace.target,
        timestamp: new Date().toISOString()
    };
    await saveDeployment(deploymentInfo);

    // Verify contracts
    console.log("Verifying contracts...");
    await verify(nftCollection.target, [
        "Vana NFT",
        "VANA",
        MAX_SUPPLY,
        BASE_URI,
        HIDDEN_URI,
        MERKLE_ROOT,
        deployer.address,
        ROYALTY_FEE
    ]);
    await verify(marketplace.target, [PLATFORM_FEE]);

    console.log("Deployment completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 