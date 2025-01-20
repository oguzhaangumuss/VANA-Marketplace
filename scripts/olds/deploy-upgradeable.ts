import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const NFTCollection = await ethers.getContractFactory("VanaNFTCollection");
    
    console.log("Deploying NFT Collection...");
    const nftCollection = await upgrades.deployProxy(NFTCollection, [
        "Main Test NFT Collection",
        "MainTest",
        20, // maxSupply
        "https://ipfs.io/ipfs/bafybeibdxmgjkhbh7h5nmkufb2huwhrttti6ygtp77i5rst7h42ifuap2e/metadata/",
        "https://ipfs.io/ipfs/bafybeibdxmgjkhbh7h5nmkufb2huwhrttti6ygtp77i5rst7h42ifuap2e/metadata/hidden.json",
        ethers.ZeroHash, // merkleRoot
        deployer.address, // royaltyReceiver
        250, // royaltyFee
        ethers.parseEther("0.01") // mintPrice
    ]);

    await nftCollection.waitForDeployment();
    console.log("NFT Collection deployed to:", nftCollection.target);

    // Implementation adresini al
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        nftCollection.target.toString()
    );
    console.log("Implementation address:", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 