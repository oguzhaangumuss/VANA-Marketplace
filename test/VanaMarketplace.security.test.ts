import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VanaMarketplace Security", function () {
    let marketplace, vanaNFT, vanaToken, owner, attacker, user;
    
    beforeEach(async function () {
        [owner, attacker, user] = await ethers.getSigners();
        
        // Kontratları deploy et
        const VanaNFT = await ethers.getContractFactory("VanaNFT");
        vanaNFT = await upgrades.deployProxy(VanaNFT, []);
        
        const VanaToken = await ethers.getContractFactory("VanaToken");
        vanaToken = await upgrades.deployProxy(VanaToken, []);
        
        const VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");
        marketplace = await upgrades.deployProxy(VanaMarketplace, [250]);
    });

    describe("Reentrancy Protection", function () {
        it("Should prevent reentrancy in buyNFT", async function () {
            // Malicious NFT contract that attempts reentrancy
            const MaliciousNFT = await ethers.getContractFactory("MaliciousNFT");
            const maliciousNFT = await MaliciousNFT.deploy(marketplace.address);
            
            await marketplace.connect(owner).approveCollection(maliciousNFT.address);
            await maliciousNFT.connect(attacker).mint();
            
            await expect(
                maliciousNFT.connect(attacker).attack()
            ).to.be.revertedWith("ReentrancyGuard: reentrant call");
        });
    });

    describe("Access Control", function () {
        it("Should prevent unauthorized collection approvals", async function () {
            await expect(
                marketplace.connect(attacker).approveCollection(vanaNFT.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should prevent unauthorized fee changes", async function () {
            await expect(
                marketplace.connect(attacker).setMarketplaceFee(500)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Input Validation", function () {
        it("Should validate listing price", async function () {
            await vanaNFT.mint(user.address, "uri1");
            await vanaNFT.connect(user).approve(marketplace.address, 1);
            
            await expect(
                marketplace.connect(user).listNFT(vanaNFT.address, 1, 0)
            ).to.be.revertedWith("Invalid price");
        });

        it("Should validate token approvals", async function () {
            await vanaNFT.mint(user.address, "uri1");
            // No approval given
            await expect(
                marketplace.connect(user).listNFT(vanaNFT.address, 1, ethers.parseEther("1"))
            ).to.be.reverted;
        });
    });

    describe("State Management", function () {
        it("Should handle paused state correctly", async function () {
            await marketplace.connect(owner).pause();
            
            await vanaNFT.mint(user.address, "uri1");
            await vanaNFT.connect(user).approve(marketplace.address, 1);
            
            await expect(
                marketplace.connect(user).listNFT(vanaNFT.address, 1, ethers.parseEther("1"))
            ).to.be.revertedWith("Pausable: paused");
        });

        it("Should prevent double listings", async function () {
            await vanaNFT.mint(user.address, "uri1");
            await vanaNFT.connect(user).approve(marketplace.address, 1);
            
            await marketplace.connect(user).listNFT(
                vanaNFT.address, 
                1, 
                ethers.parseEther("1")
            );
            
            await expect(
                marketplace.connect(user).listNFT(
                    vanaNFT.address,
                    1,
                    ethers.parseEther("1")
                )
            ).to.be.revertedWith("NFT already listed");
        });
    });

    describe("Economic Security", function () {
        it("Should enforce maximum fee limit", async function () {
            await expect(
                marketplace.connect(owner).setMarketplaceFee(1001) // > 10%
            ).to.be.revertedWith("Fee too high");
        });

        it("Should handle royalty payments correctly", async function () {
            await marketplace.connect(owner).setCollectionRoyalty(
                vanaNFT.address,
                500 // 5%
            );
            
            // Test royalty distribution in sales
            // ... implementation ...
        });
    });
}); 