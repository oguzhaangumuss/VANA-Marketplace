import { ethers, network } from "hardhat";
import { verify } from "./verify";
import { loadDeployment, saveDeployment } from "./utils";

async function main() {
    // Load existing deployment info
    const deployment = await loadDeployment(network.name);
    console.log("Loaded deployment info:", deployment);

    const [deployer] = await ethers.getSigners();
    console.log("Upgrading contracts with account:", deployer.address);

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
        readline.question(`Continue with upgrade? (yes/no) `, (answer: string) => {
            readline.close();
            if (answer.toLowerCase() !== "yes") {
                console.log("Upgrade cancelled");
                process.exit(0);
            }
            resolve(true);
        });
    });

    // Deploy new implementation contracts
    console.log("\nDeploying new implementations...");

    // NFT Collection upgrade
    if (deployment.nftCollection) {
        const VanaNFTCollectionV2 = await ethers.getContractFactory("VanaNFTCollectionV2");
        const nftCollectionV2 = await VanaNFTCollectionV2.deploy();
        await nftCollectionV2.waitForDeployment();
        console.log("New NFT Collection implementation deployed to:", nftCollectionV2.target);

        // Update proxy
        const nftProxy = await ethers.getContractAt(
            "TransparentUpgradeableProxy",
            deployment.nftCollection
        );
        await nftProxy.upgradeTo(nftCollectionV2.target);
        console.log("NFT Collection proxy upgraded");

        // Verify new implementation
        if (network.name !== "localhost" && network.name !== "hardhat") {
            await verify(nftCollectionV2.target, []);
        }
    }

    // Marketplace upgrade
    if (deployment.marketplace) {
        const VanaMarketplaceV2 = await ethers.getContractFactory("VanaMarketplaceV2");
        const marketplaceV2 = await VanaMarketplaceV2.deploy();
        await marketplaceV2.waitForDeployment();
        console.log("New Marketplace implementation deployed to:", marketplaceV2.target);

        // Update proxy
        const marketplaceProxy = await ethers.getContractAt(
            "TransparentUpgradeableProxy",
            deployment.marketplace
        );
        await marketplaceProxy.upgradeTo(marketplaceV2.target);
        console.log("Marketplace proxy upgraded");

        // Verify new implementation
        if (network.name !== "localhost" && network.name !== "hardhat") {
            await verify(marketplaceV2.target, []);
        }
    }

    // Save new implementation addresses
    const updatedDeployment = {
        ...deployment,
        nftCollectionImplementation: deployment.nftCollection ? await ethers.provider.getCode(deployment.nftCollection) : undefined,
        marketplaceImplementation: deployment.marketplace ? await ethers.provider.getCode(deployment.marketplace) : undefined,
        upgradeTimestamp: new Date().toISOString()
    };
    await saveDeployment(updatedDeployment);

    console.log("\nUpgrade completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 