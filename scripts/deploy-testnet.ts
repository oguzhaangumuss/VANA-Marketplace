import { ethers, upgrades } from "hardhat";
import { saveDeploymentInfo, verifyContract } from "./utils";

async function main() {
  console.log("Deploying Vana NFT Marketplace to testnet...");

  // Deploy VanaNFT
  const VanaNFT = await ethers.getContractFactory("VanaNFT");
  const vanaNFT = await upgrades.deployProxy(VanaNFT, [], {
    initializer: 'initialize',
  });
  await vanaNFT.waitForDeployment();
  const vanaNFTAddress = await vanaNFT.getAddress();
  console.log("VanaNFT deployed to:", vanaNFTAddress);

  // Deploy VanaMarketplace
  const VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");
  const marketplace = await upgrades.deployProxy(VanaMarketplace, [250], { // 2.5% fee
    initializer: 'initialize',
  });
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("VanaMarketplace deployed to:", marketplaceAddress);

  // Save deployment info
  await saveDeploymentInfo('testnet', {
    vanaNFT: vanaNFTAddress,
    marketplace: marketplaceAddress,
    timestamp: new Date().toISOString()
  });

  // Verify contracts
  await verifyContract(vanaNFTAddress, []);
  await verifyContract(marketplaceAddress, [250]);

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 