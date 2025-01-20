import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

export interface DeploymentInfo {
    network: string;
    nftCollection: string;
    deployer: string;
    params?: any;
    timestamp: string;
}

export async function saveDeployment(deploymentInfo: DeploymentInfo) {
    const network = deploymentInfo.network;
    const filename = `deployments/${network}.json`;
    
    // Dizin yoksa oluştur
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Mevcut deployments varsa oku, yoksa boş array oluştur
    let deployments: DeploymentInfo[] = [];
    if (fs.existsSync(filename)) {
        try {
            const content = fs.readFileSync(filename, 'utf8');
            const parsed = JSON.parse(content);
            // Array kontrolü yap
            deployments = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn("Error reading existing deployments, starting fresh");
            deployments = [];
        }
    }

    // Yeni deployment'ı ekle
    deployments.push(deploymentInfo);

    // Dosyaya kaydet
    fs.writeFileSync(
        filename,
        JSON.stringify(deployments, null, 2)
    );

    console.log(`Deployment saved to ${filename}`);
}

export async function loadDeployment(network: string): Promise<DeploymentInfo> {
    const filePath = path.join(__dirname, "../deployments", `${network}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`No deployment found for network: ${network}`);
    }

    const deployments = JSON.parse(fs.readFileSync(filePath, "utf8"));
    // En son deployment'ı döndür
    return Array.isArray(deployments) ? deployments[deployments.length - 1] : deployments;
}

export async function setupRoles(
    nftCollection: string,
    marketplace: string,
    minterAddresses: string[]
) {
    const nft = await ethers.getContractAt("VanaNFTCollection", nftCollection);
    const MINTER_ROLE = await nft.MINTER_ROLE();

    for (const address of minterAddresses) {
        if (!(await nft.hasRole(MINTER_ROLE, address))) {
            await nft.grantRole(MINTER_ROLE, address);
            console.log(`Granted MINTER_ROLE to ${address}`);
        }
    }

    // Verify marketplace as a trusted operator
    await nft.setApprovalForAll(marketplace, true);
    console.log(`Marketplace approved as operator`);
} 