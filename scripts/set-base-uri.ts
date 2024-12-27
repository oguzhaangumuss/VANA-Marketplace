import { ethers } from "hardhat";

async function main() {
    // Kontrat adresinizi buraya yazın
    const COLLECTION_ADDRESS = "0x967B3ED6Db5843C3E56CEb833a26648b0A7b01eE"; // Sizin kontrat adresiniz
    
    // Yerel geliştirme için
    const BASE_URI = "http://localhost:3000/nft/metadata/";
    
    // Production için (siteniz yayına alındığında)
    // const BASE_URI = "https://your-website.com/nft/metadata/";

    try {
        const TestNFTCollection = await ethers.getContractFactory("TestNFTCollection");
        const collection = TestNFTCollection.attach(COLLECTION_ADDRESS);

        console.log("Setting base URI to:", BASE_URI);
        const tx = await collection.setBaseURI(BASE_URI);
        await tx.wait();
        
        console.log("Base URI set successfully!");
        console.log("Transaction hash:", tx.hash);
    } catch (error) {
        console.error("Error setting base URI:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 