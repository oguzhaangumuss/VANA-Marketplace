import { ethers, network } from "hardhat";
import { saveDeployment, setupRoles } from "./utils";

async function main() {
    if (network.name !== "hardhat" && network.name !== "localhost") {
        throw new Error("This script is for local deployment only");
    }

    // Configuration
    const PLATFORM_FEE = 250; // 2.5%
    const MAX_SUPPLY = 100; // Smaller supply for testing
    const BASE_URI = "http://localhost:3000/api/metadata/";
    const HIDDEN_URI = "http://localhost:3000/api/hidden/";
    const MERKLE_ROOT = ethers.ZeroHash;
    const ROYALTY_FEE = 250; // 2.5%

    const [deployer, minter, buyer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy NFT Collection
    const VanaNFTCollection = await ethers.getContractFactory("VanaNFTCollection");
    const nftCollection = await VanaNFTCollection.deploy(
        "Test NFT",
        "TEST",
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
        [deployer.address, minter.address]
    );

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        nftCollection: nftCollection.target,
        marketplace: marketplace.target,
        timestamp: new Date().toISOString()
    };
    await saveDeployment(deploymentInfo);

    // Mint some NFTs for testing
    console.log("Minting test NFTs...");
    for (let i = 0; i < 5; i++) {
        await nftCollection.connect(minter).mint(buyer.address);
    }

    console.log("Local deployment completed!");
    console.log("Test accounts:");
    console.log("- Deployer:", deployer.address);
    console.log("- Minter:", minter.address);
    console.log("- Buyer:", buyer.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 