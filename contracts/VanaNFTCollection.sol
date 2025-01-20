// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// Events
interface IVanaNFTCollection {
    event Minted(address indexed to, uint256 indexed tokenId);
    event BaseURIChanged(string newBaseURI);
    event Revealed(uint256 timestamp);
    event HiddenMetadataUriChanged(string newHiddenMetadataUri);
    event MerkleRootChanged(bytes32 newMerkleRoot);
    event WhitelistMinted(address indexed to, uint256 indexed tokenId);
    event RoyaltyInfoUpdated(address indexed receiver, uint96 feeNumerator);
}

contract VanaNFTCollection is 
    Initializable,
    ERC721Upgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    IVanaNFTCollection 
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // State variables
    uint256 public maxSupply;
    CountersUpgradeable.Counter private _tokenIds;
    string public baseTokenURI;
    uint256 private _mintPrice;

    // Metadata variables
    bool public revealed;
    string public hiddenMetadataUri;

    // Whitelist variables
    bytes32 public merkleRoot;
    mapping(address => bool) public whitelistMinted;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        string memory _baseTokenURI,
        string memory _hiddenMetadataUri,
        bytes32 _merkleRoot,
        address _royaltyReceiver,
        uint96 _royaltyFeeNumerator,
        uint256 mintPrice_
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC2981_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        maxSupply = _maxSupply;
        baseTokenURI = _baseTokenURI;
        hiddenMetadataUri = _hiddenMetadataUri;
        merkleRoot = _merkleRoot;
        _mintPrice = mintPrice_;
        revealed = false;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Set royalty
        _setDefaultRoyalty(_royaltyReceiver, _royaltyFeeNumerator);
    }

    // Mint function - only minter
    function mint(address to) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(_tokenIds.current() < maxSupply, "Max supply reached");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(to, newTokenId);
        
        emit Minted(to, newTokenId);
        return newTokenId;
    }

    // Base URI management - only admin
    function setBaseURI(string memory newBaseURI) external onlyRole(ADMIN_ROLE) {
        baseTokenURI = newBaseURI;
        emit BaseURIChanged(newBaseURI);
    }

    // Override base URI
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    // Reveal collection - only admin
    function reveal() external onlyRole(ADMIN_ROLE) {
        require(!revealed, "Collection already revealed");
        revealed = true;
        emit Revealed(block.timestamp);
    }

    // Set hidden metadata URI - only admin
    function setHiddenMetadataUri(string memory _hiddenMetadataUri) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        hiddenMetadataUri = _hiddenMetadataUri;
        emit HiddenMetadataUriChanged(_hiddenMetadataUri);
    }

    // Override tokenURI function
    function tokenURI(uint256 tokenId) 
        public 
        view 
        virtual 
        override 
        returns (string memory) 
    {
        require(_exists(tokenId), "Token does not exist");

        if (!revealed) {
            return hiddenMetadataUri;
        }

        return string(abi.encodePacked(baseTokenURI, _toString(tokenId)));
    }

    // Helper function to convert uint256 to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Set merkle root - only admin
    function setMerkleRoot(bytes32 _merkleRoot) external onlyRole(ADMIN_ROLE) {
        merkleRoot = _merkleRoot;
        emit MerkleRootChanged(_merkleRoot);
    }

    // Whitelist mint function
    function whitelistMint(bytes32[] calldata _merkleProof) external {
        require(merkleRoot != bytes32(0), "Whitelist not enabled");
        require(!whitelistMinted[msg.sender], "Address already minted");
        
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid merkle proof"
        );

        // Mark as minted
        whitelistMinted[msg.sender] = true;

        // Mint NFT
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        
        emit WhitelistMinted(msg.sender, newTokenId);
    }

    // Set royalty info - only admin
    function setRoyaltyInfo(
        address receiver,
        uint96 feeNumerator
    ) external onlyRole(ADMIN_ROLE) {
        _setDefaultRoyalty(receiver, feeNumerator);
        emit RoyaltyInfoUpdated(receiver, feeNumerator);
    }

    // Override supportsInterface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Yeni getter fonksiyonları
    function mintPrice() public view returns (uint256) {
        return _mintPrice;
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
    
    function isRevealed() public view returns (bool) {
        return revealed;
    }

    // Upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}