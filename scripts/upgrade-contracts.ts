// contract upgrade eğer bir değişiklik yapılırsa bunu kullanıyoruz
import { ethers, upgrades } from "hardhat";

async function main() {
    const SericaNFTCollection = await ethers.getContractFactory("SericaNFTCollection");
    
    console.log("Upgrading SericaNFTCollection...");
    
    // Mevcut kontrat adresini kullan
    const contractAddress = "0x30Cf3c87Fe99698C4ECE4032495f6A64A8f7E621";
    
    await upgrades.upgradeProxy(contractAddress, SericaNFTCollection);
    
    console.log("SericaNFTCollection upgraded successfully");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 