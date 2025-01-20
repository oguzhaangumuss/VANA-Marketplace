import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { SericaNFTCollection } from "../typechain-types";

describe("SericaNFTCollection - Gas Tests", function () {
    async function deployFixture() {
        const [owner, user1] = await ethers.getSigners();
        
        const SericaNFTCollection = await ethers.getContractFactory("SericaNFTCollection");
        const collection = (await upgrades.deployProxy(SericaNFTCollection, [
            "Test Collection",
            1000,
            "https://api.test.com/",
            5,
            owner.address,
            true,
            false,
            "https://api.test.com/hidden.json"
        ])) as unknown as SericaNFTCollection;

        return { collection, owner, user1 };
    }

    describe("Gas Consumption", function () {
        it("Should optimize single mint gas usage", async function () {
            const { collection, user1 } = await loadFixture(deployFixture);
            
            // Mint grubu oluştur
            const now = await time.latest();
            await collection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                now + 3600
            );
            await time.increaseTo(now + 101);

            // Gas kullanımını ölç
            const tx = await collection.connect(user1).mint(
                "public",
                [],
                { value: ethers.parseEther("0.1") }
            );
            const receipt = await tx.wait();
            expect(receipt?.gasUsed).to.be.below(250000); // Maximum gas limiti
        });

        it("Should optimize batch mint gas usage", async function () {
            const { collection, user1 } = await loadFixture(deployFixture);
            
            // Mint grubu oluştur
            const now = await time.latest();
            await collection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                20,
                now + 100,
                now + 3600
            );
            await time.increaseTo(now + 101);

            // Gas kullanımını ölç
            const tx = await collection.connect(user1).batchMint(
                "public",
                [],
                5,
                { value: ethers.parseEther("0.5") }
            );
            const receipt = await tx.wait();
            
            // Her NFT başına ortalama gas kullanımı
            const gasPerNFT = receipt ? receipt.gasUsed / 5n : 0n;
            expect(gasPerNFT).to.be.below(200000); // NFT başına maximum gas limiti
        });
    });
}); 