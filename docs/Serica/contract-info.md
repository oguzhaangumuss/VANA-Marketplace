1 Koleksiyon Temel Bilgileri:
function name() public view returns (string) // Koleksiyon adı
function symbol() public view returns (string) // Koleksiyon sembolü
function supply() public view returns (uint256) // Toplam arz
function mintedCount() public view returns (uint256) // Şu ana kadar mint edilmiş token sayısı
function tokenBaseURI() public view returns (string) // Token metadata URI'si
function hiddenMetadata() public view returns (bool) // Metadata gizli mi?
function placeholderTokenUri() public view returns (string) // Gizli metadata durumunda gösterilecek URI

2 Mint Grupları Bilgileri:
function getAllGroups() external view returns (
string[] memory names, // Grup isimleri
uint256[] memory maxTokens, // Her grup için max token sayısı
uint256[] memory unitPrices, // Her grup için birim fiyat
uint256[] memory startTimes, // Başlangıç zamanları
uint256[] memory endTimes, // Bitiş zamanları
uint256[] memory mintedCounts,// Her grupta mint edilmiş token sayısı
bool[] memory activeStates // Grupların aktif durumu
)

function getActiveGroup() public view returns (string memory, uint256) // Şu an aktif olan grup ve fiyatı

Spesifik Grup Bilgileri:

function getMintGroup(string memory name) external view returns (
bytes32 merkleRoot, // Whitelist merkle root
uint256 maxTokens, // Maksimum token sayısı
uint256 unitPrice, // Birim fiyat
uint256 startTime, // Başlangıç zamanı
uint256 endTime, // Bitiş zamanı
uint256 mintedInGroup, // Grupta mint edilmiş token sayısı
bool isActive // Grup aktif mi?
)

Yaratıcı (Creator) Bilgileri:

function creators(uint256 index) public view returns (
address wallet, // Creator cüzdan adresi
uint256 share // Creator pay yüzdesi (10000 = %100)
)

Royalty Bilgileri:

function royaltyInfo(uint256 tokenId, uint256 salePrice) public view returns (
address receiver, // Royalty alacak adres
uint256 royaltyAmount// Royalty miktarı
)

Whitelist Kontrolü:
function isWhitelisted(
string memory groupName,
address account,
bytes32[] calldata merkleProof
) external view returns (bool) // Adresin whitelist'te olup olmadığı

Durum Kontrolleri:
function paused() public view returns (bool) // Kontrat durdurulmuş mu?

Örnek kullanım:
// Koleksiyon bilgilerini alma
const name = await contract.name();
const supply = await contract.supply();
const minted = await contract.mintedCount();

// Aktif grup bilgisini alma
const [activeGroupName, activeGroupPrice] = await contract.getActiveGroup();

// Tüm grupları alma
const groups = await contract.getAllGroups();

// Royalty bilgisini alma
const [royaltyReceiver, royaltyAmount] = await contract.royaltyInfo(1, ethers.parseEther("1"));
