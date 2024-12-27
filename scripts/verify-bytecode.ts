import { ethers, network } from "hardhat";
import fs from 'fs';
import path from 'path';

async function verifyBytecode(deployedAddress: string) {
    console.log("Verifying bytecode...");
    console.log("Contract address:", deployedAddress);

    try {
        // Deployed kontratın bytecode'unu al
        const deployedBytecode = await ethers.provider.getCode(deployedAddress);
        console.log("Deployed bytecode length:", deployedBytecode.length);

        // Kontrat factory'den beklenen bytecode'u al
        const TestNFTCollection = await ethers.getContractFactory("TestNFTCollection");
        const expectedBytecode = TestNFTCollection.bytecode;
        console.log("Expected bytecode length:", expectedBytecode.length);

        // Runtime bytecode'ları karşılaştır (constructor argümanları hariç)
        const isValid = deployedBytecode.includes(
            expectedBytecode.slice(2).substring(expectedBytecode.length - 100)
        );

        if (isValid) {
            console.log("✅ Bytecode verification successful!");
            return true;
        } else {
            console.log("❌ Bytecode verification failed!");
            console.log("Deployed bytecode:", deployedBytecode.slice(0, 100) + "...");
            console.log("Expected bytecode:", expectedBytecode.slice(0, 100) + "...");
            return false;
        }
    } catch (error) {
        console.error("Verification error:", error);
        return false;
    }
}

async function main() {
    // Deployment bilgilerini oku
    const deploymentsDir = path.join(__dirname, '../deployments');
    const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
    
    if (!fs.existsSync(deploymentFile)) {
        throw new Error(`Deployment file not found: ${deploymentFile}`);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    console.log("Deployment info loaded:", deploymentInfo);
    
    await verifyBytecode(deploymentInfo.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 