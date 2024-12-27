import { ethers, network } from "hardhat";
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("Deploying Test NFT Collection to Vana testnet...");

    const TestNFTCollection = await ethers.getContractFactory("TestNFTCollection");
    const collection = await TestNFTCollection.deploy();
    await collection.waitForDeployment();

    const address = await collection.getAddress();
    console.log("TestNFTCollection deployed to:", address);

    // Set base URI
    await collection.setBaseURI("https://api.oyblabs.com/metadata/");
    console.log("Base URI set");

    // Deployment bilgilerini kaydet
    const deploymentInfo = {
        network: network.name,
        address: address,
        timestamp: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        deployer: (await ethers.getSigners())[0].address
    };

    // Deployment bilgilerini dosyaya kaydet
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)){
        fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
        path.join(deploymentsDir, `${network.name}.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Deployment information saved");
    console.log("Deployment Info:", deploymentInfo);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 