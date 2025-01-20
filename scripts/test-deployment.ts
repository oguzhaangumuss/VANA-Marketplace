import { ethers } from "hardhat";
import { SericaNFTCollection } from "../typechain-types";
import { expect } from "chai";

async function main() {
  const proxyAddress = "0x30Cf3c87Fe99698C4ECE4032495f6A64A8f7E621"; // Son deploy edilen adres
  const collection = await ethers.getContractAt(
    "SericaNFTCollection",
    proxyAddress
  ) as unknown as SericaNFTCollection;

  console.log("Testing deployment...");

  // 1. Basic Contract Info
  console.log("\nChecking basic info:");
  const name = await collection.name();
  const supply = await collection.supply();
  const baseURI = await collection.tokenBaseURI();
  console.log(`Name: ${name}`);
  console.log(`Supply: ${supply}`);
  console.log(`Base URI: ${baseURI}`);

  // 2. Mint Groups
  console.log("\nChecking mint groups:");
  const [names, maxTokens, unitPrices, startTimes, endTimes, mintedCounts, activeStates] = 
    await collection.getAllGroups();
  
  for(let i = 0; i < names.length; i++) {
    console.log(`\nGroup ${i + 1}:`);
    console.log(`Name: ${names[i]}`);
    console.log(`Max Tokens: ${maxTokens[i]}`);
    console.log(`Unit Price: ${ethers.formatEther(unitPrices[i])} ETH`);
    console.log(`Start Time: ${new Date(Number(startTimes[i]) * 1000).toISOString()}`);
    console.log(`End Time: ${endTimes[i] > 0 ? new Date(Number(endTimes[i]) * 1000).toISOString() : 'No end time'}`);
    console.log(`Minted: ${mintedCounts[i]}`);
    console.log(`Active: ${activeStates[i]}`);
  }

  // 3. Creator Settings
  console.log("\nChecking creator settings:");
  const creator = await collection.creators(0);
  console.log(`Creator Address: ${creator[0]}`);
  console.log(`Creator Share: ${creator[1]}%`);

  console.log("\nDeployment test completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 