import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'hardhat';

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Updating frontend with account:", deployer.address);

    // Get deployment info
    const nftCollection = await ethers.getContractAt(
        "VanaNFTCollection",
        process.env.NFT_ADDRESS || ""
    );
    const marketplace = await ethers.getContractAt(
        "VanaMarketplace",
        process.env.MARKETPLACE_ADDRESS || ""
    );

    // Update .env.local for frontend
    const envContent = `
NEXT_PUBLIC_NETWORK_ID="${process.env.CHAIN_ID || "1337"}"
NEXT_PUBLIC_NFT_ADDRESS="${await nftCollection.getAddress()}"
NEXT_PUBLIC_MARKETPLACE_ADDRESS="${await marketplace.getAddress()}"
    `.trim();

    fs.writeFileSync(
        path.join(__dirname, '../frontend/.env.local'),
        envContent
    );

    console.log("Frontend configuration updated!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 