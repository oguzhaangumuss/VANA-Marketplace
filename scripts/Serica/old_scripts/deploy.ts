import { ethers, upgrades, network } from "hardhat";
import { config } from "../../../config/serica/collection.config";
import { networks } from "../../../config/serica/networks.config";
import { Networks } from "../../../config/serica/types";

async function main() {
    // Network kontrolü
    if (!["hardhat", "localhost", "vana_testnet", "vana_mainnet"].includes(network.name)) {
        throw new Error("Invalid network");
    }

    console.log("Deploying SericaNFTCollection on", network.name);

    // Network spesifik config'i al
    const networkConfig = networks[network.name as keyof Networks];
    if (!networkConfig) {
        throw new Error(`No config found for network: ${network.name}`);
    }

    // Config'i network değerleriyle güncelle
    config.royalty_wallet = networkConfig.royalty_wallet;
    config.groups = config.groups.map(group => ({
        ...group,
        creators: group.creators.map((creator, index) => ({
            ...creator,
            address: networkConfig.creators[group.name][index]
        }))
    }));

    // Kontrat factory
    const SericaNFTCollection = await ethers.getContractFactory("SericaNFTCollection");
    
    console.log("Deploying proxy...");
    const collection = await upgrades.deployProxy(
        SericaNFTCollection,
        [
            config.name,
            config.supply,
            config.token_uri,
            config.royalty_percent,
            config.royalty_wallet,
            config.iterated_uri,
            config.hidden_metadata,
            config.placeholder_token_uri
        ]
    );

    await collection.waitForDeployment();
    console.log("Proxy deployed to:", collection.target);

    // Implementation adresini al
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        collection.target.toString()
    );
    console.log("Implementation deployed to:", implementationAddress);

    // Mint gruplarını ekle
    console.log("\nSetting up mint groups...");
    for (const group of config.groups) {
        console.log(`\nConfiguring group: ${group.name}`);
        
        // Unix timestamp'e çevir
        const startTime = Math.floor(new Date(group.start_time).getTime() / 1000);
        const endTime = group.end_time ? Math.floor(new Date(group.end_time).getTime() / 1000) : 0;

        // Grubu ekle
        await collection.addMintGroup(
            group.name,
            group.merkle_root || ethers.ZeroHash,
            group.max_tokens,
            ethers.parseEther(group.unit_price.toString()),
            group.mintPerWallet || 1,
            startTime,
            endTime
        );
        console.log(`Added mint group: ${group.name}`);

        // Creator'ları ayarla
        if (group.creators && group.creators.length > 0) {
            await collection.setCreators(
                group.creators.map(c => c.address),
                group.creators.map(c => c.share * 100)
            );
            console.log(`Set creators for group: ${group.name}`);
        }
    }

    // Deployment özeti
    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("Network:", network.name);
    console.log("Proxy:", collection.target);
    console.log("Implementation:", implementationAddress);
    console.log("Collection Name:", config.name);
    console.log("Total Supply:", config.supply);
    console.log("Groups:", config.groups.map(g => g.name).join(", "));
    
    // Verify komutu için bilgi
    console.log("\nTo verify the implementation contract:");
    console.log(`npx hardhat verify --network ${network.name} ${implementationAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 