// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface ISericaNFTCollection {
    event MintGroupAdded(string name, uint256 startTime, uint256 endTime);
    event MintGroupUpdated(string name, uint256 startTime, uint256 endTime);
    event Minted(address indexed to, uint256 indexed tokenId, string groupName);
    event BaseURIChanged(string newBaseURI);
    event MetadataHiddenStateChanged(bool hidden);
    event PlaceholderURIChanged(string newPlaceholderURI);
    event CreatorSharesUpdated(address[] creators, uint256[] shares);
    event RoyaltyUpdated(address wallet, uint256 percentage);
}

contract SericaNFTCollection is 
    Initializable,
    ERC721Upgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    ISericaNFTCollection 
{
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Structs
    struct MintGroup {
        string name;
        bytes32 merkleRoot;
        uint256 maxTokens;
        uint256 unitPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 mintedInGroup;
        bool isActive;
        uint256 mintPerWallet;
    }

    struct Creator {
        address wallet;
        uint256 share;
    }

    // State variables
    uint256 public supply;
    uint256 private _mintedCount;
    bool public iteratedUri;
    string public tokenBaseURI;
    string public placeholderTokenUri;
    bool public hiddenMetadata;
    
    // Mint groups
    MintGroup[] public mintGroups;
    mapping(string => uint256) private groupIndexByName;
    
    // Creators
    Creator[] public creators;
    uint256 private constant SHARE_BASIS = 10000; // 100% = 10000

    // Whitelist tracking
    mapping(string => mapping(address => bool)) private groupMintStatus;

    // Cüzdan başına mint sayısını takip etmek için mapping
    mapping(string => mapping(address => uint256)) private walletMintCount;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        uint256 _supply,
        string memory _tokenUri,
        uint256 _royaltyPercent,
        address _royaltyWallet,
        bool _iteratedUri,
        bool _hiddenMetadata,
        string memory _placeholderTokenUri
    ) public initializer {
        require(_supply > 0, "Invalid supply");
        require(_royaltyPercent <= 100, "Invalid royalty percentage");
        require(_royaltyWallet != address(0), "Invalid royalty wallet");

        __ERC721_init(name, "");
        __ERC2981_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        supply = _supply;
        tokenBaseURI = _tokenUri;
        iteratedUri = _iteratedUri;
        hiddenMetadata = _hiddenMetadata;
        placeholderTokenUri = _placeholderTokenUri;
        _mintedCount = 0;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        _setDefaultRoyalty(_royaltyWallet, uint96(_royaltyPercent * 100));
    }

    // Mint grup yönetimi fonksiyonları
    function addMintGroup(
        string memory name,
        bytes32 merkleRoot,
        uint256 maxTokens,
        uint256 unitPrice,
        uint256 mintPerWallet,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ADMIN_ROLE) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(startTime > block.timestamp, "Start time must be in future");
        require(endTime == 0 || endTime > startTime, "Invalid end time");
        require(groupIndexByName[name] == 0, "Group already exists");
        require(mintPerWallet > 0, "Invalid mint per wallet limit");

        mintGroups.push(MintGroup({
            name: name,
            merkleRoot: merkleRoot,
            maxTokens: maxTokens,
            unitPrice: unitPrice,
            startTime: startTime,
            endTime: endTime,
            mintedInGroup: 0,
            isActive: true,
            mintPerWallet: mintPerWallet
        }));

        groupIndexByName[name] = mintGroups.length;
        emit MintGroupAdded(name, startTime, endTime);
    }

    function updateMintGroup(
        string memory name,
        bytes32 merkleRoot,
        uint256 maxTokens,
        uint256 unitPrice,
        uint256 mintPerWallet,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(ADMIN_ROLE) {
        uint256 index = groupIndexByName[name];
        require(index > 0, "Group does not exist");
        require(startTime > block.timestamp, "Start time must be in future");
        require(endTime == 0 || endTime > startTime, "Invalid end time");
        require(mintPerWallet > 0, "Invalid mint per wallet limit");

        MintGroup storage group = mintGroups[index - 1];
        group.merkleRoot = merkleRoot;
        group.maxTokens = maxTokens;
        group.unitPrice = unitPrice;
        group.startTime = startTime;
        group.endTime = endTime;
        group.mintPerWallet = mintPerWallet;

        emit MintGroupUpdated(name, startTime, endTime);
    }

    // Creator yönetimi
    function setCreators(
        address[] memory _creators,
        uint256[] memory _shares
    ) external onlyRole(ADMIN_ROLE) {
        require(_creators.length == _shares.length, "Arrays length mismatch");
        require(_creators.length > 0, "No creators provided");
        
        uint256 totalShares;
        delete creators;

        for(uint256 i = 0; i < _creators.length; i++) {
            require(_creators[i] != address(0), "Invalid creator address");
            totalShares += _shares[i];
            creators.push(Creator({
                wallet: _creators[i],
                share: _shares[i]
            }));
        }

        require(totalShares == SHARE_BASIS, "Total shares must be 100%");
        emit CreatorSharesUpdated(_creators, _shares);
    }

    // Mint fonksiyonu
    function mint(
        string memory groupName,
        bytes32[] calldata merkleProof
    ) external payable whenNotPaused {
        uint256 groupIndex = groupIndexByName[groupName];
        require(groupIndex > 0, "Group does not exist");
        
        MintGroup storage group = mintGroups[groupIndex - 1];
        require(group.isActive, "Group is not active");
        require(block.timestamp >= group.startTime, "Group sale not started");
        require(group.endTime == 0 || block.timestamp <= group.endTime, "Group sale ended");
        require(msg.value >= group.unitPrice, "Insufficient payment");
        
        // Cüzdan başına limit kontrolü
        require(
            walletMintCount[groupName][msg.sender] < group.mintPerWallet,
            "Wallet mint limit exceeded"
        );
        
        // Whitelist kontrolü
        if (group.merkleRoot != bytes32(0)) {
            require(!groupMintStatus[groupName][msg.sender], "Already minted in this group");
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(MerkleProof.verify(merkleProof, group.merkleRoot, leaf), "Invalid merkle proof");
            groupMintStatus[groupName][msg.sender] = true;
        }

        // Supply kontrolleri
        require(_mintedCount < supply, "Max supply reached");
        if(group.maxTokens > 0) {
            require(group.mintedInGroup < group.maxTokens, "Group max tokens reached");
        }

        // Mint işlemi
        walletMintCount[groupName][msg.sender]++;
        _mintedCount++;
        group.mintedInGroup++;
        _safeMint(msg.sender, _mintedCount);

        // Creator paylarının dağıtımı
        uint256 payment = msg.value;
        for(uint256 i = 0; i < creators.length; i++) {
            uint256 creatorShare = (payment * creators[i].share) / SHARE_BASIS;
            (bool success, ) = creators[i].wallet.call{value: creatorShare}("");
            require(success, "Creator payment failed");
        }

        emit Minted(msg.sender, _mintedCount, groupName);
    }

    // Pause mekanizması
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // Aktif mint grubunu getir
    function getActiveGroup() public view returns (string memory, uint256) {
        for(uint256 i = 0; i < mintGroups.length; i++) {
            if(mintGroups[i].isActive &&
               block.timestamp >= mintGroups[i].startTime &&
               (mintGroups[i].endTime == 0 || block.timestamp <= mintGroups[i].endTime)) {
                return (mintGroups[i].name, mintGroups[i].unitPrice);
            }
        }
        revert("No active group found");
    }

    // Mint edilmiş token sayısını getir
    function mintedCount() public view returns (uint256) {
        return _mintedCount;
    }

    // URI yönetimi
    function setBaseURI(string memory newBaseURI) external onlyRole(ADMIN_ROLE) {
        tokenBaseURI = newBaseURI;
        emit BaseURIChanged(newBaseURI);
    }

    function setHiddenMetadataState(bool state) external onlyRole(ADMIN_ROLE) {
        hiddenMetadata = state;
        emit MetadataHiddenStateChanged(state);
    }

    function setPlaceholderURI(string memory newPlaceholderURI) external onlyRole(ADMIN_ROLE) {
        placeholderTokenUri = newPlaceholderURI;
        emit PlaceholderURIChanged(newPlaceholderURI);
    }

    // Token URI override
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        if (hiddenMetadata) {
            return placeholderTokenUri;
        }

        if (iteratedUri) {
            return string(abi.encodePacked(tokenBaseURI, _toString(tokenId)));
        } else {
            return tokenBaseURI;
        }
    }

    // Yardımcı fonksiyonlar
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

    // Grup bilgilerini getir
    function getMintGroup(string memory name) external view returns (
        bytes32 merkleRoot,
        uint256 maxTokens,
        uint256 unitPrice,
        uint256 startTime,
        uint256 endTime,
        uint256 mintedInGroup,
        bool isActive,
        uint256 mintPerWallet
    ) {
        uint256 index = groupIndexByName[name];
        require(index > 0, "Group does not exist");
        
        MintGroup storage group = mintGroups[index - 1];
        return (
            group.merkleRoot,
            group.maxTokens,
            group.unitPrice,
            group.startTime,
            group.endTime,
            group.mintedInGroup,
            group.isActive,
            group.mintPerWallet
        );
    }

    // Tüm grupları getir
    function getAllGroups() external view returns (
        string[] memory names,
        uint256[] memory maxTokens,
        uint256[] memory unitPrices,
        uint256[] memory startTimes,
        uint256[] memory endTimes,
        uint256[] memory mintedCounts,
        bool[] memory activeStates,
        uint256[] memory mintPerWallets
    ) {
        uint256 length = mintGroups.length;
        
        names = new string[](length);
        maxTokens = new uint256[](length);
        unitPrices = new uint256[](length);
        startTimes = new uint256[](length);
        endTimes = new uint256[](length);
        mintedCounts = new uint256[](length);
        activeStates = new bool[](length);
        mintPerWallets = new uint256[](length);

        for(uint256 i = 0; i < length; i++) {
            MintGroup storage group = mintGroups[i];
            names[i] = group.name;
            maxTokens[i] = group.maxTokens;
            unitPrices[i] = group.unitPrice;
            startTimes[i] = group.startTime;
            endTimes[i] = group.endTime;
            mintedCounts[i] = group.mintedInGroup;
            activeStates[i] = group.isActive;
            mintPerWallets[i] = group.mintPerWallet;
        }
    }

    // Whitelist durumunu kontrol et
    function isWhitelisted(
        string memory groupName,
        address account,
        bytes32[] calldata merkleProof
    ) external view returns (bool) {
        uint256 index = groupIndexByName[groupName];
        require(index > 0, "Group does not exist");
        
        MintGroup storage group = mintGroups[index - 1];
        if (group.merkleRoot == bytes32(0)) return true; // Whitelist yok
        
        bytes32 leaf = keccak256(abi.encodePacked(account));
        return MerkleProof.verify(merkleProof, group.merkleRoot, leaf);
    }

    // Upgrade yetkilendirmesi
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // Interface desteği
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Toplu mint işlemi yapar
     * @param groupName Mint grubu adı
     * @param merkleProof Whitelist kontrolü için merkle proof
     * @param quantity Mint edilecek NFT sayısı
     */
    function batchMint(
        string memory groupName,
        bytes32[] calldata merkleProof,
        uint256 quantity
    ) external payable whenNotPaused {
        require(quantity > 0, "Invalid quantity");
        require(quantity <= 20, "Max 20 NFTs per transaction");
        
        uint256 index = groupIndexByName[groupName];
        require(index > 0, "Group does not exist");
        
        MintGroup storage group = mintGroups[index - 1];
        require(group.isActive, "Group is not active");
        require(block.timestamp >= group.startTime, "Group sale not started");
        require(group.endTime == 0 || block.timestamp <= group.endTime, "Group sale ended");
        
        // Whitelist kontrolü
        if (group.merkleRoot != bytes32(0)) {
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(MerkleProof.verify(merkleProof, group.merkleRoot, leaf), "Invalid merkle proof");
        }
        
        // Cüzdan başına mint limiti kontrolü
        uint256 walletMints = walletMintCount[groupName][msg.sender] + quantity;
        require(walletMints <= group.mintPerWallet, "Wallet mint limit exceeded");
        
        // Grup mint limiti kontrolü
        require(group.mintedInGroup + quantity <= group.maxTokens, "Group limit exceeded");
        
        // Ödeme kontrolü
        require(msg.value >= group.unitPrice * quantity, "Insufficient payment");
        
        // Mint işlemi
        for(uint256 i = 0; i < quantity; i++) {
            _mint(msg.sender, _mintedCount + 1);
            _mintedCount++;
            group.mintedInGroup++;
            emit Minted(msg.sender, _mintedCount, groupName);
        }
        
        // Cüzdan mint sayısını güncelle
        walletMintCount[groupName][msg.sender] = walletMints;
    }
} 