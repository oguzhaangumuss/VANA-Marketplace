import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VanaMarketplace Audit Checks", function () {
    let marketplace, vanaNFT, vanaToken, owner, user1, user2;

    describe("Integer Overflow/Underflow", function () {
        it("Should handle max uint256 values safely", async function () {
            const maxUint256 = ethers.MaxUint256;
            await expect(
                marketplace.listNFT(vanaNFT.address, 1, maxUint256)
            ).to.be.revertedWith("Price too high");
        });

        it("Should handle fee calculations safely", async function () {
            const highPrice = ethers.parseEther("1000000000"); // 1 billion ETH
            // Test fee hesaplamalarının overflow'a neden olmamasını
        });
    });

    describe("Access Control Completeness", function () {
        it("Should verify all privileged operations", async function () {
            // Tüm admin fonksiyonlarını kontrol et
            const adminFunctions = [
                "setMarketplaceFee",
                "approveCollection",
                "setCollectionRoyalty",
                "pause",
                "unpause"
            ];

            for (const func of adminFunctions) {
                await expect(
                    marketplace.connect(user1)[func]()
                ).to.be.revertedWith("Ownable: caller is not the owner");
            }
        });
    });

    describe("State Machine Transitions", function () {
        it("Should handle all listing state transitions correctly", async function () {
            // Liste -> Satış -> İptal durumlarını test et
            await vanaNFT.mint(user1.address, "uri1");
            await vanaNFT.connect(user1).approve(marketplace.address, 1);
            
            // Listeleme
            await marketplace.connect(user1).listNFT(
                vanaNFT.address,
                1,
                ethers.parseEther("1")
            );
            
            // Satış
            await marketplace.connect(user2).buyNFT(1);
            
            // Satılmış NFT'nin tekrar listelenmesini engelle
            await expect(
                marketplace.connect(user1).listNFT(
                    vanaNFT.address,
                    1,
                    ethers.parseEther("1")
                )
            ).to.be.revertedWith("NFT already listed");
        });
    });

    describe("Economic Model", function () {
        it("Should verify fee distribution accuracy", async function () {
            const price = ethers.parseEther("1");
            const fee = price * BigInt(250) / BigInt(10000); // 2.5%
            
            // Satış öncesi bakiyeleri kaydet
            const sellerBalanceBefore = await ethers.provider.getBalance(user1.address);
            
            // Satış işlemi
            await marketplace.connect(user2).buyNFT(1, { value: price });
            
            // Bakiyeleri kontrol et
            const sellerBalanceAfter = await ethers.provider.getBalance(user1.address);
            expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(price - fee);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero address inputs", async function () {
            await expect(
                marketplace.approveCollection(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid address");
        });

        it("Should handle invalid token IDs", async function () {
            await expect(
                marketplace.listNFT(vanaNFT.address, 0, ethers.parseEther("1"))
            ).to.be.revertedWith("Invalid tokenId");
        });
    });
}); 