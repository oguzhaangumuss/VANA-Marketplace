import { ethers, network } from "hardhat";
import { saveDeployment } from "./utils";

const DEPLOYMENT_PARAMS = {
    name: "Main Test NFT Collection",
    symbol: "MainTest",
    maxSupply: 20,
    mintPrice: "0.01",
    baseURI: "https://ipfs.io/ipfs/bafybeibdxmgjkhbh7h5nmkufb2huwhrttti6ygtp77i5rst7h42ifuap2e/metadata/",
    hiddenURI: "https://ipfs.io/ipfs/bafybeibdxmgjkhbh7h5nmkufb2huwhrttti6ygtp77i5rst7h42ifuap2e/metadata/hidden.json",
    royaltyFee: 250 // 2.5%
};

async function main() {
    // Network kontrolü - sadece testnet ve local ağlara izin ver
    if (!["hardhat", "localhost", "vana_testnet"].includes(network.name)) {
        throw new Error("Invalid network. Use hardhat, localhost or vana_testnet");
    }

    const [deployer] = await ethers.getSigners();
    console.log("Deploying collection with account:", deployer.address);
    console.log("Network:", network.name);

    // Deploy collection
    const NFTCollection = await ethers.getContractFactory("VanaNFTCollection");
    const nftCollection = await NFTCollection.deploy(
        DEPLOYMENT_PARAMS.name,
        DEPLOYMENT_PARAMS.symbol,
        DEPLOYMENT_PARAMS.maxSupply,
        DEPLOYMENT_PARAMS.baseURI,
        DEPLOYMENT_PARAMS.hiddenURI,
        ethers.ZeroHash, // merkle root - whitelist için
        deployer.address, // royalty recipient
        DEPLOYMENT_PARAMS.royaltyFee
    );
    await nftCollection.waitForDeployment();

    console.log("Collection deployed to:", nftCollection.target);

    // Test mint işlemi sadece local ağlarda yapılsın
    if (["hardhat", "localhost"].includes(network.name)) {
        for (let i = 0; i < 5; i++) {
            await nftCollection.mint(deployer.address);
            console.log(`Minted NFT #${i + 1} to ${deployer.address}`);
        }
    }

    // Deployment bilgilerini kaydet
    const deploymentInfo = {
        network: network.name,
        nftCollection: nftCollection.target,
        deployer: deployer.address,
        params: {
            ...DEPLOYMENT_PARAMS,
            mintPrice: DEPLOYMENT_PARAMS.mintPrice.toString()
        },
        timestamp: new Date().toISOString()
    };
    await saveDeployment(deploymentInfo);

    console.log("Deployment completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 