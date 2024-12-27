import { ethers, network, upgrades } from "hardhat";
import { writeFileSync } from "fs";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deployment konfigürasyonu
    const config = {
        marketplaceFee: 250, // 2.5%
        stakingDailyRate: 100, // 1%
        stakingLockPeriod: 86400, // 1 gün
        airdropAmount: ethers.parseEther("100"),
        airdropDuration: 7 * 24 * 3600 // 1 hafta
    };

    // VANA Token deploy
    const VanaToken = await ethers.getContractFactory("VanaToken");
    const vanaToken = await upgrades.deployProxy(VanaToken, []);
    await vanaToken.waitForDeployment();
    console.log("VanaToken deployed to:", await vanaToken.getAddress());

    // VanaNFT deploy
    const VanaNFT = await ethers.getContractFactory("VanaNFT");
    const vanaNFT = await upgrades.deployProxy(VanaNFT, []);
    await vanaNFT.waitForDeployment();
    console.log("VanaNFT deployed to:", await vanaNFT.getAddress());

    // VanaStaking deploy
    const VanaStaking = await ethers.getContractFactory("VanaStaking");
    const staking = await upgrades.deployProxy(VanaStaking, [
        await vanaToken.getAddress(),
        await vanaNFT.getAddress(),
        config.stakingDailyRate,
        config.stakingLockPeriod
    ]);
    await staking.waitForDeployment();
    console.log("VanaStaking deployed to:", await staking.getAddress());

    // VanaAirdrop deploy
    const VanaAirdrop = await ethers.getContractFactory("VanaAirdrop");
    const startTime = Math.floor(Date.now() / 1000);
    const airdrop = await upgrades.deployProxy(VanaAirdrop, [
        await vanaToken.getAddress(),
        config.airdropAmount,
        startTime,
        startTime + config.airdropDuration,
        ethers.parseEther("1000000") // 1M token total supply
    ]);
    await airdrop.waitForDeployment();
    console.log("VanaAirdrop deployed to:", await airdrop.getAddress());

    // VanaMarketplace deploy
    const VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");
    const marketplace = await upgrades.deployProxy(VanaMarketplace, [
        config.marketplaceFee,
        await vanaToken.getAddress(),
        await staking.getAddress()
    ]);
    await marketplace.waitForDeployment();
    console.log("VanaMarketplace deployed to:", await marketplace.getAddress());

    // Kontrat adreslerini kaydet
    const addresses = {
        VanaToken: await vanaToken.getAddress(),
        VanaNFT: await vanaNFT.getAddress(),
        VanaStaking: await staking.getAddress(),
        VanaAirdrop: await airdrop.getAddress(),
        VanaMarketplace: await marketplace.getAddress()
    };

    writeFileSync(
        `deployments/${network.name}.json`,
        JSON.stringify(addresses, null, 2)
    );

    // Kontrat yetkilendirmeleri
    await vanaToken.grantRole(
        await vanaToken.MINTER_ROLE(),
        await airdrop.getAddress()
    );
    await vanaToken.grantRole(
        await vanaToken.MINTER_ROLE(),
        await staking.getAddress()
    );

    // NFT minting yetkisi
    await vanaNFT.grantRole(
        await vanaNFT.MINTER_ROLE(),
        await marketplace.getAddress()
    );

    console.log("Deployment completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 