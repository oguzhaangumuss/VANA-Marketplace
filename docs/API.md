# Vana NFT Marketplace API Documentation

## Core Functions

### Listing Management

```solidity
function listNFT(
    address nftContract,
    uint256 tokenId,
    uint256 price
) external

function cancelListing(uint256 listingId) external

function updateListingPrice(
    uint256 listingId,
    uint256 newPrice
) external
```

### Trading

```solidity
function buyNFT(uint256 listingId) external

function makeOffer(uint256 listingId, uint256 amount) external

function acceptOffer(uint256 listingId, uint256 offerIndex) external
```

### Staking

```solidity
function stake(uint256 tokenId) external

function unstake(uint256 tokenId) external

function claimRewards() external returns (uint256)
```

## View Functions

### Listing Information

```solidity
function getListingDetails(
    uint256 listingId
) external view returns (ListingDetails memory)

function getFilteredListings(
    MarketplaceFilter calldata filter,
    PaginationParams calldata pagination
) external view returns (ListingDetails[] memory items, uint256 total)
```

### Statistics

```solidity
function getCollectionStats(
    address collection
) external view returns (
    CollectionStats memory stats,
    uint256 totalStaked,
    uint256 totalRewards,
    uint256 apy
)

function getUserActivity(
    address user
) external view returns (
    uint256[] memory listedTokens,
    uint256[] memory stakedTokens,
    uint256 totalRewards,
    uint256 totalVolume
)
```
