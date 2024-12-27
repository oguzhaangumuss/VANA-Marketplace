import { ethers, upgrades } from "hardhat";

async function main() {
  // VanaNFT deploy
  const VanaNFT = await ethers.getContractFactory("VanaNFT");
  const vanaNFT = await upgrades.deployProxy(VanaNFT, [], {
    initializer: 'initialize',
  });
  await vanaNFT.waitForDeployment();
  console.log("VanaNFT deployed to:", await vanaNFT.getAddress());

  // VanaMarketplace deploy
  const VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");
  const marketplace = await upgrades.deployProxy(VanaMarketplace, [250], { // 2.5% fee
    initializer: 'initialize',
  });
  await marketplace.waitForDeployment();
  console.log("VanaMarketplace deployed to:", await marketplace.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 