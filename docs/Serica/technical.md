# SericaNFTCollection Technical Documentation

## Overview

SericaNFTCollection is an upgradeable NFT collection contract that supports dynamic minting groups, whitelist functionality, and creator royalties.

## Contract Architecture

### Core Features

- Upgradeable contract (UUPS pattern)
- Dynamic mint groups
- Whitelist support with Merkle trees
- Automatic creator payment distribution
- Configurable metadata handling
- Pausable functionality

### Key Structures

solidity
struct MintGroup {
string name;
bytes32 merkleRoot;
uint256 maxTokens;
uint256 unitPrice;
uint256 startTime;
uint256 endTime;
uint256 mintedInGroup;
bool isActive;
}
struct Creator {
address wallet;
uint256 share;
}

### Configuration Format

json
{
"name": "Collection Name",
"description": "Collection Description",
"supply": 1000,
"token_uri": "https://api.example.com/metadata/",
"royalty_percent": 5,
"royalty_wallet": "0x...",
"iterated_uri": true,
"hidden_metadata": false,
"placeholder_token_uri": "https://api.example.com/hidden.json",
"groups": [
{
"name": "whitelist",
"merkle_root": null,
"max_tokens": 500,
"unit_price": 1,
"creators": [
{
"address": "0x...",
"share": 100
}
],
"start_time": "2024-12-29T16:20:05Z",
"end_time": null
}
]
}

## Key Functions

### Initialization

solidity
function initialize(
string memory name,
uint256 supply,
string memory tokenUri,
uint256 royaltyPercent,
address royaltyWallet,
bool iteratedUri,
bool hiddenMetadata,
string memory placeholderTokenUri
) public initializer

### Mint Group Management

solidity
function addMintGroup(
string memory name,
bytes32 merkleRoot,
uint256 maxTokens,
uint256 unitPrice,
uint256 startTime,
uint256 endTime,
uint256 mintPerWallet
) external onlyRole(ADMIN_ROLE)

##Minting
solidity
function mint(
string memory groupName,
bytes32[] calldata merkleProof
) external payable whenNotPaused

### Creator Management

solidity
function setCreators(
address[] memory creators,
uint256[] memory shares
) external onlyRole(ADMIN_ROLE)

### URI Management

solidity
function setBaseURI(string memory newBaseURI) external onlyRole(ADMIN_ROLE)
function setHiddenMetadataState(bool state) external onlyRole(ADMIN_ROLE)
function setPlaceholderURI(string memory newPlaceholderURI) external onlyRole(ADMIN_ROLE)

### View Functions

solidity
function getActiveGroup() public view returns (string memory, uint256)
function mintedCount() public view returns (uint256)
function getMintGroup(string memory name) external view returns (
bytes32 merkleRoot,
uint256 maxTokens,
uint256 unitPrice,
uint256 startTime,
uint256 endTime,
uint256 mintedInGroup,
bool isActive

## Events

- `MintGroupAdded(string name, uint256 startTime, uint256 endTime)`
- `MintGroupUpdated(string name, uint256 startTime, uint256 endTime)`
- `Minted(address indexed to, uint256 indexed tokenId, string groupName)`
- `BaseURIChanged(string newBaseURI)`
- `MetadataHiddenStateChanged(bool hidden)`
- `PlaceholderURIChanged(string newPlaceholderURI)`
- `CreatorSharesUpdated(address[] creators, uint256[] shares)`
- `RoyaltyUpdated(address wallet, uint256 percentage)`

## Security Considerations

### 1. Access Control

- ADMIN_ROLE for management functions
- DEFAULT_ADMIN_ROLE for contract upgrades
- Role-based access control for critical functions

### 2. Payment Distribution

- Automatic creator payment distribution
- Share validation (total must be 100%)
- Safe payment handling with checks

### 3. Whitelist Verification

- Merkle tree verification for whitelisted addresses
- One mint per address per whitelist group
- Secure proof validation

### 4. Supply Management

- Global supply limit enforcement
- Group-specific supply limits
- Mint count tracking

### 5. Upgradeability

- UUPS upgrade pattern
- Proper initialization checks
- Access control for upgrades

## Error Messages

- "Invalid supply"
- "Invalid royalty percentage"
- "Invalid royalty wallet"
- "Group does not exist"
- "Start time must be in future"
- "Invalid end time"
- "Group sale not started"
- "Group sale ended"
- "Invalid merkle proof"
- "Already minted in this group"
- "Max supply reached"
- "Group max tokens reached"
- "Insufficient payment"
- "Creator payment failed"

# SericaNFTCollection Integration Guide

## Getting Started

### Prerequisites

- Hardhat development environment
- Node.js and npm/yarn
- Ethers.js

### Installation

bash
npm install @openzeppelin/contracts-upgradeable

## Configuration Setup

### 1. Prepare Collection Config

typescript
const collectionConfig = {
name: "Your Collection",
supply: 1000,
token_uri: "https://your-api.com/metadata/",
royalty_percent: 5,
royalty_wallet: "0x...",
iterated_uri: true,
hidden_metadata: false,
placeholder_token_uri: "https://your-api.com/hidden.json"
};

### 2. Deploy Contract

typescript
const SericaNFTCollection = await ethers.getContractFactory("SericaNFTCollection");
const collection = await upgrades.deployProxy(
SericaNFTCollection,
[
collectionConfig.name,
collectionConfig.supply,
collectionConfig.token_uri,
collectionConfig.royalty_percent,
collectionConfig.royalty_wallet,
collectionConfig.iterated_uri,
collectionConfig.hidden_metadata,
collectionConfig.placeholder_token_uri
]
);

## Mint Group Setup

### 1. Create Whitelist

typescript
const { MerkleTree
} = require('merkletreejs');
const { keccak256
} = require('ethers/lib/utils');
const addresses = [
"0xaddress1",
"0xaddress2",
// ...
];
const leaves = addresses.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leaves, keccak256,
{ sortPairs: true
});
const root = merkleTree.getRoot();

### 2. Add Mint Group

typescript
await collection.addMintGroup(
"whitelist",
root,
100, // maxTokens
ethers.utils.parseEther("0.1"), // price
startTime,
endTime,
2
);

## Minting Process

### 1. Get Merkle Proof

typescript
const proof = merkleTree.getHexProof(keccak256(userAddress));

### 2. Mint NFT

typescript
await collection.mint(
"whitelist",
proof,
{ value: ethers.utils.parseEther("0.1")
}
);

## Event Handling

typescript
collection.on("Minted", (to, tokenId, groupName) => {
console.log(Token ${tokenId
} minted to ${to
} in group ${groupName
});
});

## Common Operations

### Check Mint Status

typescript
const mintedCount = await collection.mintedCount();
const supply = await collection.supply();

### Get Active Group

typescript
const [groupName, price
] = await collection.getActiveGroup();

### Update URI

typescript
await collection.setBaseURI("https://new-api.com/metadata/");

### Time Management

- All timestamps are in UTC
- startTime must be in the future
- endTime must be after startTime (0 means no end time)
- Use `time.latest()` and `time.increaseTo()` for testing

## Gas Optimizations

- Using unchecked blocks for counters
- Using calldata instead of memory
- Using storage pointers
- Optimized loops in batch operations
