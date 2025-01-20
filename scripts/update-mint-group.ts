import { ethers } from "hardhat";
import { ZeroHash } from "ethers";

async function main() {
    const contractAddress = "0x30Cf3c87Fe99698C4ECE4032495f6A64A8f7E621";
    const contract = await ethers.getContractAt("SericaNFTCollection", contractAddress);

    // Grup adı
    const groupName = ["public", "whitelist"]; // veya "whitelist"

    try {
        // Mevcut grup bilgilerini al
        const group1 = await contract.getMintGroup(groupName[0]);
        console.log("Current group info:", {
            name: groupName[0],
            merkleRoot: group1.merkleRoot,
            maxTokens: group1.maxTokens,
            currentPrice: ethers.formatEther(group1.unitPrice),
            mintPerWallet: group1.mintPerWallet || 5,
            startTime: new Date(Number(group1.startTime) * 1000),
            endTime: new Date(Number(group1.endTime) * 1000)
        });

        const group2 = await contract.getMintGroup(groupName[1]);
        console.log("Current group info:", {
            name: groupName[1],
            merkleRoot: group2.merkleRoot,
            maxTokens: group2.maxTokens,
            currentPrice: ethers.formatEther(group2.unitPrice),
            mintPerWallet: group2.mintPerWallet || 5,
            startTime: new Date(Number(group2.startTime) * 1000),
            endTime: new Date(Number(group2.endTime) * 1000)
        });
        // Yeni değerler
        const newValues1 = {
            name: groupName[1],
            merkleRoot: ZeroHash, // Public mint için merkle root yok
            maxTokens: 10,        // Maksimum 10 NFT
            unitPrice: ethers.parseEther("0.1"),  // 0.1 VANA
            mintPerWallet: 4,     // Cüzdan başına 4 NFT
            startTime: Math.floor(Date.now() / 1000),  // şu an
            endTime: Math.floor(Date.now() / 1000) +  (60 * 60 * 3 ) + 5  // 3 saat sonra bitir (UTC + 3 olduğu için 3 saat)
        };

        // Yeni değerler
        const newValues2 = {
            name: groupName[0],
            merkleRoot: ZeroHash, // Public mint için merkle root yok
            maxTokens: 10,        // Maksimum 10 NFT
            unitPrice: ethers.parseEther("0.2"),  // 0.2 VANA
            mintPerWallet: 4,     // Cüzdan başına 4 NFT
            startTime: Math.floor(Date.now() / 1000 + (60 * 60 * 4)),  // 1 saat sonra başla (UTC + 3 olduğu için 4 saat)
            endTime: Math.floor(Date.now() / 1000) + ( (60 * 60 * 4) + (7 * 24 * 60 * 60))  // 1 saat + 7 tane * 24 tane * 60 dakika * 60 saniye (UTC + 3 olduğu için 4 saat)
        };

        console.log("New values:", {
            ...newValues1,
            startTime: new Date(newValues1.startTime * 1000),
            endTime: new Date(newValues1.endTime * 1000)
        });
        console.log("New values:", {
            ...newValues2,
            startTime: new Date(newValues2.startTime * 1000),
            endTime: new Date(newValues2.endTime * 1000)
        });
        

        // Tüm parametreleri BigNumber'a çevir
        const params1 = {
            name: newValues1.name,
            merkleRoot: newValues1.merkleRoot,
            maxTokens: BigInt(newValues1.maxTokens),
            unitPrice: BigInt(newValues1.unitPrice),
            mintPerWallet: BigInt(newValues1.mintPerWallet),
            startTime: BigInt(newValues1.startTime),
            endTime: BigInt(newValues1.endTime)
        };
        // Tüm parametreleri BigNumber'a çevir
        const params2 = {
            name: newValues2.name,
            merkleRoot: newValues2.merkleRoot,
            maxTokens: BigInt(newValues2.maxTokens),
            unitPrice: BigInt(newValues2.unitPrice),
            mintPerWallet: BigInt(newValues2.mintPerWallet),
            startTime: BigInt(newValues2.startTime),
            endTime: BigInt(newValues2.endTime)
        };

        // Whitelist mint için güncelleme işlemi
        const tx1 = await contract.updateMintGroup(
            params1.name,
            params1.merkleRoot,
            params1.maxTokens,
            params1.unitPrice,
            params1.mintPerWallet,
            params1.startTime,
            params1.endTime
        );
        // Public mint için güncelleme işlemi
        const tx2 = await contract.updateMintGroup(
            params2.name,
            params2.merkleRoot,
            params2.maxTokens,
            params2.unitPrice,
            params2.mintPerWallet,
            params2.startTime,
            params2.endTime
        );

            
        console.log("Update transaction sent:", tx1.hash);
        await tx1.wait();
        console.log("{groupName[0]} updated successfully!");

        console.log("Update transaction sent:", tx2.hash);
        await tx2.wait();
        console.log("{groupName[1]} updated successfully!");

        // Whitelist mint için güncellenen grup bilgilerini kontrol et
        const updatedGroup1 = await contract.getMintGroup(groupName[0]);
        console.log("Updated group info:", {
            name: groupName[0],
            maxTokens: updatedGroup1.maxTokens,
            newPrice: ethers.formatEther(updatedGroup1.unitPrice),
            mintPerWallet: updatedGroup1.mintPerWallet,
            startTime: new Date(Number(updatedGroup1.startTime) * 1000),
            endTime: new Date(Number(updatedGroup1.endTime) * 1000)
        });
        // Public mint için güncellenen grup bilgilerini kontrol et
        const updatedGroup2 = await contract.getMintGroup(groupName[1]);
        console.log("Updated group info:", {
            name: groupName[1],
            maxTokens: updatedGroup2.maxTokens,
            newPrice: ethers.formatEther(updatedGroup2.unitPrice),
            mintPerWallet: updatedGroup2.mintPerWallet,
            startTime: new Date(Number(updatedGroup2.startTime) * 1000),
            endTime: new Date(Number(updatedGroup2.endTime) * 1000)
        });

    } catch (error) {
        console.error("Error:", error);
        if (typeof error === 'object' && error !== null && 'error' in error) {
            console.error("Detailed error:", error.error);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 