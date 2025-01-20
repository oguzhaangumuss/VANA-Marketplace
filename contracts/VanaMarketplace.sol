// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract VanaMarketplace is AccessControl, ReentrancyGuard, Pausable {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Structs
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    // State variables
    mapping(bytes32 => Listing) public listings;
    mapping(address => bool) public verifiedCollections;
    uint256 public platformFee; // in basis points (e.g., 250 = 2.5%)
    address public treasury;

    // Events
    event Listed(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId,
        bytes32 listingId,
        uint256 price
    );
    event ListingCancelled(bytes32 indexed listingId);
    event ListingSold(
        bytes32 indexed listingId,
        address indexed buyer,
        uint256 price
    );
    event CollectionVerified(address indexed collection, bool verified);
    event PlatformFeeUpdated(uint256 newFee);
    event RoyaltyPaid(
        address indexed nftContract,
        address indexed receiver,
        uint256 amount
    );
    event TreasuryUpdated(address newTreasury);

    constructor(uint256 _platformFee) {
        require(_platformFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _platformFee;
        treasury = msg.sender;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // List NFT for sale
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused nonReentrant returns (bytes32) {
        require(price > 0, "Price must be greater than 0");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        bytes32 listingId = keccak256(
            abi.encodePacked(
                nftContract,
                tokenId,
                msg.sender,
                block.timestamp
            )
        );

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit Listed(msg.sender, nftContract, tokenId, listingId, price);
        return listingId;
    }

    // Cancel listing
    function cancelListing(bytes32 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not listing seller");

        listing.active = false;
        emit ListingCancelled(listingId);
    }

    // Admin functions
    function setVerifiedCollection(address collection, bool verified)
        external
        onlyRole(ADMIN_ROLE)
    {
        verifiedCollections[collection] = verified;
        emit CollectionVerified(collection, verified);
    }

    function setPlatformFee(uint256 newFee)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Emergency withdraw
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = treasury.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // View functions
    function getListing(bytes32 listingId)
        external
        view
        returns (Listing memory)
    {
        return listings[listingId];
    }

    // Allow contract to receive ETH
    receive() external payable {}

    // Buy NFT
    function buyNFT(bytes32 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        // Calculate fees
        uint256 platformAmount = (listing.price * platformFee) / 10000;
        uint256 remainingAmount = listing.price - platformAmount;

        // Get royalty info
        try IERC2981(listing.nftContract).royaltyInfo(listing.tokenId, listing.price) returns (
            address receiver,
            uint256 royaltyAmount
        ) {
            if (royaltyAmount > 0 && receiver != address(0)) {
                remainingAmount -= royaltyAmount;
                (bool success, ) = receiver.call{value: royaltyAmount}("");
                require(success, "Royalty transfer failed");
                emit RoyaltyPaid(listing.nftContract, receiver, royaltyAmount);
            }
        } catch {}

        // Transfer platform fee
        (bool platformSuccess, ) = treasury.call{value: platformAmount}("");
        require(platformSuccess, "Platform fee transfer failed");

        // Transfer remaining amount to seller
        (bool sellerSuccess, ) = listing.seller.call{value: remainingAmount}("");
        require(sellerSuccess, "Seller payment failed");

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Update listing
        listing.active = false;

        emit ListingSold(listingId, msg.sender, listing.price);
    }

    // Set treasury address
    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    // Batch list NFTs
    function batchListNFTs(
        address[] calldata nftContracts,
        uint256[] calldata tokenIds,
        uint256[] calldata prices
    ) external whenNotPaused nonReentrant returns (bytes32[] memory) {
        require(
            nftContracts.length == tokenIds.length && 
            tokenIds.length == prices.length,
            "Array lengths must match"
        );

        bytes32[] memory listingIds = new bytes32[](nftContracts.length);

        for (uint256 i = 0; i < nftContracts.length; i++) {
            require(prices[i] > 0, "Price must be greater than 0");
            require(
                IERC721(nftContracts[i]).ownerOf(tokenIds[i]) == msg.sender,
                "Not token owner"
            );
            require(
                IERC721(nftContracts[i]).getApproved(tokenIds[i]) == address(this),
                "Marketplace not approved"
            );

            bytes32 listingId = keccak256(
                abi.encodePacked(
                    nftContracts[i],
                    tokenIds[i],
                    msg.sender,
                    block.timestamp,
                    i
                )
            );

            listings[listingId] = Listing({
                seller: msg.sender,
                nftContract: nftContracts[i],
                tokenId: tokenIds[i],
                price: prices[i],
                active: true
            });

            emit Listed(msg.sender, nftContracts[i], tokenIds[i], listingId, prices[i]);
            listingIds[i] = listingId;
        }

        return listingIds;
    }

    // Batch buy NFTs
    function batchBuyNFTs(bytes32[] calldata listingIds) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        uint256 totalPrice = 0;
        
        // Calculate total price first
        for (uint256 i = 0; i < listingIds.length; i++) {
            Listing storage listing = listings[listingIds[i]];
            require(listing.active, "Listing not active");
            totalPrice += listing.price;
        }
        
        require(msg.value >= totalPrice, "Insufficient payment");

        // Process purchases
        for (uint256 i = 0; i < listingIds.length; i++) {
            Listing storage listing = listings[listingIds[i]];
            
            // Calculate fees
            uint256 platformAmount = (listing.price * platformFee) / 10000;
            uint256 remainingAmount = listing.price - platformAmount;

            // Get royalty info
            try IERC2981(listing.nftContract).royaltyInfo(listing.tokenId, listing.price) returns (
                address receiver,
                uint256 royaltyAmount
            ) {
                if (royaltyAmount > 0 && receiver != address(0)) {
                    remainingAmount -= royaltyAmount;
                    (bool success, ) = receiver.call{value: royaltyAmount}("");
                    require(success, "Royalty transfer failed");
                    emit RoyaltyPaid(listing.nftContract, receiver, royaltyAmount);
                }
            } catch {}

            // Transfer platform fee
            (bool platformSuccess, ) = treasury.call{value: platformAmount}("");
            require(platformSuccess, "Platform fee transfer failed");

            // Transfer remaining amount to seller
            (bool sellerSuccess, ) = listing.seller.call{value: remainingAmount}("");
            require(sellerSuccess, "Seller payment failed");

            // Transfer NFT
            IERC721(listing.nftContract).safeTransferFrom(
                listing.seller,
                msg.sender,
                listing.tokenId
            );

            // Update listing
            listing.active = false;

            emit ListingSold(listingIds[i], msg.sender, listing.price);
        }
    }
} 