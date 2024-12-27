import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying VanaAirdrop with account:", deployer.address);

    // VANA token adresi
    const VANA_TOKEN = "0x..."; // Vana token adresi
    const AIRDROP_AMOUNT = ethers.parseEther("100");
    const TOTAL_SUPPLY = ethers.parseEther("10000");
    
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + (7 * 24 * 60 * 60); // 1 hafta

    const VanaAirdrop = await ethers.getContractFactory("VanaAirdrop");
    const airdrop = await upgrades.deployProxy(VanaAirdrop, [
        VANA_TOKEN,
        AIRDROP_AMOUNT,
        startTime,
        endTime,
        TOTAL_SUPPLY
    ]);

    await airdrop.waitForDeployment();
    console.log("VanaAirdrop deployed to:", await airdrop.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 