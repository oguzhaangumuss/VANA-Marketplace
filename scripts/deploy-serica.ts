import { ethers, upgrades } from "hardhat";
import { SericaNFTCollection } from "../typechain-types";

interface DeployConfig {
  name: string;
  description: string;
  supply: number;
  token_uri: string;
  royalty_percent: number;
  royalty_wallet: string;
  iterated_uri: boolean;
  hidden_metadata: boolean;
  placeholder_token_uri: string;
  groups: {
    name: string;
    merkle_root: string | null;
    max_tokens: number;
    unit_price: number;
    mint_per_wallet: number;
    creators: {
      address: string;
      share: number;
    }[];
    start_time: string;
    end_time: string | null;
  }[];
}

async function main() {
  // Config dosyasını oku
  const config: DeployConfig = require("../config/serica-config.json");

  console.log("Deploying SericaNFTCollection...");

  const SericaNFTCollection = await ethers.getContractFactory("SericaNFTCollection");
  
  // Proxy ile deploy et
  const collection = await upgrades.deployProxy(SericaNFTCollection, [
    config.name,
    config.supply,
    config.token_uri,
    config.royalty_percent,
    config.royalty_wallet,
    config.iterated_uri,
    config.hidden_metadata,
    config.placeholder_token_uri
  ]) as unknown as SericaNFTCollection;

  await collection.waitForDeployment();
  console.log("SericaNFTCollection deployed to:", await collection.getAddress());

  // Creator'ları sadece bir kere ayarla
  console.log("Setting up creators...");
  const firstGroup = config.groups[0];
  if (firstGroup.creators.length > 0) {
    try {
      const creatorAddresses = firstGroup.creators.map(c => c.address);
      const creatorShares = firstGroup.creators.map(c => {
        const shareValue = Number(c.share) * 100;
        console.log(`Converting share ${c.share} to basis points: ${shareValue}`);
        return BigInt(shareValue);
      });
      await collection.setCreators(creatorAddresses, creatorShares);
    } catch (error) {
      console.error("Error setting up creators:", error);
      throw error;
    }
  }

  // Sonra grupları ayarla
  for (const group of config.groups) {
    console.log(`Setting up mint group: ${group.name}`);
    
    const startTime = Math.floor(new Date(group.start_time).getTime() / 1000);
    const endTime = group.end_time ? Math.floor(new Date(group.end_time).getTime() / 1000) : 0;
    
    try {
      const unitPrice = ethers.parseEther(group.unit_price.toString());
      console.log(`Unit price for group ${group.name}: ${unitPrice.toString()}`);

      console.log('Debug group parameters:', {
        name: group.name,
        merkleRoot: group.merkle_root || ethers.ZeroHash,
        maxTokens: group.max_tokens,
        unitPrice: unitPrice.toString(),
        mintPerWallet: group.mint_per_wallet,
        startTime,
        endTime
      });

      await collection.addMintGroup(
        group.name,
        group.merkle_root || ethers.ZeroHash,
        group.max_tokens,
        unitPrice,
        group.mint_per_wallet,
        startTime,
        endTime
      );
    } catch (error) {
      console.error(`Error setting up mint group ${group.name}:`, error);
      throw error;
    }
  }

  console.log("Deployment and configuration completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 