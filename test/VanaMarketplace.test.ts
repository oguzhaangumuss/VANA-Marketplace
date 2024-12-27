import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VanaMarketplace", function () {
  let VanaNFT;
  let vanaNFT: Contract;
  let VanaMarketplace;
  let marketplace: Contract;
    let owner: HardhatEthersSigner;
    let seller: HardhatEthersSigner;
    let buyer: HardhatEthersSigner;
    let bidder1: HardhatEthersSigner;
    let bidder2: HardhatEthersSigner;
    let addrs: HardhatEthersSigner[];
    let marketplaceAddress: string;
    let vanaNFTAddress: string;

    const INITIAL_FEE = 250; // 2.5%

  beforeEach(async function () {
        [owner, seller, buyer, bidder1, bidder2, ...addrs] = await ethers.getSigners();

        // Deploy VanaNFT
    VanaNFT = await ethers.getContractFactory("VanaNFT");
        vanaNFT = await upgrades.deployProxy(VanaNFT, [], {
            initializer: 'initialize',
        });
        await vanaNFT.waitForDeployment();
        vanaNFTAddress = await vanaNFT.getAddress();

        // Deploy VanaMarketplace
    VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");
        marketplace = await upgrades.deployProxy(VanaMarketplace, [INITIAL_FEE], {
            initializer: 'initialize',
        });
        await marketplace.waitForDeployment();
        marketplaceAddress = await marketplace.getAddress();
    });

    describe("Initialization", function () {
        it("Should set the correct initial fee", async function () {
            expect(await marketplace.marketplaceFee()).to.equal(INITIAL_FEE);
        });

        it("Should set the correct owner", async function () {
            expect(await marketplace.owner()).to.equal(owner.address);
        });

        it("Should not be paused initially", async function () {
            expect(await marketplace.paused()).to.be.false;
        });

        it("Should not allow reinitialization", async function () {
            await expect(
                marketplace.initialize(INITIAL_FEE)
            ).to.be.revertedWith("Initializable: contract is already initialized");
        });
    });

    describe("Upgrades", function () {
        it("Should allow owner to upgrade", async function () {
            const VanaMarketplaceV2 = await ethers.getContractFactory("VanaMarketplace");
            const upgraded = await upgrades.upgradeProxy(marketplaceAddress, VanaMarketplaceV2);
            expect(await upgraded.getAddress()).to.equal(marketplaceAddress);
        });
  });

  describe("Listing", function () {
        it("Should list an NFT and emit NFTListed event", async function () {
      const tokenURI = "https://example.com/token/1";
            const price = ethers.parseEther("1");
      await vanaNFT.mint(seller.address, tokenURI);
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
      
            await expect(marketplace.connect(seller).listNFT(vanaNFTAddress, 1, price))
                .to.emit(marketplace, "NFTListed")
                .withArgs(1, seller.address, vanaNFTAddress, 1, price);
      
      const listing = await marketplace.listings(1);
      expect(listing.seller).to.equal(seller.address);
            expect(listing.price).to.equal(price);
            expect(listing.active).to.be.true;
        });

        it("Should track multiple listings correctly", async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                1, 
                ethers.parseEther("1")
            );

            await vanaNFT.mint(seller.address, "uri2");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 2);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                2, 
                ethers.parseEther("2")
            );

            const listing1 = await marketplace.listings(1);
            const listing2 = await marketplace.listings(2);
            expect(listing1.tokenId).to.equal(1);
            expect(listing2.tokenId).to.equal(2);
        });
    });

    describe("Buying", function () {
        let listingPrice: bigint;

        beforeEach(async function () {
            listingPrice = ethers.parseEther("1");
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                1, 
                listingPrice
            );
        });

        it("Should emit NFTSold event on successful purchase", async function () {
            await expect(marketplace.connect(buyer).buyNFT(1, { value: listingPrice }))
                .to.emit(marketplace, "NFTSold")
                .withArgs(1, seller.address, buyer.address, listingPrice);
        });

        it("Should handle multiple purchases correctly", async function () {
            // İkinci NFT'yi hazırla
            await vanaNFT.mint(seller.address, "uri2");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 2);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                2, 
                listingPrice
            );

            // İlk NFT'yi satın al
            await marketplace.connect(buyer).buyNFT(1, { value: listingPrice });
            expect(await vanaNFT.ownerOf(1)).to.equal(buyer.address);

            // İkinci NFT'yi farklı bir alıcıyla satın al
            await marketplace.connect(addrs[0]).buyNFT(2, { value: listingPrice });
            expect(await vanaNFT.ownerOf(2)).to.equal(addrs[0].address);
        });

        it("Should fail when trying to buy an already sold NFT", async function () {
            await marketplace.connect(buyer).buyNFT(1, { value: listingPrice });
            
            await expect(
                marketplace.connect(addrs[0]).buyNFT(1, { value: listingPrice })
            ).to.be.revertedWith("Listing is not active");
        });

        it("Should fail when seller tries to buy their own NFT", async function () {
            await expect(
                marketplace.connect(seller).buyNFT(1, { value: listingPrice })
            ).to.be.revertedWith("Seller cannot buy their own NFT");
        });
    });

    describe("Canceling", function () {
        beforeEach(async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                1, 
                ethers.parseEther("1")
            );
        });

        it("Should emit ListingCanceled event", async function () {
            await expect(marketplace.connect(seller).cancelListing(1))
                .to.emit(marketplace, "ListingCanceled")
                .withArgs(1, seller.address);
        });

        it("Should not allow buying canceled listing", async function () {
            await marketplace.connect(seller).cancelListing(1);
            
            await expect(
                marketplace.connect(buyer).buyNFT(1, { 
                    value: ethers.parseEther("1") 
                })
            ).to.be.revertedWith("Listing is not active");
        });
    });

    describe("Gas Usage", function () {
        it("Should track gas usage for listing", async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            
            const tx = await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                1, 
                ethers.parseEther("1")
            );
            const receipt = await tx.wait();
            console.log(`Gas used for listing: ${receipt.gasUsed}`);
        });

        it("Should track gas usage for buying", async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                1, 
                ethers.parseEther("1")
            );

            const tx = await marketplace.connect(buyer).buyNFT(1, {
                value: ethers.parseEther("1")
            });
            const receipt = await tx.wait();
            console.log(`Gas used for buying: ${receipt?.gasUsed}`);
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle re-entrancy attack simulation", async function () {
            // Bu test basit bir re-entrancy kontrolü yapar
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                1, 
                ethers.parseEther("1")
            );

            // Aynı anda birden fazla satın alma denemesi
            await expect(
                Promise.all([
                    marketplace.connect(buyer).buyNFT(1, { 
                        value: ethers.parseEther("1") 
                    }),
                    marketplace.connect(addrs[0]).buyNFT(1, { 
                        value: ethers.parseEther("1") 
                    })
                ])
            ).to.be.reverted;
        });

        it("Should not allow listing already listed NFT", async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress, 
                1, 
                ethers.parseEther("1")
            );

            // Aynı NFT'yi tekrar listelemeye çalış
            await expect(
                marketplace.connect(seller).listNFT(
                    vanaNFTAddress, 
                    1, 
                    ethers.parseEther("2")
                )
            ).to.be.reverted;
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to pause and unpause", async function () {
            await marketplace.pause();
            expect(await marketplace.paused()).to.be.true;

            // Listeleme işlemi pause durumunda hata vermeli
            await expect(
                marketplace.connect(seller).listNFT(
                    vanaNFTAddress,
                    1,
                    ethers.parseEther("1")
                )
            ).to.be.revertedWith("Pausable: paused");

            await marketplace.unpause();
            expect(await marketplace.paused()).to.be.false;
        });

        it("Should allow owner to set marketplace fee", async function () {
            await expect(marketplace.setMarketplaceFee(500))
                .to.emit(marketplace, "MarketplaceFeeUpdated")
                .withArgs(500);

            expect(await marketplace.marketplaceFee()).to.equal(500);
        });

        it("Should not allow non-owner to set fee", async function () {
            await expect(
                marketplace.connect(seller).setMarketplaceFee(500)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Marketplace Fees", function () {
        let listingPrice: bigint;

        beforeEach(async function () {
            listingPrice = ethers.parseEther("1");
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress,
                1,
                listingPrice
            );
        });

        it("Should correctly handle marketplace fees on sale", async function () {
            const initialContractBalance = await ethers.provider.getBalance(marketplaceAddress);
            const initialSellerBalance = await ethers.provider.getBalance(seller.address);

            await marketplace.connect(buyer).buyNFT(1, { value: listingPrice });

            const fee = (listingPrice * BigInt(250)) / BigInt(10000);
            const sellerAmount = listingPrice - fee;

            const finalContractBalance = await ethers.provider.getBalance(marketplaceAddress);
            const finalSellerBalance = await ethers.provider.getBalance(seller.address);

            expect(finalContractBalance - initialContractBalance).to.equal(fee);
            expect(finalSellerBalance - initialSellerBalance).to.equal(sellerAmount);
        });

        it("Should accumulate fees from multiple sales", async function () {
            const initialContractBalance = await ethers.provider.getBalance(marketplaceAddress);
            await marketplace.connect(buyer).buyNFT(1, { value: listingPrice });

            const feePerSale = (listingPrice * BigInt(250)) / BigInt(10000);
            const finalContractBalance = await ethers.provider.getBalance(marketplaceAddress);

            expect(finalContractBalance - initialContractBalance).to.equal(feePerSale);
        });
    });

    describe("Offers", function () {
        beforeEach(async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress,
                1,
                ethers.parseEther("1")
            );
        });

        it("Should allow making offers", async function () {
            await expect(
                marketplace.connect(bidder1).makeOffer(1, {
                    value: ethers.parseEther("0.8")
                })
            ).to.emit(marketplace, "OfferPlaced")
            .withArgs(1, bidder1.address, ethers.parseEther("0.8"));

            const offers = await marketplace.getOffers(1);
            expect(offers.length).to.equal(1);
            expect(offers[0].bidder).to.equal(bidder1.address);
            expect(offers[0].amount).to.equal(ethers.parseEther("0.8"));
        });

        it("Should allow accepting offers", async function () {
            await marketplace.connect(bidder1).makeOffer(1, {
                value: ethers.parseEther("0.8")
            });

            await marketplace.connect(bidder2).makeOffer(1, {
                value: ethers.parseEther("0.9")
            });

            const initialBidder2Balance = await ethers.provider.getBalance(bidder2.address);

            await marketplace.connect(seller).acceptOffer(1, 0); // Accept first offer

            expect(await vanaNFT.ownerOf(1)).to.equal(bidder1.address);

            const finalBidder2Balance = await ethers.provider.getBalance(bidder2.address);
            expect(finalBidder2Balance - initialBidder2Balance).to.equal(ethers.parseEther("0.9"));
        });

        it("Should refund offers when listing is canceled", async function () {
            await marketplace.connect(bidder1).makeOffer(1, {
                value: ethers.parseEther("0.8")
            });

            const initialBidder1Balance = await ethers.provider.getBalance(bidder1.address);

            await marketplace.connect(seller).cancelListing(1);

            const finalBidder1Balance = await ethers.provider.getBalance(bidder1.address);
            const difference = finalBidder1Balance - initialBidder1Balance;
            
            // Gas maliyeti nedeniyle tam eşitlik yerine yaklaşık kontrol
            expect(difference).to.be.closeTo(
                ethers.parseEther("0.8"), 
                ethers.parseEther("0.01")
            );
        });
    });

    describe("Price Updates", function () {
        beforeEach(async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress,
                1,
                ethers.parseEther("1")
            );
        });

        it("Should allow seller to update price", async function () {
            const newPrice = ethers.parseEther("2");
            
            await expect(
                marketplace.connect(seller).updateListingPrice(1, newPrice)
            ).to.emit(marketplace, "PriceUpdated")
            .withArgs(1, newPrice);

            const listing = await marketplace.listings(1);
            expect(listing.price).to.equal(newPrice);
        });

        it("Should not allow non-seller to update price", async function () {
            await expect(
                marketplace.connect(buyer).updateListingPrice(
                    1,
                    ethers.parseEther("2")
                )
            ).to.be.revertedWith("Not the seller");
        });
    });

    describe("Fee Withdrawal", function () {
        it("Should allow owner to withdraw accumulated fees", async function () {
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                vanaNFTAddress,
                1,
                ethers.parseEther("1")
            );

            await marketplace.connect(buyer).buyNFT(1, {
                value: ethers.parseEther("1")
            });

            const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
            await marketplace.connect(owner).withdrawFees();
            const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

            // Gas maliyeti nedeniyle yaklaşık kontrol
            expect(finalOwnerBalance - initialOwnerBalance).to.be.closeTo(
                ethers.parseEther("0.025"), // 2.5% of 1 ETH
                ethers.parseEther("0.01") // Allow for gas costs
            );
        });

        it("Should not allow non-owner to withdraw fees", async function () {
            await expect(
                marketplace.connect(seller).withdrawFees()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("VANA Token Integration", function () {
        let mockVanaToken;

        beforeEach(async function () {
            // Mock VANA token deploy
            const MockVanaToken = await ethers.getContractFactory("MockVanaToken");
            mockVanaToken = await MockVanaToken.deploy();
            await mockVanaToken.waitForDeployment();

            // VanaMarketplace deploy with VANA token
            VanaMarketplace = await ethers.getContractFactory("VanaMarketplace");
            marketplace = await upgrades.deployProxy(VanaMarketplace, [
                INITIAL_FEE,
                await mockVanaToken.getAddress()
            ]);
            await marketplace.waitForDeployment();

            // VANA token dağıtımı
            await mockVanaToken.mint(buyer.address, ethers.parseEther("1000"));
            await mockVanaToken.mint(bidder1.address, ethers.parseEther("1000"));
            await mockVanaToken.mint(bidder2.address, ethers.parseEther("1000"));
        });

        it("Should handle VANA payments correctly", async function () {
            // NFT listele
            await vanaNFT.mint(seller.address, "uri1");
            await vanaNFT.connect(seller).approve(await marketplace.getAddress(), 1);
            
            const price = ethers.parseEther("100");
            await marketplace.connect(seller).listNFT(
                await vanaNFT.getAddress(),
                1,
                price
            );

            // VANA token approve
            await mockVanaToken.connect(buyer).approve(
                await marketplace.getAddress(),
                price
            );

            // NFT satın al
            await marketplace.connect(buyer).buyNFT(1);

            // Fee kontrolü
            const fee = (price * BigInt(INITIAL_FEE)) / BigInt(10000);
            const marketplaceBalance = await mockVanaToken.balanceOf(await marketplace.getAddress());
            expect(marketplaceBalance).to.equal(fee);
        });
    });

    describe("Batch Operations", function () {
        let tokenIds;
        let prices;
        let collections;

        beforeEach(async function () {
            tokenIds = [1, 2, 3];
            prices = [
                ethers.parseEther("1"),
                ethers.parseEther("2"),
                ethers.parseEther("3")
            ];
            collections = Array(3).fill(vanaNFTAddress);

            // NFT'leri mint et
            for(let i = 0; i < tokenIds.length; i++) {
                await vanaNFT.mint(seller.address, `uri${i+1}`);
                await vanaNFT.connect(seller).approve(marketplaceAddress, tokenIds[i]);
            }
        });

        describe("Batch Listing", function () {
            it("Should handle batch listings correctly", async function () {
                const batch = {
                    listingIds: [],
                    tokenIds: tokenIds,
                    prices: prices,
                    collections: collections
                };

                await marketplace.connect(seller).batchListNFTs(batch);

                // Kontroller
                for(let i = 0; i < tokenIds.length; i++) {
                    const listing = await marketplace.listings(i + 1);
                    expect(listing.seller).to.equal(seller.address);
                    expect(listing.price).to.equal(prices[i]);
                    expect(listing.tokenId).to.equal(tokenIds[i]);
                }
            });

            it("Should enforce batch size limit", async function () {
                const largeBatch = {
                    listingIds: [],
                    tokenIds: Array(51).fill(1),
                    prices: Array(51).fill(ethers.parseEther("1")),
                    collections: Array(51).fill(vanaNFTAddress)
                };

                await expect(
                    marketplace.connect(seller).batchListNFTs(largeBatch)
                ).to.be.revertedWith("Batch too large");
            });
        });

        describe("Batch Buying", function () {
            beforeEach(async function () {
                // Önce NFT'leri listele
                const batch = {
                    listingIds: [],
                    tokenIds: tokenIds,
                    prices: prices,
                    collections: collections
                };
                await marketplace.connect(seller).batchListNFTs(batch);
            });

            it("Should handle batch buying correctly", async function () {
                const listingIds = [1, 2, 3];
                const totalPrice = prices.reduce((a, b) => a + b, BigInt(0));

                // VANA token approve
                await mockVanaToken.connect(buyer).approve(
                    marketplaceAddress,
                    totalPrice
                );

                await marketplace.connect(buyer).batchBuyNFTs(listingIds);

                // Kontroller
                for(let i = 0; i < listingIds.length; i++) {
                    const listing = await marketplace.listings(i + 1);
                    expect(listing.sold).to.be.true;
                    expect(await vanaNFT.ownerOf(tokenIds[i])).to.equal(buyer.address);
                }
            });
        });
    });

    describe("Collection Features", function () {
        let collection;
        let royaltyReceiver;
        const ROYALTY_BPS = 500; // 5%

        beforeEach(async function () {
            const VanaCollection = await ethers.getContractFactory("VanaCollection");
            royaltyReceiver = addrs[0];
            
            collection = await upgrades.deployProxy(VanaCollection, [
                "Test Collection",
                "TEST",
                ROYALTY_BPS,
                royaltyReceiver.address
            ]);
            await collection.waitForDeployment();

            // Approve collection
            await marketplace.approveCollection(
                await collection.getAddress(),
                ROYALTY_BPS
            );
        });

        it("Should handle royalties correctly", async function () {
            // NFT mint ve listeleme
            await collection.mint(seller.address, "uri1");
            await collection.connect(seller).approve(marketplaceAddress, 1);
            
            const price = ethers.parseEther("100");
            await marketplace.connect(seller).listNFT(
                await collection.getAddress(),
                1,
                price
            );

            // VANA token approve
            await mockVanaToken.connect(buyer).approve(
                marketplaceAddress,
                price
            );

            // Satın alma
            await marketplace.connect(buyer).buyNFT(1);

            // Royalty kontrolü
            const royaltyAmount = (price * BigInt(ROYALTY_BPS)) / BigInt(10000);
            const receiverBalance = await mockVanaToken.balanceOf(royaltyReceiver.address);
            expect(receiverBalance).to.equal(royaltyAmount);
        });
    });

    describe("Collection Statistics", function () {
        it("Should track collection floor price correctly", async function () {
            // NFT'leri listele
            await collection.mint(seller.address, "uri1");
            await collection.connect(seller).approve(marketplaceAddress, 1);
            
            const price1 = ethers.parseEther("100");
            await marketplace.connect(seller).listNFT(
                await collection.getAddress(),
                1,
                price1
            );

            const floorPrice = await marketplace.getCollectionFloorPrice(await collection.getAddress());
            expect(floorPrice).to.equal(price1);
        });

        it("Should update collection volume after sales", async function () {
            // ... test implementasyonu ...
        });

        it("Should filter listings correctly", async function () {
            // ... test implementasyonu ...
        });
    });

    describe("Collection Sale Rules", function () {
        let collection;
        const HOUR = 3600;

        beforeEach(async function () {
            // Collection setup...
        });

        it("Should enforce whitelist rules", async function () {
            // Whitelist kuralı ayarla
            await marketplace.setCollectionSaleRules(
                await collection.getAddress(),
                {
                    whitelistRequired: true,
                    minPrice: 0,
                    maxPrice: 0,
                    maxPerWallet: 0,
                    startTime: 0,
                    endTime: 0
                }
            );

            // NFT listele
            await collection.mint(seller.address, "uri1");
            await collection.connect(seller).approve(marketplaceAddress, 1);
            await marketplace.connect(seller).listNFT(
                await collection.getAddress(),
                1,
                ethers.parseEther("1")
            );

            // Whitelist'te olmayan alıcı için hata vermeli
            await expect(
                marketplace.connect(buyer).buyNFT(1)
            ).to.be.revertedWith("Buyer not whitelisted");

            // Alıcıyı whitelist'e ekle
            await marketplace.updateWhitelist(
                await collection.getAddress(),
                [buyer.address],
                true
            );

            // Şimdi alım yapabilmeli
            await marketplace.connect(buyer).buyNFT(1);
        });

        it("Should enforce time-based rules", async function () {
            const startTime = Math.floor(Date.now() / 1000) + HOUR;
            const endTime = startTime + HOUR;

            await marketplace.setCollectionSaleRules(
                await collection.getAddress(),
                {
                    whitelistRequired: false,
                    minPrice: 0,
                    maxPrice: 0,
                    maxPerWallet: 0,
                    startTime: startTime,
                    endTime: endTime
                }
            );

            // Satış başlamadan önce hata vermeli
            await expect(
                marketplace.connect(buyer).buyNFT(1)
            ).to.be.revertedWith("Sale not started");

            // Zamanı ileri al
            await ethers.provider.send("evm_increaseTime", [HOUR + 1]);
            await ethers.provider.send("evm_mine", []);

            // Şimdi alım yapabilmeli
            await marketplace.connect(buyer).buyNFT(1);
        });
    });

    describe("Staking Features", function () {
        let mockNFT;
        
        beforeEach(async function () {
            // Deploy mock NFT
            const MockNFT = await ethers.getContractFactory("MockNFT");
            mockNFT = await MockNFT.deploy();
            await mockNFT.deployed();
            
            // Deploy staking with mock NFT
            const VanaStaking = await ethers.getContractFactory("VanaStaking");
            staking = await upgrades.deployProxy(VanaStaking, [
                await vanaToken.getAddress(),
                await mockNFT.getAddress(),
                DAILY_REWARD_RATE,
                LOCK_PERIOD
            ]);
        });

        it("Should stake NFT correctly", async function () {
            await collection.mint(seller.address, "uri1");
            await collection.connect(seller).approve(marketplaceAddress, 1);
            
            await marketplace.connect(seller).stakeNFT(
                await collection.getAddress(),
                1
            );

            const stakedTokens = await marketplace.getStakedTokens(
                await collection.getAddress(),
                seller.address
            );
            expect(stakedTokens[0]).to.equal(1);
        });

        it("Should calculate rewards correctly", async function () {
            // ... test implementasyonu ...
        });

        it("Should enforce lock period", async function () {
            // ... test implementasyonu ...
        });
    });

    describe("Staking Integration", function () {
        let mockNFT;
        
        beforeEach(async function () {
            const MockNFT = await ethers.getContractFactory("MockNFT");
            mockNFT = await MockNFT.deploy();
            await mockNFT.deployed();
            
            await marketplace.setStakingContract(
                await staking.getAddress()
            );
        });

        it("Should calculate rewards correctly", async function () {
            const tokenId = 1;
            await mockNFT.mint(owner.address, tokenId);
            await mockNFT.approve(marketplace.address, tokenId);
            
            await marketplace.stakeNFT(mockNFT.address, tokenId);
            
            // Time travel 1 day
            await network.provider.send("evm_increaseTime", [86400]);
            await network.provider.send("evm_mine");
            
            const rewards = await marketplace.calculateRewards(mockNFT.address, tokenId);
            expect(rewards).to.be.gt(0);
        });
    });

    describe("Frontend View Functions", function () {
        let collection;
        let tokenId;
        let price;

        beforeEach(async function () {
            // Test NFT'si hazırla
            await vanaNFT.mint(seller.address, "uri1");
            tokenId = 1;
            price = ethers.parseEther("1");
            
            await vanaNFT.connect(seller).approve(marketplaceAddress, tokenId);
            await marketplace.connect(seller).listNFT(vanaNFTAddress, tokenId, price);
        });

        describe("Listing Details", function () {
            it("Should return correct listing details", async function () {
                const details = await marketplace.getListingDetails(1);
                
                expect(details.listingId).to.equal(1);
                expect(details.seller).to.equal(seller.address);
                expect(details.nftContract).to.equal(vanaNFTAddress);
                expect(details.tokenId).to.equal(tokenId);
                expect(details.price).to.equal(price);
                expect(details.active).to.be.true;
                expect(details.sold).to.be.false;
                expect(details.tokenURI).to.equal("uri1");
            });

            it("Should handle staked NFT details correctly", async function () {
                // NFT'yi stake et
                await marketplace.connect(seller).stakeNFT(vanaNFTAddress, tokenId);
                
                const details = await marketplace.getListingDetails(1);
                expect(details.stakingRewards).to.be.gt(0);
            });
        });

        describe("Filtered Listings", function () {
            beforeEach(async function () {
                // Daha fazla test NFT'si ekle
                for(let i = 2; i <= 5; i++) {
                    await vanaNFT.mint(seller.address, `uri${i}`);
                    await vanaNFT.connect(seller).approve(marketplaceAddress, i);
                    await marketplace.connect(seller).listNFT(
                        vanaNFTAddress,
                        i,
                        ethers.parseEther(i.toString())
                    );
                }
            });

            it("Should filter by price range", async function () {
                const filter = {
                    minPrice: ethers.parseEther("2"),
                    maxPrice: ethers.parseEther("4"),
                    collection: ethers.ZeroAddress,
                    seller: ethers.ZeroAddress,
                    onlyActive: true,
                    onlyStaked: false
                };

                const pagination = {
                    offset: 0,
                    limit: 10,
                    ascending: true
                };

                const [items, total] = await marketplace.getFilteredListings(filter, pagination);
                expect(items.length).to.equal(3); // 2,3,4 ETH listings
                expect(total).to.equal(3);
            });

            it("Should filter by seller", async function () {
                const filter = {
                    minPrice: 0,
                    maxPrice: 0,
                    collection: ethers.ZeroAddress,
                    seller: seller.address,
                    onlyActive: true,
                    onlyStaked: false
                };

                const pagination = {
                    offset: 0,
                    limit: 10,
                    ascending: true
                };

                const [items, total] = await marketplace.getFilteredListings(filter, pagination);
                expect(items.length).to.equal(5);
                expect(total).to.equal(5);
            });

            it("Should handle pagination correctly", async function () {
                const filter = {
                    minPrice: 0,
                    maxPrice: 0,
                    collection: ethers.ZeroAddress,
                    seller: ethers.ZeroAddress,
                    onlyActive: true,
                    onlyStaked: false
                };

                const pagination = {
                    offset: 2,
                    limit: 2,
                    ascending: true
                };

                const [items, total] = await marketplace.getFilteredListings(filter, pagination);
                expect(items.length).to.equal(2);
                expect(items[0].tokenId).to.equal(3);
                expect(items[1].tokenId).to.equal(4);
            });
        });

        describe("Collection Stats", function () {
            it("Should track collection stats correctly", async function () {
                // NFT sat
                await marketplace.connect(buyer).buyNFT(1);

                const [stats, totalStaked, totalRewards, apy] = 
                    await marketplace.getCollectionStats(vanaNFTAddress);

                expect(stats.totalSales).to.equal(1);
                expect(stats.totalVolume).to.equal(price);
                expect(stats.floorPrice).to.equal(price);
            });
        });

        describe("User Activity", function () {
            it("Should track user activity correctly", async function () {
                const [listedTokens, stakedTokens, totalRewards, totalVolume] = 
                    await marketplace.getUserActivity(seller.address);

                expect(listedTokens.length).to.equal(1);
                expect(listedTokens[0]).to.equal(tokenId);
                expect(totalVolume).to.equal(0);
            });
    });
  });
}); 