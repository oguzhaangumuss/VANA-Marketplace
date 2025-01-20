# NFT Collection & Marketplace Contract Features

## 1. VanaNFTCollection - Temel Özellikler

- [x] ERC721 temel fonksiyonları
- [x] İsim ve sembol
- [x] Maksimum arz limiti
- [x] Token ID sayacı
- [x] Admin yetkileri
- [x] Mint fonksiyonu (sadece admin)

## 2. VanaNFTCollection - Metadata Yönetimi

- [x] Base URI yönetimi
- [x] Token URI override
- [x] Reveal mekanizması
- [x] Hidden metadata URI

## 3. VanaNFTCollection - Whitelist Sistemi

- [x] Whitelist mapping
- [x] Whitelist yönetimi (admin)
- [x] Merkle tree doğrulaması
- [x] Whitelist mint fonksiyonu

## 4. VanaNFTCollection - Royalty Sistemi

- [x] Royalty fee yapısı
- [x] Royalty alıcısı
- [x] ERC2981 desteği

## 5. VanaMarketplace - Temel Özellikler

- [x] NFT listeleme
- [x] Listeleme iptal
- [x] NFT satın alma
- [x] VANA ile ödeme
- [x] Admin yetkileri

## 6. VanaMarketplace - Gelişmiş Özellikler

- [x] Koleksiyon doğrulama
- [x] Royalty dağıtımı
- [x] Acil durum fonksiyonları (pause/unpause)
- [x] Toplu işlem fonksiyonları

## Test Senaryoları

Her özellik grubu için:

1. Temel fonksiyon testleri
2. Yetkilendirme testleri
3. Edge case testleri
4. Entegrasyon testleri

## Güvenlik Kontrolleri

Her aşamada:

1. Reentrancy koruması
2. Integer overflow/underflow kontrolleri
3. Yetkilendirme kontrolleri
4. Gas optimizasyonu

Kontrat fonksiyonları:
// Read Functions

- name() // Koleksiyon adı
- symbol() // Koleksiyon sembolü
- maxSupply() // Maksimum NFT sayısı
- balanceOf() // Mint edilmiş NFT sayısı
- baseTokenURI() // Metadata base URI
- revealed() // Reveal durumu
- ownerOf(tokenId)
