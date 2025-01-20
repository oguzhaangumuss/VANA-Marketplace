import { ethers, upgrades } from "hardhat";

async function main() {
    const PROXY_ADDRESS = "DEPLOYED_PROXY_ADDRESS";
    
    console.log("Upgrading SericaNFTCollection...");

    const SericaNFTCollection = await ethers.getContractFactory("SericaNFTCollection");
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, SericaNFTCollection);

    await upgraded.waitForDeployment();
    console.log("SericaNFTCollection upgraded");
    
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
    console.log("New implementation address:", implementationAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 