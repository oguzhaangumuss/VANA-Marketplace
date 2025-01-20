import fs from 'fs';
import path from 'path';

async function main() {
  const TOTAL_SUPPLY = 20; // config'den alınan supply
  const BASE_IPFS = "ipfs://bafybeibdxmgjkhbh7h5nmkufb2huwhrttti6ygtp77i5rst7h42ifuap2e/images";
  
  for(let i = 0; i < TOTAL_SUPPLY; i++) {
    const metadata = {
      name: `Serica #${i}`,
      image: `${BASE_IPFS}/${i}.png`,
      description: "Main is a nft collection on Vana",
    };

    const filePath = path.join(__dirname, `../frontend/public/collections/nft/metadata/${i}.json`);
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`Generated metadata for token ${i}`);
  }
} 