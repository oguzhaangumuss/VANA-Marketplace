# Deployment & Test Guide

Bu dokümantasyon, NFT Marketplace projesinin deployment ve test süreçlerini detaylı olarak açıklar.

## Gereksinimler

```bash
Node.js >= 16
npm >= 7
```

## Kurulum

```bash
# Repository'yi klonla
git clone <repo_url>

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
```

## Local Development & Testing

### 1. Kontratları Compile Et

```bash
npm run compile
```

### 2. Testleri Çalıştır

```bash
npm run test
```

### 3. Local Deployment

```bash
npm run deploy:local
```

## Testnet Deployment

### 1. Environment Variables

`.env` dosyasında aşağıdaki değişkenleri ayarla:

```
PRIVATE_KEY=your_private_key
VANA_TESTNET_RPC=https://rpc.moksha.vana.org
VANA_API_KEY=your_api_key
```

### 2. Deploy

```bash
npm run deploy:testnet
```

### 3. Verify

```bash
npm run verify
```

### 4. Konfigürasyon

```bash
# Base URI güncelle
NEW_BASE_URI="https://api.vana.org/metadata/" npm run set-base-uri

# Whitelist güncelle
WHITELIST_ADDRESSES="0x123,0x456" npm run set-merkle-root
```

## Mainnet Deployment

### 1. Environment Variables

`.env` dosyasında mainnet değişkenlerini ayarla:

```
PRIVATE_KEY=your_private_key
VANA_MAINNET_RPC=https://rpc.vana.org
VANA_API_KEY=your_api_key
```

### 2. Deploy

```bash
npm run deploy:mainnet
```

### 3. Verify

```bash
npm run verify:mainnet
```

### 4. Frontend Config

```bash
npm run update-frontend
```

## Deployment Bilgileri

Deployment bilgileri `deployments/` dizini altında network bazında JSON dosyalarında saklanır:

- `deployments/vana_testnet.json`
- `deployments/vana_mainnet.json`

## Önemli Komutlar

| Komut                     | Açıklama                            |
| ------------------------- | ----------------------------------- |
| `npm run compile`         | Kontratları compile eder            |
| `npm run test`            | Tüm testleri çalıştırır             |
| `npm run deploy:local`    | Local ağa deploy eder               |
| `npm run deploy:testnet`  | Testnet'e deploy eder               |
| `npm run deploy:mainnet`  | Mainnet'e deploy eder               |
| `npm run verify`          | Kontratları verify eder             |
| `npm run set-base-uri`    | NFT metadata URI'sini günceller     |
| `npm run set-merkle-root` | Whitelist merkle root'unu günceller |

## Güvenlik Kontrolleri

1. Private key'in güvende olduğundan emin ol
2. Mainnet deployment öncesi tüm testlerin başarılı olduğunu kontrol et
3. Gas fiyatlarını kontrol et
4. Yeterli bakiye olduğundan emin ol
5. Deployment sonrası kontratların doğru çalıştığını verify et

## Troubleshooting

### Yaygın Hatalar

1. "Nonce too high" hatası:

   ```bash
   # Metamask/cüzdan nonce'unu resetle
   ```

2. Verification hatası:

   ```bash
   # Doğru network ve API key'i kullandığından emin ol
   ```

3. Gas hatası:
   ```bash
   # Gas limitini ve fiyatını kontrol et
   ```

## İletişim

Sorun veya önerileriniz için:

- GitHub Issues
- Email: support@vana.org
