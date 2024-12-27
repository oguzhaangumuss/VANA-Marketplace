import { run } from "hardhat";

async function verify(contractAddress: string, args: any[]) {
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      // REST API spesifik options
      apiEndpoint: "https://api.vanascan.org/api/v1/verify"
    });
  } catch (error) {
    console.error("Verification failed:", error);
  }
} 