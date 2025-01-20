import { ethers, network } from "hardhat";
import { verify } from "./verify";
import { saveDeployment, setupRoles } from "./utils";

async function main() {
    if (!network.name.includes("mainnet")) {
        throw new Error("This script is for mainnet deployment only");
    }

    // Configuration for production
    const PLATFORM_FEE = 250; // 2.5%
    const MAX_SUPPLY = 10000;
    const BASE_URI = "https://api.vana.org/metadata/";
    const HIDDEN_URI = "ipfs://QmXxxx..."; // Production IPFS URI
    const MERKLE_ROOT = ethers.ZeroHash; // Will be set after whitelist is finalized
    const ROYALTY_FEE = 250; // 2.5%

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

    // Safety checks
    const response = await ethers.provider.getNetwork();
    console.log(`Connected to network: ${response.name} (${response.chainId})`);
    const gasPrice = await ethers.provider.getFeeData();
    console.log("Current gas price:", ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei"), "gwei");

    // Confirmation prompt
    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await new Promise((resolve) => {
        readline.question(`Continue with deployment? (yes/no) `, (answer: string) => {
            readline.close();
            if (answer.toLowerCase() !== "yes") {
                console.log("Deployment cancelled");
                process.exit(0);
            }
            resolve(true);
        });
    });

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
    console.log("\nVerifying contracts...");
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

    console.log("\nDeployment completed!");
    console.log("Important addresses:");
    console.log("- NFT Collection:", nftCollection.target);
    console.log("- Marketplace:", marketplace.target);
    console.log("- Deployer:", deployer.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 