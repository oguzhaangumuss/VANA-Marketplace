# Deployment Guide

## Prerequisites

1. Environment variables in `.env`:

env
PRIVATE_KEY=your_private_key
VANA_TESTNET_RPC=https://rpc.moksha.vana.org
ETHERSCAN_API_KEY=your_api_key

## Deployment Steps

1. **Prepare Configuration**

   ```bash
   # Config dosyasını kontrol et
   cp config/serica-config.example.json config/serica-config.json
   # Gerekli değerleri düzenle
   ```

2. **Deploy Contract**

   ```bash
   # Testnet'e deploy
   npx hardhat run scripts/deploy-serica.ts --network vana_testnet

   # Mainnet'e deploy
   npx hardhat run scripts/deploy-serica.ts --network vana_mainnet
   ```

3. **Verify Contract**
   ```bash
   # Deploy çıktısındaki proxy adresini scripts/verify-serica.ts'e ekle
   # Sonra verify komutunu çalıştır
   npx hardhat run scripts/verify-serica.ts --network vana_testnet
   ```

## Post-Deployment Steps

1. **Check Deployment**

   - Proxy address
   - Implementation address
   - Admin rights
   - Mint groups

2. **Test Functionality**

   - Mint test
   - Group settings
   - Creator payments

3. **Frontend Integration**
   - Update contract addresses
   - Test interactions
