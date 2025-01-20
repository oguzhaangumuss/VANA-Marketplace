import { expect } from "chai";
import { ethers, network } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { SericaNFTCollection, SericaNFTCollection__factory } from "../typechain-types";
import { keccak256 } from "ethers";
import MerkleTree from 'merkletreejs';
import { upgrades } from "hardhat";

interface MintGroup {
    merkleRoot: string;
    maxTokens: bigint;
    unitPrice: bigint;
    mintPerWallet: bigint;
    startTime: bigint;
    endTime: bigint;
    mintedInGroup: bigint;
    isActive: boolean;
}

describe("SericaNFTCollection", function () {
    let nftCollection: SericaNFTCollection;
    let owner: SignerWithAddress;
    let creators: SignerWithAddress[];
    let users: SignerWithAddress[];
    let merkleTree: MerkleTree;
    let merkleRoot: string;
    let sampleConfig: any;

    // Test parametreleri
    const collectionName = "Test Collection";
    const supply = 1000;
    const baseURI = "https://api.test.com/metadata/";
    const royaltyPercent = 5;
    const iteratedUri = true;
    const hiddenMetadata = false;
    const placeholderUri = "https://api.test.com/hidden.json";

    beforeEach(async function () {
        // Test hesaplarını al
        [owner, ...users] = await ethers.getSigners();
        creators = users.slice(0, 3);

        // Config'i burada oluştur
        sampleConfig = {
            name: "Sample Collection",
            description: "Sample Description",
            supply: 1001,
            token_uri: "https://api.sample.com/metadata/",
            royalty_percent: 5,
            royalty_wallet: owner.address,
            iterated_uri: true,
            hidden_metadata: false,
            placeholder_token_uri: "https://api.sample.com/hidden.json",
            groups: [
                {
                    name: "whitelist",
                    merkle_root: null,
                    max_tokens: 500,
                    unit_price: 1,
                    creators: [
                        {
                            address: owner.address,
                            share: 100
                        }
                    ],
                    start_time: "2024-12-31T11:30:05Z",
                    end_time: null
                },
                {
                    name: "public",
                    merkle_root: null,
                    max_tokens: 501,
                    unit_price: 2,
                    creators: [
                        {
                            address: owner.address,
                            share: 100
                        }
                    ],
                    start_time: "2024-12-31T12:00:05Z",
                    end_time: null
                }
            ]
        };

        // Whitelist için merkle tree oluştur
        const whitelistAddresses = users.slice(3, 6).map(user => user.address);
        const leaves = whitelistAddresses.map(addr => keccak256(Buffer.from(addr.slice(2), 'hex')));
        merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        merkleRoot = `0x${merkleTree.getRoot().toString('hex')}`;

        // Kontratı deploy et
        const SericaNFTCollectionFactory = await ethers.getContractFactory("SericaNFTCollection");
        nftCollection = (await upgrades.deployProxy(
            SericaNFTCollectionFactory,
            [
                collectionName,
                supply,
                baseURI,
                royaltyPercent,
                owner.address,
                iteratedUri,
                hiddenMetadata,
                placeholderUri
            ]
        )) as unknown as SericaNFTCollection;

        // Creator'ları ayarla
        await nftCollection.setCreators(
            creators.map(c => c.address),
            [5000, 3000, 2000]
        );
    });

    describe("Initialization", function () {
        it("Should initialize with correct values", async function () {
            expect(await nftCollection.name()).to.equal(collectionName);
            expect(await nftCollection.supply()).to.equal(supply);
            expect(await nftCollection.tokenBaseURI()).to.equal(baseURI);
            expect(await nftCollection.mintedCount()).to.equal(0);
        });
    });

    describe("Mint Groups", function () {
        it("Should add mint group correctly", async function () {
            const now = await time.latest();
            const startTime = now + 3600;
            const endTime = startTime + 7200;

            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                2,
                startTime,
                endTime
            );

            await time.increaseTo(startTime + 1);
        });

        it("Should not allow minting before start time", async function () {
            const now = await time.latest();
            const startTime = now + 3600 * 3;

            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                2,
                startTime,
                0
            );

            await expect(
                nftCollection.connect(users[0]).mint(
                    "public",
                    [],
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Group sale not started");
        });

        it("Should allow minting during active period", async function () {
            const now = await time.latest();
            const startTime = now + 3600 * 3;

            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                startTime,
                0
            );

            await time.increaseTo(startTime + 1);

            await nftCollection.connect(users[0]).mint(
                "public",
                [],
                { value: ethers.parseEther("0.1") }
            );

            expect(await nftCollection.mintedCount()).to.equal(1);
        });
    });

    describe("Whitelist", function () {
        beforeEach(async function () {
            const now = await time.latest();
            const startTime = now + 3600;
            
            await nftCollection.addMintGroup(
                "whitelist",
                merkleRoot,
                100,
                ethers.parseEther("0.1"),
                2,
                startTime,
                0
            );

            await time.increaseTo(startTime + 1);
        });

        it("Should allow whitelisted address to mint", async function () {
            const whitelistedUser = users[3];
            const proof = merkleTree.getHexProof(
                keccak256(Buffer.from(whitelistedUser.address.slice(2), 'hex'))
            );

            await time.increase(100);

            await nftCollection.connect(whitelistedUser).mint(
                "whitelist",
                proof,
                { value: ethers.parseEther("0.1") }
            );

            expect(await nftCollection.mintedCount()).to.equal(1);
        });

        it("Should reject non-whitelisted address", async function () {
            const nonWhitelistedUser = users[6];
            const proof = merkleTree.getHexProof(
                keccak256(Buffer.from(nonWhitelistedUser.address.slice(2), 'hex'))
            );

            await time.increase(100);

            await expect(
                nftCollection.connect(nonWhitelistedUser).mint(
                    "whitelist",
                    proof,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Invalid merkle proof");
        });
    });
    // Past Time kullanıldı 
    describe("Creator Payments", function () {
        it("Should distribute payments correctly", async function () {
            const now = await time.latest();
            const startTime = now + 3600;
            const price = ethers.parseEther("1");

            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                price,
                5,
                startTime,
                0
            );

            await time.increaseTo(startTime + 1);

            // Creator'ların başlangıç bakiyelerini al
            const initialBalances = await Promise.all(
                creators.map(c => c.provider.getBalance(c.address))
            );

            // Mint işlemi
            await nftCollection.connect(users[6]).mint(
                "public",
                [],
                { value: price }
            );

            // Yeni bakiyeleri kontrol et
            const newBalances = await Promise.all(
                creators.map(c => c.provider.getBalance(c.address))
            );

            // Bakiye değişimlerini kontrol et
            expect(newBalances[0] - initialBalances[0]).to.equal(price * 5000n / 10000n);
            expect(newBalances[1] - initialBalances[1]).to.equal(price * 3000n / 10000n);
            expect(newBalances[2] - initialBalances[2]).to.equal(price * 2000n / 10000n);
        });
    });

    describe("URI Management", function () {
        it("Should return correct token URI", async function () {
            // Public mint grubu ekle
            const now = await time.latest();
            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                0
            );

            await time.increase(100);

            // Mint
            await nftCollection.connect(users[0]).mint(
                "public",
                [],
                { value: ethers.parseEther("0.1") }
            );

            // URI kontrolü
            const tokenId = 1;
            const uri = await nftCollection.tokenURI(tokenId);
            expect(uri).to.equal(`${baseURI}${tokenId}`);
        });

        it("Should return placeholder URI when hidden", async function () {
            // Metadata'yı gizle
            await nftCollection.setHiddenMetadataState(true);

            // Public mint grubu ekle
            const now = await time.latest();
            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                0
            );

            await time.increase(100);

            // Mint
            await nftCollection.connect(users[0]).mint(
                "public",
                [],
                { value: ethers.parseEther("0.1") }
            );

            // URI kontrolü
            const uri = await nftCollection.tokenURI(1);
            expect(uri).to.equal(placeholderUri);
        });
    });

    describe("Config Based Initialization", function () {
        let configBasedCollection: SericaNFTCollection;

        it("Should initialize correctly from config", async function () {
            const SericaNFTCollectionFactory = await ethers.getContractFactory("SericaNFTCollection");
            configBasedCollection = (await upgrades.deployProxy(
                SericaNFTCollectionFactory,
                [
                    sampleConfig.name,
                    sampleConfig.supply,
                    sampleConfig.token_uri,
                    sampleConfig.royalty_percent,
                    sampleConfig.royalty_wallet,
                    sampleConfig.iterated_uri,
                    sampleConfig.hidden_metadata,
                    sampleConfig.placeholder_token_uri
                ]
            )) as unknown as SericaNFTCollection;

            // Temel değerleri kontrol et
            expect(await configBasedCollection.name()).to.equal(sampleConfig.name);
            expect(await configBasedCollection.supply()).to.equal(sampleConfig.supply);
            expect(await configBasedCollection.tokenBaseURI()).to.equal(sampleConfig.token_uri);
            expect(await configBasedCollection.iteratedUri()).to.equal(sampleConfig.iterated_uri);
            expect(await configBasedCollection.hiddenMetadata()).to.equal(sampleConfig.hidden_metadata);
            expect(await configBasedCollection.placeholderTokenUri()).to.equal(sampleConfig.placeholder_token_uri);
        });

        it("Should setup mint groups from config", async function () {
            const SericaNFTCollectionFactory = await ethers.getContractFactory("SericaNFTCollection");
            configBasedCollection = (await upgrades.deployProxy(
                SericaNFTCollectionFactory,
                [
                    sampleConfig.name,
                    sampleConfig.supply,
                    sampleConfig.token_uri,
                    sampleConfig.royalty_percent,
                    sampleConfig.royalty_wallet,
                    sampleConfig.iterated_uri,
                    sampleConfig.hidden_metadata,
                    sampleConfig.placeholder_token_uri
                ]
            )) as unknown as SericaNFTCollection;

            // Config'deki grupları ekle
            const now = await time.latest();
            for (const group of sampleConfig.groups) {
                const startTime = (await time.latest()) + 3600;
                const endTime = group.end_time ? startTime + 7200 : 0;

                await configBasedCollection.addMintGroup(
                    group.name,
                    group.merkle_root || ethers.ZeroHash,
                    group.max_tokens,
                    ethers.parseEther(String(group.unit_price)),
                    group.mintPerWallet || 2,
                    startTime,
                    endTime
                );
                await time.increaseTo(startTime + 1);

                // Creator'ları ayarla
                if (group.creators && group.creators.length > 0) {
                    await configBasedCollection.setCreators(
                        group.creators.map((c: { address: string; share: number }) => c.address),
                        group.creators.map((c: { address: string; share: number }) => c.share * 100)
                    );
                }
            }

            // Grupları kontrol et
            for (const group of sampleConfig.groups) {
                const mintGroup = await configBasedCollection.getMintGroup(group.name);
                expect(mintGroup.maxTokens).to.equal(group.max_tokens);
                expect(mintGroup.isActive).to.be.true;
            }
        });

        it("Should validate config values", async function () {
            // Yeni bir kontrat deploy et
            const SericaNFTCollectionFactory = await ethers.getContractFactory("SericaNFTCollection");
            
            // Invalid supply için
            await expect(
                upgrades.deployProxy(SericaNFTCollectionFactory, [
                    sampleConfig.name,
                    0,
                    sampleConfig.token_uri,
                    sampleConfig.royalty_percent,
                    sampleConfig.royalty_wallet,
                    sampleConfig.iterated_uri,
                    sampleConfig.hidden_metadata,
                    sampleConfig.placeholder_token_uri
                ])
            ).to.be.revertedWith("Invalid supply");

            // Invalid royalty için
            await expect(
                upgrades.deployProxy(SericaNFTCollectionFactory, [
                    sampleConfig.name,
                    sampleConfig.supply,
                    sampleConfig.token_uri,
                    101,
                    sampleConfig.royalty_wallet,
                    sampleConfig.iterated_uri,
                    sampleConfig.hidden_metadata,
                    sampleConfig.placeholder_token_uri
                ])
            ).to.be.revertedWith("Invalid royalty percentage");
        });
    });

    describe("Edge Cases", function () {
        it("should handle zero price mints", async function () {
            const now = await time.latest();
            
            // Ücretsiz mint grubu oluştur
            await nftCollection.addMintGroup(
                "free",
                ethers.ZeroHash,
                100,
                0, // sıfır fiyat
                2,
                now + 100,
                now + 3600
            );
            
            await time.increaseTo(now + 101);
            
            // Ücretsiz mint
            await nftCollection.connect(users[0]).mint("free", [], { value: 0 });
            expect(await nftCollection.mintedCount()).to.equal(1);
        });

        it("should handle maximum supply edge case", async function () {
            const now = await time.latest();
            
            // 2 NFT'lik grup oluştur
            await nftCollection.addMintGroup(
                "limited",
                ethers.ZeroHash,
                2, // sadece 2 NFT
                ethers.parseEther("0.1"),
                5, // mintPerWallet limiti grup limitinden büyük olmalı
                now + 100,
                now + 3600
            );
            
            await time.increaseTo(now + 101);
            
            // İlk 2 mint başarılı olmalı
            await nftCollection.connect(users[0]).mint("limited", [], { value: ethers.parseEther("0.1") }); // 1. mint
            await nftCollection.connect(users[1]).mint("limited", [], { value: ethers.parseEther("0.1") }); // 2. mint farklı kullanıcıdan
            
            // 3. mint hata vermeli
            await expect(
                nftCollection.connect(users[2]).mint("limited", [], { value: ethers.parseEther("0.1") })
            ).to.be.revertedWith("Group max tokens reached");
        });

        it("should handle invalid merkle proofs", async function () {
            const now = await time.latest();
            
            // Whitelist grubu oluştur
            await nftCollection.addMintGroup(
                "whitelist",
                merkleRoot,
                100,
                ethers.parseEther("0.1"),
                2,
                now + 100,
                now + 3600
            );
            
            await time.increaseTo(now + 101);
            
            // Yanlış proof ile deneme
            const wrongProof = merkleTree.getHexProof(keccak256(Buffer.from(users[6].address.slice(2), 'hex')));
            await expect(
                nftCollection.connect(users[3]).mint("whitelist", wrongProof, { value: ethers.parseEther("0.1") })
            ).to.be.revertedWith("Invalid merkle proof");
            
            // Boş proof ile deneme
            await expect(
                nftCollection.connect(users[3]).mint("whitelist", [], { value: ethers.parseEther("0.1") })
            ).to.be.revertedWith("Invalid merkle proof");
        });
    });

    describe("Error Conditions", function () {
        it("should fail when paused", async function () {
            const now = await time.latest();
            
            // Public grup oluştur
            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                now + 3600
            );
            
            await time.increaseTo(now + 101);
            
            // Kontratı durdur
            await nftCollection.pause();
            
            // Mint denemesi yapılmalı ve hata vermeli
            await expect(
                nftCollection.connect(users[0]).mint(
                    "public",
                    [],
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Pausable: paused");
        });

        it("should fail with invalid payment amounts", async function () {
            const now = await time.latest();
            const price = ethers.parseEther("0.1");
            
            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                price,
                5,
                now + 100,
                now + 3600
            );
            
            await time.increaseTo(now + 101);
            
            // Eksik ödeme
            await expect(
                nftCollection.connect(users[0]).mint(
                    "public",
                    [],
                    { value: price / 2n }
                )
            ).to.be.revertedWith("Insufficient payment");
        });
    });

    describe("URI Management", function () {
        it("should handle special characters in URI", async function () {
            const specialURI = "https://api.test.com/metadata/#?special=true&";
            await nftCollection.setBaseURI(specialURI);
            
            // Mint yap
            const now = await time.latest();
            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                now + 3600
            );
            
            await time.increaseTo(now + 101);
            
            await nftCollection.connect(users[0]).mint(
                "public",
                [],
                { value: ethers.parseEther("0.1") }
            );
            
            const uri = await nftCollection.tokenURI(1);
            expect(uri).to.equal(`${specialURI}1`);
        });
    });

    describe("Admin Functions", function () {
        it("should allow updating group status", async function () {
            const now = await time.latest();
            
            // Grup oluştur
            await nftCollection.addMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                now + 3600
            );
            
            // Grubu deaktif et
            await nftCollection.updateMintGroup(
                "public",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 3600, // Yeni başlangıç zamanı
                now + 7200  // Yeni bitiş zamanı
            );
            
            // Mint denemesi yapılmalı ve hata vermeli
            await expect(
                nftCollection.connect(users[0]).mint(
                    "public",
                    [],
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Group sale not started");
        });

        it("should validate creator share updates", async function () {
            // Toplam 100% üzerinde pay verilmemeli
            await expect(
                nftCollection.setCreators(
                    [users[0].address, users[1].address],
                    [7000, 4000] // 70% + 40% = 110%
                )
            ).to.be.revertedWith("Total shares must be 100%");
        });
    });

    describe("View Functions", function () {
        it("should return correct group info", async function () {
            const now = await time.latest();
            const groupName = "test_group";
            
            await nftCollection.addMintGroup(
                groupName,
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                now + 3600
            );
            
            const group = await nftCollection.getMintGroup(groupName);
            
            expect(group[0]).to.equal(ethers.ZeroHash);    // merkleRoot
            expect(group[1]).to.equal(100n);               // maxTokens
            expect(group[2]).to.equal(ethers.parseEther("0.1")); // unitPrice
            expect(group[3]).to.equal(BigInt(now + 100));  // startTime
            expect(group[4]).to.equal(BigInt(now + 3600)); // endTime
            expect(group[5]).to.equal(0n);                 // mintedInGroup
            expect(group[6]).to.be.true;                   // isActive
        });

        it("should return all groups correctly", async function () {
            const now = await time.latest();
            
            // İki grup ekle
            await nftCollection.addMintGroup(
                "group1",
                ethers.ZeroHash,
                100,
                ethers.parseEther("0.1"),
                5,
                now + 100,
                now + 3600
            );
            
            await nftCollection.addMintGroup(
                "group2",
                ethers.ZeroHash,
                200,
                ethers.parseEther("0.2"),
                3,
                now + 3700,
                now + 7200
            );
            
            const [names, maxTokens, unitPrices, startTimes, endTimes, mintedCounts, activeStates] = 
                await nftCollection.getAllGroups();
            
            expect(names).to.deep.equal(["group1", "group2"]);
            expect(maxTokens[0]).to.equal(100);
            expect(maxTokens[1]).to.equal(200);
            expect(unitPrices[0]).to.equal(ethers.parseEther("0.1"));
            expect(unitPrices[1]).to.equal(ethers.parseEther("0.2"));
        });
    });
});

describe("SericaNFTCollection - Mint Per Wallet Tests", function () {
    let collection: SericaNFTCollection;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    
    const WHITELIST_GROUP = "whitelist";
    const PUBLIC_GROUP = "public";
    
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        
        const SericaNFTCollection = await ethers.getContractFactory("SericaNFTCollection");
        collection = (await upgrades.deployProxy(SericaNFTCollection, [
            "Test Collection",
            100,
            "https://api.example.com/",
            5,
            owner.address,
            true,
            false,
            "https://api.example.com/hidden"
        ])) as unknown as SericaNFTCollection;
        
        // Whitelist grubu oluştur
        let now = await time.latest();
        let startTime = now + 3600;
        let endTime = startTime + 7200;
        
        await collection.addMintGroup(
            WHITELIST_GROUP,
            ethers.ZeroHash,
            50,
            ethers.parseEther("0.1"),
            2,
            startTime,
            endTime
        );
        
        await time.increaseTo(startTime + 1);
        
        // Public grup için yeni zaman al
        now = await time.latest();
        startTime = now + 3600;
        endTime = startTime + 7200;
        
        // Public grup oluştur
        await collection.addMintGroup(
            PUBLIC_GROUP,
            ethers.ZeroHash,
            50,
            ethers.parseEther("0.2"),
            5,
            startTime,
            endTime
        );
        await time.increaseTo(startTime + 1);
        
        // Creator payı ayarla
        await collection.setCreators(
            [owner.address],
            [10000] // %100
        );
    });
    
    describe("Whitelist Group Tests", function () {
        it("should allow minting up to mintPerWallet limit", async function () {
            // İlk mint
            await collection.connect(user1).mint(
                WHITELIST_GROUP,
                [],
                { value: ethers.parseEther("0.1") }
            );
            
            // İkinci mint
            await collection.connect(user1).mint(
                WHITELIST_GROUP,
                [],
                { value: ethers.parseEther("0.1") }
            );
            
            // Üçüncü mint hata vermeli
            await expect(
                collection.connect(user1).mint(
                    WHITELIST_GROUP,
                    [],
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Wallet mint limit exceeded");
        });
        
        it("should track mint limits separately for each group", async function () {
            // Whitelist'ten 2 mint
            await collection.connect(user1).mint(
                WHITELIST_GROUP,
                [],
                { value: ethers.parseEther("0.1") }
            );
            await collection.connect(user1).mint(
                WHITELIST_GROUP,
                [],
                { value: ethers.parseEther("0.1") }
            );
            
            // Public'ten 5 mint yapabilmeli
            for(let i = 0; i < 5; i++) {
                await collection.connect(user1).mint(
                    PUBLIC_GROUP,
                    [],
                    { value: ethers.parseEther("0.2") }
                );
            }
            
            // 6. public mint hata vermeli
            await expect(
                collection.connect(user1).mint(
                    PUBLIC_GROUP,
                    [],
                    { value: ethers.parseEther("0.2") }
                )
            ).to.be.revertedWith("Wallet mint limit exceeded");
        });
    });
    
    
    describe("Mint Limit Updates", function () {
        it("should enforce new limits after updating mintPerWallet", async function () {
            const now = await time.latest();
            const startTime = now + 3600;
            const endTime = startTime + 7200;
            
            // İlk mint
            await collection.connect(user1).mint(
                WHITELIST_GROUP,
                [],
                { value: ethers.parseEther("0.1") }
            );
            
            // Limiti 1'e düşür
            await collection.updateMintGroup(
                WHITELIST_GROUP,
                ethers.ZeroHash,
                50,
                ethers.parseEther("0.1"),
                1,
                now + 100,
                now + 7200
            );
            
            // Zamanı yeni startTime'dan sonraya ilerlet
            await time.increaseTo(now + 101);
            
            // İkinci mint artık hata vermeli
            await expect(
                collection.connect(user1).mint(
                    WHITELIST_GROUP,
                    [],
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Wallet mint limit exceeded");
        });
        
        it("should not allow setting mintPerWallet to zero", async function () {
            const now = await time.latest();
            const startTime = now + 3600;
            const endTime = startTime + 7200;

            await expect(
                collection.updateMintGroup(
                    WHITELIST_GROUP,
                    ethers.ZeroHash,
                    50,
                    ethers.parseEther("0.1"),
                    0,
                    startTime,
                    endTime
                )
            ).to.be.revertedWith("Invalid mint per wallet limit");
        });
    });
}); 