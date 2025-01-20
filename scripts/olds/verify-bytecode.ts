import { ethers, network } from "hardhat";
import { loadDeployment } from "./utils";

async function main() {
    // Load deployment info
    const deployment = await loadDeployment(network.name);
    console.log(`Verifying bytecode on ${network.name}...`);

    // Get deployed bytecode
    const nftBytecode = await ethers.provider.getCode(deployment.nftCollection);
    const marketplaceBytecode = await ethers.provider.getCode(deployment.marketplace);

    // Get compiled bytecode
    const VanaNFTCollection = await ethers.getContractFactory("VanaNFTCollection");
    const VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");

    // Compare bytecodes
    console.log("\nVerifying VanaNFTCollection...");
    if (nftBytecode === VanaNFTCollection.bytecode) {
        console.log("✅ NFT Collection bytecode matches");
    } else {
        console.log("❌ NFT Collection bytecode does not match");
    }

    console.log("\nVerifying VanaMarketplace...");
    if (marketplaceBytecode === VanaMarketplace.bytecode) {
        console.log("✅ Marketplace bytecode matches");
    } else {
        console.log("❌ Marketplace bytecode does not match");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 