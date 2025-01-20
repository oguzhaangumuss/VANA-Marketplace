import { ethers, network } from "hardhat";
import { loadDeployment } from "./utils";

async function main() {
    const NEW_BASE_URI = process.env.NEW_BASE_URI;
    if (!NEW_BASE_URI) {
        throw new Error("NEW_BASE_URI environment variable is required");
    }

    // Load deployment info
    const deployment = await loadDeployment(network.name);
    console.log(`Updating base URI on ${network.name}...`);

    // Get contract instance
    const nftCollection = await ethers.getContractAt(
        "VanaNFTCollection",
        deployment.nftCollection
    );

    // Update base URI
    const tx = await nftCollection.setBaseURI(NEW_BASE_URI);
    await tx.wait();

    console.log(`Base URI updated to: ${NEW_BASE_URI}`);
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 