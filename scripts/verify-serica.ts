import { run } from "hardhat";
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { ethers } from "hardhat";

async function main() {
  const proxyAddress = "PROXY_ADDRESS"; // Deploy sonrası buraya proxy adresi gelecek
  
  // Implementation adresini al
  const implementationAddress = await getImplementationAddress(
    ethers.provider,
    proxyAddress
  );

  console.log("Verifying implementation contract...");
  
  try {
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: []
    });
    console.log("Implementation contract verified!");
  } catch (error) {
    console.log("Verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 