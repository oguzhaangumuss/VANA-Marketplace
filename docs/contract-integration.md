# Kontrat Entegrasyonu ve Veri Çekme Rehberi

## 1. Kontrat Bağlantısı

### 1.1 ABI ve Adres Konfigürasyonu

```typescript
// config/contracts.ts
export const CONTRACTS = {
  testnet: {
    nftCollection: "0xf52E89335b8d5F979E267a6cfEbfd4406aE5928a",
    chainId: 14800,
    // ...diğer konfigürasyonlar
  },
};

// ABI'yi artifacts'dan import et
import NFTArtifact from "../abi/VanaNFTCollection.json";
export const NFT_ABI = NFTArtifact.abi;
```

### 1.2 Kontrat Hook'u

```typescript
// hooks/useNFTContract.ts
export function useNFTContract() {
  const { isConnected } = useWeb3();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const nftContract = new ethers.Contract(
      CONTRACTS.testnet.nftCollection,
      NFT_ABI,
      provider
    );
    setContract(nftContract);
  }, [isConnected]);

  return { contract };
}
```

## 2. Veri Çekme

### 2.1 Mevcut Fonksiyonlar

```typescript
// Kontrat fonksiyonlarını listele
const functions = contract.interface.fragments
  .filter(
    (fragment): fragment is ethers.FunctionFragment =>
      fragment.type === "function"
  )
  .map((fragment) => fragment.name);

// Mevcut fonksiyonlar:
-name() - symbol() - balanceOf(address) - maxSupply() - tokenURI(uint256);
// ...ve diğerleri
```

### 2.2 Örnek Veri Çekme

```typescript
// Temel bilgiler
const name = await contract.name();
const symbol = await contract.symbol();

// Supply bilgileri
const totalMinted = await contract.balanceOf(contract.target);
const maxSupply = await contract.maxSupply();

// BigInt'ten number'a çevirme
const totalMintedNumber = Number(totalMinted);
const maxSupplyNumber = Number(maxSupply);
```

## 3. Eksiklikler ve İyileştirmeler

### 3.1 Eksik Fonksiyonlar

- `mintPrice()`: Mint fiyatı için özel fonksiyon yok
- `totalSupply()`: Toplam mint sayısı için direkt fonksiyon yok
- `isRevealed()`: Koleksiyonun reveal durumu için getter yok

### 3.2 İyileştirme Önerileri

1. **Mint Fiyatı:**

```solidity
function mintPrice() public view returns (uint256) {
    return _mintPrice;
}
```

2. **Toplam Supply:**

```solidity
function totalSupply() public view returns (uint256) {
    return _nextTokenId() - 1;
}
```

3. **Reveal Durumu:**

```solidity
function isRevealed() public view returns (bool) {
    return _revealed;
}
```

## 4. Best Practices

### 4.1 Veri Çekme

- Her fonksiyonu try-catch bloğunda çağır
- BigInt değerleri number'a çevirirken kontrol et
- Loading ve error state'lerini yönet

### 4.2 Performans

```typescript
// Kötü: Her veriyi ayrı ayrı çekme
const name = await contract.name();
const symbol = await contract.symbol();

// İyi: Promise.all ile paralel çekme
const [name, symbol] = await Promise.all([contract.name(), contract.symbol()]);
```

### 4.3 Error Handling

```typescript
try {
  const data = await contract.someFunction();
} catch (err) {
  if (err.code === "CALL_EXCEPTION") {
    console.error("Contract call failed");
  } else if (err.code === "NETWORK_ERROR") {
    console.error("Network error");
  }
}
```

## 5. Güvenlik

### 5.1 Kontrat Doğrulama

- Kontrat adresinin doğru olduğundan emin ol
- ABI'nin güncel olduğunu kontrol et
- Testnet/Mainnet ayırımını yap

### 5.2 Veri Validasyonu

- Null/undefined kontrolü yap
- BigInt değerleri güvenli şekilde dönüştür
- Beklenmeyen veri tiplerini handle et
