import { ethers } from "hardhat";

async function main() {
    const NEW_BASE_URI = "ipfs://bafybeibdxmgjkhbh7h5nmkufb2huwhrttti6ygtp77i5rst7h42ifuap2e/metadata/";
    const PROXY_ADDRESS = "0x30Cf3c87Fe99698C4ECE4032495f6A64A8f7E621";

    console.log("Updating baseURI to:", NEW_BASE_URI);

    const nft = await ethers.getContractAt("SericaNFTCollection", PROXY_ADDRESS);
    const tx = await nft.setBaseURI(NEW_BASE_URI);
    await tx.wait();

    console.log("BaseURI updated successfully!");
    
    // Verify
    const currentURI = await nft.tokenBaseURI();
    console.log("Current baseURI:", currentURI);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 