# NFT Kontrat Entegrasyonu - Sorunlar ve Çözümler

## 1. Mint Sayısı Görüntüleme Sorunu

### Sorun

Kontrat üzerinde mint edilen NFT sayısını `balanceOf` fonksiyonu ile almaya çalıştığımızda hatalı sonuç alıyorduk.

### Nedeni

`balanceOf(address)` fonksiyonu bir adresin sahip olduğu token sayısını verir, toplam mint edilmiş token sayısını değil.

### Çözüm

Her token ID'sini `ownerOf` ile kontrol ederek toplam mint sayısını bulduk:

```typescript
let totalMinted = 0;
for (let i = 1; i <= Number(maxSupply); i++) {
  try {
    const exists = await contract.ownerOf(i);
    if (exists) totalMinted = i;
  } catch {
    break;
  }
}
```

## 2. Kontrat Bağlantı Sorunları

### Sorun

Sayfa yüklendiğinde kontrat verilerini göremiyorduk, sadece cüzdan bağlandığında veriler geliyordu.

### Nedeni

`useNFTContract` hook'unda kontrat bağlantısını `isConnected` state'ine bağlamıştık.

### Çözüm

İki farklı kontrat instance'ı oluşturduk:

- Read-only işlemler için provider ile bağlantı
- Write işlemleri için signer ile bağlantı

## 3. Mint İşlemi Hataları

### Sorun

"Contract runner does not support sending transactions" hatası alıyorduk.

### Nedeni

Kontrat instance'ı provider ile oluşturulmuştu, signer ile değil.

### Çözüm

Write işlemleri için ayrı bir signer kontrat instance'ı oluşturduk:

```typescript
const walletProvider = new ethers.BrowserProvider(window.ethereum);
const signer = await walletProvider.getSigner();
const writeContract = new ethers.Contract(address, ABI, signer);
```

## 4. NFT Görüntüleme Sorunları

### Sorun

Mint edilen NFT'ler cüzdanda görüntülenemiyordu.

### Nedeni

- Kontrat `revealed` durumu false
- Metadata URL'leri tam path içermiyordu

### Çözüm

- Metadata formatını düzeltme
- Reveal fonksiyonunu çağırma (admin tarafından)

## 5. Event Tanımlama Hataları

### Sorun

Kontrat derleme hatası: "Undeclared identifier"

### Nedeni

Event tanımlamaları eksikti.

### Çözüm

Interface ile event tanımlamalarını ekledik:

```solidity
interface IVanaNFTCollection {
    event Minted(address indexed to, uint256 indexed tokenId);
    // ... diğer event'ler
}
```

## 6. Kontrat Boyut Sorunu

### Sorun

"Contract code size exceeds 24576 bytes"

### Nedeni

Kontrat boyutu Ethereum limitini aşıyordu.

### Çözüm

Hardhat config'de optimizer ayarlarını aktifleştirdik:

```typescript
solidity: {
    version: "0.8.20",
    settings: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    }
}
```

## Best Practices & Öneriler

1. **Veri Çekme:**

   - Read işlemleri için provider kullan
   - Write işlemleri için signer kullan
   - Paralel veri çekme için Promise.all kullan

2. **Error Handling:**

   - Her async işlem için try-catch kullan
   - Kullanıcıya anlamlı hata mesajları göster
   - Debug için console.log'ları stratejik noktalara koy

3. **State Yönetimi:**
   - Loading state'lerini doğru yönet
   - UI'da loading durumlarını göster
   - Veri güncellemelerini optimistik yap
