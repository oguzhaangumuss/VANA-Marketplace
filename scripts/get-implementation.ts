import { ethers, upgrades } from "hardhat";

async function main() {
  const proxyAddress = "0x30Cf3c87Fe99698C4ECE4032495f6A64A8f7E621";
  
  // Implementation adresini al
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("\nContract Addresses:");
  console.log("Proxy:", proxyAddress);
  console.log("Implementation:", implementationAddress);
}

main(); 