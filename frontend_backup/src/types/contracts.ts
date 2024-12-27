import { ethers } from 'ethers';

export interface VanaMarketplace extends ethers.Contract {
    // Listing Management
    listNFT(nftContract: string, tokenId: number, price: ethers.BigNumber): Promise<void>;
    cancelListing(listingId: number): Promise<void>;
    updateListingPrice(listingId: number, newPrice: ethers.BigNumber): Promise<void>;

    // Trading
    buyNFT(listingId: number): Promise<void>;
    makeOffer(listingId: number, amount: ethers.BigNumber): Promise<void>;
    acceptOffer(listingId: number, offerIndex: number): Promise<void>;

    // View Functions
    getListingDetails(listingId: number): Promise<ListingDetails>;
    getFilteredListings(filter: MarketplaceFilter, pagination: PaginationParams): Promise<[ListingDetails[], number]>;
    getCollectionStats(collection: string): Promise<CollectionStats>;
    getUserActivity(user: string): Promise<UserActivity>;
}

export interface ListingDetails {
    listingId: number;
    seller: string;
    nftContract: string;
    tokenId: number;
    price: ethers.BigNumber;
    active: boolean;
    sold: boolean;
    stakingRewards: ethers.BigNumber;
    tokenURI: string;
} 